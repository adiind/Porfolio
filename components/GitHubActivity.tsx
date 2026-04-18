import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, Calendar, ExternalLink, Github } from 'lucide-react';

interface GitHubActivityProps {
    variant?: 'full' | 'compact' | 'inline';
}

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

const GitHubActivity: React.FC<GitHubActivityProps> = ({ variant = 'full' }) => {
    const [stats, setStats] = useState<GitHubStats>({
        totalCommits: 0,
        recentCommits: [],
        contributions: [],
        loading: true,
        error: null,
    });
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
        const weeksToShow = 52; // Show a full year
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

    // Full calendar weeks
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < stats.contributions.length; i += 7) {
        weeks.push(stats.contributions.slice(i, i + 7));
    }

    if (stats.loading || stats.error) {
        return null;
    }

    // Inline: just two tiny stat chips
    if (variant === 'inline') {
        const lastCommitDate = stats.recentCommits[0]?.date
            ? new Date(stats.recentCommits[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null;
        return (
            <div className="flex flex-wrap gap-2">
                <a
                    href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-full text-xs text-white/70 hover:text-emerald-300 transition-all"
                >
                    <GitCommit size={13} />
                    <span>{stats.totalCommits}+ commits</span>
                </a>
                {lastCommitDate && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">
                        <Calendar size={13} />
                        <span>Last push {lastCommitDate}</span>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <a
                href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-3 w-[280px] pointer-events-auto group/github transition-transform duration-300 hover:-translate-y-1 block"
            >
                {/* Header label */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Github size={12} className="text-white/72" />
                        <span className="text-[9px] uppercase tracking-[0.2em] text-white/72 font-medium">How I built this site</span>
                    </div>
                    <span className="text-[9px] text-white/52 group-hover/github:text-white/72 transition-colors flex items-center gap-1.5">
                        <img src="/images/antigravity_logo.png" alt="Antigravity" className="w-3 h-3 opacity-70 group-hover/github:opacity-95 transition-opacity" />
                        <span>Adi × Antigravity</span>
                    </span>
                </div>
                <div
                    className="flex items-center gap-3 px-4 py-3 bg-white/12 backdrop-blur-md rounded-2xl w-fit transition-colors duration-300"
                    style={{ boxShadow: '0 18px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                >
                    <GitCommit size={18} className="text-emerald-400 group-hover/github:text-emerald-300 transition-colors" />
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white leading-none tracking-tight group-hover/github:text-emerald-300 transition-colors">{stats.totalCommits}+</span>
                        <span className="text-[9px] text-white/72 uppercase tracking-widest mt-0.5">commits to build this site</span>
                    </div>
                </div>

                <div
                    className="bg-black/58 backdrop-blur-md rounded-2xl p-4 transition-colors duration-300 relative overflow-hidden"
                    style={{ boxShadow: '0 22px 54px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.045)' }}
                >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-emerald-500/[0.03] group-hover/github:bg-emerald-500/[0.08] transition-colors duration-300 pointer-events-none" />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-white/78 group-hover/github:text-white transition-colors" />
                            <span className="text-[10px] uppercase tracking-widest text-white/78 font-medium group-hover/github:text-white transition-colors">Build Activity</span>
                        </div>
                        <span className="text-[9px] text-white/52 group-hover/github:text-white/72 transition-colors">View source →</span>
                    </div>

                    <div className="relative w-full overflow-hidden">
                        <div className="flex gap-[2px] justify-end">
                            {weeks.slice(-20).map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[2px]">
                                    {week.map((day) => (
                                        <div
                                            key={day.date}
                                            className={`w-2 h-2 rounded-[2px] ${getLevelColor(day.level)} opacity-95`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </a>
        );
    }

    return (
        <section id="github" className="relative w-full max-w-6xl mx-auto px-6 py-12 md:py-24 border-t border-white/5 mt-6 md:mt-20">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6 }}
            >
                {/* Section Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-3xl md:text-5xl font-bold text-white mb-4 flex items-center gap-4"
                        >
                            <Github size={40} className="text-white/80" />
                            How I Built This
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-white/50 text-lg md:text-xl max-w-2xl"
                        >
                            This portfolio was designed and engineered from scratch. The source code is public, entirely transparent, and actively maintained.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                            <GitCommit size={24} className="text-emerald-400" />
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white leading-none">{stats.totalCommits}+</span>
                                <span className="text-sm text-white/40 uppercase tracking-wider mt-1">Total Commits</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar Span 2 Cols on Desktop */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-emerald-400" />
                                <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Contribution History</span>
                            </div>
                            {/* Legend */}
                            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
                                <span>Less</span>
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`w-3 h-3 rounded-sm ${getLevelColor(level as 0 | 1 | 2 | 3 | 4)}`}
                                    />
                                ))}
                                <span>More</span>
                            </div>
                        </div>

                        {/* Scrollable Container for Mobile */}
                        <div className="relative w-full overflow-x-auto pb-4 no-scrollbar">
                            <div className="flex gap-1 min-w-max">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-1">
                                        {week.map((day) => (
                                            <div
                                                key={day.date}
                                                className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm ${getLevelColor(day.level)} cursor-crosshair transition-all hover:ring-2 hover:ring-white/50 relative group`}
                                                onMouseEnter={() => setHoveredDay(day)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                            >
                                                {/* Tooltip on individual blocks for desktop */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    {formatFullDate(day.date)}: {day.count} commit{day.count !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Mobile active day info */}
                        <div className="mt-4 sm:hidden flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-white/40">
                                <span>Less</span>
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`w-2.5 h-2.5 rounded-sm ${getLevelColor(level as 0 | 1 | 2 | 3 | 4)}`}
                                    />
                                ))}
                                <span>More</span>
                            </div>
                            <div className="text-emerald-400 font-medium min-h-[16px]">
                                {hoveredDay ? `${hoveredDay.count} on ${formatFullDate(hoveredDay.date)}` : 'Hover to see details'}
                            </div>
                        </div>
                    </div>

                    {/* Recent Commits */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col">
                        <h3 className="text-sm uppercase tracking-wider text-white/60 font-medium mb-6">Recent Activity</h3>
                        <div className="flex-1 space-y-4">
                            {stats.recentCommits.map((commit, i) => (
                                <a
                                    key={commit.sha}
                                    href={commit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Timeline line */}
                                        <div className="flex flex-col items-center mt-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-colors" />
                                            {i !== stats.recentCommits.length - 1 && (
                                                <div className="w-px h-10 bg-white/10 mt-1" />
                                            )}
                                        </div>

                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <code className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    {commit.sha}
                                                </code>
                                                <span className="text-xs text-white/30 whitespace-nowrap">
                                                    {formatDate(commit.date)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-white/70 group-hover:text-white line-clamp-2 transition-colors">
                                                {commit.message}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* View Source Button */}
                <div className="mt-12 flex justify-center">
                    <a
                        href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-white/90 text-black rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                    >
                        <Github size={20} />
                        <span>View Source on GitHub</span>
                        <ExternalLink size={16} className="text-black/50 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </a>
                </div>
            </motion.div>
        </section>
    );
};

export default GitHubActivity;
