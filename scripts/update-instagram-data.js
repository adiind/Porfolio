import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname simulation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APIFY_API_BASE = 'https://api.apify.com/v2';
const DEFAULT_ACTOR_ID = 'apify~instagram-post-scraper';
const OUTPUT_FILE = path.join(__dirname, '../data/instagram_posts.json');

// Get token from env or args
const text = process.env.APIFY_API_TOKEN || process.argv[2];
if (!text) {
    console.error('Error: APIFY_API_TOKEN is required');
    process.exit(1);
}

const fetchInstagramPosts = async () => {
    try {
        console.log('Fetching Instagram data from Apify...');
        const url = `${APIFY_API_BASE}/acts/${DEFAULT_ACTOR_ID}/run-sync-get-dataset-items?token=${text}`;

        // Explicitly ask for username 'tinker_verse'
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: ['tinker_verse'], // Use 'username' array as found during debugging
                resultsLimit: 100,
                resultsType: 'posts',
            }),
        });

        if (!response.ok) {
            throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
        }

        const rawPosts = await response.json();
        console.log(`Received ${rawPosts.length} posts`);

        // Sort by timestamp descending (newest first)
        // Note: the API returns 'timestamp' field as confirmed in debugging
        const sortedPosts = rawPosts.sort((a, b) => {
            const tA = new Date(a.timestamp || 0).getTime();
            const tB = new Date(b.timestamp || 0).getTime();
            return tB - tA;
        });

        const posts = sortedPosts.map((post) => ({
            id: post.url || post.shortCode || post.id || '',
            date: post.timestamp ? post.timestamp.split('T')[0] : '',
            summary: post.caption || '',
            url: post.url,
            caption: post.caption || '',
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
        }));

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
        console.log(`Successfully wrote ${posts.length} posts to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Failed to update Instagram data:', error);
        process.exit(1);
    }
};

fetchInstagramPosts();
