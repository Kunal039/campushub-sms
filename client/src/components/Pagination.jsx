export default function Pagination({ page, pages, total, onChange }) {
  return (
    <div className="pagination">
      <span className="muted small">
        {total} student{total === 1 ? '' : 's'} · page {page} of {pages}
      </span>
      <div className="pagination-buttons">
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Previous
        </button>
        <button className="btn btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}
