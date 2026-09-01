const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = '2f849d45-669f-807d-a999-df4ef7762427';

if (!NOTION_TOKEN) {
    console.error('No NOTION_TOKEN found');
    process.exit(1);
}

const propertiesPayload = {
    properties: {
        'Status': {
            select: {
                options: [
                    { name: 'Draft', color: 'gray' },
                    { name: 'Done', color: 'green' }
                ]
            }
        },
        'Type': {
            select: {
                options: [
                    { name: 'Note', color: 'blue' },
                    { name: 'Post', color: 'purple' }
                ]
            }
        },
        'Tags': {
            multi_select: {}
        },
        'Publish': {
            checkbox: {}
        }
    }
};

const options = {
    hostname: 'api.notion.com',
    path: `/v1/databases/${DATABASE_ID}`,
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Database schema updated successfully.');
        } else {
            console.log(`❌ Failed to update schema. Status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.write(JSON.stringify(propertiesPayload));
req.end();
