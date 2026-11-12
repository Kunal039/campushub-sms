import { Link } from 'react-router-dom';
import { useAuth } from '../context.jsx';

// ---------- Home ----------
const features = [
  { title: 'Student records', text: 'Add, edit, search, filter, sort and paginate student records backed by MongoDB.' },
  { title: 'Course catalogue', text: 'Every student references a course; counts and averages are computed on the server.' },
  { title: 'Secure access', text: 'Passwords hashed with bcrypt, sessions carried by JWT, private routes on both ends.' },
  { title: 'Live dashboard', text: 'Enrolment by course, status breakdown and top performers, always in sync with the database.' },
];

export function Home() {
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

// ---------- About ----------
const stack = [
  { name: 'React 19 + Vite', role: 'Components, JSX, props, hooks (useState, useEffect, useContext), controlled forms' },
  { name: 'React Router', role: 'SPA navigation, route params, nested routes, protected routes, 404 page' },
  { name: 'Node.js + Express', role: 'REST API, routing, logger / validation / auth middleware, global error handler' },
  { name: 'JWT + bcrypt', role: 'Register, login, hashed passwords, token expiry, role-based access' },
  { name: 'MongoDB + Mongoose', role: 'Schemas with validation, references + populate, regex search, sort, pagination' },
];

export function About() {
  return (
    <section className="prose">
      <h1>About this project</h1>
      <p className="muted">
        Enrolla is the lab mini project for Full Stack Development – I. Each part of the app maps to an experiment in
        the lecture plan, from React components to full-stack CRUD.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Technology</th>
              <th>Used for</th>
            </tr>
          </thead>
          <tbody>
            {stack.map((s) => (
              <tr key={s.name}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                <td>{s.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- 404 ----------
export function NotFound() {
  return (
    <section className="hero">
      <span className="eyebrow">Error 404</span>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <div className="hero-actions">
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </section>
  );
}
