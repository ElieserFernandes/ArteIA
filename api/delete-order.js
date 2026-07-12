import { createClient } from '@supabase/supabase-js'

function json(res, status, payload) {
  res.status(status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.end(JSON.stringify(payload))
}

function getBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'object') return req.body
  try { return JSON.parse(req.body) } catch { return {} }
}

function getAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.')
  return createClient(url, key, { auth: { persistSession: false } })
}

function storageInfo(url) {
  try {
    const marker = '/storage/v1/object/public/'
    const pos = String(url || '').indexOf(marker)
    if (pos < 0) return null
    const rest = decodeURIComponent(String(url).slice(pos + marker.length))
    const slash = rest.indexOf('/')
    if (slash < 1) return null
    return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) }
  } catch { return null }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 200, { ok: true })
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 405, { error: `Método ${req.method} não permitido. Use POST.` })
  }

  const body = getBody(req)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return json(res, 500, { error: 'ADMIN_PASSWORD não configurada na Vercel.' })
  if (body.password !== adminPassword) return json(res, 401, { error: 'Senha administrativa inválida.' })
  if (!body.pedido_id) return json(res, 400, { error: 'ID do pedido não informado.' })

  try {
    const supabase = getAdmin()
    const pedidoId = String(body.pedido_id)

    const { data: pedido, error: buscaErro } = await supabase
      .from('pedidos')
      .select('id, cliente_id, status, nome_arte')
      .eq('id', pedidoId)
      .maybeSingle()
    if (buscaErro) throw buscaErro
    if (!pedido) return json(res, 404, { error: 'Pedido não encontrado ou já excluído.' })

    const { data: arquivos, error: arquivosBuscaErro } = await supabase
      .from('arquivos')
      .select('url')
      .eq('pedido_id', pedidoId)
    if (arquivosBuscaErro) throw arquivosBuscaErro

    const porBucket = new Map()
    for (const arquivo of arquivos || []) {
      const info = storageInfo(arquivo.url)
      if (!info) continue
      if (!porBucket.has(info.bucket)) porBucket.set(info.bucket, [])
      porBucket.get(info.bucket).push(info.path)
    }
    for (const [bucket, paths] of porBucket.entries()) {
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from(bucket).remove(paths)
        if (storageError) throw storageError
      }
    }

    const { error: arquivosErro } = await supabase.from('arquivos').delete().eq('pedido_id', pedidoId)
    if (arquivosErro) throw arquivosErro

    const { error: pagamentosErro } = await supabase.from('pagamentos').delete().eq('pedido_id', pedidoId)
    if (pagamentosErro) throw pagamentosErro

    const { data: removidos, error: pedidoErro } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId)
      .select('id')
    if (pedidoErro) throw pedidoErro
    if (!removidos?.length) return json(res, 409, { error: 'O banco não confirmou a exclusão. O pedido foi mantido.' })

    const { data: verificacao, error: verificacaoErro } = await supabase
      .from('pedidos')
      .select('id')
      .eq('id', pedidoId)
      .maybeSingle()
    if (verificacaoErro) throw verificacaoErro
    if (verificacao) return json(res, 409, { error: 'O pedido ainda existe no banco após a tentativa de exclusão.' })

    if (pedido.cliente_id) {
      const { count } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', pedido.cliente_id)
      if (count === 0) await supabase.from('clientes').delete().eq('id', pedido.cliente_id)
    }

    return json(res, 200, { deleted: 1, pedido_id: pedidoId, persisted: true })
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Falha ao excluir o pedido.' })
  }
}
