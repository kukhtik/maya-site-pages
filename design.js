/* ============================================================
   ДИЗАЙН-КОД v5 — «Солнце и красные формы».
   Выведен из двух её работ:
     • солнце (курсовая-коллаж): круг с печатью в ядре + рваные лучи из бумаги;
     • красные формы (3D): купол и складки — сатиновое стекло, маджента.
   Правила: R1 ядро · R2 лучи · R3 формы · R4 два материала ·
            R5 цвет · R6 движение (всё ходит вокруг, ничего не в вакууме).

   ПРОИЗВОДИТЕЛЬНОСТЬ (было 2 fps из-за 139 фильтров):
     • печать — ОДИН <pattern> на документ, а не тысячи <rect>;
     • фильтры — только на статичных группах; на анимированных их нет;
     • тени — общая на группу либо градиентом, а не фильтром на элемент;
     • зерно бумаги — CSS-подложка (браузер растрирует один раз).
   ============================================================ */

const PAL = {
  paper:'#E8DCC3', ink:'#333333', fire:'#FF4500', glass:'#B4308C',
  brick:'#C43A18', deep:'#8E2A14',
  tones:['#EDE2CA','#E8DCC3','#E3D5B4','#F0E7D2','#DBCBA6']
};

function rnd(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const NS='http://www.w3.org/2000/svg';
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}

/* ---------- печать: один паттерн на документ ---------- */
function printPattern(uid, seed, w, h, lh, fs, header, tag){
  const r=rnd(seed);
  let bars='';let row=0;
  for(let y=0;y<h;y+=lh,row++){
    const ind=(row%6===0)?w*0.06:0;
    let x=ind;const maxw=w-ind-(row%4===0?w*0.22:0);
    while(x<maxw-6){
      const bw=6+r()*Math.max(10,fs*2.4);
      if(x+bw>maxw)break;
      const op=(row%6===0)?0.62:0.3;
      bars+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${(fs*0.62).toFixed(1)}" fill="${PAL.ink}" opacity="${op}"/>`;
      x+=bw+4+r()*6;
    }
  }
  let head='';
  if(header){
    head=`<rect x="8" y="6" width="${(w*0.62).toFixed(0)}" height="${(fs*1.5).toFixed(0)}" fill="${PAL.ink}" opacity="0.52"/>
           <rect x="8" y="${(fs*2.6).toFixed(0)}" width="${(w*0.44).toFixed(0)}" height="${(fs*1.2).toFixed(0)}" fill="${PAL.ink}" opacity="0.36"/>`;
  }
  return `<pattern id="pr${uid}${tag||''}${seed%3}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${head}${bars}</pattern>`;
}

/* ---------- рваный прямоугольник: кусок бумаги ножничным краем ---------- */
function tornRect(x,y,w,h,seed,amp){
  const r=rnd(seed);const a=amp||Math.min(w,h)*0.035;const pts=[];const n=9;
  for(let i=0;i<n;i++)pts.push([x+w*i/n, y+(r()-0.5)*a*1.6]);
  for(let i=0;i<n;i++)pts.push([x+w-(r()-0.5)*a*1.6, y+h*i/n]);
  for(let i=n;i>0;i--)pts.push([x+w*i/n, y+h+(r()-0.5)*a*1.6]);
  for(let i=n;i>0;i--)pts.push([x+(r()-0.5)*a*1.6, y+h*i/n]);
  return 'M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')+'Z';
}

/* ---------- рваный луч (R2) ---------- */
function rayPath(rIn,rOut,w,ang,r){
  const a=ang,cx=Math.cos(a),cy=Math.sin(a),px=-cy,py=cx;
  const steps=5;const L=[],R=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    /* волна по длине — неровный край бумажного луча */
    const rad=rIn+(rOut-rIn)*t+(r()-0.5)*w*0.42;
    const ww=(w/2)*(1-t*0.55)*(0.7+r()*0.6),j=(r()-0.5)*w*0.6;
    L.push([cx*rad+px*(ww+j),cy*rad+py*(ww+j)]);
    R.push([cx*rad-px*(ww-j),cy*rad-py*(ww-j)]);
  }
  return 'M'+L.concat(R.reverse()).map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')+'Z';
}

/* ---------- «тающая» форма (R3): неровность запекается в путь.
   Минимум 0.78R — чтобы подпись помещалась внутрь без clip-path
   (clip-path на анимируемой группе роняет кадры до 18 fps). ---------- */
function blobPath(cx,cy,R,seed){
  const rr=rnd(seed);const n=8;const pts=[];
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2+rr()*0.55,rad=R*(0.78+rr()*0.5);
    pts.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*0.86]);
  }
  let d='M'+pts[0][0].toFixed(1)+','+pts[0][1].toFixed(1);
  for(let i=0;i<n;i++){
    const p0=pts[i],p1=pts[(i+1)%n];
    const mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2;
    const c1x=p0[0]+(mx-p0[0])*0.5+(rr()-0.5)*R*0.34;
    const c1y=p0[1]+(my-p0[1])*0.5+(rr()-0.5)*R*0.34;
    d+=`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
  }
  return d+'Z';
}

/* ============================================================
   КОНФИГУРАЦИИ: десктоп и мобильный — разная геометрия
   ============================================================ */
const SCENES = {
  desktop:{
    w:1600,h:1000,sun:[1180,330],sunR:112,rays:32,rayIn:[112,148],
    rayOut:[185,375],rayW:[9,27],orbitR:255,
    papers:[[-40,60,540,420],[430,20,470,360],[840,70,520,330],[120,430,520,330],
             [560,380,430,400],[960,430,520,350],[300,700,480,260],[780,720,420,240],
             [60,180,300,260],[1120,180,300,240]],
    forms:[[360,770,150,31],[740,600,120,57],[520,300,96,83],[140,430,86,41],[980,840,110,19]],
    labels:[['Коллаж и графика','печать, живопись, монтаж'],
             ['3D и моушн','объект, который светится изнутри'],
             ['Фото и личный архив','снимки, каомодзи, своё'],
             ['МАЙЯ','✧°`maya`°✧'],
             ['С ДНЁМ РОЖДЕНИЯ','— твой брат','@vessperiaa']]
  },
  mobile:{
    w:900,h:1500,sun:[450,330],sunR:96,rays:26,rayIn:[96,128],
    rayOut:[150,290],rayW:[8,22],orbitR:215,
    papers:[[-30,120,520,520],[420,90,500,480],[80,640,480,420],[520,700,420,430],
             [-20,1060,520,400],[420,1120,470,330],[60,380,300,280],[560,420,300,260]],
    forms:[[250,820,140,31],[640,980,120,57],[230,560,104,83]],
    /* на мобиле подзаголовки нечитаемы — только заголовок и контакт */
    labels:[['Коллаж и графика'],
            ['3D и моушн'],
            ['МАЙЯ',null,'@vessperiaa']]
  }
};

/* ============================================================
   ОСНОВА: бумага (статичный слой) + солнце (анимированный слой).
   Разделение обязательно: если солнце в одном SVG с бумагой,
   анимация заставляет перерисовывать отфильтрованную бумагу — 33 fps.
   ============================================================ */
function buildBg(cfg, uid){
  const svg=el('svg',{id:'bgSvg',viewBox:`0 0 ${cfg.w} ${cfg.h}`,
    preserveAspectRatio:'xMidYMid slice','aria-hidden':'true'});
  const defs=el('defs',{});
  defs.innerHTML=
      printPattern(uid,101,190,104,12,6,true,'b')+
      printPattern(uid,102,190,104,11,5.4,false,'b')+
      printPattern(uid,103,190,104,13,6.6,true,'b')+
    `<filter id="dp${uid}" x="-25%" y="-25%" width="150%" height="160%">
       <feDropShadow dx="3" dy="7" stdDeviation="6" flood-color="#4A3A22" flood-opacity="0.34"/></filter>`;
  svg.appendChild(defs);

  /* фон: слои бумаги (общая тень на группу — один фильтр) */
  const bg=el('g',{filter:`url(#dp${uid})`});
  bg.appendChild(el('rect',{id:'paperRect',x:0,y:0,width:cfg.w,height:cfg.h,fill:PAL.paper}));
  cfg.papers.forEach((p,i)=>{
    const path=tornRect(p[0],p[1],p[2],p[3],i*17+3);
    bg.appendChild(el('path',{d:path,fill:PAL.tones[i%PAL.tones.length]}));
    const cp=el('clipPath',{id:`cp${uid}${i}`});cp.appendChild(el('path',{d:path}));
    bg.appendChild(cp);
    const tx=el('g',{'clip-path':`url(#cp${uid}${i})`});
    tx.appendChild(el('rect',{x:p[0],y:p[1],width:p[2],height:p[3],fill:`url(#pr${uid}b${101+(i%3)})`}));
    bg.appendChild(tx);
  });
  svg.appendChild(bg);

  /* складки — отдельная группа без тени */
  const cr=el('g',{});
  const rp=rnd(5);
  for(let i=0;i<7;i++){
    const x=rp()*cfg.w,y=rp()*cfg.h;
    cr.appendChild(el('path',{d:`M${x.toFixed(0)},${y.toFixed(0)} l${(60+rp()*140).toFixed(0)},${(30+rp()*90).toFixed(0)}`,
      stroke:'#8E7B58','stroke-width':'1',opacity:0.16,fill:'none'}));
  }
  svg.appendChild(cr);
  return svg;
}

function buildBase(cfg, uid){
  const svg=el('svg',{id:'sunSvg',viewBox:`0 0 ${cfg.w} ${cfg.h}`,
    preserveAspectRatio:'xMidYMid slice','aria-hidden':'true'});
  const defs=el('defs',{});
  defs.innerHTML=
      printPattern(uid,101,190,104,12,6,true,'s')+
      printPattern(uid,102,190,104,11,5.4,false,'s')+
    `<radialGradient id="core${uid}" cx="44%" cy="38%" r="68%">
       <stop offset="0%" stop-color="#FFF8E8"/><stop offset="52%" stop-color="#F2E1B8"/>
       <stop offset="100%" stop-color="#D6C39B"/></radialGradient>
     <radialGradient id="halo${uid}" cx="50%" cy="50%" r="50%">
       <stop offset="0%" stop-color="#FF4500" stop-opacity="0.30"/>
       <stop offset="58%" stop-color="#FF4500" stop-opacity="0.06"/>
       <stop offset="100%" stop-color="#FF4500" stop-opacity="0"/></radialGradient>`;
  svg.appendChild(defs);

  /* солнце */
  const [sx,sy]=cfg.sun;
  const sun=el('g',{id:'sun',transform:`translate(${sx},${sy})`});
  sun.appendChild(el('circle',{cx:0,cy:0,r:cfg.sunR*4.6,fill:`url(#halo${uid})`}));

  /* лучи: фильтров нет (они перерисовывались каждый кадр из-за орбиты),
     неровность запечена в сам путь */
  const raysG=el('g',{});
  const rr=rnd(21);
  const tones=[PAL.fire,PAL.fire,PAL.fire,PAL.brick,PAL.deep];
  for(let i=0;i<cfg.rays;i++){
    const a=(i/cfg.rays)*Math.PI*2+rr()*0.05;
    const rOut=cfg.rayOut[0]+rr()*(cfg.rayOut[1]-cfg.rayOut[0]);
    const w=cfg.rayW[0]+rr()*(cfg.rayW[1]-cfg.rayW[0]);
    const rIn=cfg.rayIn[0]+rr()*(cfg.rayIn[1]-cfg.rayIn[0]);
    const tone=tones[Math.floor(rr()*tones.length)];
    raysG.appendChild(el('path',{d:rayPath(rIn,rOut,w,a,rr),fill:tone,opacity:(0.66+rr()*0.32).toFixed(2)}));
    if(i%4===0){
      const a2=a+(rr()-0.5)*0.05;
      raysG.appendChild(el('path',{d:rayPath(rIn*0.96,rOut*0.78,w*0.7,a2,rr),fill:tone,
        opacity:(0.35+rr()*0.3).toFixed(2)}));
    }
    if(i%3===0){
      const g=el('g',{transform:`rotate(${(a*180/Math.PI).toFixed(1)})`});
      g.appendChild(el('rect',{x:rIn+8,y:-7,width:(rOut-rIn)*0.78,height:9,
        fill:`url(#pr${uid}s102)`,opacity:0.6}));
      raysG.appendChild(g);
    }
  }
  sun.appendChild(raysG);

  /* ядро: в нём вырезка газеты (R1) */
  const core=el('g',{});
  core.appendChild(el('circle',{cx:0,cy:0,r:cfg.sunR,fill:`url(#core${uid})`}));
  const clip=el('clipPath',{id:`coreClip${uid}`});
  clip.appendChild(el('circle',{cx:0,cy:0,r:cfg.sunR-3}));
  core.appendChild(clip);
  const cg=el('g',{'clip-path':`url(#coreClip${uid})`});
  cg.appendChild(el('rect',{x:-cfg.sunR,y:-cfg.sunR,width:cfg.sunR*2,height:cfg.sunR*2,fill:'#F6EAD0'}));
  cg.appendChild(el('rect',{x:-cfg.sunR,y:-cfg.sunR,width:cfg.sunR*2,height:cfg.sunR*2,fill:`url(#pr${uid}s101)`}));
  cg.appendChild(el('rect',{x:-cfg.sunR+10,y:-cfg.sunR+34,width:cfg.sunR*1.3,height:12,fill:PAL.ink,opacity:0.5}));
  cg.appendChild(el('rect',{x:-cfg.sunR+10,y:-cfg.sunR+52,width:cfg.sunR*0.95,height:11,fill:PAL.ink,opacity:0.36}));
  core.appendChild(cg);
  core.appendChild(el('circle',{cx:0,cy:0,r:cfg.sunR,fill:'none',stroke:'#B79E72','stroke-width':'2.5'}));
  sun.appendChild(core);

  /* ТАЙМЕР: кольцо вокруг солнца + цифры в ядре */
  const ringR=cfg.sunR+14, circ=2*Math.PI*ringR;
  const timer=el('g',{id:'timer'});
  timer.appendChild(el('circle',{cx:0,cy:0,r:ringR,fill:'none',stroke:PAL.fire,
    'stroke-width':'5','stroke-linecap':'round','stroke-dasharray':circ,'stroke-dashoffset':circ,
    transform:'rotate(-90)'}));
  const digits=el('text',{id:'digits',x:0,y:cfg.sunR*0.30,'text-anchor':'middle',
    fill:PAL.glass,'font-family':"'JetBrains Mono',monospace",'font-size':String(Math.round(cfg.sunR*0.88)),
    'letter-spacing':'1',opacity:0.96,stroke:'#FFF6E8','stroke-width':'6','stroke-opacity':'0.9','paint-order':'stroke fill'});
  digits.textContent='5';
  timer.appendChild(digits);
  sun.appendChild(timer);
  svg.appendChild(sun);

  /* орбита: осколок ходит вокруг солнца (R6) */
  const ot=el('g',{id:'orbit',style:`transform-origin:${sx}px ${sy}px;animation:spin 27s linear infinite`});
  const sh=el('g',{transform:`translate(${sx},${sy}) rotate(-24)`});
  sh.appendChild(el('path',{d:rayPath(0,58,17,0,rnd(5)),fill:PAL.fire}));
  ot.appendChild(sh);
  svg.appendChild(ot);
  svg.appendChild(el('circle',{cx:sx,cy:sy,r:cfg.orbitR,fill:'none',stroke:PAL.fire,
    'stroke-width':'1.2','stroke-dasharray':'2 14',opacity:0.3}));

  const st=el('style',{});
  st.textContent=`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
   @keyframes breathe{from{transform:scale(.975) rotate(-.5deg)}to{transform:scale(1.035) rotate(.5deg)}}`;
  svg.appendChild(st);
  return svg;
}

/* ============================================================
   ЭЛЕМЕНТЫ: красные формы с подписями (R3).
   Без фильтров: неровность запечена в путь, стекло — градиенты.
   ============================================================ */
function buildParts(cfg, uid){
  const svg=el('svg',{id:'partsSvg',viewBox:`0 0 ${cfg.w} ${cfg.h}`,
    preserveAspectRatio:'xMidYMid slice'});
  const defs=el('defs',{});
  defs.innerHTML=
      `<pattern id="pf${uid}" width="150" height="90" patternUnits="userSpaceOnUse"
         patternTransform="rotate(7) scale(0.8)">
         <rect width="150" height="90" fill="#FFF3DC"/>
         <g fill="${PAL.ink}" opacity="0.28">
           <rect x="6" y="8" width="64" height="5"/><rect x="76" y="8" width="52" height="5"/>
           <rect x="6" y="20" width="120" height="4"/><rect x="6" y="31" width="96" height="4"/>
           <rect x="6" y="42" width="112" height="4"/><rect x="6" y="53" width="70" height="4"/>
           <rect x="6" y="64" width="118" height="4"/><rect x="6" y="75" width="88" height="4"/>
         </g></pattern>
     <linearGradient id="form${uid}" x1="16%" y1="4%" x2="88%" y2="98%">
       <stop offset="0%" stop-color="#FF8A4A"/><stop offset="30%" stop-color="#FF4500"/>
       <stop offset="62%" stop-color="#D1336A"/><stop offset="100%" stop-color="#8A2470"/></linearGradient>
     <linearGradient id="sat${uid}" x1="18%" y1="0%" x2="82%" y2="100%">
       <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.30"/>
       <stop offset="26%" stop-color="#FFFFFF" stop-opacity="0.03"/>
       <stop offset="52%" stop-color="#FFFFFF" stop-opacity="0.12"/>
       <stop offset="74%" stop-color="#FFFFFF" stop-opacity="0"/>
       <stop offset="100%" stop-color="#3A0F2A" stop-opacity="0.34"/></linearGradient>
     <radialGradient id="gl${uid}" cx="32%" cy="24%" r="78%">
       <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.20"/>
       <stop offset="46%" stop-color="#FFC4E2" stop-opacity="0.05"/>
       <stop offset="100%" stop-color="#5E1446" stop-opacity="0.38"/></radialGradient>
     <radialGradient id="sh${uid}" cx="50%" cy="50%" r="50%">
       <stop offset="0%" stop-color="#2E1020" stop-opacity="0.46"/>
       <stop offset="62%" stop-color="#2E1020" stop-opacity="0.18"/>
       <stop offset="100%" stop-color="#2E1020" stop-opacity="0"/></radialGradient>`;
  svg.appendChild(defs);
  const g=el('g',{id:'parts'});

  cfg.forms.forEach((s,i)=>{
    const cx=s[0],cy=s[1],R=s[2],seed=s[3];
    const lab=cfg.labels[i]||['',''];
    const d=blobPath(cx,cy,R,seed);
    const wrap=el('g',{class:'form-wrap',id:`wrap${i}`});
    const grp=el('g',{class:'form',
      style:`transform-origin:${cx}px ${cy}px;animation:breathe ${(7+i*1.4).toFixed(1)}s ease-in-out ${(i*0.8).toFixed(1)}s infinite alternate`});
    /* тень-эллипс: без фильтра (дёшево) */
    grp.appendChild(el('ellipse',{cx:cx+R*0.10,cy:cy+R*0.42,rx:R*1.05,ry:R*0.86,fill:`url(#sh${uid})`}));
    grp.appendChild(el('path',{d:d,fill:`url(#form${uid})`,opacity:0.92}));
    /* сквозь стекло видно печать — красим по самому пути формы,
       без clip-path (он обнуляет композитинг и роняет кадры) */
    grp.appendChild(el('path',{d:d,fill:`url(#pf${uid})`,opacity:0.42}));
    /* микро-трещины: короткие, чтобы не вылезать за форму */
    const rc=rnd(seed*7+3);
    for(let k=0;k<3;k++){
      const sx=cx+(rc()-0.5)*R*0.7, sy=cy+(rc()-0.5)*R*0.6;
      grp.appendChild(el('path',{d:`M${sx.toFixed(0)},${sy.toFixed(0)} l${((rc()-0.5)*R*0.26).toFixed(0)},${((rc()-0.5)*R*0.22).toFixed(0)}`,
        stroke:'#FFF3FA','stroke-width':'1',fill:'none',opacity:0.26}));
    }
    /* подпись — ПОД бликом, как отпечатано на поверхности.
       Чтобы её было видно сквозь стекло — тёмная подложка под буквами. */
    if(lab[0]){
      const t=el('text',{x:cx,y:cy+4,fill:'#FFF3F7','font-family':"'Playfair Display',Georgia,serif",
        'font-size':String(Math.max(14,R*0.15).toFixed(0)),'text-anchor':'middle',opacity:0.99,
        stroke:'#5C0E2A','stroke-width':'3','stroke-opacity':'0.42','paint-order':'stroke fill'});
      t.textContent=lab[0];
      grp.appendChild(t);
      if(lab[1]){
        const st2=el('text',{x:cx,y:cy+Math.max(18,R*0.225),fill:'#FFE2EE','font-family':"'JetBrains Mono',monospace",
          'font-size':String(Math.max(8,R*0.062).toFixed(0)),'text-anchor':'middle',opacity:0.86,'letter-spacing':'1.2',
          stroke:'#5C0E2A','stroke-width':'2','stroke-opacity':'0.34','paint-order':'stroke fill'});
        st2.textContent=lab[1];
        grp.appendChild(st2);
      }
      /* контакт — живая ссылка */
      if(lab[2]){
        const a=el('a',{href:'https://www.instagram.com/vessperiaa/','target':'_blank','rel':'noopener'});
        const lk=el('text',{x:cx,y:cy+(lab[1]?Math.max(28,R*0.345):Math.max(20,R*0.27)),fill:'#FFF6EE',
          'font-family':"'JetBrains Mono',monospace",'font-size':String(Math.max(10,R*0.115).toFixed(0)),
          'text-anchor':'middle',opacity:0.98,'letter-spacing':'0.4',
          stroke:'#4E0A24','stroke-width':'3','stroke-opacity':'0.55','paint-order':'stroke fill'});
        lk.textContent=lab[2];
        a.appendChild(lk);
        grp.appendChild(a);
      }
    }
    /* стеклянный верх: сатин, блики, кромка среза */
    grp.appendChild(el('path',{d:d,fill:`url(#sat${uid})`}));
    grp.appendChild(el('path',{d:d,fill:`url(#gl${uid})`}));
    grp.appendChild(el('ellipse',{cx:cx-R*0.34,cy:cy-R*0.46,rx:R*0.30,ry:R*0.11,fill:'#FFFFFF',opacity:0.9,
      transform:`rotate(-24 ${cx-R*0.34} ${cy-R*0.46})`}));
    grp.appendChild(el('ellipse',{cx:cx-R*0.10,cy:cy-R*0.58,rx:R*0.11,ry:R*0.05,fill:'#FFFFFF',opacity:0.72,
      transform:`rotate(-24 ${cx-R*0.10} ${cy-R*0.58})`}));
    grp.appendChild(el('ellipse',{cx:cx+R*0.30,cy:cy+R*0.40,rx:R*0.22,ry:R*0.07,fill:'#FFD3E8',opacity:0.5,
      transform:`rotate(-24 ${cx+R*0.30} ${cy+R*0.40})`}));
    grp.appendChild(el('path',{d:d,fill:'none',stroke:'#FFE6F2','stroke-width':'2.2',opacity:0.52}));
    wrap.appendChild(grp);
    g.appendChild(wrap);
  });
  svg.appendChild(g);
  return svg;
}
