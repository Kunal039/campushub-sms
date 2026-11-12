import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { title: 'Student records', text: 'Add, edit, search, filter, sort and paginate student records backed by MongoDB.' },
  { title: 'Course catalogue', text: 'Every student references a course; counts and averages are computed on the server.' },
  { title: 'Secure access', text: 'Passwords hashed with bcrypt, sessions carried by JWT, private routes on both ends.' },
  { title: 'Live dashboard', text: 'Enrolment by course, status breakdown and top performers, always in sync with the database.' },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <span className="eyebrow">MERN stack · Semester project</span>
        <h1>Manage your campus records in one place</h1>
        <p>
          Enrolla is a student management system built with MongoDB, Express, React and Node.js — a single-page
          app talking to a REST API.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Create an account
              </Link>
              <Link to="/login" className="btn">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="feature-grid">
        {features.map((f) => (
          <article key={f.title} className="card">
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}
