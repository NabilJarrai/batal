import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import assessmentReducer from "./assessmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assessments: assessmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
