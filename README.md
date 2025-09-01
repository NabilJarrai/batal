# Batal Football Academy Management System

A comprehensive management system for football academies built with modern technologies. This system helps academies track player progress, manage assessments, handle communications, and generate insightful reports.

## 🏗️ Architecture

### Backend

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **Security**: JWT Authentication with Spring Security
- **File Storage**: MinIO
- **Email**: SMTP Integration
- **Build Tool**: Maven

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **File Storage**: MinIO Object Storage
- **Development**: Hot reload enabled for both frontend and backend

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Java 17+ (for backend development)
- Node.js 18+ (for frontend development)
- Git

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd batal
   ```

2. **Start infrastructure services**

   ```bash
   docker-compose up postgres minio -d
   ```

3. **Setup backend**

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Setup frontend** (in a new terminal)

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - MinIO Console: http://localhost:9001 (admin/password: minioadmin/minioadmin)

## 📁 Project Structure

```
batal/
├── backend/                 # Spring Boot API
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── README.md
├── frontend/                # Next.js Application
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml       # Infrastructure services
├── COMPLETE_ISSUES_LIST.md  # Project roadmap and issues
└── README.md               # This file
```

## 🎯 Features (Planned)

### Core Functionality

- **User Management**: Players, Coaches, Admins, Managers
- **Group System**: Age-based automatic assignment (Development/Advanced levels)
- **Assessment System**: Athletic, Technical, Mentality, and Personality skills tracking
- **Progress Analytics**: Charts, trends, and performance insights
- **Report Generation**: PDF reports for players, coaches, and management
- **Communication**: Comments, complaints, and notification system

### Advanced Features

- **Pitch Management**: Schedule groups across multiple pitches and zones
- **Calendar System**: Training schedules with vacation management
- **Membership Management**: Payment tracking and ERPNext integration
- **Nutrition Programs**: Age-specific nutrition guidance
- **Email Automation**: Monthly progress reports to parents
- **File Management**: Document upload and storage

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- CORS configuration
- Secure file upload handling
- Input validation and sanitization

## 📊 User Roles & Permissions

| Role        | Permissions                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| **Player**  | View personal profile, assessments, progress, nutrition program, submit comments |
| **Coach**   | Manage assigned groups, create assessments, view group analytics                 |
| **Admin**   | User management, group management, system configuration, all coach permissions   |
| **Manager** | Academy-wide analytics, all admin permissions, financial reports                 |

## 🛠️ Development

### Backend Development

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Database Management

- Database runs on `localhost:5432`
- Default credentials: `batal_user/batal_password`
- Database name: `batal_db`

### File Storage

- MinIO runs on `localhost:9000`
- Console: `localhost:9001`
- Default credentials: `minioadmin/minioadmin`

## 📋 Development Roadmap

See [COMPLETE_ISSUES_LIST.md](COMPLETE_ISSUES_LIST.md) for detailed development phases:

1. **Phase 1**: Foundation & Setup ✅
2. **Phase 2**: Core Data Models
3. **Phase 3**: Group Management
4. **Phase 4**: Assessment & Analytics
5. **Phase 5**: Reporting & Communication
6. **Phase 6**: Advanced Features
7. **Phase 7**: Integration & Polish

## 🧪 Testing

### Backend Tests

```bash
cd backend
./mvnw test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚢 Deployment

### Production Build

```bash
# Build all services
docker-compose build

# Start production environment
docker-compose up -d
```

### Environment Configuration

- Backend: Update `application.properties` for production settings
- Frontend: Configure environment variables in `.env.local`
- Database: Use production PostgreSQL instance
- File Storage: Configure production MinIO or cloud storage

## 📖 API Documentation

Once implemented, API documentation will be available at:

- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

## 🤝 Contributing

1. Follow the issue roadmap in `COMPLETE_ISSUES_LIST.md`
2. Create feature branches for each issue
3. Write tests for new functionality
4. Update documentation as needed
5. Submit pull requests for review

## 📄 License

This project is proprietary software for Batal Football Academy.

## 🆘 Support

For development support and questions:

- Check the issue tracker
- Review component README files
- Contact the development team

---

**Status**: 🏗️ **In Development** - Basic project structure completed, ready for feature implementation
