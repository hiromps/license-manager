import type { ApiResponse, LoginRequest, LoginResponse } from '@license-manager/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(data: { email: string; password: string; name: string; organizationName: string }) {
    const response = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async login(credentials: LoginRequest) {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    this.clearToken();
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Licenses
  async getLicenses(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/licenses${query ? `?${query}` : ''}`);
  }

  async getLicense(id: string) {
    return this.request(`/licenses/${id}`);
  }

  async createLicense(data: any) {
    return this.request('/licenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLicense(id: string, data: any) {
    return this.request(`/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLicense(id: string) {
    return this.request(`/licenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Audit Logs
  async getAuditLogs(params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit/logs${query ? `?${query}` : ''}`);
  }
}

export const api = new ApiClient();
