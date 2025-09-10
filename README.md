# Pugg Exercise Generator

A modern web application for teachers to generate and share exercises with students, featuring AI-powered exercise creation, an intelligent chat assistant, and PostgreSQL database persistence.

## 🚀 Features

### Teacher Page
- **AI Exercise Generation**: Generate diverse, engaging exercises using OpenAI GPT-3.5-turbo
- **Custom Prompts**: Input any subject or topic to create relevant exercises
- **Editable Content**: All exercises and titles are fully editable
- **Drag & Drop Reordering**: Easily reorder exercises by dragging
- **Add/Remove Exercises**: Add new exercises or remove existing ones
- **PDF Export**: Download exercise sets as professional PDFs
- **Share Links**: Generate student links and teacher return links
- **State Persistence**: Save and return to exercise sets via URLs

### Student Page
- **Clean Interface**: Minimal, elegant design with muted color palette
- **Exercise Navigation**: Navigate through exercises with arrow buttons or keyboard
- **Progress Tracking**: Visual progress bar showing completion status
- **AI Chat Assistant**: Intelligent tutor that provides hints and guidance
- **Context-Aware Help**: AI understands the current exercise and provides relevant assistance
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### AI Chat Assistant
- **Exercise Context**: Automatically understands what exercise the student is working on
- **Educational Focus**: Provides hints and guidance without giving away answers
- **Conversation Memory**: Maintains chat history throughout the session
- **Smart Context Switching**: Updates when students move to different exercises
- **Encouraging Responses**: Supportive and age-appropriate communication

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with connection pooling
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Authentication**: JWT with bcrypt password hashing
- **PDF Generation**: jsPDF
- **Deployment**: Railway.app with Docker
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)
- OpenAI API key
- Railway account (for deployment)

### Local Development

#### Option 1: With Docker (Recommended)
```bash
# 1. Clone and install dependencies
git clone https://github.com/ksarntsen/Pugg_2.git
cd Pugg_2
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your OpenAI API key

# 3. Start with Docker Compose
npm run docker:dev
```

#### Option 2: Local PostgreSQL
```bash
# 1. Install dependencies
npm install

# 2. Set up PostgreSQL
createdb pugg_dev
psql -d pugg_dev -f database/init.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your database URL and OpenAI API key

# 4. Start the application
npm start
```

The application will be available at `http://localhost:3000`

## 🐳 Docker Configuration

### Local Development
```bash
# Start PostgreSQL and application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Build
```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

## 🚀 Railway Deployment

### 1. Prepare Repository
```bash
git add .
git commit -m "Add PostgreSQL support and Docker configuration"
git push origin main
```

### 2. Create Railway Project
1. Go to [Railway](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### 3. Add PostgreSQL Database
1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway automatically provides `DATABASE_URL` environment variable

### 4. Configure Environment Variables
In Railway dashboard → Variables tab:
```
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=production
```

### 5. Deploy
Railway automatically deploys when you push to main branch!

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |
| `ADMIN_USERNAME` | Admin login username | No | admin |
| `ADMIN_PASSWORD` | Admin login password | No | admin123 |
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 3000 |

## 🗄️ Database Schema

The application automatically creates these tables:

### `exercise_sets`
- `id` - Unique identifier
- `title` - Exercise set title
- `exercises` - JSON array of exercises
- `chat_language` - Language for AI chat
- `chat_model` - AI model to use
- `chat_instruction` - Custom chat instructions
- `created_by` - Creator IP/identifier
- `created_at` - Creation timestamp
- `last_used` - Last access timestamp

### `system_settings`
- `id` - Primary key
- `llm_model` - Default AI model
- `default_chat_instruction` - Default chat prompt
- `updated_at` - Last update timestamp

### `admin_users`
- `id` - Primary key
- `username` - Admin username
- `password_hash` - Bcrypt hashed password
- `created_at` - Account creation timestamp

## 📡 API Endpoints

### Exercise Generation
- `POST /api/generate-exercises` - Generate exercises using AI
- `POST /api/generate-ai-exercises` - Generate additional exercises

### AI Chat
- `POST /api/chat` - Chat with AI tutor

### Admin API
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/settings` - Get system settings
- `POST /api/admin/settings` - Update system settings
- `GET /api/admin/exercise-sets` - List all exercise sets
- `DELETE /api/admin/exercise-sets/:id` - Delete exercise set

### Public API
- `GET /api/settings/default-chat-instruction` - Get default chat instruction
- `POST /api/exercise-sets/:id/chat-language` - Update chat language
- `POST /api/exercise-sets/:id/access` - Track exercise access

### Health Check
- `GET /health` - Application and database status

## 🔐 Security Features

- **Password Hashing**: Admin passwords secured with bcrypt
- **JWT Authentication**: Secure token-based admin access
- **Environment Variables**: Sensitive data stored securely
- **CORS Protection**: Configured for production use
- **Helmet Security**: Security headers and protection
- **Input Validation**: Proper error handling and validation

## 📊 Health Monitoring

### Health Check Endpoint
```bash
curl https://your-app.railway.app/health
```

Returns:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2025-01-09T11:53:10.025Z"
}
```

### Railway Monitoring
- Application logs
- Database performance
- Resource usage
- Health checks
- Automatic scaling

## 🛠 Development

### Project Structure
```
├── index.html              # Teacher page
├── student.html            # Student page with AI chat
├── admin.html              # Admin interface
├── admin-dashboard.html    # Admin dashboard
├── styles.css              # Shared styles
├── script.js               # Teacher page logic
├── student.js              # Student page logic
├── admin.js                # Admin page logic
├── server.js               # Express server with PostgreSQL
├── database/
│   ├── init.sql           # Database schema
│   └── db.js              # Database utilities
├── Dockerfile             # Production container
├── docker-compose.yml     # Local development
├── railway.json           # Railway configuration
├── package.json           # Dependencies
└── README.md              # This file
```

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server
npm run docker:dev     # Start with Docker Compose
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container
```

## 🚨 Troubleshooting

### Local Development Issues
- **Port 3000 in use**: `lsof -ti:3000 | xargs kill -9`
- **Database connection**: Check PostgreSQL is running
- **Environment variables**: Verify `.env` file exists and is correct

### Railway Deployment Issues
- **Build failures**: Check Railway logs in dashboard
- **Database issues**: Verify PostgreSQL service is running
- **Environment variables**: Ensure all required variables are set
- **Health check**: Visit `/health` endpoint

### Database Issues
- **Connection errors**: Verify `DATABASE_URL` format
- **Schema issues**: Check `database/init.sql` was run
- **Performance**: Monitor connection pool usage

## 🔄 Git Integration

### Automatic Deployments
Railway automatically deploys when you push to the main branch:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main
# Railway deploys automatically! 🚀
```

### Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test
npm run dev

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 4. Merge to main for deployment
git checkout main
git merge feature/new-feature
git push origin main
```

## 📈 Performance & Scaling

- **Connection Pooling**: PostgreSQL connections are pooled for efficiency
- **Automatic Scaling**: Railway scales based on traffic
- **Caching**: Consider implementing Redis for frequently accessed data
- **Monitoring**: Use Railway's built-in monitoring tools

## 🔮 Future Enhancements

- [ ] User authentication and accounts
- [ ] Exercise templates and libraries
- [ ] Analytics and progress tracking
- [ ] Advanced AI prompts for different grade levels
- [ ] Mathematical expression rendering (MathJax)
- [ ] Multi-language support
- [ ] Real-time collaboration
- [ ] Mobile app

## 📄 License

MIT License

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Health Check**: Monitor application status at `/health`
- **Railway Logs**: Check deployment logs in Railway dashboard

---

**Ready to deploy?** Follow the [Railway Deployment](#-railway-deployment) section above! 🚀