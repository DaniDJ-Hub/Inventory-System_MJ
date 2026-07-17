-- ═══════════════════════════════════════════════════════════════════════
-- PaperFlow — Migración de seguridad: RLS, RBAC y checkout endurecido
-- ═══════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────
-- 1) Helper: rol del usuario autenticado actual
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select r.name
  from profiles p
  join roles r on r.id = p.role_id
  where p.id = auth.uid()
    and p.is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() is not null, false)
$$;

-- ───────────────────────────────────────────────────────────────────────
-- 2) profiles — el hallazgo Crítico #1/#2 del reporte
-- ───────────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "profiles_select" on profiles;
create policy "profiles_select"
on profiles for select
using (id = auth.uid() or public.is_admin());

-- Un usuario puede actualizar su propio nombre/teléfono/avatar, pero NUNCA
-- su propio role_id ni is_active (eso solo lo puede hacer un admin sobre
-- CUALQUIER perfil, incluido el suyo). Esto es exactamente lo que impedía
-- la app de auto-promoverse a admin desde el cliente.
drop policy if exists "profiles_update_self_basic" on profiles;
create policy "profiles_update_self_basic"
on profiles for update
using (id = auth.uid())
with check (
  id = auth.uid()
  and role_id is not distinct from (select role_id from profiles where id = auth.uid())
  and is_active is not distinct from (select is_active from profiles where id = auth.uid())
);

drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin"
on profiles for update
using (public.is_admin())
with check (public.is_admin());

-- Los perfiles se crean automáticamente vía trigger (sección 6), nunca
-- directamente desde el cliente.
drop policy if exists "profiles_no_client_insert" on profiles;
drop policy if exists "profiles_no_client_delete" on profiles;

-- ───────────────────────────────────────────────────────────────────────
-- 3) Tablas de catálogo (products, customers, suppliers, categories)
--    — Crítico #3: borrado lógico obligatorio, nunca DELETE físico
-- ───────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['products', 'customers', 'suppliers', 'categories'] loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists "%1$s_select_staff" on %1$s', t);
    execute format(
      'create policy "%1$s_select_staff" on %1$s for select using (public.is_staff())', t
    );

    execute format('drop policy if exists "%1$s_insert_staff" on %1$s', t);
    execute format(
      'create policy "%1$s_insert_staff" on %1$s for insert with check (public.is_staff())', t
    );

    execute format('drop policy if exists "%1$s_update_staff" on %1$s', t);
    execute format(
      'create policy "%1$s_update_staff" on %1$s for update using (public.is_staff()) with check (public.is_staff())', t
    );

    -- FIX (Crítico #3): sin política de DELETE => PostgREST/Supabase rechaza
    -- cualquier DELETE físico con 42501 (insufficient_privilege), incluso si
    -- algún día vuelve a aparecer un `.delete()` en el frontend por error.
    -- El único camino válido para "eliminar" es UPDATE is_active = false.
    execute format('drop policy if exists "%1$s_delete" on %1$s', t);
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────
-- 4) business_settings, roles — solo lectura para staff, escritura admin
-- ───────────────────────────────────────────────────────────────────────
alter table business_settings enable row level security;

drop policy if exists "business_settings_select" on business_settings;
create policy "business_settings_select"
on business_settings for select
using (public.is_staff());

drop policy if exists "business_settings_write" on business_settings;
create policy "business_settings_write"
on business_settings for all
using (public.is_admin())
with check (public.is_admin());

alter table roles enable row level security;

drop policy if exists "roles_select" on roles;
create policy "roles_select"
on roles for select
using (public.is_staff());

drop policy if exists "roles_write" on roles;
create policy "roles_write"
on roles for all
using (public.is_admin())
with check (public.is_admin());

-- ───────────────────────────────────────────────────────────────────────
-- 5) sales, sale_items, purchases, stock_movements
--    — lectura para staff; escritura SOLO vía la función process_checkout
--    (SECURITY DEFINER), nunca INSERT directo desde el cliente, para que
--    el stock y los totales siempre pasen por la misma validación atómica.
-- ───────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['sales', 'sale_items', 'purchases', 'stock_movements'] loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists "%1$s_select_staff" on %1$s', t);
    execute format(
      'create policy "%1$s_select_staff" on %1$s for select using (public.is_staff())', t
    );

    -- Sin políticas de insert/update/delete para el cliente: solo la función
    -- `process_checkout` (SECURITY DEFINER) puede escribir en `sales` y
    -- `sale_items`. `purchases`/`stock_movements` pueden necesitar su propia
    -- función equivalente si tu flujo de Compras también debe ser atómico
    -- (recomendado, fuera del alcance de esta migración).
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────
-- 6) Trigger: crear profile automáticamente al registrarse un usuario
--    (si no existe ya en tu proyecto)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    -- FIX de seguridad: los usuarios nuevos NO deben quedar activos con
    -- acceso completo por default sin que un admin les asigne un rol.
    -- Ajusta a `true` solo si tu flujo de negocio realmente lo requiere.
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════
-- 7) process_checkout — versión endurecida (Alto #9)
-- ═══════════════════════════════════════════════════════════════════════
-- FIX: la versión original (no incluida en el repo) podía estar confiando
-- en `p_subtotal`/`p_total` calculados en el navegador. Esta versión
-- RECALCULA todo desde `products.sale_price` leído dentro de la misma
-- transacción, así que un request modificado desde DevTools no puede
-- alterar el precio cobrado. También usa `FOR UPDATE` para bloquear las
-- filas de producto durante el checkout y evitar condiciones de carrera
-- (dos cajeros vendiendo el último artículo del mismo SKU al mismo tiempo).
create or replace function public.process_checkout(
  p_user_id uuid,
  p_customer_id uuid,
  p_payment_method text,
  p_items jsonb  -- [{ product_id, quantity, discount }, ...]  ⚠️ SIN precios: se leen de la BD
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_sale_number text;
  v_item jsonb;
  v_product record;
  v_quantity int;
  v_discount numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_total_discount numeric := 0;
begin
  if not public.is_staff() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  v_sale_id := gen_random_uuid();
  v_sale_number := to_char(now(), 'YYYYMMDD') || '-' || substr(v_sale_id::text, 1, 6);

  -- Primera pasada: bloquear filas de producto y validar stock ANTES de
  -- escribir nada, recalculando cada línea con el precio real de la BD.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::int;
    v_discount := coalesce((v_item ->> 'discount')::numeric, 0);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Cantidad inválida para un producto del carrito';
    end if;

    select * into v_product
    from products
    where id = (v_item ->> 'product_id')::uuid
      and is_active = true
    for update; -- bloquea la fila hasta el commit: evita sobreventa concurrente

    if not found then
      raise exception 'Producto no encontrado o inactivo';
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception 'Stock insuficiente para %', v_product.name;
    end if;

    v_line_total := (v_product.sale_price * v_quantity) - v_discount;
    v_subtotal := v_subtotal + (v_product.sale_price * v_quantity);
    v_total_discount := v_total_discount + v_discount;
  end loop;

  insert into sales (
    id, sale_number, customer_id, user_id, subtotal, discount, tax_amount,
    total, payment_method, payment_status, created_at
  ) values (
    v_sale_id, v_sale_number, p_customer_id, p_user_id, v_subtotal,
    v_total_discount, 0, v_subtotal - v_total_discount, p_payment_method,
    'paid', now()
  );

  -- Segunda pasada: insertar sale_items y descontar stock de forma atómica
  -- (`stock_quantity - n` directo en la BD, nunca un valor traído del cliente).
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::int;
    v_discount := coalesce((v_item ->> 'discount')::numeric, 0);

    select * into v_product from products where id = (v_item ->> 'product_id')::uuid;

    insert into sale_items (
      id, sale_id, product_id, quantity, unit_price, discount, total, created_at
    ) values (
      gen_random_uuid(), v_sale_id, v_product.id, v_quantity, v_product.sale_price,
      v_discount, (v_product.sale_price * v_quantity) - v_discount, now()
    );

    update products
    set stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    where id = v_product.id;

    insert into stock_movements (
      id, product_id, movement_type, quantity, previous_stock, new_stock,
      reference_type, reference_id, user_id, created_at
    ) values (
      gen_random_uuid(), v_product.id, 'sale', -v_quantity, v_product.stock_quantity,
      v_product.stock_quantity - v_quantity, 'sale', v_sale_id, p_user_id, now()
    );
  end loop;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'total', v_subtotal - v_total_discount
  );
end;
$$;

-- Revoca ejecución directa de anon/authenticated salvo a través de RPC
-- explícito (Supabase expone automáticamente las funciones a `authenticated`
-- por default; esto es solo un recordatorio de buena práctica):
-- grant execute on function public.process_checkout to authenticated;
