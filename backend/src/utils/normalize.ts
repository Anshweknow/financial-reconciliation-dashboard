export const normalizeOrderId = (value: string): string => value.trim().toUpperCase();
export const toCents = (value: number | string): number => Math.round(Number(value) * 100);
export const fromCents = (value: number): number => Number((value / 100).toFixed(2));
export const withinTolerance = (a: number, b: number, tolerance = 0.02): boolean => Math.abs(a - b) <= tolerance;
