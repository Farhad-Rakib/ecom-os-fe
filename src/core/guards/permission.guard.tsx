import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = false,
}) => {
  const { hasAllPermissions, hasAnyPermission, tokenPayload } = useAuthStore();

  // Mirrors PermissionAuthorizationHandler on the backend: a platform super admin bypasses every
  // permission check server-side via the platform_admin claim, not by having each permission
  // explicitly listed (tenant roles never get Platform-module permissions -- see RbacSeeder). This
  // guard must bypass the same way, or it would block a platform admin from pages the API itself
  // still lets them call.
  const isPlatformSuperAdmin = tokenPayload?.platform_admin === 'true';

  const hasAccess = isPlatformSuperAdmin || (requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions));

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
