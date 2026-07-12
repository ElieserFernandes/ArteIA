(function(){
  const path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  let pedidosCapturados=[];

  async function lerJsonSeguro(resposta){
    const texto=await resposta.text();
    if(!texto)throw new Error(`O servidor respondeu sem conteúdo (${resposta.status}).`);
    try{return JSON.parse(texto)}catch{throw new Error(`Resposta inválida do servidor (${resposta.status}).`)}
  }

  const fetchAnterior=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const resposta=await fetchAnterior(input,init);
    try{
      const url=typeof input==='string'?input:input?.url||'';
      const metodo=(init?.method||'GET').toUpperCase();
      if(path==='/admin'&&metodo==='GET'&&url.includes('/rest/v1/pedidos')){
        const dados=await resposta.clone().json();
        if(Array.isArray(dados)){
          pedidosCapturados=dados;
          setTimeout(adicionarExcluirDireto,0);
        }
      }
    }catch(_){ }
    return resposta;
  };

  function dadosCard(card,index){
    const pedido=pedidosCapturados[index]||null;
    const nome=card.querySelector('h3')?.textContent?.trim()||'';
    const linhas=Array.from(card.querySelectorAll('p')).map(p=>p.textContent||'');
    const cliente=linhas.find(t=>t.startsWith('Cliente:'))||'';
    const partes=cliente.replace('Cliente:','').split('|').map(t=>t.trim());
    return {pedido_id:pedido?.id||'',nome_arte:nome,whatsapp:partes[1]||''};
  }

  async function excluirPedido(card,botao,index){
    const dados=dadosCard(card,index);
    if(!dados.pedido_id){
      alert('Não foi possível identificar o ID deste pedido. Clique em Atualizar e tente novamente.');
      return;
    }
    if(!confirm(`Excluir definitivamente o pedido “${dados.nome_arte||'selecionado'}”?\n\nPedido, pagamento e arquivos vinculados serão removidos.`))return;
    const password=prompt('Digite a senha administrativa para confirmar:');
    if(!password)return;
    const original=botao.textContent;
    botao.disabled=true;botao.textContent='Excluindo...';
    try{
      const resposta=await fetchAnterior('/api/delete-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pedido_id:dados.pedido_id,password})});
      const data=await lerJsonSeguro(resposta);
      if(!resposta.ok)throw new Error(data.error||'Não foi possível excluir o pedido.');
      if(!data.deleted||String(data.pedido_id)!==String(dados.pedido_id))throw new Error('O servidor não confirmou a exclusão do pedido correto.');
      card.style.transition='opacity .25s ease,transform .25s ease';
      card.style.opacity='0';card.style.transform='scale(.98)';
      pedidosCapturados=pedidosCapturados.filter(p=>String(p.id)!==String(dados.pedido_id));
      setTimeout(()=>card.remove(),260);
      alert('Pedido excluído definitivamente.');
    }catch(error){
      alert(error.message||'Falha ao excluir o pedido.');
      botao.disabled=false;botao.textContent=original;
    }
  }

  function adicionarExcluirDireto(){
    if(path!=='/admin')return;
    document.querySelectorAll('.pedidoCardPlus').forEach((card,index)=>{
      const pedido=pedidosCapturados[index];
      if(pedido?.id)card.dataset.pedidoId=pedido.id;
      if(card.dataset.excluirDireto==='1')return;
      const acoes=card.querySelector('.acoes');if(!acoes)return;
      const botao=document.createElement('button');
      botao.type='button';botao.className='excluirPedidoDireto';botao.textContent='🗑️ Excluir pedido';
      botao.onclick=()=>excluirPedido(card,botao,index);
      acoes.appendChild(botao);card.dataset.excluirDireto='1';
    });
  }

  function aplicarMarca(ctx,w,h,pedido){
    ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-Math.PI/5);
    const tamanho=Math.max(24,Math.round(w/20));
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${tamanho}px Arial`;
    const passoX=Math.max(280,w*.55),passoY=Math.max(130,h*.2);
    for(let y=-h;y<=h;y+=passoY){for(let x=-w;x<=w;x+=passoX){
      ctx.lineWidth=Math.max(2,tamanho/13);ctx.strokeStyle='rgba(0,0,0,.32)';ctx.fillStyle='rgba(255,255,255,.38)';
      ctx.strokeText('PRÉVIA • NÃO LIBERADA',x,y);ctx.fillText('PRÉVIA • NÃO LIBERADA',x,y);
      if(pedido){ctx.font=`700 ${Math.max(12,tamanho*.42)}px Arial`;ctx.fillStyle='rgba(255,176,0,.58)';ctx.fillText(`PEDIDO ${pedido.slice(0,8).toUpperCase()}`,x,y+tamanho*.75);ctx.font=`900 ${tamanho}px Arial`}
    }}ctx.restore();
  }

  async function protegerImagem(img){
    if(img.dataset.protegida==='1')return;
    img.dataset.protegida='1';img.draggable=false;img.style.userSelect='none';img.style.webkitUserDrag='none';img.oncontextmenu=()=>false;
    const pedido=new URLSearchParams(location.search).get('id')||'';
    try{
      const foto=new Image();foto.crossOrigin='anonymous';
      await new Promise((resolve,reject)=>{foto.onload=resolve;foto.onerror=reject;foto.src=img.src+(img.src.includes('?')?'&':'?')+'preview='+Date.now()});
      const max=900,escala=Math.min(1,max/foto.naturalWidth),w=Math.max(1,Math.round(foto.naturalWidth*escala)),h=Math.max(1,Math.round(foto.naturalHeight*escala));
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(foto,0,0,w,h);aplicarMarca(ctx,w,h,pedido);
      img.removeAttribute('srcset');img.src=canvas.toDataURL('image/jpeg',.72);img.alt='Prévia protegida';
      const aviso=document.createElement('p');aviso.className='avisoPreviaProtegida';aviso.textContent='🔒 Prévia protegida com marca d’água. O arquivo final, sem selo e em alta qualidade, será liberado após o pagamento.';img.after(aviso);
    }catch(_){
      const pai=img.parentElement;if(pai&&!pai.querySelector('.watermarkFallback')){pai.style.position='relative';const marca=document.createElement('div');marca.className='watermarkFallback';marca.textContent='PRÉVIA • NÃO LIBERADA';pai.appendChild(marca)}
    }
  }

  function protegerPrevia(){
    if(!path.startsWith('/acompanhar'))return;
    document.querySelectorAll('img.previaCliente').forEach(protegerImagem);
  }

  function inserirEstilo(){
    if(document.getElementById('orderToolsStyle'))return;
    const style=document.createElement('style');style.id='orderToolsStyle';style.textContent=`
      .excluirPedidoDireto{background:#b91c1c!important;color:#fff!important;border:0!important;border-radius:10px!important;padding:11px 14px!important;font-weight:900!important;cursor:pointer!important}.excluirPedidoDireto:hover{filter:brightness(1.12)}
      .avisoPreviaProtegida{margin:10px auto 18px;padding:10px 14px;border-radius:12px;background:#fff3cd;color:#664d03;font-weight:800;max-width:760px;text-align:center}
      .previaCliente{-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}
      .watermarkFallback{position:absolute;inset:0;display:grid;place-items:center;transform:rotate(-25deg);font:900 clamp(22px,6vw,64px) Arial;color:rgba(255,255,255,.5);text-shadow:0 2px 5px rgba(0,0,0,.6);pointer-events:none;z-index:5}
    `;document.head.appendChild(style)
  }

  function atualizar(){inserirEstilo();adicionarExcluirDireto();protegerPrevia()}
  new MutationObserver(atualizar).observe(document.getElementById('root'),{childList:true,subtree:true});
  window.addEventListener('load',atualizar);atualizar();
})();