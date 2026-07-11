import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return res.status(500).json({ error: 'ADMIN_PASSWORD não configurada na Vercel.' })
  if (req.body?.password !== adminPassword) return res.status(401).json({ error: 'Senha administrativa inválida.' })

  try {
    const supabase = getSupabaseAdmin()
    const { data: cancelados, error: findError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('status', 'cancelado')

    if (findError) throw findError
    if (!cancelados?.length) return res.status(200).json({ deleted: 0 })

    const ids = cancelados.map(item => item.id)

    const { error: arquivosError } = await supabase.from('arquivos').delete().in('pedido_id', ids)
    if (arquivosError) throw arquivosError

    const { error: pagamentosError } = await supabase.from('pagamentos').delete().in('pedido_id', ids)
    if (pagamentosError) throw pagamentosError

    const { error: pedidosError } = await supabase.from('pedidos').delete().in('id', ids)
    if (pedidosError) throw pedidosError

    return res.status(200).json({ deleted: ids.length })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Falha ao excluir pedidos cancelados.' })
  }
}
