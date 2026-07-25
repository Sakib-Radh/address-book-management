import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';

export default function GuestRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return <Loader className="min-h-screen bg-gray-50" />;
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
