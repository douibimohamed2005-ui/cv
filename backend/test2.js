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

  // 2. Login
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });
  data = await res.json();
  const token = data.access_token;
  const user = data.user;

  // 3. Create CV with exact builder state
  const state = {
    title: 'My CV', template: 'modern',
    personal: { 
      name: '', title: '', email: '', phone: '', location: '', 
      nationality: '', dob: '', linkedin: '', github: '', portfolio: '', photo: '' 
    },
    summary: '',
    experience: [], education: [], certifications: [],
    skills: { tech: [], soft: [] },
    languages: [], projects: [], volunteer: [], awards: [],
    interests: [], references: [], refRequest: false
  };
  
  const payload = {
    title: state.title,
    template: state.template,
    data: state
  };

  res = await fetch(`${API}/cv/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(payload)
  });
  data = await res.json();
  console.log('Create CV status:', res.status, data);

  // 4. Get CVs
  res = await fetch(`${API}/cv/user/${user.id}`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  data = await res.json();
  console.log('Get CVs status:', res.status, JSON.stringify(data, null, 2));
}
test().catch(console.error);
