import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { X, Calendar, BookOpen, ArrowLeft } from 'lucide-react';
import { BlogPost } from '../types/BlogPost';

interface Props {
    post: BlogPost;
    onClose: () => void;
}

const colorMap = {
    'draft': {
        accentLight: 'bg-slate-500/20',
        accentText: 'text-slate-400',
        accentBorder: 'border-slate-500/30',
    },
    'published': {
        accentLight: 'bg-emerald-500/20',
        accentText: 'text-emerald-400',
        accentBorder: 'border-emerald-500/30',
    },
};

const tagColors = [
    'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    'bg-rose-500/10 border-rose-500/30 text-rose-200',
    'bg-amber-500/10 border-amber-500/30 text-amber-200',
    'bg-cyan-500/10 border-cyan-500/30 text-cyan-200',
];

// Simple markdown-to-JSX renderer for blog content
const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    // Helper to render inline markdown (bold, italic, links)
    const renderInline = (text: string): React.ReactNode => {
        // Handle inline bold **text** and italic *text*
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let key = 0;

        // Process bold and italic
        const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(remaining)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push(remaining.slice(lastIndex, match.index));
            }

            if (match[2]) {
                // Bold
                parts.push(<strong key={key++} className="font-semibold text-white">{match[2]}</strong>);
            } else if (match[3]) {
                // Italic
                parts.push(<em key={key++} className="italic text-white/90">{match[3]}</em>);
            }

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < remaining.length) {
            parts.push(remaining.slice(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    while (i < lines.length) {
        const line = lines[i];

        // Horizontal rule
        if (line.trim() === '---') {
            elements.push(
                <hr key={i} className="border-white/10 my-10" />
            );
        }
        // Image with optional caption on next line
        else if (line.match(/^!\[.*\]\(.*\)$/)) {
            const match = line.match(/^!\[(.*)\]\((.*)\)$/);
            if (match) {
                const alt = match[1];
                const src = match[2];
                // Check if next line is a caption (starts with *)
                const nextLine = lines[i + 1];
                let caption = '';
                if (nextLine && nextLine.startsWith('*') && nextLine.endsWith('*')) {
                    caption = nextLine.slice(1, -1);
                    i++; // Skip the caption line
                }
                elements.push(
                    <figure key={i} className="my-8">
                        <img
                            src={src}
                            alt={alt}
                            className="w-full rounded-xl shadow-lg"
                        />
                        {caption && (
                            <figcaption className="text-center text-white/50 text-sm mt-3 italic">
                                {caption}
                            </figcaption>
                        )}
                    </figure>
                );
            }
        }
        // Blockquote
        else if (line.startsWith('> ')) {
            elements.push(
                <blockquote key={i} className="border-l-4 border-indigo-500/50 pl-6 py-2 my-6 text-white/80 italic text-lg">
                    {renderInline(line.slice(2))}
                </blockquote>
            );
        }
        // Heading 3
        else if (line.startsWith('### ')) {
            elements.push(
                <h3 key={i} className="text-xl font-bold text-white mt-8 mb-4">
                    {renderInline(line.slice(4))}
                </h3>
            );
        }
        // Heading 2
        else if (line.startsWith('## ')) {
            elements.push(
                <h2 key={i} className="text-2xl font-bold text-white mt-10 mb-4">
                    {renderInline(line.slice(3))}
                </h2>
            );
        }
        // Heading 1
        else if (line.startsWith('# ')) {
            elements.push(
                <h1 key={i} className="text-3xl font-bold text-white mt-12 mb-6">
                    {renderInline(line.slice(2))}
                </h1>
            );
        }
        // List item
        else if (line.startsWith('- ')) {
            elements.push(
                <li key={i} className="text-white/70 text-base leading-relaxed ml-4 mb-2">
                    {renderInline(line.slice(2))}
                </li>
            );
        }
        // Bold paragraph (starts and ends with **)
        else if (line.startsWith('**') && line.endsWith('**')) {
            elements.push(
                <p key={i} className="text-lg text-white font-semibold leading-relaxed my-6 border-l-4 border-indigo-500/50 pl-4">
                    {line.slice(2, -2)}
                </p>
            );
        }
        // Italic line (starts and ends with *)
        else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
            elements.push(
                <p key={i} className="text-white/60 text-base italic leading-relaxed mb-4">
                    {line.slice(1, -1)}
                </p>
            );
        }
        // Regular paragraph
        else if (line.trim()) {
            elements.push(
                <p key={i} className="text-white/70 text-base leading-relaxed mb-4">
                    {renderInline(line)}
                </p>
            );
        }
        // Empty line (spacing) - skip

        i++;
    }

    return elements;
};


const BlogDetail: React.FC<Props> = ({ post, onClose }) => {
    const colors = colorMap[post.status === 'Draft' ? 'draft' : 'published'];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    // History Management for Browser Back Button
    React.useEffect(() => {
        window.history.pushState({ modal: 'blog' }, '', window.location.href);

        const handlePopState = () => {
            onClose();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose]);

    const handleManualClose = () => {
        window.history.back();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-hidden"
            onClick={handleManualClose}
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-30%] left-[-20%] w-[70%] h-[70%] ${colors.accentLight} blur-[150px] rounded-full opacity-40`} />
                <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full" />
            </div>

            {/* Close Button */}
            {ReactDOM.createPortal(
                <button
                    onClick={(e) => { e.stopPropagation(); handleManualClose(); }}
                    className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 shadow-2xl"
                >
                    <X size={20} strokeWidth={2.5} />
                    <span className="text-sm">Close</span>
                </button>,
                document.body
            )}

            {/* Main Content */}
            <div className="relative z-10 h-full overflow-y-auto">
                <article
                    className="max-w-3xl mx-auto px-6 md:px-12 pt-24 md:pt-32 pb-16"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Back Link */}
                    <button
                        onClick={handleManualClose}
                        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to Writings
                    </button>

                    {/* Header */}
                    <header className="mb-12">
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-full ${colors.accentLight} ${colors.accentText} border ${colors.accentBorder} w-fit mb-6`}>
                            <BookOpen size={16} />
                            {post.type || post.status}
                        </span>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                            {post.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-white/50 text-sm mb-6">
                            <span className="flex items-center gap-2">
                                <Calendar size={14} />
                                {formatDate(post.date)}
                            </span>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border ${tagColors[i % tagColors.length]}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </header>

                    {/* Hero Image */}
                    {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden shadow-2xl mb-12">
                            <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-invert max-w-none">
                        {renderMarkdown(post.content)}
                    </div>

                    {/* Bottom padding */}
                    <div className="h-16" />
                </article>
            </div>
        </motion.div>
    );
};

export default BlogDetail;
