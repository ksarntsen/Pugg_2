require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const OpenAI = require('openai');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Initialize admin user on startup
async function initializeAdmin() {
    try {
        const existingAdmin = await db.getAdminUser(ADMIN_USERNAME);
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await db.createAdminUser(ADMIN_USERNAME, hashedPassword);
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error initializing admin user:', error);
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
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
        
        // Generate unique ID and save to database
        const id = Math.random().toString(36).substr(2, 9);
        const userIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        
        const exerciseSet = {
            id,
            title,
            exercises,
            chatLanguage: 'English', // Default language
            createdBy: userIP,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        await db.createExerciseSet(exerciseSet);
        
        res.json({ exercises, title, id });
    } catch (error) {
        console.error('Error generating exercises:', error);
        res.status(500).json({ error: 'Failed to generate exercises' });
    }
});

// API route for generating additional exercises with AI using existing context
app.post('/api/generate-ai-exercises', async (req, res) => {
    try {
        const { prompt, count, existingExercises, exerciseSetId } = req.body;
        
        if (!prompt || !count || !existingExercises) {
            return res.status(400).json({ error: 'Prompt, count, and existing exercises are required' });
        }

        const newExercises = await generateAdditionalExercisesWithAI(prompt, count, existingExercises);
        
        // Update the exercise set in database if exerciseSetId is provided
        if (exerciseSetId) {
            const exerciseSet = await db.getExerciseSet(exerciseSetId);
            if (exerciseSet) {
                // Add new exercises to existing ones
                const newExerciseObjects = newExercises.map((exercise, index) => ({
                    id: exerciseSet.exercises.length + index + 1,
                    text: exercise.text
                }));
                const updatedExercises = [...exerciseSet.exercises, ...newExerciseObjects];
                await db.updateExerciseSet(exerciseSetId, { exercises: updatedExercises });
            }
        }
        
        res.json({ exercises: newExercises });
    } catch (error) {
        console.error('Error generating additional exercises:', error);
        res.status(500).json({ error: 'Failed to generate additional exercises' });
    }
});

// API route for AI chat assistant
app.post('/api/chat', async (req, res) => {
    try {
        const { message, chatHistory, exerciseSetId } = req.body;
        
        console.log('=== CHAT API DEBUG START ===');
        console.log('Chat API received:');
        console.log('Message:', message);
        console.log('Chat history length:', chatHistory ? chatHistory.length : 0);
        console.log('Exercise set ID:', exerciseSetId);
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get the chat model and instruction for this exercise set
        const systemSettings = await db.getSystemSettings();
        let chatModel = systemSettings.llm_model; // Default to system setting
        let chatInstruction = systemSettings.default_chat_instruction; // Default instruction
        let chatLanguage = 'English'; // Default language
        
        if (exerciseSetId) {
            const exerciseSet = await db.getExerciseSet(exerciseSetId);
            if (exerciseSet) {
                if (exerciseSet.chat_model) {
                    chatModel = exerciseSet.chat_model;
                }
                if (exerciseSet.chat_instruction) {
                    chatInstruction = exerciseSet.chat_instruction;
                }
                if (exerciseSet.chat_language) {
                    chatLanguage = exerciseSet.chat_language;
                }
            }
        }
        
        // Add language instruction to the chat instruction
        const languageInstruction = `Respond in the following language: ${chatLanguage}, unless prompted by the chat otherwise.`;
        chatInstruction = `${languageInstruction}\n\n${chatInstruction}`;

        console.log('=== CHAT CONFIGURATION ===');
        console.log('Selected LLM Model:', chatModel);
        console.log('Chat Language:', chatLanguage);
        console.log('Full System Instruction:');
        console.log(chatInstruction);
        console.log('=== FULL CHAT HISTORY ===');
        if (chatHistory && chatHistory.length > 0) {
            chatHistory.forEach((msg, index) => {
                console.log(`History[${index}] (${msg.role}):`, msg.content);
            });
        } else {
            console.log('No chat history provided');
        }
        console.log('Current message (user):', message);
        console.log('=== END CHAT API DEBUG ===');

        const response = await generateChatResponse(message, chatHistory, chatModel, chatInstruction);
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
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const admin = await db.getAdminUser(username);
        if (admin && await bcrypt.compare(password, admin.password_hash)) {
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

app.get('/api/admin/settings', verifyAdminToken, async (req, res) => {
    try {
        const settings = await db.getSystemSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Public endpoint for getting default chat instruction (for teacher page)
app.get('/api/settings/default-chat-instruction', async (req, res) => {
    try {
        const settings = await db.getSystemSettings();
        res.json({ defaultChatInstruction: settings.default_chat_instruction });
    } catch (error) {
        console.error('Error fetching default chat instruction:', error);
        res.status(500).json({ error: 'Failed to fetch default chat instruction' });
    }
});

app.post('/api/admin/settings', verifyAdminToken, async (req, res) => {
    try {
        const { llmModel, defaultChatInstruction } = req.body;
        
        const updates = {};
        if (llmModel) {
            updates.llmModel = llmModel;
        }
        if (defaultChatInstruction !== undefined) {
            updates.defaultChatInstruction = defaultChatInstruction;
        }
        
        await db.updateSystemSettings(updates);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

app.get('/api/admin/exercise-sets', verifyAdminToken, async (req, res) => {
    try {
        const exerciseSets = await db.getAllExerciseSets();
        res.json(exerciseSets);
    } catch (error) {
        console.error('Error fetching exercise sets:', error);
        res.status(500).json({ error: 'Failed to fetch exercise sets' });
    }
});

app.delete('/api/admin/exercise-sets/:id', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db.deleteExerciseSet(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        res.json({ message: 'Exercise set deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete exercise set' });
    }
});

app.post('/api/admin/exercise-sets/:id/chat-model', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { chatModel } = req.body;
        
        const exerciseSet = await db.updateExerciseSet(id, { chatModel });
        if (!exerciseSet) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        res.json({ message: 'Chat model updated successfully' });
    } catch (error) {
        console.error('Chat model update error:', error);
        res.status(500).json({ error: 'Failed to update chat model' });
    }
});

app.post('/api/admin/exercise-sets/:id/chat-instruction', async (req, res) => {
    try {
        const { id } = req.params;
        const { chatInstruction } = req.body;
        
        const exerciseSet = await db.updateExerciseSet(id, { chatInstruction });
        if (!exerciseSet) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        res.json({ message: 'Chat instruction updated successfully' });
    } catch (error) {
        console.error('Chat instruction update error:', error);
        res.status(500).json({ error: 'Failed to update chat instruction' });
    }
});

app.post('/api/admin/exercise-sets/:id/chat-language', async (req, res) => {
    try {
        const { id } = req.params;
        const { chatLanguage } = req.body;
        
        const exerciseSet = await db.updateExerciseSet(id, { chatLanguage });
        if (!exerciseSet) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        res.json({ message: 'Chat language updated successfully' });
    } catch (error) {
        console.error('Chat language update error:', error);
        res.status(500).json({ error: 'Failed to update chat language' });
    }
});

// Public endpoint for updating chat language (for teachers)
app.post('/api/exercise-sets/:id/chat-language', async (req, res) => {
    try {
        const { id } = req.params;
        const { chatLanguage } = req.body;
        
        const exerciseSet = await db.updateExerciseSet(id, { chatLanguage });
        if (!exerciseSet) {
            return res.status(404).json({ error: 'Exercise set not found' });
        }
        
        res.json({ message: 'Chat language updated successfully' });
    } catch (error) {
        console.error('Chat language update error:', error);
        res.status(500).json({ error: 'Failed to update chat language' });
    }
});

// Endpoint to track exercise set access
app.post('/api/exercise-sets/:id/access', async (req, res) => {
    try {
        const { id } = req.params;
        await db.updateLastUsed(id);
        res.json({ message: 'Access tracked' });
    } catch (error) {
        console.error('Access tracking error:', error);
        res.status(500).json({ error: 'Failed to track access' });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await db.healthCheck();
        res.json({ 
            status: dbHealthy ? 'OK' : 'DEGRADED',
            database: dbHealthy ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR',
            database: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// AI Generation Functions
async function generateExercisesWithAI(prompt, count) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an educational exercise generator. Create ${count} diverse, engaging exercises based on the teacher's prompt. Each exercise should be clear, age-appropriate, and educational.

IMPORTANT: When creating mathematical exercises:
- Use proper mathematical notation and symbols (π, ∑, ∫, √, ±, ≤, ≥, ≠, ∞, etc.)
- For mathematical expressions, use LaTeX formatting with single dollar signs for inline math: $x^2 + 3x - 4 = 0$
- For display math, use double dollar signs: $$\\frac{a}{b} = \\frac{c}{d}$$
- Ensure mathematical symbols render correctly in web browsers

Return only the exercises, one per line, without numbering or additional formatting.`
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

async function generateAdditionalExercisesWithAI(prompt, count, existingExercises) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an educational exercise generator. You will be given existing exercises as context and asked to generate ${count} additional exercises that match the same style, difficulty level, and educational approach.

IMPORTANT CONTEXT - Here are the existing exercises:
${existingExercises}

Your task: Generate ${count} new exercises that:
1. Match the same style and format as the existing exercises
2. Are at the same difficulty level
3. Cover similar or related topics
4. Maintain consistency with the educational approach
5. Are diverse and engaging

IMPORTANT: When creating mathematical exercises:
- Use proper mathematical notation and symbols (π, ∑, ∫, √, ±, ≤, ≥, ≠, ∞, etc.)
- For mathematical expressions, use LaTeX formatting with single dollar signs for inline math: $x^2 + 3x - 4 = 0$
- For display math, use double dollar signs: $$\\frac{a}{b} = \\frac{c}{d}$$
- Ensure mathematical symbols render correctly in web browsers

Return only the new exercises, one per line, without numbering or additional formatting.`
                },
                {
                    role: "user",
                    content: `Generate ${count} additional exercises based on this request: ${prompt}

Make sure the new exercises fit well with the existing ones and maintain the same quality and style.`
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
        console.error('OpenAI API error for additional exercises:', error);
        throw new Error('Failed to generate additional exercises with AI');
    }
}

async function generateChatResponse(message, chatHistory, chatModel = systemSettings.llmModel, chatInstruction = systemSettings.defaultChatInstruction) {
    try {
        console.log('=== GENERATE CHAT RESPONSE DEBUG START ===');
        console.log('LLM Model being used:', chatModel);
        
        // Check if this is a GPT-5 model that requires the Responses API
        const isGPT5Model = chatModel.startsWith('gpt-5');
        
        if (isGPT5Model) {
            // Use Responses API for GPT-5 models
            const input = `${chatInstruction}\n\n${message}`;
            
            console.log('=== GPT-5 RESPONSES API ===');
            console.log('Full input being sent to GPT-5:');
            console.log(input);
            console.log('=== END GPT-5 DEBUG ===');
            
            const response = await openai.responses.create({
                model: chatModel,
                input: input,
                reasoning: { effort: "minimal" },
                text: { verbosity: "medium" },
                max_output_tokens: 300
            });

            const responseText = response.output_text.trim();
            console.log('GPT-5 Response received:', responseText);
            console.log('=== END GENERATE CHAT RESPONSE DEBUG ===');
            return responseText;
        } else {
            // Use Chat Completions API for older models
            const messages = [
                {
                    role: "system",
                    content: chatInstruction
                }
            ];

            // Add chat history if provided
            if (chatHistory && chatHistory.length > 0) {
                messages.push(...chatHistory);
            }

            // Add the current message (already formatted with context)
            messages.push({
                role: "user",
                content: message
            });

            console.log('=== CHAT COMPLETIONS API ===');
            console.log('Full messages array being sent to OpenAI:');
            messages.forEach((msg, index) => {
                console.log(`Message[${index}] (${msg.role}):`, msg.content);
            });
            console.log('API Parameters:');
            console.log('- Model:', chatModel);
            console.log('- Max tokens: 300');
            console.log('- Temperature: 0.7');
            console.log('=== END CHAT COMPLETIONS DEBUG ===');

            const completion = await openai.chat.completions.create({
                model: chatModel,
                messages: messages,
                max_tokens: 300,
                temperature: 0.7
            });

            const response = completion.choices[0].message.content.trim();
            console.log('OpenAI Response received:', response);
            console.log('=== END GENERATE CHAT RESPONSE DEBUG ===');
            return response;
        }
    } catch (error) {
        console.error('OpenAI API error for chat:', error);
        return "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
    }
}

// Start server
async function startServer() {
    try {
        // Initialize admin user
        await initializeAdmin();
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Visit http://localhost:${PORT} to use the app`);
            console.log(`Health check available at http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await db.close();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
