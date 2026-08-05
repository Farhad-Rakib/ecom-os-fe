# Admin Template Starter Kit - Developer Guide

Production-ready Admin Template built with React, TypeScript, and modern best practices.

## Table of Contents

1. [Setup & Run](#setup--run)
2. [Folder Structure](#folder-structure)
3. [Architecture Overview](#architecture-overview)
4. [Core Concepts](#core-concepts)
5. [Configuration Usage](#configuration-usage)
6. [Integrating a New API - Step by Step](#integrating-a-new-api---step-by-step)
7. [Using Table & Form Components](#using-table--form-components)
8. [Form Drawer Component](#form-drawer-component)
9. [Authentication Flow](#authentication-flow)
10. [Menu System](#menu-system)
11. [Dark Mode & Theming](#dark-mode--theming)
12. [Settings System](#settings-system)
13. [Notification Center](#notification-center)
14. [Command Palette](#command-palette)
15. [Reports & Charts](#reports--charts)
16. [Best Practices](#best-practices)
17. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Setup & Run

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

---

## Folder Structure

```
src/
├── app/                          # Application level code
│   ├── layouts/                 # Layout components
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── components/          # Layout-specific components
│   │       ├── Header.tsx       # Top header with theme toggle, notifications, user menu
│   │       └── Sidebar.tsx      # Responsive sidebar with API-driven menu
│   ├── pages/                   # Generic pages (404, 403)
│   ├── providers/               # App-level providers (React Query, Toast)
│   └── router/                  # Route configuration
├── components/                   # Shared components
│   ├── CommandPalette/          # Global search (Ctrl+K)
│   ├── form/                    # Form components
│   │   └── DynamicForm.tsx
│   ├── table/                   # Table components
│   │   └── DataTable.tsx
│   └── ui/                      # UI primitives
│       ├── Dialog/
│       ├── Drawer/              # Slide-out form drawer
│       ├── EmptyState/
│       ├── ErrorState/
│       ├── Loader/
│       ├── Modal/
│       └── Toast/
├── core/                         # Core application code
│   ├── api/                     # API layer
│   │   ├── base.repository.ts  # Axios wrapper with auth interceptors
│   │   ├── http.types.ts       # HTTP type definitions
│   │   └── services/           # Service instance exports
│   ├── config/                  # App configuration
│   │   └── app.config.ts
│   ├── guards/                  # Route guards (AuthGuard, PermissionGuard)
│   ├── services/                # Service layer
│   │   ├── *.interface.ts      # Service interfaces (contracts)
│   │   ├── service.factory.ts  # Creates service instances
│   │   └── impl/               # Real API implementations
│   └── stores/                  # Global stores
│       ├── notification.store.ts
│       ├── preferences.store.ts
│       └── theme.store.ts
├── domain/                       # Domain layer
│   ├── dto/                     # Data Transfer Objects (API shapes)
│   └── models/                  # Domain models (business entities)
└── features/                     # Feature modules
    ├── activity/
    ├── auth/
    ├── dashboard/
    ├── preferences/
    ├── reports/
    ├── settings/
    └── users/
```

---

## Architecture Overview

The application follows a layered architecture with clear separation of concerns.

### Layer Diagram

```
Feature Pages / Stores
        │
        ▼
   API Exports  (core/api/services/*.ts)
        │
        ▼
  Service Factory  (core/services/service.factory.ts)
        │
        ▼
  Real Services  (core/services/impl/*.ts)
        │
        ▼
  Base Repository  (core/api/base.repository.ts)
        │
        ▼
  Axios HTTP Client (with interceptors)
        │
        ▼
  Backend API (https://localhost:5001/v1)
```

### Why This Architecture?

- **Service Interfaces** decouple feature code from API implementation details
- **Base Repository** centralizes auth headers, token refresh, and error handling
- **Service Factory** provides a single place to instantiate services
- **API Exports** give features a clean, one-line import

### Base Repository Features

- Automatic `Authorization: Bearer <token>` header injection
- Automatic token refresh on 401 responses (with request queue)
- `withCredentials: true` for HTTP-only cookie support
- Configurable timeout and base URL from `AppConfig`

---

## Core Concepts

### State Management

- **Zustand** - Global client state (auth, theme, notifications, settings, preferences)
- **TanStack React Query** - Server state (data fetching, caching, mutations)

### Route Protection

All authenticated routes are wrapped with `AuthGuard`. Permission-specific routes additionally use `PermissionGuard`:

```tsx
<AuthGuard>
  <PermissionGuard permissions={['users.view']}>
    <UsersPage />
  </PermissionGuard>
</AuthGuard>
```

- `AuthGuard` redirects unauthenticated users to `/login`
- `PermissionGuard` redirects unauthorized users to `/403`
- Permissions are extracted from the JWT token payload

### HTTP-Only Cookies

The app is configured with `withCredentials: true` so the browser automatically sends and receives HTTP-only cookies set by the backend. The backend should set tokens as HTTP-only, Secure, SameSite cookies in its login/refresh responses. The client also stores tokens in localStorage as a fallback for the `Authorization` header.

---

## Configuration Usage

```typescript
import { AppConfig } from '@/core/config/app.config';

AppConfig.api.baseURL           // API base URL
AppConfig.api.withCredentials   // true - sends cookies with requests
AppConfig.auth.tokenKey         // localStorage key for access token
AppConfig.auth.refreshTokenKey  // localStorage key for refresh token
AppConfig.auth.loginPath        // Where to redirect unauthenticated users
AppConfig.auth.defaultRedirect  // Where to go after login (/dashboard)
```

---

## Integrating a New API - Step by Step

This is the complete flow for integrating a new API endpoint (e.g., a "Products" API).

### Step 1: Define the Domain Model

**File:** `src/domain/models/product.model.ts`

**Why:** Models define the shape of your business entities independent of the API format.

```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}
```

### Step 2: Define the DTOs

**File:** `src/domain/dto/product.dto.ts`

**Why:** DTOs define the exact shape the API sends/receives. They may differ from models (e.g., nested wrappers, different naming).

```typescript
import { Product } from '../models/product.model';
import { ApiResponse } from './auth.dto';

export interface CreateProductDto {
  name: string;
  price: number;
  category: string;
  stock: number;
}

export type GetProductsApiResponse = ApiResponse<Product[]>;
export type GetProductApiResponse = ApiResponse<Product>;
```

### Step 3: Create the Service Interface

**File:** `src/core/services/product.service.interface.ts`

**Why:** Interfaces define the contract. Your feature code depends on this, NOT the implementation. This allows swapping implementations without changing feature code.

```typescript
import { Product } from '../../domain/models/product.model';
import { CreateProductDto } from '../../domain/dto/product.dto';

export interface IProductService {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product>;
  create(dto: CreateProductDto): Promise<Product>;
  update(id: string, dto: Partial<CreateProductDto>): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

### Step 4: Create the Real Service Implementation

**File:** `src/core/services/impl/product.service.ts`

**Why:** This extends `BaseRepository` which gives you automatic auth headers, token refresh, and error handling for free.

```typescript
import { BaseRepository } from '../../api/base.repository';
import { IProductService } from '../product.service.interface';
import { Product } from '../../../domain/models/product.model';
import { CreateProductDto, GetProductsApiResponse, GetProductApiResponse } from '../../../domain/dto/product.dto';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export class ProductService extends BaseRepository implements IProductService {
  constructor() {
    super('/products'); // Base path - all requests go to /v1/products/*
  }

  async getAll(): Promise<Product[]> {
    const response = await this.get<GetProductsApiResponse>('');
    return response.data;
  }

  async getById(id: string): Promise<Product> {
    const response = await this.get<GetProductApiResponse>(`/${id}`);
    return response.data;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const response = await this.post<GetProductApiResponse>('', dto);
    return response.data;
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    const response = await this.put<GetProductApiResponse>(`/${id}`, dto);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/products/${id}`);
  }
}
```

### Step 5: Register in Service Factory

**File:** `src/core/services/service.factory.ts`

**Why:** Central place to instantiate services. Provides singleton pattern.

```typescript
import { IProductService } from './product.service.interface';
import { ProductService } from './impl/product.service';

// Add to the ServiceFactory class:
private productService: IProductService | null = null;

getProductService(): IProductService {
  if (!this.productService) {
    this.productService = new ProductService();
  }
  return this.productService;
}
```

### Step 6: Create the API Export

**File:** `src/core/api/services/product.api.ts`

**Why:** Single-line import for feature code. Decouples from factory internals.

```typescript
import { serviceFactory } from '../../services/service.factory';

export const productApi = serviceFactory.getProductService();
```

### Step 7: Create the Feature Page

**File:** `src/features/products/pages/ProductsPage.tsx`

**Why:** Feature pages consume the API export and use React Query for data fetching.

```typescript
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../core/api/services/product.api';

export const ProductsPage: React.FC = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });

  // Render your UI using the DataTable component
};
```

### Step 8: Add the Route

**File:** `src/app/router/index.tsx`

```typescript
import { ProductsPage } from '../../features/products/pages/ProductsPage';

// Add inside the AuthGuard children:
{
  path: 'products',
  element: (
    <PermissionGuard permissions={['products.view']}>
      <ProductsPage />
    </PermissionGuard>
  ),
}
```

### Step 9: Menu Entry (Automatic)

The menu is loaded from the backend `/menu` API. Ask the backend team to add:

```json
{
  "title": "Products",
  "url": "/products",
  "icon": "products",
  "requiredPermission": "products.view",
  "children": []
}
```

The Sidebar maps icon names to Lucide React icons automatically.

### Summary Table

| Step | File Location | Purpose |
|------|--------------|---------|
| 1 | `domain/models/` | Business entity shape |
| 2 | `domain/dto/` | API request/response shapes |
| 3 | `core/services/*.interface.ts` | Service contract |
| 4 | `core/services/impl/` | Real API implementation |
| 5 | `core/services/service.factory.ts` | Service instantiation |
| 6 | `core/api/services/` | Clean import export |
| 7 | `features/*/pages/` | UI page component |
| 8 | `app/router/index.tsx` | Route registration |
| 9 | Backend `/menu` API | Menu visibility |

---

## Using Table & Form Components

### DataTable

```typescript
import { DataTable, Column, RowAction } from '@/components/table/DataTable';

const columns: Column<User>[] = [
  { key: 'fullName', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', render: (status) => <Badge>{status}</Badge> },
];

const rowActions: RowAction<User>[] = [
  { icon: Pencil, label: 'Edit', onClick: (user) => handleEdit(user), variant: 'primary' },
  { icon: Trash2, label: 'Delete', onClick: (user) => handleDelete(user), variant: 'danger' },
];

<DataTable columns={columns} data={users} isLoading={isLoading} searchable rowActions={rowActions} />
```

### DynamicForm

```typescript
import { DynamicForm, FormField } from '@/components/form/DynamicForm';

const fields: FormField[] = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'role', label: 'Role', type: 'select', options: [...] },
];

<DynamicForm fields={fields} onSubmit={handleSubmit} submitLabel="Save" />
```

---

## Form Drawer Component

A slide-out drawer that renders a `DynamicForm` inside it.

```typescript
import { FormDrawer } from '@/components/ui/Drawer/FormDrawer';

<FormDrawer
  isOpen={isOpen}
  onClose={handleClose}
  title="Add New User"
  fields={userFormFields}
  onSubmit={handleSubmit}
  submitLabel="Create"
  isLoading={isSubmitting}
  position="right"
  size="md"
/>
```

---

## Authentication Flow

### Login Flow

1. User submits email + password on `/login`
2. `authApi.login()` calls `POST /auth/login`
3. Backend returns `{ success, data: { accessToken, refreshToken, ... } }`
4. Tokens are stored in localStorage AND sent as HTTP-only cookies by the backend
5. JWT payload is decoded to extract user info (name, email, role, permissions)
6. Menu is prefetched via `queryClient.prefetchQuery(['menu'])`
7. User is redirected to `/dashboard`

### Token Refresh Flow

1. Any API request returns 401
2. Base repository intercepts the 401
3. Sends `POST /auth/refreshtoken` with the stored refresh token
4. New tokens are saved
5. Original failed request is retried automatically
6. If refresh also fails, user is redirected to `/login`

### Logout Flow

1. `authApi.logout()` is called (clears server session/cookie)
2. Tokens are removed from localStorage
3. React Query cache is cleared (removes cached menu, etc.)
4. Auth state is reset
5. User is redirected to `/login`

### Usage in Components

```typescript
const { login, logout, isAuthenticated, hasPermission, tokenPayload } = useAuthStore();

await login({ email, password });
if (hasPermission('users.create')) { /* show button */ }
await logout();
```

---

## Menu System

Menu items are fetched from the backend `GET /menu` API after login.

### API Response Format

```json
{
  "success": true,
  "data": [
    {
      "title": "Dashboard",
      "url": "/dashboard",
      "icon": "dashboard",
      "requiredPermission": null,
      "children": []
    }
  ]
}
```

### How It Works

- Menu is fetched with React Query (`queryKey: ['menu']`)
- Cached for 5 minutes (`staleTime: 5 * 60 * 1000`)
- Prefetched immediately after login
- Cleared on logout
- Permission-filtered in the Sidebar (items with `requiredPermission` are hidden if user lacks that permission)

### Icon Mapping

The `icon` field from the API maps to Lucide React icons:

| API icon value | Lucide Icon |
|----------------|-------------|
| `dashboard` | LayoutDashboard |
| `users` | Users |
| `roles` | Shield |
| `rolepermissions` | ShieldCheck |
| `settings` | Settings |
| `reports` | FileText |
| `products` | Package |
| `orders` | ShoppingCart |

To add new mappings, update the `iconMap` in `src/app/layouts/components/Sidebar.tsx`.

---

## Dark Mode & Theming

```typescript
import { useThemeStore } from '@/core/stores/theme.store';

const { theme, toggleTheme, setTheme } = useThemeStore();
```

- Persisted to localStorage
- Applied via `document.documentElement.classList`
- Every component uses `dark:` Tailwind variants

---

## Settings System

Application settings stored in Zustand with localStorage persistence.

```typescript
import { useSettingsStore } from '@/features/settings/store/settings.store';

const { general, security, notifications, updateGeneral, exportAsJSON } = useSettingsStore();
```

Categories: General, Security, Notifications. Supports import/export as JSON.

---

## Notification Center

```typescript
import { useNotificationStore } from '@/core/stores/notification.store';

const { addNotification, markAsRead, markAllAsRead } = useNotificationStore();

addNotification({
  title: 'New order',
  message: 'Order #123 received',
  type: 'success',
});
```

---

## Command Palette

Press **Ctrl+K** (or Cmd+K) to open. Features: page navigation, theme toggle, logout, keyboard navigation.

---

## Reports & Charts

Uses Recharts for bar, pie, area, and line charts. All styled for light and dark modes.

---

## Best Practices

1. Always use service interfaces - never import implementations directly
2. Use React Query for all server data (automatic caching, refetching, loading states)
3. Protect routes with `AuthGuard` and `PermissionGuard`
4. Handle loading, error, and empty states in every page
5. Use `dark:` variants for all new components
6. Invalidate React Query cache after mutations: `queryClient.invalidateQueries({ queryKey: ['products'] })`
7. Keep DTOs and models separate
8. Use `AppConfig` for all configurable values
9. Validate forms with Zod schemas
10. Use the FormDrawer for create/edit experiences

---

## Common Mistakes to Avoid

1. **Importing service implementations directly** - Always use the API exports from `core/api/services/`
2. **Forgetting to unwrap API responses** - Backend wraps data in `{ success, data, message }`. Services must return `response.data`.
3. **Not handling permissions** - Check permissions before showing UI elements
4. **Hardcoding URLs or keys** - Use `AppConfig`
5. **Storing sensitive tokens in code** - Tokens are in localStorage/cookies, never in source
6. **Not clearing cache on logout** - Always call `queryClient.clear()` during logout
7. **Missing dark mode styles** - Every new component needs `dark:` variants
8. **Skipping TypeScript types** - Fix errors, don't suppress with `any`

---

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling (dark mode via `class` strategy)
- **Zustand** - Client state (auth, theme, settings, notifications)
- **TanStack React Query** - Server state (fetch, cache, mutations)
- **React Router** - Routing with guards
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client (via Base Repository)
- **Recharts** - Charts
- **Lucide React** - Icons
