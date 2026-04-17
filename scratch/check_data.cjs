const axios = require('axios');
const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env', 'utf8');
  const project = env.match(/VITE_APPWRITE_PROJECT_ID\s*=\s*\"([^\"]+)\"/)[1];
  const endpoint = env.match(/VITE_APPWRITE_ENDPOINT\s*=\s*\"([^\"]+)\"/)[1];
  const db = env.match(/VITE_APPWRITE_DATABASE_ID\s*=\s*\"([^\"]+)\"/)[1];
  const coll = env.match(/VITE_APPWRITE_PRODUCTS_COLLECTION_ID\s*=\s*\"([^\"]+)\"/)[1];
  
  console.log('Testing Appwrite Data Structure...');
  console.log(`Endpoint: ${endpoint}, Project: ${project}`);

  try {
    const url = `${endpoint}/databases/${db}/collections/${coll}/documents`;
    const response = await axios.get(url, {
      headers: {
        'X-Appwrite-Project': project
      }
    });

    const docs = response.data.documents;
    console.log(`Fetched ${docs.length} documents.`);
    
    if (docs.length > 0) {
      const doc = docs[0];
      console.log('\nSample Raw Document (First):');
      console.log('Name:', doc.name);
      console.log('Type of packaging_size:', typeof doc.packaging_size);
      console.log('Value of packaging_size:', JSON.stringify(doc.packaging_size, null, 2));
      console.log('Type of batch:', typeof doc.batch);
      console.log('Value of batch:', JSON.stringify(doc.batch, null, 2));
    }
  } catch (err) {
    console.error('Error fetching data:', err.response?.data || err.message);
  }
}

test();
