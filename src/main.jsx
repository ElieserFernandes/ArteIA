import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import './style.css'
import './ajustes.css'

const BASE = 2500
const tipos = [
  { id: 'DESENHO', titulo: '🎭 DESENHO', preco: 9.90, texto: 'Caricatura/mascote 3D inspirado na sua foto. Não é fotografia real.' },
  { id: 'ROSTO', titulo: '📸 ROSTO', preco: 19.90, texto: 'Arte profissional com aparência mais realista para divulgação.' },
  { id: 'COMBO', titulo: '🔥 COMBO', preco: 24.90, texto: 'Receba as duas artes: DESENHO + ROSTO.' }
]
const statusLista = ['novo','produzindo','previa_enviada','aguardando_pagamento','pago','entregue','cancelado']

function money(v){ return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }
function imgUrl(p,tipo){ const arr = Array.isArray(p.arquivos) ? p.arquivos : []; return arr.find(a => a.tipo === tipo)?.url || '' }
function estrelas(n=5){ return '⭐'.repeat(Number(n || 5)) }
function loadReviews(){ try{ const v = JSON.parse(localStorage.getItem('arteia_avaliacoes') || '[]'); return Array.isArray(v) ? v : [] }catch{ return [] } }
function saveReviews(v){ localStorage.setItem('arteia_avaliacoes', JSON.stringify(v)) }
function ExemploArte({tipo}){ if(tipo.id==='COMBO') return <div className="exemploArte exemploCombo"><div className="comboGrid"><img src="/exemplos/desenho.svg"/><img src="/exemplos/rosto.svg"/></div></div>; return <div className="exemploArte"><img src={tipo.id==='DESENHO'?'/exemplos/desenho.svg':'/exemplos/rosto.svg'} /></div> }

function Landing(){
  const [reviews,setReviews] = useState(loadReviews)
  const [finalizados,setFinalizados] = useState(BASE)
  useEffect(()=>{ supabase.from('pedidos').select('id',{count:'exact',head:true}).in('status',['pago','entregue','finalizado']).then(({count})=>{ if(typeof count==='number') setFinalizados(BASE+count) }) },[])
  function enviarReview(e){
    e.preventDefault(); const f = new FormData(e.currentTarget)
    const novo = { id: Date.now(), nome: f.get('nome'), profissao: f.get('profissao'), texto: f.get('texto'), estrelas: Number(f.get('estrelas') || 5) }
    const lista = [novo,...reviews]; saveReviews(lista); setReviews(lista); e.currentTarget.reset(); alert('Avaliação enviada!')
  }
  const padrao = [
    {nome:'Carlos M.',profissao:'Eletricista',texto:'A arte ficou perfeita e muito profissional.',estrelas:5},
    {nome:'Ana L.',profissao:'Cabeleireira',texto:'Atendimento rápido e resultado lindo.',estrelas:5},
    {nome:'Roberto S.',profissao:'Encanador',texto:'Melhorou muito minha divulgação.',estrelas:5}
  ]
  return <main className="landing">
    <nav className="nav"><strong>ARTE<span>IA</span><small>Arte Profissional</small></strong><a href="/pedido">Fazer pedido</a></nav>
    <section className="landingHero landingHeroSolo"><div className="heroText"><span className="badge">Prévia em até 2h</span><h1>Transforme sua <mark>divulgação</mark> profissional</h1><p>Artes modernas para vender mais pelo WhatsApp, Instagram e redes sociais.</p><a className="cta" href="/pedido">FAZER MEU PEDIDO</a></div></section>
    <h2 className="sectionTitle">Escolha sua arte</h2>
    <section className="landingCards">{tipos.map(t=><article key={t.id} className="produtoCard"><ExemploArte tipo={t}/><div className="produtoInfo"><div className="cardHead"><h2>{t.titulo}</h2></div><p>{t.texto}</p></div><strong className="precoProduto">{money(t.preco)}</strong></article>)}</section>
    <section className="pagamentos-site"><h2>Formas de pagamento</h2><div className="pagamentoGrid"><div className="pagamentoItem"><b>PIX</b><span>Após aprovação da prévia.</span></div><div className="pagamentoItem"><b>Cartão de crédito</b><span>Mercado Pago.</span></div><div className="pagamentoItem"><b>Cartão de débito</b><span>Mercado Pago.</span></div></div></section>
    <section className="depoimentos"><h2>Clientes satisfeitos</h2><div className="depoGrid">{[...reviews,...padrao].map((r,i)=><div key={r.id||i} className="depoCard"><div>{estrelas(r.estrelas)}</div><p>"{r.texto}"</p><strong>{r.nome}</strong><small>{r.profissao}</small></div>)}</div></section>
    <section className="avaliacao-publica"><h2>Deixe sua avaliação</h2><form onSubmit={enviarReview} className="avaliacaoForm"><div className="cols"><input name="nome" required placeholder="Seu nome"/><input name="profissao" placeholder="Sua profissão"/></div><select name="estrelas" defaultValue="5"><option value="5">5 estrelas</option><option value="4">4 estrelas</option><option value="3">3 estrelas</option><option value="2">2 estrelas</option><option value="1">1 estrela</option></select><textarea name="texto" required placeholder="Conte como foi sua experiência"/><button className="cta">Enviar avaliação</button></form></section>
    <section className="stats"><div><b>+{finalizados.toLocaleString('pt-BR')}</b><span>Clientes finalizados</span></div><div><b>4,9/5</b><span>Avaliação</span></div><div><b>100%</b><span>Profissional</span></div></section>
  </main>
}

function Formulario(){
  const [form,setForm]=useState({tipo_arte:'COMBO',nome:'',whatsapp:'',cidade:'',estado:'',nome_arte:'',profissao:'',telefone_arte:'',cor_predominante:'',servicos:'',detalhes:''})
  const [foto,setFoto]=useState(null), [logo,setLogo]=useState(null), [semFoto,setSemFoto]=useState(false), [ok,setOk]=useState(false), [erro,setErro]=useState(''), [loading,setLoading]=useState(false)
  const tipo = tipos.find(t=>t.id===form.tipo_arte) || tipos[2]
  function set(k,v){ setForm({...form,[k]:v}) }
  async function upload(bucket,file,pedidoId,tipoArquivo){ if(!file) return; const ext = file.name.split('.').pop(); const path = `${pedidoId}/${tipoArquivo}-${Date.now()}.${ext}`; const up = await supabase.storage.from(bucket).upload(path,file); if(up.error) throw up.error; const {data}=supabase.storage.from(bucket).getPublicUrl(path); await supabase.from('arquivos').insert({pedido_id:pedidoId,tipo:tipoArquivo,url:data.publicUrl}) }
  async function enviar(e){
    e.preventDefault(); setLoading(true); setErro('')
    try{
      if(!foto && !semFoto) throw new Error('Você está sem foto. Sem foto, a arte será criada sem personagem/rosto personalizado. Marque a opção para aceitar seguir sem foto.')
      const detalhes = !foto ? `${form.detalhes}\n\nCLIENTE ACEITOU SEGUIR SEM FOTO: criar sem personagem/rosto.` : form.detalhes
      const c = await supabase.from('clientes').insert({nome:form.nome,whatsapp:form.whatsapp,cidade:form.cidade,estado:form.estado}).select().single(); if(c.error) throw c.error
      const p = await supabase.from('pedidos').insert({cliente_id:c.data.id,tipo_arte:form.tipo_arte,valor:tipo.preco,nome_arte:form.nome_arte,profissao:form.profissao,telefone_arte:form.telefone_arte,cor_predominante:form.cor_predominante,servicos:form.servicos,detalhes,status:'novo'}).select().single(); if(p.error) throw p.error
      const pg = await supabase.from('pagamentos').insert({pedido_id:p.data.id,forma_pagamento:'A_ESCOLHER',valor:tipo.preco,status:'aguardando_previa'}); if(pg.error) throw pg.error
      await upload('fotos',foto,p.data.id,'foto'); await upload('logos',logo,p.data.id,'logo'); setOk(true)
    }catch(err){ setErro(err.message || 'Erro ao enviar pedido') }
    setLoading(false)
  }
  if(ok) return <main className="page success"><h1>✅ Pedido enviado!</h1><p>Recebemos suas informações.</p><a className="cta" href="/">Voltar</a></main>
  return <main className="page"><section className="hero"><div className="badge">Promova Profissional</div><h1>Faça seu pedido</h1></section><form onSubmit={enviar} className="card"><h2>Escolha sua arte</h2><div className="grid">{tipos.map(t=><button type="button" key={t.id} onClick={()=>set('tipo_arte',t.id)} className={'tipo '+(form.tipo_arte===t.id?'ativo':'')}><strong>{t.titulo}</strong><span>{t.texto}</span><b>{money(t.preco)}</b></button>)}</div><h2>Seus dados</h2><div className="cols"><input required placeholder="Nome" value={form.nome} onChange={e=>set('nome',e.target.value)}/><input required placeholder="WhatsApp" value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)}/></div><h2>Arquivos</h2><label className="upload">Foto para criar personagem/rosto<input type="file" accept="image/*" onChange={e=>{setFoto(e.target.files[0]);setSemFoto(false)}}/>{foto&&<small>{foto.name}</small>}</label>{!foto&&<div className="aviso-sem-foto"><strong>Você ainda não enviou foto.</strong><p>Sem foto, a arte será criada sem personagem e sem rosto personalizado.</p><label><input type="checkbox" checked={semFoto} onChange={e=>setSemFoto(e.target.checked)}/> Aceito seguir sem foto.</label></div>}<label className="upload">Logomarca se tiver<input type="file" accept="image/*" onChange={e=>setLogo(e.target.files[0])}/></label><h2>Informações da arte</h2><input required placeholder="Nome na arte" value={form.nome_arte} onChange={e=>set('nome_arte',e.target.value)}/><div className="cols"><input required placeholder="Profissão" value={form.profissao} onChange={e=>set('profissao',e.target.value)}/><input placeholder="Telefone na arte" value={form.telefone_arte} onChange={e=>set('telefone_arte',e.target.value)}/></div><div className="cols"><input placeholder="Cidade" value={form.cidade} onChange={e=>set('cidade',e.target.value)}/><input placeholder="Estado" value={form.estado} onChange={e=>set('estado',e.target.value)}/></div><input placeholder="Cor predominante" value={form.cor_predominante} onChange={e=>set('cor_predominante',e.target.value)}/><textarea placeholder="Serviços" value={form.servicos} onChange={e=>set('servicos',e.target.value)}/><textarea placeholder="Detalhes" value={form.detalhes} onChange={e=>set('detalhes',e.target.value)}/>{erro&&<p className="erro">{erro}</p>}<button className="submit" disabled={loading}>{loading?'Enviando...':'FINALIZAR PEDIDO'}</button></form></main>
}

function Admin(){
  const [pedidos,setPedidos]=useState([]), [erro,setErro]=useState(''), [loading,setLoading]=useState(true), [reviews,setReviews]=useState(loadReviews)
  async function carregar(){
    setLoading(true); setErro('')
    const pr = await supabase.from('pedidos').select('*, clientes(nome, whatsapp, cidade, estado), pagamentos(status, forma_pagamento, valor)').order('criado_em',{ascending:false})
    if(pr.error){ setErro(pr.error.message); setLoading(false); return }
    const ar = await supabase.from('arquivos').select('pedido_id,tipo,url')
    const arquivos = ar.data || []
    setPedidos((pr.data||[]).map(p=>({...p,arquivos:arquivos.filter(a=>a.pedido_id===p.id)})))
    setLoading(false)
  }
  useEffect(()=>{ carregar() },[])
  async function copiar(t){ await navigator.clipboard.writeText(t); alert('Copiado!') }
  async function mudarStatus(p,status){ const r = await supabase.from('pedidos').update({status}).eq('id',p.id); if(r.error){ alert(r.error.message); return } setPedidos(pedidos.map(x=>x.id===p.id?{...x,status}:x)) }
  function prompt(p){ return `Arte: ${p.tipo_arte}\nNome: ${p.nome_arte||''}\nProfissão: ${p.profissao||''}\nCidade: ${p.clientes?.cidade||''} ${p.clientes?.estado||''}\nTelefone: ${p.telefone_arte||p.clientes?.whatsapp||''}\nCor: ${p.cor_predominante||''}\nServiços: ${p.servicos||''}\nDetalhes: ${p.detalhes||''}\nFoto: ${imgUrl(p,'foto')||'SEM FOTO'}\nLogo: ${imgUrl(p,'logo')||'SEM LOGO'}` }
  function excluirReview(id){ const lista = reviews.filter(r=>r.id!==id); saveReviews(lista); setReviews(lista) }
  const hoje = new Date().toISOString().slice(0,10)
  const faturamento = pedidos.reduce((s,p)=>s+Number(p.valor||0),0)
  const finalizados = BASE + pedidos.filter(p=>['pago','entregue','finalizado'].includes(p.status)).length
  return <main className="admin"><aside className="sidebar"><h2>ArteIA Studio</h2><a>Dashboard</a><a>Pedidos</a><a>Avaliações</a></aside><section className="adminContent"><div className="adminTop"><h1>Painel Administrativo</h1><button onClick={carregar}>Atualizar</button></div><div className="cardsDash"><div><span>Pedidos</span><strong>{pedidos.length}</strong></div><div><span>Hoje</span><strong>{pedidos.filter(p=>(p.criado_em||'').slice(0,10)===hoje).length}</strong></div><div><span>Finalizados</span><strong>+{finalizados.toLocaleString('pt-BR')}</strong></div><div><span>Faturamento</span><strong>{money(faturamento)}</strong></div></div>{loading&&<p>Carregando...</p>}{erro&&<p className="erro">{erro}</p>}<div className="listaPedidos">{pedidos.map(p=><article className="pedidoCard pedidoCardPlus" key={p.id}><div className="pedidoFotoBox">{imgUrl(p,'foto')?<img src={imgUrl(p,'foto')}/>:<span>Sem foto</span>}</div><div><h3>{p.nome_arte||p.clientes?.nome}</h3><p>{p.profissao} • {p.tipo_arte} • {money(p.valor)}</p><p>Cliente: {p.clientes?.nome} | {p.clientes?.whatsapp}</p><p>{p.clientes?.cidade} {p.clientes?.estado} | Cor: {p.cor_predominante}</p><p><b>Serviços:</b> {p.servicos}</p><p><b>Detalhes:</b> {p.detalhes}</p><p>Status: <b>{p.status}</b></p></div><div className="acoes"><button onClick={()=>copiar(prompt(p))}>Copiar Prompt</button><button onClick={()=>copiar(imgUrl(p,'foto')||'Sem foto')}>Copiar foto</button><button onClick={()=>copiar(imgUrl(p,'logo')||'Sem logo')}>Copiar logo</button><select value={p.status||'novo'} onChange={e=>mudarStatus(p,e.target.value)}>{statusLista.map(s=><option key={s} value={s}>{s}</option>)}</select></div></article>)}</div><section className="adminBox"><h2>Avaliações</h2><div className="adminReviews">{reviews.map(r=><div className="adminReview" key={r.id}><div>{estrelas(r.estrelas)}<p>{r.texto}</p><strong>{r.nome}</strong></div><button className="deleteReview" onClick={()=>excluirReview(r.id)}>Excluir</button></div>)}</div></section></section></main>
}

function App(){ const path = window.location.pathname; if(path.startsWith('/admin')) return <Admin/>; if(path.startsWith('/pedido')) return <Formulario/>; return <Landing/> }
createRoot(document.getElementById('root')).render(<App />)
