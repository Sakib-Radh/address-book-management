import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return <Loader className="min-h-screen bg-gray-50" />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
