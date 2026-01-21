"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Link, Zap, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
    id: number;
    title: string;
    date: string;
    content: string;
    category: string;
    icon: React.ElementType;
    relatedIds: number[];
    status: "completed" | "in-progress" | "pending";
    energy: number;
}

interface RadialOrbitalTimelineProps {
    timelineData: TimelineItem[];
    children?: React.ReactNode;
    activeNodeId?: number | null;
    onActiveNodeChange?: (nodeId: number | null) => void;
    isExpanded?: boolean;
}

export default function RadialOrbitalTimeline({
    timelineData,
    children,
    activeNodeId: controlledActiveNodeId,
    onActiveNodeChange,
    isExpanded: orbitExpanded = false,
}: RadialOrbitalTimelineProps) {
    const [internalActiveNodeId, setInternalActiveNodeId] = useState<number | null>(null);

    // Use controlled state if provided, otherwise internal
    const activeNodeId = controlledActiveNodeId !== undefined ? controlledActiveNodeId : internalActiveNodeId;

    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
    const [rotationAngle, setRotationAngle] = useState<number>(0);
    const [autoRotate, setAutoRotate] = useState<boolean>(true);
    const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
    const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
    const [centerOffset] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

    // Sync expandedItems with activeNodeId
    useEffect(() => {
        if (activeNodeId === null) {
            setExpandedItems({});
            setAutoRotate(true);
            setPulseEffect({});
        } else {
            setExpandedItems({ [activeNodeId]: true });
            setAutoRotate(false);
            // Trigger pulse for related
            const related = getRelatedItems(activeNodeId);
            const newPulse: Record<number, boolean> = {};
            related.forEach(id => newPulse[id] = true);
            setPulseEffect(newPulse);

            centerViewOnNode(activeNodeId);
        }
    }, [activeNodeId]);

    const containerRef = useRef<HTMLDivElement>(null);
    const orbitRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === containerRef.current || e.target === orbitRef.current) {
            handleNodeSelect(null);
        }
    };

    const handleNodeSelect = (id: number | null) => {
        if (controlledActiveNodeId !== undefined) {
            onActiveNodeChange?.(id);
        } else {
            setInternalActiveNodeId(id);
            onActiveNodeChange?.(id);
        }
    };

    const toggleItem = (id: number) => {
        if (activeNodeId === id) {
            handleNodeSelect(null);
        } else {
            handleNodeSelect(id);
        }
    };

    useEffect(() => {
        let rotationTimer: NodeJS.Timeout;

        if (autoRotate) {
            rotationTimer = setInterval(() => {
                setRotationAngle((prev) => {
                    const newAngle = (prev + 0.3) % 360;
                    return Number(newAngle.toFixed(3));
                });
            }, 50);
        }

        return () => {
            if (rotationTimer) {
                clearInterval(rotationTimer);
            }
        };
    }, [autoRotate]);

    // Removed redundant useEffect for onActiveNodeChange since we call it directly

    const centerViewOnNode = (nodeId: number) => {
        if (!nodeRefs.current[nodeId]) return;

        const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
        const totalNodes = timelineData.length;
        const targetAngle = (nodeIndex / totalNodes) * 360;

        setRotationAngle(270 - targetAngle);
    };

    const calculateNodePosition = (index: number, total: number, nodeId?: number) => {
        const angle = ((index / total) * 360 + rotationAngle) % 360;
        const baseRadius = orbitExpanded ? 240 : 180;
        // If this node is hovered, push it outward
        const radius = nodeId !== undefined && hoveredNodeId === nodeId ? baseRadius + 50 : baseRadius;
        const radian = (angle * Math.PI) / 180;

        const x = radius * Math.cos(radian) + centerOffset.x;
        const y = radius * Math.sin(radian) + centerOffset.y;

        const zIndex = Math.round(100 + 50 * Math.cos(radian));
        const opacity = Math.max(
            0.4,
            Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
        );

        return { x, y, angle, zIndex, opacity };
    };

    const getRelatedItems = (itemId: number): number[] => {
        const currentItem = timelineData.find((item) => item.id === itemId);
        return currentItem ? currentItem.relatedIds : [];
    };

    const isRelatedToActive = (itemId: number): boolean => {
        if (!activeNodeId) return false;
        const relatedItems = getRelatedItems(activeNodeId);
        return relatedItems.includes(itemId);
    };

    const getStatusStyles = (status: TimelineItem["status"]): string => {
        switch (status) {
            case "completed":
                return "text-white bg-black border-white";
            case "in-progress":
                return "text-black bg-white border-black";
            case "pending":
                return "text-white bg-black/40 border-white/50";
            default:
                return "text-white bg-black/40 border-white/50";
        }
    };

    return (
        <div
            className="relative w-full h-full flex items-center justify-center"
            ref={containerRef}
            onClick={handleContainerClick}
        >
            <div
                className="absolute w-full h-full flex items-center justify-center"
                ref={orbitRef}
                style={{
                    perspective: "1000px",
                    transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
                }}
            >
                {/* Orbit ring */}
                <motion.div
                    className="absolute rounded-full border border-white/10 pointer-events-none"
                    initial={false}
                    animate={{
                        width: orbitExpanded ? 480 : 360,
                        height: orbitExpanded ? 480 : 360
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {/* Second orbit ring for depth */}
                <motion.div
                    className="absolute rounded-full border border-white/5 pointer-events-none"
                    initial={false}
                    animate={{
                        width: orbitExpanded ? 500 : 380,
                        height: orbitExpanded ? 500 : 380
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {/* Orbital nodes */}
                {timelineData.map((item, index) => {
                    const position = calculateNodePosition(index, timelineData.length, item.id);
                    const isExpanded = expandedItems[item.id];
                    const isRelated = isRelatedToActive(item.id);
                    const isPulsing = pulseEffect[item.id];
                    const isHovered = hoveredNodeId === item.id;
                    const Icon = item.icon;

                    const nodeStyle = {
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        zIndex: isExpanded ? 1000 : isHovered ? 500 : 100 + position.zIndex,
                        opacity: isExpanded || isHovered ? 1 : position.opacity,
                    };

                    return (
                        <motion.div
                            key={item.id}
                            ref={(el) => {
                                if (el) nodeRefs.current[item.id] = el;
                            }}
                            className="absolute cursor-pointer pointer-events-auto"
                            initial={{ x: position.x, y: position.y }}
                            animate={{
                                x: position.x,
                                y: position.y,
                                zIndex: isExpanded ? 1000 : isHovered ? 500 : 100 + position.zIndex,
                                opacity: isExpanded || isHovered ? 1 : position.opacity
                            }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(item.id);
                            }}
                            onMouseEnter={() => setHoveredNodeId(item.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                        >
                            {/* Glow effect - enhanced on hover */}
                            <div
                                className={`absolute rounded-full transition-all duration-300 ${isPulsing ? "animate-pulse" : ""}`}
                                style={{
                                    background: isHovered
                                        ? `radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(147,51,234,0.2) 50%, rgba(255,255,255,0) 70%)`
                                        : `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                                    width: isHovered ? `${item.energy * 0.8 + 60}px` : `${item.energy * 0.5 + 40}px`,
                                    height: isHovered ? `${item.energy * 0.8 + 60}px` : `${item.energy * 0.5 + 40}px`,
                                    left: isHovered ? `-${(item.energy * 0.8 + 60 - 40) / 2}px` : `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                                    top: isHovered ? `-${(item.energy * 0.8 + 60 - 40) / 2}px` : `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                                }}
                            ></div>

                            <div
                                className={`
                                    rounded-full flex items-center justify-center
                                    ${isExpanded
                                        ? "w-16 h-16 bg-white text-black"
                                        : isHovered
                                            ? "w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                                            : isRelated
                                                ? "w-10 h-10 bg-white/50 text-black"
                                                : "w-10 h-10 bg-black text-white"
                                    }
                                    border-2 
                                    ${isExpanded
                                        ? "border-white shadow-lg shadow-white/30"
                                        : isHovered
                                            ? "border-white shadow-xl shadow-purple-500/40"
                                            : isRelated
                                                ? "border-white animate-pulse"
                                                : "border-white/40 hover:border-white/80"
                                    }
                                    transition-all duration-300 transform
                                `}
                            >
                                <Icon size={isExpanded ? 24 : isHovered ? 20 : 16} />
                            </div>

                            <div
                                className={`
                                    absolute left-1/2 -translate-x-1/2 whitespace-nowrap
                                    font-semibold tracking-wider
                                    transition-all duration-300
                                    ${isExpanded
                                        ? "top-20 text-sm text-white"
                                        : isHovered
                                            ? "top-16 text-sm text-white"
                                            : "top-12 text-xs text-white/70"}
                                `}
                            >
                                {item.title}
                            </div>

                            {/* Card removed from here */}
                        </motion.div>
                    );
                })}
            </div>

            {/* Center content (children - profile image) */}
            <div className={`relative transition-all duration-300 ${activeNodeId ? 'z-0' : 'z-10'}`}>
                {children}
            </div>

            {/* Top Center Expanded Card */}
            {/* Top Center Expanded Card Removed - Rendered by Parent */}
        </div>
    );
}
