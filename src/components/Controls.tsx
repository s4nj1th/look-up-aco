import React from "react";
import { Play, Pause, RotateCcw, Trash2 } from "lucide-react";
import type { SimStatus } from "../types";

interface ControlsProps {
    status: SimStatus;
    onRun: () => void;
    onPause: () => void;
    onReset: () => void;
    onClearAll: () => void;
    stepSpeed: number;
    onSpeedChange: (v: number) => void;
    dark: boolean;
}

const Controls: React.FC<ControlsProps> = ({
    status,
    onRun,
    onPause,
    onReset,
    onClearAll,
    stepSpeed,
    onSpeedChange,
    dark,
}) => {
    const isRunning = status === "running";
    const isPaused = status === "paused";
    const isActive = isRunning || isPaused;
    const bd = dark ? "#333" : "#ddd";
    const dim = dark ? "#777" : "#888";
    const fg = dark ? "#eee" : "#111";

    const btn = (opts: {
        primary?: boolean;
        danger?: boolean;
        active?: boolean;
        disabled?: boolean;
    }): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 12px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: opts.disabled ? "not-allowed" : "pointer",
        opacity: opts.disabled ? 0.35 : 1,
        border: `1px solid ${opts.primary && !opts.disabled ? fg : bd}`,
        borderRadius: "6px",
        background: opts.primary && !opts.disabled ? fg : "transparent",
        color:
            opts.primary && !opts.disabled
                ? dark
                    ? "#111"
                    : "#fff"
                : opts.danger
                  ? dark
                      ? "#f88"
                      : "#c00"
                  : dim,
        transition: "opacity 0.1s",
    });

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                alignItems: "center",
            }}
        >
            <button
                onClick={onRun}
                disabled={isActive}
                style={btn({ primary: true, disabled: isActive })}
            >
                <Play size={12} /> Run
            </button>
            <button
                onClick={onPause}
                disabled={!isActive}
                style={btn({ active: isPaused, disabled: !isActive })}
            >
                <Pause size={12} /> {isPaused ? "Resume" : "Pause"}
            </button>
            <button onClick={onReset} style={btn({})}>
                <RotateCcw size={12} /> Reset
            </button>
            <button onClick={onClearAll} style={btn({ danger: true })}>
                <Trash2 size={12} /> Clear
            </button>

            {/* Speed */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginLeft: "auto",
                }}
            >
                <span style={{ fontSize: "10px", color: dim }}>Speed</span>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={stepSpeed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    style={{ width: "60px" }}
                />
                <span
                    style={{ fontSize: "10px", color: dim, minWidth: "26px" }}
                >
                    {stepSpeed === 1
                        ? "slow"
                        : stepSpeed === 2
                          ? "med"
                          : "fast"}
                </span>
            </div>
        </div>
    );
};

export default Controls;
