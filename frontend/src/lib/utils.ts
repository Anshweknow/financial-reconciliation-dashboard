import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const money = (v?: number | null, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v ?? 0);
export const statusLabel = (s: string) => s.split('_').join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
