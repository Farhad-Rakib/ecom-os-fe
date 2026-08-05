import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AppConfig } from '../config/app.config';
import { ContentType, HttpRequestConfig } from './http.types';
import { toast } from '../../components/ui/Toast/toast.store';

export interface IBaseRepository {
  get<T>(url: string, config?: HttpRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  delete<T>(url: string, config?: HttpRequestConfig): Promise<T>;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

export class BaseRepository implements IBaseRepository {
  protected client: AxiosInstance;
  private basePath: string;

  constructor(basePath: string = '', contentType: ContentType = 'application/json') {
    this.basePath = basePath;

    this.client = axios.create({
      baseURL: AppConfig.api.baseURL,
      timeout: AppConfig.api.timeout,
      withCredentials: AppConfig.api.withCredentials,
      headers: {
        'Content-Type': contentType,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const tenantSlug = this.getTenantSlug();
        if (tenantSlug && config.headers) {
          config.headers['X-Tenant-Id'] = tenantSlug;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Global, not per-caller: both are new response codes as of this backend release, and
        // most queries (background menu/dashboard fetches, etc.) have no local onError handler at
        // all -- without this, a suspended/expired tenant or a rate-limited request just fails
        // silently with no visible explanation to the user.
        if (error.response?.status === 402) {
          toast.error(error.response?.data?.message || 'This tenant’s subscription is not active. Contact your admin.');
        } else if (error.response?.status === 429) {
          toast.warning(error.response?.data?.message || 'Too many requests. Please slow down and try again shortly.');
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            this.handleAuthError();
            return Promise.reject(error);
          }

          try {
            const tenantSlug = this.getTenantSlug();
            const response = await axios.post(
              `${AppConfig.api.baseURL}/Auth/refresh`,
              { refreshToken },
              {
                headers: {
                  'Content-Type': 'application/json',
                  ...(tenantSlug ? { 'X-Tenant-Id': tenantSlug } : {}),
                },
              }
            );

            const newAccessToken = response.data.data.accessToken;
            const newRefreshToken = response.data.data.refreshToken;

            this.setToken(newAccessToken);
            this.setRefreshToken(newRefreshToken);

            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    const raw = storage.getItem(AppConfig.auth.tokenKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.accessToken || null;
    } catch {
      return raw;
    }
  }

  private getTenantSlug(): string | null {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    const raw = storage.getItem(AppConfig.auth.tokenKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tenantSlug || null;
    } catch {
      return null;
    }
  }

  private getRefreshToken(): string | null {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    const raw = storage.getItem(AppConfig.auth.tokenKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.refreshToken || null;
    } catch {
      return storage.getItem(AppConfig.auth.refreshTokenKey);
    }
  }

  private setToken(token: string): void {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    const raw = storage.getItem(AppConfig.auth.tokenKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = token;
      storage.setItem(AppConfig.auth.tokenKey, JSON.stringify(parsed));
    } catch {
      // noop
    }
  }

  private setRefreshToken(token: string): void {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    const raw = storage.getItem(AppConfig.auth.tokenKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      parsed.state.refreshToken = token;
      storage.setItem(AppConfig.auth.tokenKey, JSON.stringify(parsed));
    } catch {
      // noop
    }
  }

  private handleAuthError(): void {
    const storage = AppConfig.auth.storageType === 'localStorage' ? localStorage : sessionStorage;
    storage.removeItem(AppConfig.auth.tokenKey);
    if (window.location.pathname !== AppConfig.auth.loginPath) {
      window.location.href = AppConfig.auth.loginPath;
    }
  }

  private buildUrl(url: string): string {
    return this.basePath ? `${this.basePath}${url}` : url;
  }

  private buildAxiosConfig(config?: HttpRequestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {};

    if (config?.params) {
      axiosConfig.params = config.params;
    }

    if (config?.headers || config?.contentType) {
      axiosConfig.headers = {
        ...config?.headers,
      };
      if (config?.contentType) {
        axiosConfig.headers['Content-Type'] = config.contentType;
      }
    }

    return axiosConfig;
  }

  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.get<T>(this.buildUrl(url), this.buildAxiosConfig(config));
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.post<T>(this.buildUrl(url), data, this.buildAxiosConfig(config));
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.put<T>(this.buildUrl(url), data, this.buildAxiosConfig(config));
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(this.buildUrl(url), data, this.buildAxiosConfig(config));
    return response.data;
  }

  async delete<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(this.buildUrl(url), this.buildAxiosConfig(config));
    return response.data;
  }
}
