import React from 'react';
import { ArrowUpRight, GitCommit, Github } from 'lucide-react';
import GlassSurface from './ui/GlassSurface';

declare const __PORTFOLIO_COMMIT_COUNT__: number | null;
declare const __PORTFOLIO_GIT_ACTIVITY__: GitActivityDay[] | null;
declare const __PORTFOLIO_REVISION__: string | null;

interface GitHubActivityProps {
    variant?: 'full' | 'compact' | 'inline';
}

type GitActivityDay = {
    date: string;
    count: number;
};

const REPO_URL = 'https://github.com/adiind/Porfolio';
const commitCount = typeof __PORTFOLIO_COMMIT_COUNT__ === 'number'
    ? __PORTFOLIO_COMMIT_COUNT__
    : null;
const gitActivity = Array.isArray(__PORTFOLIO_GIT_ACTIVITY__)
    ? __PORTFOLIO_GIT_ACTIVITY__
    : [];
const portfolioRevision = typeof __PORTFOLIO_REVISION__ === 'string'
    ? __PORTFOLIO_REVISION__
    : null;

const revisionCopy = commitCount === null
    ? 'View source history'
    : `${commitCount} commits in this revision`;

const ToolMarks: React.FC<{ inline?: boolean; className?: string }> = ({ inline = false, className = '' }) => (
    <div
        data-tool-marks
        role="group"
        aria-label="Built with Google Antigravity, OpenAI Codex, and Anthropic Claude"
        className={`${inline ? 'flex items-center gap-1' : 'flex items-center gap-3 px-1 sm:gap-4 sm:px-2'} ${className}`}
    >
        <img
            data-tool-mark
            src="/images/antigravity_mark.png"
            alt=""
            title="Google Antigravity"
            className={`${inline ? 'h-3.5 w-3.5' : 'h-6 w-6 sm:h-8 sm:w-8'} object-contain drop-shadow-[0_7px_12px_rgba(0,0,0,0.5)]`}
        />
        <img
            data-tool-mark
            src="/images/tool-marks/codex.svg"
            alt=""
            title="OpenAI Codex"
            className={`${inline ? 'h-3.5 w-3.5' : 'h-6 w-6 sm:h-8 sm:w-8'} object-contain drop-shadow-[0_7px_12px_rgba(0,0,0,0.5)]`}
        />
        <img
            data-tool-mark
            src="/images/tool-marks/claude.svg"
            alt=""
            title="Anthropic Claude"
            className={`${inline ? 'h-3.5 w-3.5' : 'h-6 w-6 sm:h-8 sm:w-8'} object-contain drop-shadow-[0_7px_12px_rgba(0,0,0,0.5)]`}
        />
    </div>
);

const ContributionChart = () => {
    const visibleTotal = gitActivity.reduce((sum, day) => sum + day.count, 0);
    const activeDays = gitActivity.filter((day) => day.count > 0).length;
    const maxCount = Math.max(1, ...gitActivity.map((day) => day.count));
    const endingDate = gitActivity.at(-1)?.date;
    const summary = gitActivity.length === 0
        ? 'Contribution history is unavailable in this build.'
        : `${visibleTotal} commits across ${activeDays} active days in the 12-week history ending ${endingDate}.`;

    return (
        <div
            data-contribution-chart
            role="img"
            aria-label={summary}
            className="grid w-fit grid-flow-col grid-rows-7 gap-[2px]"
        >
            {gitActivity.map((day) => {
                const level = day.count === 0 ? 0 : Math.max(1, Math.ceil((day.count / maxCount) * 4));
                const tone = level === 0
                    ? 'bg-white/[0.08]'
                    : level === 1
                        ? 'bg-[#E5E55A]/30'
                        : level === 2
                            ? 'bg-[#E5E55A]/50'
                            : level === 3
                                ? 'bg-[#E5E55A]/75'
                                : 'bg-[#F0F570]';
                return (
                    <span
                        key={day.date}
                        data-contribution-cell
                        data-active={day.count > 0 ? 'true' : 'false'}
                        className={`h-[7px] w-[7px] rounded-[2px] ${tone}`}
                        aria-hidden="true"
                        title={`${day.date}: ${day.count} commit${day.count === 1 ? '' : 's'}`}
                    />
                );
            })}
        </div>
    );
};

const GitHubEvidence: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
    <GlassSurface
        as="article"
        strength="strong"
        blur="strong"
        data-github-evidence
        data-built-revision={portfolioRevision ?? 'unavailable'}
        className="w-full rounded-2xl px-3 py-2.5 text-left lg:px-4 lg:py-3.5"
    >
        <div className="grid grid-cols-[48px_1fr] items-end gap-1 lg:block">
            <div className="flex items-start gap-2.5">
                <span className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E55A]/35 bg-[#E5E55A]/10 text-[#F0F570] lg:flex">
                    <Github size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <span className="block text-[8px] font-medium uppercase leading-tight tracking-[0.12em] text-white/65 lg:text-[10px] lg:tracking-[0.16em]">
                        Portfolio source history
                    </span>
                    <div className="mt-1 flex flex-col items-start lg:mt-0.5 lg:flex-row lg:items-baseline lg:gap-1.5">
                        <strong data-exact-commit-count className="text-2xl font-semibold leading-none text-white lg:text-3xl">
                            {commitCount ?? '—'}
                        </strong>
                        <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/62 lg:text-xs lg:tracking-[0.12em]">
                            {commitCount === null ? 'count unavailable' : 'commits'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="border-l border-white/10 pl-2 lg:mt-2.5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[8px] font-medium uppercase tracking-[0.12em] text-white/58 lg:text-[9px] lg:tracking-[0.14em]">
                    <span className="sr-only lg:not-sr-only">Contribution history</span>
                    {compact && <ToolMarks inline className="ml-auto lg:hidden" />}
                    <span className={compact ? 'sr-only lg:not-sr-only' : undefined}>12 weeks</span>
                </div>
                <ContributionChart />
            </div>
        </div>

        <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-white/10 pt-2 text-[9px] font-medium text-white/74 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A] lg:text-xs"
        >
            <span>See how this portfolio was built</span>
            <ArrowUpRight size={14} className="shrink-0 text-[#F0F570] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
    </GlassSurface>
);

const GitHubActivity: React.FC<GitHubActivityProps> = ({ variant = 'full' }) => {
    if (variant === 'inline') {
        return (
            <GlassSurface
                as="a"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                strength="balanced"
                blur="medium"
                className="group inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-white/88 transition-colors hover:border-[#E5E55A]/45"
            >
                <GitCommit size={14} className="text-[#E5E55A]" aria-hidden="true" />
                <span>{revisionCopy}</span>
                <ArrowUpRight size={13} className="text-white/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </GlassSurface>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="flex w-[190px] flex-col items-start gap-2 pointer-events-auto lg:w-[310px] lg:gap-3">
                <ToolMarks className="hidden lg:flex" />
                <GitHubEvidence compact />
            </div>
        );
    }

    return (
        <section id="github" className="relative mx-auto w-full max-w-xl px-6 py-12 md:py-20">
            <div className="flex flex-col items-start gap-4">
                <ToolMarks />
                <GitHubEvidence />
            </div>
        </section>
    );
};

export default GitHubActivity;
