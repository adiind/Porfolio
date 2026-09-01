const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TARGET_ID = '2f849d45-669f-807d-a999-df4ef7762427'; // Formatted from URL

if (!NOTION_TOKEN) {
    console.error('No NOTION_TOKEN found');
    process.exit(1);
}

const options = {
    hostname: 'api.notion.com',
    path: `/v1/databases/${TARGET_ID}`,
    method: 'GET',
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
            const json = JSON.parse(data);
            console.log(`Success! Accessed database: "${json.title[0]?.plain_text || 'Untitled'}"`);
            console.log(`ID: ${json.id}`);
        } else {
            // Try as a page if database fails
            const pageOptions = { ...options, path: `/v1/pages/${TARGET_ID}` };
            const pageReq = https.request(pageOptions, (pageRes) => {
                let pageData = '';
                pageRes.on('data', (chunk) => pageData += chunk);
                pageRes.on('end', () => {
                    if (pageRes.statusCode === 200) {
                        const json = JSON.parse(pageData);
                        console.log(`Success! Accessed page: "${json.properties?.Name?.title[0]?.plain_text || 'Untitled'}"`);
                    } else {
                        console.log(`Failed to access. Status: ${res.statusCode} (DB) / ${pageRes.statusCode} (Page)`);
                        console.log(`Response: ${data}`);
                    }
                });
            });
            pageReq.end();
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
