import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Assessment } from "@/types/assessments";
import { assessmentsAPI } from "@/lib/api/assessments";

interface AssessmentState {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: AssessmentState = {
  assessments: [],
  currentAssessment: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// Async thunks for player assessment operations
export const fetchMyAssessments = createAsyncThunk(
  "assessments/fetchMyAssessments",
  async (_, { rejectWithValue }) => {
    try {
      return await assessmentsAPI.getMyAssessments();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch assessments");
    }
  }
);

export const fetchAssessmentById = createAsyncThunk(
  "assessments/fetchAssessmentById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await assessmentsAPI.getMyAssessmentById(id);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch assessment");
    }
  }
);

export const fetchAssessmentAnalytics = createAsyncThunk(
  "assessments/fetchAssessmentAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      return await assessmentsAPI.getMyAssessmentAnalytics();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch analytics");
    }
  }
);

const assessmentSlice = createSlice({
  name: "assessments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAssessment: (state) => {
      state.currentAssessment = null;
    },
    setCurrentAssessment: (state, action: PayloadAction<Assessment>) => {
      state.currentAssessment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my assessments
      .addCase(fetchMyAssessments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAssessments.fulfilled, (state, action) => {
        state.loading = false;
        state.assessments = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchMyAssessments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch assessment by ID
      .addCase(fetchAssessmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssessment = action.payload;
      })
      .addCase(fetchAssessmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch analytics
      .addCase(fetchAssessmentAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        // Analytics data could be stored in a separate field if needed
      })
      .addCase(fetchAssessmentAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentAssessment, setCurrentAssessment } = assessmentSlice.actions;

// Selectors
export const selectAssessments = (state: { assessments: AssessmentState }) => state.assessments.assessments;
export const selectCurrentAssessment = (state: { assessments: AssessmentState }) => state.assessments.currentAssessment;
export const selectAssessmentLoading = (state: { assessments: AssessmentState }) => state.assessments.loading;
export const selectAssessmentError = (state: { assessments: AssessmentState }) => state.assessments.error;
export const selectLatestAssessment = (state: { assessments: AssessmentState }) => {
  const assessments = state.assessments.assessments;
  if (assessments.length === 0) return null;
  
  return assessments.reduce((latest, current) => {
    const latestDate = new Date(latest.assessmentDate);
    const currentDate = new Date(current.assessmentDate);
    return currentDate > latestDate ? current : latest;
  });
};

export default assessmentSlice.reducer;