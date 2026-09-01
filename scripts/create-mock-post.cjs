const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = '2f849d45-669f-807d-a999-df4ef7762427';

if (!NOTION_TOKEN) {
    console.error('No NOTION_TOKEN found');
    process.exit(1);
}

const pageData = {
    parent: { database_id: DATABASE_ID },
    properties: {
        'Doc name': {
            title: [
                { text: { content: 'Portfolio Notes — Digital Third Places (Mock)' } }
            ]
        },
        'Status': {
            select: { name: 'Draft' }
        },
        'Type': {
            select: { name: 'Note' }
        },
        'Tags': {
            multi_select: [
                { name: 'portfolio' },
                { name: 'systems' },
                { name: 'play' },
                { name: 'research' }
            ]
        },
        'Publish': {
            checkbox: false
        }
    },
    children: [
        // 1. Intro
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { text: { content: "I've been thinking a lot about the spaces we inhabit online. Not just the utilities, but the places where we hang out. This note explores that vague feeling of 'presence' we sometimes get in well-designed software." } }
                ]
            }
        },
        // 2. Core Thought
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { text: { content: "Digital third places aren't defined by features, but by the permission to loiter. They are software environments that feel distinct from 'productivity' or 'consumption' loops." }, annotations: { bold: true } }
                ]
            }
        },
        // 3. Inline Image
        {
            object: 'block',
            type: 'image',
            image: {
                type: 'external',
                external: {
                    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
                },
                caption: [
                    { text: { content: 'Image: spatial metaphor for digital co-presence' } }
                ]
            }
        },
        // 4. Expansion / Fragments
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { text: { content: "It's about the difference between a hallway and a room. A hallway is for transit; it optimizes flow. A room is for staying. Most apps today are hallways." } }
                ]
            }
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { text: { content: "When we look at early MMORPGs or even early forums, the 'stickiness' wasn't gamification. It was the sense of other people being *there*, even if idle. The cursor presence in multiplayer editors evokes a ghost of this." } }
                ]
            }
        },
        {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { text: { content: "What if we designed for loitering? Lowering the stakes of interaction. Passive visibility over active signaling." } }
                ]
            }
        },
        // 5. Where this might show up later
        {
            object: 'block',
            type: 'heading_3',
            heading_3: {
                rich_text: [{ text: { content: 'Where this might show up later' } }]
            }
        },
        {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                rich_text: [{ text: { content: 'Project page' } }]
            }
        },
        {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                rich_text: [{ text: { content: 'Interview talking point' } }]
            }
        },
        {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                rich_text: [{ text: { content: 'Design exploration' } }]
            }
        },
        {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                rich_text: [{ text: { content: 'Class reflection' } }]
            }
        },
        // 6. Export Notes
        {
            object: 'block',
            type: 'heading_2',
            heading_2: {
                rich_text: [{ text: { content: 'MCP EXPORT METADATA' } }]
            }
        },
        {
            object: 'block',
            type: 'code',
            code: {
                language: 'yaml',
                rich_text: [{ text: { content: "Preferred filename: digital-third-places.md\nImage folder: /writing/images/digital-third-places/\nVisibility: public\nNotes: Raw thinking, light editing only" } }]
            }
        }
    ]
};

const options = {
    hostname: 'api.notion.com',
    path: '/v1/pages',
    method: 'POST',
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
            console.log(`✅ Page created successfully: "${json.url}"`);
            console.log(`   ID: ${json.id}`);
        } else {
            console.log(`❌ Failed to create page. Status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.write(JSON.stringify(pageData));
req.end();
