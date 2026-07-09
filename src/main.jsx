import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import './style.css'

const tipos = [
  { id:'DESENHO', titulo:'🎭 DESENHO', preco:9.90, texto:'Caricatura/mascote 3D inspirado na sua foto. Não é fotografia real.' },
  { id:'ROSTO', titulo:'📸 ROSTO', preco:19.90, texto:'Arte profissional com aparência mais realista para divulgação.' },
  { id:'COMBO', titulo:'🔥 COMBO', preco:24.90, texto:'Receba as duas artes: DESENHO + ROSTO. Melhor custo-benefício.' }
]

function money(v){ return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

function ExemploArte({ tipo }) {
  if (tipo.id === 'DESENHO') return <div className="exemploArte exemploReal"><img src="/exemplos/desenho.svg" alt="Exemplo arte desenho" /></div>
  if (tipo.id === 'ROSTO') return <div className="exemploArte exemploReal"><img src="/exemplos/rosto.svg" alt="Exemplo arte rosto" /></div>
  return <div className="exemploArte exemploCombo"><div className="comboGrid"><img src="/exemplos/desenho.svg" alt="Exemplo desenho" /><img src="/exemplos/rosto.svg" alt="Exemplo rosto" /></div></div>
}

function Landing(){
  return <main className="landing">
    <nav className="nav"><strong>ARTE<span>IA</span><small>Arte Profissional</small></strong><a href="/pedido">Fazer pedido</a></nav>
    <section className="landingHero landingHeroSolo">
      <div className="heroText"><span className="badge">Arte profissional em poucos minutos</span><h1>Transforme sua <mark>divulgação</mark> profissional</h1><p>Crie artes modernas para vender mais pelo WhatsApp, Instagram e redes sociais.</p><a className="cta" href="/pedido">FAZER MEU PEDIDO</a></div>
    </section>
    <section className="benefits"><div>🛡️<span>100% Profissional</span></div><div>⚡<span>Entrega rápida</span></div><div>⭐<span>Alta qualidade</span></div></section>
    <h2 className="sectionTitle">Escolha sua arte</h2>
    <section className="landingCards">
      {tipos.map(t=><article key={t.id} className={'produtoCard '+t.id.toLowerCase()}><ExemploArte tipo={t}/><div className="produtoInfo"><div className="cardHead"><h2>{t.titulo}</h2>{t.id==='COMBO' && <em>MAIS VENDIDO</em>}</div><p>{t.texto}</p></div><strong className="precoProduto">{money(t.preco)}</strong></article>)}
    </section>
    <section className="stats"><div><b>+2.500</b><span>Artes entregues</span></div><div><b>4,9/5</b><span>Avaliação dos clientes</span></div><div><b>100%</b><span>Seguro</span></div></section>
    <section className="faq"><h2>Como funciona?</h2><p>Você escolhe a arte, envia foto e informações. Nós preparamos uma prévia. O pagamento só é escolhido depois que você aprovar a prévia.</p><a className="cta" href="/pedido">Pedir agora</a></section>
  </main>
}

function Formulario(){
  const [form,setForm]=useState({tipo_arte:'COMBO',nome:'',whatsapp:'',cidade:'',estado:'',nome_arte:'',profissao:'',telefone_arte:'',cor_predominante:'',servicos:'',detalhes:''})
  const [foto,setFoto]=useState(null); const [logo,setLogo]=useState(null); const [loading,setLoading]=useState(false); const [ok,setOk]=useState(false); const [erro,setErro]=useState('')
  const tipo = tipos.find(t=>t.id===form.tipo_arte)
  const set=(k,v)=>setForm({...form,[k]:v})

  async function upload(bucket,file,pedidoId,tipoArquivo){
    if(!file) return null
    const ext = file.name.split('.').pop()
    const path = `${pedidoId}/${tipoArquivo}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path,file)
    if(error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    await supabase.from('arquivos').insert({pedido_id:pedidoId,tipo:tipoArquivo,url:data.publicUrl})
    return data.publicUrl
  }

  async function enviar(e){
    e.preventDefault(); setLoading(true); setErro('')
    try{
      if(!foto) throw new Error('Envie a foto para continuar.')
      const { data:cliente, error:e1 } = await supabase.from('clientes').insert({nome:form.nome, whatsapp:form.whatsapp, cidade:form.cidade, estado:form.estado}).select().single()
      if(e1) throw e1
      const { data:pedido, error:e2 } = await supabase.from('pedidos').insert({cliente_id:cliente.id, tipo_arte:form.tipo_arte, valor:tipo.preco, nome_arte:form.nome_arte, profissao:form.profissao, telefone_arte:form.telefone_arte, cor_predominante:form.cor_predominante, servicos:form.servicos, detalhes:form.detalhes, status:'novo'}).select().single()
      if(e2) throw e2
      const { error:e3 } = await supabase.from('pagamentos').insert({pedido_id:pedido.id, gateway:'mercado_pago', forma_pagamento:'A_ESCOLHER', valor:tipo.preco, status:'aguardando_previa'})
      if(e3) throw e3
      await upload('fotos',foto,pedido.id,'foto')
      await upload('logos',logo,pedido.id,'logo')
      setOk(true)
    }catch(err){ setErro(err.message || 'Erro ao enviar pedido') }
    setLoading(false)
  }

  if(ok) return <main className="page success"><h1>✅ Pedido enviado!</h1><p>Recebemos suas informações. Em alguns minutos enviaremos sua prévia pelo WhatsApp.</p><a className="cta" href="/">Voltar ao início</a></main>

  return <main className="page">
    <section className="hero"><div className="badge">🎨 Promova Profissional</div><h1>Faça seu pedido</h1><p>Preencha em menos de 1 minuto e receba sua prévia.</p></section>
    <form onSubmit={enviar} className="card">
      <h2>1. Escolha sua arte</h2>
      <div className="grid">{tipos.map(t=><button type="button" key={t.id} onClick={()=>set('tipo_arte',t.id)} className={'tipo '+(form.tipo_arte===t.id?'ativo':'')}><strong>{t.titulo}</strong><span>{t.texto}</span><b>{money(t.preco)}</b><ExemploArte tipo={t}/>{t.id==='COMBO' && <em>MAIS VENDIDO</em>}</button>)}</div>
      <div className="aviso">Importante: DESENHO é caricatura/mascote 3D inspirado na foto. Não é imagem real/fotográfica.</div>
      <h2>2. Seus dados</h2><div className="cols"><input required placeholder="Nome completo" value={form.nome} onChange={e=>set('nome',e.target.value)}/><input required placeholder="WhatsApp" value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)}/></div><div className="cols"><input placeholder="Cidade" value={form.cidade} onChange={e=>set('cidade',e.target.value)}/><input placeholder="Estado" value={form.estado} onChange={e=>set('estado',e.target.value)}/></div>
      <h2>3. Arquivos</h2><label className="upload">📷 Enviar foto obrigatória<input required type="file" accept="image/*" onChange={e=>setFoto(e.target.files[0])}/>{foto && <small>{foto.name}</small>}</label><label className="upload">📁 Enviar logomarca se tiver<input type="file" accept="image/*" onChange={e=>setLogo(e.target.files[0])}/>{logo && <small>{logo.name}</small>}</label>
      <h2>4. Informações da arte</h2><input required placeholder="Nome que aparecerá na arte" value={form.nome_arte} onChange={e=>set('nome_arte',e.target.value)}/><div className="cols"><input required placeholder="Profissão" value={form.profissao} onChange={e=>set('profissao',e.target.value)}/><input placeholder="Telefone que aparecerá" value={form.telefone_arte} onChange={e=>set('telefone_arte',e.target.value)}/></div><input placeholder="Cor predominante" value={form.cor_predominante} onChange={e=>set('cor_predominante',e.target.value)}/><textarea placeholder="Serviços. Ex: Instalação elétrica, troca de padrão, manutenção..." value={form.servicos} onChange={e=>set('servicos',e.target.value)} /><textarea placeholder="Detalhes adicionais. Ex: fundo branco, sem boné, colocar escada..." value={form.detalhes} onChange={e=>set('detalhes',e.target.value)} />
      <div className="resumo"><span>Resumo: <b>{form.tipo_arte}</b><br/><small>Pagamento será escolhido após aprovação da prévia.</small></span><strong>{money(tipo.preco)}</strong></div>{erro && <p className="erro">{erro}</p>}<button className="submit" disabled={loading}>{loading?'Enviando...':'FINALIZAR PEDIDO'}</button>
    </form>
  </main>
}

function Admin(){
  const [pedidos,setPedidos]=useState([]); const [loading,setLoading]=useState(true); const [erro,setErro]=useState('')
  async function carregar(){ setLoading(true); setErro(''); const { data, error } = await supabase.from('pedidos').select('*, clientes(nome, whatsapp, cidade, estado), pagamentos(status, forma_pagamento, valor)').order('criado_em', { ascending:false }); if(error) setErro(error.message); else setPedidos(data || []); setLoading(false) }
  useEffect(()=>{ carregar() },[])
  const hoje = new Date().toISOString().slice(0,10); const pedidosHoje = pedidos.filter(p => (p.criado_em || '').slice(0,10) === hoje); const faturamento = pedidos.reduce((s,p)=>s+Number(p.valor || 0),0)
  function msgRecebido(p){ return `Olá, ${p.clientes?.nome || p.nome_arte}! Recebemos seu pedido de ${p.tipo_arte}. Vou preparar sua prévia e te envio em breve. 😊` }
  function msgPrevia(p){ return `Sua prévia está pronta! 😊\n\nCaso aprove a arte, o valor para receber a original em alta qualidade é ${money(p.valor)}.\n\nApós o pagamento confirmado, envio a versão sem marca d'água.` }
  async function copiar(texto){ await navigator.clipboard.writeText(texto); alert('Mensagem copiada!') }
  return <main className="admin"><aside className="sidebar"><h2>🎨 ArteIA Studio</h2><a>🏠 Dashboard</a><a>📥 Pedidos</a><a>💰 Financeiro</a><a>🤖 Prompts</a></aside><section className="adminContent"><div className="adminTop"><h1>Painel Administrativo</h1><button onClick={carregar}>Atualizar</button></div><div className="cardsDash"><div><span>Pedidos</span><strong>{pedidos.length}</strong></div><div><span>Hoje</span><strong>{pedidosHoje.length}</strong></div><div><span>Faturamento</span><strong>{money(faturamento)}</strong></div></div>{loading && <p>Carregando pedidos...</p>}{erro && <p className="erro">{erro}</p>}<div className="listaPedidos">{pedidos.map(p => <article className="pedidoCard" key={p.id}><div><h3>{p.nome_arte} <small>#{p.id.slice(0,8)}</small></h3><p>{p.profissao} • {p.tipo_arte} • {money(p.valor)}</p><p>Cliente: {p.clientes?.nome} | WhatsApp: {p.clientes?.whatsapp}</p><p>Status: <b>{p.status}</b> | Pagamento: <b>{p.pagamentos?.[0]?.status || 'aguardando_previa'}</b></p></div><div className="acoes"><button onClick={()=>copiar(msgRecebido(p))}>Copiar recebimento</button><button onClick={()=>copiar(msgPrevia(p))}>Copiar prévia</button></div></article>)}</div></section></main>
}

function App(){
  const path = window.location.pathname
  if(path.startsWith('/admin')) return <Admin/>
  if(path.startsWith('/pedido')) return <Formulario/>
  return <Landing/>
}

createRoot(document.getElementById('root')).render(<App />)