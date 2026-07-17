import * as React from 'react'
import { cn } from '@/lib/utils'

/*
  PaperFlow card — dark surface with subtle gradient top edge,
  translucent border, and depth shadow.
*/

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('flex flex-col gap-0', className)}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0) 40%), var(--ink-850)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'inset 0 1px 0 var(--glass-hi), var(--sh-md)',
        position: 'relative',
        overflow: 'hidden',
      }}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1', className)}
      style={{ padding: 'var(--pad-card) var(--pad-card) 0' }}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none', className)}
      style={{ fontSize: 15, fontWeight: 620, color: 'var(--text)', letterSpacing: '-0.01em' }}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('', className)}
      style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('', className)}
      style={{ padding: 'var(--pad-card)' }}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center', className)}
      style={{
        padding: '14px var(--pad-card) var(--pad-card)',
        borderTop: '1px solid var(--line-soft)',
      }}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }