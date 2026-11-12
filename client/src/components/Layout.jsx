import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context.jsx';
import { Spinner } from './ui.jsx';

// ---------- Shared pieces ----------
function Footer() {
  return (
    <footer className="footer">
      Enrolla · Full Stack Development – I semester project · MongoDB, Express, React, Node.js
    </footer>
  );
}

// ---------- Public layout: Navbar + page + Footer ----------
function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark">E</span>
      Enrolla
    </Link>
  );
}

function Navbar() {
  const { user } = useAuth();
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Brand />
        <nav className="navbar-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/about">About</NavLink>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicLayout() {
  return (
    <div className="public-shell">
      <Navbar />
      <main className="public-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// ---------- App layout: Sidebar + Header + page + Footer ----------
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/students', label: 'Students', icon: '☰' },
  { to: '/courses', label: 'Courses', icon: '▤' },
  { to: '/profile', label: 'Profile', icon: '◉' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <Brand to="/dashboard" />
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to}>
            <span className="sidebar-icon" aria-hidden="true">
              {l.icon}
            </span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="app-header-user">
        <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{user.name}</strong>
          <span className={`badge badge-${user.role}`}>{user.role}</span>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-body">
        <Header />
        <main className="app-main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

// ---------- Route guard ----------
// Sends visitors who are not logged in to /login, remembering where they wanted to go
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" fullPage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
