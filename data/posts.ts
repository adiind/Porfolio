import { BlogPost } from '../types/BlogPost';

// Blog posts data - parsed from writing/posts/*.md
// To add new posts, add entries here with the same structure

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 'digital-third-places',
        title: 'Digital Third Places',
        date: '2026-01-30',
        status: 'Draft',
        type: 'Note',
        tags: ['portfolio', 'systems', 'play', 'research'],
        excerpt: "I've been thinking a lot about the spaces we inhabit online. Not just the utilities, but the places where we hang out. This note explores that vague feeling of 'presence' we sometimes get in well-designed software.",
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
        content: `I've been thinking a lot about the spaces we inhabit online. Not just the utilities, but the places where we hang out. This note explores that vague feeling of 'presence' we sometimes get in well-designed software.

**Digital third places aren't defined by features, but by the permission to loiter. They are software environments that feel distinct from 'productivity' or 'consumption' loops.**

It's about the difference between a hallway and a room. A hallway is for transit; it optimizes flow. A room is for staying. Most apps today are hallways.

When we look at early MMORPGs or even early forums, the 'stickiness' wasn't gamification. It was the sense of other people being *there*, even if idle. The cursor presence in multiplayer editors evokes a ghost of this.

What if we designed for loitering? Lowering the stakes of interaction. Passive visibility over active signaling.

### Where this might show up later

- Project page
- Interview talking point
- Design exploration
- Class reflection`,
        visibility: 'public',
    },
];
