import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
export const Card=({className,...p}:HTMLAttributes<HTMLDivElement>)=><div className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm',className)} {...p}/>;
