import { 
  Skill, 
  SkillCreateRequest, 
  SkillUpdateRequest, 
  SkillOrderRequest,
  SkillFilters,
  SkillCategory,
  SkillLevel 
} from '@/types/skills';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class SkillsAPI {
  private async getAuthHeaders() {
    const token = localStorage.getItem('jwt_token');
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

  // Admin-only endpoints
  async create(data: SkillCreateRequest): Promise<Skill> {
    const response = await fetch(`${API_BASE}/skills`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<Skill>(response);
  }

  async update(id: number, data: SkillUpdateRequest): Promise<Skill> {
    const response = await fetch(`${API_BASE}/skills/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<Skill>(response);
  }

  async delete(id: number): Promise<string> {
    const response = await fetch(`${API_BASE}/skills/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<string>(response);
  }

  async bulkCreate(skills: SkillCreateRequest[]): Promise<Skill[]> {
    const response = await fetch(`${API_BASE}/skills/bulk`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(skills),
    });

    return this.handleResponse<Skill[]>(response);
  }

  async initializeDefaults(): Promise<string> {
    const response = await fetch(`${API_BASE}/skills/initialize-defaults`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });
    
    return this.handleResponse<string>(response);
  }

  // Public read-only endpoints
  async getAll(filters?: SkillFilters & { page?: number; size?: number }): Promise<{ content: Skill[]; totalElements: number; totalPages: number; number: number }> {
    const params = new URLSearchParams();
    
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.level) {
      params.append('level', filters.level);
    }
    if (filters?.activeOnly) {
      params.append('activeOnly', 'true');
    }
    if (filters?.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters?.size !== undefined) {
      params.append('size', filters.size.toString());
    }
    
    const queryString = params.toString();
    const url = `${API_BASE}/skills${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });
    
    const result = await this.handleResponse<any>(response);
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(result)) {
      return {
        content: result,
        totalElements: result.length,
        totalPages: 1,
        number: 0
      };
    }
    
    return result;
  }

  async getSkillsForAssessment(playerLevel: SkillLevel): Promise<Skill[]> {
    const response = await fetch(`${API_BASE}/skills/list?level=${playerLevel}&activeOnly=true`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Skill[]>(response);
  }
}

export const skillsAPI = new SkillsAPI();