import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Brand } from './PublicLayout.jsx';
import Footer from './Footer.jsx';

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

export default function AppLayout() {
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
