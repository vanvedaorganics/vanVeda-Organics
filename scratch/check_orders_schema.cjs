const axios = require('axios');
const fs = require('fs');

async function checkSchema() {
  const env = fs.readFileSync('.env', 'utf8');
  const project = env.match(/VITE_APPWRITE_PROJECT_ID\s*=\s*\"([^\"]+)\"/)[1];
  const endpoint = env.match(/VITE_APPWRITE_ENDPOINT\s*=\s*\"([^\"]+)\"/)[1];
  const db = env.match(/VITE_APPWRITE_DATABASE_ID\s*=\s*\"([^\"]+)\"/)[1];
  const coll = env.match(/VITE_APPWRITE_ORDERS_COLLECTION_ID\s*=\s*\"([^\"]+)\"/)[1];
  
  console.log(`Checking schema for collection: ${coll} in DB: ${db}`);

  try {
    // We can't list attributes via REST easily without an API Key, 
    // but we can list documents and look at the keys of the first document.
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
      console.log('\nAvailable keys in the first document:');
      const systemKeys = ['$id', '$collectionId', '$databaseId', '$createdAt', '$updatedAt', '$permissions'];
      const attributes = Object.keys(doc).filter(k => !systemKeys.includes(k));
      console.log(attributes.join(', '));
      console.log('\nSample Document Values:');
      console.log(JSON.stringify(doc, null, 2));
    } else {
      console.log('No documents found in the orders collection. Cannot determine schema from documents.');
    }
  } catch (err) {
    console.error('Error fetching data:', err.response?.data || err.message);
  }
}

checkSchema();
