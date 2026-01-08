#!/usr/bin/env node

/**
 * Notion Tasks Local Cache Sync Script
 * 
 * Commands:
 *   pull    - Fetch tasks from Notion and cache locally
 *   push    - Push local changes back to Notion
 *   list    - List all cached tasks (no API call)
 *   status  - Show sync status and pending changes
 *   set     - Set a task property: set <taskId> <property> <value>
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB_ID = '2e249d45-669f-817e-a701-d60ab570836f';
const ISSUE_TRACKER_DB = '2e249d45-669f-81aa-a8c9-d4cc31ec02e5';
const NOTION_VERSION = '2022-06-28';

const CACHE_FILE = path.join(__dirname, '..', 'data', 'notion-tasks.json');

// ============== API Helpers ==============

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

// ============== Cache Operations ==============

function loadCache() {
    if (!fs.existsSync(CACHE_FILE)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

function saveCache(data) {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

// ============== Commands ==============

async function pullCommand() {
    console.log('🔄 Pulling tasks from Notion...\n');

    // 1. Find current sprint
    const sprintQuery = await notionRequest(`/databases/${SPRINTS_DB_ID}/query`, 'POST', {
        filter: {
            property: 'Is Current Sprint',
            formula: { checkbox: { equals: true } }
        }
    });

    if (sprintQuery.results.length === 0) {
        console.log('⚠️  No current sprint found.');
        return;
    }

    const sprint = sprintQuery.results[0];
    const sprintName = sprint.properties['Sprint name'].title[0]?.plain_text || 'Unnamed';
    const taskRelations = sprint.properties['Tasks'].relation;

    console.log(`📋 Sprint: "${sprintName}" (${taskRelations.length} tasks)`);

    // 2. Fetch all tasks with full details
    const tasks = [];
    for (const rel of taskRelations) {
        process.stdout.write(`   Fetching ${tasks.length + 1}/${taskRelations.length}...\r`);

        const taskPage = await notionRequest(`/pages/${rel.id}`);

        // Extract all properties
        const name = taskPage.properties['Task name']?.title[0]?.plain_text || 'Untitled';
        const status = taskPage.properties['Status']?.status?.name || 'Unknown';
        const priority = taskPage.properties['Priority']?.select?.name || null;
        const assignee = taskPage.properties['Assignee']?.people?.[0]?.name || null;
        const dueDate = taskPage.properties['Due']?.date?.start || null;
        const tags = taskPage.properties['Tags']?.multi_select?.map(t => t.name) || [];

        // Fetch page content blocks
        let content = [];
        try {
            const blocks = await notionRequest(`/blocks/${rel.id}/children`);
            content = blocks.results.map(block => {
                const type = block.type;
                const data = block[type];

                // Extract text from rich_text blocks
                if (data?.rich_text) {
                    return {
                        type,
                        text: data.rich_text.map(t => t.plain_text).join('')
                    };
                }
                // Handle other block types
                if (type === 'to_do') {
                    return {
                        type,
                        checked: data.checked,
                        text: data.rich_text?.map(t => t.plain_text).join('') || ''
                    };
                }
                return { type, text: '[' + type + ']' };
            });
        } catch (e) {
            // Page might not have accessible blocks
        }

        tasks.push({
            id: rel.id,
            name,
            status,
            priority,
            assignee,
            dueDate,
            tags,
            content,
            url: taskPage.url,
            createdTime: taskPage.created_time,
            lastModified: taskPage.last_edited_time,
            _original: { status }  // Snapshot for diff detection
        });
    }

    console.log(''); // Clear the progress line

    // 3. Save cache
    const cache = {
        lastSync: new Date().toISOString(),
        sprintName,
        sprintId: sprint.id,
        tasks
    };

    saveCache(cache);
    console.log(`\n✅ Cached ${tasks.length} tasks to notion-tasks.json`);
    console.log(`   Last sync: ${cache.lastSync}`);
}

async function pushCommand() {
    const cache = loadCache();
    if (!cache) {
        console.log('❌ No local cache found. Run `pull` first.');
        return;
    }

    console.log('🔄 Checking for local changes...\n');

    const changes = [];
    for (const task of cache.tasks) {
        if (task.status !== task._original.status) {
            changes.push({
                task,
                field: 'status',
                from: task._original.status,
                to: task.status
            });
        }
    }

    if (changes.length === 0) {
        console.log('✅ No local changes to push.');
        return;
    }

    console.log(`📤 Pushing ${changes.length} change(s):\n`);

    for (const change of changes) {
        console.log(`   • "${change.task.name}": ${change.from} → ${change.to}`);

        try {
            await notionRequest(`/pages/${change.task.id}`, 'PATCH', {
                properties: {
                    'Status': {
                        status: { name: change.to }
                    }
                }
            });

            // Update original after successful push
            change.task._original.status = change.to;
            console.log(`     ✅ Updated`);
        } catch (err) {
            console.log(`     ❌ Failed: ${err.message}`);
        }
    }

    // Save updated cache with new _original values
    cache.lastSync = new Date().toISOString();
    saveCache(cache);
    console.log(`\n✅ Sync complete. Last sync: ${cache.lastSync}`);
}

function listCommand() {
    const cache = loadCache();
    if (!cache) {
        console.log('❌ No local cache found. Run `pull` first.');
        return;
    }

    console.log(`📋 Sprint: "${cache.sprintName}"`);
    console.log(`   Last sync: ${cache.lastSync}\n`);
    console.log('─'.repeat(60));

    const openTasks = cache.tasks.filter(t => t.status !== 'Done');
    const doneTasks = cache.tasks.filter(t => t.status === 'Done');

    if (openTasks.length > 0) {
        console.log('\n📌 OPEN TASKS:\n');
        openTasks.forEach((task, i) => {
            const changed = task.status !== task._original.status ? ' *' : '';
            console.log(`   ${i + 1}. [${task.status}${changed}] ${task.name}`);
            console.log(`      ID: ${task.id.slice(0, 8)}...`);
        });
    }

    if (doneTasks.length > 0) {
        console.log('\n✅ COMPLETED:\n');
        doneTasks.forEach(task => {
            console.log(`   ✓ ${task.name}`);
        });
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`Total: ${cache.tasks.length} tasks (${openTasks.length} open, ${doneTasks.length} done)`);
}

function statusCommand() {
    const cache = loadCache();
    if (!cache) {
        console.log('❌ No local cache found. Run `pull` first.');
        return;
    }

    console.log('📊 SYNC STATUS\n');
    console.log(`   Sprint: ${cache.sprintName}`);
    console.log(`   Last sync: ${cache.lastSync}`);
    console.log(`   Cache file: ${CACHE_FILE}\n`);

    const changes = [];
    for (const task of cache.tasks) {
        if (task.status !== task._original.status) {
            changes.push({ task, field: 'status', from: task._original.status, to: task.status });
        }
    }

    if (changes.length === 0) {
        console.log('✅ No pending changes. Local cache matches Notion.');
    } else {
        console.log(`⚠️  ${changes.length} pending change(s):\n`);
        changes.forEach(c => {
            console.log(`   • "${c.task.name}"`);
            console.log(`     ${c.field}: "${c.from}" → "${c.to}"`);
        });
        console.log('\n   Run `push` to sync these changes to Notion.');
    }
}

function setCommand(taskIdPrefix, property, value) {
    const cache = loadCache();
    if (!cache) {
        console.log('❌ No local cache found. Run `pull` first.');
        return;
    }

    // Find task by ID prefix
    const task = cache.tasks.find(t => t.id.startsWith(taskIdPrefix));
    if (!task) {
        console.log(`❌ No task found with ID starting with "${taskIdPrefix}"`);
        console.log('   Use `list` to see task IDs.');
        return;
    }

    if (property === 'status') {
        const validStatuses = ['Not Started', 'In Progress', 'Done'];
        if (!validStatuses.includes(value)) {
            console.log(`❌ Invalid status. Valid values: ${validStatuses.join(', ')}`);
            return;
        }

        const oldStatus = task.status;
        task.status = value;
        saveCache(cache);
        console.log(`✅ Updated "${task.name}"`);
        console.log(`   Status: "${oldStatus}" → "${value}"`);
        console.log('\n   Run `push` to sync this change to Notion.');
    } else {
        console.log(`❌ Unknown property: "${property}"`);
        console.log('   Supported: status');
    }
}

function showCommand(taskIdPrefix) {
    const cache = loadCache();
    if (!cache) {
        console.log('❌ No local cache found. Run `pull` first.');
        return;
    }

    // Find task by ID prefix or show all if no prefix
    const task = cache.tasks.find(t => t.id.startsWith(taskIdPrefix));
    if (!task) {
        console.log(`❌ No task found with ID starting with "${taskIdPrefix}"`);
        console.log('   Use `list` to see task IDs.');
        return;
    }

    console.log('─'.repeat(60));
    console.log(`\n📋 ${task.name}\n`);
    console.log('─'.repeat(60));

    console.log(`   ID:       ${task.id}`);
    console.log(`   Status:   ${task.status}`);
    if (task.priority) console.log(`   Priority: ${task.priority}`);
    if (task.assignee) console.log(`   Assignee: ${task.assignee}`);
    if (task.dueDate) console.log(`   Due:      ${task.dueDate}`);
    if (task.tags?.length) console.log(`   Tags:     ${task.tags.join(', ')}`);
    console.log(`   Created:  ${task.createdTime}`);
    console.log(`   Modified: ${task.lastModified}`);
    console.log(`   URL:      ${task.url}`);

    if (task.content?.length > 0) {
        console.log('\n📝 CONTENT:\n');
        task.content.forEach(block => {
            if (block.type === 'heading_2') {
                console.log(`   ## ${block.text}`);
            } else if (block.type === 'heading_3') {
                console.log(`   ### ${block.text}`);
            } else if (block.type === 'bulleted_list_item') {
                console.log(`   • ${block.text}`);
            } else if (block.type === 'numbered_list_item') {
                console.log(`   1. ${block.text}`);
            } else if (block.type === 'to_do') {
                const check = block.checked ? '✓' : '○';
                console.log(`   [${check}] ${block.text}`);
            } else if (block.type === 'paragraph' && block.text) {
                console.log(`   ${block.text}`);
            } else if (block.text && block.text !== '[' + block.type + ']') {
                console.log(`   ${block.text}`);
            }
        });
    }

    console.log('\n' + '─'.repeat(60));
}

async function createCommand(taskName) {
    if (!taskName) {
        console.log('Usage: create "Task name here"');
        return;
    }

    console.log(`📝 Creating task: "${taskName}"...\n`);

    try {
        // 1. Create the task in Issue Tracker
        const newPage = await notionRequest('/pages', 'POST', {
            parent: { database_id: ISSUE_TRACKER_DB },
            properties: {
                'Task name': { title: [{ text: { content: taskName } }] },
                'Status': { status: { name: 'Not Started' } }
            }
        });

        console.log(`   ✅ Task created: ${newPage.id.slice(0, 8)}...`);

        // 2. Find current sprint and link
        const sprintQuery = await notionRequest(`/databases/${SPRINTS_DB_ID}/query`, 'POST', {
            filter: {
                property: 'Is Current Sprint',
                formula: { checkbox: { equals: true } }
            }
        });

        if (sprintQuery.results.length > 0) {
            const sprintId = sprintQuery.results[0].id;
            await notionRequest(`/pages/${newPage.id}`, 'PATCH', {
                properties: {
                    'Sprint': { relation: [{ id: sprintId }] }
                }
            });
            console.log(`   ✅ Linked to current sprint`);
        }

        // 3. Pull fresh cache
        console.log('');
        await pullCommand();

    } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
    }
}

function showHelp() {
    console.log(`
Notion Tasks Cache - Local sync for Notion tasks

USAGE:
  node notion-sync.cjs <command> [args]

COMMANDS:
  pull              Fetch tasks from Notion → local cache
  push              Push local changes → Notion
  list              Show all cached tasks (offline)
  show <id>         Show full details of a task (offline)
  status            Show pending changes
  set <id> <prop> <value>   Update a task property locally
  create "Task name"        Create a new task in current sprint
  
EXAMPLES:
  node notion-sync.cjs pull
  node notion-sync.cjs list
  node notion-sync.cjs show 2e249d45
  node notion-sync.cjs set abc123 status "In Progress"
  node notion-sync.cjs create "Fix login bug"
  node notion-sync.cjs push

WORKFLOW:
  1. Start work session: pull (auto on npm run dev)
  2. Work on tasks: set <id> status "In Progress"
  3. Complete task: set <id> status "Done"  
  4. End session: push
`);
}

// ============== Main ==============

async function main() {
    const [, , command, ...args] = process.argv;

    switch (command) {
        case 'pull':
            await pullCommand();
            break;
        case 'push':
            await pushCommand();
            break;
        case 'list':
            listCommand();
            break;
        case 'status':
            statusCommand();
            break;
        case 'set':
            if (args.length < 3) {
                console.log('Usage: set <taskId> <property> <value>');
                console.log('Example: set abc123 status "In Progress"');
                return;
            }
            setCommand(args[0], args[1], args.slice(2).join(' ').replace(/^"|"$/g, ''));
            break;
        case 'create':
            await createCommand(args.join(' ').replace(/^"|"$/g, ''));
            break;
        case 'show':
            if (!args[0]) {
                console.log('Usage: show <taskId>');
                return;
            }
            showCommand(args[0]);
            break;
        case 'help':
        case '--help':
        case '-h':
        default:
            showHelp();
            break;
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
