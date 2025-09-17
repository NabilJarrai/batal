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

  async unfinalize(id: number): Promise<Assessment> {
    const response = await fetch(`${API_BASE}/assessments/${id}/unfinalize`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment>(response);
  }

  // Read operations
  async getAll(filters?: AssessmentFilters): Promise<Assessment[]> {
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
    if (filters?.isFinalized !== undefined) {
      params.append('isFinalized', filters.isFinalized.toString());
    }
    if (filters?.assessorId) {
      params.append('assessorId', filters.assessorId.toString());
    }
    
    const queryString = params.toString();
    const url = `${API_BASE}/assessments${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

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

  async getByPeriod(period: AssessmentPeriod): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/period/${period}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getByPlayerAndPeriod(playerId: number, period: AssessmentPeriod): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/player/${playerId}/period/${period}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getByAssessor(assessorId: number): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/assessor/${assessorId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  // Assessment management operations  
  async getPending(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/pending`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getCompleted(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/completed`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getRecent(limit: number = 10): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/recent?limit=${limit}`, {
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

  async getPlayerHistory(playerId: number): Promise<AssessmentHistory> {
    const response = await fetch(`${API_BASE}/assessments/player/${playerId}/history`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<AssessmentHistory>(response);
  }

  async getPlayerProgress(playerId: number, months: number = 12): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/player/${playerId}/progress?months=${months}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  // Validation operations
  async checkDuplicateAssessment(playerId: number, period: AssessmentPeriod, date: string): Promise<boolean> {
    const response = await fetch(
      `${API_BASE}/assessments/check-duplicate?playerId=${playerId}&period=${period}&date=${date}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<boolean>(response);
  }

  async canCreateAssessment(playerId: number, period: AssessmentPeriod): Promise<boolean> {
    const response = await fetch(
      `${API_BASE}/assessments/can-create?playerId=${playerId}&period=${period}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<boolean>(response);
  }

  // Coach-specific operations
  async getCoachAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/my-assessments`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getCoachPendingAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/my-pending`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async getGroupAssessments(groupId: number): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/group/${groupId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  // Bulk operations
  async createBulkAssessments(requests: AssessmentCreateRequest[]): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/bulk`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(requests),
    });
    
    return this.handleResponse<Assessment[]>(response);
  }

  async finalizeBulkAssessments(assessmentIds: number[]): Promise<Assessment[]> {
    const response = await fetch(`${API_BASE}/assessments/bulk-finalize`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ assessmentIds }),
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

  // Helper methods for frontend
  async saveDraft(data: AssessmentCreateRequest | AssessmentUpdateRequest, id?: number): Promise<Assessment> {
    if (id) {
      return this.update(id, data as AssessmentUpdateRequest);
    } else {
      return this.create(data as AssessmentCreateRequest);
    }
  }

  async getAssessmentsForCoachDashboard(): Promise<{
    pending: Assessment[];
    recent: Assessment[];
    summary: AssessmentSummary;
  }> {
    const [pending, recent, summary] = await Promise.all([
      this.getCoachPendingAssessments(),
      this.getRecent(5),
      this.getSummary()
    ]);

    return { pending, recent, summary };
  }

  async getPlayerAssessmentOverview(playerId: number): Promise<{
    latest: Assessment | null;
    history: Assessment[];
    canCreateNew: boolean;
  }> {
    const [assessments, canCreate] = await Promise.all([
      this.getByPlayer(playerId),
      this.canCreateAssessment(playerId, AssessmentPeriod.MONTHLY)
    ]);

    const sortedAssessments = assessments.sort((a, b) => 
      new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
    );

    return {
      latest: sortedAssessments[0] || null,
      history: sortedAssessments,
      canCreateNew: canCreate
    };
  }
}

export const assessmentsAPI = new AssessmentsAPI();