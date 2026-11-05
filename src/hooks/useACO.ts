import { useState, useEffect, useRef, useCallback } from "react";
import type { GraphNode, Edge, Ant, SimStatus, ACOParams } from "../types";

interface UseACOParams {
    nodes: GraphNode[];
    edges: Edge[];
    startNode: number | null;
    endNode: number | null;
    stepSpeed: number;
    params: ACOParams;
}

const SPEED_INCREMENT = [0, 0.01, 0.02, 0.05] as const;

export function useACO({
    nodes,
    edges,
    startNode,
    endNode,
    stepSpeed,
    params,
}: UseACOParams) {
    const [status, setStatus] = useState<SimStatus>("idle");
    const [ants, setAnts] = useState<Ant[]>([]);
    const [pheromones, setPheromones] = useState<Record<string, number>>({});
    const [bestPath, setBestPath] = useState<number[]>([]);
    const [bestPathDistance, setBestPathDistance] = useState<number>(0);
    const [iteration, setIteration] = useState(0);

    const animationRef = useRef<number | null>(null);
    const pheromonesRef = useRef<Record<string, number>>({});
    const statusRef = useRef<SimStatus>("idle");
    const paramsRef = useRef<ACOParams>(params);

    // Keep refs in sync
    useEffect(() => {
        pheromonesRef.current = pheromones;
    }, [pheromones]);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const getEdgeKey = useCallback(
        (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`),
        [],
    );

    const getNeighbors = useCallback(
        (nodeId: number, currentPheromones: Record<string, number>) => {
            return edges
                .filter((e) => e.from === nodeId || e.to === nodeId)
                .map((e) => {
                    const key =
                        e.from < e.to
                            ? `${e.from}-${e.to}`
                            : `${e.to}-${e.from}`;
                    return {
                        node: e.from === nodeId ? e.to : e.from,
                        distance: e.distance,
                        edgeKey: key,
                        pheromone:
                            currentPheromones[key] ??
                            paramsRef.current.initialPheromone,
                    };
                });
        },
        [edges],
    );

    const selectNextNode = useCallback(
        (
            ant: Ant,
            currentPheromones: Record<string, number>,
        ): { node: number; distance: number; edgeKey: string } | null => {
            const { alpha, beta } = paramsRef.current;
            const current = ant.path[ant.path.length - 1];
            const neighbors = getNeighbors(current, currentPheromones).filter(
                (n) => !ant.visited.has(n.node),
            );

            if (neighbors.length === 0) return null;

            const probabilities = neighbors.map((n) => {
                const desirability =
                    Math.pow(n.pheromone, alpha) *
                    Math.pow(1 / n.distance, beta);
                return { ...n, desirability };
            });

            const total = probabilities.reduce(
                (sum, p) => sum + p.desirability,
                0,
            );
            let rand = Math.random() * total;

            for (const prob of probabilities) {
                rand -= prob.desirability;
                if (rand <= 0) return prob;
            }

            return probabilities[0];
        },
        [getNeighbors],
    );

    const initializeAnts = useCallback((): Ant[] => {
        if (startNode === null) return [];
        return Array(paramsRef.current.numAnts)
            .fill(null)
            .map(() => ({
                path: [startNode],
                visited: new Set([startNode]),
                distance: 0,
                position: 0,
                progress: 0,
                completed: false,
            }));
    }, [startNode]);

    const runACO = useCallback(() => {
        if (startNode === null || endNode === null) {
            alert("Please select start and end nodes");
            return;
        }
        if (nodes.length < 2 || edges.length === 0) {
            alert("Please add at least 2 nodes and some edges");
            return;
        }

        // Seed pheromones with initialPheromone value
        const initPheromones: Record<string, number> = {};
        edges.forEach((e) => {
            const key =
                e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`;
            initPheromones[key] = paramsRef.current.initialPheromone;
        });

        setStatus("running");
        setIteration(0);
        setBestPath([]);
        setBestPathDistance(0);
        setPheromones(initPheromones);
        pheromonesRef.current = initPheromones;
        setAnts(initializeAnts());
    }, [startNode, endNode, nodes.length, edges, initializeAnts]);

    const pause = useCallback(() => {
        setStatus((s) =>
            s === "running" ? "paused" : s === "paused" ? "running" : s,
        );
    }, []);

    const reset = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setStatus("idle");
        setAnts([]);
        setPheromones({});
        pheromonesRef.current = {};
        setBestPath([]);
        setBestPathDistance(0);
        setIteration(0);
    }, []);

    useEffect(() => {
        if (status !== "running") {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const increment = SPEED_INCREMENT[stepSpeed] ?? 0.02;

        const step = () => {
            if (statusRef.current !== "running") return;

            setAnts((prevAnts) => {
                const currentPheromones = pheromonesRef.current;
                const { evaporationRate, Q: q, numAnts } = paramsRef.current;

                const updatedAnts = prevAnts.map((ant) => {
                    if (ant.completed) return ant;

                    if (ant.progress < 1) {
                        return {
                            ...ant,
                            progress: Math.min(ant.progress + increment, 1),
                        };
                    }

                    if (ant.path[ant.path.length - 1] === endNode) {
                        return { ...ant, completed: true };
                    }

                    const nextNodeData = selectNextNode(ant, currentPheromones);
                    if (!nextNodeData) {
                        return { ...ant, completed: true };
                    }

                    return {
                        ...ant,
                        path: [...ant.path, nextNodeData.node],
                        visited: new Set([...ant.visited, nextNodeData.node]),
                        distance: ant.distance + nextNodeData.distance,
                        position: ant.position + 1,
                        progress: 0,
                    };
                });

                if (updatedAnts.every((ant) => ant.completed)) {
                    const newPheromones = { ...currentPheromones };

                    // Evaporation
                    Object.keys(newPheromones).forEach((key) => {
                        newPheromones[key] *= 1 - evaporationRate;
                    });

                    // Deposit
                    updatedAnts.forEach((ant) => {
                        if (ant.path[ant.path.length - 1] === endNode) {
                            const deposit = q / ant.distance;
                            for (let i = 0; i < ant.path.length - 1; i++) {
                                const from = ant.path[i];
                                const to = ant.path[i + 1];
                                const key =
                                    from < to
                                        ? `${from}-${to}`
                                        : `${to}-${from}`;
                                newPheromones[key] =
                                    (newPheromones[key] || 0) + deposit;
                            }
                        }
                    });

                    pheromonesRef.current = newPheromones;
                    setPheromones({ ...newPheromones });

                    const completedPaths = updatedAnts.filter(
                        (ant) => ant.path[ant.path.length - 1] === endNode,
                    );
                    if (completedPaths.length > 0) {
                        const iterBest = completedPaths.reduce((min, ant) =>
                            ant.distance < min.distance ? ant : min,
                        );
                        setBestPathDistance((prevDist) => {
                            if (
                                prevDist === 0 ||
                                iterBest.distance < prevDist
                            ) {
                                setBestPath(iterBest.path);
                                return iterBest.distance;
                            }
                            return prevDist;
                        });
                    }

                    setIteration((i) => i + 1);

                    // Reset ants immediately for the next iteration
                    const nextAnts = Array(numAnts)
                        .fill(null)
                        .map(() => ({
                            path: [startNode!],
                            visited: new Set([startNode!]),
                            distance: 0,
                            position: 0,
                            progress: 0,
                            completed: false,
                        }));

                    return nextAnts;
                }

                return updatedAnts;
            });

            animationRef.current = requestAnimationFrame(step);
        };

        animationRef.current = requestAnimationFrame(step);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [status, stepSpeed, endNode, startNode, selectNextNode]);

    return {
        status,
        ants,
        pheromones,
        bestPath,
        bestPathDistance,
        iteration,
        runACO,
        pause,
        reset,
        getEdgeKey,
    };
}
