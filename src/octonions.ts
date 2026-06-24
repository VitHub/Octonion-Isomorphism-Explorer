import { FanoPlane, OctonionVariation, OctonionElement } from "./types";

// 1. Generate all 35 possible triples (combinations of 3 elements from 1..7)
export const ALL_TRIPLES: number[][] = [];
for (let i = 1; i <= 5; i++) {
  for (let j = i + 1; j <= 6; j++) {
    for (let k = j + 1; k <= 7; k++) {
      ALL_TRIPLES.push([i, j, k]);
    }
  }
}

// 2. Generate all 30 unoriented Fano planes
export function generateFanoPlanes(): FanoPlane[] {
  const planes: FanoPlane[] = [];
  const current: FanoPlane = [];
  const pairMasks = Array.from({ length: 8 }, () => Array(8).fill(false));

  function backtrack(startIndex: number) {
    if (current.length === 7) {
      planes.push(current.map(t => [...t]));
      return;
    }
    for (let i = startIndex; i < 35; i++) {
      const [a, b, c] = ALL_TRIPLES[i];
      if (!pairMasks[a][b] && !pairMasks[b][c] && !pairMasks[a][c]) {
        // Set masks
        pairMasks[a][b] = pairMasks[b][a] = true;
        pairMasks[b][c] = pairMasks[c][b] = true;
        pairMasks[a][c] = pairMasks[c][a] = true;
        current.push(ALL_TRIPLES[i]);

        backtrack(i + 1);

        // Backtrack
        current.pop();
        pairMasks[a][b] = pairMasks[b][a] = false;
        pairMasks[b][c] = pairMasks[c][b] = false;
        pairMasks[a][c] = pairMasks[c][a] = false;
      }
    }
  }

  backtrack(0);
  return planes;
}

export const FANO_PLANES = generateFanoPlanes();

// 3. Find isomorphism between a given Fano plane and the standard geometric layout
// The standard geometric layout has the following 7 lines:
export const STANDARD_GEOMETRIC_LINES = [
  [1, 6, 2], // P1 - M3 - P2
  [2, 4, 3], // P2 - M1 - P3
  [3, 5, 1], // P3 - M2 - P1
  [1, 7, 4], // P1 - C  - M1
  [2, 7, 5], // P2 - C  - M2
  [3, 7, 6], // P3 - C  - M3
  [4, 5, 6]  // M1 - M2 - M3 (circle)
].map(line => [...line].sort((a, b) => a - b));

export function findFanoIsomorphism(fanoPlane: FanoPlane): number[] {
  // We search for a permutation p of 1..7 (represented as 0-indexed array where p[i] is the mapped value for i+1)
  // such that for every triple of fanoPlane, the sorted image is in STANDARD_GEOMETRIC_LINES.
  const stdSortedStrs = new Set(STANDARD_GEOMETRIC_LINES.map(l => l.join(",")));

  const p = [1, 2, 3, 4, 5, 6, 7];
  const used = Array(8).fill(false);
  const current: number[] = [];
  let result: number[] | null = null;

  function permute() {
    if (result) return;
    if (current.length === 7) {
      // Check if this permutation maps every line of fanoPlane to a standard geometric line
      let valid = true;
      for (const triple of fanoPlane) {
        const mapped = triple.map(v => current[v - 1]).sort((a, b) => a - b);
        if (!stdSortedStrs.has(mapped.join(","))) {
          valid = false;
          break;
        }
      }
      if (valid) {
        result = [...current];
      }
      return;
    }

    for (let i = 1; i <= 7; i++) {
      if (!used[i]) {
        used[i] = true;
        current.push(i);
        permute();
        current.pop();
        used[i] = false;
      }
    }
  }

  permute();
  return result || [1, 2, 3, 4, 5, 6, 7];
}

// 4. Precompute multiplication tables and variations
export function buildMultiplicationTable(fanoPlane: FanoPlane, orientations: number[]): number[][] {
  const table = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Helper for sign and abs
  const sgn = (v: number) => (v > 0 ? 1 : -1);

  // We index 1..8 for +e_0..+e_7 (with e_0 = 1, e_1..e_7 as imaginary units)
  // Let's populate the table: table[i][j] where i, j in 1..8
  for (let i = 1; i <= 8; i++) {
    for (let j = 1; j <= 8; j++) {
      if (i === 8) {
        table[i][j] = j;
        continue;
      }
      if (j === 8) {
        table[i][j] = i;
        continue;
      }
      if (i === j) {
        table[i][j] = -8; // e_i^2 = -1 (represented by -8)
        continue;
      }

      // Find the triple containing i and j
      let tripleIdx = -1;
      for (let idx = 0; idx < 7; idx++) {
        const t = fanoPlane[idx];
        if (t.includes(i) && t.includes(j)) {
          tripleIdx = idx;
          break;
        }
      }

      const [a, b, c] = fanoPlane[tripleIdx];
      const s = orientations[tripleIdx];

      let res = 0;
      if (s === 1) {
        if (i === a && j === b) res = c;
        else if (i === b && j === a) res = -c;
        else if (i === b && j === c) res = a;
        else if (i === c && j === b) res = -a;
        else if (i === c && j === a) res = b;
        else if (i === a && j === c) res = -b;
      } else {
        if (i === a && j === c) res = b;
        else if (i === c && j === a) res = -b;
        else if (i === c && j === b) res = a;
        else if (i === b && j === c) res = -a;
        else if (i === b && j === a) res = c;
        else if (i === a && j === b) res = -c;
      }
      table[i][j] = res;
    }
  }

  // Adjust table layout to return an 8x8 table corresponding to indices 0..7
  // where 0 = e_0 (1), 1 = e_1, ..., 7 = e_7
  // Our internal index 8 maps to 0 in output. Internal index 1..7 maps to 1..7.
  const finalTable = Array.from({ length: 8 }, () => Array(8).fill(0));
  const toFinal = (internalVal: number): number => {
    const absVal = Math.abs(internalVal);
    const s = sgn(internalVal);
    const finalAbs = absVal === 8 ? 1 : absVal + 1; // 8 becomes 1, 1..7 becomes 2..8
    return s * finalAbs;
  };

  const fromFinalIndex = (idx: number): number => {
    return idx === 0 ? 8 : idx;
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const ir = fromFinalIndex(r);
      const ic = fromFinalIndex(c);
      finalTable[r][c] = toFinal(table[ir][ic]);
    }
  }

  return finalTable;
}

// Check alternativity for a Fano plane and orientation
export function checkAlternativity(fanoPlane: FanoPlane, orientations: number[]): boolean {
  // We can construct the 8x8 table and check the alternative laws directly:
  // (x * x) * y = x * (x * y) and (y * x) * x = y * (x * x)
  // For basis elements, it's equivalent to:
  // For all distinct i, j, k in 1..7:
  // if {i, j, k} is a line, (e_i e_j) e_k = e_i (e_j e_k)
  // if {i, j, k} is not a line, (e_i e_j) e_k = - e_i (e_j e_k)
  
  // To avoid building full tables during the search, we can use a lightweight multiplication helper:
  const mult = (x: number, y: number): number => {
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const s = (x > 0 ? 1 : -1) * (y > 0 ? 1 : -1);
    if (absX === 8) return s * y;
    if (absY === 8) return s * x;
    if (absX === absY) return -s * 8;

    let tripleIdx = -1;
    for (let idx = 0; idx < 7; idx++) {
      const t = fanoPlane[idx];
      if (t.includes(absX) && t.includes(absY)) {
        tripleIdx = idx;
        break;
      }
    }
    if (tripleIdx === -1) return 0;

    const [a, b, c] = fanoPlane[tripleIdx];
    const orient = orientations[tripleIdx];

    if (orient === 1) {
      if (absX === a && absY === b) return s * c;
      if (absX === b && absY === a) return s * -c;
      if (absX === b && absY === c) return s * a;
      if (absX === c && absY === b) return s * -a;
      if (absX === c && absY === a) return s * b;
      if (absX === a && absY === c) return s * -b;
    } else {
      if (absX === a && absY === c) return s * b;
      if (absX === c && absY === a) return s * -b;
      if (absX === c && absY === b) return s * a;
      if (absX === b && absY === c) return s * -a;
      if (absX === b && absY === a) return s * c;
      if (absX === a && absY === b) return s * -c;
    }
    return 0;
  };

  // Check all distinct triples
  for (let i = 1; i <= 7; i++) {
    for (let j = i + 1; j <= 7; j++) {
      for (let k = j + 1; k <= 7; k++) {
        // Find if {i, j, k} is a line
        let isLine = false;
        for (let idx = 0; idx < 7; idx++) {
          const t = fanoPlane[idx];
          if (t.includes(i) && t.includes(j) && t.includes(k)) {
            isLine = true;
            break;
          }
        }

        // Check associativity in any order, e.g. (i * j) * k
        const lhs = mult(mult(i, j), k);
        const rhs = mult(i, mult(j, k));

        if (isLine) {
          if (lhs !== rhs) return false;
        } else {
          if (lhs !== -rhs) return false;
        }
      }
    }
  }

  return true;
}

// 5. Generate all 480 variations
export function generateAllVariations(): OctonionVariation[] {
  const variations: OctonionVariation[] = [];
  let count = 1;

  for (let fIdx = 0; fIdx < FANO_PLANES.length; fIdx++) {
    const fano = FANO_PLANES[fIdx];
    
    // An isomorphism for drawing
    const isomorphism = findFanoIsomorphism(fano);

    // There are 2^7 = 128 orientations of the 7 lines
    for (let oMask = 0; oMask < 128; oMask++) {
      const orientations = Array(7).fill(1);
      for (let bit = 0; bit < 7; bit++) {
        if ((oMask & (1 << bit)) !== 0) {
          orientations[bit] = -1;
        }
      }

      if (checkAlternativity(fano, orientations)) {
        const table = buildMultiplicationTable(fano, orientations);
        variations.push({
          id: count++,
          fanoPlaneId: fIdx + 1,
          orientationId: 0, // Will populate after
          fanoPlane: fano,
          orientations,
          isomorphism,
          table,
        });
      }
    }
  }

  // Set the orientation ID per Fano plane (1..16)
  const planeCounts: Record<number, number> = {};
  for (const v of variations) {
    if (!planeCounts[v.fanoPlaneId]) {
      planeCounts[v.fanoPlaneId] = 0;
    }
    planeCounts[v.fanoPlaneId]++;
    v.orientationId = planeCounts[v.fanoPlaneId];
  }

  return variations;
}

export const OCTONION_VARIATIONS = generateAllVariations();

// 6. Identify the standard Cayley-Graves octonions
// The standard octonions have triples:
// [1,2,3], [1,4,5], [1,7,6], [2,4,6], [2,5,7], [3,4,7], [3,6,5]
// If we look at their representation in our generated variations, we can find the one that matches.
export function findStandardVariationId(): number {
  // Let's find the variation whose multiplication table has:
  // e_1 * e_2 = e_3
  // e_1 * e_4 = e_5
  // e_1 * e_7 = e_6  => which means e_1 * e_6 = -e_7
  // e_2 * e_4 = e_6
  // e_2 * e_5 = e_7
  // e_3 * e_4 = e_7
  // e_3 * e_6 = e_5  => which means e_3 * e_5 = -e_6
  
  // Note: our table representation is:
  // Index 0: 1
  // Index 1..7: e_1..e_7
  // Table values: signed integer where abs(v) - 1 is basis index, sign is sign.
  // E.g., e_1 (index 1) * e_2 (index 2) should yield e_3 (index 3, represented as +4)
  for (const v of OCTONION_VARIATIONS) {
    const table = v.table;
    // Check e_1 * e_2 === +e_3 (index 3 is represented as +4)
    if (table[1][2] !== 4) continue;
    // Check e_1 * e_4 === +e_5 (index 5 is represented as +6)
    if (table[1][4] !== 6) continue;
    // Check e_1 * e_6 === -e_7 (index 7 is represented as -8)
    if (table[1][6] !== -8) continue;
    // Check e_2 * e_4 === +e_6 (index 6 is represented as +7)
    if (table[2][4] !== 7) continue;
    // Check e_2 * e_5 === +e_7 (index 7 is represented as +8)
    if (table[2][5] !== 8) continue;
    // Check e_3 * e_4 === +e_7 (index 7 is represented as +8)
    if (table[3][4] !== 8) continue;
    // Check e_3 * e_5 === -e_6 (index 6 is represented as -7)
    if (table[3][5] !== -7) continue;
    
    return v.id; // Found it!
  }
  return 1; // Fallback
}

export const STANDARD_VARIATION_ID = findStandardVariationId();

// Helper to multiply two basis elements (represented as final indexes 1..8, -1..-8)
export function multiplyBasisElements(table: number[][], x: number, y: number): number {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  const sgn = (x > 0 ? 1 : -1) * (y > 0 ? 1 : -1);

  // Map 1..8 back to table indexes 0..7
  const r = absX - 1;
  const c = absY - 1;

  const tableVal = table[r][c];
  return sgn * tableVal;
}

// Helper to multiply two general octonions
export function multiplyOctonions(table: number[][], a: OctonionElement, b: OctonionElement): OctonionElement {
  const resultCoefs = Array(8).fill(0);

  for (let i = 0; i < 8; i++) {
    const coefA = a.coefs[i];
    if (coefA === 0) continue;

    for (let j = 0; j < 8; j++) {
      const coefB = b.coefs[j];
      if (coefB === 0) continue;

      // Basis multiplication: e_i * e_j
      // Map index i (0..7) to signed representation (1..8)
      const valI = i + 1;
      const valJ = j + 1;

      const productBasis = multiplyBasisElements(table, valI, valJ);
      const productAbs = Math.abs(productBasis);
      const productSgn = productBasis > 0 ? 1 : -1;

      // Map back to index (0..7)
      const k = productAbs - 1;
      resultCoefs[k] += coefA * coefB * productSgn;
    }
  }

  return { coefs: resultCoefs };
}

// Format an octonion beautifully as HTML/text
export function formatOctonion(oct: OctonionElement): string {
  const parts: string[] = [];
  
  // Real part
  if (oct.coefs[0] !== 0) {
    parts.push(`${oct.coefs[0]}`);
  }

  // Imaginary parts
  for (let i = 1; i < 8; i++) {
    const c = oct.coefs[i];
    if (c === 0) continue;

    const sign = c > 0 ? (parts.length > 0 ? "+ " : "") : "- ";
    const absVal = Math.abs(c);
    const valStr = absVal === 1 ? "" : `${absVal}`;

    parts.push(`${sign}${valStr}e_${i}`);
  }

  if (parts.length === 0) return "0";
  return parts.join(" ").replace(/\s\+\s-/g, " - ");
}
