import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './services/authService';

function PrivateRoute({ children, requireAdmin = false, unauthenticatedRedirect = '/login' }) {
  const isAuth = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuth) {
    return <Navigate to={unauthenticatedRedirect} replace />;
  }

  if (requireAdmin && !authService.isAdminUser(user)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AdminEntryRoute() {
  const isAuth = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  if (authService.isAdminUser(user)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/admin/login" replace />;
}

function PublicRoute({ children }) {
  const isAuth = authService.isAuthenticated();
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (isAuth) {
    // Nếu là admin đang truy cập trang login, chuyển về dashboard
    if (location.pathname === '/admin/login' && authService.isAdminUser(user)) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Nếu là user thường đang truy cập trang login user, chuyển về home
    if (location.pathname === '/login') {
      return <Navigate to="/" replace />;
    }

    // Cho phép user thường vào /admin/login để xem thông báo lỗi
  }

  return children;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <PublicRoute>
              <AdminLogin />
            </PublicRoute>
          }
        />
        <Route path="/admin" element={<AdminEntryRoute />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="/user/devices"
          element={
            <PrivateRoute>
              <Navigate to="/" replace />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute requireAdmin={true} unauthenticatedRedirect="/admin/login">
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={
            authService.isAuthenticated()
              ? <Navigate to="/" replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
