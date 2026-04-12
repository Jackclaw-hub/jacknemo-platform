// Mock data for Startup Radar prototype
const startupData = {
    funding: [
        {
            id: 'fund-1',
            title: 'Early Stage Grant Berlin',
            amount: '50.000 €',
            stages: ['pre-seed', 'seed'],
            sectors: ['tech', 'sustainability'],
            geo: 'regional',
            regions: ['Berlin', 'Brandenburg'],
            deadline: '2024-06-30',
            description: 'Förderung für nachhaltige Tech-Startups in der Region'
        },
        {
            id: 'fund-2',
            title: 'Remote-First VC Fund',
            amount: '100.000 - 500.000 €',
            stages: ['seed', 'series-a'],
            sectors: ['all'],
            geo: 'remote',
            regions: [],
            description: 'Remote-first Investment für skalierbare Geschäftsmodelle'
        },
        {
            id: 'fund-3',
            title: 'Münchner Gründungsfonds',
            amount: '25.000 €',
            stages: ['pre-seed'],
            sectors: ['creative', 'social'],
            geo: 'regional',
            regions: ['München', 'Bayern'],
            deadline: '2024-05-15',
            description: 'Förderung für kreative und soziale Projekte in München'
        }
    ],
    
    equipment: [
        {
            id: 'eq-1',
            title: '3D-Drucker Workshop',
            type: '3d-printer',
            tags: ['prototyping', 'hardware', 'manufacturing'],
            geo: 'regional',
            city: 'Berlin',
            hourlyRate: '15 €',
            dailyRate: '100 €',
            description: 'Professioneller 3D-Drucker mit Beratung'
        },
        {
            id: 'eq-2',
            title: 'Co-Working Space Köln',
            type: 'workspace',
            tags: ['office', 'meeting', 'networking'],
            geo: 'regional',
            city: 'Köln',
            hourlyRate: '10 €',
            dailyRate: '60 €',
            description: 'Modernes Co-Working in zentraler Lage'
        },
        {
            id: 'eq-3',
            title: 'VR Development Kit',
            type: 'vr-equipment',
            tags: ['vr', 'gaming', 'simulation'],
            geo: 'remote',
            description: 'Komplettes VR-Entwicklungsset — Versand möglich'
        }
    ],
    
    services: [
        {
            id: 'serv-1',
            title: 'Starter Legal Package',
            provider: 'LegalStart GmbH',
            stages: ['pre-seed', 'seed'],
            sectors: ['all'],
            starterFriendly: true,
            geo: 'remote',
            fromPrice: '990 €',
            description: 'Rechtssicher gründen — Starter-Paket inkl. Gesellschaftsvertrag'
        },
        {
            id: 'serv-2',
            title: 'Brand Identity Design',
            provider: 'DesignStudio Berlin',
            stages: ['pre-seed'],
            sectors: ['creative', 'tech', 'lifestyle'],
            starterFriendly: true,
            geo: 'regional',
            city: 'Berlin',
            fromPrice: '1.500 €',
            description: 'Logo, CI & Brand Guidelines für dein Startup'
        },
        {
            id: 'serv-3',
            title: 'Tech Stack Consultation',
            provider: 'TechAdvisors',
            stages: ['pre-seed', 'seed'],
            sectors: ['tech'],
            starterFriendly: false,
            geo: 'remote',
            fromPrice: '2.500 €',
            description: 'Technische Architektur-Beratung für skalierbare Apps'
        }
    ],
    
    users: [
        {
            id: 'user-1',
            name: 'Max Mustermann',
            role: 'founder',
            stage: 'pre-seed',
            sector: 'tech',
            location: 'Berlin',
            geoPreference: 'regional'
        },
        {
            id: 'user-2',
            name: 'Creative Hub München',
            role: 'equipment',
            location: 'München'
        },
        {
            id: 'user-3',
            name: 'DesignStudio Berlin',
            role: 'service',
            location: 'Berlin'
        }
    ]
};

// Utility functions
function getFundingOpportunities() {
    return startupData.funding;
}

function getEquipment() {
    return startupData.equipment;
}

function getServices() {
    return startupData.services;
}

function getUsers() {
    return startupData.users;
}

function getUserById(id) {
    return startupData.users.find(user => user.id === id);
}

function addDraft(type, data) {
    // In prototype, store in localStorage
    const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
    if (!drafts[type]) drafts[type] = [];
    drafts[type].push({...data, id: Date.now().toString(), status: 'draft'});
    localStorage.setItem('drafts', JSON.stringify(drafts));
    return drafts[type].length;
}

function getDrafts(type) {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
    return drafts[type] || [];
}