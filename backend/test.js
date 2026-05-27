import fetch from 'node-fetch';

async function test() {
  const API = 'https://cv-pttb.onrender.com/api';

  // 1. Register a user
  const email = 'test' + Date.now() + '@example.com';
  const pass = 'password123';
  let res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });
  let data = await res.json();
  console.log('Register:', data);

  // 2. Login
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });
  data = await res.json();
  const token = data.access_token;
  const user = data.user;
  console.log('Login:', user.id);

  // 3. Create CV
  const payload = {
    title: 'My Test CV',
    template: 'modern',
    data: { personal: { name: 'Test' } }
  };
  res = await fetch(`${API}/cv/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(payload)
  });
  data = await res.json();
  console.log('Create CV:', data);

  // 4. Get CVs
  res = await fetch(`${API}/cv/user/${user.id}`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  data = await res.json();
  console.log('Get CVs:', JSON.stringify(data, null, 2));
}
test().catch(console.error);
