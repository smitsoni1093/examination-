import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '../store/store';

interface ProtectedRouteProps {
  allowedRole?: string;
}

const ProtectedRoute = ({ allowedRole }: ProtectedRouteProps) => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  const homeByRole = (r: string | null) => {
    if (r === 'SuperAdmin') return '/superadmin';
    if (r === 'Admin') return '/admin';
    return '/user';
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={homeByRole(role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
