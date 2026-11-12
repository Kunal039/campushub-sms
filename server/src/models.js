import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ---------- Database connection ----------
export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

// ---------- User ----------
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    // select:false keeps the hash out of every query unless explicitly requested
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  },
  { timestamps: true }
);

// Hash the password with bcrypt whenever it is set or changed
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);

// ---------- Course ----------
export const DEPARTMENTS = ['Engineering', 'Computing', 'Management', 'Sciences', 'Arts'];

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: [true, 'Course code is required'], unique: true, uppercase: true, trim: true },
    title: { type: String, required: [true, 'Course title is required'], trim: true, minlength: [3, 'Title is too short'] },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: { values: DEPARTMENTS, message: '{VALUE} is not a valid department' },
    },
    durationYears: { type: Number, min: 1, max: 6, default: 4 },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);

// ---------- Student ----------
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
    },
    rollNo: { type: String, required: [true, 'Roll number is required'], unique: true, uppercase: true, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [16, 'Age must be at least 16'],
      max: [60, 'Age must be at most 60'],
    },
    // Reference to the Course model - resolved with .populate('course')
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course is required'] },
    semester: { type: Number, min: [1, 'Semester must be at least 1'], max: [12, 'Semester must be at most 12'], default: 1 },
    cgpa: { type: Number, min: [0, 'CGPA cannot be negative'], max: [10, 'CGPA cannot exceed 10'], default: 0 },
    status: {
      type: String,
      enum: { values: ['active', 'graduated', 'dropped'], message: '{VALUE} is not a valid status' },
      default: 'active',
    },
  },
  { timestamps: true }
);

studentSchema.index({ name: 1 });

export const Student = mongoose.model('Student', studentSchema);
