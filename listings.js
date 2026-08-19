const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function configured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

async function supabase(path, options = {}) {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

export default async function handler(request, response) {
  if (!configured()) {
    response.status(503).json({ error: 'Backend is not configured yet.' });
    return;
  }

  if (request.method === 'GET') {
    const result = await supabase('listings?select=*&status=eq.available&order=created_at.desc');
    const body = await result.text();
    response.status(result.status).setHeader('Content-Type', 'application/json').send(body);
    return;
  }

  if (request.method === 'POST') {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      response.status(401).json({ error: 'Sign in is required to create a listing.' });
      return;
    }

    const userResult = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${token}` }
    });
    if (!userResult.ok) {
      response.status(401).json({ error: 'Your sign-in session is invalid or expired.' });
      return;
    }

    const user = await userResult.json();
    const body = request.body || {};
    const listing = {
      title: body.title,
      food_type: body.food_type,
      portions: Number(body.portions),
      pickup_by: body.pickup_by,
      handoff_method: body.handoff_method,
      location_area: body.location_area,
      details: body.details || null,
      donor_id: user.id,
      status: 'available'
    };
    if (!listing.title || !listing.food_type || !listing.portions || !listing.pickup_by || !listing.handoff_method || !listing.location_area) {
      response.status(400).json({ error: 'Title, food type, portions, pickup time, handoff method, and area are required.' });
      return;
    }
    const result = await supabase('listings', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(listing)
    });
    const body = await result.text();
    response.status(result.status).setHeader('Content-Type', 'application/json').send(body);
    return;
  }

  response.status(405).setHeader('Allow', 'GET, POST').json({ error: 'Method not allowed.' });
}
