import { Router } from 'express';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import { authorize } from '../middleware/auth.js';
import { requireFields, validateObjectId } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

const pick = ({ code, title, department, durationYears } = {}) =>
  Object.fromEntries(Object.entries({ code, title, department, durationYears }).filter(([, v]) => v !== undefined));

// GET /api/courses - every course with its enrolled-student count
router.get('/', async (_req, res) => {
  const [courses, counts] = await Promise.all([
    Course.find().sort('code').lean(),
    Student.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ success: true, data: courses.map((c) => ({ ...c, studentCount: byId.get(String(c._id)) || 0 })) });
});

// Only admins may change the course catalogue
router.post('/', authorize('admin'), requireFields('code', 'title', 'department'), async (req, res) => {
  const course = await Course.create(pick(req.body));
  res.status(201).json({ success: true, data: course });
});

router.put('/:id', authorize('admin'), validateObjectId(), async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ success: true, data: course });
});

router.delete('/:id', authorize('admin'), validateObjectId(), async (req, res) => {
  const enrolled = await Student.countDocuments({ course: req.params.id });
  if (enrolled) throw new ApiError(409, `Cannot delete: ${enrolled} student(s) are enrolled in this course`);
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ success: true, message: `${course.code} was removed` });
});

export default router;
