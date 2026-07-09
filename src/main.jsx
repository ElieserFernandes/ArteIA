import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import './style.css'

const tipos = [
  { id:'DESENHO', titulo:'🎭 DESENHO', preco:9.90, texto:'Caricatura/mascote 3D inspirado na sua foto. Não é fotografia real.', valor_real:'Incluso: 3 revisões + arquivo 300dpi' },
  { id:'ROSTO', titulo:'📸 ROSTO', preco:19.90, texto:'Arte profissional com aparência mais realista para divulgação.', valor_real:'Incluso: 3 revisões + arquivo 300dpi' },
  { id:'COMBO', titulo:'🔥 COMBO', preco:24.90, texto:'Receba as duas artes: DESENHO + ROSTO. Melhor custo-benefício.', valor_real:'Incluso: 3 revisões + ambos 300dpi' }
]

const depoimentos = [
  { nome: 'Carlos M.', profissao: 'Eletricista', texto: 'Recebi em 1 hora! A arte ficou perfeita, vendeu 3 trabalhos em uma semana.' },
  { nome: 'Ana L.', profissao: 'Cabeleireira', texto: 'Meus clientes me reconhecem agora. Recomendo muito, super rápido.' },
  { nome: 'Roberto S.', profissao: 'Encanador', texto: 'Melhor investimento que fiz. O WhatsApp ficou profissional demais.' }
]

function money(v){ return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

function ExemploArte({ tipo, tamanho='pequeno' }) {
  const classes = tamanho === 'grande' ? 'exemploArte-grande' : 'exemploArte'
  if (tipo.id === 'DESENHO') return <div className={classes}><img src="/exemplos/desenho.svg" alt="Exemplo arte desenho" /></div>
  if (tipo.id === 'ROSTO') return <div className={classes}><img src="/exemplos/rosto.svg" alt="Exemplo arte rosto" /></div>
  return <div className={classes + ' exemploCombo'}><div className="comboGrid"><img src="/exemplos/desenho.svg" alt="Exemplo desenho" /><img src="/exemplos/rosto.svg" alt="Exemplo rosto" /></div></div>
}

function Landing(){
  return <main className="landing">
    <nav className="nav"><strong>ARTE<span>IA</span><small>Arte Profissional</small></strong><a href="/pedido">Fazer pedido</a></nav>
    <section className="landingHero landingHeroSolo">
      <div className="heroText"><span className="badge">⏱️ Prévia entregue em até 2h</span><h1>Transforme sua <mark>divulgação</mark> profissional</h1><p>Crie artes modernas para vender mais pelo WhatsApp, Instagram e redes sociais.</p><a className="cta" href="/pedido">FAZER MEU PEDIDO</a></div>
    </section>
    <section className="benefits"><div>🛡️<span>100% Profissional</span></div><div>⚡<span>Entrega até 2h</span></div><div>⭐<span>Alta qualidade</span></div></section>
    <h2 className="sectionTitle">Escolha sua arte</h2>
    <section className="landingCards">
      {tipos.map(t=><article key={t.id} className={'produtoCard '+t.id.toLowerCase() + (t.id==='COMBO' ? ' destaque' : '')}><ExemploArte tipo={t}/><div className="produtoInfo"><div className="cardHead"><h2>{t.titulo}</h2>{t.id==='COMBO' && <em className="recomendado">RECOMENDADO</em>}</div><p>{t.texto}</p><small className="valor-real">✓ {t.valor_real}</small></div><strong className="precoProduto">{money(t.preco)}</strong></article>)}
    </section>
    <section className="depoimentos">
      <h2>Clientes satisfeitos</h2>
      <div className="depoGrid">
        {depoimentos.map((d,i)=><div key={i} className="depoCard">⭐⭐⭐⭐⭐<p>"{d.texto}"</p><strong>{d.nome}</strong><small>{d.profissao}</small></div>)}
      </div>
    </section>
    <section className="stats"><div><b>+2.500</b><span>Artes entregues</span></div><div><b>4,9/5</b><span>Avaliação dos clientes</span></div><div><b>100%</b><span>Garantia de satisfação</span></div></section>
    <section className="faq"><h2>Como funciona?</h2><p>Você escolhe a arte, envia foto e informações. Nós preparamos uma prévia em até 2h. O pagamento só é escolhido depois que você aprovar a prévia.</p><a className="cta" href="/pedido">Pedir agora</a></section>
  </main>
}

function Etapa1({ tipo, setTipo, setEtapa }) {
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  
  function proximo() {
    if (!nome || !whatsapp) { alert('Preencha nome e WhatsApp'); return }
    sessionStorage.setItem('arteia_form', JSON.stringify({ tipo, nome, whatsapp }))
    setEtapa(2)
  }
  
  return <div className="formulario-etapa">
    <div className="etapa-header">
      <span className="numero-etapa">1 de 2</span>
      <h2>Informações Rápidas</h2>
      <p>Leva menos de 30 segundos</p>
    </div>
    
    <div className="etapa-content">
      <h3>Qual tipo de arte você quer?</h3>
      <div className="cards-tipo">
        {tipos.map(t=>(
          <button key={t.id} type="button" onClick={()=>setTipo(t.id)} className={'card-tipo '+(tipo===t.id?'ativo':'')}>
            <ExemploArte tipo={tipos.find(x=>x.id===t.id)} tamanho="grande"/>
            <div className="card-tipo-info">
              <strong>{t.titulo}</strong>
              <p>{t.texto}</p>
              <span className="preco">{money(t.preco)}</span>
              {t.id==='COMBO' && <em className="badge-combo">MAIS VENDIDO</em>}
            </div>
          </button>
        ))}
      </div>

      <h3 style={{marginTop:'30px'}}>Seus dados</h3>
      <input required placeholder="Nome completo" autoComplete="name" value={nome} onChange={e=>setNome(e.target.value)}/>
      <input required placeholder="WhatsApp (com DDD)" type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)}/>

      <button className="submit" onClick={proximo}>CONTINUAR → Próxima etapa</button>
      <p className="seguranca">🔒 Seus dados estão seguros</p>
    </div>
  </div>
}

function Etapa2({ onConfirm }) {
  const stored = JSON.parse(sessionStorage.getItem('arteia_form') || '{}')
  const [form, setForm] = useState({
    tipo_arte: stored.tipo || 'COMBO',
    nome: stored.nome || '',
    whatsapp: stored.whatsapp || '',
    cidade: '',
    estado: '',
    nome_arte: '',
    profissao: '',
    telefone_arte: '',
    cor_predominante: '',
    servicos: '',
    detalhes: ''
  })
  const [foto, setFoto] = useState(null)
  const [logo, setLogo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const tipo = tipos.find(t => t.id === form.tipo_arte)
  const set = (k, v) => setForm({ ...form, [k]: v })

  async function upload(bucket, file, pedidoId, tipoArquivo) {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const path = `${pedidoId}/${tipoArquivo}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    await supabase.from('arquivos').insert({ pedido_id: pedidoId, tipo: tipoArquivo, url: data.publicUrl })
    return data.publicUrl
  }

  async function enviar(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      if (!foto) throw new Error('Envie a foto para continuar.')
      const { data: cliente, error: e1 } = await supabase.from('clientes').insert({ nome: form.nome, whatsapp: form.whatsapp, cidade: form.cidade, estado: form.estado }).select().single()
      if (e1) throw e1
      const { data: pedido, error: e2 } = await supabase.from('pedidos').insert({ cliente_id: cliente.id, tipo_arte: form.tipo_arte, valor: tipo.preco, nome_arte: form.nome_arte, profissao: form.profissao, telefone_arte: form.telefone_arte, cor_predominante: form.cor_predominante, servicos: form.servicos, detalhes: form.detalhes, status: 'novo' }).select().single()
      if (e2) throw e2
      const { error: e3 } = await supabase.from('pagamentos').insert({ pedido_id: pedido.id, gateway: 'mercado_pago', forma_pagamento: 'A_ESCOLHER', valor: tipo.preco, status: 'aguardando_previa' })
      if (e3) throw e3
      await upload('fotos', foto, pedido.id, 'foto')
      await upload('logos', logo, pedido.id, 'logo')
      sessionStorage.removeItem('arteia_form')
      onConfirm()
    } catch (err) {
      setErro(err.message || 'Erro ao enviar pedido')
    }
    setLoading(false)
  }

  return <div className="formulario-etapa">
    <div className="etapa-header">
      <span className="numero-etapa">2 de 2</span>
      <h2>Detalhes da Arte</h2>
      <p>Faltam alguns detalhes</p>
    </div>

    <form onSubmit={enviar} className="etapa-content">
      <h3>Arquivos</h3>
      <label className="upload">📷 Enviar foto obrigatória<input required type="file" accept="image/*" onChange={e=>setFoto(e.target.files[0])}/>{foto && <small>✓ {foto.name}</small>}</label>
      <label className="upload">📁 Enviar logomarca se tiver<input type="file" accept="image/*" onChange={e=>setLogo(e.target.files[0])}/>{logo && <small>✓ {logo.name}</small>}</label>

      <h3>Informações da arte</h3>
      <input required placeholder="Nome que aparecerá na arte" value={form.nome_arte} onChange={e=>set('nome_arte',e.target.value)}/>
      <div className="cols">
        <input required placeholder="Profissão" value={form.profissao} onChange={e=>set('profissao',e.target.value)}/>
        <input placeholder="Telefone que aparecerá" type="tel" inputMode="tel" value={form.telefone_arte} onChange={e=>set('telefone_arte',e.target.value)}/>
      </div>
      <div className="cols">
        <input placeholder="Cidade" autoComplete="address-level2" value={form.cidade} onChange={e=>set('cidade',e.target.value)}/>
        <input placeholder="Estado" autoComplete="address-level1" value={form.estado} onChange={e=>set('estado',e.target.value)}/>
      </div>
      <input placeholder="Cor predominante" value={form.cor_predominante} onChange={e=>set('cor_predominante',e.target.value)}/>
      <textarea placeholder="Serviços. Ex: Instalação elétrica, troca de padrão, manutenção..." value={form.servicos} onChange={e=>set('servicos',e.target.value)} />
      <textarea placeholder="Detalhes adicionais. Ex: fundo branco, sem boné, colocar escada..." value={form.detalhes} onChange={e=>set('detalhes',e.target.value)} />

      <div className="resumo">
        <span>Resumo: <b>{form.tipo_arte}</b><br/><small>Pagamento será escolhido após aprovação da prévia.</small></span>
        <strong>{money(tipo.preco)}</strong>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button className="submit" disabled={loading}>{loading?'Enviando...':'FINALIZAR PEDIDO'}</button>
    </form>
  </div>
}

function Formulario() {
  const [etapa, setEtapa] = useState(1)
  const [tipo, setTipo] = useState('COMBO')
  const [ok, setOk] = useState(false)

  if (ok) return <main className="page success"><h1>✅ Pedido enviado!</h1><p>Recebemos suas informações. Em alguns minutos enviaremos sua prévia pelo WhatsApp.</p><a className="cta" href="/">Voltar ao início</a></main>

  return <main className="page formulario-page">
    <section className="hero"><div className="badge">🎨 Promova Profissional</div><h1>Faça seu pedido</h1></section>
    <div className="card-formulario">
      {etapa === 1 && <Etapa1 tipo={tipo} setTipo={setTipo} setEtapa={setEtapa} />}
      {etapa === 2 && <Etapa2 onConfirm={() => setOk(true)} />}
    </div>
  </main>
}

function AdminLogin({ onEntrar }){
  const [senha,setSenha]=useState(''); const [erro,setErro]=useState('')
  function tentar(e){
    e.preventDefault()
    const senhaCorreta = import.meta.env.VITE_ADMIN_PASSWORD
    if(!senhaCorreta){ setErro('Defina VITE_ADMIN_PASSWORD na Vercel para proteger o painel.'); return }
    if(senha === senhaCorreta){ sessionStorage.setItem('arteia_admin_ok','1'); onEntrar() }
    else setErro('Senha incorreta.')
  }
  return <main className="page success">
    <h1>🔒 Painel Administrativo</h1>
    <form onSubmit={tentar} className="card" style={{maxWidth:340,margin:'20px auto',textAlign:'left'}}>
      <input required type="password" placeholder="Senha" autoFocus value={senha} onChange={e=>setSenha(e.target.value)} />
      {erro && <p className="erro">{erro}</p>}
      <button className="submit" type="submit">Entrar</button>
    </form>
  </main>
}

function Admin(){
  const [autorizado,setAutorizado]=useState(()=>sessionStorage.getItem('arteia_admin_ok')==='1')
  const [pedidos,setPedidos]=useState([]); const [loading,setLoading]=useState(true); const [erro,setErro]=useState('')
  async function carregar(){ setLoading(true); setErro(''); const { data, error } = await supabase.from('pedidos').select('*, clientes(nome, whatsapp, cidade, estado), pagamentos(status, forma_pagamento, valor)').order('criado_em', { ascending:false }); if(error) setErro(error.message); else setPedidos(data || []); setLoading(false) }
  useEffect(()=>{ if(autorizado) carregar() },[autorizado])
  if(!autorizado) return <AdminLogin onEntrar={()=>setAutorizado(true)} />
  const hoje = new Date().toISOString().slice(0,10); const pedidosHoje = pedidos.filter(p => (p.criado_em || '').slice(0,10) === hoje); const faturamento = pedidos.reduce((s,p)=>s+Number(p.valor || 0),0)
  function msgRecebido(p){ return `Olá, ${p.clientes?.nome || p.nome_arte}! Recebemos seu pedido de ${p.tipo_arte}. Vou preparar sua prévia e te envio em breve. 😊` }
  function msgPrevia(p){ return `Sua prévia está pronta! 😊\n\nCaso aprove a arte, o valor para receber a original em alta qualidade é ${money(p.valor)}.\n\nApós o pagamento confirmado, envio a versão sem marca d'água.` }
  async function copiar(texto){ await navigator.clipboard.writeText(texto); alert('Mensagem copiada!') }
  return <main className="admin"><aside className="sidebar"><h2>🎨 ArteIA Studio</h2><a>🏠 Dashboard</a><a>📥 Pedidos</a><a>💰 Financeiro</a><a>🤖 Prompts</a></aside><section className="adminContent"><div className="adminTop"><h1>Painel Administrativo</h1><button onClick={carregar}>Atualizar</button></div><div className="cardsDash"><div><span>Pedidos</span><strong>{pedidos.length}</strong></div><div><span>Hoje</span><strong>{pedidosHoje.length}</strong></div><div><span>Faturamento</span><strong>{money(faturamento)}</strong></div></div>{loading && <p>Carregando pedidos...</p>}{erro && <p className="erro">{erro}</p>}<div className="listaPedidos">{pedidos.map(p => <article className="pedidoCard" key={p.id}><div><h3>{p.nome_arte} <small>#{p.id.slice(0,8)}</small></h3><p>{p.profissao} • {p.tipo_arte} • {money(p.valor)}</p><p>Cliente: {p.clientes?.nome} | WhatsApp: {p.clientes?.whatsapp}</p><p>Status: <b>{p.status}</b> | Pagamento: <b>{p.pagamentos?.[0]?.status || 'aguardando_previa'}</b></p></div><div className="acoes"><button onClick={()=>copiar(msgRecebido(p))}>Copiar recebimento</button><button onClick={()=>copiar(msgPrevia(p))}>Copiar prévia</button></div></article>)}</div></section></main>
}

function BotaoWhatsApp() {
  return <a href="https://wa.me/?text=Olá%20ArteIA!%20Gostaria%20de%20uma%20arte%20profissional" target="_blank" rel="noopener noreferrer" className="whatsapp-flutuante" title="Abrir WhatsApp">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.466 0-2.861.573-3.905 1.617-1.039 1.039-1.611 2.427-1.611 3.901 0 1.472.572 2.86 1.611 3.901 1.044 1.044 2.44 1.617 3.909 1.617h.004c1.468 0 2.868-.572 3.907-1.616l.001-.001c1.039-1.039 1.617-2.426 1.617-3.907 0-1.473-.571-2.858-1.617-3.903-1.038-1.039-2.44-1.609-3.907-1.609M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0m0 23.385C5.85 23.385.615 18.15.615 12 .615 5.85 5.85.615 12 .615c6.15 0 11.385 5.235 11.385 11.385 0 6.15-5.235 11.385-11.385 11.385"/></svg>
  </a>
}

function App(){
  const path = window.location.pathname
  return <>
    {path !== '/admin' && <BotaoWhatsApp />}
    {path.startsWith('/admin') && <Admin/>}
    {path.startsWith('/pedido') && <Formulario/>}
    {!path.startsWith('/admin') && !path.startsWith('/pedido') && <Landing/>}
  </>
}

createRoot(document.getElementById('root')).render(<App />)
