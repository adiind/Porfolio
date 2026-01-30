const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NOTION_TOKEN = process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) {
    console.error('No NOTION_TOKEN found');
    process.exit(1);
}

const options = {
    hostname: 'api.notion.com',
    path: '/v1/users/me',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const json = JSON.parse(data);
            console.log(`Bot Name: "${json.name}"`);
            console.log(`Bot ID: ${json.id}`);
            console.log(`Workspace: ${json.bot?.owner?.workspace ? 'Yes' : 'No'}`);
        } else {
            console.log(`Failed to identify bot. Status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
