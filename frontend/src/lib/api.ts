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

// Generic API fetch wrapper with JWT support
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

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
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
};

// Coaches API calls (example for future use)
export const coachesAPI = {
  getAll: async (): Promise<UserResponse[]> => {
    return apiRequest<UserResponse[]>("/coaches");
  },

  getById: async (id: number): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/coaches/${id}`);
  },

  create: async (coachData: RegisterRequest): Promise<UserResponse> => {
    return apiRequest<UserResponse>("/coaches", {
      method: "POST",
      body: JSON.stringify(coachData),
    });
  },

  update: async (
    id: number,
    coachData: Partial<RegisterRequest>
  ): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/coaches/${id}`, {
      method: "PUT",
      body: JSON.stringify(coachData),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/coaches/${id}`, {
      method: "DELETE",
    });
  },
};
