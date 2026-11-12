import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner, { ErrorState } from '../components/Spinner.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import Field from '../components/Field.jsx';

const DEPARTMENTS = ['Engineering', 'Computing', 'Management', 'Sciences', 'Arts'];

function CourseForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial || { code: '', title: '', department: 'Engineering', durationYears: 4 });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!values.code.trim()) found.code = 'Course code is required';
    if (values.title.trim().length < 3) found.title = 'Title must be at least 3 characters';
    const years = Number(values.durationYears);
    if (!Number.isInteger(years) || years < 1 || years > 6) found.durationYears = 'Duration must be 1 to 6 years';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({
        code: values.code.trim(),
        title: values.title.trim(),
        department: values.department,
        durationYears: years,
      });
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors && Object.keys(err.errors).length ? '' : err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert-error">{formError}</div>}
      <div className="form-grid">
        <Field label="Code" error={errors.code}>
          <input value={values.code} onChange={set('code')} placeholder="e.g. BE-CSE" autoFocus />
        </Field>
        <Field label="Duration (years)" error={errors.durationYears}>
          <input type="number" min="1" max="6" value={values.durationYears} onChange={set('durationYears')} />
        </Field>
        <Field label="Title" error={errors.title}>
          <input value={values.title} onChange={set('title')} placeholder="e.g. B.E. Computer Science" />
        </Field>
        <Field label="Department" error={errors.department}>
          <select value={values.department} onChange={set('department')}>
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add course'}
        </button>
      </div>
    </form>
  );
}

export default function Courses() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null); // null | 'new' | course
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api('/courses', { signal: controller.signal })
      .then((res) => setCourses(res.data))
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => controller.abort();
  }, [reloadKey]);

  const handleSave = async (values) => {
    if (editing === 'new') {
      await api('/courses', { method: 'POST', body: values });
      toast.success(`${values.code.toUpperCase()} was added`);
    } else {
      await api(`/courses/${editing._id}`, { method: 'PUT', body: values });
      toast.success(`${values.code.toUpperCase()} was updated`);
    }
    setEditing(null);
    reload();
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await api(`/courses/${deleting._id}`, { method: 'DELETE' });
      toast.success(`${deleting.code} was removed`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
      reload();
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Courses</h1>
          <p className="muted">
            {isAdmin ? 'Manage the course catalogue.' : 'Course catalogue (only admins can make changes).'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add course
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !courses ? (
        <Spinner label="Loading courses…" />
      ) : courses.length === 0 ? (
        <div className="state-box">
          <p>{isAdmin ? 'No courses yet. Add the first one to start enrolling students.' : 'No courses have been added yet.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {courses.map((c) => (
            <article key={c._id} className="card course-card">
              <div className="course-card-top">
                <span className="course-code">{c.code}</span>
                <span className="muted small">{c.durationYears} yr</span>
              </div>
              <h3>{c.title}</h3>
              <p className="muted small">{c.department}</p>
              <div className="course-card-foot">
                <span>
                  <strong>{c.studentCount}</strong> student{c.studentCount === 1 ? '' : 's'}
                </span>
                {isAdmin && (
                  <span className="nowrap">
                    <button className="btn btn-sm" onClick={() => setEditing(c)}>
                      Edit
                    </button>{' '}
                    <button
                      className="btn btn-sm btn-danger-ghost"
                      onClick={() => setDeleting(c)}
                      disabled={c.studentCount > 0}
                      title={c.studentCount > 0 ? 'Courses with enrolled students cannot be deleted' : undefined}
                    >
                      Delete
                    </button>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add course' : `Edit ${editing.code}`} onClose={() => setEditing(null)}>
          <CourseForm
            initial={editing === 'new' ? null : editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete course"
          message={`Remove ${deleting.code} — ${deleting.title}? This cannot be undone.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onClose={() => !deleteBusy && setDeleting(null)}
        />
      )}
    </>
  );
}
