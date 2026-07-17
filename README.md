# PaperFlow — Sistema de Inventario y Punto de Venta

Sistema de inventario, punto de venta (POS) y gestión de negocio para papelerías, construido con **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** y **Supabase** (Postgres + Auth + RLS).

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Validación | Zod |
| Pruebas | Vitest |
| Despliegue | Vercel (recomendado) + Supabase |

## Arquitectura

La app usa Supabase directamente desde:
- **Server Components** (`app/dashboard/**/page.tsx`) para lecturas paginadas/filtradas, usando `lib/supabase/server.ts`.
- **Client Components** (`'use client'`) para mutaciones desde formularios, usando `lib/supabase/client.ts`.

No hay una API REST propia (salvo `/auth/callback`): toda la autorización real vive en **políticas RLS de Postgres** (ver `/supabase/migrations`) combinadas con guards de rol en el servidor (`lib/auth/require-role.ts`). Esto es intencional y es el patrón recomendado por Supabase, pero significa que **las migraciones SQL de este repo deben aplicarse en tu proyecto de Supabase** para que la app sea segura — ver más abajo.

## Primeros pasos

### 1. Requisitos
- Node.js 22+
- Una cuenta/proyecto de [Supabase](https://supabase.com)

### 2. Clonar e instalar

```bash
git clone <tu-fork>
cd papeleria-inventory-system_public
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (falla si hay errores de TypeScript) |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Pruebas unitarias (Vitest) |
| `npm run test:watch` | Pruebas en modo watch |

## Módulos

- **Dashboard** — KPIs, ventas de la semana, productos con stock bajo.
- **POS** (`/dashboard/pos`) — venta rápida con checkout transaccional atómico (`process_checkout`).
- **Productos / Categorías / Clientes / Proveedores** — CRUD con paginación server-side, búsqueda y borrado lógico.
- **Ventas / Compras** — historial.
- **Caja** (`/dashboard/caja`) — apertura/cierre de turno.
- **Reportes** — ventas por método de pago, top productos, ventas por categoría.
- **Configuración** — negocio, perfil, gestión de usuarios/roles (**solo admin**, protegido por `requireRole`).

## Seguridad — qué se corrigió y qué falta

Este proyecto pasó por una auditoría y una ronda de correcciones. Resumen del estado:

**Ya implementado en el código:**
- RBAC aplicado en el servidor para `/dashboard/configuracion` (`requireRole(['admin'])`).
- Borrado lógico (`is_active`) en vez de `DELETE` físico en productos, clientes, proveedores y categorías.
- Validación centralizada con Zod en todos los formularios de CRUD.
- Política de contraseñas reforzada (10+ caracteres, mayúscula, minúscula, número).
- Paginación y búsqueda server-side en listados grandes.
- Diálogos de confirmación accesibles (reemplazan `window.confirm`).
- Manejo de errores centralizado con mensajes específicos por código de Postgres.
- Rutas de recuperación de contraseña (`/auth/reset-password`, `/auth/update-password`, `/auth/error`).
- Error boundaries de Next.js (`app/error.tsx`, `app/not-found.tsx`).
- CI con lint + typecheck + tests + build en cada PR.

## Licencia

Proyecto personal.
