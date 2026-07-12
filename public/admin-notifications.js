(function(){
  const path=(location.pathname.replace(/\/+$/,'')||'/').toLowerCase();
  if(path!=='/admin')return;

  const STORAGE_KEY='promova_pedidos_conhecidos_v1';
  let conhecidos=new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'));
  let inicializado=conhecidos.size>0;
  let audioContext=null;

  function salvar(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(Array.from(conhecidos).slice(-500)));
  }

  function tocarCampainha(){
    try{
      audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
      const agora=audioContext.currentTime;
      [880,1175,1568].forEach((freq,index)=>{
        const osc=audioContext.createOscillator();
        const ganho=audioContext.createGain();
        osc.type='sine';
        osc.frequency.setValueAtTime(freq,agora+index*0.12);
        ganho.gain.setValueAtTime(0.0001,agora+index*0.12);
        ganho.gain.exponentialRampToValueAtTime(0.26,agora+index*0.12+0.02);
        ganho.gain.exponentialRampToValueAtTime(0.0001,agora+index*0.12+0.42);
        osc.connect(ganho);ganho.connect(audioContext.destination);
        osc.start(agora+index*0.12);osc.stop(agora+index*0.12+0.45);
      });
    }catch(_){ }
  }

  function mostrarAviso(texto){
    let toast=document.getElementById('novoPedidoToast');
    if(!toast){
      toast=document.createElement('div');
      toast.id='novoPedidoToast';
      toast.style.cssText='position:fixed;right:20px;top:20px;z-index:999999;background:#ff9f1c;color:#071b36;border:3px solid #fff;border-radius:18px;padding:16px 20px;font:900 16px Arial,sans-serif;box-shadow:0 16px 45px rgba(0,0,0,.4);max-width:340px;cursor:pointer';
      toast.onclick=()=>{toast.remove();window.focus()};
      document.body.appendChild(toast);
    }
    toast.textContent='🔔 '+texto;
    clearTimeout(toast._timer);
    toast._timer=setTimeout(()=>toast.remove(),12000);
  }

  function notificar(qtd){
    const texto=qtd===1?'Novo pedido recebido!':`${qtd} novos pedidos recebidos!`;
    tocarCampainha();
    mostrarAviso(texto);
    document.title='🔔 '+texto+' — Promova Studio';
    if('Notification' in window&&Notification.permission==='granted'){
      const n=new Notification('🔔 Promova Profissional',{body:texto+' Abra o painel para iniciar a produção.',tag:'novo-pedido',renotify:true,requireInteraction:true});
      n.onclick=()=>{window.focus();n.close()};
    }
    setTimeout(()=>{document.title='Painel Profissional — Promova Studio'},15000);
  }

  async function ativar(){
    try{
      audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
      if(audioContext.state==='suspended')await audioContext.resume();
      tocarCampainha();
      if('Notification' in window){
        const permissao=await Notification.requestPermission();
        if(permissao==='granted')mostrarAviso('Notificações ativadas com sucesso.');
        else mostrarAviso('Campainha ativada. A notificação do navegador não foi autorizada.');
      }else mostrarAviso('Campainha ativada neste navegador.');
      const botao=document.getElementById('ativarNotificacoesPedido');
      if(botao){botao.textContent='🔔 Notificações ativas';botao.disabled=true}
    }catch(error){mostrarAviso('Não foi possível ativar o som: '+error.message)}
  }

  function inserirBotao(){
    if(document.getElementById('ativarNotificacoesPedido'))return;
    const topo=document.querySelector('.adminTop');
    if(!topo)return;
    const botao=document.createElement('button');
    botao.id='ativarNotificacoesPedido';
    botao.type='button';
    botao.textContent=Notification?.permission==='granted'?'🔔 Notificações ativas':'🔔 Ativar notificações';
    botao.style.cssText='background:#ff9f1c;color:#071b36;border:0;border-radius:12px;padding:11px 15px;font-weight:900;cursor:pointer;margin-left:10px';
    botao.onclick=ativar;
    if(Notification?.permission==='granted')botao.disabled=true;
    topo.appendChild(botao);
  }

  const fetchOriginal=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const resposta=await fetchOriginal(input,init);
    try{
      const url=typeof input==='string'?input:input?.url||'';
      const metodo=(init?.method||'GET').toUpperCase();
      if(metodo==='GET'&&url.includes('/rest/v1/pedidos')){
        const dados=await resposta.clone().json();
        if(Array.isArray(dados)){
          const ids=dados.map(p=>p&&p.id).filter(Boolean).map(String);
          if(!inicializado){
            ids.forEach(id=>conhecidos.add(id));
            salvar();inicializado=true;
          }else{
            const novos=ids.filter(id=>!conhecidos.has(id));
            ids.forEach(id=>conhecidos.add(id));
            salvar();
            if(novos.length)notificar(novos.length);
          }
        }
      }
    }catch(_){ }
    return resposta;
  };

  function atualizarPainel(){
    const botao=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Atualizar');
    if(botao&&!botao.disabled)botao.click();
  }

  new MutationObserver(inserirBotao).observe(document.getElementById('root'),{childList:true,subtree:true});
  window.addEventListener('load',()=>{inserirBotao();setTimeout(atualizarPainel,2500)});
  setInterval(atualizarPainel,20000);
  inserirBotao();
})();