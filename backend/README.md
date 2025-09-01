# Batal Backend

This is the backend API for the Batal Football Academy Management System built with Spring Boot.

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Java Version**: 17
- **Database**: PostgreSQL
- **Security**: Spring Security with JWT
- **File Storage**: MinIO
- **Email**: SMTP
- **Build Tool**: Maven

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+
- MinIO server (for file storage)

## Quick Start

1. **Clone the repository and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Configure database**

   - Create PostgreSQL database named `batal_db`
   - Update database credentials in `application.properties`

3. **Start MinIO server**

   ```bash
   docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
   ```

4. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

The API will be available at `http://localhost:8080/api`

## Configuration

Key configuration properties in `application.properties`:

- Database connection settings
- JWT secret and expiration
- MinIO settings for file storage
- SMTP settings for email notifications
- CORS configuration for frontend integration

## API Documentation

Once the application is running, API documentation will be available at:

- Swagger UI: `http://localhost:8080/api/swagger-ui.html` (when implemented)

## Development

- The application uses Spring Boot DevTools for hot reloading during development
- Logging is configured to show detailed information for the `com.batal` package
- Test classes are located in `src/test/java`

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/batal/
│   │   │   └── BatalApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/com/batal/
│           └── BatalApplicationTests.java
└── pom.xml
```

## Next Steps

This is a basic Spring Boot project setup. The following components need to be implemented:

1. Entity models (User, Group, Assessment, etc.)
2. Repository layers
3. Service layers
4. REST Controllers
5. Security configuration
6. JWT authentication
7. File upload/download services
8. Email services
9. Database migrations
