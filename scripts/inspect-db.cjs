const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = '2f849d45-669f-807d-a999-df4ef7762427';

if (!NOTION_TOKEN) {
    console.error('No NOTION_TOKEN found');
    process.exit(1);
}

const options = {
    hostname: 'api.notion.com',
    path: `/v1/databases/${DATABASE_ID}`,
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
            console.log(JSON.stringify(json.properties, null, 2));
        } else {
            console.log(`Failed to get database. Status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
