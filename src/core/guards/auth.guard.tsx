import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { AppConfig } from '../config/app.config';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={AppConfig.auth.loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
