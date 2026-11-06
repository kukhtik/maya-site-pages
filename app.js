/* ============================================================
   v5 — механика: статичная картинка в углу с таймером (5 с),
   затем основа разворачивается на весь экран, элементы разлетаются
   по экрану вместе с подписями, и картинка живёт дальше.
   ============================================================ */
(function () {
  "use strict";

  var HOLD = 5000;          /* сколько висит статичная картинка */
  var SCATTER = 1400;       /* длительность разлёта */
  var narrow = window.innerWidth <= 760;
  var cfg = narrow ? SCENES.mobile : SCENES.desktop;
  var uid = narrow ? 'm' : 'd';

  var stage = document.getElementById('stage');
  var bg = buildBg(cfg, uid);        /* статичная бумага — свой слой, чтобы кэшировалась */
  var base = buildBase(cfg, uid);     /* солнце с таймером и орбитой */
  var parts = buildParts(cfg, uid);

  var baseWrap = document.createElement('div');
  baseWrap.className = 'layer layer--base';
  baseWrap.appendChild(bg);
  baseWrap.appendChild(base);
  var partsWrap = document.createElement('div');
  partsWrap.className = 'layer layer--parts';
  partsWrap.appendChild(parts);
  stage.appendChild(baseWrap);
  stage.appendChild(partsWrap);

  var timerGroup = base.querySelector('#timer');
  var ring = timerGroup.querySelector('circle');
  var digits = base.querySelector('#digits');
  var CIRC = 2 * Math.PI * (cfg.sunR + 14);

  /* элементы: стартуют у солнца, затем разлетаются по своим местам */
  var items = [];
  var formNodes = parts.querySelectorAll('.form-wrap');
  var sx = cfg.sun[0], sy = cfg.sun[1];
  formNodes.forEach(function (node, i) {
    var home = cfg.forms[i];
    items.push({
      node: node,
      home: { x: home[0], y: home[1] },
      from: { x: sx, y: sy },
      rot: (i % 2 ? 1 : -1) * (8 + i * 4),
      delay: i * 90
    });
  });

  /* ---------- фаза 1: статичная картинка в углу + таймер ---------- */
  function setMini(){
    stage.classList.add('is-mini');
    ring.setAttribute('stroke-dashoffset', String(CIRC));
    ring.style.transition = 'none';
    digits.textContent = '5';
  }

  var t0 = performance.now();
  var exploded = false;

  function tick(now){
    var e = (now - t0) / HOLD;
    if (e < 1) {
      var frac = 1 - e;                       /* кольцо заполняется */
      ring.setAttribute('stroke-dashoffset', String(CIRC * frac));
      var left = Math.ceil(5 * frac);
      if (digits.textContent !== String(left)) digits.textContent = String(left);
      requestAnimationFrame(tick);
    } else {
      explode();
    }
  }

  /* ---------- фаза 2: основа на весь экран, элементы разлетаются ---------- */
  function explode(){
    exploded = true;
    stage.classList.remove('is-mini');
    stage.classList.add('is-full');
    digits.textContent = '';

    /* экранная точка солнца → координаты слоя элементов */
    var sunRect = base.querySelector('#sun').getBoundingClientRect();
    var ctm = parts.getScreenCTM();
    var pt = parts.createSVGPoint();
    pt.x = sunRect.left + sunRect.width / 2;
    pt.y = sunRect.top + sunRect.height / 2;
    var local = pt.matrixTransform(ctm.inverse());

    items.forEach(function (it, i){
      var g = it.node;
      g.style.transition = 'none';
      g.style.opacity = '0';
      /* transform как CSS-свойство: трансформация анимируется надёжно */
      g.style.transform = 'translate(' + (local.x - it.home.x).toFixed(1) + 'px,' + (local.y - it.home.y).toFixed(1) + 'px) rotate(' + it.rot + 'deg)';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          g.style.transition = 'transform ' + (SCATTER + i * 60) + 'ms cubic-bezier(.16,.84,.24,1), opacity 420ms ease';
          g.style.transform = 'translate(0px,0px) rotate(0deg)';
          g.style.opacity = '1';
        });
      });
    });
  }

  /* ---------- фаза 3: жизнь (R6) — орбита, дыхание, дрейф ---------- */
  /* орбита: осколок ходит вокруг солнца (внутри SVG, на CSS-анимации) */
  /* дыхание форм — CSS-анимация breathe на .form */
  /* пыль в луче — несколько точек, медленно всплывают */
  function dust(){
    var host = document.getElementById('dust');
    if (!host) return;
    var r = rnd(97);
    for (var i = 0; i < 8; i++) {
      var s = document.createElement('span');
      s.style.left = (r() * 100).toFixed(1) + '%';
      s.style.top = (r() * 100).toFixed(1) + '%';
      s.style.animationDelay = (r() * 12).toFixed(1) + 's';
      s.style.animationDuration = (9 + r() * 9).toFixed(1) + 's';
      host.appendChild(s);
    }
  }
  dust();

  setMini();
  requestAnimationFrame(function(){ requestAnimationFrame(tick); });

  /* пересборка при смене размера окна — картинка всегда в своей геометрии */
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    var nw = window.innerWidth <= 760;
    if (nw === narrow && Math.abs(window.innerWidth - lastW) < 120) return;
    lastW = window.innerWidth;
    location.reload();
  });

  /* для машины: текущая фаза и домашние места элементов */
  window.__stage = {
    get phase(){ return exploded ? 'full' : 'mini'; },
    hold: HOLD,
    homes: cfg.forms.map(function (f) { return [f[0], f[1]]; })
  };
})();
