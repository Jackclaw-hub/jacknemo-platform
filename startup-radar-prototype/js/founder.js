// Founder dashboard logic
const founderStageSelect = document.getElementById('founderStage');
const founderSectorSelect = document.getElementById('founderSector');
const founderLocationInput = document.getElementById('founderLocation');
const geoPreferenceSelect = document.getElementById('geoPreference');
const updateButton = document.querySelector('.btn');
const opportunityGrid = document.getElementById('opportunityGrid');

let founderProfile = {
    stage: '',
    sector: '',
    location: '',
    geoPreference: ''
};

// Load mock data
const fundingData = getFundingOpportunities();
const equipmentData = getEquipment();
const servicesData = getServices();

// Utility functions
function updateRadar() {
    // Get current founder profile values
    founderProfile.stage = founderStageSelect.value;
    founderProfile.sector = founderSectorSelect.value;
    founderProfile.location = founderLocationInput.value;
    founderProfile.geoPreference = geoPreferenceSelect.value;

    // Filter opportunities based on founder profile
    const filteredFunding = fundingData.filter(fund => {
        return (fund.stages.includes(founderProfile.stage) && fund.sectors.includes(founderProfile.sector)) ||
               (founderProfile.geoPreference === 'remote' && fund.geo === 'remote');
    });

    const filteredEquipment = equipmentData.filter(eq => {
        return (eq.tags.includes(founderProfile.sector) && eq.geo === founderProfile.geoPreference) ||
               (founderProfile.geoPreference === 'remote' && eq.geo === 'remote');
    });

    const filteredServices = servicesData.filter(serv => {
        return (serv.stages.includes(founderProfile.stage) && serv.sectors.includes(founderProfile.sector)) ||
               (founderProfile.geoPreference === 'remote' && serv.geo === 'remote');
    });

    // Render opportunities
    renderOpportunities(filteredFunding, filteredEquipment, filteredServices);
}

function renderOpportunities(funding, equipment, services) {
    opportunityGrid.innerHTML = '';

    funding.forEach(fund => {
        const fundCard = document.createElement('div');
        fundCard.className = 'opportunity-card';
        fundCard.innerHTML = `
            <h3>${fund.title}</h3>
            <p>${fund.amount}</p>
            <p>${fund.deadline}</p>
        `;
        opportunityGrid.appendChild(fundCard);
    });

    equipment.forEach(eq => {
        const eqCard = document.createElement('div');
        eqCard.className = 'opportunity-card';
        eqCard.innerHTML = `
            <h3>${eq.title}</h3>
            <p>${eq.type}</p>
            <p>${eq.hourlyRate} €/h</p>
        `;
        opportunityGrid.appendChild(eqCard);
    });

    services.forEach(serv => {
        const servCard = document.createElement('div');
        servCard.className = 'opportunity-card';
        servCard.innerHTML = `
            <h3>${serv.title}</h3>
            <p>${serv.provider}</p>
            <p>${serv.fromPrice} €</p>
        `;
        opportunityGrid.appendChild(servCard);
    });
}

// Initialize update button event listener
updateButton.addEventListener('click', updateRadar);

// Initialize default profile values
founderStageSelect.value = 'pre-seed';
founderSectorSelect.value = 'tech';
founderLocationInput.value = 'Berlin';
geoPreferenceSelect.value = 'regional';

// Trigger initial update
updateRadar();