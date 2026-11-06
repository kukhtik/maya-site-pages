/* maya-site v4 — «Нарезка».
   Её фотографии режутся на полосы и при прокрутке собираются
   в её курсовую. Полосы нарезаются здесь, на странице: файл
   остаётся целым, полоса — это тот же фон со сдвинутым
   background-position. */
(function () {
  "use strict";

  var N = 12;
  var PHOTOS = ["maya_04.jpg", "maya_05.jpg", "maya_06.jpg", "maya_07.jpg"];
  var frame = document.getElementById("frame");
  var glass = document.getElementById("glass");
  var cuts = Array.prototype.slice.call(document.querySelectorAll(".cut"));
  var flats = [document.getElementById("flat1"), document.getElementById("flat2"), document.getElementById("flat3")];
  var poster = document.getElementById("poster");
  var sign = document.getElementById("sign");
  var hint = document.getElementById("hint");

  /* --- нарезка --- */
  var strips = [];
  for (var i = 0; i < N; i++) {
    var d = document.createElement("div");
    d.className = "strip";
    d.style.setProperty("--i", String(i));
    var a = document.createElement("div");
    a.className = "s photo";
    a.style.backgroundImage = "url(assets/" + PHOTOS[i % PHOTOS.length] + ")";
    a.style.backgroundPosition = "50% " + Math.round(10 + ((i * 19) % 78)) + "%";
    var b = document.createElement("div");
    b.className = "s col";
    b.style.backgroundImage = "url(assets/work_collage.jpg)";
    d.appendChild(a);
    d.appendChild(b);
    frame.appendChild(d);
    strips.push({ el: d, photo: a, col: b, i: i });
  }

  /* --- размеры рамки под вьюпорт --- */
  function layout() {
    var w = window.innerWidth;
    var narrow = w <= 760;
    var fw = narrow ? Math.min(w * 0.74, 380) : Math.min(w * 0.29, 420);
    var fh = fw * (1040 / 655);
    frame.style.setProperty("--fw", fw.toFixed(1) + "px");
    frame.style.setProperty("--fh", fh.toFixed(1) + "px");
    frame.style.setProperty("--sh", (fh / N).toFixed(2) + "px");
  }
  layout();
  window.addEventListener("resize", layout);

  /* --- математика прокрутки --- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }

  var last = -1;
  function render() {
    requestAnimationFrame(render);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = clamp((window.scrollY || 0) / Math.max(max, 1), 0, 1);
    if (Math.abs(p - last) < 0.0004) return;
    last = p;

    /* полосы: разлёт → плоскость */
    var travel = ease(seg(p, 0.04, 0.58));
    var morph = seg(p, 0.30, 0.62);
    for (var i = 0; i < strips.length; i++) {
      var s = strips[i];
      var k = s.i - (N - 1) / 2;
      var ex = (1 - travel) * (k * 66);
      var ey = (1 - travel) * (k * 15);
      var ez = (1 - travel) * (-s.i * 118);
      var ry = (1 - travel) * (k * 2.6);
      s.el.style.transform =
        "translate3d(" + ex.toFixed(1) + "px," + ey.toFixed(1) + "px," + ez.toFixed(1) + "px)" +
        " rotateY(" + ry.toFixed(2) + "deg)";
      s.photo.style.opacity = (1 - morph).toFixed(3);
      s.col.style.opacity = morph.toFixed(3);
      s.el.style.zIndex = String(100 - Math.round(ez / 10));
    }

    /* её 3D-объект: глубже и крупнее, со своим свечением */
    var gOp = 1 - seg(p, 0.40, 0.70);
    glass.style.opacity = (0.30 + gOp * 0.70).toFixed(3);
    glass.style.transform =
      "translate3d(" + (-40 + p * 70).toFixed(0) + "px,0," + (-820 + p * 220).toFixed(0) + "px)" +
      " rotateY(" + (-14 + p * 9).toFixed(1) + "deg)";

    /* вырезки в глубине: плывут и расходятся */
    for (var c = 0; c < cuts.length; c++) {
      var cu = cuts[c];
      var dir = c % 2 === 0 ? 1 : -1;
      var drift = p * 260 * dir + c * 40;
      var rise = Math.sin(p * 3 + c) * 14;
      var cz = -900 + p * 320 + c * 90;
      cu.style.opacity = (0.25 + 0.75 * (1 - seg(p, 0.45, 0.80))).toFixed(3);
      cu.style.transform =
        "translate3d(" + (drift * 0.35).toFixed(1) + "px," + (drift * 0.22 + rise).toFixed(1) + "px," + cz.toFixed(0) + "px)" +
        " rotate(" + cu.style.getPropertyValue("--rot") + ")";
    }

    /* плоскости с текстом — до сборки */
    var tIn = seg(p, 0.16, 0.30);
    var tOut = seg(p, 0.42, 0.58);
    var flatOp = tIn * (1 - tOut);
    flats.forEach(function (f, k) {
      if (!f) return;
      var off = (k - 1) * 80;
      f.style.opacity = flatOp.toFixed(3);
      f.style.transform = "translate3d(" + (off * (1 - flatOp)).toFixed(0) + "px,0,40px) rotate(var(--rot))";
    });

    /* осадок: собранная работа чуть «оседает» в кадре */
    frame.style.transform = "scale(" + (1 + 0.02 * seg(p, 0.62, 1)).toFixed(4) + ")";

    poster.style.opacity = (1 - seg(p, 0.05, 0.19)).toFixed(3);
    poster.style.transform = "translate(-50%,-50%) translate3d(0," + ((-40 + seg(p, 0, 0.19) * 40).toFixed(0)) + "px,0)";
    sign.style.opacity = seg(p, 0.84, 0.95).toFixed(3);
    hint.style.opacity = (1 - seg(p, 0.02, 0.10)).toFixed(3);
  }
  requestAnimationFrame(render);
})();
