import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../context.jsx';
import { useDebounce } from '../components/ui.jsx';
import { Spinner, ErrorState } from '../components/ui.jsx';
import { Modal, ConfirmDialog } from '../components/ui.jsx';
import StudentForm from '../components/StudentForm.jsx';
import StudentCard, { StatusBadge, gradeOf } from '../components/StudentCard.jsx';
import { Pagination } from '../components/ui.jsx';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'rollNo', label: 'Roll no.' },
  { key: null, label: 'Course' },
  { key: 'semester', label: 'Sem' },
  { key: 'age', label: 'Age' },
  { key: 'cgpa', label: 'CGPA' },
  { key: null, label: 'Status' },
];

export default function Students() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query state
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('table');
  const debouncedSearch = useDebounce(search.trim());

  // Data state
  const [result, setResult] = useState(null); // { data, total, pages }
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Dialog state
  const [editing, setEditing] = useState(null); // null | 'new' | student
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  // Courses fill the filter dropdown and the form
  useEffect(() => {
    api('/courses')
      .then((res) => setCourses(res.data))
      .catch(() => {});
  }, []);

  // "+ Add student" on the dashboard links here with ?new=1
  useEffect(() => {
    if (searchParams.get('new')) {
      setEditing('new');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch whenever the query changes; AbortController drops stale responses
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page, limit: 8, sort });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (course) params.set('course', course);
    if (status) params.set('status', status);

    setLoading(true);
    setError('');
    api(`/students?${params}`, { signal: controller.signal })
      .then((res) => {
        // If the last row of the last page was deleted, step back a page
        if (res.data.length === 0 && res.total > 0 && page > res.pages) return setPage(res.pages);
        setResult(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedSearch, course, status, sort, page, reloadKey]);

  // Changing a filter always goes back to page 1
  const updateFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const toggleSort = (key) => {
    setSort((current) => (current === key ? `-${key}` : key));
    setPage(1);
  };

  const sortArrow = (key) => (sort === key ? ' ▲' : sort === `-${key}` ? ' ▼' : '');

  const handleSave = async (values) => {
    if (editing === 'new') {
      await api('/students', { method: 'POST', body: values });
      toast.success(`${values.name} was added`);
      setPage(1);
      setSort('-createdAt');
    } else {
      await api(`/students/${editing._id}`, { method: 'PUT', body: values });
      toast.success(`${values.name} was updated`);
    }
    setEditing(null);
    reload();
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await api(`/students/${deleting._id}`, { method: 'DELETE' });
      toast.success(`${deleting.name} was removed`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
      if (err.status === 404) {
        setDeleting(null);
        reload();
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const hasFilters = Boolean(debouncedSearch || course || status);
  const clearFilters = () => {
    setSearch('');
    setCourse('');
    setStatus('');
    setPage(1);
  };

  const students = result?.data || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Students</h1>
          <p className="muted">Search, filter and manage every student record.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add student
        </button>
      </div>

      <div className="toolbar card">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Search by name, roll no. or email…"
          value={search}
          onChange={updateFilter(setSearch)}
          aria-label="Search students"
        />
        <select value={course} onChange={updateFilter(setCourse)} aria-label="Filter by course">
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code}
            </option>
          ))}
        </select>
        <select value={status} onChange={updateFilter(setStatus)} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="graduated">Graduated</option>
          <option value="dropped">Dropped</option>
        </select>
        <select value={sort} onChange={updateFilter(setSort)} aria-label="Sort by">
          <option value="-createdAt">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="-name">Name Z–A</option>
          <option value="-cgpa">CGPA high–low</option>
          <option value="cgpa">CGPA low–high</option>
          <option value="age">Age young–old</option>
          <option value="-age">Age old–young</option>
          <option value="rollNo">Roll no.</option>
          <option value="-rollNo">Roll no. (desc)</option>
          <option value="semester">Semester</option>
          <option value="-semester">Semester (desc)</option>
        </select>
        <div className="segmented" role="group" aria-label="View">
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
            Table
          </button>
          <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}>
            Cards
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !result ? (
        <Spinner label="Loading students…" />
      ) : students.length === 0 ? (
        <div className="state-box">
          {hasFilters ? (
            <>
              <p>No students match your search or filters.</p>
              <button className="btn btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p>No students yet.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
                Add the first student
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={loading ? 'is-refreshing' : ''}>
          {view === 'table' ? (
            <div className="table-wrap card">
              <table className="table">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.label}>
                        {col.key ? (
                          <button className="th-sort" onClick={() => toggleSort(col.key)}>
                            {col.label}
                            {sortArrow(col.key)}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <Link to={`/students/${s._id}`} className="cell-name">
                          {s.name}
                        </Link>
                        <div className="muted small">{s.email}</div>
                      </td>
                      <td className="nowrap">{s.rollNo}</td>
                      <td className="nowrap" title={s.course?.title}>{s.course?.code || '—'}</td>
                      <td>{s.semester}</td>
                      <td>{s.age}</td>
                      <td className="nowrap">
                        {s.cgpa.toFixed(1)} <span className="muted small">({gradeOf(s.cgpa)})</span>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="right nowrap">
                        <button className="btn btn-sm" onClick={() => setEditing(s)}>
                          Edit
                        </button>{' '}
                        <button className="btn btn-sm btn-danger-ghost" onClick={() => setDeleting(s)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-grid">
              {students.map((s) => (
                <StudentCard key={s._id} student={s} onEdit={setEditing} onDelete={setDeleting} />
              ))}
            </div>
          )}
          <Pagination page={result.page} pages={result.pages} total={result.total} onChange={setPage} />
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add student' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          {courses.length === 0 ? (
            <p className="muted">
              There are no courses yet. An admin needs to add one on the <Link to="/courses">Courses</Link> page first.
            </p>
          ) : (
            <StudentForm
              initial={editing === 'new' ? null : editing}
              courses={courses}
              onSubmit={handleSave}
              onCancel={() => setEditing(null)}
            />
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete student"
          message={`Remove ${deleting.name} (${deleting.rollNo}) permanently? This cannot be undone.`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onClose={() => !deleteBusy && setDeleting(null)}
        />
      )}
    </>
  );
}
