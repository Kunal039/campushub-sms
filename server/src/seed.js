// Fills the database with an admin user, courses and sample students.
// Usage: npm run seed   (WARNING: replaces all existing students and courses)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Student from './models/Student.js';

const courses = [
  { code: 'BE-CSE', title: 'B.E. Computer Science & Engineering', department: 'Engineering', durationYears: 4 },
  { code: 'BE-IT', title: 'B.E. Information Technology', department: 'Engineering', durationYears: 4 },
  { code: 'BCA', title: 'Bachelor of Computer Applications', department: 'Computing', durationYears: 3 },
  { code: 'MCA', title: 'Master of Computer Applications', department: 'Computing', durationYears: 2 },
  { code: 'BBA', title: 'Bachelor of Business Administration', department: 'Management', durationYears: 3 },
  { code: 'BSC-DS', title: 'B.Sc. Data Science', department: 'Sciences', durationYears: 3 },
];

const names = [
  'Aarav Sharma', 'Diya Patel', 'Vivaan Gupta', 'Ananya Singh', 'Kabir Mehta', 'Ishita Verma',
  'Arjun Nair', 'Saanvi Reddy', 'Rohan Kapoor', 'Meera Iyer', 'Aditya Joshi', 'Kavya Bansal',
  'Yash Malhotra', 'Riya Chatterjee', 'Dev Khanna', 'Tanvi Desai', 'Nikhil Rao', 'Pooja Saxena',
  'Siddharth Bose', 'Neha Agarwal', 'Karan Sethi', 'Simran Kaur', 'Manav Arora', 'Aditi Kulkarni',
  'Harsh Vardhan', 'Sneha Pillai', 'Rahul Dubey', 'Nisha Thakur',
];

try {
  await connectDB();

  const { SEED_ADMIN_NAME = 'Admin', SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  if (SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD) {
    await User.deleteOne({ email: SEED_ADMIN_EMAIL.toLowerCase() });
    await User.create({ name: SEED_ADMIN_NAME, email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin user ready: ${SEED_ADMIN_EMAIL} (password = SEED_ADMIN_PASSWORD in server/.env)`);
  } else {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set - skipping admin user');
  }

  await Promise.all([Student.deleteMany(), Course.deleteMany()]);
  const savedCourses = await Course.insertMany(courses);

  const students = names.map((name, i) => {
    const course = savedCourses[i % savedCourses.length];
    const maxSem = course.durationYears * 2;
    const status = i % 11 === 10 ? 'dropped' : i % 7 === 6 ? 'graduated' : 'active';
    return {
      name,
      rollNo: `24${course.code.replace(/[^A-Z]/g, '').slice(-3)}${1001 + i}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@enrolla.test`,
      age: 18 + (i % 6),
      course: course._id,
      semester: status === 'graduated' ? maxSem : 1 + (i % maxSem),
      cgpa: Number((6 + ((i * 37) % 39) / 10).toFixed(1)),
      status,
      createdAt: new Date(Date.now() - (names.length - i) * 86400000),
    };
  });
  await Student.insertMany(students);

  console.log(`Seeded ${savedCourses.length} courses and ${students.length} students`);
} catch (err) {
  console.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
