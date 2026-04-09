// Main JavaScript for JackNemo SaaS Platform
document.addEventListener('DOMContentLoaded', function() {
    // Tooltip initialization
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    
    // Popover initialization
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    })
    
    // Alert auto-dismiss after 5 seconds
    const alerts = document.querySelectorAll('.alert.alert-dismissible')
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert)
            bsAlert.close()
        }, 5000)
    })
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle')
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('show')
        })
    }
    
    // Form validation
    const forms = document.querySelectorAll('.needs-validation')
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        })
    })
    
    // Environment status indicator updater
    const envStatusIndicators = document.querySelectorAll('.env-status-indicator')
    envStatusIndicators.forEach(function(indicator) {
        const status = indicator.getAttribute('data-status')
        if (status) {
            indicator.classList.add(`status-${status}`)
        }
    })
    
    // Chart.js initialization (if charts are present)
    const ctx = document.getElementById('usageChart')
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Systemauslastung (%)',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: 'rgb(13, 110, 253)',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Monatliche Systemauslastung'
                    }
                }
            }
        })
    }
    
    // Environment cards hover effect
    const envCards = document.querySelectorAll('.env-card')
    envCards.forEach(function(card) {
        card.addEventListener('mouseenter', function() {
            card.style.transform = 'translateY(-5px)'
            card.style.boxShadow = '0 0.75rem 1.5rem rgba(0, 0, 0, 0.2)'
        })
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'translateY(0)'
            card.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
        })
    })
    
    // Dark mode toggle (placeholder for future implementation)
    const darkModeToggle = document.getElementById('darkModeToggle')
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.documentElement.setAttribute('data-bs-theme', 'dark')
            } else {
                document.documentElement.setAttribute('data-bs-theme', 'light')
            }
        })
    }
})