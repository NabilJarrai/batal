"use client";

import {
  HeartIcon,
  ClockIcon,
  SparklesIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

export default function NutritionProgram() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-accent-teal/5 via-white to-accent-yellow/5 rounded-2xl p-12 border border-gray-100 shadow-lg text-center">
        <div className="max-w-3xl mx-auto">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-accent-teal/10 rounded-full mb-8">
            <HeartIcon className="w-12 h-12 text-accent-teal" />
          </div>

          {/* Main Content */}
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Nutrition Program
          </h1>
          <p className="text-xl text-text-secondary mb-8 leading-relaxed">
            Fuel your performance with personalized nutrition guidance designed specifically for young athletes
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-3 bg-accent-yellow/20 text-accent-yellow px-8 py-4 rounded-full text-lg font-semibold mb-8">
            <SparklesIcon className="w-6 h-6" />
            Coming Soon
          </div>

          {/* Description */}
          <p className="text-text-secondary max-w-2xl mx-auto">
            We're developing a comprehensive nutrition program that will help you optimize your diet,
            boost your energy levels, and enhance your athletic performance.
          </p>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center hover:shadow-xl transition-all">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <BoltIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Personalized Meal Plans
          </h3>
          <p className="text-text-secondary">
            Custom meal plans tailored to your training schedule, dietary preferences, and performance goals.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center hover:shadow-xl transition-all">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-teal/10 rounded-full mb-6">
            <ClockIcon className="w-8 h-8 text-accent-teal" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Pre & Post Training Nutrition
          </h3>
          <p className="text-text-secondary">
            Optimize your energy and recovery with specific nutrition guidance for before and after training.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center hover:shadow-xl transition-all">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-yellow/10 rounded-full mb-6">
            <HeartIcon className="w-8 h-8 text-accent-yellow" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Healthy Habits Tracking
          </h3>
          <p className="text-text-secondary">
            Build sustainable nutrition habits with easy-to-follow guidelines and progress tracking.
          </p>
        </div>
      </div>

      {/* What's Coming */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
        <h2 className="text-2xl font-bold text-text-primary mb-6">What's Coming</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">For Players</h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                Interactive meal planning tools
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                Hydration tracking and reminders
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                Nutritional education content
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                Recipe suggestions for young athletes
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">For Coaches</h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-teal rounded-full mt-2 flex-shrink-0"></div>
                Team nutrition program management
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-teal rounded-full mt-2 flex-shrink-0"></div>
                Player nutrition progress monitoring
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-teal rounded-full mt-2 flex-shrink-0"></div>
                Nutritional guidelines distribution
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-teal rounded-full mt-2 flex-shrink-0"></div>
                Integration with performance assessments
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent-teal/10 to-primary/10 rounded-2xl p-8 border border-gray-100 text-center">
        <h3 className="text-2xl font-bold text-text-primary mb-4">
          Stay Tuned for Updates
        </h3>
        <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
          We're working hard to bring you the best nutrition guidance for young athletes.
          Keep training hard and eating well in the meantime!
        </p>
        <div className="inline-flex items-center gap-2 text-primary font-medium">
          <SparklesIcon className="w-5 h-5" />
          <span>Coming Soon - Nutrition Program</span>
        </div>
      </div>
    </div>
  );
}