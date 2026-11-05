import React from "react";
import { Plus, Trash2, Link, Flag, Target } from "lucide-react";
import type { Mode } from "../types";

interface ToolbarProps {
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    disabled: boolean;
    dark: boolean;
}

const MODES: { mode: Mode; label: string; icon: React.ReactNode }[] = [
    { mode: "add", label: "Add Nodes", icon: <Plus size={13} /> },
    { mode: "addEdge", label: "Add Edges", icon: <Link size={13} /> },
    { mode: "delete", label: "Delete", icon: <Trash2 size={13} /> },
    { mode: "selectStart", label: "Set Start", icon: <Flag size={13} /> },
    { mode: "selectEnd", label: "Set End", icon: <Target size={13} /> },
];

const Toolbar: React.FC<ToolbarProps> = ({
    mode,
    onModeChange,
    disabled,
    dark,
}) => {
    const bd = dark ? "#333" : "#ddd";
    const dim = dark ? "#777" : "#888";

    return (
        <div
            style={{
                display: "flex",
                border: `1px solid ${bd}`,
                borderRadius: "7px",
                overflow: "hidden",
                width: "fit-content",
            }}
        >
            {MODES.map((m, i) => {
                const active = mode === m.mode;
                return (
                    <button
                        key={m.mode}
                        onClick={() => onModeChange(m.mode)}
                        disabled={disabled}
                        title={m.label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 11px",
                            fontSize: "11px",
                            fontWeight: active ? 700 : 500,
                            fontFamily: "inherit",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.4 : 1,
                            borderRight:
                                i < MODES.length - 1
                                    ? `1px solid ${bd}`
                                    : "none",
                            border: "none",
                            background: active
                                ? dark
                                    ? "#eee"
                                    : "#111"
                                : "transparent",
                            color: active ? (dark ? "#111" : "#fff") : dim,
                            transition: "background 0.1s",
                        }}
                    >
                        {m.icon}
                        <span>{m.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default Toolbar;
