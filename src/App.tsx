import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, Sun, Moon } from "lucide-react";

const FAVICON_LIGHT = "/favicon-light.svg";
const FAVICON_DARK = "/favicon-dark.svg";
const THEME_STORAGE_KEY = "theme";

const getSystemPrefersDark = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const readStoredTheme = (): "light" | "dark" | null => {
  try {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
    return null;
  } catch {
    return null;
  }
};

const persistTheme = (theme: "light" | "dark" | null) => {
  try {
    if (typeof window === "undefined") return;
    if (theme === null) {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // ignore
  }
};

const setFaviconForTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  const href = theme === "dark" ? FAVICON_DARK : FAVICON_LIGHT;

  let reactFavicon = document.getElementById(
    "react-favicon",
  ) as HTMLLinkElement | null;
  if (!reactFavicon) {
    reactFavicon = document.createElement("link");
    reactFavicon.id = "react-favicon";
    reactFavicon.rel = "icon";
    reactFavicon.type = "image/svg+xml";
    document.head.appendChild(reactFavicon);
  }
  reactFavicon.href = href;

  document
    .querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
    .forEach((lnk) => {
      if (lnk.id === "react-favicon") return;
      lnk.href = href;
    });
};

const applyHtmlDarkClass = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

const ACOVisualizer: React.FC = () => {
  const stored = readStoredTheme();
  const initialTheme: "light" | "dark" =
    stored ?? (getSystemPrefersDark() ? "dark" : "light");

  const [theme, setThemeState] = useState<"light" | "dark">(initialTheme);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [startNode, setStartNode] = useState<number | null>(null);
  const [endNode, setEndNode] = useState<number | null>(null);
  const [mode, setMode] = useState<
    "add" | "delete" | "selectStart" | "selectEnd" | "addEdge"
  >("add");
  const [selectedNodeForEdge, setSelectedNodeForEdge] = useState<number | null>(
    null,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ants, setAnts] = useState<any[]>([]);
  const [pheromones, setPheromones] = useState<Record<string, number>>({});
  const [bestPath, setBestPath] = useState<number[]>([]);
  const [iteration, setIteration] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const bgColor = theme === "light" ? "#ffffff" : "#0a0a0a";
  const fgColor = theme === "light" ? "#000000" : "#ffffff";
  const accentColor = theme === "light" ? "#404040" : "#d4d4d4";

  const NUM_ANTS = 10;
  const EVAPORATION_RATE = 0.5;
  const ALPHA = 1;
  const BETA = 2;
  const Q = 100;

  useEffect(() => {
    applyHtmlDarkClass(theme);
    setFaviconForTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = readStoredTheme();

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const systemIsDark = "matches" in e ? e.matches : mq.matches;
      if (!readStoredTheme()) {
        setThemeState(systemIsDark ? "dark" : "light");
      }
    };

    if (!storedTheme) {
      setThemeState(mq.matches ? "dark" : "light");
    }

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler as EventListener);
    } else if (typeof (mq as any).addListener === "function") {
      (mq as any).addListener(handler);
    }

    return () => {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", handler as EventListener);
      } else if (typeof (mq as any).removeListener === "function") {
        (mq as any).removeListener(handler);
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeState(next);
    persistTheme(next);
  };

  const clearThemePreference = () => {
    persistTheme(null);
    const sys = getSystemPrefersDark() ? "dark" : "light";
    setThemeState(sys);
  };

  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, startNode, endNode, theme, ants, pheromones, bestPath]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    edges.forEach((edge) => {
      const nodeA = nodes.find((n) => n.id === edge.from);
      const nodeB = nodes.find((n) => n.id === edge.to);
      if (!nodeA || !nodeB) return;

      const edgeKey = `${edge.from}-${edge.to}`;
      const pheromone = pheromones[edgeKey] || 0;
      const intensity = Math.min(pheromone / 10, 1);

      ctx.strokeStyle =
        theme === "light"
          ? `rgba(0, 0, 0, ${0.2 + intensity * 0.6})`
          : `rgba(255, 255, 255, ${0.2 + intensity * 0.6})`;
      ctx.lineWidth = 1 + intensity * 3;
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.stroke();

      const midX = (nodeA.x + nodeB.x) / 2;
      const midY = (nodeA.y + nodeB.y) / 2;
      ctx.fillStyle = accentColor;
      ctx.font = "10px monospace";
      ctx.fillText(edge.distance.toFixed(0), midX + 5, midY - 5);
    });

    if (bestPath.length > 1) {
      ctx.strokeStyle = theme === "light" ? "#ef4444" : "#fca5a5";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const firstNode = nodes.find((n) => n.id === bestPath[0]);
      if (firstNode) ctx.moveTo(firstNode.x, firstNode.y);
      for (let i = 1; i < bestPath.length; i++) {
        const node = nodes.find((n) => n.id === bestPath[i]);
        if (node) ctx.lineTo(node.x, node.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    nodes.forEach((node) => {
      const isSelected = mode === "addEdge" && selectedNodeForEdge === node.id;
      ctx.fillStyle =
        node.id === startNode
          ? theme === "light"
            ? "#22c55e"
            : "#86efac"
          : node.id === endNode
            ? theme === "light"
              ? "#ef4444"
              : "#fca5a5"
            : fgColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isSelected
        ? theme === "light"
          ? "#3b82f6"
          : "#93c5fd"
        : bgColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = bgColor;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(node.id), node.x, node.y);
    });

    ants.forEach((ant) => {
      if (ant.position < ant.path.length - 1) {
        const fromNode = nodes.find((n) => n.id === ant.path[ant.position]);
        const toNode = nodes.find((n) => n.id === ant.path[ant.position + 1]);
        if (fromNode && toNode) {
          const t = ant.progress;
          const x = fromNode.x + (toNode.x - fromNode.x) * t;
          const y = fromNode.y + (toNode.y - fromNode.y) * t;

          ctx.fillStyle = theme === "light" ? "#7c3aed" : "#c4b5fd";
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(
      (n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 12,
    );

    if (mode === "add") {
      if (!clickedNode) {
        const newNode = { id: nodes.length, x, y };
        setNodes((prev) => [...prev, newNode]);
      }
    } else if (mode === "addEdge") {
      if (clickedNode) {
        if (selectedNodeForEdge === null) {
          setSelectedNodeForEdge(clickedNode.id);
        } else if (selectedNodeForEdge !== clickedNode.id) {
          const nodeA = nodes.find((n) => n.id === selectedNodeForEdge);
          if (!nodeA) {
            setSelectedNodeForEdge(null);
            return;
          }
          const distance = Math.sqrt(
            (nodeA.x - clickedNode.x) ** 2 + (nodeA.y - clickedNode.y) ** 2,
          );
          const edgeExists = edges.some(
            (e) =>
              (e.from === selectedNodeForEdge && e.to === clickedNode.id) ||
              (e.from === clickedNode.id && e.to === selectedNodeForEdge),
          );
          if (!edgeExists) {
            setEdges((prev) => [
              ...prev,
              {
                from: selectedNodeForEdge,
                to: clickedNode.id,
                distance,
              },
            ]);
          }
          setSelectedNodeForEdge(null);
        } else {
          setSelectedNodeForEdge(null);
        }
      }
    } else if (mode === "delete") {
      if (clickedNode) {
        setNodes((prev) => prev.filter((n) => n.id !== clickedNode.id));
        setEdges((prev) =>
          prev.filter(
            (e) => e.from !== clickedNode.id && e.to !== clickedNode.id,
          ),
        );
        if (startNode === clickedNode.id) setStartNode(null);
        if (endNode === clickedNode.id) setEndNode(null);
      }
    } else if (mode === "selectStart") {
      if (clickedNode) {
        setStartNode(clickedNode.id);
        setMode("add");
      }
    } else if (mode === "selectEnd") {
      if (clickedNode) {
        setEndNode(clickedNode.id);
        setMode("add");
      }
    }
  };

  const initializeAnts = () => {
    if (startNode === null) return [];
    return Array(NUM_ANTS)
      .fill(null)
      .map(() => ({
        path: [startNode],
        visited: new Set([startNode]),
        distance: 0,
        position: 0,
        progress: 0,
        completed: false,
      }));
  };

  const getNeighbors = (nodeId: number) => {
    return edges
      .filter((e) => e.from === nodeId || e.to === nodeId)
      .map((e) => ({
        node: e.from === nodeId ? e.to : e.from,
        distance: e.distance,
        edgeKey: e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`,
      }));
  };

  const selectNextNode = (ant: any) => {
    const current = ant.path[ant.path.length - 1];
    const neighbors = getNeighbors(current).filter(
      (n) => !ant.visited.has(n.node),
    );

    if (neighbors.length === 0) return null;

    const probabilities = neighbors.map((n) => {
      const pheromone = pheromones[n.edgeKey] || 0.1;
      const desirability =
        Math.pow(pheromone, ALPHA) * Math.pow(1 / n.distance, BETA);
      return { ...n, desirability };
    });

    const total = probabilities.reduce((sum, p) => sum + p.desirability, 0);
    let rand = Math.random() * total;

    for (const prob of probabilities) {
      rand -= prob.desirability;
      if (rand <= 0) return prob;
    }

    return probabilities[0];
  };

  const runACO = () => {
    if (startNode === null || endNode === null) {
      alert("Please select start and end nodes");
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setIteration(0);
    setBestPath([]);
    setPheromones({});
    setAnts(initializeAnts());
  };

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const step = () => {
      setAnts((prevAnts) => {
        const updatedAnts = prevAnts.map((ant) => {
          if (ant.completed) return ant;

          // Move ant along current edge
          if (ant.progress < 1) {
            return { ...ant, progress: ant.progress + 0.02 };
          }

          // Reached next node, select new node
          if (ant.path[ant.path.length - 1] === endNode) {
            return { ...ant, completed: true };
          }

          const nextNodeData = selectNextNode(ant);
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
          setPheromones((prev) => {
            const newPheromones = { ...prev };

            // Evaporation
            Object.keys(newPheromones).forEach((key) => {
              newPheromones[key] *= 1 - EVAPORATION_RATE;
            });

            // Deposit pheromones
            updatedAnts.forEach((ant) => {
              if (ant.path[ant.path.length - 1] === endNode) {
                const deposit = Q / ant.distance;
                for (let i = 0; i < ant.path.length - 1; i++) {
                  const from = ant.path[i];
                  const to = ant.path[i + 1];
                  const key = from < to ? `${from}-${to}` : `${to}-${from}`;
                  newPheromones[key] = (newPheromones[key] || 0) + deposit;
                }
              }
            });

            return newPheromones;
          });

          const completedPaths = updatedAnts.filter(
            (ant) => ant.path[ant.path.length - 1] === endNode,
          );
          if (completedPaths.length > 0) {
            const best = completedPaths.reduce((min, ant) =>
              ant.distance < min.distance ? ant : min,
            );
            setBestPath(best.path);
          }

          setIteration((i) => i + 1);

          setTimeout(() => setAnts(initializeAnts()), 500);
        }

        return updatedAnts;
      });

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isPaused, nodes, edges, startNode, endNode, pheromones]);

  const reset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setAnts([]);
    setPheromones({});
    setBestPath([]);
    setIteration(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const clearGraph = () => {
    reset();
    setNodes([]);
    setEdges([]);
    setStartNode(null);
    setEndNode(null);
  };

  const controlBtn = (active: boolean) =>
    [
      "px-3",
      "py-2",
      "rounded-md",
      "text-sm",
      "flex",
      "items-center",
      "gap-2",
      "border",
      "transition-colors",
      "duration-150",
      active
        ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-black border-gray-900 dark:border-gray-100"
        : "bg-transparent text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700",
    ].join(" ");

  const primaryBtn = (disabled: boolean) =>
    [
      "px-4",
      "py-2",
      "rounded-md",
      "text-sm",
      "flex",
      "items-center",
      "gap-2",
      "font-bold",
      disabled
        ? "bg-gray-400 text-white cursor-not-allowed"
        : "bg-gray-900 text-white hover:bg-black dark:bg-gray-100 dark:text-black dark:hover:bg-white",
    ].join(" ");

  return (
    <div className="items-center">
      <div className={theme === "dark" ? "dark" : ""}>
        <div className="min-h-screen p-5 font-mono bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100">
          <div className="max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-5 pb-5">
              <div>
                <h1 className="text-2xl font-semibold mb-1">ACO Path Finder</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ant Colony Optimization Visualization
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="px-3 py-2 border rounded-md flex items-center gap-2 bg-transparent text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <button
                  onClick={clearThemePreference}
                  title="Follow system theme"
                  className="px-2 py-2 rounded-md text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                >
                  System
                </button>
              </div>
            </header>

            <div className="flex gap-4 mb-5 flex-wrap justify-center">
              <button
                onClick={() => {
                  setMode("add");
                  setSelectedNodeForEdge(null);
                }}
                className={controlBtn(mode === "add")}
              >
                <Plus size={16} className="inline-block" />
                <span>Add Nodes</span>
              </button>

              <button
                onClick={() => {
                  setMode("addEdge");
                  setSelectedNodeForEdge(null);
                }}
                className={controlBtn(mode === "addEdge")}
              >
                Add Edges
              </button>

              <button
                onClick={() => {
                  setMode("delete");
                  setSelectedNodeForEdge(null);
                }}
                className={controlBtn(mode === "delete")}
              >
                <Trash2 size={16} className="inline-block" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => {
                  setMode("selectStart");
                  setSelectedNodeForEdge(null);
                }}
                className="px-3 py-2 rounded-md text-sm flex items-center gap-2 border bg-transparent text-green-600 dark:text-green-300 border-gray-200 dark:border-gray-700"
              >
                Set Start
              </button>

              <button
                onClick={() => {
                  setMode("selectEnd");
                  setSelectedNodeForEdge(null);
                }}
                className="px-3 py-2 rounded-md text-sm flex items-center gap-2 border bg-transparent text-red-600 dark:text-red-300 border-gray-200 dark:border-gray-700"
              >
                Set End
              </button>
            </div>

            <div className="mb-5">
              <canvas
                ref={canvasRef}
                width={1160}
                height={500}
                onClick={handleCanvasClick}
                className="w-full max-w-[1160px] h-[500px] block mb-3 border-2 rounded-md cursor-crosshair border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Click on the canvas to add/select nodes depending on mode.
              </div>
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
              <button
                onClick={runACO}
                disabled={isRunning}
                className={primaryBtn(isRunning)}
              >
                <Play size={16} />
                Run ACO
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                disabled={!isRunning}
                className="px-4 py-2 rounded-md text-sm flex items-center gap-2 border bg-transparent text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
              >
                <Pause size={16} />
                {isPaused ? "Resume" : "Pause"}
              </button>

              <button
                onClick={reset}
                className="px-4 py-2 rounded-md text-sm flex items-center gap-2 border bg-transparent text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                onClick={clearGraph}
                className="px-4 py-2 rounded-md text-sm flex items-center gap-2 border bg-transparent text-red-600 dark:text-red-300 border-gray-200 dark:border-gray-700"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Iteration
                </div>
                <div className="text-xl font-bold">{iteration}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Nodes
                </div>
                <div className="text-xl font-bold">{nodes.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Edges
                </div>
                <div className="text-xl font-bold">{edges.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Best Path Length
                </div>
                <div className="text-xl font-bold">
                  {bestPath.length > 0 ? bestPath.length : "-"}
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm leading-6">
              <strong>How to use:</strong>
              <ol className="mt-2 ml-5 list-decimal">
                <li>Click "Add Nodes" and click on canvas to create nodes</li>
                <li>Click "Add Edges" and click two nodes to connect them</li>
                <li>Set start (green) and end (red) nodes</li>
                <li>Click "Run ACO" to start the algorithm</li>
                <li>
                  Watch ants find the optimal path (shown in red dashed line)
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACOVisualizer;
