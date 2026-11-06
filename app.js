/* v7 — механика: 5 секунд статичная картинка с таймером, потом разлёт,
   потом жизнь. Её текст на кусках плавно меняется на наш. */
(function () {
  "use strict";
  var HOLD = 5000;
  var CIRC = 584;
  var stage = document.getElementById("stage");
  var arc = document.getElementById("arc");
  var digit = document.getElementById("digit");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function open() {
    stage.classList.add("is-open");
    if (digit) digit.textContent = "";
    setTimeout(function () { stage.classList.add("is-morph"); }, 900);
    setTimeout(function () { stage.classList.add("is-live"); }, 1400);
  }

  /* полотно фиксированного размера — подгоняем под окно, чтобы
     ни один кусок не уехал за кадр ни на одной высоте экрана */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var narrow = w <= 760;
    var d = document.getElementById("canvas-d");
    var m = document.getElementById("canvas-m");
    var c = narrow ? m : d;
    var other = narrow ? d : m;
    other.style.display = "none";
    c.style.display = "block";
    var cw = narrow ? 390 : 1600, ch = narrow ? 844 : 1000;
    var s = Math.min(w / cw, h / ch);
    c.style.transform = "scale(" + s + ")";
    c.style.left = Math.round((w - cw * s) / 2) + "px";
    c.style.top = Math.round((h - ch * s) / 2) + "px";
  }
  fit();
  window.addEventListener("resize", fit);

  if (reduced) {                       /* без анимаций — сразу готовое полотно */
    stage.classList.add("is-open", "is-morph", "is-live");
    if (digit) digit.textContent = "";
    return;
  }

  var t0 = performance.now();
  function tick(now) {
    var e = Math.min(1, (now - t0) / HOLD);
    var left = Math.ceil(5 * (1 - e));
    if (arc) arc.setAttribute("stroke-dashoffset", String(CIRC * e));
    if (digit && digit.textContent !== String(left)) digit.textContent = String(left);
    if (e < 1) requestAnimationFrame(tick);
    else open();
  }
  requestAnimationFrame(tick);
})();
