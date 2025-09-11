# Pugg Exercise Generator

A modern web application for teachers to generate and share exercises with students, featuring AI-powered exercise creation using GPT-5, an intelligent chat assistant with configurable reasoning and verbosity, and PostgreSQL database persistence.

## 🚀 Features

### Teacher Page
- **AI Exercise Generation**: Generate diverse, engaging exercises using OpenAI GPT-5 with configurable reasoning and verbosity
- **Custom Prompts**: Input any subject or topic to create relevant exercises
- **Editable Content**: All exercises and titles are fully editable
- **Drag & Drop Reordering**: Easily reorder exercises by dragging
- **Add/Remove Exercises**: Add new exercises or remove existing ones
- **PDF Export**: Download exercise sets as professional PDFs with mathematical expression support
- **Share Links**: Generate student links and teacher return links
- **State Persistence**: Save and return to exercise sets via URLs
- **AI Model Selection**: Choose between GPT-5, GPT-5 Mini, or GPT-5 Nano for optimal performance

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
- **Configurable Intelligence**: Adjustable reasoning effort (minimal, low, medium, high) per exercise set
- **Adaptive Verbosity**: Customizable response length (low, medium, high) per exercise set
- **GPT-5 Powered**: Uses the latest OpenAI GPT-5 models for superior reasoning and understanding

### Authentication System
- **Login Page**: Beautiful, responsive login interface as the main entry point
- **User Type Selection**: Three-button toggle for Student/Teacher/Admin roles
- **Smart Routing**: Automatic redirection based on user type after authentication
- **Exercise Set Integration**: Students redirected to specific exercises when coming from teacher links
- **Session Management**: Secure session handling with automatic login state checking
- **Student Dashboard**: Dedicated interface for students to access assigned exercise sets
- **Registration Placeholder**: Ready for future user registration implementation
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with connection pooling
- **AI Integration**: OpenAI GPT-5 (Responses API)
  - GPT-5: Best for complex reasoning and multi-step tasks
  - GPT-5 Mini: Balanced performance and cost
  - GPT-5 Nano: Fastest responses for simple tasks
- **Authentication**: JWT with bcrypt password hashing
- **PDF Generation**: jsPDF with MathJax support
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

## 🔐 Authentication & User Flow

### Login System
PUGG now features a comprehensive authentication system with the login page as the main entry point:

1. **Main Entry Point**: Visit `http://localhost:3000` → Login page
2. **User Type Selection**: Choose Student, Teacher, or Admin role
3. **Authentication**: Enter username and password
4. **Smart Routing**: Automatic redirection based on user type:
   - **Students** → Student Dashboard (`student-dashboard.html`)
   - **Teachers** → Teacher Interface (`/teacher`)
   - **Admins** → Admin Panel (`admin.html`)

### Route Structure
- **`/`** → Login page (main entry point)
- **`/teacher`** → Teacher exercise generator interface
- **`/student`** → Student exercise interface
- **`/admin`** → Admin panel
- **`/login.html`** → Direct access to login page
- **`/register.html`** → Registration page (placeholder)

### Exercise Set Integration
- **Teacher Links**: When students click exercise links from teachers, they're redirected to login first
- **Post-Login Redirect**: After authentication, students are automatically taken to the specific exercise set
- **Session Management**: Login state is maintained throughout the session

### Student Dashboard
- **Exercise Sets**: View assigned exercise sets from teachers
- **Quick Actions**: Switch account or logout functionality
- **Authentication Check**: Automatic redirect to login if not authenticated

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
- `chat_model` - AI model to use (gpt-5, gpt-5-mini, gpt-5-nano)
- `chat_instruction` - Custom chat instructions
- `reasoning_effort` - AI reasoning effort (minimal, low, medium, high)
- `verbosity` - AI response verbosity (low, medium, high)
- `created_by` - Creator IP/identifier
- `created_at` - Creation timestamp
- `last_used` - Last access timestamp

### `system_settings`
- `id` - Primary key
- `llm_model` - Default AI model (gpt-5, gpt-5-mini, gpt-5-nano)
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
- `POST /api/admin/exercise-sets/:id/chat-model` - Update chat model
- `POST /api/admin/exercise-sets/:id/chat-instruction` - Update chat instruction
- `POST /api/admin/exercise-sets/:id/reasoning-effort` - Update reasoning effort
- `POST /api/admin/exercise-sets/:id/verbosity` - Update verbosity

### Public API
- `GET /api/settings/default-chat-instruction` - Get default chat instruction
- `POST /api/exercise-sets/:id/chat-language` - Update chat language
- `POST /api/exercise-sets/:id/access` - Track exercise access

### Health Check
- `GET /health` - Application and database status

## 🤖 GPT-5 Configuration

### Available Models
- **GPT-5**: Best for complex reasoning, broad world knowledge, and multi-step tasks
- **GPT-5 Mini**: Cost-optimized reasoning and chat; balances speed, cost, and capability
- **GPT-5 Nano**: High-throughput tasks, especially simple instruction-following or classification

### Reasoning Effort Levels
- **Minimal**: Fastest responses, minimal reasoning tokens
- **Low**: Fast responses with basic reasoning
- **Medium**: Balanced reasoning and speed (default)
- **High**: Thorough reasoning, slower but more thoughtful responses

### Verbosity Levels
- **Low**: Concise, brief responses
- **Medium**: Balanced detail and brevity (default)
- **High**: Detailed, thorough responses

### Configuration Options
- **Per Exercise Set**: Each exercise set can have unique AI behavior settings
- **Admin Dashboard**: Easy-to-use interface for managing all AI parameters
- **Real-time Updates**: Changes take effect immediately for new chat interactions
- **Backward Compatibility**: Existing exercise sets automatically get sensible defaults

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
├── login.html              # Main entry point - authentication page
├── register.html           # User registration page (placeholder)
├── student-dashboard.html  # Student dashboard interface
├── student-dashboard.js    # Student dashboard logic
├── login.js                # Authentication logic and routing
├── index.html              # Teacher page (accessible via /teacher)
├── student.html            # Student page with AI chat
├── admin.html              # Admin interface
├── admin-dashboard.html    # Admin dashboard
├── styles.css              # Shared styles (includes auth system styles)
├── script.js               # Teacher page logic
├── student.js              # Student page logic
├── admin.js                # Admin page logic
├── server.js               # Express server with PostgreSQL and auth routing
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

- [x] User authentication and accounts - ✅ Implemented
- [ ] User registration system (login page ready)
- [ ] Exercise templates and libraries
- [ ] Analytics and progress tracking
- [ ] Advanced AI prompts for different grade levels
- [x] Mathematical expression rendering (MathJax) - ✅ Implemented
- [x] Multi-language support - ✅ Implemented
- [x] GPT-5 integration with Responses API - ✅ Implemented
- [x] Configurable AI reasoning and verbosity - ✅ Implemented
- [ ] Real-time collaboration
- [ ] Mobile app

## 🚀 Recent Updates

### Authentication System (Latest)
- **Login Page**: New main entry point with beautiful, responsive design
- **User Type Selection**: Three-button toggle for Student/Teacher/Admin roles
- **Smart Routing**: Automatic redirection based on user type after authentication
- **Student Dashboard**: Dedicated interface for students to access exercise sets
- **Exercise Set Integration**: Seamless redirect from teacher links to specific exercises
- **Session Management**: Secure login state handling throughout the session
- **Registration Ready**: Placeholder system ready for future user registration

### GPT-5 Migration
- **Upgraded to GPT-5**: Complete migration from GPT-3.5/4 to GPT-5 models
- **Responses API**: Switched from Chat Completions to the new Responses API for better performance
- **Configurable Intelligence**: Per-exercise-set reasoning effort and verbosity controls
- **Enhanced Admin Interface**: New dashboard controls for managing AI behavior
- **Improved Mathematical Support**: Better LaTeX rendering in PDFs and chat
- **Backward Compatibility**: Existing exercise sets automatically migrated with sensible defaults

### Migration Notes
- All existing exercise sets will continue to work without any changes
- New exercise sets default to GPT-5 with medium reasoning effort and verbosity
- Admin can configure AI behavior on a per-exercise-set basis
- GPT-3.5 and GPT-4 models are no longer supported (automatically upgraded to GPT-5)
- **Authentication**: Login page is now the main entry point - all users must authenticate first

## 📄 License

MIT License

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Health Check**: Monitor application status at `/health`
- **Railway Logs**: Check deployment logs in Railway dashboard

---

**Ready to deploy?** Follow the [Railway Deployment](#-railway-deployment) section above! 🚀