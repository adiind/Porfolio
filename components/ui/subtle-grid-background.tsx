"use client"

import type React from "react"
import { motion } from "framer-motion"

interface SubtleGridBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Additional CSS classes */
    className?: string;
    /** Grid line color - use rgba for transparency */
    gridColor?: string;
    /** Size of grid cells in pixels */
    gridSize?: number;
    /** Whether to show the radial gradient glow */
    showGlow?: boolean;
    /** Glow color */
    glowColor?: string;
}

/**
 * A lightweight, CSS-only grid background with optional animated glow.
 * Uses CSS gradients instead of canvas - no per-frame calculations.
 * GPU-accelerated and performant.
 */
export function SubtleGridBackground({
    className,
    gridColor = "rgba(255,255,255,0.03)",
    gridSize = 40,
    showGlow = true,
    glowColor = "rgba(99,102,241,0.15)",
    ...props
}: SubtleGridBackgroundProps) {
    return (
        <div
            className={`absolute inset-0 overflow-hidden ${className}`}
            {...props}
        >
            {/* CSS Grid Pattern - pure CSS, no JS */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                }}
            />

            {/* Subtle animated glow orbs - CSS animation, GPU accelerated */}
            {showGlow && (
                <>
                    {/* Primary glow - slow drift */}
                    <motion.div
                        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
                        style={{
                            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                            left: '20%',
                            top: '30%',
                        }}
                        animate={{
                            x: [0, 50, 0, -30, 0],
                            y: [0, -30, 20, 0, 0],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Secondary glow - different pace */}
                    <motion.div
                        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
                        style={{
                            background: `radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)`,
                            right: '10%',
                            bottom: '20%',
                        }}
                        animate={{
                            x: [0, -40, 20, 0],
                            y: [0, 20, -40, 0],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Accent glow - amber/gold */}
                    <motion.div
                        className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-15"
                        style={{
                            background: `radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)`,
                            left: '60%',
                            top: '60%',
                        }}
                        animate={{
                            x: [0, 30, -20, 0],
                            y: [0, -20, 30, 0],
                        }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </>
            )}

            {/* Noise texture overlay for depth */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Vignette effect */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                }}
            />
        </div>
    )
}

export default SubtleGridBackground
