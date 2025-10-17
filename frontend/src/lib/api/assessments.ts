// Assessment API client
import {
  Assessment,
  AssessmentCreateRequest,
  AssessmentUpdateRequest,
  AssessmentResponse,
  AssessmentFilters,
  AssessmentSummary,
  AssessmentHistory,
  AssessmentPeriod
} from '@/types/assessments';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class AssessmentsAPI {
  private async getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

  // CRUD operations
  async create(data: AssessmentCreateRequest): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<Assessment>(response);
  }

  async update(id: number, data: AssessmentUpdateRequest): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<Assessment>(response);
  }

  async delete(id: number): Promise<string> {
    const response = await fetch(`${API_BASE}/assessments/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<string>(response);
  }

  async finalize(id: number): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments/${id}/finalize`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Assessment>(response);
  }

  // Read operations
  async getById(id: number): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment>(response);
  }

  async getByPlayer(playerId: number): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/player/${playerId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Assessment[]>(response);
  }

  // Analytics and reporting
  async getSummary(filters?: AssessmentFilters): Promise<AssessmentSummary> {
    const params = new URLSearchParams();

    if (filters?.playerId) {
      params.append('playerId', filters.playerId.toString());
    }
    if (filters?.period) {
      params.append('period', filters.period);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo);
    }

    const queryString = params.toString();
    const url = `${API_BASE}/assessments/summary${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<AssessmentSummary>(response);
  }

  // Coach-specific operations
  async getCoachAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/my-assessments`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Assessment[]>(response);
  }

  // Player-specific operations
  async getMyAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/players/me/assessments`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getMyAssessmentById(id: number): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/players/me/assessments/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment>(response);
  }

  async getMyAssessmentAnalytics(): Promise<any> {
    const response = await fetch(`${API_BASE}/assessments/analytics/me`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }
}

export const assessmentsAPI = new AssessmentsAPI();