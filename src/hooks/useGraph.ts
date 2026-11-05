import { useState, useCallback } from "react";
import type { GraphNode, Edge, Mode } from "../types";
import { NODE_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";

// Simple seeded pseudo-random number generator (mulberry32)
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function useGraph() {
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [startNode, setStartNode] = useState<number | null>(null);
    const [endNode, setEndNode] = useState<number | null>(null);
    const [mode, setMode] = useState<Mode>("add");
    const [selectedNodeForEdge, setSelectedNodeForEdge] = useState<
        number | null
    >(null);

    const setModeAndClear = useCallback((m: Mode) => {
        setMode(m);
        setSelectedNodeForEdge(null);
    }, []);

    const handleCanvasClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>, isRunning: boolean) => {
            if (isRunning) return;
            const canvas = e.currentTarget;
            const rect = canvas.getBoundingClientRect();
            // Scale click coordinates to canvas logical size
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const clickedNode = nodes.find(
                (n) =>
                    Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) <
                    NODE_RADIUS + 4,
            );

            if (mode === "add") {
                if (!clickedNode) {
                    setNodes((prev) => [...prev, { id: prev.length, x, y }]);
                }
            } else if (mode === "addEdge") {
                if (clickedNode) {
                    setSelectedNodeForEdge((prev) => {
                        if (prev === null) return clickedNode.id;
                        if (prev === clickedNode.id) return null;

                        // Add edge between prev and clickedNode
                        const nodeA = nodes.find((n) => n.id === prev);
                        if (!nodeA) return null;

                        const distance = Math.sqrt(
                            (nodeA.x - clickedNode.x) ** 2 +
                                (nodeA.y - clickedNode.y) ** 2,
                        );
                        const edgeExists = edges.some(
                            (ed) =>
                                (ed.from === prev &&
                                    ed.to === clickedNode.id) ||
                                (ed.from === clickedNode.id && ed.to === prev),
                        );
                        if (!edgeExists) {
                            setEdges((edgePrev) => [
                                ...edgePrev,
                                { from: prev, to: clickedNode.id, distance },
                            ]);
                        }
                        return null;
                    });
                }
            } else if (mode === "delete") {
                if (clickedNode) {
                    setNodes((prev) =>
                        prev.filter((n) => n.id !== clickedNode.id),
                    );
                    setEdges((prev) =>
                        prev.filter(
                            (ed) =>
                                ed.from !== clickedNode.id &&
                                ed.to !== clickedNode.id,
                        ),
                    );
                    if (startNode === clickedNode.id) setStartNode(null);
                    if (endNode === clickedNode.id) setEndNode(null);
                }
            } else if (mode === "selectStart") {
                if (clickedNode) {
                    setStartNode(clickedNode.id);
                    setModeAndClear("add");
                }
            } else if (mode === "selectEnd") {
                if (clickedNode) {
                    setEndNode(clickedNode.id);
                    setModeAndClear("add");
                }
            }
        },
        [nodes, edges, mode, startNode, endNode, setModeAndClear],
    );

    const clearGraph = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setStartNode(null);
        setEndNode(null);
        setModeAndClear("add");
    }, [setModeAndClear]);

    /**
     * Generate a random map with `cityCount` nodes using the given seed.
     * Nodes are placed with some margin inside the canvas.
     * Edges are generated as a fully-connected graph (every pair connected).
     */
    const generateMap = useCallback(
        (cityCount: number, seed: number, fullyConnected: boolean) => {
            const rand = mulberry32(seed);
            const margin = 60;
            const w = CANVAS_WIDTH - margin * 2;
            const h = CANVAS_HEIGHT - margin * 2;

            const newNodes: GraphNode[] = Array.from(
                { length: cityCount },
                (_, i) => ({
                    id: i,
                    x: margin + rand() * w,
                    y: margin + rand() * h,
                }),
            );

            const newEdges: Edge[] = [];
            if (fullyConnected) {
                // Connect every pair
                for (let i = 0; i < newNodes.length; i++) {
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const a = newNodes[i];
                        const b = newNodes[j];
                        newEdges.push({
                            from: a.id,
                            to: b.id,
                            distance: Math.sqrt(
                                (a.x - b.x) ** 2 + (a.y - b.y) ** 2,
                            ),
                        });
                    }
                }
            } else {
                // Connect each node to its 3 nearest neighbors (sparse)
                for (let i = 0; i < newNodes.length; i++) {
                    const a = newNodes[i];
                    const neighbors = newNodes
                        .filter((_, j) => j !== i)
                        .map((b) => ({
                            id: b.id,
                            dist: Math.sqrt(
                                (a.x - b.x) ** 2 + (a.y - b.y) ** 2,
                            ),
                        }))
                        .sort((x, y) => x.dist - y.dist)
                        .slice(0, 3);

                    for (const nb of neighbors) {
                        const alreadyExists = newEdges.some(
                            (e) =>
                                (e.from === i && e.to === nb.id) ||
                                (e.from === nb.id && e.to === i),
                        );
                        if (!alreadyExists) {
                            newEdges.push({
                                from: i,
                                to: nb.id,
                                distance: nb.dist,
                            });
                        }
                    }
                }
            }

            setNodes(newNodes);
            setEdges(newEdges);
            setStartNode(0);
            setEndNode(cityCount - 1);
            setModeAndClear("add");
        },
        [setModeAndClear],
    );

    return {
        nodes,
        edges,
        startNode,
        endNode,
        mode,
        selectedNodeForEdge,
        setStartNode,
        setEndNode,
        setModeAndClear,
        handleCanvasClick,
        clearGraph,
        generateMap,
    };
}
