import { Link } from 'react-router-dom';

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

// Grade letter derived from CGPA (10-point scale)
export function gradeOf(cgpa) {
  if (cgpa >= 9) return 'A+';
  if (cgpa >= 8) return 'A';
  if (cgpa >= 7) return 'B';
  if (cgpa >= 6) return 'C';
  if (cgpa >= 5) return 'D';
  return 'F';
}

// Reusable card: receives one student through props
export default function StudentCard({ student, onEdit, onDelete }) {
  const { _id, name, rollNo, age, course, semester, cgpa, status } = student;
  return (
    <article className="student-card">
      <div className="student-card-top">
        <span className="avatar avatar-lg">{name.charAt(0).toUpperCase()}</span>
        <div>
          <Link to={`/students/${_id}`} className="student-card-name">
            {name}
          </Link>
          <div className="muted small">{rollNo}</div>
        </div>
        <StatusBadge status={status} />
      </div>
      <dl className="student-card-meta">
        <div>
          <dt>Course</dt>
          <dd>{course?.code || '—'}</dd>
        </div>
        <div>
          <dt>Semester</dt>
          <dd>{semester}</dd>
        </div>
        <div>
          <dt>Age</dt>
          <dd>{age}</dd>
        </div>
        <div>
          <dt>CGPA</dt>
          <dd>
            {cgpa.toFixed(1)} <span className="muted">({gradeOf(cgpa)})</span>
          </dd>
        </div>
      </dl>
      <div className="student-card-actions">
        <button className="btn btn-sm" onClick={() => onEdit(student)}>
          Edit
        </button>
        <button className="btn btn-sm btn-danger-ghost" onClick={() => onDelete(student)}>
          Delete
        </button>
      </div>
    </article>
  );
}
