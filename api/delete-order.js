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
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' })

  const body = getBody(req)
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return json(res, 500, { error: 'ADMIN_PASSWORD não configurada na Vercel.' })
  if (body.password !== adminPassword) return json(res, 401, { error: 'Senha administrativa inválida.' })

  try {
    const supabase = getAdmin()
    let pedido = null

    if (body.pedido_id) {
      const busca = await supabase.from('pedidos').select('id, cliente_id, status, nome_arte').eq('id', String(body.pedido_id)).maybeSingle()
      if (busca.error) throw busca.error
      pedido = busca.data
    } else if (body.nome_arte) {
      let query = supabase.from('pedidos').select('id, cliente_id, status, nome_arte, criado_em, clientes!inner(whatsapp)').eq('nome_arte', String(body.nome_arte)).order('criado_em', { ascending: false }).limit(5)
      if (body.whatsapp) query = query.eq('clientes.whatsapp', String(body.whatsapp))
      const busca = await query
      if (busca.error) throw busca.error
      if ((busca.data || []).length > 1 && !body.whatsapp) return json(res, 409, { error: 'Há mais de um pedido com esse nome. Informe o WhatsApp do cliente.' })
      pedido = busca.data?.[0] || null
    } else {
      return json(res, 400, { error: 'Pedido não informado.' })
    }

    if (!pedido) return json(res, 404, { error: 'Pedido não encontrado.' })
    const pedidoId = String(pedido.id)

    const { data: arquivos, error: arquivosBuscaErro } = await supabase.from('arquivos').select('url').eq('pedido_id', pedidoId)
    if (arquivosBuscaErro) throw arquivosBuscaErro

    const porBucket = new Map()
    for (const arquivo of arquivos || []) {
      const info = storageInfo(arquivo.url)
      if (!info) continue
      if (!porBucket.has(info.bucket)) porBucket.set(info.bucket, [])
      porBucket.get(info.bucket).push(info.path)
    }
    for (const [bucket, paths] of porBucket.entries()) {
      if (paths.length) await supabase.storage.from(bucket).remove(paths)
    }

    const { error: arquivosErro } = await supabase.from('arquivos').delete().eq('pedido_id', pedidoId)
    if (arquivosErro) throw arquivosErro
    const { error: pagamentosErro } = await supabase.from('pagamentos').delete().eq('pedido_id', pedidoId)
    if (pagamentosErro) throw pagamentosErro
    const { error: pedidoErro } = await supabase.from('pedidos').delete().eq('id', pedidoId)
    if (pedidoErro) throw pedidoErro

    if (pedido.cliente_id) {
      const { count } = await supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('cliente_id', pedido.cliente_id)
      if (count === 0) await supabase.from('clientes').delete().eq('id', pedido.cliente_id)
    }

    return json(res, 200, { deleted: 1, pedido_id: pedidoId })
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Falha ao excluir o pedido.' })
  }
}
