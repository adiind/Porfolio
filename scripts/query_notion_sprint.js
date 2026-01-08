require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB_ID = '2e249d45-669f-817e-a701-d60ab570836f';
const NOTION_VERSION = '2022-06-28';

async function notionRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`https://api.notion.com/v1${endpoint}`, options);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion API Error ${res.status}: ${text}`);
    }
    return res.json();
}

async function main() {
    if (NOTION_TOKEN === 'YOUR_NOTION_TOKEN_HERE') {
        console.error('❌ Please edit this file and paste your Notion Integration Token into the NOTION_TOKEN variable at the top.');
        process.exit(1);
    }

    try {
        console.log('🔍 Finding Current Sprint...');

        // 1. Find Current Sprint
        const sprintQuery = await notionRequest(`/databases/${SPRINTS_DB_ID}/query`, 'POST', {
            filter: {
                property: 'Is Current Sprint',
                formula: {
                    checkbox: {
                        equals: true
                    }
                }
            }
        });

        if (sprintQuery.results.length === 0) {
            console.log('⚠️ No "Current Sprint" found.');
            return;
        }

        const currentSprintPage = sprintQuery.results[0];
        const sprintName = currentSprintPage.properties['Sprint name'].title[0]?.plain_text || 'Unnamed Sprint';
        const taskRelations = currentSprintPage.properties['Tasks'].relation;

        console.log(`✅ Found Sprint: "${sprintName}" with ${taskRelations.length} linked tasks.`);

        if (taskRelations.length === 0) {
            console.log('No tasks linked to this sprint.');
            return;
        }

        console.log('📋 Fetching task details...');

        // 2. Fetch all linked tasks
        const tasks = [];
        for (const rel of taskRelations) {
            const taskPage = await notionRequest(`/pages/${rel.id}`);
            tasks.push(taskPage);
        }

        // 3. Filter and Display
        console.log('\n--- OPEN ISSUES ---');
        let foundOpen = false;

        tasks.forEach(task => {
            const title = task.properties['Task name']?.title[0]?.plain_text || 'Untitled';
            const status = task.properties['Status']?.status?.name || 'Unknown';

            if (status !== 'Done') {
                console.log(`[ ] ${title} (Status: ${status})`);
                foundOpen = true;
            }
        });

        if (!foundOpen) {
            console.log('🎉 No open issues found! All tasks are done.');
        }

        console.log('\n-------------------');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
