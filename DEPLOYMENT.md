# Pugg Exercise Generator - Deployment Guide

This guide covers deploying the Pugg Exercise Generator to Railway with PostgreSQL.

## Prerequisites

- Node.js 18+ installed locally
- Docker and Docker Compose installed
- Railway account
- OpenAI API key

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL=postgresql://pugg_user:pugg_password@localhost:5432/pugg_dev
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=development
PORT=3000
```

### 3. Start Local Development
```bash
# Start PostgreSQL and the application
docker-compose up -d

# Or run without Docker (requires local PostgreSQL)
npm run dev
```

The application will be available at `http://localhost:3000`

## Railway Deployment

### 1. Prepare Repository
Ensure all files are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Add PostgreSQL support and Docker configuration"
git push origin main
```

### 2. Create Railway Project
1. Go to [Railway](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### 3. Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway will automatically provide a `DATABASE_URL` environment variable

### 4. Configure Environment Variables
In Railway dashboard, go to Variables tab and add:
```
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=production
```

### 5. Deploy
Railway will automatically deploy when you push to your main branch. You can also trigger manual deployments from the dashboard.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |
| `ADMIN_USERNAME` | Admin login username | No | admin |
| `ADMIN_PASSWORD` | Admin login password | No | admin123 |
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 3000 |

## Database Schema

The application automatically creates the following tables:
- `exercise_sets` - Stores generated exercise sets
- `system_settings` - Application configuration
- `admin_users` - Admin user accounts

## Health Check

The application provides a health check endpoint at `/health` that returns:
- Application status
- Database connection status
- Timestamp

## Troubleshooting

### Local Development Issues
- Ensure Docker is running for `docker-compose up`
- Check that PostgreSQL container is healthy: `docker-compose ps`
- Verify environment variables in `.env` file

### Railway Deployment Issues
- Check Railway logs in the dashboard
- Verify all environment variables are set
- Ensure PostgreSQL service is running
- Check health endpoint: `https://your-app.railway.app/health`

### Database Connection Issues
- Verify `DATABASE_URL` is correctly formatted
- Check PostgreSQL service status in Railway
- Ensure database credentials are correct

## Security Notes

- Change default admin credentials in production
- Use strong, unique JWT secrets
- Keep OpenAI API keys secure
- Enable SSL in production (Railway handles this automatically)

## Monitoring

Railway provides built-in monitoring for:
- Application logs
- Database performance
- Resource usage
- Health checks

Access these through your Railway project dashboard.
