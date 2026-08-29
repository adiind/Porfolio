import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost } from '../types/BlogPost';
import BlogCard from './BlogCard';
import BlogDetail from './BlogDetail';
import { BLOG_POSTS } from '../data/posts';
import { trackEvent } from '../lib/analytics';
import { useContentEngagement } from '../hooks/useContentEngagement';

const BlogSection: React.FC = () => {
    const [activePost, setActivePost] = useState<BlogPost | null>(null);
    const engagementRef = useContentEngagement<HTMLElement>({
        contentType: 'section',
        contentId: 'writings',
        active: activePost === null,
        observeVisibility: true,
    });

    const openPost = (post: BlogPost) => {
        trackEvent('blog_opened', {
            id: post.id,
            title: post.title,
            tags: post.tags.join(','),
            source: 'writings',
        });
        setActivePost(post);
    };

    // Listen for closeAllModals event (e.g., from navbar navigation)
    useEffect(() => {
        const handleCloseAll = () => setActivePost(null);
        window.addEventListener('closeAllModals', handleCloseAll);
        return () => window.removeEventListener('closeAllModals', handleCloseAll);
    }, []);

    // Notify App.tsx when this modal opens/closes so global scroll-snap is blocked
    useEffect(() => {
        window.dispatchEvent(new CustomEvent(activePost ? 'blogDetailOpen' : 'blogDetailClose'));
    }, [activePost]);

    // Only published, public posts appear on the site — drafts stay in the
    // data file but are never rendered.
    const visiblePosts = BLOG_POSTS.filter(p => p.status === 'Published' && p.visibility === 'public');

    // With only one or two posts, keep the grid intentional instead of leaving
    // empty columns: a single post reads as a featured card, two share a row.
    const gridColumnsClass = visiblePosts.length === 1
        ? 'grid-cols-1 md:max-w-2xl'
        : visiblePosts.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    return (
        <>
            <section ref={engagementRef} id="writings" className="relative w-full max-w-6xl mx-auto px-6 py-12 md:py-24 border-t border-white/5 mt-6 md:mt-20">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Section Header */}
                    <div className="mb-12 md:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-3xl md:text-5xl font-bold text-white mb-4"
                        >
                            Writings
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-white/50 text-lg md:text-xl max-w-xl"
                        >
                            Thoughts on making, design, and technology.
                        </motion.p>
                    </div>

                    {/* Blog Grid */}
                    <div className={`grid ${gridColumnsClass} gap-6`}>
                        {visiblePosts.map((post, index) => (
                            <div key={post.id} data-post-id={post.id}>
                                <BlogCard
                                    post={post}
                                    index={index}
                                    onClick={() => openPost(post)}
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Blog Detail Modal — plain conditional: an AnimatePresence exit
                would keep the closed dialog as an invisible click-eating layer
                whenever frames are throttled (see App.tsx overlay note). */}
            {activePost && (
                <BlogDetail
                    post={activePost}
                    onClose={() => setActivePost(null)}
                />
            )}
        </>
    );
};

export default BlogSection;
