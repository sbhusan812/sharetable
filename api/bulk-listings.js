const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getUser(request) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const result = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${token}` } });
  return result.ok ? result.json() : null;
}

export default async function handler(request, response) {
  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-project') || serviceRoleKey.includes('replace-with')) {
    response.status(503).json({ error: 'Backend is not configured yet.' });
    return;
  }
  try {
    if (request.method === 'GET') {
      const result = await fetch(`${supabaseUrl}/rest/v1/bulk_listings?select=*&status=eq.available&order=created_at.desc`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
      const body = await result.text();
      response.status(result.status).setHeader('Content-Type', 'application/json').send(body);
      return;
    }
    if (request.method !== 'POST') {
      response.status(405).setHeader('Allow', 'GET, POST').json({ error: 'Method not allowed.' });
      return;
    }
    const user = await getUser(request);
    if (!user) {
      response.status(401).json({ error: 'Sign in is required to list a large donation.' });
      return;
    }
    const body = request.body || {};
    const listing = { donor_id: user.id, source_name: body.source_name, portions: Number(body.portions), ready_by: body.ready_by, location_area: body.location_area, details: body.details, status: 'available' };
    if (!listing.source_name || !listing.portions || listing.portions < 25 || !listing.ready_by || !listing.location_area || !listing.details) {
      response.status(400).json({ error: 'Source, 25+ portions, ready time, area, and food details are required.' });
      return;
    }
    const result = await fetch(`${supabaseUrl}/rest/v1/bulk_listings`, { method: 'POST', headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(listing) });
    const resultBody = await result.text();
    response.status(result.status).setHeader('Content-Type', 'application/json').send(resultBody);
  } catch (error) {
    console.error('Bulk listings API error:', error);
    response.status(502).json({ error: 'The bulk listings database could not be reached.' });
  }
}
