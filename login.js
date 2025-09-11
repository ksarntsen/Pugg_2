// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    let currentUserType = 'student';

    // Handle user type toggle
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current user type
            currentUserType = this.dataset.type;
        });
    });

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Hide any previous error messages
        hideError();

        // Simulate login process (replace with actual authentication)
        attemptLogin(username, password, currentUserType);
    });

    function attemptLogin(username, password, userType) {
        // Show loading state
        const submitBtn = loginForm.querySelector('.login-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // Simulate API call (replace with actual authentication)
        setTimeout(() => {
            // For now, we'll simulate a successful login
            // In a real implementation, this would make an API call to your backend
            const loginData = {
                username: username,
                password: password,
                userType: userType
            };

            // Check if there's a redirect URL from exercise set link
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');
            const exerciseSetId = urlParams.get('exerciseSet');

            // Store login data in sessionStorage (temporary solution)
            sessionStorage.setItem('user', JSON.stringify(loginData));

            // Redirect based on user type and context
            if (redirectUrl) {
                // If coming from an exercise set link, redirect there after login
                window.location.href = redirectUrl;
            } else {
                // Default redirects based on user type
                switch (userType) {
                    case 'student':
                        window.location.href = 'student-dashboard.html';
                        break;
                    case 'teacher':
                        window.location.href = '/teacher';
                        break;
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                    default:
                        window.location.href = '/teacher';
                }
            }
        }, 1000); // Simulate network delay
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Check if user is already logged in
    function checkExistingLogin() {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            // Redirect to appropriate page if already logged in
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');
            
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                switch (user.userType) {
                    case 'student':
                        window.location.href = 'student-dashboard.html';
                        break;
                    case 'teacher':
                        window.location.href = '/teacher';
                        break;
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                }
            }
        }
    }

    // Check for existing login on page load
    checkExistingLogin();
});
