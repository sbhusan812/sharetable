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
  if (request.method !== 'POST') {
    response.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed.' });
    return;
  }
  const user = await getUser(request);
  if (!user) {
    response.status(401).json({ error: 'Sign in is required to apply as a volunteer.' });
    return;
  }
  const body = request.body || {};
  if (!body.role || !body.reference) {
    response.status(400).json({ error: 'Role and identity or organization reference are required.' });
    return;
  }
  try {
    const result = await fetch(`${supabaseUrl}/rest/v1/volunteer_applications`, {
      method: 'POST',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ applicant_id: user.id, role: body.role, reference: body.reference, status: 'pending' })
    });
    const resultBody = await result.text();
    response.status(result.status).setHeader('Content-Type', 'application/json').send(resultBody);
  } catch (error) {
    console.error('Volunteer application error:', error);
    response.status(502).json({ error: 'The volunteer application service could not be reached.' });
  }
}
