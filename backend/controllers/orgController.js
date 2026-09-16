import { getDb } from '../config/db.js';

export async function getOrganizations(req, res) {
  try {
    const db = getDb();
    const orgs = await db.all('SELECT * FROM organizations ORDER BY created_at DESC');
    res.status(200).json({ organizations: orgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createOrganization(req, res) {
  try {
    const { name, slug, domain, logo, primaryColor } = req.body;
    const db = getDb();

    if (!name || !slug) {
      return res.status(400).json({ error: 'Organization name and slug are required' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const existing = await db.get('SELECT * FROM organizations WHERE slug = ?', [cleanSlug]);
    if (existing) {
      return res.status(400).json({ error: 'Organization slug already taken' });
    }

    const result = await db.run(
      'INSERT INTO organizations (name, slug, domain, logo, primary_color) VALUES (?, ?, ?, ?, ?)',
      [name, cleanSlug, domain || null, logo || null, primaryColor || '#7c3aed']
    );

    res.status(201).json({
      message: 'Organization workspace created successfully',
      organization: { id: result.lastID, name, slug: cleanSlug, domain, logo, primaryColor }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteOrganization(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.run('DELETE FROM organizations WHERE id = ?', [id]);
    res.status(200).json({ message: 'Organization workspace deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
