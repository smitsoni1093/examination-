import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '../store/store';

const PublicRoute = () => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  const homeByRole = (r: string | null) => {
    if (r === 'SuperAdmin') return '/superadmin';
    if (r === 'Admin') return '/admin';
    return '/user';
  };

  if (token) {
    return <Navigate to={homeByRole(role)} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
