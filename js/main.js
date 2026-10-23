(function(){
  var stage=document.getElementById('stage'),
      slides=[].slice.call(document.querySelectorAll('.slide')),
      count=document.getElementById('count'),
      bar=document.querySelector('#progress span'),
      cur=0,W=1280,H=720;

  function setupCursorGlow(){
    if(window.innerWidth<=768) return;
    var glow=document.createElement('div');
    glow.className='cursor-glow';
    document.body.appendChild(glow);

    function setGlow(x,y){
      glow.style.left=x+'px';
      glow.style.top=y+'px';
      glow.style.opacity='1';
    }

    document.addEventListener('pointermove',function(e){
      setGlow(e.clientX,e.clientY);
    });
    document.addEventListener('pointerdown',function(){
      glow.classList.add('is-hovering');
    });
    document.addEventListener('pointerup',function(){
      glow.classList.remove('is-hovering');
    });
    document.addEventListener('pointerleave',function(){
      glow.style.opacity='0';
    });
    document.addEventListener('pointerover',function(e){
      if(e.target.closest('button, .card, .cover-badge, .cover-meta span, .cue, h2, a')){
        glow.classList.add('is-hovering');
      }else{
        glow.classList.remove('is-hovering');
      }
    });
    document.addEventListener('pointerout',function(e){
      if(!e.relatedTarget || !e.relatedTarget.closest('button, .card, .cover-badge, .cover-meta span, .cue, h2, a')){
        glow.classList.remove('is-hovering');
      }
    });
  }

  setupCursorGlow();

  var spotlight=document.createElement('div');
  spotlight.className='spotlight-overlay';
  document.body.appendChild(spotlight);
  document.addEventListener('pointermove',function(e){
    spotlight.style.setProperty('--spotlight-x',e.clientX+'px');
    spotlight.style.setProperty('--spotlight-y',e.clientY+'px');
  });
  document.getElementById('spotlight-toggle').addEventListener('click',function(){
    var enabled=document.body.classList.toggle('spotlight-mode');
    this.setAttribute('aria-pressed',String(enabled));
    this.setAttribute('aria-label',enabled?'Turn off spotlight':'Turn on spotlight');
  });

  var highlightEnabled=false,
      activeHighlightColor='yellow',
      highlights={yellow:[],green:[],blue:[],pink:[]};

  function renderHighlights(){
    Object.keys(highlights).forEach(function(color){
      var name='deck-highlight-'+color;
      if(highlights[color].length){
        CSS.highlights.set(name,new Highlight(...highlights[color]));
      }else{
        CSS.highlights.delete(name);
      }
    });
  }

  var highlightToggle=document.getElementById('highlight-toggle');
  var highlightTools=document.querySelector('.highlight-tools');
  if(!window.CSS || !CSS.highlights || typeof Highlight==='undefined'){
    highlightTools.style.display='none';
  }
  highlightToggle.onclick=function(){
    highlightEnabled=!highlightEnabled;
    document.body.classList.toggle('highlight-mode',highlightEnabled);
    highlightToggle.setAttribute('aria-pressed',String(highlightEnabled));
    highlightToggle.setAttribute('aria-label',highlightEnabled?'Turn off text highlighting':'Turn on text highlighting');
    document.querySelectorAll('.highlight-color').forEach(function(button){
      button.disabled=!highlightEnabled;
    });
  };
  document.querySelectorAll('.highlight-color').forEach(function(button){
    button.disabled=true;
    button.onclick=function(){
      activeHighlightColor=button.dataset.highlightColor;
      document.querySelectorAll('.highlight-color').forEach(function(colorButton){
        colorButton.classList.toggle('selected',colorButton===button);
      });
    };
  });
  document.getElementById('highlight-clear').onclick=function(){
    Object.keys(highlights).forEach(function(color){highlights[color]=[]});
    renderHighlights();
  };
  document.addEventListener('pointerup',function(e){
    if(!highlightEnabled || e.target.closest('.highlight-tools')) return;
    var selection=window.getSelection();
    if(!selection || selection.isCollapsed || !stage.contains(selection.anchorNode) || !stage.contains(selection.focusNode)) return;
    highlights[activeHighlightColor].push(selection.getRangeAt(0).cloneRange());
    renderHighlights();
    selection.removeAllRanges();
  });

  function fit(){
    var vp=document.getElementById('viewport');
    var s=Math.min(vp.clientWidth/W,vp.clientHeight/H)*0.97;
    stage.style.transform='scale('+s+')';
  }
  function show(n,push){
    n=Math.max(0,Math.min(slides.length-1,n));
    slides.forEach(function(el,i){
      el.classList.toggle('active',i===n);
      el.classList.toggle('prev',i<n);
    });
    cur=n;
    count.textContent=(n+1)+' / '+slides.length;
    bar.style.width=((n+1)/slides.length*100)+'%';
    if(push!==false) history.replaceState(null,'','#'+(n+1));
  }
  function next(){show(cur+1)}
  function prev(){show(cur-1)}

  document.getElementById('next').onclick=next;
  document.getElementById('print-presentation').onclick=function(e){
    e.stopPropagation();
    window.print();
  };
  document.getElementById('prev').onclick=prev;
  document.getElementById('full').onclick=toggleFull;
  document.getElementById('grid').onclick=toggleOverview;

  function toggleFull(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  function toggleOverview(){
    var on=document.body.classList.toggle('overview');
    if(on){
      stage.style.cssText='transform:none;width:auto;height:auto;display:grid;grid-template-columns:repeat(auto-fill,320px);gap:16px;padding:20px;background:transparent;box-shadow:none;overflow:visible';
      slides.forEach(function(el,i){
        el.style.cssText='position:relative;inset:auto;width:1280px;height:720px;opacity:1;visibility:visible;transform:scale(.25);transform-origin:top left;margin:0 -960px -540px 0;background:#fff;cursor:pointer;outline:1px solid #d5dbe3';
        el.onclick=function(){toggleOverview();show(i)};
      });
    }else{
      stage.style.cssText='';
      slides.forEach(function(el){el.style.cssText='';el.onclick=null});
      fit();show(cur);
    }
  }

  document.addEventListener('keydown',function(e){
    if(document.body.classList.contains('overview')){ if(e.key==='Escape'||e.key==='o'||e.key==='O') toggleOverview(); return; }
    switch(e.key){
      case 'ArrowRight':case 'PageDown':case ' ':case 'Enter': e.preventDefault();next();break;
      case 'ArrowLeft':case 'PageUp':case 'Backspace': e.preventDefault();prev();break;
      case 'Home': show(0);break;
      case 'End': show(slides.length-1);break;
      case 'f':case 'F': toggleFull();break;
      case 'o':case 'O': toggleOverview();break;
    }
  });

  var tx=null, ty=null, touchLocked=false;
  document.addEventListener('touchstart',function(e){
    if(e.touches.length!==1) return;
    var t=e.touches[0]; tx=t.clientX; ty=t.clientY; touchLocked=false;
  },{passive:true});
  document.addEventListener('touchend',function(e){
    if(tx===null || touchLocked) return;
    var t=e.changedTouches[0], dx=t.clientX-tx, dy=t.clientY-ty; tx=null; ty=null;
    if(Math.abs(dy)>Math.abs(dx)){
      touchLocked=true;
      return;
    }
    if(Math.abs(dx)>60){
      dx<0?next():prev();
      return;
    }
    if(Math.abs(dx)<18 && Math.abs(dy)<18){
      var rect=stage.getBoundingClientRect();
      var x=t.clientX-rect.left;
      if(x<rect.width*0.10) prev();
      else if(x>rect.width*0.90) next();
    }
  });
  stage.addEventListener('click',function(e){
    if(highlightEnabled) return;
    if(window.innerWidth<=768) return;
    var rect=stage.getBoundingClientRect();
    var x=e.clientX-rect.left;
    if(x<rect.width*0.10) prev();
    else if(x>rect.width*0.90) next();
  });
  window.addEventListener('resize',function(){ if(!document.body.classList.contains('overview')) fit(); });

  fit();
  var start=parseInt((location.hash||'').slice(1),10);
  show(isNaN(start)?0:start-1,false);
})();
