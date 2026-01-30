export interface BlogPost {
    id: string;
    title: string;
    date: string;
    status: 'Draft' | 'Published';
    type?: string;
    tags: string[];
    excerpt: string;
    content: string;
    imageUrl?: string;
    visibility?: 'public' | 'private';
}
