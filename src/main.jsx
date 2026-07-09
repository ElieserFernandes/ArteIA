import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './lib/supabase'
import './style.css'

const tipos = [
  { id:'DESENHO', titulo:'🎭 DESENHO', preco:9.90, texto:'Caricatura/mascote 3D inspirado na sua foto. Não é fotografia real.' },
  { id:'ROSTO', titulo:'📸 ROSTO', preco:19.90, texto:'Arte profissional com aparência mais realista para divulgação.' },
  { id:'COMBO', titulo:'🔥 COMBO', preco:24.90, texto:'Receba as duas artes: DESENHO + ROSTO. Melhor custo-benefício.' }
]

function money(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

function App(){
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
      const { data:pedido, error:e2 } = await supabase.from('pedidos').insert({
        cliente_id:cliente.id, tipo_arte:form.tipo_arte, valor:tipo.preco,
        nome_arte:form.nome_arte, profissao:form.profissao, telefone_arte:form.telefone_arte,
        cor_predominante:form.cor_predominante, servicos:form.servicos, detalhes:form.detalhes, status:'novo'
      }).select().single()
      if(e2) throw e2
      await upload('fotos',foto,pedido.id,'foto')
      await upload('logos',logo,pedido.id,'logo')
      setOk(true)
    }catch(err){ setErro(err.message || 'Erro ao enviar pedido') }
    setLoading(false)
  }

  if(ok) return <main className="page success"><h1>✅ Pedido enviado!</h1><p>Recebemos suas informações. Em alguns minutos enviaremos sua prévia pelo WhatsApp.</p></main>

  return <main className="page">
    <section className="hero"><div className="badge">🎨 ARTEIA</div><h1>Artes profissionais para divulgação</h1><p>Preencha em menos de 1 minuto e receba sua prévia.</p></section>
    <form onSubmit={enviar} className="card">
      <h2>1. Escolha sua arte</h2>
      <div className="grid">
        {tipos.map(t=><button type="button" key={t.id} onClick={()=>set('tipo_arte',t.id)} className={'tipo '+(form.tipo_arte===t.id?'ativo':'')}>
          <strong>{t.titulo}</strong><span>{t.texto}</span><b>{money(t.preco)}</b>{t.id==='COMBO' && <em>MAIS VENDIDO</em>}
        </button>)}
      </div>
      <div className="aviso">Importante: DESENHO é caricatura/mascote 3D inspirado na foto. Não é imagem real/fotográfica.</div>

      <h2>2. Seus dados</h2>
      <div className="cols"><input required placeholder="Nome completo" value={form.nome} onChange={e=>set('nome',e.target.value)}/><input required placeholder="WhatsApp" value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)}/></div>
      <div className="cols"><input placeholder="Cidade" value={form.cidade} onChange={e=>set('cidade',e.target.value)}/><input placeholder="Estado" value={form.estado} onChange={e=>set('estado',e.target.value)}/></div>

      <h2>3. Arquivos</h2>
      <label className="upload">📷 Enviar foto obrigatória<input required type="file" accept="image/*" onChange={e=>setFoto(e.target.files[0])}/>{foto && <small>{foto.name}</small>}</label>
      <label className="upload">📁 Enviar logomarca se tiver<input type="file" accept="image/*" onChange={e=>setLogo(e.target.files[0])}/>{logo && <small>{logo.name}</small>}</label>

      <h2>4. Informações da arte</h2>
      <input required placeholder="Nome que aparecerá na arte" value={form.nome_arte} onChange={e=>set('nome_arte',e.target.value)}/>
      <div className="cols"><input required placeholder="Profissão" value={form.profissao} onChange={e=>set('profissao',e.target.value)}/><input placeholder="Telefone que aparecerá" value={form.telefone_arte} onChange={e=>set('telefone_arte',e.target.value)}/></div>
      <input placeholder="Cor predominante" value={form.cor_predominante} onChange={e=>set('cor_predominante',e.target.value)}/>
      <textarea placeholder="Serviços. Ex: Instalação elétrica, troca de padrão, manutenção..." value={form.servicos} onChange={e=>set('servicos',e.target.value)} />
      <textarea placeholder="Detalhes adicionais. Ex: fundo branco, sem boné, colocar escada..." value={form.detalhes} onChange={e=>set('detalhes',e.target.value)} />

      <div className="resumo"><span>Resumo: <b>{form.tipo_arte}</b></span><strong>{money(tipo.preco)}</strong></div>
      {erro && <p className="erro">{erro}</p>}
      <button className="submit" disabled={loading}>{loading?'Enviando...':'FINALIZAR PEDIDO'}</button>
    </form>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
