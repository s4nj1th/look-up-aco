import React, { useMemo } from "react";
import type { SimStatus } from "../types";

interface StatsPanelProps {
    status: SimStatus;
    iteration: number;
    nodeCount: number;
    edgeCount: number;
    numAnts: number;
    bestPath: number[];
    bestPathDistance: number;
    pheromones: Record<string, number>;
    dark: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
    status,
    iteration,
    nodeCount,
    edgeCount,
    numAnts,
    bestPath,
    bestPathDistance,
    pheromones,
    dark,
}) => {
    const dim = dark ? "#666" : "#999";
    const bd = dark ? "#222" : "#e8e8e8";
    const fg = dark ? "#eee" : "#111";
    const bg2 = dark ? "#1a1a1a" : "#f7f7f7";

    const topEdges = useMemo(
        () =>
            Object.entries(pheromones)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10),
        [pheromones],
    );
    const maxP = topEdges.length > 0 ? topEdges[0][1] : 1;

    const statusLabel = { idle: "idle", running: "running", paused: "paused" }[
        status
    ];

    const row = (label: string, value: string | number) => (
        <div
            key={label}
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "5px 0",
                borderBottom: `1px solid ${bd}`,
            }}
        >
            <span
                style={{
                    fontSize: "10px",
                    color: dim,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: fg,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </span>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: dim,
                    }}
                >
                    Stats
                </span>
                <span style={{ fontSize: "10px", color: dim }}>
                    {statusLabel}
                </span>
            </div>

            {/* Core stats */}
            <div>
                {row("Iteration", iteration)}
                {row("Nodes", nodeCount)}
                {row("Edges", edgeCount)}
                {row("Ants", numAnts)}
            </div>

            {/* Best path */}
            <div>
                <div
                    style={{
                        fontSize: "10px",
                        color: dim,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "6px",
                    }}
                >
                    Best Path
                </div>
                <div
                    style={{
                        background: bg2,
                        border: `1px solid ${bd}`,
                        borderRadius: "6px",
                        padding: "8px 10px",
                    }}
                >
                    {bestPath.length > 0 ? (
                        <>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: fg,
                                    wordBreak: "break-all",
                                    lineHeight: 1.7,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {bestPath.join(" → ")}
                            </div>
                            <div
                                style={{
                                    marginTop: "6px",
                                    fontSize: "10px",
                                    color: dim,
                                }}
                            >
                                {bestPathDistance.toFixed(1)} px &middot;{" "}
                                {bestPath.length - 1} hops
                            </div>
                        </>
                    ) : (
                        <span style={{ fontSize: "11px", color: dim }}>—</span>
                    )}
                </div>
            </div>

            {/* Pheromone table */}
            {topEdges.length > 0 && (
                <div>
                    <div
                        style={{
                            fontSize: "10px",
                            color: dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: "6px",
                        }}
                    >
                        Pheromones
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                        }}
                    >
                        {topEdges.map(([key, val]) => {
                            const pct = maxP > 0 ? (val / maxP) * 100 : 0;
                            const [a, b] = key.split("-");
                            return (
                                <div
                                    key={key}
                                    style={{
                                        position: "relative",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                        background: bg2,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: `${pct}%`,
                                            background: dark
                                                ? "rgba(255,255,255,0.1)"
                                                : "rgba(0,0,0,0.07)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "relative",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            padding: "3px 7px",
                                            fontSize: "10px",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        <span style={{ color: dim }}>
                                            {a} → {b}
                                        </span>
                                        <span
                                            style={{
                                                color: fg,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {val.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsPanel;
