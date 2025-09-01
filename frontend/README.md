# Batal Frontend

This is the frontend application for the Batal Football Academy Management System built with Next.js.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API (to be implemented)
- **HTTP Client**: Fetch API / Axios (to be implemented)
- **Authentication**: JWT tokens (to be implemented)
- **Charts**: Chart.js / Recharts (to be implemented)

## Prerequisites

- Node.js 18.17 or higher
- npm or yarn package manager

## Quick Start

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=Batal Academy

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Other configurations will be added as needed
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   └── types/
├── public/
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Development Guidelines

### Components

- Use functional components with hooks
- Follow TypeScript best practices
- Implement proper prop typing
- Create reusable UI components

### Styling

- Use Tailwind CSS utility classes
- Create custom components for complex styling
- Maintain responsive design principles
- Follow academy branding guidelines

### State Management

- Use React Context for global state
- Implement proper state patterns
- Handle loading and error states

### API Integration

- Create service layers for API calls
- Implement proper error handling
- Use TypeScript interfaces for API responses
- Handle authentication tokens

## Features to Implement

1. **Authentication System**

   - Login/logout functionality
   - Role-based navigation
   - Protected routes

2. **User Dashboards**

   - Player dashboard
   - Coach dashboard
   - Admin dashboard
   - Manager dashboard

3. **Assessment System**

   - Assessment forms
   - Progress charts
   - Historical data views

4. **Reports & Analytics**

   - PDF generation
   - Chart visualizations
   - Export functionality

5. **Communication**

   - Comments and complaints
   - Notification system

6. **File Management**
   - File upload/download
   - Image handling
   - Document viewing

## UI/UX Guidelines

- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimize for fast loading
- **User Experience**: Intuitive navigation and clear feedback

## Next Steps

This is a basic Next.js project setup. The following components need to be implemented:

1. Authentication system and protected routes
2. API service layer and HTTP client setup
3. Global state management
4. UI component library
5. Role-based dashboard layouts
6. Form handling and validation
7. Chart and analytics components
8. File upload and management
9. Email integration and notifications
