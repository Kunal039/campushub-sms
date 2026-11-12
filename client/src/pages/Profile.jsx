import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="muted">Your account, as returned by the protected /api/auth/profile route.</p>
        </div>
      </div>
      <div className="card profile">
        <div className="profile-head">
          <span className="avatar avatar-xl">{user.name.charAt(0).toUpperCase()}</span>
          <div className="profile-title">
            <h2>{user.name}</h2>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
          </div>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user.role === 'admin' ? 'Admin — can manage courses' : 'Staff — can manage students'}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
          </div>
        </dl>
        <button
          className="btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </div>
    </>
  );
}
