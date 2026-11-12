# Enrolla — Student Management System

Semester project for **Full Stack Development – I (24CSP-304 / 24ITP-304)**, built on the MERN stack:
**M**ongoDB + Mongoose, **E**xpress, **R**eact (Vite), **N**ode.js, with JWT + bcrypt authentication.

## Features

- Register / log in; passwords hashed with bcrypt, sessions carried by a JWT that expires
- Protected pages on the frontend and protected routes on the API; `admin` and `staff` roles
- Students: add, edit (modal), delete, detail page, live search, filter by course / status, sorting, pagination
- Courses: catalogue with enrolled-student counts (admins can add, edit, delete)
- Dashboard: totals, average CGPA, students per course, top performers, recent additions
- Loading, empty and error states everywhere; form validation on both client and server
- Responsive layout (desktop sidebar, mobile top bar)

## Run it

Requirements: Node.js 20+ and MongoDB (local install or a MongoDB Atlas connection string).

```bash
npm run install-all
```

Create the server config (already present if you received this folder with `server/.env`):

```bash
cp server/.env.example server/.env
```

Edit `server/.env`: set `MONGO_URI`, a long random `JWT_SECRET`, and the `SEED_ADMIN_*` values.

Make sure MongoDB is running (start the "MongoDB" Windows service, run `mongod`, or use Atlas), then load sample data
— an admin user, 6 courses and 28 students. **This replaces existing students and courses.**

```bash
npm run seed
```

Start the API (port 5000) and the React app (port 5173) together:

```bash
npm run dev
```

Open http://localhost:5173 and log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `server/.env`,
or sign up for a new (staff) account.

## Project structure

```
enrolla/
├── server/                  Express + Mongoose REST API
│   └── src/
│       ├── server.js        entry point: loads .env, connects to MongoDB, starts listening
│       ├── app.js           middleware + route wiring
│       ├── config/db.js     Mongoose connection
│       ├── models/          User, Student, Course schemas
│       ├── middleware/      logger, validate, auth (verifyToken, authorize), errorHandler
│       ├── routes/          auth, students, courses, stats
│       └── seed.js          sample data
└── client/                  React single-page app (Vite)
    └── src/
        ├── App.jsx          route table (public, protected, nested, 404)
        ├── api/client.js    fetch wrapper that attaches the JWT
        ├── context/         AuthContext, ToastContext
        ├── hooks/           useDebounce
        ├── components/      layouts, ProtectedRoute, Modal, StudentForm, StudentCard, …
        └── pages/           Home, About, Login, Register, Dashboard, Students, StudentDetail, Courses, Profile, NotFound
```

## API

All responses are JSON. Errors always look like `{ "success": false, "message": "...", "errors": { "field": "..." } }`.
Every route except `/api/health` and register / login needs the header `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account, returns token |
| POST | `/api/auth/login` | Verify password, returns token |
| GET | `/api/auth/profile` | Current user |
| GET | `/api/students` | List; query: `search`, `course`, `status`, `sort`, `page`, `limit` |
| GET | `/api/students/:id` | One student with populated course |
| POST | `/api/students` | Create |
| PUT | `/api/students/:id` | Update |
| DELETE | `/api/students/:id` | Delete |
| GET | `/api/courses` | List with student counts |
| POST / PUT / DELETE | `/api/courses[/:id]` | Admin only |
| GET | `/api/stats` | Dashboard numbers |

## How it maps to the lecture plan

| Experiment | Where to look |
| --- | --- |
| 1. Components & JSX — props, `.map()` with keys, nested components, conditional rendering | `components/StudentCard.jsx`, `components/AppLayout.jsx` (Header, Sidebar, Footer), `pages/Students.jsx` |
| 2. State & hooks — `useState`, controlled forms, `useEffect` fetch, spinner, error handling, live search | `components/StudentForm.jsx`, `pages/Students.jsx`, `hooks/useDebounce.js` |
| 3. React Router — `<Link>`, route params, protected routes, nested routes, 404 | `App.jsx`, `components/ProtectedRoute.jsx`, `pages/StudentDetail.jsx`, `pages/NotFound.jsx` |
| 4. Student Management System | the whole `client/` app |
| 5. Node.js environment — modules, `fs`, HTTP | not part of the app (those are standalone lab scripts); `server/src` shows ES modules and environment config |
| 6. Express REST API — routing, CRUD, status codes, logger, validation, global error handler | `server/src/app.js`, `routes/students.js`, `middleware/` |
| 7. JWT & bcrypt — register, login, `verifyToken`, token expiry, profile | `models/User.js`, `routes/auth.js`, `middleware/auth.js` |
| 8. MongoDB & Mongoose — schema validation, CRUD, reference + `.populate()`, regex search, sort, `.skip()` / `.limit()` | `models/`, `routes/students.js`, `routes/stats.js` |
| 9. Full-stack integration — `fetch`, `cors`, CRUD UI in sync with the database | `client/src/api/client.js`, `pages/Students.jsx`, `server/src/app.js` |
| 10. Mini project | this repository |

## Deploy to Vercel

The repo is set up to deploy as one Vercel project: the React build is served as static files and the Express app
runs as a serverless function (`api/index.js`, wired up in `vercel.json`).

1. Create a free cluster on MongoDB Atlas, add a database user, and under Network Access allow `0.0.0.0/0`
   (Vercel functions do not have fixed IP addresses). Copy the connection string and put a database name in it,
   e.g. `...mongodb.net/enrolla`.
2. On vercel.com choose **Add New → Project**, import this GitHub repository and keep the detected settings.
3. Add these environment variables to the project, then deploy:
   - `MONGO_URI` — the Atlas connection string
   - `JWT_SECRET` — a long random string
   - `JWT_EXPIRES_IN` — e.g. `1d`
4. Load the sample data into Atlas once from your machine: put the Atlas string in `MONGO_URI` in `server/.env`
   and run `npm run seed`.

## Ideas for extending it

- Attendance or marks per subject as a new model
- Redux Toolkit in place of the Context API; automated tests with Vitest and Supertest
