import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterTenantPage } from '../../features/auth/pages/RegisterTenantPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { UsersPage } from '../../features/users/pages/UsersPage';
import { RolesPage } from '../../features/roles/pages/RolesPage';
import { TenantsPage } from '../../features/tenants/pages/TenantsPage';
import { SubscriptionPlansPage } from '../../features/subscription-plans/pages/SubscriptionPlansPage';
import { PermissionsPage } from '../../features/permissions/pages/PermissionsPage';
import { RolePermissionsPage } from '../../features/role-permissions/pages/RolePermissionsPage';
import { UserRolesPage } from '../../features/user-roles/pages/UserRolesPage';
import { MenuPage } from '../../features/menu/pages/MenuPage';
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { PreferencesPage } from '../../features/preferences/pages/PreferencesPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { SiteSettingsPage } from '../../features/site-settings/pages/SiteSettingsPage';
import { SystemSettingsPage } from '../../features/system-settings/pages/SystemSettingsPage';
import { AuditLogsPage } from '../../features/audit-logs/pages/AuditLogsPage';
import { FeatureFlagsPage } from '../../features/feature-flags/pages/FeatureFlagsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register-tenant', element: <RegisterTenantPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      // Dashboard/Preferences/Profile are self-scoped -- every authenticated user can reach them,
      // matching their backend endpoints (no permission policy beyond [Authorize]).
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'preferences', element: <PreferencesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'users',
        element: <PermissionGuard permissions={['users.read']}><UsersPage /></PermissionGuard>,
      },
      {
        path: 'roles',
        element: <PermissionGuard permissions={['roles.read']}><RolesPage /></PermissionGuard>,
      },
      {
        path: 'tenants',
        element: <PermissionGuard permissions={['tenants.manage']}><TenantsPage /></PermissionGuard>,
      },
      {
        path: 'subscription-plans',
        element: <PermissionGuard permissions={['subscription-plans.manage']}><SubscriptionPlansPage /></PermissionGuard>,
      },
      {
        path: 'permissions',
        element: <PermissionGuard permissions={['permissions.read']}><PermissionsPage /></PermissionGuard>,
      },
      {
        path: 'roles/permissions',
        element: <PermissionGuard permissions={['role-permissions.read']}><RolePermissionsPage /></PermissionGuard>,
      },
      {
        path: 'users/roles',
        element: <PermissionGuard permissions={['user-roles.read']}><UserRolesPage /></PermissionGuard>,
      },
      {
        path: 'menu-management',
        element: <PermissionGuard permissions={['menus.read']}><MenuPage /></PermissionGuard>,
      },
      {
        path: 'reports',
        element: <PermissionGuard permissions={['reports.read']}><ReportsPage /></PermissionGuard>,
      },
      {
        path: 'site-settings',
        element: <PermissionGuard permissions={['site-settings.read']}><SiteSettingsPage /></PermissionGuard>,
      },
      {
        path: 'system-settings',
        element: <PermissionGuard permissions={['system-settings.manage']}><SystemSettingsPage /></PermissionGuard>,
      },
      {
        path: 'audit-logs',
        element: <PermissionGuard permissions={['audit-logs.read']}><AuditLogsPage /></PermissionGuard>,
      },
      {
        path: 'feature-flags',
        element: <PermissionGuard permissions={['feature-flags.read']}><FeatureFlagsPage /></PermissionGuard>,
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
