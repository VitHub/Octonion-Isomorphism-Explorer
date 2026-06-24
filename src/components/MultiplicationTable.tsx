import React, { useState } from "react";
import { OctonionVariation } from "../types";

interface MultiplicationTableProps {
  variation: OctonionVariation;
  onCellClick?: (leftIdx: number, rightIdx: number) => void;
}

export default function MultiplicationTable({ variation, onCellClick }: MultiplicationTableProps) {
  const { table } = variation;

  // Track hovered row and column for visual highlighting
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  // Format indices to e_i labels
  const getHeaderLabel = (idx: number) => {
    if (idx === 0) return "1";
    return (
      <span>
        e<sub>{idx}</sub>
      </span>
    );
  };

  const renderCellVal = (v: number) => {
    const absVal = Math.abs(v);
    const isNeg = v < 0;
    if (absVal === 1) {
      return (
        <span className={isNeg ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
          {isNeg ? "-1" : "1"}
        </span>
      );
    }
    const idx = absVal - 1;
    return (
      <span className={isNeg ? "text-pink-400 font-medium" : "text-cyan-400 font-medium"}>
        {isNeg ? "-" : ""}e<sub>{idx}</sub>
      </span>
    );
  };

  // Determine cell background colors for optimal contrast and readability
  const getCellBg = (r: number, c: number, v: number) => {
    const isHovered = hoveredRow === r || hoveredCol === c;
    const isExact = hoveredRow === r && hoveredCol === c;
    const absVal = Math.abs(v);
    const isNeg = v < 0;

    if (isExact) {
      return "bg-cyan-950/80 text-cyan-200 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]";
    }
    if (isHovered) {
      return "bg-slate-800/60";
    }

    // Subtly shade cells based on type
    if (absVal === 1) {
      return isNeg ? "bg-rose-950/20 hover:bg-rose-950/30" : "bg-emerald-950/20 hover:bg-emerald-950/30";
    }
    return isNeg ? "bg-pink-950/10 hover:bg-pink-950/25" : "bg-cyan-950/10 hover:bg-cyan-950/25";
  };

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <table className="w-full min-w-[500px] table-fixed border-collapse select-none">
          <thead>
            {/* Header row */}
            <tr>
              {/* Left-top corner cell */}
              <th className="w-12 h-10 border-b border-r border-slate-800 text-slate-500 font-mono text-xs text-center">
                ×
              </th>
              {Array.from({ length: 8 }).map((_, cIdx) => (
                <th
                  key={cIdx}
                  onMouseEnter={() => setHoveredCol(cIdx)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`h-10 border-b border-slate-800 text-slate-300 font-mono text-sm text-center transition-colors duration-100 ${
                    hoveredCol === cIdx ? "bg-slate-800 text-cyan-400" : ""
                  }`}
                >
                  {getHeaderLabel(cIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {/* Left header column */}
                <td
                  onMouseEnter={() => setHoveredRow(rIdx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`w-12 h-10 border-r border-slate-800 text-slate-300 font-mono text-sm text-center font-semibold transition-colors duration-100 ${
                    hoveredRow === rIdx ? "bg-slate-800 text-cyan-400" : ""
                  }`}
                >
                  {getHeaderLabel(rIdx)}
                </td>
                {/* Multiplication values */}
                {Array.from({ length: 8 }).map((_, cIdx) => {
                  const val = table[rIdx][cIdx];
                  return (
                    <td
                      key={cIdx}
                      onMouseEnter={() => {
                        setHoveredRow(rIdx);
                        setHoveredCol(cIdx);
                      }}
                      onMouseLeave={() => {
                        setHoveredRow(null);
                        setHoveredCol(null);
                      }}
                      onClick={() => onCellClick?.(rIdx, cIdx)}
                      className={`h-10 border border-slate-800/40 text-center font-mono text-sm cursor-pointer transition-all duration-100 ${getCellBg(
                        rIdx,
                        cIdx,
                        val
                      )}`}
                    >
                      {renderCellVal(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold">1</div>
          <span>Real Unit (1)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-[10px] text-rose-400 font-bold">-1</div>
          <span>Negative Real Unit (-1)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-[9px] text-cyan-400">e_i</div>
          <span>Positive Imaginary Unit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-pink-950/20 border border-pink-500/20 flex items-center justify-center text-[9px] text-pink-400">-e_i</div>
          <span>Negative Imaginary Unit</span>
        </div>
      </div>
    </div>
  );
}
