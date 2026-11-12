import { Routes, Route } from 'react-router-dom';
import { PublicLayout, AppLayout, ProtectedRoute } from './components/Layout.jsx';
import { Home, About, NotFound } from './pages/PublicPages.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import Courses from './pages/Courses.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public pages share the Navbar + Footer layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Protected admin area: nested routes rendered inside AppLayout's <Outlet /> */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students">
          <Route index element={<Students />} />
          <Route path=":id" element={<StudentDetail />} />
        </Route>
        <Route path="/courses" element={<Courses />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
