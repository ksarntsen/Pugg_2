// Teacher page JavaScript
class ExerciseGenerator {
    constructor() {
        this.exercises = [];
        this.exerciseId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFromURL();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('exerciseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateExercises();
        });

        // PDF download
        document.getElementById('downloadPdf').addEventListener('click', () => {
            this.downloadPDF();
        });

        // Add exercise button
        document.getElementById('addExercise').addEventListener('click', () => {
            this.addNewExercise();
        });

        // Copy buttons
        document.getElementById('copyLink').addEventListener('click', () => {
            this.copyToClipboard('studentLink');
        });

        document.getElementById('copyTeacherLink').addEventListener('click', () => {
            this.copyToClipboard('teacherLink');
        });

        // Edit chat instruction button
        document.getElementById('editChatInstruction').addEventListener('click', () => {
            this.editInstruction();
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
    }

    async generateExercises() {
        const count = parseInt(document.getElementById('exerciseCount').value);
        const prompt = document.getElementById('exercisePrompt').value;

        if (!prompt.trim()) {
            alert('Please enter a description for the exercises.');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#exerciseForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span> Generating...';
        submitBtn.disabled = true;

        try {
            // Call the AI API endpoint
            const response = await fetch('/api/generate-exercises', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    count: count
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.exercises = data.exercises;
            this.exerciseId = data.id || this.generateId();

            this.displayExercises(data.title);
            this.updateURL();
            this.showShareInfo();
            this.trackAccess();

        } catch (error) {
            console.error('Error generating exercises:', error);
            alert('Error generating exercises. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }



    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    displayExercises(title) {
        // Show exercise section
        document.getElementById('generationSection').style.display = 'none';
        document.getElementById('exerciseSection').style.display = 'block';

        // Set title
        document.getElementById('exerciseTitle').value = title;

        // Display exercises
        this.refreshExerciseDisplay();

        // Show add exercise button
        document.getElementById('addExercise').style.display = 'block';
        
        // Show edit chat instruction button
        document.getElementById('editChatInstruction').style.display = 'block';
    }

    createExerciseElement(exercise, index) {
        const div = document.createElement('div');
        div.className = 'exercise-item';
        div.draggable = true;
        div.dataset.index = index;

        div.innerHTML = `
            <div class="exercise-number">${index + 1}</div>
            <textarea class="exercise-text" data-index="${index}">${exercise.text}</textarea>
            <div class="exercise-actions">
                <button class="remove-exercise" data-index="${index}" title="Remove exercise">🗑️</button>
            </div>
        `;

        // Add event listeners
        const textarea = div.querySelector('.exercise-text');
        textarea.addEventListener('input', (e) => {
            this.exercises[index].text = e.target.value;
        });

        const removeBtn = div.querySelector('.remove-exercise');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeExercise(index);
        });

        return div;
    }

    setupDragAndDrop() {
        const exerciseList = document.getElementById('exerciseList');
        let draggedElement = null;

        exerciseList.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.classList.add('dragging');
        });

        exerciseList.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            draggedElement = null;
        });

        exerciseList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(exerciseList, e.clientY);
            if (afterElement == null) {
                exerciseList.appendChild(draggedElement);
            } else {
                exerciseList.insertBefore(draggedElement, afterElement);
            }
        });

        exerciseList.addEventListener('drop', (e) => {
            e.preventDefault();
            this.updateExerciseOrder();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.exercise-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateExerciseOrder() {
        const exerciseItems = document.querySelectorAll('.exercise-item');
        const newExercises = [];

        exerciseItems.forEach((item, index) => {
            const textarea = item.querySelector('.exercise-text');
            const originalIndex = parseInt(textarea.dataset.index);
            newExercises.push(this.exercises[originalIndex]);
            
            // Update the exercise number
            item.querySelector('.exercise-number').textContent = index + 1;
            textarea.dataset.index = index;
            item.querySelector('.remove-exercise').dataset.index = index;
        });

        this.exercises = newExercises;
    }

    removeExercise(index) {
        if (this.exercises.length <= 1) {
            alert('You must have at least one exercise.');
            return;
        }

        if (confirm('Are you sure you want to remove this exercise?')) {
            this.exercises.splice(index, 1);
            this.refreshExerciseDisplay();
        }
    }

    addNewExercise() {
        const newExercise = {
            id: this.exercises.length + 1,
            text: 'New exercise - click to edit'
        };
        
        this.exercises.push(newExercise);
        this.refreshExerciseDisplay();
        
        // Focus on the new exercise textarea
        const exerciseItems = document.querySelectorAll('.exercise-item');
        const lastExercise = exerciseItems[exerciseItems.length - 1];
        const textarea = lastExercise.querySelector('.exercise-text');
        textarea.focus();
        textarea.select();
    }

    refreshExerciseDisplay() {
        const exerciseList = document.getElementById('exerciseList');
        exerciseList.innerHTML = '';

        this.exercises.forEach((exercise, index) => {
            const exerciseElement = this.createExerciseElement(exercise, index);
            exerciseList.appendChild(exerciseElement);
        });

        this.setupDragAndDrop();
    }

    showShareInfo() {
        const shareInfo = document.getElementById('shareInfo');
        const studentLink = document.getElementById('studentLink');
        const teacherLink = document.getElementById('teacherLink');

        const baseUrl = window.location.origin;
        const studentUrl = `${baseUrl}/student.html?id=${this.exerciseId}`;
        const teacherUrl = `${baseUrl}/?id=${this.exerciseId}`;

        studentLink.value = studentUrl;
        teacherLink.value = teacherUrl;

        shareInfo.style.display = 'block';
    }

    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        element.select();
        element.setSelectionRange(0, 99999);

        try {
            await navigator.clipboard.writeText(element.value);
            this.showSuccessMessage('Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            document.execCommand('copy');
            this.showSuccessMessage('Link copied to clipboard!');
        }
    }

    showSuccessMessage(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;

        const shareInfo = document.getElementById('shareInfo');
        shareInfo.insertBefore(messageDiv, shareInfo.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    async downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const title = document.getElementById('exerciseTitle').value;
        const exercises = this.exercises;

        // Add title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(title, 20, 30);

        // Add exercises
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        let yPosition = 60;
        exercises.forEach((exercise, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 30;
            }

            // Exercise number
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}.`, 20, yPosition);
            
            // Exercise text
            doc.setFont(undefined, 'normal');
            const textLines = doc.splitTextToSize(exercise.text, 160);
            doc.text(textLines, 30, yPosition);
            
            yPosition += textLines.length * 7 + 10;
        });

        // Download
        doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    }

    updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('id', this.exerciseId);
        window.history.pushState({}, '', url);
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
            this.loadExerciseSet(id);
        }
    }

    async loadExerciseSet(id) {
        // In production, this would load from a database
        // For now, we'll simulate loading
        try {
            const savedData = localStorage.getItem(`exercise_${id}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.exercises = data.exercises;
                this.exerciseId = id;
                
                this.displayExercises(data.title);
                this.showShareInfo();
                this.trackAccess();
            }
        } catch (error) {
            console.error('Error loading exercise set:', error);
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

    saveExerciseSet() {
        if (this.exerciseId && this.exercises.length > 0) {
            const title = document.getElementById('exerciseTitle').value;
            const data = {
                title: title,
                exercises: this.exercises,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(`exercise_${this.exerciseId}`, JSON.stringify(data));
        }
    }

    async editInstruction() {
        const modal = document.getElementById('instructionModal');
        const textarea = document.getElementById('instructionText');
        
        // Load current instruction or default instruction
        let instruction = this.chatInstruction;
        if (!instruction) {
            // Load default instruction from settings
            try {
                const response = await fetch('/api/settings/default-chat-instruction');
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
    }

    async saveInstruction() {
        const instruction = document.getElementById('instructionText').value;
        this.chatInstruction = instruction;
        
        try {
            const response = await fetch(`/api/admin/exercise-sets/${this.exerciseId}/chat-instruction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chatInstruction: instruction })
            });

            if (response.ok) {
                this.showSuccessMessage('Chat instruction updated successfully!');
                this.closeInstructionModal();
            } else {
                this.showErrorMessage('Failed to update chat instruction');
            }
        } catch (error) {
            console.error('Error updating chat instruction:', error);
            this.showErrorMessage('Network error. Please try again.');
        }
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new ExerciseGenerator();
    
    // Save exercises periodically
    setInterval(() => {
        app.saveExerciseSet();
    }, 5000);
});
