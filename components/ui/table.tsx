'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/*
  PaperFlow table — dark surfaces, uppercase column headers,
  subtle row hover, monospaced numeric alignment.

  NOTA: el hover y la cebra de filas ahora se manejan por CSS
  (clases .pf-table-row) en vez de onMouseEnter/onMouseLeave,
  para que globals.css pueda controlarlos sin ser pisado por
  estilos inline en cada evento de mouse.
*/

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom', className)}
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontFamily: 'var(--font)',
        }}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn(className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('font-medium [&>tr]:last:border-b-0', className)}
      style={{ borderTop: '1px solid var(--line)' }}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('pf-table-row transition-colors', className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'sticky top-0 text-left align-middle whitespace-nowrap',
        '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      style={{
        fontSize: 11.5,
        fontWeight: 680,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--table-header-text)',
        padding: '13px 16px',
        borderBottom: '2px solid var(--table-header-accent)',
        background: 'var(--table-header-bg)',
        zIndex: 1,
      }}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'align-middle whitespace-nowrap',
        '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      style={{
        padding: 'calc(13px * var(--density)) 16px',
        fontSize: 13.5,
        color: 'var(--text-2)',
        verticalAlign: 'middle',
      }}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm', className)}
      style={{ color: 'var(--text-muted)' }}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}