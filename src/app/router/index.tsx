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
import { TaxonomiesPage } from '../../features/catalog/pages/TaxonomiesPage';
import { CategoriesPage } from '../../features/catalog/pages/CategoriesPage';
import { BrandsPage } from '../../features/catalog/pages/BrandsPage';
import { ProductsPage } from '../../features/catalog/pages/ProductsPage';
import { ProductEditorPage } from '../../features/catalog/pages/ProductEditorPage';
import { AttributesPage } from '../../features/catalog/pages/AttributesPage';
import { AttributeSetsPage } from '../../features/catalog/pages/AttributeSetsPage';
import { SizeChartsPage } from '../../features/catalog/pages/SizeChartsPage';
import { WarehousesPage } from '../../features/catalog/pages/WarehousesPage';
import { InventoryPage } from '../../features/catalog/pages/InventoryPage';
import { BrandingPage } from '../../features/storefront/pages/BrandingPage';
import { ContentPagesPage } from '../../features/storefront/pages/ContentPagesPage';
import { ContentPageEditorPage } from '../../features/storefront/pages/ContentPageEditorPage';
import { CollectionsPage } from '../../features/storefront/pages/CollectionsPage';
import { CollectionEditorPage } from '../../features/storefront/pages/CollectionEditorPage';
import { HeroBannerPage } from '../../features/storefront/pages/HeroBannerPage';
import { StorefrontMenusPage } from '../../features/storefront/pages/StorefrontMenusPage';
import { OrdersPage } from '../../features/orders/pages/OrdersPage';
import { OrderDetailPage } from '../../features/orders/pages/OrderDetailPage';
import { StoreConnectionPage } from '../../features/store-sync/pages/StoreConnectionPage';
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
      {
        path: 'catalog/taxonomies',
        element: <PermissionGuard permissions={['catalog-taxonomy.manage']}><TaxonomiesPage /></PermissionGuard>,
      },
      {
        path: 'catalog/categories',
        element: <PermissionGuard permissions={['catalog-taxonomy.manage']}><CategoriesPage /></PermissionGuard>,
      },
      {
        path: 'catalog/brands',
        element: <PermissionGuard permissions={['catalog-taxonomy.manage']}><BrandsPage /></PermissionGuard>,
      },
      {
        path: 'catalog/products',
        element: <PermissionGuard permissions={['catalog-products.manage']}><ProductsPage /></PermissionGuard>,
      },
      {
        path: 'catalog/products/new',
        element: <PermissionGuard permissions={['catalog-products.manage']}><ProductEditorPage /></PermissionGuard>,
      },
      {
        path: 'catalog/products/:id',
        element: <PermissionGuard permissions={['catalog-products.manage']}><ProductEditorPage /></PermissionGuard>,
      },
      {
        path: 'catalog/attributes',
        element: <PermissionGuard permissions={['catalog-attributes.manage']}><AttributesPage /></PermissionGuard>,
      },
      {
        path: 'catalog/attribute-sets',
        element: <PermissionGuard permissions={['catalog-attributes.manage']}><AttributeSetsPage /></PermissionGuard>,
      },
      {
        path: 'catalog/size-charts',
        element: <PermissionGuard permissions={['catalog-products.manage']}><SizeChartsPage /></PermissionGuard>,
      },
      {
        path: 'catalog/warehouses',
        element: <PermissionGuard permissions={['catalog-inventory.manage']}><WarehousesPage /></PermissionGuard>,
      },
      {
        path: 'catalog/inventory',
        element: <PermissionGuard permissions={['catalog-inventory.manage']}><InventoryPage /></PermissionGuard>,
      },
      {
        path: 'storefront/branding',
        element: <PermissionGuard permissions={['storefront-branding.manage']}><BrandingPage /></PermissionGuard>,
      },
      {
        path: 'storefront/pages',
        element: <PermissionGuard permissions={['storefront-pages.manage']}><ContentPagesPage /></PermissionGuard>,
      },
      {
        path: 'storefront/pages/new',
        element: <PermissionGuard permissions={['storefront-pages.manage']}><ContentPageEditorPage /></PermissionGuard>,
      },
      {
        path: 'storefront/pages/:id',
        element: <PermissionGuard permissions={['storefront-pages.manage']}><ContentPageEditorPage /></PermissionGuard>,
      },
      {
        path: 'storefront/collections',
        element: <PermissionGuard permissions={['storefront-collections.manage']}><CollectionsPage /></PermissionGuard>,
      },
      {
        path: 'storefront/collections/:id',
        element: <PermissionGuard permissions={['storefront-collections.manage']}><CollectionEditorPage /></PermissionGuard>,
      },
      {
        path: 'storefront/hero-banner',
        element: <PermissionGuard permissions={['storefront-banner.manage']}><HeroBannerPage /></PermissionGuard>,
      },
      {
        path: 'storefront/menus',
        element: <PermissionGuard permissions={['storefront-menus.manage']}><StorefrontMenusPage /></PermissionGuard>,
      },
      {
        path: 'orders',
        element: <PermissionGuard permissions={['orders.manage']}><OrdersPage /></PermissionGuard>,
      },
      {
        path: 'orders/:id',
        element: <PermissionGuard permissions={['orders.manage']}><OrderDetailPage /></PermissionGuard>,
      },
      {
        path: 'store-sync/connection',
        element: <PermissionGuard permissions={['store-sync.manage']}><StoreConnectionPage /></PermissionGuard>,
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
