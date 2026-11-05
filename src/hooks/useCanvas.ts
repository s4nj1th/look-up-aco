import { useEffect, useCallback } from "react";
import type { GraphNode, Edge, Ant, Mode, Theme, ACOParams } from "../types";
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    NODE_RADIUS,
    ANT_RADIUS,
} from "../constants";

interface DrawParams {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    nodes: GraphNode[];
    edges: Edge[];
    startNode: number | null;
    endNode: number | null;
    mode: Mode;
    selectedNodeForEdge: number | null;
    ants: Ant[];
    pheromones: Record<string, number>;
    bestPath: number[];
    theme: Theme;
    params?: ACOParams;
}

function hexToRgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
}

function lerpColor(a: string, b: string, t: number): string {
    const [r1, g1, b1] = hexToRgb(a);
    const [r2, g2, b2] = hexToRgb(b);
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

export function useCanvas({
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
    params,
}: DrawParams) {
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dark = theme === "dark";
        const bg = dark ? "#111111" : "#ffffff";
        const nodeFill = dark ? "#e5e5e5" : "#1a1a1a"; // default node
        const nodeText = dark ? "#111111" : "#ffffff";
        const edgeDim = dark ? "#2a2a2a" : "#e0e0e0"; // low-pheromone
        const edgeHot = dark ? "#f59e0b" : "#b45309"; // high-pheromone (amber)
        const dimLabel = dark ? "#555555" : "#aaaaaa";

        // ── background ──
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (nodes.length === 0) {
            ctx.fillStyle = dimLabel;
            ctx.font = "13px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("click to add nodes", 16, 16);
        }

        // ── pheromone scale based on what the theoretical max can be ──
        let estMinDistance = 250;
        if (startNode !== null && endNode !== null) {
            const s = nodes.find((n) => n.id === startNode);
            const e = nodes.find((n) => n.id === endNode);
            if (s && e) {
                const dx = e.x - s.x;
                const dy = e.y - s.y;
                estMinDistance = Math.max(Math.sqrt(dx * dx + dy * dy), 40);
            }
        }

        const numAnts = params?.numAnts ?? 10;
        const qVal = params?.Q ?? 100;
        const evap = Math.max(params?.evaporationRate ?? 0.5, 0.02);
        const initP = params?.initialPheromone ?? 0.1;

        // Steady-state theoretical max: (numAnts * Q) / (evaporationRate * minPathDistance)
        const theoreticalMax = (numAnts * qVal) / (evap * estMinDistance);
        const pVals = Object.values(pheromones);
        const currentMax = pVals.length > 0 ? Math.max(...pVals) : 0;
        // Ensure maxP is based on theoretical maximum so initial level doesn't start bright
        const maxP = Math.max(theoreticalMax, initP * 5, currentMax, 1);

        // Slow pulsing modulation (gentle breathing rhythm ~3.2s period)
        const pulse = 0.82 + 0.18 * Math.sin(performance.now() * 0.002);

        // ── edges ──
        edges.forEach((edge) => {
            const a = nodes.find((n) => n.id === edge.from);
            const b = nodes.find((n) => n.id === edge.to);
            if (!a || !b) return;
            const key =
                edge.from < edge.to
                    ? `${edge.from}-${edge.to}`
                    : `${edge.to}-${edge.from}`;
            const p = pheromones[key] ?? 0;
            const baseT = maxP > 0 ? Math.min(p / maxP, 1) : 0;
            // Pulsing modulates noticeable pheromone trails
            const t = baseT > 0.03 ? Math.min(baseT * pulse, 1) : baseT;

            ctx.strokeStyle = lerpColor(edgeDim, edgeHot, t);
            ctx.lineWidth = 1 + t * 3.5;
            if (t > 0.15) {
                ctx.shadowColor = edgeHot;
                ctx.shadowBlur = t * 6 * pulse;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // weight label
            ctx.fillStyle = dimLabel;
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                edge.distance.toFixed(0),
                (a.x + b.x) / 2,
                (a.y + b.y) / 2 - 7,
            );
        });

        // ── best path ──
        if (bestPath.length > 1) {
            const bpCol = dark ? "#fca5a5" : "#ef4444";
            ctx.strokeStyle = bpCol;
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 5]);
            ctx.shadowColor = bpCol;
            ctx.shadowBlur = 7;
            ctx.beginPath();
            const first = nodes.find((n) => n.id === bestPath[0]);
            if (first) ctx.moveTo(first.x, first.y);
            for (let i = 1; i < bestPath.length; i++) {
                const nd = nodes.find((n) => n.id === bestPath[i]);
                if (nd) ctx.lineTo(nd.x, nd.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
        }

        // ── nodes ──
        nodes.forEach((node) => {
            const isSelected =
                mode === "addEdge" && selectedNodeForEdge === node.id;
            const isStart = node.id === startNode;
            const isEnd = node.id === endNode;

            let fill = nodeFill;
            if (isStart) fill = dark ? "#86efac" : "#16a34a"; // green
            if (isEnd) fill = dark ? "#fca5a5" : "#dc2626"; // red

            if (isSelected) {
                ctx.shadowColor = dark ? "#93c5fd" : "#3b82f6";
                ctx.shadowBlur = 10;
            }

            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = isSelected ? (dark ? "#93c5fd" : "#3b82f6") : bg;
            ctx.lineWidth = isSelected ? 2.5 : 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = isStart || isEnd ? "#ffffff" : nodeText;
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(node.id), node.x, node.y);
        });

        // ── ants ──
        ants.forEach((ant) => {
            if (ant.position >= ant.path.length - 1) return;
            const from = nodes.find((n) => n.id === ant.path[ant.position]);
            const to = nodes.find((n) => n.id === ant.path[ant.position + 1]);
            if (!from || !to) return;

            const t = ant.progress;
            const x = from.x + (to.x - from.x) * t;
            const y = from.y + (to.y - from.y) * t;
            const ac = dark ? "#c4b5fd" : "#7c3aed"; // purple

            // trail
            if (t > 0.08) {
                const tt = t - 0.08;
                ctx.fillStyle = dark
                    ? "rgba(196,181,253,0.2)"
                    : "rgba(124,58,237,0.18)";
                ctx.beginPath();
                ctx.arc(
                    from.x + (to.x - from.x) * tt,
                    from.y + (to.y - from.y) * tt,
                    ANT_RADIUS - 1,
                    0,
                    Math.PI * 2,
                );
                ctx.fill();
            }

            ctx.fillStyle = ac;
            ctx.beginPath();
            ctx.arc(x, y, ANT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── pheromone scale legend (bottom-right) ──
        if (edges.length > 0) {
            const bw = 80,
                bh = 6,
                mx = CANVAS_WIDTH - bw - 14,
                my = CANVAS_HEIGHT - bh - 20;
            const grad = ctx.createLinearGradient(mx, 0, mx + bw, 0);
            grad.addColorStop(0, edgeDim);
            grad.addColorStop(1, edgeHot);
            ctx.fillStyle = grad;
            ctx.fillRect(mx, my, bw, bh);
            ctx.strokeStyle = dimLabel;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(mx, my, bw, bh);
            ctx.fillStyle = dimLabel;
            ctx.font = "9px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("low", mx, my + bh + 2);
            ctx.textAlign = "right";
            ctx.fillText("high", mx + bw, my + bh + 2);
        }
    }, [
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
        params,
    ]);

    useEffect(() => {
        let animId: number;
        let running = true;
        const render = () => {
            if (!running) return;
            draw();
            animId = requestAnimationFrame(render);
        };
        animId = requestAnimationFrame(render);
        return () => {
            running = false;
            cancelAnimationFrame(animId);
        };
    }, [draw]);

    return { draw };
}
