import React from 'react';
import { motion } from "framer-motion";
import { SocialPost } from '../../types';
import { ExternalLink, Heart, MessageCircle } from 'lucide-react';

interface MarqueeFeedProps {
    posts: SocialPost[];
    className?: string;
    duration?: number;
}

const PostCard = ({ post }: { post: SocialPost }) => (
    <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-xl border border-white/10 bg-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all duration-300 group"
    >
        <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono text-white/40">{post.date}</span>
            <ExternalLink size={12} className="text-white/20 group-hover:text-amber-400 transition-colors" />
        </div>

        <p className="text-sm text-gray-300 font-light leading-relaxed line-clamp-4 group-hover:text-white transition-colors">
            {post.caption}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-amber-200/70">
                <Heart size={12} />
                <span>{post.likes}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-blue-200/70">
                <MessageCircle size={12} />
                <span>{post.comments}</span>
            </div>
        </div>
    </a>
);

const MarqueeColumn = ({ posts, duration = 40, className }: { posts: SocialPost[], duration?: number, className?: string }) => {
    return (
        <div className={`relative overflow-hidden ${className} h-full group/column`}>
            <style>
                {`
          @keyframes scroll-vertical {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
          }
          .animate-scroll-vertical {
            animation: scroll-vertical var(--duration) linear infinite;
          }
          .group\\/column:hover .animate-scroll-vertical {
            animation-play-state: paused;
          }
        `}
            </style>
            <div
                className="animate-scroll-vertical flex flex-col gap-4"
                style={{ '--duration': `${duration}s` } as React.CSSProperties}
            >
                {/* Double the posts to create seamless loop */}
                {[...posts, ...posts].map((post, i) => (
                    <PostCard key={`${post.id}-${i}`} post={post} />
                ))}
            </div>
        </div>
    );
};

export const MarqueeFeed: React.FC<MarqueeFeedProps> = ({ posts }) => {
    // Split posts into 3 columns
    const col1 = posts.slice(0, Math.ceil(posts.length / 3));
    const col2 = posts.slice(Math.ceil(posts.length / 3), Math.ceil(2 * posts.length / 3));
    const col3 = posts.slice(Math.ceil(2 * posts.length / 3));

    return (
        <div className="relative h-[600px] overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
            <MarqueeColumn posts={col1} duration={60} />
            <MarqueeColumn posts={col2} duration={80} className="hidden md:block" />
            <MarqueeColumn posts={col3} duration={70} className="hidden lg:block" />
        </div>
    );
};
