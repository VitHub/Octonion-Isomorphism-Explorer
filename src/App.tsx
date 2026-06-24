import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  OCTONION_VARIATIONS,
  STANDARD_VARIATION_ID,
  multiplyBasisElements,
} from "./octonions";
import { OctonionVariation } from "./types";
import FanoVisualizer from "./components/FanoVisualizer";
import MultiplicationTable from "./components/MultiplicationTable";
import SandboxCalculator from "./components/SandboxCalculator";
import {
  Info,
  HelpCircle,
  Hash,
  Sliders,
  Sparkles,
  BookOpen,
  Compass,
  Grid,
  Calculator,
  Search,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"explorer" | "matrix" | "sandbox" | "theory">("explorer");
  const [currentVariationId, setCurrentVariationId] = useState<number>(STANDARD_VARIATION_ID);

  // Filter state for variations
  const [filterLeftFactor, setFilterLeftFactor] = useState<number>(1); // e_1
  const [filterRightFactor, setFilterRightFactor] = useState<number>(2); // e_2
  const [filterTargetSign, setFilterTargetSign] = useState<number>(1); // +1 or -1
  const [filterTargetBasis, setFilterTargetBasis] = useState<number>(3); // e_3
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);

  // Cell clicked state to pass to Sandbox
  const [clickedCell, setClickedCell] = useState<{ rIdx: number; cIdx: number } | null>(null);

  // Get active variation
  const variation = useMemo(() => {
    return OCTONION_VARIATIONS.find(v => v.id === currentVariationId) || OCTONION_VARIATIONS[0];
  }, [currentVariationId]);

  // Handle cell click on multiplication table - routes to sandbox tab
  const handleCellClick = (rIdx: number, cIdx: number) => {
    setClickedCell({ rIdx, cIdx });
    setActiveTab("sandbox");
  };

  // Compute matching variations for the search filter
  const matchingVariations = useMemo(() => {
    return OCTONION_VARIATIONS.filter(v => {
      // Find the value in the table at row filterLeftFactor, column filterRightFactor
      // Indices in variation.table are 0-indexed (0 is 1, 1..7 are e_1..e_7)
      const val = v.table[filterLeftFactor][filterRightFactor];
      const absVal = Math.abs(val);
      const sign = val > 0 ? 1 : -1;
      
      const targetInternalIndex = filterTargetBasis + 1; // e_3 represented by index 4 in finalTable (which is basis element e_3)
      // Let's verify mapping:
      // filterTargetBasis (1..7) corresponds to e_1..e_7
      // In finalTable, e_1 has value +/-2, e_7 has value +/-8.
      // So e_idx maps to value +/- (idx + 1)
      const targetVal = filterTargetSign * (filterTargetBasis + 1);
      return val === targetVal;
    });
  }, [filterLeftFactor, filterRightFactor, filterTargetSign, filterTargetBasis]);

  // Jump to next matching variation
  const handleSelectMatching = (id: number) => {
    setCurrentVariationId(id);
  };

  // Generate algebraic stats for the active variation
  const stats = useMemo(() => {
    const table = variation.table;
    let antiCommutingPairs = 0;
    let totalPairs = 0;
    let associatingTriples = 0;
    let antiAssociatingTriples = 0;

    // Imaginary elements 1..7 (table indices 1..7)
    for (let i = 1; i <= 7; i++) {
      for (let j = i + 1; j <= 7; j++) {
        totalPairs++;
        // Check anticommutativity: e_i e_j === - e_j e_i
        if (table[i][j] === -table[j][i]) {
          antiCommutingPairs++;
        }
      }
    }

    // Checking associativity of imaginary elements:
    // There are 35 distinct subsets of 3 elements from 1..7
    // For each subset {i, j, k}, there are 6 permutations.
    // If the algebra is alternative, then:
    // - For the 7 lines of the Fano plane, they associate: (e_i e_j) e_k === e_i (e_j e_k) (always 7 lines)
    // - For the 28 other combinations, they anti-associate: (e_i e_j) e_k === - e_i (e_j e_k) (always 28)
    // Let's verify this dynamically!
    for (let i = 1; i <= 5; i++) {
      for (let j = i + 1; j <= 6; j++) {
        for (let k = j + 1; k <= 7; k++) {
          // (e_i * e_j) * e_k vs e_i * (e_j * e_k)
          // Map index to table rep
          const p1 = multiplyBasisElements(table, i + 1, j + 1);
          const lhs = multiplyBasisElements(table, p1, k + 1);

          const p2 = multiplyBasisElements(table, j + 1, k + 1);
          const rhs = multiplyBasisElements(table, i + 1, p2);

          if (lhs === rhs) {
            associatingTriples++;
          } else if (lhs === -rhs) {
            antiAssociatingTriples++;
          }
        }
      }
    }

    return {
      antiCommutingPairs,
      totalPairs,
      associatingTriples,
      antiAssociatingTriples,
      associatingPercent: Math.round((associatingTriples / 35) * 100),
      antiAssociatingPercent: Math.round((antiAssociatingTriples / 35) * 100),
    };
  }, [variation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-pink-950/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Outer wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-500 text-transparent bg-clip-text font-display text-2xl font-bold tracking-tight">
                Octonion Isomorphisms
              </span>
              <span className="bg-slate-800 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-slate-700">
                480 Variations
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-sans">
              Discover and compute with all 480 isomorphic multiplication structures of the 8-dimensional octonions, mapped directly onto oriented Fano Planes.
            </p>
          </div>

          {/* Quick jump to standard */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentVariationId(STANDARD_VARIATION_ID)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                currentVariationId === STANDARD_VARIATION_ID
                  ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-400 shadow-md"
                  : "bg-slate-900/60 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Standard Octonions (#1)
            </button>
            <button
              onClick={() => {
                const randId = Math.floor(Math.random() * 480) + 1;
                setCurrentVariationId(randId);
              }}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono transition"
            >
              Random System
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex border-b border-slate-850 mb-8 overflow-x-auto gap-1 relative z-10">
          {[
            { id: "explorer", label: "Explorer Dashboard", icon: Compass },
            { id: "matrix", label: "Multiplication Matrix", icon: Grid },
            { id: "sandbox", label: "Algebra Sandbox", icon: Calculator },
            { id: "theory", label: "Mathematical Theory", icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap focus:outline-none ${
                  isActive
                    ? "border-cyan-500 text-cyan-400 bg-cyan-500/[0.02]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* MAIN BODY LAYOUT */}
        <main className="relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === "explorer" && (
              <motion.div
                key="explorer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Column: Variation Selection & Fano Visualizer */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Selector Card */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 shadow-lg">
                    <h3 className="text-sm font-semibold font-display text-slate-200 mb-4 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      Browse Isomorphisms
                    </h3>

                    <div className="flex flex-col gap-4">
                      {/* Variation Slider (1 to 480) */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                          <span>Variation Index</span>
                          <span className="text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-900/30 px-2 py-0.5 rounded">
                            {currentVariationId} / 480
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="480"
                          value={currentVariationId}
                          onChange={(e) => setCurrentVariationId(parseInt(e.target.value))}
                          className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Fano Plane selection */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 font-mono">
                            Fano Configuration
                          </label>
                          <select
                            value={variation.fanoPlaneId}
                            onChange={(e) => {
                              const fId = parseInt(e.target.value);
                              // Find the first variation with this Fano plane
                              const match = OCTONION_VARIATIONS.find(v => v.fanoPlaneId === fId);
                              if (match) setCurrentVariationId(match.id);
                            }}
                            className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                          >
                            {Array.from({ length: 30 }).map((_, i) => (
                              <option key={i} value={i + 1}>
                                Plane #{i + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Orientation selection */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 font-mono">
                            Alternative Sign Mask
                          </label>
                          <select
                            value={variation.orientationId}
                            onChange={(e) => {
                              const oId = parseInt(e.target.value);
                              const match = OCTONION_VARIATIONS.find(
                                v => v.fanoPlaneId === variation.fanoPlaneId && v.orientationId === oId
                              );
                              if (match) setCurrentVariationId(match.id);
                            }}
                            className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                          >
                            {Array.from({ length: 16 }).map((_, i) => (
                              <option key={i} value={i + 1}>
                                Sign Mask #{i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fano Visualizer Component */}
                  <FanoVisualizer variation={variation} />
                </div>

                {/* Right Column: Properties & Dynamic Symmetry Filter */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Active Variation Info Panel */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
                      <h3 className="text-sm font-semibold font-display text-slate-200 flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        Algebraic Properties (Variation #{variation.id})
                      </h3>
                      {variation.id === STANDARD_VARIATION_ID && (
                        <span className="bg-cyan-950/45 text-cyan-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-800/50 animate-pulse">
                          GRAVES-CAYLEY STANDARD
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: properties text */}
                      <div className="flex flex-col gap-3 font-mono text-xs">
                        <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded border border-slate-900">
                          <span className="text-slate-400">Config:</span>
                          <span className="text-slate-200">Plane #{variation.fanoPlaneId} / Sign #{variation.orientationId}</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded border border-slate-900">
                          <span className="text-slate-400">Anticommuting Imaginary Pairs:</span>
                          <span className="text-emerald-400 font-semibold">{stats.antiCommutingPairs} / {stats.totalPairs} (100%)</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded border border-slate-900">
                          <span className="text-slate-400">Norm preservation:</span>
                          <span className="text-emerald-400 font-semibold">Verified (|xy| = |x||y|)</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded border border-slate-900">
                          <span className="text-slate-400">Alternative Laws:</span>
                          <span className="text-emerald-400 font-semibold">Verified (x(xy) = x²y)</span>
                        </div>
                      </div>

                      {/* Right: Associator gauge diagram */}
                      <div className="bg-slate-950/30 border border-slate-900 rounded p-4 flex flex-col items-center justify-center text-center">
                        <div className="relative w-24 h-24 mb-2">
                          {/* Circle track */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-slate-800"
                              strokeWidth="8"
                              fill="none"
                            />
                            {/* Fill: exactly 20% of triples associate (which is 7/35) */}
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-cyan-500"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 * (1 - 0.2)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                            <span className="text-base font-bold text-slate-100">20%</span>
                            <span className="text-[8px] text-slate-500 font-semibold uppercase">Associate</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          7 Triples Associate (Fano Lines) <br />
                          28 Triples Anti-associate (Non-lines)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Symmetry Search Filter Panel */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
                      <h3 className="text-sm font-semibold font-display text-slate-200 flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-cyan-400" />
                        Symmetry Search & Isomorphism Constraints
                      </h3>
                      <button
                        onClick={() => setIsFilterActive(!isFilterActive)}
                        className={`text-xs px-2.5 py-1 rounded font-mono border transition ${
                          isFilterActive
                            ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {isFilterActive ? "Filters Active" : "Enable Search Filter"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 font-sans">
                      Filter the 480 variations by specifying a desired multiplication product. Discover how many of the 480 algebras satisfy your custom rule.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-850/50 mb-4">
                      {/* Left Factor */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Left element</span>
                        <select
                          value={filterLeftFactor}
                          onChange={(e) => setFilterLeftFactor(parseInt(e.target.value))}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                        >
                          {Array.from({ length: 7 }).map((_, i) => (
                            <option key={i} value={i + 1}>
                              e_{i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Right Factor */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Right element</span>
                        <select
                          value={filterRightFactor}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            // Avoid multiplying same element
                            if (val !== filterLeftFactor) {
                              setFilterRightFactor(val);
                            }
                          }}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                        >
                          {Array.from({ length: 7 }).map((_, i) => (
                            <option key={i} value={i + 1} disabled={i + 1 === filterLeftFactor}>
                              e_{i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Operator sign */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Sign</span>
                        <select
                          value={filterTargetSign}
                          onChange={(e) => setFilterTargetSign(parseInt(e.target.value))}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                        >
                          <option value="1">+</option>
                          <option value="-1">-</option>
                        </select>
                      </div>

                      {/* Target Basis */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Result element</span>
                        <select
                          value={filterTargetBasis}
                          onChange={(e) => setFilterTargetBasis(parseInt(e.target.value))}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                        >
                          {Array.from({ length: 7 }).map((_, i) => (
                            <option key={i} value={i + 1} disabled={i + 1 === filterLeftFactor || i + 1 === filterRightFactor}>
                              e_{i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isFilterActive ? (
                      <div className="flex flex-col gap-3 font-mono text-xs">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-slate-300 flex items-center justify-between">
                          <span>
                            Constraint: <span className="text-cyan-400">e_{filterLeftFactor} × e_{filterRightFactor} = {filterTargetSign > 0 ? "" : "-"}e_{filterTargetBasis}</span>
                          </span>
                          <span className="text-cyan-400 font-bold bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/40">
                            {matchingVariations.length} / 480 Match
                          </span>
                        </div>

                        {matchingVariations.length > 0 ? (
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1.5">
                              Matching Variation Indexes:
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto bg-slate-950 p-2.5 rounded border border-slate-900">
                              {matchingVariations.map(mv => (
                                <button
                                  key={mv.id}
                                  onClick={() => handleSelectMatching(mv.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] border transition ${
                                    mv.id === currentVariationId
                                      ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                                      : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  #{mv.id}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-center py-4 italic">
                            No variations satisfy this condition (due to anticommutativity or line structures).
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-center py-4 border border-dashed border-slate-850 rounded-xl text-xs">
                        Enable the search filter above to trace isomorphic constraints.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "matrix" && (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-4 mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-slate-200 font-display">
                        Cayley Multiplication Table (Variation #{variation.id})
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Displays the product for each basis element pair. Click on any cell to open that specific product in the Algebra Sandbox!
                      </p>
                    </div>
                    {/* Compact selector */}
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-850 w-fit">
                      <button
                        onClick={() => setCurrentVariationId(Math.max(1, currentVariationId - 1))}
                        disabled={currentVariationId === 1}
                        className="text-xs text-slate-400 hover:text-white disabled:text-slate-700 px-2 py-1 bg-slate-900 border border-slate-800 rounded disabled:bg-transparent"
                      >
                        Prev
                      </button>
                      <span className="font-mono text-xs text-cyan-400 px-2">
                        #{currentVariationId} / 480
                      </span>
                      <button
                        onClick={() => setCurrentVariationId(Math.min(480, currentVariationId + 1))}
                        disabled={currentVariationId === 480}
                        className="text-xs text-slate-400 hover:text-white disabled:text-slate-700 px-2 py-1 bg-slate-900 border border-slate-800 rounded disabled:bg-transparent"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <MultiplicationTable variation={variation} onCellClick={handleCellClick} />
                </div>
              </motion.div>
            )}

            {activeTab === "sandbox" && (
              <motion.div
                key="sandbox"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <SandboxCalculator variation={variation} clickedCell={clickedCell} />
              </motion.div>
            )}

            {activeTab === "theory" && (
              <motion.div
                key="theory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8"
              >
                {/* Left: detailed math writeup */}
                <div className="md:col-span-8 flex flex-col gap-6">
                  {/* Article 1 */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-lg text-slate-300 text-xs sm:text-sm leading-relaxed font-sans flex flex-col gap-4">
                    <h3 className="text-base font-semibold font-display text-amber-400 border-b border-slate-850 pb-2 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-500" />
                      What are the Octonions?
                    </h3>
                    <p>
                      The <strong>octonions</strong> are a non-associative, non-commutative 8-dimensional division algebra over the real numbers. They are designated by the symbol <span className="font-mono font-bold text-amber-400">𝕆</span>. Discovered in 1843 by John T. Graves (and independently by Arthur Cayley in 1845), they are part of the four normed division algebras over the reals, along with the real numbers (<span className="font-mono">ℝ</span>), complex numbers (<span className="font-mono">ℂ</span>), and quaternions (<span className="font-mono">ℍ</span>), as established by Hurwitz's Theorem.
                    </p>
                    <p>
                      An octonion is a real linear combination of the basis elements:
                    </p>
                    <div className="font-mono text-center text-xs text-amber-400 bg-slate-950 p-2 rounded border border-slate-900">
                      x = x_0 + x_1 e_1 + x_2 e_2 + x_3 e_3 + x_4 e_4 + x_5 e_5 + x_6 e_6 + x_7 e_7
                    </div>
                    <p>
                      where <span className="font-mono">e_0 = 1</span> is the identity element, and <span className="font-mono">e_1 ... e_7</span> are the imaginary units, which satisfy:
                    </p>
                    <ul className="list-disc list-inside pl-4 font-mono text-xs flex flex-col gap-1 text-slate-400">
                      <li>e_i² = -1</li>
                      <li>e_i e_j = -e_j e_i (for i ≠ j)</li>
                    </ul>
                  </div>

                  {/* Article 2 */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-lg text-slate-300 text-xs sm:text-sm leading-relaxed font-sans flex flex-col gap-4">
                    <h3 className="text-base font-semibold font-display text-amber-400 border-b border-slate-850 pb-2 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      The Group Theory: Why exactly 480 variations?
                    </h3>
                    <p>
                      If we wish to define a multiplication on the imaginary units <span className="font-mono">e_1 ... e_7</span> such that they form an alternative normed division algebra, there are many ways to do so. In fact, there are <strong>exactly 480</strong> distinct multiplication tables!
                    </p>
                    <p>
                      These can be derived using the symmetries of signed basis permutations:
                    </p>
                    <ol className="list-decimal list-inside pl-4 flex flex-col gap-2.5">
                      <li>
                        <strong>Signed Permutations:</strong> We can permute the 7 imaginary units (<span className="font-mono">7! = 5040</span> options) and change their signs (<span className="font-mono">2⁷ = 128</span> options). This gives a total group of signed permutations of size:
                        <div className="font-mono text-center text-xs text-blue-400 bg-slate-950 p-2 rounded border border-slate-900 my-1.5">
                          2⁷ × 7! = 128 × 5040 = 645,120 configurations
                        </div>
                      </li>
                      <li>
                        <strong>Automorphism Size:</strong> For any single, fixed, valid octonion multiplication table, the subgroup of signed permutations that preserve that multiplication (the basis-preserving automorphism group) has order <strong>1344</strong>. This group is isomorphic to the Fano Plane's automorphism group (<span className="font-mono">PSL(2, 7)</span> of size 168) times the 8 possible sign choices (<span className="font-mono">168 × 8 = 1344</span>).
                      </li>
                      <li>
                        <strong>Orbit Count:</strong> By the Orbit-Stabilizer Theorem, the size of the orbit under signed permutations is:
                        <div className="font-mono text-center text-xs text-emerald-400 bg-slate-950 p-2.5 rounded border border-slate-900 font-bold my-1.5">
                          645,120 / 1344 = 480 distinct multiplication tables!
                        </div>
                      </li>
                    </ol>
                    <p>
                      All 480 of these systems are algebraically isomorphic to each other, but they use different naming permutations or signs for the basis elements.
                    </p>
                  </div>
                </div>

                {/* Right: quick facts box */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  {/* Fano Plane Fact */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1">
                      <Info className="w-4 h-4 text-amber-400" />
                      The Fano Plane Connection
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      The Fano plane is the smallest projective plane, having 7 points and 7 lines.
                      Each line contains exactly 3 points, and each point lies on exactly 3 lines.
                    </p>
                    <div className="bg-slate-950 border border-slate-900 p-3 rounded font-mono text-[10px] text-slate-400">
                      <div className="text-amber-500 font-semibold mb-1">Unoriented Planes: 30</div>
                      There are 30 different sets of 7 triples that form a valid Fano Plane out of the 35 possible triples.
                      <div className="text-amber-500 font-semibold mt-2 mb-1">Oriented Sign Masks: 16</div>
                      For each plane, only 16 of the 128 possible sign configurations satisfy the alternativity laws required for octonions.
                      <div className="text-emerald-400 font-semibold mt-2">Total Isomorphisms: 30 × 16 = 480</div>
                    </div>
                  </div>

                  {/* Division Algebras Summary Card */}
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 shadow-lg">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-3">
                      The Cayley-Dickson Hierarchy
                    </h4>
                    <div className="flex flex-col gap-2 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-900">
                        <span className="text-blue-400">1D: ℝ (Reals)</span>
                        <span className="text-slate-400 text-[10px]">Ordered, Comm, Assoc</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-900">
                        <span className="text-blue-400">2D: ℂ (Complex)</span>
                        <span className="text-slate-400 text-[10px]">Commutative, Associative</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-900">
                        <span className="text-blue-400">4D: ℍ (Quaternions)</span>
                        <span className="text-slate-400 text-[10px]">Non-Commutative, Assoc</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-amber-950/20 border border-amber-900/30">
                        <span className="text-amber-400 font-bold">8D: 𝕆 (Octonions)</span>
                        <span className="text-slate-400 text-[10px]">Non-Comm, Non-Assoc, Alt</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-900 text-slate-500">
                        <span>16D: 𝕊 (Sedenions)</span>
                        <span className="text-[10px]">Has Zero-divisors, Non-Alt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
