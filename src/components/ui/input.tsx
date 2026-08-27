import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10.5 w-full min-w-0 rounded-xl border border-input bg-card/70 px-3.5 py-2 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_1px_rgba(15,23,42,0.015)] transition-[color,box-shadow,border-color] duration-200 outline-none selection:bg-primary/20 selection:text-primary-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted-foreground/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary/50 focus-visible:ring-primary/15 focus-visible:ring-[5px] bg-white',
        'aria-invalid:border-destructive/60 aria-invalid:ring-destructive/10 aria-invalid:focus:ring-destructive/20',
        'hover:border-muted-foreground/25',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
