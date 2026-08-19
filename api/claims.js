const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  if (!supabaseUrl || !serviceRoleKey) {
    response.status(503).json({ error: 'Backend is not configured yet.' });
    return;
  }
  if (request.method !== 'POST') {
    response.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed.' });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    response.status(401).json({ error: 'Sign in is required to claim food.' });
    return;
  }
  const userResult = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${token}` }
  });
  if (!userResult.ok) {
    response.status(401).json({ error: 'Your sign-in session is invalid or expired.' });
    return;
  }

  const body = request.body || {};
  if (!body.listing_id) {
    response.status(400).json({ error: 'A listing is required.' });
    return;
  }
  const user = await userResult.json();
  const result = await supabase('claims', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ listing_id: body.listing_id, receiver_id: user.id, status: 'requested' })
  });
  const resultBody = await result.text();
  response.status(result.status).setHeader('Content-Type', 'application/json').send(resultBody);
}
