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

        // AI generate exercise button
        document.getElementById('aiGenerateExercise').addEventListener('click', () => {
            this.openAIGenerationModal();
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

        // AI modal event listeners
        document.getElementById('aiModalClose').addEventListener('click', () => {
            this.closeAIGenerationModal();
        });

        document.getElementById('aiModalCancel').addEventListener('click', () => {
            this.closeAIGenerationModal();
        });

        document.getElementById('aiModalGenerate').addEventListener('click', () => {
            this.generateAIExercises();
        });

        // Close AI modal when clicking outside
        document.getElementById('aiGenerationModal').addEventListener('click', (e) => {
            if (e.target.id === 'aiGenerationModal') {
                this.closeAIGenerationModal();
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

        // Show exercise buttons
        document.querySelector('.exercise-buttons').style.display = 'flex';
        
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
        
        // Set up language button event listener now that the element exists
        const setLanguageBtn = document.getElementById('setLanguageBtn');
        if (setLanguageBtn && !setLanguageBtn.hasAttribute('data-listener-added')) {
            setLanguageBtn.addEventListener('click', () => {
                const language = document.getElementById('chatLanguage').value;
                console.log('Set language button clicked, language:', language);
                this.saveExerciseSet();
                this.saveLanguageToServer();
            });
            setLanguageBtn.setAttribute('data-listener-added', 'true');
            console.log('Set language button event listener added');
        }
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

        // Set up better styling
        doc.setProperties({
            title: title,
            subject: 'Exercise Set',
            author: 'Exercise Generator',
            creator: 'Exercise Generator'
        });

        // Add title with better styling
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(title, 20, 40);

        // Add a subtle line under the title
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, 45, 190, 45);

        // Add exercises with improved styling
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        let yPosition = 65;
        const pageWidth = 170; // Available width for content
        const leftMargin = 20;
        const rightMargin = 20;
        
        for (let index = 0; index < exercises.length; index++) {
            const exercise = exercises[index];
            
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 30;
            }

            // Exercise number with better styling
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            doc.text(`${index + 1}.`, leftMargin, yPosition);
            
            // Process exercise text for math expressions
            const processedText = await this.processMathExpressions(exercise.text);
            
            // Add exercise text with improved inline math support
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
            
            // Split text into lines and handle math expressions inline
            const textLines = doc.splitTextToSize(processedText.text, pageWidth);
            let currentY = yPosition;
            
            // Process each line and add math expressions inline
            for (let lineIndex = 0; lineIndex < textLines.length; lineIndex++) {
                const line = textLines[lineIndex];
                const lineWidth = doc.getTextWidth(line);
                
                // Add the text line
                doc.text(line, leftMargin + 15, currentY);
                
                // Check if we have math images that should be positioned inline with this line
                const inlineMathImages = processedText.mathImages.filter(img => img.type === 'inline');
                
                if (inlineMathImages.length > 0 && lineIndex === 0) {
                    // For the first line, try to position inline math expressions
                    let currentX = leftMargin + 15 + lineWidth + 2; // Start after the text
                    
                    for (const mathImage of inlineMathImages) {
                        try {
                            // Use proper sizing to match text height (11pt font ≈ 4mm height)
                            const textHeight = 5; // Slightly larger for better visibility
                            const scale = textHeight / mathImage.height;
                            const scaledWidth = mathImage.width * scale;
                            const scaledHeight = textHeight;
                            
                            // Position the math image inline with the text baseline
                            const baselineOffset = 1; // Slight adjustment for better alignment
                            console.log('Adding inline math image at position:', currentX, currentY - scaledHeight + baselineOffset, 'size:', scaledWidth, 'x', scaledHeight);
                            
                            // Add the actual image with proper sizing
                            doc.addImage(mathImage.dataUrl, 'JPEG', currentX, currentY - scaledHeight + baselineOffset, scaledWidth, scaledHeight);
                            currentX += scaledWidth + 2; // Space after the math expression
                        } catch (error) {
                            console.warn('Failed to add inline math image to PDF:', error);
                        }
                    }
                }
                
                currentY += 5; // Line height
            }
            
            // Add display math expressions (centered, on new lines)
            const displayMathImages = processedText.mathImages.filter(img => img.type === 'display');
            for (const mathImage of displayMathImages) {
                // Check if we need a new page
                if (currentY + mathImage.height > 280) {
                    doc.addPage();
                    currentY = 30;
                }
                
                try {
                    // Scale display math to appropriate size
                    const maxDisplayWidth = 120; // Slightly larger for better visibility
                    const maxDisplayHeight = 18; // Slightly larger for better visibility
                    
                    let displayWidth = mathImage.width;
                    let displayHeight = mathImage.height;
                    
                    // Scale down if too large
                    if (displayWidth > maxDisplayWidth || displayHeight > maxDisplayHeight) {
                        const scaleX = maxDisplayWidth / displayWidth;
                        const scaleY = maxDisplayHeight / displayHeight;
                        const scale = Math.min(scaleX, scaleY);
                        displayWidth = displayWidth * scale;
                        displayHeight = displayHeight * scale;
                    }
                    
                    // Center the display math
                    const centerX = (doc.internal.pageSize.width - displayWidth) / 2;
                    doc.addImage(mathImage.dataUrl, 'JPEG', centerX, currentY, displayWidth, displayHeight);
                    currentY += displayHeight + 5; // Space after display math
                } catch (error) {
                    console.warn('Failed to add display math image to PDF:', error);
                }
            }
            
            yPosition = currentY + 15; // Space between exercises
        }

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, 20, 290);
            doc.text('Generated by Exercise Generator', 150, 290);
        }

        // Download
        doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    }

    async processMathExpressions(text) {
        const mathPlaceholders = [];
        let processedText = text;
        const mathImages = [];
        
        // Handle different math expression formats
        const mathPatterns = [
            { pattern: /\$\$([^$]+)\$\$/g, type: 'display' },
            { pattern: /\$([^$]+)\$/g, type: 'inline' },
            { pattern: /\\\[([^\]]+)\\\]/g, type: 'display' },
            { pattern: /\\\(([^)]+)\\\)/g, type: 'inline' }
        ];
        
        // First pass: find all math expressions and replace with placeholders
        for (const { pattern, type } of mathPatterns) {
            processedText = processedText.replace(pattern, (match, content) => {
                const placeholder = `__MATH_${type.toUpperCase()}_${mathPlaceholders.length}__`;
                mathPlaceholders.push({ latex: content, type, original: match });
                console.log('Found math expression:', content, 'type:', type, 'original:', match);
                return placeholder;
            });
        }
        
        console.log('Total math expressions found:', mathPlaceholders.length);
        
        // Process each math expression
        for (const mathItem of mathPlaceholders) {
            try {
                console.log('Processing math expression:', mathItem.latex, 'type:', mathItem.type);
                const svg = await this.convertLatexToSvg(mathItem.latex, mathItem.type);
                console.log('SVG result:', svg ? 'Success' : 'Failed');
                
                let imageResult = null;
                
                if (svg) {
                    imageResult = await this.svgToImageData(svg);
                    console.log('SVG Image data result:', imageResult ? 'Success' : 'Failed');
                }
                
                // Always try text-based approach for now to ensure reliability
                console.log('Using text-based approach for reliable rendering:', mathItem.latex);
                imageResult = this.createTextBasedMathImage(mathItem.latex, mathItem.type);
                console.log('Text-based image result:', imageResult ? 'Success' : 'Failed');
                
                if (imageResult && imageResult.dataUrl) {
                    // For inline math, use smaller dimensions to better match text height
                    let pdfWidth = imageResult.width;
                    let pdfHeight = imageResult.height;
                    
                    if (mathItem.type === 'inline') {
                        // Scale down inline math to better match text height (11pt font)
                        const textHeight = 8; // Approximate height for 11pt font in PDF
                        if (pdfHeight > textHeight) {
                            const scale = textHeight / pdfHeight;
                            pdfWidth = Math.round(pdfWidth * scale);
                            pdfHeight = Math.round(pdfHeight * scale);
                        }
                    }
                    
                    mathImages.push({
                        dataUrl: imageResult.dataUrl,
                        width: pdfWidth,
                        height: pdfHeight,
                        latex: mathItem.latex,
                        type: mathItem.type,
                        originalWidth: imageResult.width,
                        originalHeight: imageResult.height
                    });
                    console.log('Successfully added math image for:', mathItem.latex, 'with PDF dimensions:', pdfWidth, 'x', pdfHeight);
                }
            } catch (error) {
                console.warn('Failed to process math expression:', mathItem.latex, error);
            }
        }
        
        // Replace placeholders with empty string if we have images, otherwise with text
        mathPlaceholders.forEach((mathItem, index) => {
            const placeholder = `__MATH_${mathItem.type.toUpperCase()}_${index}__`;
            // Only add placeholder text if we don't have a corresponding image
            const hasImage = mathImages.some(img => img.latex === mathItem.latex);
            if (hasImage) {
                processedText = processedText.replace(placeholder, '');
            } else {
                processedText = processedText.replace(placeholder, `[Math Expression ${index + 1}]`);
            }
        });
        
        console.log('Final processed text:', processedText);
        console.log('Math images generated:', mathImages.length);
        
        return { text: processedText, mathImages };
    }

    async convertLatexToSvg(latex, type) {
        return new Promise((resolve) => {
            try {
                console.log('convertLatexToSvg called with:', latex, type);
                // Use MathJax to convert LaTeX to SVG
                const mathJax = window.MathJax;
                if (!mathJax) {
                    console.warn('MathJax not available');
                    resolve(null);
                    return;
                }
                
                console.log('MathJax available, checking startup...');
                // Wait for MathJax to be ready
                mathJax.startup.promise.then(() => {
                    console.log('MathJax startup complete');
                    try {
                        const options = {
                            display: type === 'display',
                            em: type === 'inline' ? 6 : 12, // Smaller for inline, larger for display
                            ex: type === 'inline' ? 3 : 6,  // Proportional to em
                            containerWidth: type === 'inline' ? 60 : 120 // Smaller width for inline math
                        };
                        
                        console.log('Trying direct tex2svg method...');
                        // Try the direct tex2svg method first
                        if (mathJax.tex2svg) {
                            console.log('tex2svg method available');
                            const node = mathJax.tex2svg(latex, options);
                            console.log('tex2svg node:', node);
                            const svg = node.querySelector('svg');
                            if (svg) {
                                console.log('SVG found in direct method');
                                // Clone the SVG to avoid modifying the original
                                const svgClone = svg.cloneNode(true);
                                
                                // Fix color issues by replacing currentColor with black
                                const svgString = svgClone.outerHTML;
                                console.log('Original SVG string:', svgString.substring(0, 200) + '...');
                                const fixedSvgString = svgString.replace(/currentColor/g, 'black');
                                console.log('Fixed SVG string:', fixedSvgString.substring(0, 200) + '...');
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = fixedSvgString;
                                const fixedSvgClone = tempDiv.querySelector('svg');
                                
                                // Get the viewBox to calculate proper dimensions
                                const viewBox = fixedSvgClone.getAttribute('viewBox');
                                if (viewBox) {
                                    const [, , width, height] = viewBox.split(' ').map(Number);
                                    // Calculate scale to fit within our desired size while preserving aspect ratio
                                    const maxWidth = type === 'inline' ? 50 : 100; // Smaller for inline math
                                    const maxHeight = type === 'inline' ? 8 : 20; // Smaller height for inline math
                                    const scaleX = maxWidth / width;
                                    const scaleY = maxHeight / height;
                                    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, preserve aspect ratio
                                    
                                    const finalWidth = Math.round(width * scale);
                                    const finalHeight = Math.round(height * scale);
                                    
                                    // Set proper dimensions maintaining aspect ratio
                                    fixedSvgClone.setAttribute('width', finalWidth);
                                    fixedSvgClone.setAttribute('height', finalHeight);
                                    fixedSvgClone.removeAttribute('style'); // Remove any conflicting styles
                                    
                                    console.log('SVG scaling - Original:', width, 'x', height, 'Final:', finalWidth, 'x', finalHeight, 'Scale:', scale);
                                } else {
                                    // Fallback dimensions (much smaller for inline text)
                                    fixedSvgClone.setAttribute('width', type === 'inline' ? '40' : '80');
                                    fixedSvgClone.setAttribute('height', type === 'inline' ? '6' : '15');
                                }
                                
                                // Ensure the SVG has proper namespace
                                fixedSvgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                fixedSvgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
                                console.log('SVG HTML:', fixedSvgClone.outerHTML);
                                resolve(fixedSvgClone.outerHTML);
                                return;
                            } else {
                                console.log('No SVG found in direct method');
                            }
                        } else {
                            console.log('tex2svg method not available');
                        }
                        
                        console.log('Trying fallback method...');
                        // Fallback: create a temporary element and let MathJax render it
                        const tempDiv = document.createElement('div');
                        tempDiv.style.position = 'absolute';
                        tempDiv.style.left = '-9999px';
                        tempDiv.style.top = '-9999px';
                        tempDiv.style.visibility = 'hidden';
                        
                        if (type === 'display') {
                            tempDiv.innerHTML = `$$${latex}$$`;
                        } else {
                            tempDiv.innerHTML = `$${latex}$`;
                        }
                        
                        console.log('Temp div HTML:', tempDiv.innerHTML);
                        document.body.appendChild(tempDiv);
                        
                        // Process with MathJax
                        mathJax.typesetPromise([tempDiv]).then(() => {
                            console.log('MathJax typeset complete');
                            console.log('Temp div after MathJax:', tempDiv.innerHTML);
                            
                            // Look for SVG first
                            let svg = tempDiv.querySelector('svg');
                            if (svg) {
                                console.log('SVG found in fallback method');
                                // Clone the SVG to avoid modifying the original
                                const svgClone = svg.cloneNode(true);
                                
                                // Fix color issues by replacing currentColor with black
                                const svgString = svgClone.outerHTML;
                                console.log('Original SVG string:', svgString.substring(0, 200) + '...');
                                const fixedSvgString = svgString.replace(/currentColor/g, 'black');
                                console.log('Fixed SVG string:', fixedSvgString.substring(0, 200) + '...');
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = fixedSvgString;
                                const fixedSvgClone = tempDiv.querySelector('svg');
                                
                                // Get the viewBox to calculate proper dimensions
                                const viewBox = fixedSvgClone.getAttribute('viewBox');
                                if (viewBox) {
                                    const [, , width, height] = viewBox.split(' ').map(Number);
                                    // Calculate scale to fit within our desired size while preserving aspect ratio
                                    const maxWidth = type === 'inline' ? 50 : 100; // Smaller for inline math
                                    const maxHeight = type === 'inline' ? 8 : 20; // Smaller height for inline math
                                    const scaleX = maxWidth / width;
                                    const scaleY = maxHeight / height;
                                    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, preserve aspect ratio
                                    
                                    const finalWidth = Math.round(width * scale);
                                    const finalHeight = Math.round(height * scale);
                                    
                                    // Set proper dimensions maintaining aspect ratio
                                    fixedSvgClone.setAttribute('width', finalWidth);
                                    fixedSvgClone.setAttribute('height', finalHeight);
                                    fixedSvgClone.removeAttribute('style'); // Remove any conflicting styles
                                    
                                    console.log('SVG fallback scaling - Original:', width, 'x', height, 'Final:', finalWidth, 'x', finalHeight, 'Scale:', scale);
                                } else {
                                    // Fallback dimensions (much smaller for inline text)
                                    fixedSvgClone.setAttribute('width', type === 'inline' ? '40' : '80');
                                    fixedSvgClone.setAttribute('height', type === 'inline' ? '6' : '15');
                                }
                                
                                // Ensure the SVG has proper namespace
                                svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
                                console.log('Fallback SVG HTML:', svgClone.outerHTML);
                                resolve(svgClone.outerHTML);
                            } else {
                                console.log('No SVG found in fallback method, trying HTML/CSS conversion');
                                // Try to convert HTML/CSS math to SVG
                                const mathElement = tempDiv.querySelector('.MathJax, mjx-container, [data-mathml]');
                                if (mathElement) {
                                    console.log('Found MathJax HTML element, attempting conversion');
                                    // Try to get the computed styles and create a simple representation
                                    const computedStyle = window.getComputedStyle(mathElement);
                                    const fontSize = parseFloat(computedStyle.fontSize) || 12;
                                    
                                    // Create a simple SVG representation
                                    const svgString = this.createSimpleMathSVG(mathElement.textContent || mathElement.innerText, fontSize, type);
                                    if (svgString) {
                                        console.log('Created simple SVG from HTML math');
                                        resolve(svgString);
                                        return;
                                    }
                                }
                                
                                console.log('No suitable math element found');
                                resolve(null);
                            }
                        }).catch((error) => {
                            console.warn('MathJax typeset failed:', error);
                            resolve(null);
                        }).finally(() => {
                            document.body.removeChild(tempDiv);
                        });
                        
                    } catch (error) {
                        console.warn('MathJax conversion failed:', error);
                        resolve(null);
                    }
                }).catch((error) => {
                    console.warn('MathJax startup failed:', error);
                    resolve(null);
                });
            } catch (error) {
                console.warn('Error in convertLatexToSvg:', error);
                resolve(null);
            }
        });
    }

    createSimpleMathSVG(mathText, fontSize, type) {
        try {
            // Create a simple SVG with the math text
            const width = Math.max(mathText.length * fontSize * 0.6, 20);
            const height = fontSize * 1.2;
            
            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <text x="${width/2}" y="${height * 0.8}" text-anchor="middle" font-family="Times, serif" font-size="${fontSize}" fill="black">
                        ${mathText}
                    </text>
                </svg>
            `;
            
            console.log('Created simple SVG for math:', mathText);
            return svg;
        } catch (error) {
            console.warn('Failed to create simple math SVG:', error);
            return null;
        }
    }

    // Alternative approach: create a simple text-based math representation
    createTextBasedMathImage(latex, type) {
        try {
            // Convert LaTeX to a simple text representation
            let mathText = latex;
            
            // Handle common LaTeX symbols
            mathText = mathText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
            mathText = mathText.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
            mathText = mathText.replace(/\\pi/g, 'π');
            mathText = mathText.replace(/\\alpha/g, 'α');
            mathText = mathText.replace(/\\beta/g, 'β');
            mathText = mathText.replace(/\\gamma/g, 'γ');
            mathText = mathText.replace(/\\theta/g, 'θ');
            mathText = mathText.replace(/\\lambda/g, 'λ');
            mathText = mathText.replace(/\\mu/g, 'μ');
            mathText = mathText.replace(/\\sigma/g, 'σ');
            mathText = mathText.replace(/\\phi/g, 'φ');
            mathText = mathText.replace(/\\omega/g, 'ω');
            mathText = mathText.replace(/\\infty/g, '∞');
            mathText = mathText.replace(/\\sum/g, '∑');
            mathText = mathText.replace(/\\int/g, '∫');
            mathText = mathText.replace(/\\lim/g, 'lim');
            mathText = mathText.replace(/\\sin/g, 'sin');
            mathText = mathText.replace(/\\cos/g, 'cos');
            mathText = mathText.replace(/\\tan/g, 'tan');
            mathText = mathText.replace(/\\log/g, 'log');
            mathText = mathText.replace(/\\ln/g, 'ln');
            mathText = mathText.replace(/\\exp/g, 'exp');
            
            // Handle superscripts and subscripts
            mathText = mathText.replace(/\^(\w+)/g, '^$1');
            mathText = mathText.replace(/_(\w+)/g, '_$1');
            
            // Create a high-resolution canvas with the text
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const fontSize = type === 'inline' ? 14 : 18; // Slightly larger for better visibility
            const padding = 2; // Minimal padding
            const dpi = 2; // Higher DPI for better quality
            
            // Set font and measure text
            ctx.font = `${fontSize}px Times, serif`;
            const textMetrics = ctx.measureText(mathText);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            
            // Set canvas size with higher DPI
            canvas.width = (textWidth + padding * 2) * dpi;
            canvas.height = (textHeight + padding * 2) * dpi;
            
            // Scale the context to match the DPI
            ctx.scale(dpi, dpi);
            
            // Clear canvas with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, textWidth + padding * 2, textHeight + padding * 2);
            
            // Draw text in black
            ctx.fillStyle = 'black';
            ctx.font = `${fontSize}px Times, serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(mathText, padding, padding);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            console.log('Created text-based math image for:', latex, '->', mathText);
            
            return {
                dataUrl: dataUrl,
                width: (textWidth + padding * 2), // Return logical size, not DPI-scaled
                height: (textHeight + padding * 2)
            };
        } catch (error) {
            console.warn('Failed to create text-based math image:', error);
            return null;
        }
    }

    async svgToImageData(svgString) {
        return new Promise((resolve) => {
            try {
                console.log('Converting SVG to image data...');
                console.log('SVG string length:', svgString.length);
                
                // Use direct canvas approach without blob URLs to avoid CSP issues
                this.svgToCanvasDirect(svgString).then(resolve);
            } catch (error) {
                console.warn('Error in svgToImageData:', error);
                resolve(null);
            }
        });
    }

    async svgToImageDataFallback(svgString) {
        return new Promise((resolve) => {
            try {
                console.log('Using fallback SVG to image conversion...');
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    console.log('Fallback: Image loaded successfully, dimensions:', img.width, 'x', img.height);
                    
                    // Set canvas size with some padding
                    const padding = 5;
                    const maxWidth = 200;
                    const maxHeight = 100;
                    
                    let canvasWidth = Math.min(img.width + padding * 2, maxWidth);
                    let canvasHeight = Math.min(img.height + padding * 2, maxHeight);
                    
                    canvasWidth = Math.max(canvasWidth, 20);
                    canvasHeight = Math.max(canvasHeight, 15);
                    
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    
                    // Fill with white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw the image centered
                    const x = (canvas.width - img.width) / 2;
                    const y = (canvas.height - img.height) / 2;
                    ctx.drawImage(img, x, y);
                    
                    const dataUrl = canvas.toDataURL('image/png');
                    console.log('Successfully created image data URL with fallback method');
                    resolve(dataUrl);
                };
                
                img.onerror = (error) => {
                    console.warn('Fallback method also failed:', error);
                    // Try one more approach - direct canvas rendering
                    this.svgToCanvasDirect(svgString).then(resolve);
                };
                
                // Try different approaches for the SVG
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                console.log('Created fallback blob URL:', url);
                img.src = url;
                
                // Clean up the URL after a delay
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 3000);
            } catch (error) {
                console.warn('Error in svgToImageDataFallback:', error);
                resolve(null);
            }
        });
    }

    async svgToCanvasDirect(svgString) {
        return new Promise((resolve) => {
            try {
                console.log('Using direct canvas rendering approach without blob URLs...');
                
                // Create a temporary div to render the SVG
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '-9999px';
                tempDiv.style.visibility = 'hidden';
                tempDiv.style.width = '200px';
                tempDiv.style.height = '100px';
                tempDiv.innerHTML = svgString;
                document.body.appendChild(tempDiv);
                
                // Get the SVG element
                const svg = tempDiv.querySelector('svg');
                if (!svg) {
                    console.warn('No SVG found in direct method');
                    document.body.removeChild(tempDiv);
                    resolve(null);
                    return;
                }
                
                // Wait a bit for the SVG to render
                setTimeout(() => {
                    try {
                        // Create canvas
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Get SVG dimensions from viewBox for better aspect ratio
                        const viewBox = svg.getAttribute('viewBox');
                        let width, height;
                        
                        if (viewBox) {
                            const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
                            // Calculate proper dimensions to match document font size
                            // PDF uses 11pt font, so math should be similar height
                            const targetHeight = 8; // Much smaller to match 11pt font height
                            const maxWidth = 60; // Much smaller max width for inline math
                            
                            // Calculate scale based on target height to maintain aspect ratio
                            const scaleFromHeight = targetHeight / vbHeight;
                            const scaleFromWidth = maxWidth / vbWidth;
                            
                            // Use the smaller scale to ensure we don't exceed either dimension
                            // This preserves the aspect ratio perfectly
                            const scale = Math.min(scaleFromHeight, scaleFromWidth, 1.5);
                            
                            // Calculate final dimensions maintaining exact aspect ratio
                            // Use the same scale for both dimensions to prevent stretching
                            width = Math.round(vbWidth * scale);
                            height = Math.round(vbHeight * scale);
                            
                            console.log('Original viewBox:', vbWidth, 'x', vbHeight);
                            console.log('Target height:', targetHeight, 'Scale factor:', scale);
                            console.log('Final dimensions:', width, 'x', height);
                            console.log('Aspect ratio preserved:', (width / height).toFixed(3), 'vs original:', (vbWidth / vbHeight).toFixed(3));
                        } else {
                            width = parseInt(svg.getAttribute('width')) || 50;
                            height = parseInt(svg.getAttribute('height')) || 8;
                        }
                        
                        // Set canvas size with padding and higher DPI for better quality
                        const padding = 2; // Very minimal padding for small font size
                        const dpi = 2; // Higher DPI for better quality
                        const canvasWidth = (width + padding * 2) * dpi;
                        const canvasHeight = (height + padding * 2) * dpi;
                        
                        canvas.width = canvasWidth;
                        canvas.height = canvasHeight;
                        
                        // Scale the context to match the DPI
                        ctx.scale(dpi, dpi);
                        
                        // Fill with white background
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, width + padding * 2, height + padding * 2);
                        
                        // Create data URL with proper dimensions
                        const svgClone = svg.cloneNode(true);
                        svgClone.setAttribute('width', width);
                        svgClone.setAttribute('height', height);
                        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgClone.outerHTML)));
                        
                        const img = new Image();
                        img.onload = () => {
                            console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
                            
                            // Draw image centered with EXACT dimensions to maintain aspect ratio
                            const x = padding;
                            const y = padding;
                            
                            // Draw the image with the exact calculated dimensions
                            // This ensures perfect aspect ratio preservation
                            ctx.drawImage(img, x, y, width, height);
                            
                            // Test if the canvas has any content
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const pixels = imageData.data;
                            let hasContent = false;
                            for (let i = 3; i < pixels.length; i += 4) {
                                if (pixels[i] > 0) { // Check alpha channel
                                    hasContent = true;
                                    break;
                                }
                            }
                            console.log('Canvas has content:', hasContent);
                            
                            // Try JPEG format instead of PNG for better jsPDF compatibility
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                            console.log('Successfully created image data URL with exact aspect ratio:', width, 'x', height);
                            console.log('Aspect ratio maintained:', (width / height).toFixed(3));
                            console.log('Data URL preview:', dataUrl.substring(0, 100) + '...');
                            document.body.removeChild(tempDiv);
                            resolve({
                                dataUrl: dataUrl,
                                width: width,
                                height: height
                            });
                        };
                        
                        img.onerror = () => {
                            console.warn('Direct canvas method failed with data URL');
                            // Try one more approach - create a simple text representation
                            this.createTextFallback(svgString, canvas, ctx).then(() => {
                                const dataUrl = canvas.toDataURL('image/png');
                                console.log('Created text fallback image');
                                document.body.removeChild(tempDiv);
                                resolve({
                                    dataUrl: dataUrl,
                                    width: width,
                                    height: height
                                });
                            });
                        };
                        
                        img.src = svgDataUrl;
                    } catch (error) {
                        console.warn('Error in direct canvas method:', error);
                        document.body.removeChild(tempDiv);
                        resolve(null);
                    }
                }, 100);
            } catch (error) {
                console.warn('Error in svgToCanvasDirect:', error);
                resolve(null);
            }
        });
    }

    async createTextFallback(svgString, canvas, ctx) {
        return new Promise((resolve) => {
            try {
                // Extract the math expression from the SVG by looking for text content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = svgString;
                const svg = tempDiv.querySelector('svg');
                
                if (svg) {
                    // Try to extract readable text from the SVG
                    const textContent = svg.textContent || svg.innerText || 'Math Expression';
                    
                    // Draw the text on canvas
                    ctx.fillStyle = 'black';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const x = canvas.width / 2;
                    const y = canvas.height / 2;
                    ctx.fillText(textContent, x, y);
                }
                resolve();
            } catch (error) {
                console.warn('Error creating text fallback:', error);
                resolve();
            }
        });
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
                
                // Load language setting if available
                if (data.chatLanguage) {
                    document.getElementById('chatLanguage').value = data.chatLanguage;
                    // Also save to server to ensure consistency
                    this.saveLanguageToServer();
                }
                
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
            const chatLanguage = document.getElementById('chatLanguage').value || 'English';
            const data = {
                title: title,
                exercises: this.exercises,
                chatLanguage: chatLanguage,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(`exercise_${this.exerciseId}`, JSON.stringify(data));
        }
    }

    async saveLanguageToServer() {
        if (this.exerciseId) {
            const chatLanguage = document.getElementById('chatLanguage').value || 'English';
            const setLanguageBtn = document.getElementById('setLanguageBtn');
            
            // Show loading state
            const originalText = setLanguageBtn.textContent;
            setLanguageBtn.textContent = 'Setting...';
            setLanguageBtn.disabled = true;
            
            try {
                const response = await fetch(`/api/exercise-sets/${this.exerciseId}/chat-language`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ chatLanguage })
                });
                
                if (response.ok) {
                    // Show success state
                    setLanguageBtn.textContent = '✓ Set';
                    setLanguageBtn.style.backgroundColor = '#48bb78';
                    setTimeout(() => {
                        setLanguageBtn.textContent = originalText;
                        setLanguageBtn.style.backgroundColor = '';
                        setLanguageBtn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error('Failed to save language');
                }
            } catch (error) {
                console.error('Error saving language to server:', error);
                setLanguageBtn.textContent = 'Error';
                setLanguageBtn.style.backgroundColor = '#e53e3e';
                setTimeout(() => {
                    setLanguageBtn.textContent = originalText;
                    setLanguageBtn.style.backgroundColor = '';
                    setLanguageBtn.disabled = false;
                }, 2000);
            }
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

    openAIGenerationModal() {
        const modal = document.getElementById('aiGenerationModal');
        modal.style.display = 'flex';
        
        // Focus on the prompt textarea
        const promptTextarea = document.getElementById('aiExercisePrompt');
        promptTextarea.focus();
    }

    closeAIGenerationModal() {
        const modal = document.getElementById('aiGenerationModal');
        modal.style.display = 'none';
        
        // Clear the form
        document.getElementById('aiExerciseCount').value = '3';
        document.getElementById('aiExercisePrompt').value = '';
    }

    async generateAIExercises() {
        const count = parseInt(document.getElementById('aiExerciseCount').value);
        const prompt = document.getElementById('aiExercisePrompt').value;

        if (!prompt.trim()) {
            alert('Please enter a description for the new exercises.');
            return;
        }

        if (!this.exercises || this.exercises.length === 0) {
            alert('No existing exercises found to use as context.');
            return;
        }

        // Show loading state
        const generateBtn = document.getElementById('aiModalGenerate');
        const originalText = generateBtn.textContent;
        generateBtn.innerHTML = '<span class="loading"></span> Generating...';
        generateBtn.disabled = true;

        try {
            // Prepare existing exercises as context
            const existingExercises = this.exercises.map(ex => ex.text).join('\n');
            
            // Call the AI API endpoint with existing exercises as context
            const response = await fetch('/api/generate-ai-exercises', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    count: count,
                    existingExercises: existingExercises,
                    exerciseSetId: this.exerciseId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add new exercises to existing ones
            const newExercises = data.exercises.map((exercise, index) => ({
                id: this.exercises.length + index + 1,
                text: exercise.text
            }));
            
            this.exercises.push(...newExercises);
            this.refreshExerciseDisplay();
            this.closeAIGenerationModal();
            this.showSuccessMessage(`Successfully generated ${newExercises.length} new exercises!`);

        } catch (error) {
            console.error('Error generating AI exercises:', error);
            alert('Error generating exercises. Please try again.');
        } finally {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
        }
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
