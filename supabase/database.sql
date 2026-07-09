-- ARTEIA / Promova Profissional
-- Execute este arquivo no Supabase > SQL Editor.
-- Objetivo: corrigir tabelas, colunas, policies RLS, storage, avaliações e pagamentos.

create extension if not exists "pgcrypto";

-- =========================
-- TABELAS PRINCIPAIS
-- =========================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  cidade text,
  estado text,
  criado_em timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  tipo_arte text not null check (tipo_arte in ('DESENHO','ROSTO','COMBO')),
  valor numeric(10,2) not null default 0,
  nome_arte text,
  profissao text,
  telefone_arte text,
  cor_predominante text,
  servicos text,
  detalhes text,
  status text not null default 'novo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references public.pedidos(id) on delete cascade,
  forma_pagamento text default 'A_ESCOLHER',
  valor numeric(10,2) not null default 0,
  status text not null default 'aguardando_previa',
  mercado_pago_id text,
  mercado_pago_link text,
  criado_em timestamptz not null default now()
);

create table if not exists public.arquivos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references public.pedidos(id) on delete cascade,
  tipo text not null,
  url text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  profissao text,
  texto text not null,
  estrelas int not null default 5 check (estrelas between 1 and 5),
  aprovado boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Caso tabelas já existam sem colunas novas, garante compatibilidade.
alter table public.pagamentos add column if not exists forma_pagamento text default 'A_ESCOLHER';
alter table public.pagamentos add column if not exists valor numeric(10,2) not null default 0;
alter table public.pagamentos add column if not exists status text not null default 'aguardando_previa';
alter table public.pagamentos add column if not exists mercado_pago_id text;
alter table public.pagamentos add column if not exists mercado_pago_link text;
alter table public.pagamentos add column if not exists criado_em timestamptz not null default now();

alter table public.pedidos add column if not exists atualizado_em timestamptz not null default now();

-- =========================
-- ÍNDICES
-- =========================

create index if not exists idx_clientes_whatsapp on public.clientes(whatsapp);
create index if not exists idx_pedidos_cliente_id on public.pedidos(cliente_id);
create index if not exists idx_pedidos_status on public.pedidos(status);
create index if not exists idx_pedidos_criado_em on public.pedidos(criado_em desc);
create index if not exists idx_pagamentos_pedido_id on public.pagamentos(pedido_id);
create index if not exists idx_arquivos_pedido_id on public.arquivos(pedido_id);
create index if not exists idx_avaliacoes_aprovado on public.avaliacoes(aprovado);

-- =========================
-- RLS
-- =========================

alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.arquivos enable row level security;
alter table public.avaliacoes enable row level security;

-- Limpa policies antigas com nomes conhecidos para evitar conflito.
drop policy if exists "anon insert clientes" on public.clientes;
drop policy if exists "anon select clientes" on public.clientes;
drop policy if exists "anon insert pedidos" on public.pedidos;
drop policy if exists "anon select pedidos" on public.pedidos;
drop policy if exists "anon update pedidos" on public.pedidos;
drop policy if exists "anon insert pagamentos" on public.pagamentos;
drop policy if exists "anon select pagamentos" on public.pagamentos;
drop policy if exists "anon update pagamentos" on public.pagamentos;
drop policy if exists "anon insert arquivos" on public.arquivos;
drop policy if exists "anon select arquivos" on public.arquivos;
drop policy if exists "anon insert avaliacoes" on public.avaliacoes;
drop policy if exists "anon select avaliacoes" on public.avaliacoes;
drop policy if exists "anon delete avaliacoes" on public.avaliacoes;

-- ATENÇÃO: estas policies liberam o funcionamento com a chave anon do frontend.
-- Para produção avançada, trocar admin por Auth/Service Role.
create policy "anon insert clientes" on public.clientes for insert to anon with check (true);
create policy "anon select clientes" on public.clientes for select to anon using (true);

create policy "anon insert pedidos" on public.pedidos for insert to anon with check (true);
create policy "anon select pedidos" on public.pedidos for select to anon using (true);
create policy "anon update pedidos" on public.pedidos for update to anon using (true) with check (true);

create policy "anon insert pagamentos" on public.pagamentos for insert to anon with check (true);
create policy "anon select pagamentos" on public.pagamentos for select to anon using (true);
create policy "anon update pagamentos" on public.pagamentos for update to anon using (true) with check (true);

create policy "anon insert arquivos" on public.arquivos for insert to anon with check (true);
create policy "anon select arquivos" on public.arquivos for select to anon using (true);

create policy "anon insert avaliacoes" on public.avaliacoes for insert to anon with check (true);
create policy "anon select avaliacoes" on public.avaliacoes for select to anon using (aprovado = true);
create policy "anon delete avaliacoes" on public.avaliacoes for delete to anon using (true);

-- =========================
-- STORAGE
-- =========================

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

-- Policies para storage.objects
drop policy if exists "anon upload fotos" on storage.objects;
drop policy if exists "anon read fotos" on storage.objects;
drop policy if exists "anon upload logos" on storage.objects;
drop policy if exists "anon read logos" on storage.objects;

create policy "anon upload fotos"
on storage.objects for insert to anon
with check (bucket_id = 'fotos');

create policy "anon read fotos"
on storage.objects for select to anon
using (bucket_id = 'fotos');

create policy "anon upload logos"
on storage.objects for insert to anon
with check (bucket_id = 'logos');

create policy "anon read logos"
on storage.objects for select to anon
using (bucket_id = 'logos');

-- =========================
-- DADOS INICIAIS OPCIONAIS
-- =========================

insert into public.avaliacoes (nome, profissao, texto, estrelas, aprovado)
values
('Carlos M.', 'Eletricista', 'Recebi em 1 hora! A arte ficou perfeita, vendeu 3 trabalhos em uma semana.', 5, true),
('Ana L.', 'Cabeleireira', 'Meus clientes me reconhecem agora. Recomendo muito, super rápido.', 5, true),
('Roberto S.', 'Encanador', 'Melhor investimento que fiz. O WhatsApp ficou profissional demais.', 5, true)
on conflict do nothing;

-- Fim.
