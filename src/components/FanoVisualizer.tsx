import React, { useState } from "react";
import { OctonionVariation } from "../types";

interface FanoVisualizerProps {
  variation: OctonionVariation;
  onSelectNode?: (nodeIndex: number) => void;
}

export default function FanoVisualizer({ variation, onSelectNode }: FanoVisualizerProps) {
  const { fanoPlane, orientations, isomorphism, table } = variation;

  // State to track hovered elements for highlighting
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  // Standard geometric coordinate positions (1-indexed matching position numbers)
  const positionCoords: Record<number, { x: number; y: number; label: string }> = {
    1: { x: 200, y: 55, label: "P1 (Top)" },
    2: { x: 50, y: 315, label: "P2 (Bottom-Left)" },
    3: { x: 350, y: 315, label: "P3 (Bottom-Right)" },
    4: { x: 200, y: 315, label: "M1 (Bottom Mid)" },
    5: { x: 275, y: 185, label: "M2 (Right Mid)" },
    6: { x: 125, y: 185, label: "M3 (Left Mid)" },
    7: { x: 200, y: 228.33, label: "C (Center)" },
  };

  // Get coordinates for each of the 7 imaginary basis elements (e_1 to e_7)
  // element v (1..7) is at position pos = isomorphism[v - 1]
  const getNodeCoords = (v: number) => {
    const pos = isomorphism[v - 1];
    return positionCoords[pos] || { x: 0, y: 0 };
  };

  // Standard lines mapping for rendering
  // We want to find which line in fanoPlane corresponds to which standard geometric line.
  // Standard geometric lines:
  // L1: {1, 6, 2} - Left Edge (P1 - M3 - P2)
  // L2: {2, 4, 3} - Bottom Edge (P2 - M1 - P3)
  // L3: {3, 5, 1} - Right Edge (P3 - M2 - P1)
  // L4: {1, 7, 4} - Vertical Altitude (P1 - C - M1)
  // L5: {2, 7, 5} - Diagonal Altitude (P2 - C - M2)
  // L6: {3, 7, 6} - Diagonal Altitude (P3 - C - M3)
  // L7: {4, 5, 6} - Inner Circle (M1 - M2 - M3)
  
  const getGeometricLineInfo = (lineIndex: number) => {
    const triple = fanoPlane[lineIndex]; // e.g. [u, v, w]
    const sortedMapped = triple.map(v => isomorphism[v - 1]).sort((a, b) => a - b);
    const key = sortedMapped.join(",");

    let type: "left" | "bottom" | "right" | "vertical" | "diagonal-left" | "diagonal-right" | "circle" = "left";
    let pStart = { x: 0, y: 0 };
    let pEnd = { x: 0, y: 0 };

    if (key === "1,2,6") {
      type = "left";
      pStart = positionCoords[1]; // P1
      pEnd = positionCoords[2];   // P2
    } else if (key === "2,3,4") {
      type = "bottom";
      pStart = positionCoords[2]; // P2
      pEnd = positionCoords[3];   // P3
    } else if (key === "1,3,5") {
      type = "right";
      pStart = positionCoords[3]; // P3
      pEnd = positionCoords[1];   // P1
    } else if (key === "1,4,7") {
      type = "vertical";
      pStart = positionCoords[1]; // P1
      pEnd = positionCoords[4];   // M1
    } else if (key === "2,5,7") {
      type = "diagonal-left";
      pStart = positionCoords[2]; // P2
      pEnd = positionCoords[5];   // M2
    } else if (key === "3,6,7") {
      type = "diagonal-right";
      pStart = positionCoords[3]; // P3
      pEnd = positionCoords[6];   // M3
    } else if (key === "4,5,6") {
      type = "circle";
    }

    // Determine orientation direction
    // Let's find the cyclic order of the actual triple elements.
    // If sign of line is 1, order is a -> b -> c -> a
    // If sign of line is -1, order is a -> c -> b -> a
    const [a, b, c] = triple;
    const orient = orientations[lineIndex];
    
    // We want to see how the cyclic order maps to the geometric positions
    const posA = isomorphism[a - 1];
    const posB = isomorphism[b - 1];
    const posC = isomorphism[c - 1];

    let isForward = true; // Forward geometric direction
    // Let's check for each type what "forward" means:
    if (type === "left") {
      // Forward: P1 -> M3 -> P2, i.e., pos 1 -> 6 -> 2
      // Let's trace if a -> b -> c -> a order matches 1 -> 6 -> 2
      // We can check if posA -> posB is a step in 1 -> 6 -> 2 -> 1
      isForward = checkCyclicOrder(posA, posB, posC, orient, [1, 6, 2]);
    } else if (type === "bottom") {
      // Forward: P2 -> M1 -> P3, i.e., pos 2 -> 4 -> 3
      isForward = checkCyclicOrder(posA, posB, posC, orient, [2, 4, 3]);
    } else if (type === "right") {
      // Forward: P3 -> M2 -> P1, i.e., pos 3 -> 5 -> 1
      isForward = checkCyclicOrder(posA, posB, posC, orient, [3, 5, 1]);
    } else if (type === "vertical") {
      // Forward: P1 -> C -> M1, i.e., pos 1 -> 7 -> 4
      isForward = checkCyclicOrder(posA, posB, posC, orient, [1, 7, 4]);
    } else if (type === "diagonal-left") {
      // Forward: P2 -> C -> M2, i.e., pos 2 -> 7 -> 5
      isForward = checkCyclicOrder(posA, posB, posC, orient, [2, 7, 5]);
    } else if (type === "diagonal-right") {
      // Forward: P3 -> C -> M3, i.e., pos 3 -> 7 -> 6
      isForward = checkCyclicOrder(posA, posB, posC, orient, [3, 7, 6]);
    } else if (type === "circle") {
      // Forward: M1 -> M2 -> M3 (Counterclockwise)
      isForward = checkCyclicOrder(posA, posB, posC, orient, [4, 5, 6]);
    }

    return { type, pStart, pEnd, isForward, triple };
  };

  // Helper to check if the oriented triple matches a target cyclic position list
  const checkCyclicOrder = (posA: number, posB: number, posC: number, orient: number, target: number[]): boolean => {
    // Determine the actual cyclic sequence based on orient
    // orient === 1 means A -> B -> C -> A
    // orient === -1 means A -> C -> B -> A
    const seq = orient === 1 ? [posA, posB, posC] : [posA, posC, posB];
    
    // Find if seq is a cyclic rotation of target
    const targetStr = target.join(",") + "," + target.join(",");
    const seqStr = seq.join(",");
    return targetStr.includes(seqStr);
  };

  // Draw arrow triangle
  const renderArrow = (mx: number, my: number, ux: number, uy: number, isActive: boolean) => {
    const tipX = mx + 8 * ux;
    const tipY = my + 8 * uy;
    const leftX = mx - 7 * ux - 5 * uy;
    const leftY = my - 7 * uy + 5 * ux;
    const rightX = mx - 7 * ux + 5 * uy;
    const rightY = my - 7 * uy - 5 * ux;

    return (
      <polygon
        points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
        className={`${
          isActive ? "fill-cyan-400" : "fill-slate-600 hover:fill-cyan-400"
        } transition-colors duration-150 cursor-pointer`}
      />
    );
  };

  // List of 7 basis nodes
  const nodes = [1, 2, 3, 4, 5, 6, 7];

  // Highlight rules
  const isNodeHighlighted = (v: number) => {
    if (hoveredNode === v) return true;
    if (hoveredLineIndex !== null) {
      return fanoPlane[hoveredLineIndex].includes(v);
    }
    return false;
  };

  const isLineHighlighted = (lineIndex: number) => {
    if (hoveredLineIndex === lineIndex) return true;
    if (hoveredNode !== null) {
      return fanoPlane[lineIndex].includes(hoveredNode);
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl w-full max-w-[420px]">
        {/* SVG Plane */}
        <svg
          viewBox="0 0 400 380"
          className="w-full h-auto select-none"
          id="fano-plane-svg"
        >
          {/* Gradients and Filters */}
          <defs>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nodeGlowActive" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Render 7 Lines */}
          {fanoPlane.map((_, idx) => {
            const info = getGeometricLineInfo(idx);
            const isActive = isLineHighlighted(idx);
            const strokeColor = isActive ? "stroke-cyan-400" : "stroke-slate-700";
            const strokeWidth = isActive ? "4" : "1.5";

            if (info.type === "circle") {
              // Draw inner circle
              const cx = 200;
              const cy = 228.33;
              const r = 86.6;

              // Top point of the circle is at (200, 228.33 - 86.6) = (200, 141.73)
              // Arrow points left if CCW (forward), right if CW (backward)
              const ux = info.isForward ? -1 : 1;
              const uy = 0;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredLineIndex(idx)}
                  onMouseLeave={() => setHoveredLineIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible thick line for easier hovering */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    className={`${strokeColor} transition-all duration-150`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isActive ? "none" : "4, 2"}
                  />
                  {/* Arrow at top */}
                  {renderArrow(200, 141.73, ux, uy, isActive)}
                </g>
              );
            } else {
              // Draw straight line segment
              const { x: x1, y: y1 } = info.pStart;
              const { x: x2, y: y2 } = info.pEnd;

              // Direction of segment
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = len > 0 ? dx / len : 0;
              const uy = len > 0 ? dy / len : 0;

              // Midpoint
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;

              // Arrow direction based on isForward
              const arrowUx = info.isForward ? ux : -ux;
              const arrowUy = info.isForward ? uy : -uy;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredLineIndex(idx)}
                  onMouseLeave={() => setHoveredLineIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible thick line for easier hovering */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth="14"
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={`${strokeColor} transition-all duration-150`}
                    strokeWidth={strokeWidth}
                  />
                  {/* Arrow at midpoint */}
                  {renderArrow(mx, my, arrowUx, arrowUy, isActive)}
                </g>
              );
            }
          })}

          {/* Render 7 Nodes */}
          {nodes.map(v => {
            const { x, y } = getNodeCoords(v);
            const isSel = isNodeHighlighted(v);
            const isHovered = hoveredNode === v;

            return (
              <g
                key={v}
                onMouseEnter={() => setHoveredNode(v)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode?.(v)}
                className="cursor-pointer group"
              >
                {/* Glow behind node */}
                <circle
                  cx={x}
                  cy={y}
                  r="30"
                  fill={`url(#${isSel ? "nodeGlowActive" : "nodeGlow"})`}
                  className="transition-opacity duration-200"
                />

                {/* Outer interactive circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSel ? "20" : "16"}
                  className={`${
                    isSel
                      ? "fill-cyan-500 stroke-cyan-200 stroke-2"
                      : v === 7
                      ? "fill-slate-900 stroke-pink-400 stroke-2 group-hover:stroke-cyan-400 group-hover:fill-slate-800"
                      : "fill-slate-900 stroke-cyan-500/60 stroke-2 group-hover:stroke-cyan-400 group-hover:fill-slate-800"
                  } transition-all duration-150`}
                />

                {/* Node Label (e_1 ... e_7) */}
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  className={`${
                    isSel
                      ? "fill-slate-950 font-bold"
                      : v === 7
                      ? "fill-pink-400 font-semibold"
                      : "fill-cyan-400 font-medium"
                  } text-xs font-mono transition-colors duration-150`}
                >
                  e{v}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover info overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md rounded-xl p-3 text-center text-xs border border-slate-800/80 font-mono">
          {hoveredNode !== null ? (
            <div className="text-cyan-400">
              Hovering <span className="font-bold">e_{hoveredNode}</span> (Imaginary Unit)
              <div className="text-[10px] text-slate-400 mt-1">
                Lines: {fanoPlane.map((t, i) => t.includes(hoveredNode) ? `L${i+1}` : null).filter(Boolean).join(", ")}
              </div>
            </div>
          ) : hoveredLineIndex !== null ? (
            <div className="text-cyan-400">
              Line <span className="font-bold">L{hoveredLineIndex + 1}</span>: {"{"}
              {fanoPlane[hoveredLineIndex].map(v => `e_${v}`).join(", ")}
              {"}"}
              <div className="text-[10px] text-slate-400 mt-1">
                Cyclic rule:{" "}
                {(() => {
                  const [a, b, c] = fanoPlane[hoveredLineIndex];
                  const s = orientations[hoveredLineIndex];
                  if (s === 1) {
                    return `e_${a} e_${b} = e_${c} | e_${b} e_${c} = e_${a} | e_${c} e_${a} = e_${b}`;
                  } else {
                    return `e_${a} e_${c} = e_${b} | e_${c} e_${b} = e_${a} | e_${b} e_${a} = e_${c}`;
                  }
                })()}
              </div>
            </div>
          ) : (
            <div className="text-slate-400">
              Hover over nodes or lines to trace multiplication rules
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
