const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const OpenAI = require('openai');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Admin credentials (in production, use environment variables)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage for demo (in production, use a database)
let exerciseSets = [];
let systemSettings = {
    llmModel: 'gpt-3.5-turbo',
    defaultChatInstruction: `You are a helpful AI tutor assistant for students working on exercises. You should:
- Be encouraging and supportive
- Provide hints and guidance without giving away the answer
- Help students understand concepts and problem-solving approaches
- Ask clarifying questions when needed
- Keep responses concise and age-appropriate
- If the student asks for the direct answer, guide them to think through it step by step instead

Respond naturally and helpfully to the student's question.`
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'student.html'));
});

// Admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// API routes for exercise generation
app.post('/api/generate-exercises', async (req, res) => {
    try {
        const { prompt, count } = req.body;
        
        if (!prompt || !count) {
            return res.status(400).json({ error: 'Prompt and count are required' });
        }

        const exercises = await generateExercisesWithAI(prompt, count);
        const title = await generateTitleWithAI(prompt);
        
        // Generate unique ID and save to storage
        const id = Math.random().toString(36).substr(2, 9);
        const userIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        
        const exerciseSet = {
            id,
            title,
            exercises,
            createdBy: userIP,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        exerciseSets.push(exerciseSet);
        
        res.json({ exercises, title, id });
    } catch (error) {
        console.error('Error generating exercises:', error);
        res.status(500).json({ error: 'Failed to generate exercises' });
    }
});

// API route for AI chat assistant
app.post('/api/chat', async (req, res) => {
    try {
        const { message, exerciseContent, chatHistory, exerciseSetId } = req.body;
        
        console.log('Chat API received:');
        console.log('Message:', message);
        console.log('Exercise content:', exerciseContent);
        console.log('Chat history length:', chatHistory ? chatHistory.length : 0);
        console.log('Exercise set ID:', exerciseSetId);
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get the chat model and instruction for this exercise set
        let chatModel = systemSettings.llmModel; // Default to system setting
        let chatInstruction = systemSettings.defaultChatInstruction; // Default instruction
        
        if (exerciseSetId) {
            const exerciseSet = exerciseSets.find(set => set.id === exerciseSetId);
            if (exerciseSet) {
                if (exerciseSet.chatModel) {
                    chatModel = exerciseSet.chatModel;
                }
                if (exerciseSet.chatInstruction) {
                    chatInstruction = exerciseSet.chatInstruction;
                }
            }
        }

        const response = await generateChatResponse(message, exerciseContent, chatHistory, chatModel, chatInstruction);
        res.json({ response });
    } catch (error) {
        console.error('Error generating chat response:', error);
        res.status(500).json({ error: 'Failed to generate chat response' });
    }
});

// API routes for future database integration
app.get('/api/exercises/:id', (req, res) => {
    // In production, this would fetch from PostgreSQL
    res.json({ message: 'Exercise set endpoint - to be implemented with database' });
});

app.post('/api/exercises', (req, res) => {
    // In production, this would save to PostgreSQL
    res.json({ message: 'Save exercise set endpoint - to be implemented with database' });
});

// Admin API routes
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.get('/api/admin/settings', verifyAdminToken, (req, res) => {
    res.json(systemSettings);
});

// Public endpoint for getting default chat instruction (for teacher page)
app.get('/api/settings/default-chat-instruction', (req, res) => {
    res.json({ defaultChatInstruction: systemSettings.defaultChatInstruction });
});

app.post('/api/admin/settings', verifyAdminToken, (req, res) => {
    try {
        const { llmModel, defaultChatInstruction } = req.body;
        
        if (llmModel) {
            systemSettings.llmModel = llmModel;
        }
        
        if (defaultChatInstruction !== undefined) {
            systemSettings.defaultChatInstruction = defaultChatInstruction;
        }
        
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

app.get('/api/admin/exercise-sets', verifyAdminToken, (req, res) => {
    res.json(exerciseSets);
});

app.delete('/api/admin/exercise-sets/:id', verifyAdminToken, (req, res) => {
    try {
        const { id } = req.params;
        const index = exerciseSets.findIndex(set => set.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        exerciseSets.splice(index, 1);
        res.json({ message: 'Exercise set deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete exercise set' });
    }
});

app.post('/api/admin/exercise-sets/:id/chat-model', verifyAdminToken, (req, res) => {
    try {
        const { id } = req.params;
        const { chatModel } = req.body;
        
        const exerciseSet = exerciseSets.find(set => set.id === id);
        if (!exerciseSet) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        exerciseSet.chatModel = chatModel;
        res.json({ message: 'Chat model updated successfully' });
    } catch (error) {
        console.error('Chat model update error:', error);
        res.status(500).json({ error: 'Failed to update chat model' });
    }
});

app.post('/api/admin/exercise-sets/:id/chat-instruction', (req, res) => {
    try {
        const { id } = req.params;
        const { chatInstruction } = req.body;
        
        const exerciseSet = exerciseSets.find(set => set.id === id);
        if (!exerciseSet) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        exerciseSet.chatInstruction = chatInstruction;
        res.json({ message: 'Chat instruction updated successfully' });
    } catch (error) {
        console.error('Chat instruction update error:', error);
        res.status(500).json({ error: 'Failed to update chat instruction' });
    }
});

// Endpoint to track exercise set access
app.post('/api/exercise-sets/:id/access', (req, res) => {
    try {
        const { id } = req.params;
        const exerciseSet = exerciseSets.find(set => set.id === id);
        
        if (exerciseSet) {
            exerciseSet.lastUsed = new Date().toISOString();
        }
        
        res.json({ message: 'Access tracked' });
    } catch (error) {
        console.error('Access tracking error:', error);
        res.status(500).json({ error: 'Failed to track access' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// AI Generation Functions
async function generateExercisesWithAI(prompt, count) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an educational exercise generator. Create ${count} diverse, engaging exercises based on the teacher's prompt. Each exercise should be clear, age-appropriate, and educational. Return only the exercises, one per line, without numbering or additional formatting.`
                },
                {
                    role: "user",
                    content: `Generate ${count} exercises for: ${prompt}`
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        const exercisesText = completion.choices[0].message.content;
        const exercises = exercisesText.split('\n')
            .filter(line => line.trim())
            .map((exercise, index) => ({
                id: index + 1,
                text: exercise.trim()
            }));

        return exercises;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error('Failed to generate exercises with AI');
    }
}

async function generateTitleWithAI(prompt) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an educational content creator. Generate a concise, engaging title for an exercise set based on the teacher's prompt. The title should be 2-6 words and clearly indicate the subject matter. Return only the title, no additional text."
                },
                {
                    role: "user",
                    content: `Create a title for exercises about: ${prompt}`
                }
            ],
            max_tokens: 50,
            temperature: 0.5
        });

        return completion.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error('OpenAI API error for title:', error);
        // Fallback to simple title generation
        const words = prompt.split(' ').slice(0, 3);
        return words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') + ' Exercises';
    }
}

async function generateChatResponse(message, exerciseContent, chatHistory, chatModel = systemSettings.llmModel, chatInstruction = systemSettings.defaultChatInstruction) {
    try {
        let systemPrompt = chatInstruction;
        
        if (exerciseContent) {
            systemPrompt += `\n\nIMPORTANT: The student is currently working on this exercise: "${exerciseContent}"\n\nUse this exercise context to provide relevant help. If the student asks about "the exercise" or "this problem", they are referring to the exercise above.`;
        } else {
            systemPrompt += `\n\nNote: No specific exercise context is available at the moment.`;
        }

        const messages = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        // Add chat history if provided
        if (chatHistory && chatHistory.length > 0) {
            messages.push(...chatHistory);
        }

        // Add the current message
        messages.push({
            role: "user",
            content: message
        });

        const completion = await openai.chat.completions.create({
            model: systemSettings.llmModel,
            messages: messages,
            max_tokens: 300,
            temperature: 0.7
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API error for chat:', error);
        return "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the app`);
});

module.exports = app;
