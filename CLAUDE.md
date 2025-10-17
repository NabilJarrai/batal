# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Batal is a comprehensive football academy management system for youth aged 4-16 years. It features a Spring Boot backend API, Next.js frontend, and tracks player skills, assessments, group management, and analytics for coaches and management.

## Architecture

**Backend**: Java 17 + Spring Boot 3.2.0 with PostgreSQL, JWT auth, MinIO storage, and Maven
**Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Redux Toolkit
**Database**: PostgreSQL with Flyway migrations
**Storage**: MinIO object storage for files
**Deployment**: Docker Compose with multi-environment support

## Development Commands

### Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run          # Run development server
./mvnw test                     # Run tests  
./mvnw clean package           # Build JAR
```

### Frontend (Next.js)
```bash
cd frontend
npm install                     # Install dependencies
npm run dev                     # Run development server
npm run build                   # Build for production
npm run lint                    # Run linting
```

### Infrastructure
```bash
docker-compose up postgres minio -d    # Start only infrastructure
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose up --build               # Rebuild and start
```

## Key Architecture Components

### Backend Structure (`backend/src/main/java/com/batal/`)
- `entity/` - JPA entities (User, Group, Assessment, Skill, etc.)
- `dto/` - Data transfer objects for API requests/responses
- `controller/` - REST controllers (AuthController, UserController, CoachesController)
- `service/` - Business logic layer
- `repository/` - Data access layer with Spring Data JPA
- `security/` - JWT authentication and security config
- `config/` - Application configuration classes

### Frontend Structure (`frontend/src/`)
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components (LoginForm, RoleGuard, etc.)
- `store/` - Redux Toolkit slices and store configuration
- `lib/` - Utilities, API client, and configurations
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks (useRBAC, etc.)

### Database Schema
Core entities: User (players/coaches/admins), Group (age-based), Assessment (monthly evaluations), Skill (athletic/technical/mentality/personality), Schedule, Pitch, Membership, Payment, Communication.

User roles: PLAYER, COACH, ADMIN, MANAGER with hierarchical permissions.

### API Design
RESTful endpoints under `/api`:
- `/auth/*` - Authentication (login, register)
- `/users/*` - User management (CRUD, status updates)
- `/coaches/*` - Coach-specific operations
- `/groups/*` - Group management
- `/assessments/*` - Skill assessments
- `/pitches/*` - Pitch and scheduling

## Key Features & Business Logic

### User Management
- JWT-based auth with bcrypt password hashing
- Role-based access control (RBAC)
- Age-based automatic group assignment
- Status tracking (ACTIVE/INACTIVE with reasons)

### Group System
Development & Advanced levels with age groups:
- Cookies (4-6), Dolphins (7-10), Tigers (11-13), Lions (14-16)

### Assessment System
Four skill categories:
1. **Athletic**: General Motor Skills, Strength, Running, Speed
2. **Technical**: Receiving/Control, Passing, Dribbling, Shooting, Defending
3. **Mentality**: Technical Player, Team Player, Game IQ
4. **Personality**: Discipline, Coachable, Flair, Creativity

## Configuration

### Environment Variables
Backend uses `application.properties` with:
- PostgreSQL: `localhost:5432/batal_db` 
- JWT secret (change in production)
- MinIO: `localhost:9000`
- SMTP for email notifications
- CORS origins for frontend URLs

Frontend uses `.env.local` for API URL configuration.

## Development Guidelines

### Code Conventions
- Backend: Follow Spring Boot conventions, use DTOs for API boundaries
- Frontend: TypeScript strict mode, Tailwind for styling, functional components with hooks
- Database: Flyway migrations in `backend/src/main/resources/db/migration/`

### Testing
- Backend: Spring Boot Test with JUnit
- Frontend: Jest and Testing Library (when configured)

### Security
- JWT tokens stored in localStorage (frontend)
- CORS configured for development and production origins
- Input validation on API endpoints
- Role-based route protection in frontend

## Current Status
- Basic project structure and authentication completed
- Core entities and database schema implemented  
- User management and JWT auth working
- Frontend login and role-based routing implemented
- Ready for feature development (assessments, groups, analytics)

Check `COMPLETE_ISSUES_LIST.md` for detailed development roadmap and current phase progress.