import { Router } from 'express';
import mongoose from 'mongoose';
import { User, Student, Course } from './models.js';
import { ApiError, requireFields, validateObjectId, signToken, verifyToken, authorize } from './middleware.js';

// ---------- Auth: /api/auth ----------
export const authRouter = Router();

// POST /api/auth/register - hash password (model hook), store user, return JWT
authRouter.post('/register', requireFields('name', 'email', 'password'), async (req, res) => {
  const { name, email, password } = req.body;
  // role is never taken from the request: new accounts are always "staff"
  const user = await User.create({ name, email, password: String(password) });
  res.status(201).json({ success: true, token: signToken(user), user });
});

// POST /api/auth/login - verify password, return JWT
authRouter.post('/login', requireFields('email', 'password'), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({ success: true, token: signToken(user), user });
});

// GET /api/auth/profile - only for authenticated requests
authRouter.get('/profile', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ---------- Students: /api/students ----------
export const studentRouter = Router();

const SORTABLE = ['name', 'age', 'cgpa', 'rollNo', 'semester', 'createdAt'];
const EDITABLE = ['name', 'rollNo', 'email', 'age', 'course', 'semester', 'cgpa', 'status'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pickStudent = (body) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

async function assertCourseExists(id) {
  if (!mongoose.isValidObjectId(id) || !(await Course.exists({ _id: id }))) {
    throw new ApiError(400, 'Validation failed', { course: 'Selected course does not exist' });
  }
}

// GET /api/students?search=&course=&status=&sort=-cgpa&page=1&limit=8
studentRouter.get('/', async (req, res) => {
  const { search = '', course, status, sort = '-createdAt' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 100);

  const filter = {};
  if (String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i'); // search using regex
    filter.$or = [{ name: rx }, { rollNo: rx }, { email: rx }];
  }
  if (course && mongoose.isValidObjectId(course)) filter.course = course; // filter by course
  if (['active', 'graduated', 'dropped'].includes(status)) filter.status = status;

  const field = String(sort).replace(/^-/, '');
  const sortBy = SORTABLE.includes(field)
    ? { [field]: String(sort).startsWith('-') ? -1 : 1, _id: 1 }
    : { createdAt: -1, _id: 1 };

  const [data, total] = await Promise.all([
    Student.find(filter)
      .populate('course', 'code title department')
      .sort(sortBy)
      .skip((page - 1) * limit) // pagination
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/students/:id
studentRouter.get('/:id', validateObjectId(), async (req, res) => {
  const student = await Student.findById(req.params.id).populate('course');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

// POST /api/students
studentRouter.post('/', requireFields('name', 'rollNo', 'email', 'age', 'course'), async (req, res) => {
  await assertCourseExists(req.body.course);
  const student = await Student.create(pickStudent(req.body));
  await student.populate('course', 'code title department');
  res.status(201).json({ success: true, data: student });
});

// PUT /api/students/:id
studentRouter.put('/:id', validateObjectId(), async (req, res) => {
  const changes = pickStudent(req.body || {});
  if (changes.course !== undefined) await assertCourseExists(changes.course);
  const student = await Student.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  }).populate('course', 'code title department');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

// DELETE /api/students/:id
studentRouter.delete('/:id', validateObjectId(), async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: `${student.name} was removed` });
});

// ---------- Courses: /api/courses ----------
export const courseRouter = Router();

const pickCourse = ({ code, title, department, durationYears } = {}) =>
  Object.fromEntries(Object.entries({ code, title, department, durationYears }).filter(([, v]) => v !== undefined));

// GET /api/courses - every course with its enrolled-student count
courseRouter.get('/', async (_req, res) => {
  const [courses, counts] = await Promise.all([
    Course.find().sort('code').lean(),
    Student.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ success: true, data: courses.map((c) => ({ ...c, studentCount: byId.get(String(c._id)) || 0 })) });
});

// Only admins may change the course catalogue
courseRouter.post('/', authorize('admin'), requireFields('code', 'title', 'department'), async (req, res) => {
  const course = await Course.create(pickCourse(req.body));
  res.status(201).json({ success: true, data: course });
});

courseRouter.put('/:id', authorize('admin'), validateObjectId(), async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, pickCourse(req.body), { new: true, runValidators: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ success: true, data: course });
});

courseRouter.delete('/:id', authorize('admin'), validateObjectId(), async (req, res) => {
  const enrolled = await Student.countDocuments({ course: req.params.id });
  if (enrolled) throw new ApiError(409, `Cannot delete: ${enrolled} student(s) are enrolled in this course`);
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ success: true, message: `${course.code} was removed` });
});

// ---------- Dashboard stats: /api/stats ----------
export const statsRouter = Router();

// GET /api/stats - numbers for the dashboard
statsRouter.get('/', async (_req, res) => {
  const [totalStudents, totalCourses, byStatus, byCourse, avg, recent, toppers] = await Promise.all([
    Student.countDocuments(),
    Course.countDocuments(),
    Student.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Student.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 }, avgCgpa: { $avg: '$cgpa' } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { _id: 0, code: '$course.code', title: '$course.title', count: 1, avgCgpa: { $round: ['$avgCgpa', 2] } } },
      { $sort: { count: -1, code: 1 } },
    ]),
    Student.aggregate([{ $group: { _id: null, avgCgpa: { $avg: '$cgpa' }, avgAge: { $avg: '$age' } } }]),
    Student.find().sort('-createdAt').limit(5).populate('course', 'code'),
    Student.find({ status: 'active' }).sort('-cgpa name').limit(5).populate('course', 'code'),
  ]);

  const status = { active: 0, graduated: 0, dropped: 0 };
  byStatus.forEach((s) => {
    status[s._id] = s.count;
  });

  res.json({
    success: true,
    data: {
      totalStudents,
      totalCourses,
      status,
      byCourse,
      avgCgpa: avg[0] ? Number(avg[0].avgCgpa.toFixed(2)) : 0,
      avgAge: avg[0] ? Number(avg[0].avgAge.toFixed(1)) : 0,
      recent,
      toppers,
    },
  });
});
