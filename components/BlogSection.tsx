import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost } from '../types/BlogPost';
import BlogCard from './BlogCard';
import BlogDetail from './BlogDetail';
import { BLOG_POSTS } from '../data/posts';

const BlogSection: React.FC = () => {
    const [activePost, setActivePost] = useState<BlogPost | null>(null);

    // Filter to only show public posts
    const visiblePosts = BLOG_POSTS.filter(p => p.visibility === 'public');

    return (
        <>
            <section id="writings" className="relative w-full max-w-6xl mx-auto px-6 py-12 md:py-24 border-t border-white/5 mt-6 md:mt-20">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visiblePosts.map((post, index) => (
                            <div key={post.id} data-post-id={post.id}>
                                <BlogCard
                                    post={post}
                                    index={index}
                                    onClick={() => setActivePost(post)}
                                />
                            </div>
                        ))}

                        {/* Coming Soon Placeholder if few posts */}
                        {visiblePosts.length < 3 && Array.from({ length: 3 - visiblePosts.length }).map((_, i) => (
                            <motion.div
                                key={`placeholder-${i}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{
                                    duration: 0.6,
                                    delay: (visiblePosts.length + i) * 0.1,
                                }}
                                className="
                                    relative cursor-default
                                    bg-white/[0.02]
                                    border border-dashed border-white/10
                                    rounded-2xl p-6 md:p-8
                                    flex items-center justify-center
                                    min-h-[200px]
                                "
                            >
                                <div className="text-center">
                                    <p className="text-white/30 text-sm font-medium mb-1">More Thoughts</p>
                                    <p className="text-white/20 text-xs">Coming Soon</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Blog Detail Modal */}
            <AnimatePresence>
                {activePost && (
                    <BlogDetail
                        post={activePost}
                        onClose={() => setActivePost(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default BlogSection;
