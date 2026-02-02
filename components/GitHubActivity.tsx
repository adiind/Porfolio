import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, Calendar, ExternalLink, Github, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CommitData {
    sha: string;
    message: string;
    date: string;
    url: string;
}

interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface GitHubStats {
    totalCommits: number;
    recentCommits: CommitData[];
    contributions: ContributionDay[];
    loading: boolean;
    error: string | null;
}

const REPO_OWNER = 'adiind';
const REPO_NAME = 'Porfolio';

const GitHubActivity: React.FC = () => {
    const [stats, setStats] = useState<GitHubStats>({
        totalCommits: 0,
        recentCommits: [],
        contributions: [],
        loading: true,
        error: null,
    });
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

    useEffect(() => {
        const fetchGitHubData = async () => {
            try {
                const commitsResponse = await fetch(
                    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=100`
                );

                if (!commitsResponse.ok) {
                    throw new Error('Failed to fetch commits');
                }

                const commits = await commitsResponse.json();

                const recentCommits: CommitData[] = commits.slice(0, 5).map((commit: any) => ({
                    sha: commit.sha.slice(0, 7),
                    message: commit.commit.message.split('\n')[0].slice(0, 60) + (commit.commit.message.length > 60 ? '...' : ''),
                    date: commit.commit.author.date,
                    url: commit.html_url,
                }));

                const contributions = buildContributionCalendar(commits);

                setStats({
                    totalCommits: commits.length,
                    recentCommits,
                    contributions,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setStats(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Could not load GitHub data',
                }));
            }
        };

        fetchGitHubData();
    }, []);

    const buildContributionCalendar = (commits: any[]): ContributionDay[] => {
        const today = new Date();
        const weeksToShow = 12;
        const dayMs = 24 * 60 * 60 * 1000;

        const dateMap: Record<string, number> = {};
        const startDate = new Date(today.getTime() - (weeksToShow * 7 * dayMs));

        commits.forEach((commit: any) => {
            const date = new Date(commit.commit.author.date);
            const dateStr = date.toISOString().split('T')[0];
            dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
        });

        const calendar: ContributionDay[] = [];
        for (let i = 0; i < weeksToShow * 7; i++) {
            const date = new Date(startDate.getTime() + (i * dayMs));
            const dateStr = date.toISOString().split('T')[0];
            const count = dateMap[dateStr] || 0;

            let level: 0 | 1 | 2 | 3 | 4 = 0;
            if (count >= 5) level = 4;
            else if (count >= 3) level = 3;
            else if (count >= 2) level = 2;
            else if (count >= 1) level = 1;

            calendar.push({ date: dateStr, count, level });
        }

        return calendar;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    const formatFullDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getLevelColor = (level: 0 | 1 | 2 | 3 | 4) => {
        const colors = {
            0: 'bg-white/5',
            1: 'bg-emerald-500/30',
            2: 'bg-emerald-500/50',
            3: 'bg-emerald-500/70',
            4: 'bg-emerald-500',
        };
        return colors[level];
    };

    // Get last 4 weeks for mini preview
    const miniWeeks: ContributionDay[][] = [];
    const last28Days = stats.contributions.slice(-28);
    for (let i = 0; i < last28Days.length; i += 7) {
        miniWeeks.push(last28Days.slice(i, i + 7));
    }

    // Full calendar weeks
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < stats.contributions.length; i += 7) {
        weeks.push(stats.contributions.slice(i, i + 7));
    }

    if (stats.loading || stats.error) {
        return null; // Don't show widget while loading or on error
    }

    return (
        <>
            {/* Fixed Left Corner Widget */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                onClick={() => setIsOpen(true)}
                className="fixed left-4 bottom-4 z-50 group cursor-pointer"
            >
                <div className="bg-black/80 backdrop-blur-lg border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all duration-300 hover:bg-black/90 shadow-lg shadow-black/50">
                    {/* Mini header */}
                    <div className="flex items-center gap-2 mb-2">
                        <Github size={14} className="text-white/50 group-hover:text-white/70 transition-colors" />
                        <span className="text-[10px] uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">Built in Public</span>
                    </div>

                    {/* Commit count */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold text-white">{stats.totalCommits}+</span>
                        <span className="text-[10px] text-white/40">commits</span>
                    </div>

                    {/* Mini Calendar (last 4 weeks only) */}
                    <div className="flex gap-[2px]">
                        {miniWeeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[2px]">
                                {week.map((day) => (
                                    <div
                                        key={day.date}
                                        className={`w-[6px] h-[6px] rounded-[1px] ${getLevelColor(day.level)}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.button>

            {/* Full Details Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setIsOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.3 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-b from-neutral-900 to-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                                                <Github size={20} className="text-white/60" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Built in Public</h3>
                                                <p className="text-xs text-white/40">This portfolio's development</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X size={18} className="text-white/60" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="p-6">
                                    {/* Commit count */}
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                        <GitCommit size={18} className="text-emerald-400" />
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-white">{stats.totalCommits}+</span>
                                            <span className="text-sm text-white/40">total commits</span>
                                        </div>
                                    </div>

                                    {/* Full Calendar */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar size={14} className="text-emerald-400" />
                                            <span className="text-xs uppercase tracking-wider text-white/40">Last 12 Weeks</span>
                                        </div>

                                        <div className="relative flex gap-[3px] overflow-x-auto pb-2">
                                            {weeks.map((week, weekIndex) => (
                                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                                    {week.map((day) => (
                                                        <div
                                                            key={day.date}
                                                            className={`w-[12px] h-[12px] rounded-[2px] ${getLevelColor(day.level)} cursor-pointer transition-all hover:ring-1 hover:ring-white/30`}
                                                            onMouseEnter={() => setHoveredDay(day)}
                                                            onMouseLeave={() => setHoveredDay(null)}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Hover tooltip */}
                                        <AnimatePresence>
                                            {hoveredDay && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="mt-2 text-xs text-white/60"
                                                >
                                                    <span className="text-white">{formatFullDate(hoveredDay.date)}</span>
                                                    <span className="text-emerald-400 ml-2">{hoveredDay.count} commit{hoveredDay.count !== 1 ? 's' : ''}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Legend */}
                                        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-white/30">
                                            <span>Less</span>
                                            {[0, 1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`w-[10px] h-[10px] rounded-[2px] ${getLevelColor(level as 0 | 1 | 2 | 3 | 4)}`}
                                                />
                                            ))}
                                            <span>More</span>
                                        </div>
                                    </div>

                                    {/* Recent Commits */}
                                    <div>
                                        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-3">Recent Commits</h4>
                                        <div className="space-y-2">
                                            {stats.recentCommits.map((commit) => (
                                                <a
                                                    key={commit.sha}
                                                    href={commit.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-lg transition-all group"
                                                >
                                                    <code className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                        {commit.sha}
                                                    </code>
                                                    <span className="flex-1 text-xs text-white/60 group-hover:text-white/80 truncate transition-colors">
                                                        {commit.message}
                                                    </span>
                                                    <span className="text-[10px] text-white/25 whitespace-nowrap">
                                                        {formatDate(commit.date)}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Link to repo */}
                                    <a
                                        href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-6 flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors py-3 border-t border-white/5"
                                    >
                                        View Full Repository <ExternalLink size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default GitHubActivity;
