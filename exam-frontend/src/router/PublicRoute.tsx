import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '../store/store';

const PublicRoute = () => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  if (token) {
    return <Navigate to={role === 'Admin' ? '/admin' : '/user'} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
