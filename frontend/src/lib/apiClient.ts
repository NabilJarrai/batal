import { AuthService } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private async fetchWithAuth(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const token = AuthService.getAccessToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const url = `${API_URL}${endpoint}`;
    console.log('API Request:', options.method || 'GET', url);
    console.log('Headers:', headers);
    if (options.body) {
      console.log('Body:', options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('Response status:', response.status);

    if (response.status === 401) {
      console.log('Unauthorized - redirecting to login');
      AuthService.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return response;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithAuth(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      let errorMessage = `Failed to post to ${endpoint}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {}
      console.error('API Error:', errorMessage, 'Status:', response.status);
      throw new Error(errorMessage);
    }
    if (response.headers.get('content-length') === '0') {
      return {} as T;
    }
    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Failed to put to ${endpoint}: ${response.statusText}`);
    }
    if (response.headers.get('content-length') === '0') {
      return {} as T;
    }
    return response.json();
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Failed to patch ${endpoint}: ${response.statusText}`);
    }
    if (response.headers.get('content-length') === '0') {
      return {} as T;
    }
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${endpoint}: ${response.statusText}`);
    }
    if (response.headers.get('content-length') === '0') {
      return {} as T;
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();