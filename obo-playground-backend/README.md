# OBO Playground Backend

A robust NestJS-based REST API for managing robotics playground projects with PostgreSQL database integration.

## 🚀 Features

- ✅ **RESTful API** - CRUD operations for projects
- ✅ **PostgreSQL Database** - TypeORM with migrations
- ✅ **Swagger Documentation** - Interactive API docs at `/api/docs`
- ✅ **Health Checks** - Application health monitoring at `/health`
- ✅ **Input Validation** - class-validator with detailed error messages
- ✅ **Exception Handling** - Global exception filter with structured errors
- ✅ **Request Logging** - Comprehensive request/response logging
- ✅ **Security** - Helmet middleware for security headers
- ✅ **Compression** - Response compression for better performance
- ✅ **CORS** - Configurable cross-origin resource sharing
- ✅ **Auto-Save API** - File content save/load endpoints for offline sync

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd obo-playground-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=obo_playground
   NODE_ENV=development
   PORT=3000
   CORS_ORIGIN=*
   ```

4. **Start PostgreSQL with Docker (optional)**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations**
   ```bash
   npm run migration:run
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 📚 API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create a new project |
| GET | `/projects` | Get all projects |
| GET | `/projects?userId={uuid}` | Get projects by user ID |
| GET | `/projects/:id` | Get a project by ID |
| PATCH | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project |

### File Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/projects/:id/content` | Update project file content |
| GET | `/projects/:id/content` | Get project file content |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Comprehensive health check |
| GET | `/health/ping` | Simple ping check |

## 🗃️ Database

### Migrations

**Generate a new migration**
```bash
npm run migration:generate -- src/migrations/MigrationName
```

**Run migrations**
```bash
npm run migration:run
```

**Revert last migration**
```bash
npm run migration:revert
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔒 Security Features

- **Helmet** - Security headers middleware
- **CORS** - Configurable cross-origin requests
- **Input Validation** - Automatic validation with detailed errors
- **UUID Validation** - Route parameter validation
- **SQL Injection Protection** - TypeORM parameterized queries

## 📊 Monitoring

The application includes comprehensive logging:

- Request/response logging
- Error tracking with stack traces
- Performance metrics (response time)
- Database query logging (development mode)

## 🏗️ Project Structure

```
src/
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts    # Global exception handling
│   └── interceptors/
│       ├── logging.interceptor.ts       # Request/response logging
│       └── transform.interceptor.ts     # Response transformation
├── entities/
│   └── project.entity.ts                # Project entity
├── health/
│   ├── health.controller.ts             # Health check endpoints
│   └── health.module.ts
├── migrations/
│   └── CreateProjectsTable.ts           # Database migrations
├── projects/
│   ├── dto/
│   │   ├── create-project.dto.ts        # Create project DTO
│   │   └── update-project.dto.ts        # Update project DTO
│   ├── projects.controller.ts           # Projects controller
│   ├── projects.module.ts
│   └── projects.service.ts              # Projects business logic
├── app.module.ts                        # Root module
├── data-source.ts                       # TypeORM CLI config
└── main.ts                              # Application entry point
```

## 🐳 Docker

Start the PostgreSQL database:
```bash
docker-compose up -d
```

Stop the database:
```bash
docker-compose down
```

## 🔄 Development Workflow

1. Make changes to your code
2. The application auto-reloads in watch mode
3. Check logs for any errors
4. Test endpoints using Swagger UI
5. Run tests before committing

## 🤝 Best Practices Implemented

- ✅ Dependency injection
- ✅ Service-repository pattern
- ✅ DTO validation
- ✅ Global exception handling
- ✅ Structured logging
- ✅ Health checks
- ✅ API documentation
- ✅ Database migrations
- ✅ Environment configuration
- ✅ Security middleware

## 📝 License

This project is licensed under the UNLICENSED license.

## 🆘 Support

For issues and questions, please open an issue in the repository.
