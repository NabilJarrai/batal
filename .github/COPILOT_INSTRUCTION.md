# Batal Application - Copilot Instructions

## Project Overview

**Batal Application** is a comprehensive football academy management system for youth aged 4-16 years. The application tracks player skills, manages assessments, handles group assignments, and provides analytics for coaches and management.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Java Spring Boot 3.x
- **Database**: PostgreSQL 15+
- **Storage**: MinIO (local/cloud object storage)
- **Email**: SMTP server integration
- **Authentication**: JWT-based with bcrypt password hashing
- **ERP Integration**: ERPNext for membership payments
- **Deployment**: Docker Compose with GitHub Actions CI/CD

## Project Structure

```text
batal/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utilities and configurations
│   │   ├── types/           # TypeScript type definitions
│   │   └── hooks/           # Custom React hooks
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   └── com/batal/
│   │       ├── config/      # Configuration classes
│   │       ├── controller/  # REST controllers
│   │       ├── service/     # Business logic
│   │       ├── repository/  # Data access layer
│   │       ├── model/       # Entity classes
│   │       ├── dto/         # Data transfer objects
│   │       └── security/    # Security configurations
│   ├── src/main/resources/
│   └── pom.xml
├── docker-compose.yml       # Local development setup
├── .github/workflows/       # GitHub Actions CI/CD
└── docs/                    # Documentation
```

## User Roles & Permissions

### 1. Player

- View personal profile and assessments
- Access skill progress graphs
- View nutrition program
- Submit comments/complaints

### 2. Coach

- View assigned group(s) and players
- Create/update assessments for their groups
- Track group progress
- Reply to player comments

### 3. Admin

- Manage all users (players, coaches, managers)
- Create/edit groups and assign coaches
- Promote players between levels
- Manage pitches and zones
- Access membership management

### 4. Manager

- Full system access
- Academy-wide analytics
- Generate reports
- Review complaints
- Manage memberships

## Core Features

### User Management

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Optional 2FA for Admins/Managers

### Player Profiles

- Basic info: Name, Parent Name, DOB, Contact details
- Level: Development/Advanced
- Group assignment based on age
- Status: Active/Inactive with reasons
- Basic foot preference

### Group Management

**Development Level:**

- Cookies (4-6 years)
- Dolphins (7-10 years)
- Tigers (11-13 years)
- Lions (14-16 years)

**Advanced Level:**

- Same age groups with enhanced training

### Assessment System

**Athletic Skills:**

- General Motor Skills, Strength, Running Technique, Speed 30m

**Technical Skills (Development):**

- Receiving/Control, Passing, Dribbling, Shooting, Defending

**Technical Skills (Advanced additions):**

- Heading, 1-touch techniques, Wall Control

**Mentality Skills:**

- Technical Player, Team Player, Game IQ

**Personality Skills:**

- Discipline, Coachable, Flair/Daring, Creativity

### Pitch Management

- Multiple pitches with zones
- Group assignment to pitch zones
- Time scheduling and availability

### Calendar System

- Weekly/monthly group schedules
- Vacation and off-day management
- Pitch zone assignments

### Membership Management

- Membership types with pricing
- Payment tracking
- ERPNext integration for financial sync

### Reporting & Analytics

- Player progress reports (PDF export)
- Coach evaluation reports
- Manager analytics dashboard
- Email notifications to parents

## Database Schema Guidelines

### Key Entities

- Users (players, coaches, admins, managers)
- Groups (with level and age criteria)
- Assessments (monthly evaluations)
- Pitches and Zones
- Memberships and Payments
- Comments and Complaints

### Relationships

- Users belong to Groups
- Groups have assigned Coaches
- Assessments belong to Players
- Groups are assigned to Pitch Zones

## API Design Principles

### RESTful Endpoints

```text
/api/auth/*          # Authentication
/api/users/*         # User management
/api/groups/*        # Group operations
/api/assessments/*   # Assessment CRUD
/api/pitches/*       # Pitch management
/api/reports/*       # Report generation
/api/memberships/*   # Membership management
```

### Security Headers

- CORS configuration
- JWT validation middleware
- Rate limiting
- Input validation and sanitization

## Frontend Guidelines

### Component Structure

- Use TypeScript for all components
- Implement responsive design with Tailwind CSS
- Create reusable UI components
- Use React Hook Form for form handling

### State Management

- Use React Context for global state
- Implement proper error handling
- Add loading states for async operations

### Routing

- Use Next.js App Router
- Implement protected routes based on user roles
- Add proper SEO optimization

## Development Guidelines

### Code Style

- Follow TypeScript/Java best practices
- Use meaningful variable and function names
- Add JSDoc/Javadoc comments for complex functions
- Implement proper error handling

### Testing

- Unit tests for business logic
- Integration tests for API endpoints
- Component testing for React components

### Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/batal
DATABASE_USERNAME=batal_user
DATABASE_PASSWORD=secure_password

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=batal-storage

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRATION=86400000

# ERPNext
ERPNEXT_URL=https://your-erpnext-instance.com
ERPNEXT_API_KEY=your-api-key
ERPNEXT_API_SECRET=your-api-secret
```

## Deployment

### Docker Compose Services

- PostgreSQL database
- MinIO object storage
- Spring Boot backend
- Next.js frontend
- Nginx reverse proxy

### GitHub Actions

- Automated testing on pull requests
- Build and push Docker images
- Deploy to staging/production environments

## Integration Points

### ERPNext Sync

- Real-time membership payment sync
- Player data synchronization
- Financial reporting integration

### Email Notifications

- Monthly progress reports to parents
- Assessment notifications
- System alerts and updates

## UI/UX Guidelines

### Design System

- Use academy brand colors (Primary/Secondary)
- Include academy logo in top-right corner
- Consistent typography and spacing
- Mobile-responsive design

### User Experience

- Intuitive navigation for all user roles
- Quick access to frequently used features
- Progressive disclosure of complex data
- Accessible design following WCAG guidelines

## Performance Considerations

### Database Optimization

- Proper indexing for queries
- Connection pooling
- Query optimization for reports

### Caching Strategy

- Redis for session storage
- HTTP caching for static assets
- Database query caching

### File Storage

- Efficient image compression
- PDF generation optimization
- MinIO bucket organization

## Security Best Practices

### Authentication & Authorization

- Strong password policies
- JWT token rotation
- Role-based permissions
- Audit logging for sensitive operations

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Monitoring & Logging

### Application Monitoring

- Error tracking and alerting
- Performance metrics
- User activity logging
- System health checks

### Business Metrics

- Player engagement tracking
- Assessment completion rates
- Report generation statistics

## Future Enhancements

### Phase 2 Features

- Mobile app (React Native)
- Advanced analytics dashboard
- AI-powered skill recommendations
- Multi-language support

### Scalability Considerations

- Microservices architecture
- Database sharding strategies
- CDN integration
- Load balancing

---

## Development Commands

### Backend (Spring Boot)

```bash
# Run development server
./mvnw spring-boot:run

# Run tests
./mvnw test

# Build JAR
./mvnw clean package
```

### Frontend (Next.js)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

Remember to always prioritize user experience, data security, and system performance when implementing features for the Batal Application.
