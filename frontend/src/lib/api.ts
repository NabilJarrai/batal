// API configuration and utility functions
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  UserResponse,
} from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jwt_token");
    }
    return null;
  },

  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("jwt_token", token);
    }
  },

  removeToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token");
    }
  },
};

// Enhanced error interface for better error handling
interface APIError {
  message: string;
  status: number;
  type: 'AUTHENTICATION' | 'VALIDATION' | 'NETWORK' | 'SERVER' | 'UNKNOWN';
  details?: any;
}

// Create enhanced error object
function createAPIError(response: Response, errorData: any = {}): APIError {
  const status = response.status;
  let type: APIError['type'] = 'UNKNOWN';
  let message = errorData.message || `HTTP error! status: ${status}`;

  // Categorize errors based on status code or backend error code
  switch (status) {
    case 401:
      type = 'AUTHENTICATION';
      // Use backend error message if available, otherwise default message
      if (!errorData.message) {
        message = 'Invalid email or password. Please check your credentials and try again.';
      }
      break;
    case 403:
      type = 'AUTHENTICATION';
      if (!errorData.message) {
        message = 'Access denied. Please contact your administrator.';
      }
      break;
    case 400:
      type = 'VALIDATION';
      if (!errorData.message) {
        message = 'Please check your input and try again.';
      }
      break;
    case 404:
      type = 'NETWORK';
      if (!errorData.message) {
        message = 'Service not available. Please try again later.';
      }
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      type = 'SERVER';
      if (!errorData.message) {
        message = 'Server error. Please try again in a few moments.';
      }
      break;
    default:
      if (status >= 400 && status < 500) {
        type = 'VALIDATION';
      } else if (status >= 500) {
        type = 'SERVER';
      }
  }

  // Override type based on backend errorCode if available
  if (errorData.errorCode) {
    switch (errorData.errorCode) {
      case 'AUTHENTICATION_FAILED':
        type = 'AUTHENTICATION';
        break;
      case 'VALIDATION_ERROR':
      case 'CONSTRAINT_VIOLATION':
        type = 'VALIDATION';
        break;
      case 'ACCESS_DENIED':
        type = 'AUTHENTICATION';
        break;
    }
  }

  return { message, status, type, details: errorData };
}

// Generic API fetch wrapper with enhanced error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenManager.getToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle structured error response from backend (ErrorResponse class)
      let message = errorData.message || `HTTP error! status: ${response.status}`;

      // If we have a structured error response, use its message
      if (errorData.error && errorData.message) {
        message = errorData.message;
      }

      const apiError = createAPIError(response, { ...errorData, message });

      // Create an Error object with enhanced properties
      const error = new Error(apiError.message) as Error & APIError;
      error.status = apiError.status;
      error.type = apiError.type;
      error.details = apiError.details;

      throw error;
    }

    return response.json();
  } catch (error) {
    // Handle network errors (fetch failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network connection failed. Please check your internet connection and try again.') as Error & APIError;
      networkError.status = 0;
      networkError.type = 'NETWORK';
      throw networkError;
    }

    // Re-throw API errors as-is
    throw error;
  }
}

// Auth API calls
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: RegisterRequest): Promise<UserResponse> => {
    return apiRequest<UserResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Password setup via email
  validateSetupToken: async (token: string): Promise<{
    valid: boolean;
    message: string;
    userEmail?: string;
    userName?: string;
  }> => {
    return apiRequest(`/auth/validate-setup-token?token=${encodeURIComponent(token)}`);
  },

  setupPassword: async (data: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>("/auth/setup-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  resendSetupEmail: async (userId: number): Promise<{ message: string; userId: number }> => {
    return apiRequest(`/auth/resend-setup-email/${userId}`, {
      method: "POST",
    });
  },

  // Password reset (forgot password)
  forgotPassword: async (email: string): Promise<{ message: string; email: string }> => {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  validateResetToken: async (token: string): Promise<{
    valid: boolean;
    message: string;
    email?: string;
    userName?: string;
  }> => {
    return apiRequest(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
  },

  resetPassword: async (data: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ message: string }> => {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Users API calls  
export const usersAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'firstName', sortDir = 'asc', search?: string): Promise<{
    content: UserResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return apiRequest(`/users?${params.toString()}`);
  },


  getById: async (id: number): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${id}`);
  },

  create: async (userData: any): Promise<UserResponse> => {
    return apiRequest<UserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  update: async (id: number, userData: any): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  updateStatus: async (id: number, statusData: any): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },

  // Coach-specific endpoints
  getAvailableCoaches: async (): Promise<UserResponse[]> => {
    return apiRequest<UserResponse[]>("/users/coaches/available");
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    return apiRequest<UserResponse>("/users/me");
  },

  // Parent-child management endpoints
  assignChild: async (parentId: number, playerId: number): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${parentId}/children`, {
      method: "POST",
      body: JSON.stringify({ playerId }),
    });
  },

  unassignChild: async (parentId: number, playerId: number): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${parentId}/children/${playerId}`, {
      method: "DELETE",
    });
  },
};

// Players API calls
export const playersAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'firstName', sortDir = 'asc', search?: string): Promise<{
    content: any[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return apiRequest(`/players?${params.toString()}`);
  },

  getAllList: async (): Promise<any[]> => {
    // Get unpaginated list of all players
    const response = await apiRequest<any>(`/players?size=1000`);
    return response.content || response || [];
  },

  getById: async (id: number): Promise<any> => {
    return apiRequest<any>(`/players/${id}`);
  },

  create: async (playerData: any): Promise<any> => {
    return apiRequest<any>("/players", {
      method: "POST",
      body: JSON.stringify(playerData),
    });
  },

  update: async (id: number, playerData: any): Promise<any> => {
    return apiRequest<any>(`/players/${id}`, {
      method: "PUT", 
      body: JSON.stringify(playerData),
    });
  },

  deactivate: async (id: number, reason: string): Promise<any> => {
    return apiRequest<any>(`/players/${id}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },

  reactivate: async (id: number): Promise<any> => {
    return apiRequest<any>(`/players/${id}/reactivate`, {
      method: "PATCH",
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/players/${id}`, {
      method: "DELETE",
    });
  },

  getByGroup: async (groupId: number): Promise<any[]> => {
    return apiRequest<any[]>(`/players/group/${groupId}`);
  },

  getStats: async (): Promise<any> => {
    return apiRequest<any>("/players/stats");
  },

  // New assignment endpoints
  getUnassigned: async (): Promise<any[]> => {
    return apiRequest<any[]>("/players/unassigned");
  },

  autoAssignGroup: async (id: number): Promise<any> => {
    return apiRequest<any>(`/players/${id}/auto-assign-group`, {
      method: "POST",
    });
  },
};

// Groups API calls
export const groupsAPI = {
  getAll: async (params?: any): Promise<any> => {
    const queryParams = params ? `?${new URLSearchParams(params)}` : '';
    const response = await apiRequest<any>(`/groups${queryParams}`);
    // Handle paginated response - return just the content array if it's a Page object
    return response.content || response;
  },

  getById: async (id: number): Promise<any> => {
    return apiRequest<any>(`/groups/${id}`);
  },

  create: async (groupData: any): Promise<any> => {
    return apiRequest<any>("/groups", {
      method: "POST",
      body: JSON.stringify(groupData),
    });
  },

  update: async (id: number, groupData: any): Promise<any> => {
    return apiRequest<any>(`/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(groupData),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/groups/${id}`, {
      method: "DELETE",
    });
  },

  // Specialized group queries
  getAvailable: async (): Promise<any[]> => {
    return apiRequest<any[]>("/groups/available");
  },

  getCoachGroups: async (coachId: number): Promise<any[]> => {
    const response = await apiRequest<any>(`/groups/coach/${coachId}`);
    return Array.isArray(response) ? response : (response.content || []);
  },

  // Assignment operations
  assignPlayer: async (assignmentData: any): Promise<any> => {
    return apiRequest<any>("/groups/assign-player", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
  },

  removePlayer: async (groupId: number, playerId: number): Promise<any> => {
    return apiRequest<any>(`/groups/${groupId}/remove-player/${playerId}`, {
      method: "DELETE",
    });
  },

  assignCoach: async (assignmentData: any): Promise<any> => {
    return apiRequest<any>("/groups/assign-coach", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
  },

  removeCoach: async (groupId: number): Promise<any> => {
    return apiRequest<any>(`/groups/${groupId}/remove-coach`, {
      method: "DELETE",
    });
  },

  // Group status operations
  activate: async (id: number): Promise<any> => {
    return apiRequest<any>(`/groups/${id}/activate`, {
      method: "PATCH",
    });
  },

  deactivate: async (id: number): Promise<any> => {
    return apiRequest<any>(`/groups/${id}/deactivate`, {
      method: "PATCH",
    });
  },
};

// Parent self-service API calls
export const parentAPI = {
  getMyChildren: async (): Promise<any[]> => {
    return apiRequest<any[]>("/parents/me/children");
  },

  getChild: async (playerId: number): Promise<any> => {
    return apiRequest<any>(`/parents/me/children/${playerId}`);
  },

  getChildAssessments: async (playerId: number): Promise<any[]> => {
    return apiRequest<any[]>(`/parents/me/children/${playerId}/assessments`);
  },

  getChildAssessment: async (playerId: number, assessmentId: number): Promise<any> => {
    return apiRequest<any>(`/parents/me/children/${playerId}/assessments/${assessmentId}`);
  },
};

// Export other API modules
export { skillsAPI } from './api/skills';
export { assessmentsAPI } from './api/assessments';
