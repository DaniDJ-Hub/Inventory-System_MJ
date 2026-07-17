import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
  PaperFlow badge — pill shape, colored tones, dot variant.
*/

const badgeVariants = cva(
  [
    'inline-flex items-center gap-[5px] whitespace-nowrap shrink-0',
    'font-[560] tracking-[0.01em] rounded-full',
    'border transition-colors',
    'text-[11.5px] h-[22px] px-[9px]',
  ],
  {
    variants: {
      variant: {
        default:     'text-[var(--text-2)] bg-white/[0.04] border-[var(--line-strong)]',
        blue:        'text-[var(--blue-soft)] bg-[var(--blue-ghost)] border-[rgba(79,134,255,0.3)]',
        green:       'text-[var(--green)] bg-[var(--green-ghost)] border-[rgba(47,208,122,0.3)]',
        amber:       'text-[var(--amber)] bg-[var(--amber-ghost)] border-[rgba(245,181,61,0.3)]',
        destructive: 'text-[var(--red)] bg-[var(--red-ghost)] border-[rgba(255,93,108,0.32)]',
        // shadcn compat
        secondary: 'text-[var(--text-muted)] bg-[var(--ink-750)] border-[var(--line)]',
        outline:   'text-[var(--text)] bg-transparent border-[var(--line-strong)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  dot,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    dot?: boolean
  }) {
  const Comp = asChild ? Slot : 'span'
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'currentColor',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {props.children}
    </Comp>
  )
}

export { Badge, badgeVariants }