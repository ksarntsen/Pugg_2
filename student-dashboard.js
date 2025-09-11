// Student Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthentication();
    
    // Load student's exercise sets
    loadExerciseSets();
});

function checkAuthentication() {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userData);
    if (user.userType !== 'student') {
        // Redirect to appropriate page if not a student
        switch (user.userType) {
            case 'teacher':
                window.location.href = 'index.html';
                break;
            case 'admin':
                window.location.href = 'admin.html';
                break;
            default:
                window.location.href = 'login.html';
        }
    }
}

function loadExerciseSets() {
    // For now, this is a placeholder
    // In a real implementation, this would fetch exercise sets from the server
    const exerciseSetsList = document.getElementById('exerciseSetsList');
    
    // Simulate loading exercise sets
    setTimeout(() => {
        // This would be replaced with actual API call
        const exerciseSets = []; // Empty for now
        
        if (exerciseSets.length === 0) {
            exerciseSetsList.innerHTML = '<p class="no-exercises">No exercise sets assigned yet.</p>';
        } else {
            // Display exercise sets when they exist
            exerciseSetsList.innerHTML = exerciseSets.map(set => `
                <div class="exercise-set-item">
                    <h4>${set.title}</h4>
                    <p>${set.description}</p>
                    <button class="btn btn-primary btn-small" onclick="openExerciseSet('${set.id}')">
                        Start Exercises
                    </button>
                </div>
            `).join('');
        }
    }, 500);
}

function openExerciseSet(exerciseSetId) {
    // Redirect to the exercise set
    window.location.href = `student.html?exerciseSet=${exerciseSetId}`;
}

function logout() {
    // Clear session data
    sessionStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = 'login.html';
}
