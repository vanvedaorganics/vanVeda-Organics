const axios = require('axios');
const fs = require('fs');

async function test() {
  const env = fs.readFileSync('.env', 'utf8');
  const project = env.match(/VITE_APPWRITE_PROJECT_ID\s*=\s*\"([^\"]+)\"/)[1];
  const endpoint = env.match(/VITE_APPWRITE_ENDPOINT\s*=\s*\"([^\"]+)\"/)[1];
  const db = env.match(/VITE_APPWRITE_DATABASE_ID\s*=\s*\"([^\"]+)\"/)[1];
  const catColl = env.match(/VITE_APPWRITE_CATEGORIES_COLLECTION_ID\s*=\s*\"([^\"]+)\"/)[1];
  
  console.log('Testing Categories Collection Structure...');

  try {
    const url = `${endpoint}/databases/${db}/collections/${catColl}/documents`;
    const response = await axios.get(url, {
      headers: {
        'X-Appwrite-Project': project
      }
    });

    const docs = response.data.documents;
    console.log(`Fetched ${docs.length} category documents.`);
    
    if (docs.length > 0) {
      console.log('\nSample Category Document (First):');
      console.log(JSON.stringify(docs[0], null, 2));
    } else {
      console.log('No categories found. Checking collection attributes...');
      const attrUrl = `${endpoint}/databases/${db}/collections/${catColl}`;
       const attrRes = await axios.get(attrUrl, {
        headers: {
          'X-Appwrite-Project': project
        }
      });
      console.log('Attributes:', attrRes.data.attributes.map(a => a.key));
    }
  } catch (err) {
    console.error('Error fetching data:', err.response?.data || err.message);
  }
}

test();
