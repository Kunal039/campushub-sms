import { Router } from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import { requireFields, validateObjectId } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

const SORTABLE = ['name', 'age', 'cgpa', 'rollNo', 'semester', 'createdAt'];
const EDITABLE = ['name', 'rollNo', 'email', 'age', 'course', 'semester', 'cgpa', 'status'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (body) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

async function assertCourseExists(id) {
  if (!mongoose.isValidObjectId(id) || !(await Course.exists({ _id: id }))) {
    throw new ApiError(400, 'Validation failed', { course: 'Selected course does not exist' });
  }
}

// GET /api/students?search=&course=&status=&sort=-cgpa&page=1&limit=8
router.get('/', async (req, res) => {
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
router.get('/:id', validateObjectId(), async (req, res) => {
  const student = await Student.findById(req.params.id).populate('course');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

// POST /api/students
router.post('/', requireFields('name', 'rollNo', 'email', 'age', 'course'), async (req, res) => {
  await assertCourseExists(req.body.course);
  const student = await Student.create(pick(req.body));
  await student.populate('course', 'code title department');
  res.status(201).json({ success: true, data: student });
});

// PUT /api/students/:id
router.put('/:id', validateObjectId(), async (req, res) => {
  const changes = pick(req.body || {});
  if (changes.course !== undefined) await assertCourseExists(changes.course);
  const student = await Student.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  }).populate('course', 'code title department');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

// DELETE /api/students/:id
router.delete('/:id', validateObjectId(), async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: `${student.name} was removed` });
});

export default router;
