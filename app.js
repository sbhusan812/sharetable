const defaultFood = [
  { title: 'Dal, rice & sabzi', type: 'meal', emoji: '🍲', portions: 12, place: 'The Green Plate', time: 'Pickup by 8:00 PM', distance: '0.4 km', verified: true },
  { title: 'Fresh market produce', type: 'produce', emoji: '🥬', portions: 6, place: 'Maya’s Kitchen', time: 'Good for 2 days', distance: '0.8 km', verified: true },
  { title: 'Sourdough loaves', type: 'bakery', emoji: '🍞', portions: 8, place: 'Common Ground Café', time: 'Pickup by 6:30 PM', distance: '1.1 km', verified: true },
  { title: 'Paneer wraps', type: 'meal', emoji: '🌯', portions: 5, place: 'Rhea S.', time: 'Meet by 7:00 PM', distance: '1.4 km', verified: false },
  { title: 'Lemon rice & curd', type: 'meal', emoji: '🍚', portions: 9, place: 'Ananya’s Home', time: 'Pickup by 9:00 PM', distance: '1.7 km', verified: true },
  { title: 'Banana & citrus box', type: 'produce', emoji: '🍌', portions: 10, place: 'Fresh Basket Co.', time: 'Good for 3 days', distance: '2.0 km', verified: true },
  { title: 'Veggie puffs', type: 'bakery', emoji: '🥐', portions: 7, place: 'Miette Bakery', time: 'Pickup by 5:30 PM', distance: '2.2 km', verified: true },
  { title: 'Chickpea curry', type: 'meal', emoji: '🥘', portions: 15, place: 'Sanjay K.', time: 'Delivery available', distance: '2.6 km', verified: false }
];

const grid = document.querySelector('#food-grid');
const modal = document.querySelector('#modal');
const toast = document.querySelector('#toast');
let activeFilter = 'all';
let remoteFood = null;
const supabaseClient = window.supabase.createClient(
  'https://wjcxgayteiysrfukjfzv.supabase.co',
  'sb_publishable_x8IZsEcGWVrQLL3MqhHhkg_jcCPCgny'
);
let authMode = 'signin';
let currentSession = null;

function getFood() {
  if (remoteFood) return remoteFood;
  try { return [...defaultFood, ...(JSON.parse(localStorage.getItem('sharetable-posts')) || [])]; }
  catch { return defaultFood; }
}
async function loadRemoteFood() {
  try {
    const response = await fetch('/api/listings');
    if (!response.ok) return;
    const listings = await response.json();
    remoteFood = listings.map(item => ({
      id: item.id,
      title: item.title,
      type: item.food_type,
      emoji: item.food_type === 'produce' ? '🥗' : item.food_type === 'bakery' ? '🥖' : '🍱',
      portions: item.verified_portions || item.portions,
      place: item.location_area,
      time: `Pickup by ${new Date(item.pickup_by).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      handoff: item.handoff_method.replaceAll('_', ' '),
      distance: 'nearby',
      verified: Boolean(item.verified_at)
    }));
    renderFood();
  } catch {
    showToast('Showing demo listings while the backend is offline');
  }
}
function renderFood() {
  const food = getFood().filter(item => activeFilter === 'all' || item.type === activeFilter);
  grid.innerHTML = food.map(item => `
    <article class="food-card">
      <div class="food-photo ${item.type}"><span>${item.emoji}</span><span class="tag">${item.portions} portions</span>${item.verified ? '<span class="verified" title="Quantity verified">✓</span>' : ''}</div>
      <div class="food-info"><h3>${item.title}</h3><div class="meta"><strong>${item.place}</strong><br />${item.time}<br /><span class="handoff-label">${item.handoff || 'Receiver collects'}</span></div><div class="card-bottom"><span class="distance">↗ ${item.distance}</span><button class="claim" data-claim-id="${item.id || ''}" data-claim="${item.title}">I can take this</button></div></div>
    </article>`).join('');
  grid.querySelectorAll('[data-claim]').forEach(button => button.addEventListener('click', () => claimListing(button.dataset.claimId, button.dataset.claim)));
}
async function claimListing(listingId, title) {
  if (!currentSession) { toggleModal('#login-modal', true); showToast('Sign in before requesting food'); return; }
  const response = await fetch('/api/claims', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentSession.access_token}` }, body: JSON.stringify({ listing_id: listingId }) });
  if (!response.ok) { const error = await response.json().catch(() => ({})); showToast(error.error || 'Could not request this listing'); return; }
  showToast(`Request sent for ${title}`);
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
function setModal(open) { modal.classList.toggle('open', open); modal.setAttribute('aria-hidden', String(!open)); if (open) modal.querySelector('input').focus(); }
function setSupportModal(open) { const supportModal = document.querySelector('#support-modal'); supportModal.classList.toggle('open', open); supportModal.setAttribute('aria-hidden', String(!open)); if (open) supportModal.querySelector('input').focus(); }
function toggleModal(id, open) { const target = document.querySelector(id); target.classList.toggle('open', open); target.setAttribute('aria-hidden', String(!open)); if (open) target.querySelector('input').focus(); }
function updateAuthUI(session) {
  currentSession = session;
  const profileButton = document.querySelector('.profile-button');
  const profileName = profileButton.querySelector('.profile-name');
  const avatar = profileButton.querySelector('.avatar');
  if (session?.user) {
    const name = session.user.user_metadata?.display_name || session.user.email.split('@')[0];
    profileName.textContent = name;
    avatar.textContent = name.slice(0, 2).toUpperCase();
  } else {
    profileName.textContent = 'Sign in';
    avatar.textContent = '↗';
  }
}
function setAuthMode(mode) {
  authMode = mode;
  const signupField = document.querySelector('.signup-only');
  const submit = document.querySelector('#auth-submit');
  const toggle = document.querySelector('[data-toggle-auth]');
  signupField.classList.toggle('hidden-field', mode !== 'signup');
  signupField.querySelector('input').required = mode === 'signup';
  submit.innerHTML = mode === 'signup' ? 'Create account <span>↗</span>' : 'Sign in <span>↗</span>';
  toggle.textContent = mode === 'signup' ? 'I already have an account' : 'Create an account instead';
}

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button)); renderFood(); }));
document.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => setModal(true)));
document.querySelector('[data-close-modal]').addEventListener('click', () => setModal(false));
modal.addEventListener('click', event => { if (event.target === modal) setModal(false); });
document.querySelectorAll('[data-open-support]').forEach(button => button.addEventListener('click', () => setSupportModal(true)));
document.querySelector('[data-close-support]').addEventListener('click', () => setSupportModal(false));
const supportModal = document.querySelector('#support-modal');
supportModal.addEventListener('click', event => { if (event.target === supportModal) setSupportModal(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { setModal(false); setSupportModal(false); } });
document.querySelector('#share-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentSession) { setModal(false); toggleModal('#login-modal', true); showToast('Sign in before publishing a shared listing'); return; }
  const data = new FormData(event.target);
  const response = await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentSession.access_token}` }, body: JSON.stringify({ title: data.get('title'), food_type: data.get('type'), portions: data.get('portions'), pickup_by: new Date(data.get('pickupBy')).toISOString(), handoff_method: data.get('handoff').toLowerCase().replaceAll(' ', '_'), location_area: data.get('locationArea') }) });
  if (!response.ok) { const error = await response.json().catch(() => ({})); showToast(error.error || 'Could not publish this listing'); return; }
  setModal(false); event.target.reset(); activeFilter = 'all'; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item.dataset.filter === 'all')); await loadRemoteFood(); showToast('Your surplus is live and pending verification');
});
document.querySelector('#support-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const amount = data.get('amount') === 'custom' ? data.get('customAmount') : data.get('amount');
  if (!amount || Number(amount) < 1) { showToast('Enter a contribution amount to continue'); return; }
  const frequency = document.querySelector('input[name="frequency"]:checked').value === 'monthly' ? 'monthly support' : 'one-time support';
  setSupportModal(false); event.target.reset(); showToast(`Thank you. Payment setup is ready for ₹${amount} ${frequency}`);
});
document.querySelectorAll('[data-open-login]').forEach(button => button.addEventListener('click', () => toggleModal('#login-modal', true)));
document.querySelector('[data-close-login]').addEventListener('click', () => toggleModal('#login-modal', false));
document.querySelector('#login-modal').addEventListener('click', event => { if (event.target.id === 'login-modal') toggleModal('#login-modal', false); });
document.querySelectorAll('[data-open-volunteer]').forEach(button => button.addEventListener('click', () => { toggleModal('#login-modal', false); toggleModal('#volunteer-modal', true); }));
document.querySelector('[data-close-volunteer]').addEventListener('click', () => toggleModal('#volunteer-modal', false));
document.querySelector('#volunteer-modal').addEventListener('click', event => { if (event.target.id === 'volunteer-modal') toggleModal('#volunteer-modal', false); });
document.querySelector('[data-open-bulk]').addEventListener('click', () => toggleModal('#bulk-modal', true));
document.querySelector('[data-close-bulk]').addEventListener('click', () => toggleModal('#bulk-modal', false));
document.querySelector('#bulk-modal').addEventListener('click', event => { if (event.target.id === 'bulk-modal') toggleModal('#bulk-modal', false); });
document.querySelectorAll('[data-bulk-claim]').forEach(button => button.addEventListener('click', () => showToast(`NGO request started for ${button.dataset.bulkClaim}`)));
document.querySelector('[data-open-verify]')?.addEventListener('click', () => toggleModal('#verify-modal', true));
document.querySelector('[data-close-verify]')?.addEventListener('click', () => toggleModal('#verify-modal', false));
document.querySelector('#verify-modal').addEventListener('click', event => { if (event.target.id === 'verify-modal') toggleModal('#verify-modal', false); });
document.querySelector('[data-toggle-auth]').addEventListener('click', () => setAuthMode(authMode === 'signin' ? 'signup' : 'signin'));
document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const result = authMode === 'signup'
    ? await supabaseClient.auth.signUp({ email: data.get('identity'), password: data.get('password'), options: { data: { display_name: data.get('displayName') } } })
    : await supabaseClient.auth.signInWithPassword({ email: data.get('identity'), password: data.get('password') });
  if (result.error) { showToast(result.error.message); return; }
  if (authMode === 'signup' && !result.data.session) { showToast('Check your email to confirm your account, then sign in'); return; }
  updateAuthUI(result.data.session); toggleModal('#login-modal', false); event.target.reset(); showToast(authMode === 'signup' ? 'Account created' : 'Signed in successfully');
});
document.querySelector('#volunteer-form').addEventListener('submit', event => { event.preventDefault(); toggleModal('#volunteer-modal', false); showToast('Application sent. We will review your identity and references.'); });
document.querySelector('#verify-form').addEventListener('submit', event => { event.preventDefault(); toggleModal('#verify-modal', false); showToast('Verification saved to the listing history'); });
document.querySelector('#bulk-form').addEventListener('submit', event => { event.preventDefault(); toggleModal('#bulk-modal', false); showToast('Verified NGOs near you have been notified'); });
renderFood();
loadRemoteFood();
supabaseClient.auth.getSession().then(({ data }) => updateAuthUI(data.session));
supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
