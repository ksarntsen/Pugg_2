# Exercise Generator

A modern web application for teachers to generate and share exercises with students, featuring AI-powered exercise creation and an intelligent chat assistant.

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

### Deployment to Railway

1. Connect your GitHub repository to Railway
2. Add your OpenAI API key as an environment variable in Railway:
   - Go to your project settings
   - Add environment variable: `OPENAI_API_KEY` with your API key
3. Railway will automatically detect the Node.js app
4. The app will be deployed and accessible via Railway's provided URL

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
