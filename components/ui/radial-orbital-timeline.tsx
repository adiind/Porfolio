"use client";
import React, { useState, useEffect, useRef } from "react";
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
}

export default function RadialOrbitalTimeline({
    timelineData,
    children,
    activeNodeId: controlledActiveNodeId,
    onActiveNodeChange,
}: RadialOrbitalTimelineProps) {
    const [internalActiveNodeId, setInternalActiveNodeId] = useState<number | null>(null);

    // Use controlled state if provided, otherwise internal
    const activeNodeId = controlledActiveNodeId !== undefined ? controlledActiveNodeId : internalActiveNodeId;

    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
    const [rotationAngle, setRotationAngle] = useState<number>(0);
    const [autoRotate, setAutoRotate] = useState<boolean>(true);
    const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
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

    const calculateNodePosition = (index: number, total: number) => {
        const angle = ((index / total) * 360 + rotationAngle) % 360;
        const radius = 180;
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
                <div className="absolute w-[360px] h-[360px] rounded-full border border-white/10 pointer-events-none"></div>

                {/* Second orbit ring for depth */}
                <div className="absolute w-[380px] h-[380px] rounded-full border border-white/5 pointer-events-none"></div>

                {/* Orbital nodes */}
                {timelineData.map((item, index) => {
                    const position = calculateNodePosition(index, timelineData.length);
                    const isExpanded = expandedItems[item.id];
                    const isRelated = isRelatedToActive(item.id);
                    const isPulsing = pulseEffect[item.id];
                    const Icon = item.icon;

                    const nodeStyle = {
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        zIndex: isExpanded ? 1000 : 100 + position.zIndex, // Ensure high z-index
                        opacity: isExpanded ? 1 : position.opacity,
                    };

                    return (
                        <div
                            key={item.id}
                            ref={(el) => (nodeRefs.current[item.id] = el)}
                            className="absolute transition-all duration-700 cursor-pointer pointer-events-auto"
                            style={nodeStyle}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(item.id);
                            }}
                        >
                            <div
                                className={`absolute rounded-full -inset-1 ${isPulsing ? "animate-pulse duration-1000" : ""
                                    }`}
                                style={{
                                    background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                                    width: `${item.energy * 0.5 + 40}px`,
                                    height: `${item.energy * 0.5 + 40}px`,
                                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                                }}
                            ></div>

                            <div
                                className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isExpanded
                                        ? "bg-white text-black"
                                        : isRelated
                                            ? "bg-white/50 text-black"
                                            : "bg-black text-white"
                                    }
                border-2 
                ${isExpanded
                                        ? "border-white shadow-lg shadow-white/30"
                                        : isRelated
                                            ? "border-white animate-pulse"
                                            : "border-white/40"
                                    }
                transition-all duration-300 transform
                ${isExpanded ? "scale-150" : "hover:scale-110"}
              `}
                            >
                                <Icon size={16} />
                            </div>

                            <div
                                className={`
                absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                text-xs font-semibold tracking-wider
                transition-all duration-300
                ${isExpanded ? "text-white scale-125" : "text-white/70"}
              `}
                            >
                                {item.title}
                            </div>

                            {/* Card removed from here */}
                        </div>
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
