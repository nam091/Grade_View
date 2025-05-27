# GradeView Backend

This is the backend API service for the GradeView application.

## Prerequisites

- Node.js (v14 or later)
- PostgreSQL
- Keycloak (for authentication)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install type definitions to fix type errors:

```bash
npm install --save-dev @types/node @types/express @types/cors @types/keycloak-connect @types/express-session @types/sequelize
```

3. Install additional dependencies for Keycloak and session handling:

```bash
npm install express-session
```

4. Create a `.env` file in the backend directory (you can copy from `.env.example`):

```
# Server Configuration
PORT=5000
SESSION_SECRET=your-secret-key

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gradeview
DB_USER=postgres
DB_PASSWORD=postgres

# Keycloak Configuration
# Note: Keycloak 21+ uses a different URL format without /auth
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=gradeview
KEYCLOAK_CLIENT_ID=gradeview-backend
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

4. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/role/:role` - Get users by role
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get subject by ID
- `POST /api/subjects` - Create a new subject
- `PUT /api/subjects/:id` - Update a subject
- `DELETE /api/subjects/:id` - Delete a subject

### Grades
- `GET /api/grades/student/:studentId` - Get all grades for a student
- `GET /api/grades/student/:studentId/subject/:subjectId` - Get student grades by subject
- `GET /api/grades/teacher/:teacherId/subject/:subjectId` - Get grades entered by a teacher for a subject
- `POST /api/grades` - Add a grade
- `PUT /api/grades/:id` - Update a grade
- `DELETE /api/grades/:id` - Delete a grade

## Docker

To run the backend with Docker:

```bash
docker build -t gradeview-backend .
docker run -p 5000:5000 gradeview-backend
```

To run with Docker Compose (includes PostgreSQL and Keycloak):

```bash
docker-compose up -d
``` 