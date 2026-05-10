// K-179: SEO — sitemap.xml, robots.txt, dynamic meta endpoint
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.APP_URL || 'https://jacknemo1994.de';
    const staticPages = [
      { loc: baseUrl + '/', changefreq: 'daily', priority: '1.0' },
      { loc: baseUrl + '/index.html', changefreq: 'daily', priority: '0.9' },
      { loc: baseUrl + '/auth.html', changefreq: 'monthly', priority: '0.3' },
    ];

    let listingPages = [];
    let providerPages = [];
    try {
      const listings = await pool.query(
        "SELECT id, updated_at FROM listings WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5000"
      );
      listingPages = listings.rows.map(r => ({
        loc: baseUrl + '/listing.html?id=' + r.id,
        lastmod: r.updated_at ? r.updated_at.toISOString().slice(0, 10) : undefined,
        changefreq: 'weekly',
        priority: '0.8',
      }));

      const providers = await pool.query(
        "SELECT DISTINCT provider_id FROM listings WHERE status = 'active' LIMIT 2000"
      );
      providerPages = providers.rows.map(r => ({
        loc: baseUrl + '/provider.html?id=' + r.provider_id,
        changefreq: 'weekly',
        priority: '0.7',
      }));
    } catch (_) { /* DB not available in dev */ }

    const allPages = [...staticPages, ...listingPages, ...providerPages];
    const urls = allPages.map(p => {
      let entry = '<url><loc>' + p.loc + '</loc>';
      if (p.lastmod) entry += '<lastmod>' + p.lastmod + '</lastmod>';
      entry += '<changefreq>' + p.changefreq + '</changefreq>';
      entry += '<priority>' + p.priority + '</priority></url>';
      return entry;
    }).join('\n  ');

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ' +
      urls + '\n</urlset>';

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Sitemap generation failed');
  }
});

// GET /robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || 'https://jacknemo1994.de';
  res.set('Content-Type', 'text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin.html',
    'Disallow: /admin-analytics.html',
    '',
    'Sitemap: ' + baseUrl + '/sitemap.xml',
  ].join('\n'));
});

// GET /api/seo/listing/:id — dynamic Open Graph meta for listing page
router.get('/listing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, title, description, status, provider_id FROM listings WHERE id = ',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Listing not found' });
    const l = result.rows[0];
    const baseUrl = process.env.APP_URL || 'https://jacknemo1994.de';
    res.json({
      title: l.title + ' — Startup Radar',
      description: (l.description || '').slice(0, 160),
      og: {
        title: l.title,
        description: (l.description || '').slice(0, 160),
        url: baseUrl + '/listing.html?id=' + l.id,
        type: 'article',
        site_name: 'Startup Radar by JackNemo',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'SEO meta fetch failed' });
  }
});

// GET /api/seo/provider/:id — dynamic Open Graph meta for provider page
router.get('/provider/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT u.id, u.name, pp.bio, pp.logo_url FROM users u LEFT JOIN provider_profiles pp ON pp.user_id = u.id WHERE u.id = ',
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Provider not found' });
    const p = result.rows[0];
    const baseUrl = process.env.APP_URL || 'https://jacknemo1994.de';
    res.json({
      title: p.name + ' — Provider on Startup Radar',
      description: (p.bio || 'View listings and contact this provider on Startup Radar.').slice(0, 160),
      og: {
        title: p.name + ' on Startup Radar',
        description: (p.bio || '').slice(0, 160),
        url: baseUrl + '/provider.html?id=' + p.id,
        image: p.logo_url || undefined,
        type: 'profile',
        site_name: 'Startup Radar by JackNemo',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'SEO meta fetch failed' });
  }
});

module.exports = router;
