(function(){
  if((location.pathname.replace(/\/+$/,'')||'/')==='/') history.replaceState({},'', '/pedido'+location.search+location.hash);

  const exemplo='/exemplos/pacote-foto.svg';
  const configs={
    PACOTE5:{quantidade:5,selo:'5 ARTES • PACOTE ESSENCIAL',rotulo:['1','2','3','4','5']},
    PACOTE7:{quantidade:7,selo:'7 ARTES • 1 POR DIA',rotulo:['SEG','TER','QUA','QUI','SEX','SÁB','DOM']},
    PACOTE10:{quantidade:10,selo:'10 ARTES • PACOTE COMPLETO',rotulo:['1','2','3','4','5','6','7','8','9','10']},
    COMBO:{quantidade:8,selo:'COMBO COMPLETO • TUDO INCLUSO',rotulo:['DESENHO','ROSTO','10','7','SOCIAL','SEMANA','PLUS','VIP']}
  };

  function identificar(card){
    const texto=(card.textContent||'').toUpperCase();
    if(texto.includes('COMBO COMPLETO'))return 'COMBO';
    if(texto.includes('10 ARTES'))return 'PACOTE10';
    if(texto.includes('7 ARTES'))return 'PACOTE7';
    if(texto.includes('5 ARTES'))return 'PACOTE5';
    return '';
  }

  function criarPilha(tipo){
    const cfg=configs[tipo];
    const wrap=document.createElement('div');
    wrap.className=`pilhaArtes pilha${cfg.quantidade} pilha${tipo}`;
    wrap.setAttribute('aria-label',cfg.selo);

    cfg.rotulo.forEach((rotulo,index)=>{
      const frame=document.createElement('div');
      frame.className=`arteFrame arteFrame${index+1}`;
      frame.style.setProperty('--i',index);
      frame.style.setProperty('--n',cfg.quantidade);
      const img=document.createElement('img');
      img.src=exemplo;
      img.alt=`Exemplo ${rotulo}`;
      img.style.objectPosition=`center ${18+(index%5)*16}%`;
      const tag=document.createElement('span');
      tag.textContent=rotulo;
      frame.append(img,tag);
      wrap.appendChild(frame);
    });

    const selo=document.createElement('strong');
    selo.className='seloPilhaArtes';
    selo.textContent=cfg.selo;
    wrap.appendChild(selo);
    return wrap;
  }

  function aplicarPilhas(){
    document.querySelectorAll('.produtoCard, .tipo').forEach(card=>{
      const tipo=identificar(card);
      if(!tipo||card.dataset.pilhaPacote==='1')return;
      const visual=card.querySelector('.pacoteVisual, .exemploArte, .pilha7Artes, .pilhaArtes');
      if(!visual)return;
      visual.replaceWith(criarPilha(tipo));
      card.dataset.pilhaPacote='1';
    });
  }

  function adicionarProvaSocial(){
    if(!location.pathname.toLowerCase().startsWith('/pedido'))return;
    const pagina=document.querySelector('.pedidoPage');
    if(!pagina||document.querySelector('.pedidoSocialProof'))return;
    const sec=document.createElement('section');
    sec.className='pedidoSocialProof';
    sec.innerHTML=`
      <div class="pedidoStats">
        <div><strong>+2.500</strong><span>clientes atendidos</span></div>
        <div><strong>4,9/5</strong><span>avaliação média</span></div>
        <div><strong>100%</strong><span>atendimento profissional</span></div>
      </div>
      <div class="pedidoReviews">
        <h2>Clientes satisfeitos</h2>
        <div class="pedidoReviewGrid">
          <article class="pedidoReviewCard"><div class="stars">★★★★★</div><p>“A arte ficou perfeita e muito profissional.”</p><strong>Carlos M.</strong><small>Eletricista</small></article>
          <article class="pedidoReviewCard"><div class="stars">★★★★★</div><p>“Atendimento rápido e resultado lindo.”</p><strong>Ana L.</strong><small>Cabeleireira</small></article>
          <article class="pedidoReviewCard"><div class="stars">★★★★★</div><p>“Melhorou muito minha divulgação.”</p><strong>Roberto S.</strong><small>Encanador</small></article>
        </div>
      </div>`;
    pagina.appendChild(sec);
  }

  function inserirEstilo(){
    if(document.getElementById('pilhaPacotesStyle'))return;
    const style=document.createElement('style');
    style.id='pilhaPacotesStyle';
    style.textContent=`
      .pilhaArtes{position:relative;height:270px;border-radius:18px;overflow:hidden;background:linear-gradient(145deg,#0a2f59,#061a31);isolation:isolate}
      .pilhaArtes .arteFrame{position:absolute;width:46%;height:64%;left:27%;top:11%;border:5px solid #fff;border-radius:14px;overflow:hidden;background:#0b2d52;box-shadow:0 10px 24px rgba(0,0,0,.42);transform-origin:center center;transition:transform .25s ease}
      .pilhaArtes .arteFrame img{width:100%;height:100%;object-fit:cover;display:block}
      .pilhaArtes .arteFrame span{position:absolute;right:6px;top:6px;max-width:88%;overflow:hidden;text-overflow:ellipsis;background:#ff9f1c;color:#071b36;font-size:9px;font-weight:900;border-radius:999px;padding:4px 7px;white-space:nowrap}
      .pilhaArtes .arteFrame:nth-child(1){transform:translate(-48%,-3%) rotate(-17deg);z-index:1}
      .pilhaArtes .arteFrame:nth-child(2){transform:translate(-36%,0) rotate(-13deg);z-index:2}
      .pilhaArtes .arteFrame:nth-child(3){transform:translate(-24%,3%) rotate(-9deg);z-index:3}
      .pilhaArtes .arteFrame:nth-child(4){transform:translate(-12%,5%) rotate(-5deg);z-index:4}
      .pilhaArtes .arteFrame:nth-child(5){transform:translate(0,7%) rotate(0deg);z-index:5}
      .pilhaArtes .arteFrame:nth-child(6){transform:translate(12%,5%) rotate(5deg);z-index:6}
      .pilhaArtes .arteFrame:nth-child(7){transform:translate(24%,3%) rotate(9deg);z-index:7}
      .pilhaArtes .arteFrame:nth-child(8){transform:translate(36%,0) rotate(13deg);z-index:8}
      .pilhaArtes .arteFrame:nth-child(9){transform:translate(46%,-2%) rotate(16deg);z-index:9}
      .pilhaArtes .arteFrame:nth-child(10){transform:translate(54%,-4%) rotate(19deg);z-index:10}
      .pilhaArtes:hover .arteFrame:nth-child(odd){filter:brightness(1.04)}
      .seloPilhaArtes{position:absolute;z-index:20;left:10px;right:10px;bottom:10px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-height:34px;background:#ff9f1c;color:#071b36;border-radius:999px;padding:7px 12px;font-size:clamp(9px,2.7vw,11px);line-height:1.1;text-align:center;white-space:normal;overflow-wrap:anywhere;box-shadow:0 5px 14px rgba(0,0,0,.35)}
      .tipo .pilhaArtes{height:250px;margin-bottom:12px}
      .pilhaPACOTE5 .arteFrame{width:50%;left:25%}
      .pilhaPACOTE10 .arteFrame{width:42%;left:29%;height:61%}
      .pilhaCOMBO{background:radial-gradient(circle at 50% 20%,#174f83,#061a31 68%)}
      .pilhaCOMBO .arteFrame{width:43%;left:28.5%;height:61%;border-color:#fff7dd}
      .pilhaCOMBO .seloPilhaArtes{background:linear-gradient(90deg,#ffb000,#ff8a00);font-weight:950}
      @media(max-width:700px){.pilhaArtes,.tipo .pilhaArtes{height:220px}.pilhaArtes .arteFrame{width:44%;height:61%;left:28%;border-width:4px}.pilhaPACOTE5 .arteFrame{width:48%;left:26%}.seloPilhaArtes{left:8px;right:8px;bottom:8px;min-height:32px;padding:6px 9px;font-size:10px}}
    `;
    document.head.appendChild(style);
  }

  function atualizar(){inserirEstilo();aplicarPilhas();adicionarProvaSocial()}
  new MutationObserver(atualizar).observe(document.getElementById('root'),{childList:true,subtree:true});
  window.addEventListener('load',atualizar);
  atualizar();
})();