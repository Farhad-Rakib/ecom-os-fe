# Admin Template Starter Kit

A production-ready, reusable Admin Template built with React, TypeScript, and modern best practices. This template is designed to be completely frontend-only with a mock-driven architecture, making it easy to develop without a backend and seamlessly switch to a real API when ready.

## Features

- **Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: Zustand (global) + TanStack Query (server state)
- **Routing**: React Router with route guards
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Reusable Table, Form, Toast, Loader, Dialog, etc.
- **Mock System**: Complete mock data and services with simulated delays
- **Authentication**: JWT-based auth with RBAC
- **Charts**: Beautiful charts with Recharts
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first design with collapsible sidebar

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Demo Accounts

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **User**: user@example.com / user123

## Project Structure

```
src/
├── app/              # Application level (layouts, router, providers)
├── components/       # Shared components (table, form, ui)
├── core/            # Core (api, config, guards, utils)
├── domain/          # Domain models
├── features/        # Feature modules (auth, dashboard, users)
└── mocks/           # Mock data and services
```

## Key Features

### 1. Global Configuration

Central configuration in `src/core/config/app.config.ts`:

```typescript
export const AppConfig = {
  api: {
    useMockData: true,  // Toggle mock/real API
    baseURL: '...',
    mockDelay: 800,
  },
  // ... more config
}
```

### 2. Generic DataTable

Config-driven table with:
- Sorting
- Search
- Pagination
- Custom renderers
- Loading/empty/error states

### 3. Dynamic Form

Config-driven forms with:
- Multiple field types
- Zod validation
- Custom styling
- Loading states

### 4. Authentication & RBAC

- JWT token management
- Route guards
- Permission-based access
- Persistent sessions

### 5. Mock System

Complete mock implementation:
- JSON data files
- Mock services with delays
- Full CRUD operations
- Easy to switch to real API

## Documentation

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for:
- Detailed setup instructions
- Folder structure explanation
- Adding new features
- Using components
- Authentication flow
- Menu system
- Switching to real backend
- Best practices
- Common mistakes

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **TanStack Query** - Server state & caching
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Recharts** - Charts library
- **Lucide React** - Icon library

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code
npm run typecheck  # Type check
```

## Switching to Real Backend

1. Update `AppConfig`:
   ```typescript
   api: {
     useMockData: false,
     baseURL: 'https://your-api.com',
   }
   ```

2. All API services already support both mock and real endpoints

3. Update token management if needed

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed instructions.

## License

MIT
