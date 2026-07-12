(function(){
  if((location.pathname.replace(/\/+$/,'')||'/')==='/') history.replaceState({},'', '/pedido'+location.search+location.hash);

  const exemplo='/exemplos/pacote-foto.svg';
  const dias=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];

  function criarPilha7(){
    const wrap=document.createElement('div');
    wrap.className='pilha7Artes';
    dias.forEach((dia,index)=>{
      const frame=document.createElement('div');
      frame.className=`arteFrame arteFrame${index+1}`;
      const img=document.createElement('img');
      img.src=exemplo;
      img.alt=`Arte de ${dia}`;
      const tag=document.createElement('span');
      tag.textContent=dia;
      frame.append(img,tag);
      wrap.appendChild(frame);
    });
    const selo=document.createElement('strong');
    selo.className='selo7Artes';
    selo.textContent='7 ARTES • 1 POR DIA';
    wrap.appendChild(selo);
    return wrap;
  }

  function aplicarPilha(){
    document.querySelectorAll('.produtoCard, .tipo').forEach(card=>{
      if(!/7 ARTES/.test(card.textContent||'')||card.dataset.pilha7==='1')return;
      const visual=card.querySelector('.pacoteVisual, .exemploArte');
      if(!visual)return;
      visual.replaceWith(criarPilha7());
      card.dataset.pilha7='1';
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
    if(document.getElementById('pilha7Style'))return;
    const style=document.createElement('style');
    style.id='pilha7Style';
    style.textContent=`
      .pilha7Artes{position:relative;height:270px;border-radius:18px;overflow:hidden;background:linear-gradient(145deg,#0a2f59,#061a31)}
      .arteFrame{position:absolute;width:48%;height:66%;left:26%;top:12%;border:5px solid #fff;border-radius:14px;overflow:hidden;background:#0b2d52;box-shadow:0 10px 24px rgba(0,0,0,.38);transform-origin:center center}
      .arteFrame img{width:100%;height:100%;object-fit:cover;display:block}
      .arteFrame span{position:absolute;right:7px;top:7px;background:#ff9f1c;color:#071b36;font-size:10px;font-weight:900;border-radius:999px;padding:4px 7px}
      .arteFrame1{transform:translate(-42%,-2%) rotate(-15deg);z-index:1}
      .arteFrame2{transform:translate(-28%,2%) rotate(-10deg);z-index:2}
      .arteFrame3{transform:translate(-14%,5%) rotate(-5deg);z-index:3}
      .arteFrame4{transform:translate(0,7%) rotate(0deg);z-index:4}
      .arteFrame5{transform:translate(14%,5%) rotate(5deg);z-index:5}
      .arteFrame6{transform:translate(28%,2%) rotate(10deg);z-index:6}
      .arteFrame7{transform:translate(42%,-2%) rotate(15deg);z-index:7}
      .selo7Artes{position:absolute;z-index:10;left:50%;bottom:10px;transform:translateX(-50%);background:#ff9f1c;color:#071b36;border-radius:999px;padding:7px 13px;font-size:12px;white-space:nowrap;box-shadow:0 5px 14px rgba(0,0,0,.3)}
      .tipo .pilha7Artes{height:250px;margin-bottom:12px}
      @media(max-width:700px){.pilha7Artes,.tipo .pilha7Artes{height:220px}.arteFrame{width:46%;height:63%;left:27%;border-width:4px}.selo7Artes{font-size:11px}}
    `;
    document.head.appendChild(style);
  }

  function atualizar(){inserirEstilo();aplicarPilha();adicionarProvaSocial()}
  new MutationObserver(atualizar).observe(document.getElementById('root'),{childList:true,subtree:true});
  window.addEventListener('load',atualizar);
  atualizar();
})();