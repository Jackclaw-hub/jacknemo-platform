// Main JavaScript for JackNemo SaaS Platform

document.addEventListener('DOMContentLoaded', function() {
    // Tooltip initialization
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Popover initialization
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });

    // Alert auto-dismiss after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Sidebar toggle for mobile (if we implement one later)
    // Form validation enhancements
    const forms = document.querySelectorAll('form.needs-validation');
    Array.from(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Environment status badge updater (example)
    function updateEnvStatus() {
        const statusElements = document.querySelectorAll('.env-status-badge');
        statusElements.forEach(function(element) {
            const status = element.getAttribute('data-status');
            if (status) {
                element.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-info');
                switch(status) {
                    case 'active':
                        element.classList.add('bg-success');
                        break;
                    case 'maintenance':
                        element.classList.add('bg-warning');
                        break;
                    case 'inactive':
                        element.classList.add('bg-danger');
                        break;
                    default:
                        element.classList.add('bg-info');
                }
            }
        });
    }

    // Call on load and periodically
    updateEnvStatus();
    setInterval(updateEnvStatus, 30000); // Update every 30 seconds

    // Make sure Bootstrap tooltips work dynamically
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipElements.forEach(function(el) {
        new bootstrap.Tooltip(el);
    });
});

// Helper functions for API calls
async function fetchAPI(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('authToken'); // If we implement JWT later
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/v1${endpoint}`, {
            ...options,
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Example usage:
// fetchAPI('/auth/status')
//   .then(data => console.log('User data:', data))
//   .catch(error => console.error('Failed to fetch auth status:', error));