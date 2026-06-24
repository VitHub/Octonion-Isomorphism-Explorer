import React, { useState, useEffect } from "react";
import { OctonionVariation, OctonionElement } from "../types";
import { multiplyOctonions, formatOctonion, multiplyBasisElements } from "../octonions";
import { Plus, Minus, RotateCcw, HelpCircle } from "lucide-react";

interface SandboxCalculatorProps {
  variation: OctonionVariation;
  clickedCell?: { rIdx: number; cIdx: number } | null;
}

const PRESETS = [
  { name: "Basis e_1", coefs: [0, 1, 0, 0, 0, 0, 0, 0] },
  { name: "Basis e_2", coefs: [0, 0, 1, 0, 0, 0, 0, 0] },
  { name: "Basis e_4", coefs: [0, 0, 0, 0, 1, 0, 0, 0] },
  { name: "Complex-like (1 + e_1)", coefs: [1, 1, 0, 0, 0, 0, 0, 0] },
  { name: "Quaternion-like (e_1 + e_2)", coefs: [0, 1, 1, 0, 0, 0, 0, 0] },
  { name: "Symmetric Sum (all 1s)", coefs: [1, 1, 1, 1, 1, 1, 1, 1] },
];

export default function SandboxCalculator({ variation, clickedCell }: SandboxCalculatorProps) {
  const [octA, setOctA] = useState<OctonionElement>({ coefs: [1, 0, 0, 0, 0, 0, 0, 0] });
  const [octB, setOctB] = useState<OctonionElement>({ coefs: [0, 1, 0, 0, 0, 0, 0, 0] });

  // Handle cell clicks from the multiplication table
  useEffect(() => {
    if (clickedCell) {
      const { rIdx, cIdx } = clickedCell;
      // Set A to pure basis e_rIdx
      const newA = Array(8).fill(0);
      newA[rIdx] = 1;
      setOctA({ coefs: newA });

      // Set B to pure basis e_cIdx
      const newB = Array(8).fill(0);
      newB[cIdx] = 1;
      setOctB({ coefs: newB });
    }
  }, [clickedCell]);

  const updateCoef = (target: "A" | "B", index: number, value: number) => {
    if (target === "A") {
      const newCoefs = [...octA.coefs];
      newCoefs[index] = value;
      setOctA({ coefs: newCoefs });
    } else {
      const newCoefs = [...octB.coefs];
      newCoefs[index] = value;
      setOctB({ coefs: newCoefs });
    }
  };

  const handleReset = () => {
    setOctA({ coefs: [1, 0, 0, 0, 0, 0, 0, 0] });
    setOctB({ coefs: [0, 1, 0, 0, 0, 0, 0, 0] });
  };

  const loadPreset = (target: "A" | "B", coefs: number[]) => {
    if (target === "A") {
      setOctA({ coefs: [...coefs] });
    } else {
      setOctB({ coefs: [...coefs] });
    }
  };

  const loadRandom = (target: "A" | "B") => {
    const randomCoefs = Array.from({ length: 8 }, () => {
      // Int between -3 and 3
      const val = Math.floor(Math.random() * 7) - 3;
      return val;
    });
    if (target === "A") {
      setOctA({ coefs: randomCoefs });
    } else {
      setOctB({ coefs: randomCoefs });
    }
  };

  // Compute product
  const product = multiplyOctonions(variation.table, octA, octB);

  // Generate detailed steps for multiplication
  const getMultiplicationSteps = () => {
    const steps: { termA: string; termB: string; productBasis: number; coef: number }[] = [];
    
    for (let i = 0; i < 8; i++) {
      const ca = octA.coefs[i];
      if (ca === 0) continue;

      for (let j = 0; j < 8; j++) {
        const cb = octB.coefs[j];
        if (cb === 0) continue;

        // basis indices are i+1, j+1 (signed rep: +1..+8)
        const valI = i + 1;
        const valJ = j + 1;
        const prodB = multiplyBasisElements(variation.table, valI, valJ);

        steps.push({
          termA: i === 0 ? `${ca}` : `${ca === 1 ? "" : ca === -1 ? "-" : ca}e_${i}`,
          termB: j === 0 ? `${cb}` : `${cb === 1 ? "" : cb === -1 ? "-" : cb}e_${j}`,
          productBasis: prodB,
          coef: ca * cb,
        });
      }
    }

    return steps;
  };

  const steps = getMultiplicationSteps();

  const getBasisLabel = (signedIndex: number) => {
    const absVal = Math.abs(signedIndex);
    const sign = signedIndex < 0 ? "-" : "";
    if (absVal === 1) return `${sign}1`;
    return (
      <span>
        {sign}e<sub>{absVal - 1}</sub>
      </span>
    );
  };

  // Group steps by result basis component (e_0 to e_7)
  const groupStepsByComponent = () => {
    const groups: Record<number, typeof steps> = {};
    for (let i = 1; i <= 8; i++) {
      groups[i] = [];
    }

    for (const step of steps) {
      const resAbs = Math.abs(step.productBasis);
      groups[resAbs].push(step);
    }

    return groups;
  };

  const groupedSteps = groupStepsByComponent();

  return (
    <div className="flex flex-col gap-6">
      {/* Octonions inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Octonion A */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h4 className="text-sm font-semibold text-cyan-400 font-mono">
              Octonion A (Left Factor)
            </h4>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  if (!isNaN(idx)) loadPreset("A", PRESETS[idx].coefs);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                defaultValue=""
              >
                <option value="" disabled>Presets...</option>
                {PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => loadRandom("A")}
                className="bg-cyan-950/40 border border-cyan-900 text-cyan-400 hover:bg-cyan-950 px-2 py-0.5 rounded text-xs transition font-mono"
              >
                Rand
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {octA.coefs.map((coef, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs text-slate-400">
                  {idx === 0 ? "Real" : (
                    <span>
                      e<sub>{idx}</sub>
                    </span>
                  )}
                </span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={coef}
                  onChange={(e) => updateCoef("A", idx, parseInt(e.target.value))}
                  className="flex-grow accent-cyan-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  value={coef}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) updateCoef("A", idx, v);
                  }}
                  className="w-12 bg-slate-950 border border-slate-850 rounded px-1 text-center font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 bg-slate-950/60 rounded p-2.5 border border-slate-850/40 font-mono text-xs text-slate-300 break-words">
            <span className="text-cyan-400 font-semibold">A = </span>
            {formatOctonion(octA)}
          </div>
        </div>

        {/* Octonion B */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h4 className="text-sm font-semibold text-pink-400 font-mono">
              Octonion B (Right Factor)
            </h4>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  if (!isNaN(idx)) loadPreset("B", PRESETS[idx].coefs);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-pink-500 font-mono"
                defaultValue=""
              >
                <option value="" disabled>Presets...</option>
                {PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => loadRandom("B")}
                className="bg-pink-950/40 border border-pink-900 text-pink-400 hover:bg-pink-950 px-2 py-0.5 rounded text-xs transition font-mono"
              >
                Rand
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {octB.coefs.map((coef, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs text-slate-400">
                  {idx === 0 ? "Real" : (
                    <span>
                      e<sub>{idx}</sub>
                    </span>
                  )}
                </span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={coef}
                  onChange={(e) => updateCoef("B", idx, parseInt(e.target.value))}
                  className="flex-grow accent-pink-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  value={coef}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) updateCoef("B", idx, v);
                  }}
                  className="w-12 bg-slate-950 border border-slate-850 rounded px-1 text-center font-mono text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 bg-slate-950/60 rounded p-2.5 border border-slate-850/40 font-mono text-xs text-slate-300 break-words">
            <span className="text-pink-400 font-semibold">B = </span>
            {formatOctonion(octB)}
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <button
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-300 transition p-1.5 rounded-lg hover:bg-slate-900"
            title="Reset to default (1 * e_1)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 font-mono mb-2">
          Algebraic Product
        </div>
        <div className="font-mono text-lg md:text-xl text-cyan-400 font-semibold mb-1 break-words">
          A × B = {formatOctonion(product)}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          calculated using Variation #{variation.id} (Fano Plane #{variation.fanoPlaneId}, Orientation #{variation.orientationId})
        </div>
      </div>

      {/* Step-by-step expansion details */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          Expansion Steps & Term Algebra
        </h4>

        {steps.length === 0 ? (
          <div className="text-sm text-slate-400 font-mono">
            Multiply non-zero elements to see detailed algebra.
          </div>
        ) : steps.length === 1 ? (
          // Simple single-term multiplication
          <div className="font-mono text-xs text-slate-300 flex flex-col gap-2 bg-slate-950 p-4 rounded-lg border border-slate-850">
            <div className="text-cyan-400 border-b border-slate-900 pb-2 mb-1">Single Product:</div>
            <div className="flex items-center gap-1.5">
              <span>({steps[0].termA}) × ({steps[0].termB})</span>
              <span>=</span>
              <span>
                {steps[0].coef} × (
                {getBasisLabel(steps[0].productBasis > 0 ? Math.abs(steps[0].productBasis) : -Math.abs(steps[0].productBasis))}
                )
              </span>
              <span>=</span>
              <span className="text-cyan-400 font-bold">
                {(() => {
                  const val = steps[0].coef * (steps[0].productBasis > 0 ? 1 : -1);
                  const basisAbs = Math.abs(steps[0].productBasis);
                  if (basisAbs === 1) return `${val}`;
                  const sign = val < 0 ? "-" : "";
                  const cStr = Math.abs(val) === 1 ? "" : `${Math.abs(val)}`;
                  return `${sign}${cStr}e_${basisAbs - 1}`;
                })()}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Note: Multiplication of basis elements is determined by the selected oriented line in the Fano Plane.
            </div>
          </div>
        ) : (
          // Comprehensive term-by-term expansion
          <div className="flex flex-col gap-4 font-mono text-xs">
            <div className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850">
              <span className="text-cyan-400">Total cross-multiplication:</span> {steps.length} terms generated.
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 pt-2 border-t border-slate-900">
                {steps.slice(0, 16).map((step, sIdx) => {
                  const finalSign = step.coef * (step.productBasis > 0 ? 1 : -1) > 0 ? "+" : "-";
                  const absVal = Math.abs(step.coef);
                  const basisAbs = Math.abs(step.productBasis);
                  const bStr = basisAbs === 1 ? "" : `e_${basisAbs - 1}`;
                  const valStr = absVal === 1 && basisAbs !== 1 ? "" : `${absVal}`;
                  return (
                    <div key={sIdx} className="text-slate-400 text-[11px]">
                      ({step.termA})·({step.termB}) = <span className="text-pink-400">{finalSign === "-" ? "-" : ""}{valStr}{bStr}</span>
                    </div>
                  );
                })}
                {steps.length > 16 && (
                  <div className="text-slate-500 text-[11px] self-end italic">
                    ...and {steps.length - 16} more terms.
                  </div>
                )}
              </div>
            </div>

            {/* Grouped results table */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
              <div className="text-cyan-400 border-b border-slate-900 pb-2 mb-3">
                Coefficient Aggregation (Grouped by Basis Element):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Array.from({ length: 8 }).map((_, bIdx) => {
                  const internalIndex = bIdx + 1; // 1 represents e_0 (1), 2..8 represent e_1..e_7
                  const matchingSteps = groupedSteps[internalIndex];
                  const basisLabel = bIdx === 0 ? "1" : `e_${bIdx}`;

                  if (matchingSteps.length === 0) return null;

                  return (
                    <div key={bIdx} className="flex flex-col gap-1 text-[11px] border-b border-slate-900/50 pb-2">
                      <div className="text-slate-300 font-bold flex items-center gap-1.5">
                        <span className="text-pink-400">{basisLabel} component:</span>
                        <span className="text-slate-500 text-[10px]">
                          ({matchingSteps.length} contributing term{matchingSteps.length > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="text-slate-400 overflow-x-auto whitespace-nowrap pl-2">
                        {matchingSteps.map((step, sIdx) => {
                          const netVal = step.coef * (step.productBasis > 0 ? 1 : -1);
                          const sign = netVal > 0 ? (sIdx > 0 ? "+ " : "") : "- ";
                          return (
                            <span key={sIdx}>
                              {sign}{Math.abs(netVal)}{" "}
                            </span>
                          );
                        })}
                        = <span className="text-emerald-400 font-bold">{product.coefs[bIdx]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
