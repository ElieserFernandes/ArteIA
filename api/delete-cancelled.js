import { createClient } from '@supabase/supabase-js'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.end(JSON.stringify(payload))
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis da Vercel.')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body.trim()) {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  let raw = ''
  for await (const chunk of req) raw += chunk
  if (!raw.trim()) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido.' })

    const body = await readBody(req)
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) return sendJson(res, 500, { error: 'ADMIN_PASSWORD não configurada na Vercel.' })
    if (body.password !== adminPassword) return sendJson(res, 401, { error: 'Senha administrativa inválida.' })

    const supabase = getSupabaseAdmin()
    const { data: cancelados, error: findError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('status', 'cancelado')

    if (findError) throw findError
    if (!cancelados?.length) return sendJson(res, 200, { deleted: 0 })

    const ids = cancelados.map(item => item.id)

    const { error: arquivosError } = await supabase.from('arquivos').delete().in('pedido_id', ids)
    if (arquivosError) throw arquivosError

    const { error: pagamentosError } = await supabase.from('pagamentos').delete().in('pedido_id', ids)
    if (pagamentosError) throw pagamentosError

    const { error: pedidosError } = await supabase.from('pedidos').delete().in('id', ids)
    if (pedidosError) throw pedidosError

    return sendJson(res, 200, { deleted: ids.length })
  } catch (error) {
    console.error('delete-cancelled:', error)
    return sendJson(res, 500, { error: error?.message || 'Falha ao excluir pedidos cancelados.' })
  }
}