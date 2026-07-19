import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-4',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
