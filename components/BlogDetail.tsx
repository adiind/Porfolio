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

    while (i < lines.length) {
        const line = lines[i];

        // Heading 3
        if (line.startsWith('### ')) {
            elements.push(
                <h3 key={i} className="text-xl font-bold text-white mt-8 mb-4">
                    {line.slice(4)}
                </h3>
            );
        }
        // Heading 2
        else if (line.startsWith('## ')) {
            elements.push(
                <h2 key={i} className="text-2xl font-bold text-white mt-10 mb-4">
                    {line.slice(3)}
                </h2>
            );
        }
        // List item
        else if (line.startsWith('- ')) {
            elements.push(
                <li key={i} className="text-white/70 text-base leading-relaxed ml-4">
                    {line.slice(2)}
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
        // Regular paragraph
        else if (line.trim()) {
            // Handle inline bold and italic
            const formattedLine = line
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>');

            elements.push(
                <p
                    key={i}
                    className="text-white/70 text-base leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        }
        // Empty line (spacing)
        else if (line.trim() === '') {
            // Skip empty lines, spacing handled by margins
        }

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
