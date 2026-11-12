import { Router } from 'express';
import Student from '../models/Student.js';
import Course from '../models/Course.js';

const router = Router();

// GET /api/stats - numbers for the dashboard
router.get('/', async (_req, res) => {
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

export default router;
