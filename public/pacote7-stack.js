(function(){
  const STYLE_ID='pacote7-stack-style';
  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .semanaStack7{position:relative;width:100%;height:100%;min-height:250px;overflow:hidden;border-radius:18px;background:linear-gradient(145deg,#0a2f59,#071b36)}
      .semanaStack7 .semanaFrame{position:absolute;width:58%;height:72%;left:21%;top:12%;object-fit:cover;border:5px solid #fff;border-radius:13px;box-shadow:0 10px 25px rgba(0,0,0,.35);background:#0b2d52;transform-origin:center center}
      .semanaStack7 .f1{transform:translate(-30%,-2%) rotate(-13deg);z-index:1;object-position:12% 18%}
      .semanaStack7 .f2{transform:translate(-20%,2%) rotate(-9deg);z-index:2;object-position:50% 15%}
      .semanaStack7 .f3{transform:translate(-10%,5%) rotate(-5deg);z-index:3;object-position:88% 18%}
      .semanaStack7 .f4{transform:translate(0,7%) rotate(0deg);z-index:4;object-position:12% 78%}
      .semanaStack7 .f5{transform:translate(10%,5%) rotate(5deg);z-index:5;object-position:50% 78%}
      .semanaStack7 .f6{transform:translate(20%,2%) rotate(9deg);z-index:6;object-position:88% 78%}
      .semanaStack7 .f7{transform:translate(30%,-2%) rotate(13deg);z-index:7;object-position:50% 50%}
      .semanaStack7 .semanaLabel{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:10;background:#ff9f1c;color:#071b36;font-weight:900;border-radius:999px;padding:7px 14px;white-space:nowrap;box-shadow:0 5px 14px rgba(0,0,0,.3)}
      .produtoCard .semanaStack7{height:270px;min-height:270px}
      .tipo .semanaStack7{height:260px;min-height:260px;margin-bottom:12px}
      @media(max-width:700px){.produtoCard .semanaStack7,.tipo .semanaStack7{height:220px;min-height:220px}.semanaStack7 .semanaFrame{width:54%;height:68%;left:23%;top:13%;border-width:4px}.semanaStack7 .semanaLabel{font-size:12px;padding:6px 10px}}
    `;
    document.head.appendChild(style);
  }
  function buildStack(source){
    const wrap=document.createElement('div');
    wrap.className='semanaStack7';
    for(let i=1;i<=7;i++){
      const img=document.createElement('img');
      img.className=`semanaFrame f${i}`;
      img.src=source;
      img.alt=`Exemplo de arte ${i} da semana`;
      wrap.appendChild(img);
    }
    const label=document.createElement('span');
    label.className='semanaLabel';
    label.textContent='7 ARTES • 1 POR DIA';
    wrap.appendChild(label);
    return wrap;
  }
  function aplicar(){
    injectStyle();
    document.querySelectorAll('.produtoCard, .tipo').forEach(card=>{
      if(!/7 ARTES/.test(card.textContent||'')||card.dataset.stack7==='1')return;
      const atual=card.querySelector('.pacoteVisual, .exemploArte');
      const fonte=atual?.querySelector('img')?.src;
      if(!atual||!fonte)return;
      atual.replaceWith(buildStack(fonte));
      card.dataset.stack7='1';
    });
  }
  new MutationObserver(aplicar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',aplicar);
  aplicar();
})();