import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginRequestDto } from '../../../domain/dto/auth.dto';
import { authApi } from '../../../core/api/services/auth.api';
import { menuApi } from '../../../core/api/services/menu.api';
import { AppConfig } from '../../../core/config/app.config';
import { queryClient } from '../../../app/providers/AppProviders';
import { useSiteSettingsStore } from '../../../core/stores/site-settings.store';

interface TokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  tenant_id?: string;
  [key: string]: any;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenPayload: TokenPayload | null;
  tenantSlug: string | null;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenPayload: null,
      tenantSlug: null,

      login: async (dto: LoginRequestDto) => {
        set({ isLoading: true, error: null, tenantSlug: dto.tenantSlug });
        try {
          const response = await authApi.login(dto);
          const payload = decodeJwtPayload(response.tokens.accessToken);

          set({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenPayload: payload,
          });

          useSiteSettingsStore.getState().setBranding(response.branding);

          queryClient.prefetchQuery({
            queryKey: ['menu'],
            queryFn: () => menuApi.getMenuItems(),
          });
        } catch (error: any) {
          const message = error?.response?.data?.message || error?.message || 'Login failed';
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          queryClient.clear();

          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tokenPayload: null,
            tenantSlug: null,
          });

          const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
          storage.removeItem(AppConfig.auth.tokenKey);
        }
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: string): boolean => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        const perms = tokenPayload.permissions || tokenPayload.permission || [];
        if (Array.isArray(perms)) return perms.includes(permission);
        return false;
      },

      hasAnyPermission: (permissions: string[]): boolean => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        const perms: string[] = tokenPayload.permissions || tokenPayload.permission || [];
        if (!Array.isArray(perms)) return false;
        return permissions.some(p => perms.includes(p));
      },

      hasAllPermissions: (permissions: string[]): boolean => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        const perms: string[] = tokenPayload.permissions || tokenPayload.permission || [];
        if (!Array.isArray(perms)) return false;
        return permissions.every(p => perms.includes(p));
      },
    }),
    {
      name: AppConfig.auth.tokenKey,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenPayload: state.tokenPayload,
        tenantSlug: state.tenantSlug,
      }),
    }
  )
);
