import { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
export const Input=({className,...p}:InputHTMLAttributes<HTMLInputElement>)=><input className={cn('w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-4',className)} {...p}/>;
