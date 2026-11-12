import { Link } from 'react-router-dom';

export default function NotFound() {
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
