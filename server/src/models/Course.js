import mongoose from 'mongoose';

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

export default mongoose.model('Course', courseSchema);
