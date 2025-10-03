import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  AuthState,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  UserResponse,
} from "@/types/auth";
import { authAPI, tokenManager, usersAPI } from "@/lib/api";
import { logError } from "@/lib/utils";

// Helper function to decode JWT token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isFirstLogin: false,
};

// Async thunks for authentication actions
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      // Store token in localStorage
      tokenManager.setToken(response.token);
      
      // The API returns a response with token and user fields mixed together
      // Extract user data and create proper UserResponse format
      const userResponse: UserResponse = {
        id: response.id,
        email: response.email,
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        roles: response.roles || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        user: userResponse,
        token: response.token,
        isFirstLogin: response.firstLogin
      };
    } catch (error) {
      // Log error for debugging
      logError(error, 'Login attempt failed');

      tokenManager.removeToken();
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      // Log error for debugging
      logError(error, 'Registration attempt failed');

      return rejectWithValue(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  }
);

// Initialize auth state from localStorage
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const token = tokenManager.getToken();
      if (!token) {
        return null;
      }

      // Decode the token to get user info
      const tokenData = parseJwt(token);
      if (!tokenData) {
        tokenManager.removeToken();
        return null;
      }

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (tokenData.exp && tokenData.exp < currentTime) {
        tokenManager.removeToken();
        return null;
      }

      // Try to fetch current user data from API
      try {
        const currentUser = await usersAPI.getCurrentUser();
        return {
          token,
          user: currentUser,
        };
      } catch {
        // If API call fails, use data from token
        const userResponse: UserResponse = {
          id: tokenData.userId || tokenData.sub,
          email: tokenData.email || tokenData.username,
          firstName: tokenData.firstName || '',
          lastName: tokenData.lastName || '',
          roles: tokenData.roles || [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return {
          token,
          user: userResponse,
        };
      }
    } catch (error) {
      // Log error for debugging
      logError(error, 'Auth initialization failed');

      tokenManager.removeToken();
      return rejectWithValue("Token invalid or expired");
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isFirstLogin = false;
      tokenManager.removeToken();
    },
    clearError: (state) => {
      state.error = null;
    },
    setFirstLoginCompleted: (state) => {
      state.isFirstLogin = false;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserResponse; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.isFirstLogin = action.payload.isFirstLogin;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        state.isFirstLogin = false;
      })

      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // Registration successful, but user still needs to login
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Initialize auth cases
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, setCredentials, setFirstLoginCompleted } = authSlice.actions;
export default authSlice.reducer;
