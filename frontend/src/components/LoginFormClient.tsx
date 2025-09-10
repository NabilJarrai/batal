"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { loginUser, clearError } from "@/store/authSlice";

export default function LoginFormClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error, user, dispatch } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.roles?.includes('ADMIN')) {
        router.push('/admin');
      } else if (user.roles?.includes('MANAGER')) {
        router.push('/manager');
      } else if (user.roles?.includes('COACH')) {
        router.push('/coach');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  // Clear errors when form changes
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
    setValidationErrors({});
  }, [formData.email, formData.password, error, dispatch]);

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Dispatch login action
    await dispatch(loginUser({
      email: formData.email,
      password: formData.password,
    }));
  };

  // Demo credentials for quick access
  const fillDemoCredentials = (role: 'admin' | 'manager' | 'coach') => {
    switch(role) {
      case 'admin':
        setFormData({ email: 'admin@batal.com', password: 'admin123' });
        break;
      case 'manager':
        setFormData({ email: 'manager@batal.com', password: 'manager123' });
        break;
      case 'coach':
        setFormData({ email: 'coach@batal.com', password: 'coach123' });
        break;
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
              validationErrors.email ? 'border-red-500/50' : 'border-white/20'
            } placeholder-blue-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200`}
            placeholder="Enter your email"
          />
          {validationErrors.email && (
            <p className="mt-1 text-xs text-red-300">{validationErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
              validationErrors.password ? 'border-red-500/50' : 'border-white/20'
            } placeholder-blue-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200`}
            placeholder="Enter your password"
          />
          {validationErrors.password && (
            <p className="mt-1 text-xs text-red-300">{validationErrors.password}</p>
          )}
          <div className="mt-2 flex justify-end">
            <button 
              type="button"
              onClick={() => alert('Forgot password functionality coming soon!')}
              className="text-xs text-cyan-300 hover:text-cyan-200 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Remember Me & Submit */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-white/30 rounded bg-white/10 backdrop-blur-sm"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-blue-200">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              <>
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-blue-300 group-hover:text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Sign in to Academy
              </>
            )}
          </button>
        </div>
      </form>

      {/* Demo Credentials */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-blue-200 text-center mb-3">Quick demo access (for testing):</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemoCredentials('admin')}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-xs text-purple-200 transition-all"
          >
            <div className="font-medium">Admin</div>
            <div className="text-[10px] opacity-75">Full access</div>
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('manager')}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs text-red-200 transition-all"
          >
            <div className="font-medium">Manager</div>
            <div className="text-[10px] opacity-75">Analytics</div>
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('coach')}
            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs text-blue-200 transition-all"
          >
            <div className="font-medium">Coach</div>
            <div className="text-[10px] opacity-75">Groups</div>
          </button>
        </div>
      </div>
    </>
  );
}