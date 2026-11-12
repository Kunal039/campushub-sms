const stack = [
  { name: 'React 19 + Vite', role: 'Components, JSX, props, hooks (useState, useEffect, useContext), controlled forms' },
  { name: 'React Router', role: 'SPA navigation, route params, nested routes, protected routes, 404 page' },
  { name: 'Node.js + Express', role: 'REST API, routing, logger / validation / auth middleware, global error handler' },
  { name: 'JWT + bcrypt', role: 'Register, login, hashed passwords, token expiry, role-based access' },
  { name: 'MongoDB + Mongoose', role: 'Schemas with validation, references + populate, regex search, sort, pagination' },
];

export default function About() {
  return (
    <section className="prose">
      <h1>About this project</h1>
      <p className="muted">
        CampusHub is the lab mini project for Full Stack Development – I. Each part of the app maps to an experiment in
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
