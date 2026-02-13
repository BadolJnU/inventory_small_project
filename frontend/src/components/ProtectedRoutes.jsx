import { Navigate } from 'react-router-dom';

const ProtectedRoutes = ({ children, isAdminRequired }) => {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  if (!token) return <Navigate to="/" />;
  
  if (isAdminRequired && email !== 'admin@system.com') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};