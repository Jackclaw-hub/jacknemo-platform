// Founder profile and radar functionality

class StartupRadar {
    constructor() {
        this.founderProfile = null;
        this.init();
    }

    async init() {
        try {
            await this.loadFounderProfile();
            this.renderProfile();
            this.calculateMatches();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Failed to initialize StartupRadar:', error);
            this.showErrorMessage('Failed to load startup radar. Please refresh the page.');
        }
    }

    async loadFounderProfile() {
        // In a real app, this would come from user input or auth
        this.founderProfile = {
            name: "Alex Chen",
            startupName: "EcoTech Solutions",
            stage: "seed",
            sector: "climate",
            location: "Berlin, Germany",
            geoPreference: "regional",
            preferredRegions: ["Europe"],
            lookingFor: ["funding", "equipment", "services"]
        };
    }

    renderProfile() {
        document.getElementById('founder-name').textContent = this.founderProfile.name;
        document.getElementById('startup-name').textContent = this.founderProfile.startupName;
        document.getElementById('startup-stage').textContent = this.founderProfile.stage;
        document.getElementById('startup-sector').textContent = this.founderProfile.sector;
        document.getElementById('founder-location').textContent = this.founderProfile.location;
    }

    calculateMatches() {
        const fundingMatches = this.matchFundingOpportunities();
        const equipmentMatches = this.matchEquipment();
        const servicesMatches = this.matchServices();

        this.renderMatches(fundingMatches, 'funding-radar', 'funding-count');
        this.renderMatches(equipmentMatches, 'equipment-radar', 'equipment-count');
        this.renderMatches(servicesMatches, 'services-radar', 'services-count');
    }

    matchFundingOpportunities() {
        return fundingOpportunities.filter(opportunity => {
            // Stage match
            const stageMatch = opportunity.stages.includes(this.founderProfile.stage);
            
            // Sector match
            const sectorMatch = opportunity.sectors.includes(this.founderProfile.sector) || 
                              opportunity.sectors.includes('all');
            
            // Geography match
            let geoMatch = false;
            if (opportunity.geo === 'global') {
                geoMatch = true;
            } else if (opportunity.geo === 'regional') {
                geoMatch = opportunity.regions.some(region => 
                    this.founderProfile.preferredRegions.includes(region)
                );
            }
            
            return stageMatch && sectorMatch && geoMatch;
        });
    }

    matchEquipment() {
        return equipmentListings.filter(item => {
            // Simple location-based matching for demo
            return item.geo === 'local' && item.city === 'Berlin';
        });
    }

    matchServices() {
        return serviceOfferings.filter(service => {
            // Stage and sector matching
            const stageMatch = service.stages.includes(this.founderProfile.stage);
            const sectorMatch = service.sectors.includes(this.founderProfile.sector) || 
                              service.sectors.includes('all');
            
            // Geography check
            let geoMatch = false;
            if (service.geo === 'remote') {
                geoMatch = true;
            } else if (service.geo === 'regional') {
                geoMatch = service.regions.some(region => 
                    this.founderProfile.preferredRegions.includes(region)
                );
            }
            
            return stageMatch && sectorMatch && geoMatch;
        });
    }

    renderMatches(items, containerId, countId) {
        const container = document.getElementById(containerId);
        const countElement = document.getElementById(countId);
        
        countElement.textContent = items.length;
        
        container.innerHTML = items.map(item => `
            <div class="opportunity-card">
                <h3>${item.title} <span class="score-badge">${this.calculateScore(item)}%</span></h3>
                <p><strong>Provider:</strong> ${item.provider}</p>
                ${item.amount ? `<p><strong>Amount:</strong> ${item.amount}</p>` : ''}
                ${item.dailyRate ? `<p><strong>Daily Rate:</strong> ${item.dailyRate}</p>` : ''}
                ${item.monthlyRate ? `<p><strong>Monthly Rate:</strong> ${item.monthlyRate}</p>` : ''}
                ${item.fromPrice ? `<p><strong>From:</strong> ${item.fromPrice}</p>` : ''}
                <p>${item.description}</p>
                ${item.deadline ? `<p><strong>Deadline:</strong> ${item.deadline}</p>` : ''}
            </div>
        `).join('');
    }

    calculateScore(item) {
        // Advanced scoring algorithm with multiple factors
        let score = 0;
        
        // Stage match (25% weight)
        if (item.stages && item.stages.includes(this.founderProfile.stage)) {
            score += 25;
        }
        
        // Sector match (25% weight)
        if (item.sectors && (item.sectors.includes(this.founderProfile.sector) || 
                            item.sectors.includes('all'))) {
            score += 25;
        }
        
        // Geography match (20% weight)
        let geoMatch = false;
        if (item.geo === 'global') {
            geoMatch = true;
        } else if (item.geo === 'regional' && item.regions) {
            geoMatch = item.regions.some(region => 
                this.founderProfile.preferredRegions.includes(region)
            );
        } else if (item.geo === 'local' && item.city === this.founderProfile.location?.split(',')[0]) {
            geoMatch = true;
        }
        
        if (geoMatch) {
            score += 20;
        }
        
        // Specificity bonus (15% weight)
        if (item.stages && item.stages.length === 1) {
            score += 5; // Highly specific to one stage
        }
        if (item.sectors && item.sectors.length === 1 && item.sectors[0] !== 'all') {
            score += 5; // Highly specific to one sector
        }
        if (item.starterFriendly) {
            score += 5; // Starter-friendly bonus
        }
        
        // Urgency bonus (15% weight)
        if (item.deadline) {
            const deadlineDate = new Date(item.deadline);
            const today = new Date();
            const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDeadline <= 7) {
                score += 15; // High urgency
            } else if (daysUntilDeadline <= 30) {
                score += 10; // Medium urgency
            } else if (daysUntilDeadline <= 90) {
                score += 5; // Low urgency
            }
        }
        
        return Math.min(Math.max(score, 0), 100);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'background: #fee; color: #c33; padding: 15px; border: 1px solid #c33; border-radius: 5px; margin: 10px;';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container') || document.body;
        container.prepend(errorDiv);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 10000);
    }

    updateLastUpdated() {
        const now = new Date();
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    // Performance optimization: Debounce match calculations
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the radar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const radar = new StartupRadar();
    
    // Add performance monitoring
    const loadTime = performance.now();
    console.log(`StartupRadar initialized in ${loadTime.toFixed(2)}ms`);
});