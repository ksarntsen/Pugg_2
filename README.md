# Exercise Generator

A modern web application for teachers to generate and share exercises with students, featuring AI-powered exercise creation and an intelligent chat assistant.

<!-- Test deployment: Railway GitHub integration test -->

## Features

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

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI GPT-3.5-turbo
- **PDF Generation**: jsPDF
- **Deployment**: Railway.app ready
- **Database**: PostgreSQL (ready for integration)

## Getting Started

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create a .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and visit `http://localhost:3000`

## Deployment

### Railway Deployment (Recommended)

This application is configured for deployment on [Railway.app](https://railway.app), a modern cloud platform that provides automatic deployments, environment management, and database hosting.

#### Prerequisites

1. **Railway CLI**: Install the Railway CLI for local deployment management
   ```bash
   npm install -g @railway/cli
   ```

2. **Railway Account**: Sign up at [railway.app](https://railway.app) and get your API token

3. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

#### Deployment Steps

1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Initialize Railway Project**:
   ```bash
   railway init
   ```
   This creates a new Railway project and links it to your local directory.

3. **Set Environment Variables**:
   ```bash
   # Set OpenAI API key
   railway variables --set "OPENAI_API_KEY=your_openai_api_key_here"
   
   # Set JWT secret for admin authentication
   railway variables --set "JWT_SECRET=your-secure-jwt-secret-here"
   ```

4. **Deploy the Application**:
   ```bash
   railway up
   ```
   This uploads your code and starts the deployment process.

5. **Get Your App URL**:
   ```bash
   railway domain
   ```
   This generates a public URL for your deployed application.

#### Railway Configuration

The app includes a `railway.json` configuration file that specifies:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Key Configuration Details**:
- **Builder**: Uses Nixpacks for automatic Node.js detection
- **Start Command**: Runs `npm start` (which executes `node server.js`)
- **Health Check**: Monitors `/health` endpoint for service availability
- **Restart Policy**: Automatically restarts on failure with up to 10 retries

#### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI functionality | Yes | - |
| `JWT_SECRET` | Secret key for JWT token generation | Yes | - |
| `PORT` | Server port (Railway sets this automatically) | No | 3000 |
| `RAILWAY_ENVIRONMENT` | Railway environment name | Auto | production |

#### Database Integration (Future)

The application is prepared for PostgreSQL database integration:

**Current State**: Uses in-memory storage for demo purposes
**Future Implementation**: 
- Railway provides PostgreSQL as a service
- Database connection via `DATABASE_URL` environment variable
- Migration scripts for exercise sets and user data

**To add PostgreSQL**:
```bash
# Add PostgreSQL service to your Railway project
railway add postgresql

# The DATABASE_URL will be automatically set
railway variables  # View all environment variables
```

#### Monitoring and Logs

**View Deployment Logs**:
```bash
railway logs
```

**Monitor Service Status**:
```bash
railway status
```

**Health Check**:
The app includes a health check endpoint at `/health` that returns:
```json
{
  "status": "OK",
  "timestamp": "2025-01-09T11:53:10.025Z"
}
```

#### Railway CLI Commands Reference

| Command | Description |
|---------|-------------|
| `railway login` | Authenticate with Railway |
| `railway init` | Initialize new Railway project |
| `railway up` | Deploy current code |
| `railway down` | Stop the service |
| `railway logs` | View deployment logs |
| `railway variables` | View environment variables |
| `railway variables --set "KEY=value"` | Set environment variable |
| `railway domain` | Get public URL |
| `railway status` | Check service status |
| `railway service` | Link to specific service |

#### Production Considerations

1. **Security**:
   - Change default admin credentials in production
   - Use strong JWT secrets
   - Enable HTTPS (Railway provides this automatically)

2. **Performance**:
   - Railway automatically scales based on traffic
   - Consider implementing caching for frequently accessed data
   - Monitor OpenAI API usage and costs

3. **Backup**:
   - Railway provides automatic backups for PostgreSQL
   - Consider implementing data export functionality

4. **Monitoring**:
   - Use Railway's built-in monitoring
   - Set up alerts for service failures
   - Monitor OpenAI API rate limits

#### Troubleshooting

**Common Issues**:

1. **Build Failures**:
   ```bash
   railway logs  # Check build logs
   ```

2. **Environment Variable Issues**:
   ```bash
   railway variables  # Verify all variables are set
   ```

3. **Service Not Starting**:
   ```bash
   railway status  # Check service status
   railway logs --follow  # Follow live logs
   ```

4. **OpenAI API Errors**:
   - Verify API key is correct and has sufficient credits
   - Check rate limits in OpenAI dashboard

## Git Integration

### Automatic Deployments from GitHub

The application supports automatic deployments when you push code to GitHub. There are two ways to set this up:

#### Option 1: Railway Dashboard (Recommended)

1. **Connect Repository in Railway:**
   - Go to your Railway project dashboard
   - Navigate to your service settings
   - Click "Connect GitHub Repository"
   - Select `ksarntsen/Pugg_2` repository
   - Choose `master` branch
   - Enable "Auto Deploy"

2. **Deploy by Pushing:**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin master
   # Railway automatically deploys! 🚀
   ```

#### Option 2: GitHub Actions (Advanced)

The project includes a GitHub Actions workflow for automated deployments:

1. **Generate Railway Token:**
   - Go to Railway project settings → "Tokens"
   - Generate a new project token

2. **Add Token to GitHub Secrets:**
   - Go to GitHub repository → Settings → "Secrets and variables" → "Actions"
   - Add secret: `RAILWAY_TOKEN` with your Railway token

3. **Automatic Deployment:**
   - Push to `master` branch triggers deployment
   - Monitor deployment in GitHub "Actions" tab

### Development Workflow

```bash
# 1. Make changes locally
npm run dev  # Test locally

# 2. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin master

# 3. Railway automatically deploys
# 4. Check deployment status
railway status
```

### Branch Strategy

```bash
# For new features
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to master when ready
git checkout master
git merge feature/new-feature
git push origin master  # Triggers production deployment
```

## Project Structure

```
├── index.html          # Teacher page
├── student.html        # Student page with AI chat
├── styles.css          # Shared styles and chat UI
├── script.js           # Teacher page logic
├── student.js          # Student page logic with chat functionality
├── server.js           # Express server with AI endpoints
├── package.json        # Dependencies
├── railway.json        # Railway deployment config
├── .gitignore          # Git ignore rules
├── .github/
│   ├── workflows/
│   │   └── deploy.yml  # GitHub Actions deployment workflow
│   └── README.md       # GitHub Actions documentation
└── README.md           # This file
```

## API Endpoints

### Exercise Generation
- `POST /api/generate-exercises` - Generate exercises using AI
  - Body: `{ prompt: string, count: number }`
  - Returns: `{ exercises: array, title: string }`

### AI Chat Assistant
- `POST /api/chat` - Chat with AI tutor
  - Body: `{ message: string, exerciseContent: string, chatHistory: array }`
  - Returns: `{ response: string }`

### Static Routes
- `GET /` - Teacher page
- `GET /student` - Student page
- `GET /health` - Health check endpoint

## AI Features

### Exercise Generation
- **Smart Prompting**: AI creates diverse, engaging exercises based on teacher input
- **Subject Adaptation**: Automatically adapts to different subjects (math, science, language arts, etc.)
- **Age-Appropriate Content**: Generates educational content suitable for various grade levels
- **Title Generation**: Creates appropriate titles for exercise sets

### Chat Assistant
- **Context Awareness**: Understands the current exercise the student is working on
- **Educational Guidance**: Provides hints and step-by-step guidance
- **Conversation Memory**: Maintains context throughout the chat session
- **Encouraging Tone**: Supportive and motivating responses

## User Interface

### Design Philosophy
- **Modern & Clean**: Minimalist design with elegant typography
- **Muted Color Palette**: Comfortable colors (grays, blues, purples)
- **Smooth Animations**: Dynamic transitions and hover effects
- **Responsive**: Mobile-first design that works on all devices

### Key UI Components
- **Exercise Cards**: Editable, draggable exercise items
- **Progress Bar**: Visual progress tracking for students
- **Chat Bubble**: Floating AI assistant in bottom right corner
- **Navigation**: Intuitive arrow buttons and keyboard shortcuts

## Development

### Key Features Implemented
- ✅ AI-powered exercise generation
- ✅ Drag & drop exercise reordering
- ✅ PDF export functionality
- ✅ URL-based state management
- ✅ AI chat assistant with context awareness
- ✅ Progress tracking
- ✅ Responsive design
- ✅ Modern UI/UX

### Future Enhancements
- Database integration with PostgreSQL
- User authentication and accounts
- Exercise templates and libraries
- Analytics and progress tracking
- Advanced AI prompts for different grade levels
- Mathematical expression rendering (MathJax)
- Multi-language support

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "compression": "^1.7.4",
  "openai": "^4.20.1",
  "dotenv": "^16.3.1"
}
```

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key for AI functionality
- `PORT` - Server port (defaults to 3000)

## License

MIT License
