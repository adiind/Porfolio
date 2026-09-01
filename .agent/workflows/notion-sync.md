---
description: How to sync Notion tasks locally for faster access
---

# Notion Tasks Sync Workflow

Use the local cache to avoid slow Notion API calls during work.

## Commands

```bash
# Pull fresh tasks from Notion
node scripts/notion-sync.cjs pull

# List all tasks (instant, no API call)
node scripts/notion-sync.cjs list

# Check for pending local changes
node scripts/notion-sync.cjs status

# Update a task status locally
node scripts/notion-sync.cjs set <taskId-prefix> status "In Progress"
node scripts/notion-sync.cjs set <taskId-prefix> status "Done"

# Create a new task in current sprint
node scripts/notion-sync.cjs create "Task name here"

# Push local changes to Notion
node scripts/notion-sync.cjs push
```

## NPM Script Shortcuts

```bash
npm run sync:pull   # Pull from Notion
npm run sync:push   # Push to Notion  
npm run sync:list   # List cached tasks
npm run sync:status # Check pending changes
```

## Daily Workflow

// turbo-all

1. **Start of session**: Pull fresh data
```bash
node scripts/notion-sync.cjs pull
```

2. **View tasks** (no API call):
```bash
node scripts/notion-sync.cjs list
```

3. **Start working on a task**: Copy the task ID prefix from list output
```bash
node scripts/notion-sync.cjs set 2e249d45 status "In Progress"
```

4. **Complete a task**:
```bash
node scripts/notion-sync.cjs set 2e249d45 status "Done"
```

5. **End of session**: Push all changes
```bash
node scripts/notion-sync.cjs push
```

## Status Values

- `Not Started` - Task not yet begun
- `In Progress` - Currently working on it
- `Testing` - In testing phase
- `Done` - Completed

## Cache Location

Local cache is stored at: `data/notion-tasks.json`
