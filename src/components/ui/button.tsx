import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13.5px] font-semibold tracking-tight transition-all duration-200 ease-out outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[4px] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_20px_-6px_rgba(249,115,22,0.45)] hover:brightness-105 hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_10px_28px_-8px_rgba(249,115,22,0.55)]',
        destructive:
          'bg-destructive text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_6px_20px_-6px_rgba(220,38,38,0.4)] hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/30 hover:bg-accent/60 hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost:
          'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-accent/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8.5 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-xl px-6 has-[>svg]:px-4 text-base',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-8.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
