import { useState } from 'react';
import { Field } from './ui.jsx';

const EMPTY = { name: '', rollNo: '', email: '', age: '', course: '', semester: 1, cgpa: '', status: 'active' };

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 3) errors.name = 'Name must be at least 3 characters';
  if (!v.rollNo.trim()) errors.rollNo = 'Roll number is required';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = 'Enter a valid email address';
  const age = Number(v.age);
  if (v.age === '' || !Number.isInteger(age) || age < 16 || age > 60) errors.age = 'Age must be a whole number from 16 to 60';
  if (!v.course) errors.course = 'Select a course';
  const sem = Number(v.semester);
  if (!Number.isInteger(sem) || sem < 1 || sem > 12) errors.semester = 'Semester must be from 1 to 12';
  if (v.cgpa !== '' && (Number.isNaN(Number(v.cgpa)) || Number(v.cgpa) < 0 || Number(v.cgpa) > 10)) {
    errors.cgpa = 'CGPA must be between 0 and 10';
  }
  return errors;
}

/**
 * Controlled form used for both "add" and "edit".
 * onSubmit(values) must return a promise; if it rejects with { errors }, they are shown next to the fields.
 */
export default function StudentForm({ initial, courses, onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    initial
      ? { ...EMPTY, ...initial, course: initial.course?._id || initial.course || '', cgpa: initial.cgpa ?? '' }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        rollNo: values.rollNo.trim(),
        email: values.email.trim(),
        age: Number(values.age),
        course: values.course,
        semester: Number(values.semester),
        cgpa: values.cgpa === '' ? 0 : Number(values.cgpa),
        status: values.status,
      });
    } catch (err) {
      // Server-side validation (e.g. duplicate email) comes back per field
      setErrors(err.errors || {});
      setFormError(err.errors && Object.keys(err.errors).length ? '' : err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert-error">{formError}</div>}
      <div className="form-grid">
        <Field label="Full name" error={errors.name}>
          <input value={values.name} onChange={set('name')} placeholder="e.g. Aarav Sharma" autoFocus />
        </Field>
        <Field label="Roll number" error={errors.rollNo}>
          <input value={values.rollNo} onChange={set('rollNo')} placeholder="e.g. 24CSE1001" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={values.email} onChange={set('email')} placeholder="name@example.com" />
        </Field>
        <Field label="Age" error={errors.age}>
          <input type="number" min="16" max="60" value={values.age} onChange={set('age')} />
        </Field>
        <Field label="Course" error={errors.course}>
          <select value={values.course} onChange={set('course')}>
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semester" error={errors.semester}>
          <input type="number" min="1" max="12" value={values.semester} onChange={set('semester')} />
        </Field>
        <Field label="CGPA (0–10)" error={errors.cgpa}>
          <input type="number" step="0.1" min="0" max="10" value={values.cgpa} onChange={set('cgpa')} />
        </Field>
        <Field label="Status" error={errors.status}>
          <select value={values.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="dropped">Dropped</option>
          </select>
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add student'}
        </button>
      </div>
    </form>
  );
}
