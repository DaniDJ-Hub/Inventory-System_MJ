import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
  PaperFlow button system — dark SaaS premium style.
  Maps directly to the design tokens in globals.css.
*/

const buttonVariants = cva(
  // Base
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium transition-all duration-150 select-none cursor-pointer',
    'disabled:pointer-events-none disabled:opacity-40',
    '[&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0',
    'outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--ink-900)]',
    'active:translate-y-px active:scale-[0.99]',
  ],
  {
    variants: {
      variant: {
        // Blue gradient — main CTA
        default: [
          'text-white',
          'bg-gradient-to-b from-[var(--blue-bright)] to-[var(--blue)]',
          'border border-white/16',
          'shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,var(--sh-blue)]',
          'hover:from-[#5e90ff] hover:to-[#3a73ff]',
          'hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_10px_34px_-8px_var(--blue-glow)]',
        ],
        // Subtle filled
        ghost: [
          'text-[var(--text-2)] bg-white/[0.03] border border-[var(--line)]',
          'hover:bg-white/[0.07] hover:text-[var(--text)] hover:border-[var(--line-strong)]',
        ],
        // Bordered transparent
        outline: [
          'text-[var(--text-2)] bg-transparent border border-[var(--line-strong)]',
          'hover:bg-white/[0.05] hover:text-[var(--text)]',
        ],
        // Completely transparent
        subtle: [
          'text-[var(--text-muted)] bg-transparent border border-transparent',
          'hover:bg-white/[0.05] hover:text-[var(--text)]',
        ],
        // Destructive
        destructive: [
          'text-[var(--red)] bg-transparent border border-transparent',
          'hover:bg-[var(--red-ghost)] hover:border-[var(--line)]',
        ],
        // shadcn compat aliases
        secondary: [
          'text-[var(--text-2)] bg-[var(--ink-750)] border border-[var(--line)]',
          'hover:bg-[var(--ink-700)] hover:text-[var(--text)]',
        ],
        link: 'text-[var(--blue-soft)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[38px] px-4 text-[13.5px] rounded-[var(--r-sm)]',
        sm:      'h-[32px] px-3 text-[12.5px] rounded-[var(--r-sm)] gap-1.5',
        lg:      'h-[50px] px-[22px] text-[15px] rounded-[var(--r-md)]',
        icon:    'size-[38px] rounded-[9px] p-0',
        'icon-sm': 'size-[32px] rounded-[8px] p-0',
        'icon-lg': 'size-[44px] rounded-[11px] p-0',
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