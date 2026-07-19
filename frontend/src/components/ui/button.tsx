import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
export function Button({ className, variant='primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'danger' }) {
 const v={primary:'bg-primary text-primary-foreground hover:opacity-90',secondary:'bg-muted text-foreground hover:bg-muted/80',ghost:'hover:bg-muted',danger:'bg-destructive text-destructive-foreground'}[variant];
 return <button className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',v,className)} {...props}/>;
}
