import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../context.jsx';
import { Spinner, ErrorState } from '../components/ui.jsx';
import { Modal, ConfirmDialog } from '../components/ui.jsx';
import StudentForm from '../components/StudentForm.jsx';
import { StatusBadge, gradeOf } from '../components/StudentCard.jsx';

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function StudentDetail() {
  const { id } = useParams(); // route param from /students/:id
  const navigate = useNavigate();
  const toast = useToast();

  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setStudent(null);
    setError(null);
    api(`/students/${id}`, { signal: controller.signal })
      .then((res) => setStudent(res.data))
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => controller.abort();
  }, [id]);

  const openEdit = async () => {
    setEditing(true);
    if (!courses.length) {
      try {
        setCourses((await api('/courses')).data);
      } catch (err) {
        toast.error(err.message);
        setEditing(false);
      }
    }
  };

  const handleSave = async (values) => {
    await api(`/students/${id}`, { method: 'PUT', body: values });
    // Re-read so the populated course details are fresh
    setStudent((await api(`/students/${id}`)).data);
    setEditing(false);
    toast.success('Changes saved');
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await api(`/students/${id}`, { method: 'DELETE' });
      toast.success(`${student.name} was removed`);
      navigate('/students', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleteBusy(false);
    }
  };

  if (error) {
    const missing = error.status === 404 || error.status === 400;
    return (
      <>
        <Link to="/students" className="back-link">
          ← All students
        </Link>
        <ErrorState message={missing ? 'This student does not exist. They may have been deleted.' : error.message} />
      </>
    );
  }
  if (!student) return <Spinner label="Loading student…" />;

  const details = [
    ['Roll number', student.rollNo],
    ['Email', student.email],
    ['Age', student.age],
    ['Semester', student.semester],
    ['CGPA', `${student.cgpa.toFixed(1)} (grade ${gradeOf(student.cgpa)})`],
    ['Enrolled on', formatDate(student.createdAt)],
    ['Last updated', formatDate(student.updatedAt)],
  ];

  return (
    <>
      <Link to="/students" className="back-link">
        ← All students
      </Link>
      <div className="card profile">
        <div className="profile-head">
          <span className="avatar avatar-xl">{student.name.charAt(0).toUpperCase()}</span>
          <div className="profile-title">
            <h1>{student.name}</h1>
            <StatusBadge status={student.status} />
          </div>
          <div className="profile-actions">
            <button className="btn" onClick={openEdit}>
              Edit
            </button>
            <button className="btn btn-danger-ghost" onClick={() => setConfirming(true)}>
              Delete
            </button>
          </div>
        </div>

        <dl className="detail-grid">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <h3>Course</h3>
        {student.course ? (
          <div className="course-strip">
            <strong>{student.course.code}</strong>
            <span>{student.course.title}</span>
            <span className="muted small">
              {student.course.department} · {student.course.durationYears} years
            </span>
          </div>
        ) : (
          <p className="muted">The course this student was enrolled in no longer exists.</p>
        )}
      </div>

      {editing && (
        <Modal title={`Edit ${student.name}`} onClose={() => setEditing(false)}>
          {courses.length ? (
            <StudentForm initial={student} courses={courses} onSubmit={handleSave} onCancel={() => setEditing(false)} />
          ) : (
            <Spinner label="Loading courses…" />
          )}
        </Modal>
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete student"
          message={`Remove ${student.name} (${student.rollNo}) permanently? This cannot be undone.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onClose={() => !deleteBusy && setConfirming(false)}
        />
      )}
    </>
  );
}
