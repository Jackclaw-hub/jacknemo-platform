// Mock data for Startup Radar prototype

// Funding opportunities
const fundingOpportunities = [
    {
        id: 'fund-1',
        title: 'Early Stage Tech Grant',
        provider: 'Tech Innovation Fund',
        amount: '$50,000',
        stages: ['pre-seed', 'seed'],
        sectors: ['tech', 'saas', 'ai'],
        geo: 'regional',
        regions: ['North America', 'Europe'],
        deadline: '2024-06-30',
        description: 'Grant for early-stage technology startups focusing on SaaS and AI solutions.'
    },
    {
        id: 'fund-2',
        title: 'Climate Tech Accelerator',
        provider: 'Green Future Fund',
        amount: '$100,000',
        stages: ['seed', 'series-a'],
        sectors: ['climate', 'clean-tech', 'sustainability'],
        geo: 'global',
        regions: [],
        deadline: '2024-07-15',
        description: 'Equity-free funding for climate technology startups with scalable solutions.'
    }
];

// Equipment listings
const equipmentListings = [
    {
        id: 'equip-1',
        title: '3D Printing Studio Access',
        provider: 'MakerHub Berlin',
        tags: ['prototyping', 'manufacturing', 'hardware'],
        geo: 'local',
        city: 'Berlin',
        dailyRate: '€75',
        description: 'Professional 3D printers with technical support for hardware prototyping.'
    },
    {
        id: 'equip-2',
        title: 'Co-working Space (10 desks)',
        provider: 'StartupLoft Munich',
        tags: ['office', 'collaboration', 'meeting-rooms'],
        geo: 'local',
        city: 'Munich',
        monthlyRate: '€1200',
        description: 'Flexible co-working space with meeting rooms and high-speed internet.'
    }
];

// Service offerings
const serviceOfferings = [
    {
        id: 'service-1',
        title: 'MVP Development Package',
        provider: 'CodeCraft Studios',
        stages: ['pre-seed', 'seed'],
        sectors: ['tech', 'saas', 'mobile'],
        starterFriendly: true,
        geo: 'remote',
        fromPrice: '$15,000',
        description: 'Complete MVP development including design, development, and deployment.'
    },
    {
        id: 'service-2',
        title: 'Legal Foundation Package',
        provider: 'StartupLegal Partners',
        stages: ['pre-seed', 'seed'],
        sectors: ['all'],
        starterFriendly: true,
        geo: 'regional',
        regions: ['North America', 'Europe'],
        fromPrice: '$2,500',
        description: 'Company formation, shareholder agreements, and basic legal framework.'
    }
];

// Sample founder profile
const sampleFounder = {
    name: 'Alex Chen',
    startupName: 'EcoTech Solutions',
    stage: 'seed',
    sector: 'climate',
    location: 'Berlin, Germany',
    geoPreference: 'regional',
    preferredRegions: ['Europe'],
    lookingFor: ['funding', 'equipment', 'services']
};