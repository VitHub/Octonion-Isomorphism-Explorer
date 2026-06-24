export type FanoPlane = number[][]; // 7 triples, each [a, b, c] with 1 <= a < b < c <= 7

export interface OctonionVariation {
  id: number;            // 1 to 480
  fanoPlaneId: number;   // 1 to 30
  orientationId: number; // 1 to 16
  fanoPlane: FanoPlane;
  orientations: number[]; // 7 elements, each +1 or -1
  isomorphism: number[];  // Permutation of [1..7] for drawing standard Fano plane
  table: number[][];      // 8x8 table, where values are signed integers:
                          // +1..+8 correspond to +e_0..+e_7 (with e_0 = 1)
                          // -1..-8 correspond to -e_0..-e_7 (with -e_0 = -1)
}

export interface OctonionElement {
  coefs: number[]; // Array of 8 coefficients for [1, e_1, e_2, e_3, e_4, e_5, e_6, e_7]
}
