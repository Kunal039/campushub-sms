import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/Field.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (values.name.trim().length < 2) found.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = 'Enter a valid email address';
    if (values.password.length < 6) found.password = 'Password must be at least 6 characters';
    if (values.confirm !== values.password) found.confirm = 'Passwords do not match';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await register(values.name.trim(), values.email.trim(), values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors && Object.keys(err.errors).length ? '' : err.message);
      setBusy(false);
    }
  };

  return (
    <section className="auth-card card">
      <h1>Create your account</h1>
      <p className="muted">New accounts get the staff role.</p>
      {formError && <div className="alert alert-error">{formError}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Full name" error={errors.name}>
          <input value={values.name} onChange={set('name')} autoComplete="name" autoFocus />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={values.email} onChange={set('email')} autoComplete="username" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" value={values.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input type="password" value={values.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="muted small center">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
