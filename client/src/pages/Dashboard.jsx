import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context.jsx';
import { Spinner, ErrorState } from '../components/ui.jsx';
import { StatusBadge } from '../components/StudentCard.jsx';

function StatCard({ label, value, hint }) {
  return (
    <div className="card stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  );
}

function StudentMiniList({ title, students, right }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {students.length === 0 ? (
        <p className="muted">Nothing to show yet.</p>
      ) : (
        <ul className="mini-list">
          {students.map((s) => (
            <li key={s._id}>
              <div>
                <Link to={`/students/${s._id}`}>{s.name}</Link>
                <span className="muted small"> · {s.course?.code || '—'}</span>
              </div>
              {right(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api('/stats', { signal: controller.signal })
      .then((res) => setStats(res.data))
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!stats) return <Spinner label="Loading dashboard…" />;

  const maxCount = Math.max(...stats.byCourse.map((c) => c.count), 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Hello {user.name.split(' ')[0]}, here is how the campus looks today.</p>
        </div>
        <Link to="/students?new=1" className="btn btn-primary">
          + Add student
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Total students" value={stats.totalStudents} hint={`${stats.status.active} active`} />
        <StatCard label="Courses" value={stats.totalCourses} />
        <StatCard label="Average CGPA" value={stats.avgCgpa.toFixed(2)} hint="across all students" />
        <StatCard label="Graduated" value={stats.status.graduated} hint={`${stats.status.dropped} dropped`} />
      </div>

      {stats.totalStudents === 0 ? (
        <div className="state-box">
          <p>No students yet. Add your first student, or run the seed script to load sample data.</p>
        </div>
      ) : (
        <div className="dash-grid">
          <div className="card dash-wide">
            <h3>Students per course</h3>
            <div className="bars">
              {stats.byCourse.map((c) => (
                <div className="bar-row" key={c.code} title={c.title}>
                  <span className="bar-label">{c.code}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="bar-value">{c.count}</span>
                  <span className="muted small bar-extra">avg {c.avgCgpa.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          <StudentMiniList
            title="Top performers"
            students={stats.toppers}
            right={(s) => <strong>{s.cgpa.toFixed(1)}</strong>}
          />
          <StudentMiniList
            title="Recently added"
            students={stats.recent}
            right={(s) => <StatusBadge status={s.status} />}
          />
        </div>
      )}
    </>
  );
}
