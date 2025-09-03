// Admin dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.exerciseSets = [];
        this.currentEditingSetId = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadSettings();
        this.loadExerciseSets();
    }

    checkAuth() {
        const token = localStorage.getItem('adminToken');
        console.log('Checking auth, token:', token ? 'present' : 'missing');
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '/admin';
            return;
        }
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Modal event listeners
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeInstructionModal();
        });

        document.getElementById('modalCancel').addEventListener('click', () => {
            this.closeInstructionModal();
        });

        document.getElementById('modalSave').addEventListener('click', () => {
            this.saveInstruction();
        });

        // Close modal when clicking outside
        document.getElementById('instructionModal').addEventListener('click', (e) => {
            if (e.target.id === 'instructionModal') {
                this.closeInstructionModal();
            }
        });

        // Event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            // Handle chat model select changes
            if (e.target.classList.contains('chat-model-select')) {
                const setId = e.target.dataset.setId;
                const model = e.target.value;
                this.updateChatModel(setId, model);
            }
            
            // Handle instruction edit buttons
            if (e.target.classList.contains('btn-instruction')) {
                const setId = e.target.dataset.setId;
                this.editInstruction(setId);
            }
            
            // Handle delete buttons
            if (e.target.classList.contains('btn-trash')) {
                const setId = e.target.dataset.setId;
                this.deleteExerciseSet(setId);
            }
        });
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/admin/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const settings = await response.json();
                document.getElementById('llmModel').value = settings.llmModel || 'gpt-3.5-turbo';
                document.getElementById('defaultChatInstruction').value = settings.defaultChatInstruction || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        const llmModel = document.getElementById('llmModel').value;
        const defaultChatInstruction = document.getElementById('defaultChatInstruction').value;
        
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ llmModel, defaultChatInstruction })
            });

            if (response.ok) {
                this.showSuccessMessage('Settings saved successfully!');
            } else {
                this.showErrorMessage('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showErrorMessage('Network error. Please try again.');
        }
    }

    async loadExerciseSets() {
        try {
            const token = localStorage.getItem('adminToken');
            console.log('Loading exercise sets with token:', token ? 'present' : 'missing');
            
            const response = await fetch('/api/admin/exercise-sets', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status);
            
            if (response.ok) {
                this.exerciseSets = await response.json();
                console.log('Exercise sets loaded:', this.exerciseSets);
                this.renderExerciseSets();
            } else if (response.status === 401) {
                console.log('Unauthorized, redirecting to login');
                localStorage.removeItem('adminToken');
                window.location.href = '/admin';
            } else {
                console.log('Failed to load exercise sets, status:', response.status);
                this.showErrorMessage('Failed to load exercise sets');
            }
        } catch (error) {
            console.error('Error loading exercise sets:', error);
            this.showErrorMessage('Network error. Please try again.');
        }
    }

    renderExerciseSets() {
        const tbody = document.getElementById('exerciseSetsTable');
        
        if (this.exerciseSets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">No exercise sets found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.exerciseSets.map(set => `
            <tr>
                <td>${set.id}</td>
                <td>${set.title}</td>
                <td>${set.createdBy}</td>
                <td>${this.formatDate(set.createdAt)}</td>
                <td>${this.formatDate(set.lastUsed)}</td>
                <td>
                    <select class="chat-model-select" data-set-id="${set.id}">
                        <option value="gpt-3.5-turbo" ${(set.chatModel || 'gpt-3.5-turbo') === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5</option>
                        <option value="gpt-4" ${(set.chatModel || 'gpt-3.5-turbo') === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                        <option value="gpt-4-turbo" ${(set.chatModel || 'gpt-3.5-turbo') === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
                    </select>
                </td>
                <td>
                    <button class="btn-instruction" data-set-id="${set.id}" title="Edit chat instruction">
                        ${set.chatInstruction ? '✏️ Edit' : '➕ Add'} Instruction
                    </button>
                </td>
                <td class="actions">
                    <a href="/?id=${set.id}" class="btn btn-small btn-outline" target="_blank">Teacher</a>
                    <a href="/student.html?id=${set.id}" class="btn btn-small btn-outline" target="_blank">Student</a>
                    <button class="btn-trash" data-set-id="${set.id}" title="Delete exercise set">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    async updateChatModel(setId, model) {
        try {
            const response = await fetch(`/api/admin/exercise-sets/${setId}/chat-model`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ chatModel: model })
            });

            if (response.ok) {
                // Update the local data
                const exerciseSet = this.exerciseSets.find(set => set.id === setId);
                if (exerciseSet) {
                    exerciseSet.chatModel = model;
                }
                this.showSuccessMessage('Chat model updated successfully!');
            } else {
                this.showErrorMessage('Failed to update chat model');
            }
        } catch (error) {
            console.error('Error updating chat model:', error);
            this.showErrorMessage('Network error. Please try again.');
        }
    }

    async editInstruction(setId) {
        const exerciseSet = this.exerciseSets.find(set => set.id === setId);
        this.currentEditingSetId = setId;
        
        const modal = document.getElementById('instructionModal');
        const textarea = document.getElementById('instructionText');
        
        // Load the current instruction or default instruction
        let instruction = exerciseSet.chatInstruction;
        if (!instruction) {
            // Load default instruction from settings
            try {
                const response = await fetch('/api/admin/settings', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });
                if (response.ok) {
                    const settings = await response.json();
                    instruction = settings.defaultChatInstruction || '';
                }
            } catch (error) {
                console.error('Error loading default instruction:', error);
            }
        }
        
        textarea.value = instruction || '';
        modal.style.display = 'flex';
        textarea.focus();
    }

    closeInstructionModal() {
        const modal = document.getElementById('instructionModal');
        modal.style.display = 'none';
        this.currentEditingSetId = null;
    }

    async saveInstruction() {
        if (!this.currentEditingSetId) return;
        
        const instruction = document.getElementById('instructionText').value;
        
        try {
            const response = await fetch(`/api/admin/exercise-sets/${this.currentEditingSetId}/chat-instruction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ chatInstruction: instruction })
            });

            if (response.ok) {
                // Update the local data
                const exerciseSet = this.exerciseSets.find(set => set.id === this.currentEditingSetId);
                if (exerciseSet) {
                    exerciseSet.chatInstruction = instruction;
                }
                this.showSuccessMessage('Chat instruction updated successfully!');
                this.closeInstructionModal();
                this.renderExerciseSets(); // Re-render to update the button text
            } else {
                this.showErrorMessage('Failed to update chat instruction');
            }
        } catch (error) {
            console.error('Error updating chat instruction:', error);
            this.showErrorMessage('Network error. Please try again.');
        }
    }

    async deleteExerciseSet(id) {
        if (!confirm('Are you sure you want to delete this exercise set? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/exercise-sets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.showSuccessMessage('Exercise set deleted successfully!');
                this.loadExerciseSets(); // Reload the list
            } else {
                this.showErrorMessage('Failed to delete exercise set');
            }
        } catch (error) {
            console.error('Error deleting exercise set:', error);
            this.showErrorMessage('Network error. Please try again.');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.admin-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message ${type}`;
        messageDiv.textContent = message;

        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
