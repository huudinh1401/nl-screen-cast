# Backend Template

A clean and modern Node.js backend template built with Express.js, Sequelize ORM, JWT authentication, and Role-Based Access Control (RBAC).

## Features

- **Express.js** - Fast, unopinionated, minimalist web framework
- **Sequelize ORM** - Modern Object-Relational Mapping for PostgreSQL, MySQL, MariaDB, SQLite and Microsoft SQL Server
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Fine-grained permission system
- **Input Validation** - Request validation using express-validator
- **Security** - Helmet, CORS, Rate limiting, XSS protection
- **File Upload** - Multer for handling multipart/form-data
- **Socket.IO** - Real-time bidirectional event-based communication
- **Logging System** - Comprehensive activity logging
- **Environment Configuration** - dotenv for environment variables

## Project Structure

```
├── src/
│   ├── config/
│   │   ├── associations.js      # Sequelize model associations
│   │   ├── db.config.js         # Database configuration
│   │   ├── env.config.js        # Environment configuration
│   │   └── sequelize.js         # Sequelize instance
│   ├── middleware/
│   │   ├── cors-middleware.js   # CORS configuration
│   │   ├── error-middleware.js  # Error handling
│   │   ├── security.middleware.js # Security configuration
│   │   ├── static-files.middleware.js # Static file serving
│   │   └── pagination.js        # Pagination helper
│   ├── modules/
│   │   ├── auth/                # Authentication module
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── auth.model.js
│   │   │   ├── auth.route.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.validation.js
│   │   │   ├── upload.middleware.js
│   │   │   └── uuid_login.model.js
│   │   ├── user/                # User management module
│   │   │   ├── user.controller.js
│   │   │   ├── user.model.js
│   │   │   ├── user.route.js
│   │   │   ├── user.service.js
│   │   │   └── user.validation.js
│   │   ├── role/                # Role management module
│   │   │   ├── role.controller.js
│   │   │   ├── role.model.js
│   │   │   ├── role.route.js
│   │   │   ├── role.service.js
│   │   │   └── role.validation.js
│   │   ├── permission/          # Permission management module
│   │   │   ├── permission.controller.js
│   │   │   ├── permission.model.js
│   │   │   ├── permission.route.js
│   │   │   ├── permission.service.js
│   │   │   └── permission.validation.js
│   │   ├── log/                 # Logging module
│   │   │   ├── log.controller.js
│   │   │   ├── log.model.js
│   │   │   ├── log.route.js
│   │   │   ├── log.service.js
│   │   │   └── log.validation.js
│   │   └── RolePermission/
│   │       └── RolePermissions.model.js
│   ├── uploads/                 # File upload directory
│   ├── utils/
│   │   ├── error-handler.js     # Error handling utilities
│   │   └── string-similarity.js # String similarity utilities
│   ├── app.js                   # Express app configuration
│   └── routes.js               # Main route configuration
├── .env.example                # Environment variables template
├── .gitignore
├── ecosystem.config.js         # PM2 configuration
├── package.json
├── README.md
└── server.js                   # Application entry point
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend-template
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables:
```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your settings
```

Example configuration:
```env
# Server Configuration
PORT=7010
NODE_ENV=development
BASE_URL=http://localhost

# Database Configuration (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_PORT=3306

# JWT Security (Change these in production!)
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
ACCESS_TOKEN_LIFETIME=15m
REFRESH_TOKEN_LIFETIME=7d

# CORS Configuration (Use '*' for development)
ALLOWED_ORIGINS=*
```

5. Setup your database (MySQL/PostgreSQL/SQLite)

6. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users (Admin/Manager)
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `PUT /api/users/profile` - Update own profile
- `DELETE /api/users/:id` - Delete user (Admin)

### Role Management
- `GET /api/roles` - Get all roles (Admin/Manager)
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create new role (Admin)
- `PUT /api/roles/:id` - Update role (Admin)
- `DELETE /api/roles/:id` - Delete role (Admin)
- `POST /api/roles/:id/assign-permissions` - Assign permissions to role (Admin)

### Permission Management
- `GET /api/permissions` - Get all permissions (Admin/Manager)
- `GET /api/permissions/:id` - Get permission by ID
- `POST /api/permissions` - Create new permission (Admin)
- `PUT /api/permissions/:id` - Update permission (Admin)
- `DELETE /api/permissions/:id` - Delete permission (Admin)

### Logs
- `GET /api/logs` - Get all logs (Admin/Manager)
- `GET /api/logs/my-logs` - Get current user logs
- `GET /api/logs/:id` - Get log by ID
- `POST /api/logs` - Create manual log (Admin)

## Authentication & Authorization

### JWT Tokens
The API uses JWT tokens for authentication:
- **Access Token**: Short-lived token for API access (default: 1 hour)
- **Refresh Token**: Long-lived token for refreshing access tokens (default: 7 days)

### Role-Based Access Control (RBAC)
The system implements a flexible RBAC system:
- **Users** belong to **Roles**
- **Roles** have multiple **Permissions**
- **Permissions** define what actions can be performed on which resources

### Default Roles
- **Admin**: Full system access
- **Manager**: Limited management access
- **User**: Basic user access

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Request validation using express-validator
- **XSS Protection**: Cross-site scripting protection
- **Password Hashing**: bcrypt for secure password storage

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DB_*`: Database connection parameters
- `ACCESS_TOKEN_SECRET`: JWT access token secret
- `REFRESH_TOKEN_SECRET`: JWT refresh token secret

### Database Migrations
The application uses Sequelize migrations for database schema management. Models will automatically create tables on first run.

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use strong, unique secrets for JWT tokens
3. Configure your production database
4. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## License

This project is licensed under the ISC License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions, please create an issue in the repository.
