/* v7 — механика: старт по кнопке на холсте, разлёт на куски,
   жизнь полотна, инфо на элементах (наведение / тап). */
(function () {
  "use strict";
  var stage = document.getElementById("stage");
  var btn = document.getElementById("start");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function open() {
    stage.classList.add("is-open");
    document.body.classList.add("opened");
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
    return;
  }

  if (btn) btn.addEventListener("click", open);

  /* параллакс: курсор смещает слои глубины (только мышь, не тач) */
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  if (fine && !reduced) {
    var raf = 0, tx = 0, ty = 0;
    function apply() {
      raf = 0;
      stage.style.setProperty("--px", tx.toFixed(1) + "px");
      stage.style.setProperty("--py", ty.toFixed(1) + "px");
    }
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 36;
      ty = (e.clientY / window.innerHeight - 0.5) * 26;
      if (!raf) raf = requestAnimationFrame(apply);
    }, {passive: true});
    window.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* инфо на кусках: на десктопе — наведение (CSS), на тач-экране — тап */
  document.addEventListener("click", function (e) {
    var tapped = e.target.closest ? e.target.closest(".piece") : null;
    var old = document.querySelectorAll(".piece.tap");
    for (var i = 0; i < old.length; i++) old[i].classList.remove("tap");
    if (tapped) tapped.classList.add("tap");
  });
})();
