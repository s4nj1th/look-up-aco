import React, { useState } from "react";
import { Shuffle } from "lucide-react";

interface MapGeneratorProps {
    onGenerate: (cities: number, seed: number, fullyConnected: boolean) => void;
    disabled: boolean;
    dark: boolean;
}

const MapGenerator: React.FC<MapGeneratorProps> = ({
    onGenerate,
    disabled,
    dark,
}) => {
    const [cities, setCities] = useState(8);
    const [seed, setSeed] = useState(42);
    const [full, setFull] = useState(true);
    const dim = dark ? "#666" : "#999";
    const bd = dark ? "#333" : "#ddd";
    const fg = dark ? "#eee" : "#111";

    const toggleStyle = (active: boolean): React.CSSProperties => ({
        flex: 1,
        padding: "4px 0",
        fontSize: "10px",
        fontWeight: active ? 700 : 500,
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? fg : "transparent",
        color: active ? (dark ? "#111" : "#fff") : dim,
        border: "none",
        opacity: disabled ? 0.4 : 1,
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Cities */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    gap: "8px",
                    alignItems: "center",
                }}
            >
                <span style={{ fontSize: "10px", color: dim }}>Cities</span>
                <input
                    type="range"
                    min={3}
                    max={30}
                    step={1}
                    value={cities}
                    disabled={disabled}
                    onChange={(e) => setCities(Number(e.target.value))}
                />
                <span
                    style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: fg,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "24px",
                        textAlign: "right",
                    }}
                >
                    {cities}
                </span>
            </div>

            {/* Seed */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto auto",
                    gap: "8px",
                    alignItems: "center",
                }}
            >
                <span style={{ fontSize: "10px", color: dim }}>Seed</span>
                <input
                    type="range"
                    min={0}
                    max={9999}
                    step={1}
                    value={seed}
                    disabled={disabled}
                    onChange={(e) => setSeed(Number(e.target.value))}
                />
                <span
                    style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: fg,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "36px",
                        textAlign: "right",
                    }}
                >
                    {seed}
                </span>
                <button
                    onClick={() => setSeed(Math.floor(Math.random() * 9999))}
                    disabled={disabled}
                    title="Random seed"
                    style={{
                        padding: "2px 5px",
                        border: `1px solid ${bd}`,
                        borderRadius: "4px",
                        background: "transparent",
                        color: dim,
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.4 : 1,
                        display: "flex",
                    }}
                >
                    <Shuffle size={10} />
                </button>
            </div>

            {/* Edge mode + Generate */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div
                    style={{
                        display: "flex",
                        border: `1px solid ${bd}`,
                        borderRadius: "5px",
                        overflow: "hidden",
                        flex: 1,
                    }}
                >
                    <button
                        onClick={() => setFull(true)}
                        disabled={disabled}
                        style={toggleStyle(full)}
                    >
                        Full
                    </button>
                    <button
                        onClick={() => setFull(false)}
                        disabled={disabled}
                        style={{
                            ...toggleStyle(!full),
                            borderLeft: `1px solid ${bd}`,
                        }}
                    >
                        Sparse
                    </button>
                </div>
                <button
                    onClick={() => onGenerate(cities, seed, full)}
                    disabled={disabled}
                    style={{
                        padding: "5px 12px",
                        borderRadius: "5px",
                        border: "none",
                        background: disabled ? (dark ? "#333" : "#ddd") : fg,
                        color: disabled ? dim : dark ? "#111" : "#fff",
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: disabled ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        whiteSpace: "nowrap",
                    }}
                >
                    <Shuffle size={11} /> Generate
                </button>
            </div>
        </div>
    );
};

export default MapGenerator;
