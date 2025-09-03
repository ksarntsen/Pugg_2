// Student page JavaScript
class StudentExerciseViewer {
    constructor() {
        this.exercises = [];
        this.currentExerciseIndex = 0;
        this.exerciseId = null;
        this.chatHistory = [];
        this.lastExerciseIndex = -1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadExerciseSet();
    }

    setupEventListeners() {
        document.getElementById('showExercises').addEventListener('click', () => {
            this.showExercises();
        });

        document.getElementById('prevExercise').addEventListener('click', () => {
            this.previousExercise();
        });

        document.getElementById('nextExercise').addEventListener('click', () => {
            this.nextExercise();
        });

        // Chat functionality
        document.getElementById('chatBubble').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('chatClose').addEventListener('click', () => {
            this.closeChat();
        });

        document.getElementById('chatSend').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        document.getElementById('chatInput').addEventListener('input', (e) => {
            const sendBtn = document.getElementById('chatSend');
            sendBtn.disabled = !e.target.value.trim();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousExercise();
            } else if (e.key === 'ArrowRight') {
                this.nextExercise();
            }
        });
    }

    async loadExerciseSet() {
        const urlParams = new URLSearchParams(window.location.search);
        this.exerciseId = urlParams.get('id');

        if (!this.exerciseId) {
            this.showError('No exercise set found. Please check the link.');
            return;
        }

        try {
            // In production, this would load from a database
            // For now, we'll load from localStorage
            const savedData = localStorage.getItem(`exercise_${this.exerciseId}`);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                this.exercises = data.exercises;
                document.getElementById('exerciseTitle').textContent = data.title;
                this.trackAccess();
            } else {
                this.showError('Exercise set not found or has expired.');
            }
        } catch (error) {
            console.error('Error loading exercise set:', error);
            this.showError('Error loading exercises. Please try again.');
        }
    }

    async trackAccess() {
        if (this.exerciseId) {
            try {
                await fetch(`/api/exercise-sets/${this.exerciseId}/access`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Error tracking access:', error);
            }
        }
    }

    showExercises() {
        if (this.exercises.length === 0) {
            this.showError('No exercises available.');
            return;
        }

        // Hide title section and show exercise view
        document.getElementById('titleSection').style.display = 'none';
        document.getElementById('exerciseView').style.display = 'flex';
        document.getElementById('progressContainer').style.display = 'block';

        // Show first exercise
        this.currentExerciseIndex = 0;
        this.displayCurrentExercise();
    }

    displayCurrentExercise() {
        const exercise = this.exercises[this.currentExerciseIndex];
        
        document.getElementById('exerciseNumber').textContent = this.currentExerciseIndex + 1;
        
        // Use innerHTML to allow HTML content and mathematical expressions
        const exerciseTextElement = document.getElementById('exerciseText');
        exerciseTextElement.innerHTML = this.escapeHtml(exercise.text);

        // Update navigation buttons
        const prevBtn = document.getElementById('prevExercise');
        const nextBtn = document.getElementById('nextExercise');

        prevBtn.disabled = this.currentExerciseIndex === 0;
        nextBtn.disabled = this.currentExerciseIndex === this.exercises.length - 1;

        // Update progress bar
        this.updateProgressBar();

        // Add smooth transition effect
        const exerciseContent = document.querySelector('.exercise-content');
        exerciseContent.style.opacity = '0';
        exerciseContent.style.transform = 'translateY(20px)';

        setTimeout(() => {
            exerciseContent.style.opacity = '1';
            exerciseContent.style.transform = 'translateY(0)';
            
            // Render mathematical expressions with MathJax
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([exerciseTextElement]).catch((err) => {
                    console.error('MathJax rendering error:', err);
                });
            }
        }, 100);
    }

    escapeHtml(text) {
        // Escape HTML characters but preserve mathematical expressions
        // First, temporarily replace LaTeX expressions with placeholders
        const mathPlaceholders = [];
        let processedText = text;
        
        // Handle inline math expressions \(...\)
        processedText = processedText.replace(/\\([^)]+)\\)/g, (match, content) => {
            const placeholder = `__MATH_INLINE_${mathPlaceholders.length}__`;
            mathPlaceholders.push(`\\(${content}\\)`);
            return placeholder;
        });
        
        // Handle display math expressions \[...\]
        processedText = processedText.replace(/\\\[([^\]]+)\\\]/g, (match, content) => {
            const placeholder = `__MATH_DISPLAY_${mathPlaceholders.length}__`;
            mathPlaceholders.push(`\\[${content}\\]`);
            return placeholder;
        });
        
        // Handle dollar sign math expressions $...$ and $$...$$
        processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, content) => {
            const placeholder = `__MATH_DISPLAY_${mathPlaceholders.length}__`;
            mathPlaceholders.push(`$$${content}$$`);
            return placeholder;
        });
        
        processedText = processedText.replace(/\$([^$]+)\$/g, (match, content) => {
            const placeholder = `__MATH_INLINE_${mathPlaceholders.length}__`;
            mathPlaceholders.push(`$${content}$`);
            return placeholder;
        });
        
        // Now escape HTML characters
        processedText = processedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Restore the mathematical expressions
        mathPlaceholders.forEach((expression, index) => {
            const placeholder = expression.includes('$$') ? 
                `__MATH_DISPLAY_${index}__` : 
                `__MATH_INLINE_${index}__`;
            processedText = processedText.replace(placeholder, expression);
        });
        
        return processedText;
    }

    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        const progress = ((this.currentExerciseIndex + 1) / this.exercises.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Exercise ${this.currentExerciseIndex + 1} of ${this.exercises.length}`;
    }

    previousExercise() {
        if (this.currentExerciseIndex > 0) {
            this.currentExerciseIndex--;
            this.displayCurrentExercise();
        }
    }

    nextExercise() {
        if (this.currentExerciseIndex < this.exercises.length - 1) {
            this.currentExerciseIndex++;
            this.displayCurrentExercise();
        }
    }

    showError(message) {
        const titleSection = document.getElementById('titleSection');
        titleSection.innerHTML = `
            <h1 style="color: #e53e3e;">Error</h1>
            <p style="color: #718096; margin-bottom: 2rem;">${message}</p>
            <button onclick="window.location.reload()" class="btn btn-primary">Try Again</button>
        `;
    }

    // Chat functionality
    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow.style.display === 'none') {
            this.openChat();
        } else {
            this.closeChat();
        }
    }

    openChat() {
        document.getElementById('chatWindow').style.display = 'flex';
        document.getElementById('chatInput').focus();
    }

    closeChat() {
        document.getElementById('chatWindow').style.display = 'none';
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input and disable send button
        input.value = '';
        document.getElementById('chatSend').disabled = true;

        // Add user message to chat
        this.addMessage(message, 'user');

        // Always include exercise content for the first message, or when exercise changes
        const exerciseContent = (this.chatHistory.length === 0 || this.lastExerciseIndex !== this.currentExerciseIndex) ? 
            this.exercises[this.currentExerciseIndex]?.text : null;
        
        this.lastExerciseIndex = this.currentExerciseIndex;
        
        // Debug logging
        console.log('Sending message:', message);
        console.log('Exercise content:', exerciseContent);
        console.log('Current exercise index:', this.currentExerciseIndex);
        console.log('Last exercise index:', this.lastExerciseIndex);

        // Show typing indicator
        const typingId = this.addMessage('Thinking...', 'typing');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    exerciseContent: exerciseContent,
                    chatHistory: this.chatHistory,
                    exerciseSetId: this.exerciseId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove typing indicator
            this.removeMessage(typingId);
            
            // Add AI response
            this.addMessage(data.response, 'assistant');
            
            // Update chat history
            this.chatHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.response }
            );

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Remove typing indicator
            this.removeMessage(typingId);
            
            // Add error message
            this.addMessage('Sorry, I had trouble responding. Please try again.', 'assistant');
        }
    }

    addMessage(text, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.id = messageId;
        messageDiv.innerHTML = this.escapeHtml(text);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Render mathematical expressions with MathJax
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([messageDiv]).catch((err) => {
                console.error('MathJax rendering error in chat:', err);
            });
        }
        
        return messageId;
    }

    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new StudentExerciseViewer();
});
