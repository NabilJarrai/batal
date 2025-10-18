"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/store/hooks";
import { registerUser, loginUser, clearError } from "@/store/authSlice";
import { UserRole } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading, error, dispatch } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: UserRole.COACH,
    termsAccepted: false,
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phoneNumber?: string;
    termsAccepted?: string;
  }>({});

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Clear errors when form changes
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
    setValidationErrors({});
  }, [formData]);

  const validateStep1 = () => {
    const errors: typeof validationErrors = {};
    
    if (!formData.fullName) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.length < 3) {
      errors.fullName = "Name must be at least 3 characters";
    }
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: typeof validationErrors = {};
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase and number";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the terms and conditions";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    // Dispatch register action
    const result = await dispatch(registerUser({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
    }));

    if (registerUser.fulfilled.match(result)) {
      setRegistrationSuccess(true);
      
      // Auto-login after successful registration
      setTimeout(async () => {
        await dispatch(loginUser({
          email: formData.email,
          password: formData.password,
        }));
        router.push('/');
      }, 2000);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: "", color: "" };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const strengthLevels = [
      { text: "Very Weak", color: "bg-red-500" },
      { text: "Weak", color: "bg-orange-500" },
      { text: "Fair", color: "bg-yellow-500" },
      { text: "Good", color: "bg-blue-500" },
      { text: "Strong", color: "bg-green-500" },
    ];

    return { 
      strength: (strength / 5) * 100, 
      ...strengthLevels[Math.min(strength, 4)]
    };
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-blue-200 mb-4">Your account has been created successfully.</p>
          <p className="text-sm text-blue-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-2xl w-fit">
            <div className="relative w-24 h-24 mx-auto">
              <Image
                src="/Logo.jpeg"
                alt="Batal Sports Academy Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-blue-200">Join Batal Football Academy</p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-cyan-300' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-cyan-500/30 border-2 border-cyan-400' : 'bg-gray-600/30 border-2 border-gray-500'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm">Basic Info</span>
            </div>
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-cyan-300' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-cyan-500/30 border-2 border-cyan-400' : 'bg-gray-600/30 border-2 border-gray-500'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm">Security</span>
            </div>
          </div>
        </div>

        {/* Registration Form Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Step 1: Basic Information */}
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-blue-200 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
                      validationErrors.fullName ? 'border-red-500/50' : 'border-white/20'
                    } placeholder-blue-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-xs text-red-300">{validationErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
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

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-blue-200 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
                      validationErrors.phoneNumber ? 'border-red-500/50' : 'border-white/20'
                    } placeholder-blue-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200`}
                    placeholder="+1234567890"
                  />
                  {validationErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-300">{validationErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Select Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(UserRole).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`px-3 py-2 rounded-lg border transition-all ${
                          formData.role === role
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                            : 'bg-white/5 border-white/20 text-blue-200 hover:bg-white/10'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Next Step →
                </button>
              </>
            )}

            {/* Step 2: Security */}
            {step === 2 && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
                      validationErrors.password ? 'border-red-500/50' : 'border-white/20'
                    } placeholder-blue-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200`}
                    placeholder="Create a strong password"
                  />
                  {validationErrors.password && (
                    <p className="mt-1 text-xs text-red-300">{validationErrors.password}</p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-blue-200">Password strength</span>
                        <span className="text-xs text-blue-300">{getPasswordStrength().text}</span>
                      </div>
                      <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getPasswordStrength().color}`}
                          style={{ width: `${getPasswordStrength().strength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
                      validationErrors.confirmPassword ? 'border-red-500/50' : 'border-white/20'
                    } placeholder-blue-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200`}
                    placeholder="Re-enter your password"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-300">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-white/30 rounded bg-white/10 backdrop-blur-sm mt-0.5"
                    />
                    <span className="ml-2 text-sm text-blue-200">
                      I agree to the{" "}
                      <Link href="/terms" className="text-cyan-300 hover:text-cyan-200 underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-cyan-300 hover:text-cyan-200 underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {validationErrors.termsAccepted && (
                    <p className="mt-1 text-xs text-red-300">{validationErrors.termsAccepted}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full py-3 px-4 border border-white/20 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/5 transition-all duration-200"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-blue-200">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-100 transition-colors duration-200 underline underline-offset-4">
              Sign in
            </Link>
          </p>
          <p className="text-sm text-blue-200">
            <Link href="/" className="font-medium text-cyan-300 hover:text-cyan-100 transition-colors duration-200">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}