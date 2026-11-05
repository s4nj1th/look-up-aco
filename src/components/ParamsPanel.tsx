import React from "react";
import type { ACOParams } from "../types";

export const DEFAULT_PARAMS: ACOParams = {
    numAnts: 10,
    alpha: 1.0,
    beta: 2.0,
    evaporationRate: 0.5,
    Q: 100,
    initialPheromone: 0.1,
};

interface ParamsPanelProps {
    params: ACOParams;
    onChange: (p: ACOParams) => void;
    disabled: boolean;
    dark: boolean;
}

interface RowProps {
    label: string;
    symbol: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format?: (v: number) => string;
    onChange: (v: number) => void;
    disabled: boolean;
    dark: boolean;
}

const Row: React.FC<RowProps> = ({
    label,
    symbol,
    value,
    min,
    max,
    step,
    format,
    onChange,
    disabled,
    dark,
}) => {
    const dim = dark ? "#555" : "#999";
    const fg = dark ? "#eee" : "#111";
    const bd = dark ? "#2a2a2a" : "#ebebeb";
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "96px 1fr 40px",
                gap: "8px",
                alignItems: "center",
                opacity: disabled ? 0.4 : 1,
                pointerEvents: disabled ? "none" : "auto",
            }}
        >
            <div
                style={{ display: "flex", gap: "4px", alignItems: "baseline" }}
            >
                <span style={{ fontSize: "11px", color: fg }}>{label}</span>
                <span style={{ fontSize: "10px", color: dim }}>({symbol})</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <span
                style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: fg,
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                    background: dark ? "#1c1c1c" : "#f4f4f4",
                    border: `1px solid ${bd}`,
                    borderRadius: "4px",
                    padding: "1px 6px",
                    display: "block",
                }}
            >
                {format ? format(value) : value}
            </span>
        </div>
    );
};

const ParamsPanel: React.FC<ParamsPanelProps> = ({
    params,
    onChange,
    disabled,
    dark,
}) => {
    const set = (k: keyof ACOParams) => (v: number) =>
        onChange({ ...params, [k]: v });
    const dim = dark ? "#555" : "#bbb";
    const bd = dark ? "#222" : "#e8e8e8";

    return (
        <div
            style={{
                borderTop: `1px solid ${bd}`,
                paddingTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            <span
                style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: dim,
                }}
            >
                Parameters
            </span>
            <Row
                label="Ants"
                symbol="n"
                value={params.numAnts}
                min={1}
                max={50}
                step={1}
                onChange={set("numAnts")}
                disabled={disabled}
                dark={dark}
            />
            <Row
                label="Pheromone"
                symbol="α"
                value={params.alpha}
                min={0}
                max={5}
                step={0.1}
                onChange={set("alpha")}
                format={(v) => v.toFixed(1)}
                disabled={disabled}
                dark={dark}
            />
            <Row
                label="Distance"
                symbol="β"
                value={params.beta}
                min={0}
                max={10}
                step={0.1}
                onChange={set("beta")}
                format={(v) => v.toFixed(1)}
                disabled={disabled}
                dark={dark}
            />
            <Row
                label="Evaporation"
                symbol="ρ"
                value={params.evaporationRate}
                min={0.01}
                max={0.99}
                step={0.01}
                onChange={set("evaporationRate")}
                format={(v) => v.toFixed(2)}
                disabled={disabled}
                dark={dark}
            />
            <Row
                label="Deposit"
                symbol="Q"
                value={params.Q}
                min={1}
                max={1000}
                step={1}
                onChange={set("Q")}
                disabled={disabled}
                dark={dark}
            />
            <Row
                label="Init pheromone"
                symbol="τ₀"
                value={params.initialPheromone}
                min={0.01}
                max={5}
                step={0.01}
                onChange={set("initialPheromone")}
                format={(v) => v.toFixed(2)}
                disabled={disabled}
                dark={dark}
            />
        </div>
    );
};

export default ParamsPanel;
