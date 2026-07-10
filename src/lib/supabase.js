import { createClient } from '@supabase/supabase-js'

const ADMIN_SESSION_KEY = 'arteia_admin_autorizado'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
  const autorizado = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'

  if (!autorizado) {
    const senha = window.prompt('Digite a senha do painel administrativo:')

    if (ADMIN_PASSWORD && senha === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
    } else {
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#07111f;color:white;font-family:Arial"><div style="padding:32px;text-align:center"><h1>Acesso restrito</h1><p>Senha incorreta ou não configurada.</p><a href="/" style="color:#ffd166">Voltar ao site</a></div></main>'
      throw new Error('Acesso ao painel negado')
    }
  }
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
