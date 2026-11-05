export interface GraphNode {
    id: number;
    x: number;
    y: number;
}

export interface Edge {
    from: number;
    to: number;
    distance: number;
}

export interface Ant {
    path: number[];
    visited: Set<number>;
    distance: number;
    position: number;
    progress: number;
    completed: boolean;
}

export interface ACOParams {
    numAnts: number;
    alpha: number;
    beta: number;
    evaporationRate: number;
    Q: number;
    initialPheromone: number;
}

export type Mode = "add" | "delete" | "selectStart" | "selectEnd" | "addEdge";
export type Theme = "light" | "dark";
export type SimStatus = "idle" | "running" | "paused";
