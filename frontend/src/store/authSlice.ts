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
  children: undefined,
  selectedChildId: undefined,
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
        children: response.children,
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

// Password setup (for new users via email token)
export const setupPasswordWithToken = createAsyncThunk(
  "auth/setupPassword",
  async (setupData: { token: string; password: string; confirmPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.setupPassword(setupData);
      // Store token in localStorage
      tokenManager.setToken(response.token);

      // Extract user data from response
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
        children: response.children,
      };
    } catch (error) {
      // Log error for debugging
      logError(error, 'Password setup failed');

      tokenManager.removeToken();
      return rejectWithValue(
        error instanceof Error ? error.message : "Password setup failed"
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

        // If user is a parent, fetch their children
        let children = undefined;
        if (currentUser.children && currentUser.children.length > 0) {
          children = currentUser.children;
        }

        // Restore selectedChildId from localStorage
        let selectedChildId = undefined;
        if (typeof window !== 'undefined') {
          const storedChildId = localStorage.getItem('selectedChildId');
          if (storedChildId && children && children.length > 0) {
            const childId = parseInt(storedChildId, 10);
            // Verify the stored child ID exists in the children array
            if (children.some(child => child.id === childId)) {
              selectedChildId = childId;
            } else {
              // If stored child doesn't exist, select first child
              selectedChildId = children[0].id;
              localStorage.setItem('selectedChildId', selectedChildId.toString());
            }
          } else if (children && children.length > 0) {
            // Auto-select first child if no selection stored
            selectedChildId = children[0].id;
            localStorage.setItem('selectedChildId', selectedChildId.toString());
          }
        }

        return {
          token,
          user: currentUser,
          children,
          selectedChildId,
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
      state.children = undefined;
      state.selectedChildId = undefined;
      tokenManager.removeToken();
      // Clear selectedChildId from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedChildId');
      }
    },
    clearError: (state) => {
      state.error = null;
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
    selectChild: (state, action: PayloadAction<number>) => {
      state.selectedChildId = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedChildId', action.payload.toString());
      }
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
        state.children = action.payload.children;
        // Auto-select first child if parent has children
        if (action.payload.children && action.payload.children.length > 0) {
          state.selectedChildId = action.payload.children[0].id;
          // Persist to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedChildId', action.payload.children[0].id.toString());
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
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

      // Setup password cases
      .addCase(setupPasswordWithToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setupPasswordWithToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.children = action.payload.children;
        // Auto-select first child if parent has children
        if (action.payload.children && action.payload.children.length > 0) {
          state.selectedChildId = action.payload.children[0].id;
          // Persist to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedChildId', action.payload.children[0].id.toString());
          }
        }
      })
      .addCase(setupPasswordWithToken.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
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
          state.children = action.payload.children;
          state.selectedChildId = action.payload.selectedChildId;
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

export const { logout, clearError, setCredentials, selectChild } = authSlice.actions;
export default authSlice.reducer;
