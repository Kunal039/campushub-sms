import mongoose from 'mongoose';

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

export default mongoose.model('Student', studentSchema);
