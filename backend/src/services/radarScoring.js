/**
 * Radar Scoring Service
 * Personalizes listing scores for a specific founder profile.
 * Pure function — no DB calls. Takes founder + listings, returns scored+ranked results.
 */

const WEIGHT = {
  STAGE_MATCH:    0.30,
  SECTOR_MATCH:   0.25,
  GEO_MATCH:      0.25,
  STARTER_BONUS:  0.10,
  COMPLETENESS:   0.10
};

function scoreEquipmentListing(listing, founder) {
  let score = 0;

  // Geo match (0-1)
  const tags = safeArray(listing.tags);
  const geoScore = calcGeoScore(listing.geo, listing.city, founder.geo, founder.city);
  score += geoScore * WEIGHT.GEO_MATCH;

  // Tag relevance to founder stage (heuristic)
  const stageTagMap = {
    'pre-seed': ['prototyping','testing','3d-printing','workshop','recording'],
    'seed': ['office','coworking','photography','video','lab'],
    'series-a': ['conference','studio','event-space','showroom']
  };
  const relevantTags = stageTagMap[founder.stage] || [];
  const tagHits = tags.filter(t => relevantTags.includes(t.toLowerCase())).length;
  const tagScore = tags.length > 0 ? Math.min(tagHits / Math.max(relevantTags.length, 1), 1) : 0.3;
  score += tagScore * WEIGHT.STAGE_MATCH;

  // Sector match (use sector in tags)
  const sectorScore = founder.sector && tags.some(t => t.toLowerCase().includes(founder.sector.toLowerCase())) ? 1 : 0.3;
  score += sectorScore * WEIGHT.SECTOR_MATCH;

  // Completeness
  const complete = (listing.title ? 0.4 : 0) + (listing.description ? 0.3 : 0) + (listing.hourly_rate || listing.daily_rate ? 0.3 : 0);
  score += complete * WEIGHT.COMPLETENESS;

  return Math.round(score * 100) / 100;
}

function scoreServiceListing(listing, founder) {
  let score = 0;
  const stages = safeArray(listing.stages);
  const sectors = safeArray(listing.sectors);

  // Stage match
  const stageScore = stages.length === 0 ? 0.5 : (stages.includes(founder.stage) ? 1 : 0.1);
  score += stageScore * WEIGHT.STAGE_MATCH;

  // Sector match
  const sectorScore = sectors.length === 0 ? 0.5 : (sectors.includes(founder.sector) ? 1 : 0.1);
  score += sectorScore * WEIGHT.SECTOR_MATCH;

  // Geo match
  const geoScore = calcGeoScore(listing.geo, listing.city, founder.geo, founder.city);
  score += geoScore * WEIGHT.GEO_MATCH;

  // Starter bonus
  if (listing.starter_friendly && ['pre-seed','seed'].includes(founder.stage)) {
    score += 1 * WEIGHT.STARTER_BONUS;
  }

  // Completeness
  const complete = (listing.title ? 0.4 : 0) + (listing.description ? 0.4 : 0) + (listing.from_price ? 0.2 : 0);
  score += complete * WEIGHT.COMPLETENESS;

  return Math.round(score * 100) / 100;
}

function calcGeoScore(listingGeo, listingCity, founderGeo, founderCity) {
  if (listingGeo === 'global' || listingGeo === 'remote') return 1;
  if (listingGeo === 'regional') {
    if (founderGeo === 'remote') return 0.2; // founder wants remote, listing is regional
    if (listingCity && founderCity && listingCity.toLowerCase() === founderCity.toLowerCase()) return 1;
    return 0.5; // same region, different city
  }
  return 0.3;
}

function safeArray(val) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val) || []; } catch { return []; }
}

/**
 * Main export: score and rank listings for a founder
 * @param {Object} founder - { stage, sector, geo, city, starterFriendlyOnly }
 * @param {Array} listings - raw listings from DB
 * @param {number} threshold - min score to include (default 0.2)
 */
function scoreListingsForFounder(founder, listings, threshold = 0.2) {
  const scored = listings
    .map(listing => {
      const rawScore = listing.type === 'equipment'
        ? scoreEquipmentListing(listing, founder)
        : scoreServiceListing(listing, founder);
      const pct = Math.round(rawScore * 100);
      const reasons = [];
      if (listing.type === 'service') {
        const sStages = safeArray(listing.stages);
        const sSectors = safeArray(listing.sectors);
        if (sStages.includes(founder.stage)) reasons.push('✓ Stage passt (' + founder.stage + ')');
        else reasons.push('✗ Stage passt nicht (du: ' + founder.stage + ', listing: ' + sStages.join('/') + ')');
        if (sSectors.includes(founder.sector)) reasons.push('✓ Sektor Match (' + founder.sector + ')');
        else reasons.push('~ Kein Sektor-Match');
      }
      if (listing.geo === founder.geo) reasons.push('✓ Gleicher Geo-Radius (' + listing.geo + ')');
      else if (listing.geo === 'national') reasons.push('~ National verfügbar');
      else reasons.push('✗ Anderer Radius');
      if (listing.city && founder.city && listing.city.toLowerCase() === founder.city?.toLowerCase()) reasons.push('✓ Gleiche Stadt');
      if (rawScore >= 0.7) reasons.push('⭐ Top Match (' + pct + '%)');
      else if (rawScore >= 0.4) reasons.push('👍 Guter Match (' + pct + '%)');
      else reasons.push('👀 Möglicher Match (' + pct + '%)');

      // Reputation bonus: +5% if avg rating >= 4.0
      let finalScore = rawScore;
      if (listing.avgRating && listing.avgRating >= 4.0) {
        finalScore = Math.min(1, rawScore + 0.05);
        reasons.push('⭐ Top-bewerteter Anbieter (' + listing.avgRating + '/5, ' + (listing.ratingCount || 0) + ' Bewertungen)');
      } else if (listing.avgRating && listing.avgRating > 0) {
        reasons.push('★ ' + listing.avgRating + '/5 (' + (listing.ratingCount || 0) + ' Bewertungen)');
      }

      return {
        ...listing,
        score: finalScore,
        radarScore: finalScore,
        scorePercent: Math.round(finalScore * 100),
        explanation: reasons,
        scoreBreakdown: {
          stageMatch: listing.type === 'service' ? (safeArray(listing.stages).includes(founder.stage) ? 'yes' : 'no') : 'n/a',
          sectorMatch: listing.type === 'service' ? (safeArray(listing.sectors).includes(founder.sector) ? 'yes' : 'no') : 'n/a',
          geoMode: listing.geo
        }
      };
    })
    .filter(l => l.radarScore >= threshold)
    .sort((a, b) => b.radarScore - a.radarScore);

  return scored;
}

module.exports = { scoreListingsForFounder };
