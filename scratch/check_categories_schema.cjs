const https = require('https');
const fs = require('fs');

async function check() {
  const env = fs.readFileSync('.env', 'utf8');
  const project = env.match(/VITE_APPWRITE_PROJECT_ID\s*=\s*\"([^\"]+)\"/)[1];
  const endpoint = env.match(/VITE_APPWRITE_ENDPOINT\s*=\s*\"([^\"]+)\"/)[1];
  const db = env.match(/VITE_APPWRITE_DATABASE_ID\s*=\s*\"([^\"]+)\"/)[1];
  const catColl = env.match(/VITE_APPWRITE_CATEGORIES_COLLECTION_ID\s*=\s*\"([^\"]+)\"/)[1];
  
  const url = new URL(`${endpoint}/databases/${db}/collections/${catColl}`);
  console.log('Checking collection schema for:', catColl);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'GET',
    headers: {
      'X-Appwrite-Project': project
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.attributes) {
          console.log('\nAttributes found in Categories collection:');
          console.log(json.attributes.map(a => `- ${a.key} (${a.type})`).join('\n'));
        } else {
          console.log('\nCould not fetch attributes. Response:', JSON.stringify(json, null, 2));
        }
      } catch (e) {
        console.error('Failed to parse response:', e);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
  });
  req.end();
}

check();
