import { useRef, useState } from "react";
import { Sun, Moon } from "lucide-react";

import { useTheme } from "./hooks/useTheme";
import { useGraph } from "./hooks/useGraph";
import { useACO } from "./hooks/useACO";
import { useCanvas } from "./hooks/useCanvas";

import Toolbar from "./components/Toolbar";
import Controls from "./components/Controls";
import StatsPanel from "./components/StatsPanel";
import ParamsPanel, { DEFAULT_PARAMS } from "./components/ParamsPanel";
import MapGenerator from "./components/MapGenerator";

import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import type { Mode, ACOParams } from "./types";

const CURSOR_BY_MODE: Record<Mode, string> = {
    add: "crosshair",
    addEdge: "pointer",
    delete: "pointer",
    selectStart: "pointer",
    selectEnd: "pointer",
};

export default function App() {
    const { theme, toggleTheme } = useTheme();
    const dark = theme === "dark";
    const fg = dark ? "#eee" : "#111";
    const dim = dark ? "#555" : "#bbb";
    const bd = dark ? "#222" : "#e8e8e8";
    const bg = dark ? "#111" : "#fff";

    const {
        nodes,
        edges,
        startNode,
        endNode,
        mode,
        selectedNodeForEdge,
        handleCanvasClick,
        setModeAndClear,
        clearGraph,
        generateMap,
    } = useGraph();

    const [stepSpeed, setStepSpeed] = useState(2);
    const [params, setParams] = useState<ACOParams>({ ...DEFAULT_PARAMS });

    const {
        status,
        ants,
        pheromones,
        bestPath,
        bestPathDistance,
        iteration,
        runACO,
        pause,
        reset,
    } = useACO({ nodes, edges, startNode, endNode, stepSpeed, params });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useCanvas({
        canvasRef,
        nodes,
        edges,
        startNode,
        endNode,
        mode,
        selectedNodeForEdge,
        ants,
        pheromones,
        bestPath,
        theme,
    });

    const isActive = status === "running" || status === "paused";

    return (
        <div
            style={{
                background: bg,
                color: fg,
                minHeight: "100vh",
                overflowX: "hidden",
                fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    padding: "16px 16px 32px",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: "12px",
                        marginBottom: "14px",
                        borderBottom: `1px solid ${bd}`,
                    }}
                >
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            letterSpacing: "-0.2px",
                        }}
                    >
                        ACO Path Finder
                    </span>
                    <button
                        onClick={toggleTheme}
                        title="Toggle theme"
                        style={{
                            display: "flex",
                            padding: "5px",
                            border: `1px solid ${bd}`,
                            borderRadius: "6px",
                            background: "transparent",
                            color: dim,
                            cursor: "pointer",
                        }}
                    >
                        {dark ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                </div>

                {/* Body: left = canvas col, right = stats */}
                <div
                    style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "flex-start",
                    }}
                >
                    {/* ── LEFT COLUMN ── */}
                    <div
                        style={{
                            flex: "1 1 0",
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                        }}
                    >
                        {/* Map generator + Toolbar on one line */}
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                alignItems: "center",
                            }}
                        >
                            <MapGenerator
                                onGenerate={(c, s, f) => {
                                    reset();
                                    generateMap(c, s, f);
                                }}
                                disabled={isActive}
                                dark={dark}
                            />
                            <div
                                style={{
                                    width: "1px",
                                    height: "24px",
                                    background: bd,
                                    flexShrink: 0,
                                }}
                            />
                            <Toolbar
                                mode={mode}
                                onModeChange={setModeAndClear}
                                disabled={status === "running"}
                                dark={dark}
                            />
                        </div>

                        {/* Canvas */}
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            onClick={(e) =>
                                handleCanvasClick(e, status === "running")
                            }
                            style={{
                                display: "block",
                                width: "100%",
                                aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                                border: `1px solid ${bd}`,
                                borderRadius: "8px",
                                background: bg,
                                cursor:
                                    status === "running"
                                        ? "default"
                                        : CURSOR_BY_MODE[mode],
                            }}
                        />

                        {/* Controls */}
                        <Controls
                            status={status}
                            onRun={runACO}
                            onPause={pause}
                            onReset={reset}
                            onClearAll={() => {
                                reset();
                                clearGraph();
                            }}
                            stepSpeed={stepSpeed}
                            onSpeedChange={setStepSpeed}
                            dark={dark}
                        />

                        {/* Parameters */}
                        <ParamsPanel
                            params={params}
                            onChange={setParams}
                            disabled={isActive}
                            dark={dark}
                        />
                    </div>

                    {/* ── RIGHT COLUMN: Stats ── */}
                    <div style={{ width: "220px", flexShrink: 0 }}>
                        <div style={{ position: "sticky", top: "16px" }}>
                            <StatsPanel
                                status={status}
                                iteration={iteration}
                                nodeCount={nodes.length}
                                edgeCount={edges.length}
                                numAnts={params.numAnts}
                                bestPath={bestPath}
                                bestPathDistance={bestPathDistance}
                                pheromones={pheromones}
                                dark={dark}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        marginTop: "40px",
                        paddingTop: "16px",
                        borderTop: `1px solid ${bd}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                    }}
                >
                    <span style={{ fontSize: "12px", color: dim }}>
                        Ant Colony Optimization visualizer. Watch pheromone
                        trails emerge as ants find the shortest path.
                    </span>
                    <a
                        href="https://github.com/s4nj1th/look-up-aco"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: "12px",
                            color: fg,
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            opacity: 0.6,
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "1")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "0.6")
                        }
                    >
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        github.com/s4nj1th/look-up-aco
                    </a>
                </div>
            </div>
        </div>
    );
}
