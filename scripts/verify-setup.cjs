const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const PAGE_ID = '2f849d45-669f-8144-88de-f6ce0f301cf5';

if (!NOTION_TOKEN) {
    console.error('No NOTION_TOKEN found');
    process.exit(1);
}

// 1. Fetch Page Properties
const pageOptions = {
    hostname: 'api.notion.com',
    path: `/v1/pages/${PAGE_ID}`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
    }
};

const req = https.request(pageOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const json = JSON.parse(data);
            console.log('✅ Page Properties:');
            console.log(`   Title: ${json.properties['Doc name'].title[0].plain_text}`);
            console.log(`   Status: ${json.properties['Status'].select.name}`);
            console.log(`   Type: ${json.properties['Type'].select.name}`);
            console.log(`   Tags: ${json.properties['Tags'].multi_select.map(t => t.name).join(', ')}`);
            console.log(`   Publish: ${json.properties['Publish'].checkbox}`);

            // 2. Fetch Page Content (Blocks)
            fetchBlocks();
        } else {
            console.log(`❌ Failed to get page. Status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
        }
    });
});
req.end();

function fetchBlocks() {
    const blocksOptions = {
        hostname: 'api.notion.com',
        path: `/v1/blocks/${PAGE_ID}/children`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
        }
    };

    const req = https.request(blocksOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                const json = JSON.parse(data);
                console.log('\n✅ Page Content:');
                json.results.forEach((block, index) => {
                    console.log(`   [${block.type}] ${getText(block)}`);
                });
            } else {
                console.log(`❌ Failed to get blocks. Status: ${res.statusCode}`);
            }
        });
    });
    req.end();
}

function getText(block) {
    if (block.type === 'image') return `(Image URL: ${block.image.type === 'external' ? block.image.external.url : 'file'})`;
    if (block[block.type].rich_text) {
        return block[block.type].rich_text.map(t => t.plain_text).join('');
    }
    return '';
}
