// Supply dashboard logic
const equipmentTypeSelect = document.getElementById('equipmentType');
const equipmentTagsInput = document.getElementById('equipmentTags');
const equipmentCityInput = document.getElementById('equipmentCity');
const equipmentHourlyRateInput = document.getElementById('equipmentHourlyRate');
const equipmentDailyRateInput = document.getElementById('equipmentDailyRate');
const addDraftButton = document.querySelector('.btn');
const equipmentDraftList = document.getElementById('equipmentDraftList');

// Load mock data
const equipmentData = getEquipment();

// Utility functions
function addEquipmentDraft() {
    const draft = {
        type: equipmentTypeSelect.value,
        tags: equipmentTagsInput.value.split(', ');
        city: equipmentCityInput.value,
        hourlyRate: equipmentHourlyRateInput.value,
        dailyRate: equipmentDailyRateInput.value
    };

    // Save draft to localStorage
    const drafts = JSON.parse(localStorage.getItem('equipmentDrafts') || '[]');
    drafts.push(draft);
    localStorage.setItem('equipmentDrafts', JSON.stringify(drafts));

    // Render drafts
    renderEquipmentDrafts(drafts);
}

function renderEquipmentDrafts(drafts) {
    equipmentDraftList.innerHTML = '';

    drafts.forEach((draft, index) => {
        const draftCard = document.createElement('div');
        draftCard.className = 'draft-card';
        draftCard.innerHTML = `
            <h3>Entwurf ${index + 1}</h3>
            <p>Typ: ${draft.type}</p>
            <p>Tags: ${draft.tags.join(', ')}</p>
            <p>Stadt: ${draft.city}</p>
            <p>Stundensatz: ${draft.hourlyRate} €</p>
            <p>Tagesrate: ${draft.dailyRate} €</p>
        `;
        equipmentDraftList.appendChild(draftCard);
    });
}

// Initialize add draft button event listener
addDraftButton.addEventListener('click', addEquipmentDraft);

// Initialize default values
equipmentTypeSelect.value = '3d-printer';

// Load and render existing drafts
const existingDrafts = JSON.parse(localStorage.getItem('equipmentDrafts') || '[]');
renderEquipmentDrafts(existingDrafts);
