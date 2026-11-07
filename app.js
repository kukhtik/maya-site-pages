/* МАЙЯ — движение: появление блоков, смена регистра шапки, плавный скролл.
   Без внешних зависимостей. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var params = new URLSearchParams(location.search);
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Класс .js: без скрипта контент остаётся видимым (иначе .reveal скроет всё) */
  doc.classList.add("js");

  /* режим съёмки: ?static=1 — заморозить появления, ?shot=N — прокрутка */
  if (params.get("static") === "1") doc.classList.add("force-static");
  if (params.get("motion") === "1") doc.classList.remove("force-static");

  /* ── появление блоков ── */
  var reveals = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduced || params.get("static") === "1") {
    doc.classList.add("force-static");
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var d = parseInt(e.target.getAttribute("data-delay") || "0", 10);
        setTimeout(function () { e.target.classList.add("in"); }, d);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ── шапка: светлая на бумаге, тёмная на кислотном разделе ── */
  var bar = document.getElementById("topbar");
  var darkZone = document.getElementById("light");
  function updateBar() {
    if (!bar || !darkZone) return;
    var r = darkZone.getBoundingClientRect();
    bar.classList.toggle("is-dark", r.top <= 64 && r.bottom >= 64);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateBar(); ticking = false; });
  }, { passive: true });
  updateBar();

  /* ── мягкий параллакс обложки ── */
  var cover = document.querySelector(".cover__plate");
  var coverText = document.querySelector(".cover__text");
  if (cover && !reduced && params.get("static") !== "1") {
    var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (fine) {
      window.addEventListener("scroll", function () {
        if (window.scrollY > window.innerHeight * 1.2) return;
        var y = window.scrollY;
        if (cover) cover.style.transform = "translate3d(0," + (y * -0.06) + "px,0) rotate(-1.1deg)";
        if (coverText) coverText.style.transform = "translate3d(0," + (y * -0.03) + "px,0)";
      }, { passive: true });
    }
  }

  /* ── прокрутка к якорям с учётом фиксированной шапки ── */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (!id || id === "#") return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    if (history.replaceState) history.replaceState(null, "", id);
  });

  /* ── крючок для headless-съёмки: ?shot=N ── */
  var shot = parseInt(params.get("shot") || "0", 10);
  if (shot > 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var scenes = document.querySelectorAll("[data-scene]");
        var el = scenes[Math.min(shot, scenes.length - 1)];
        if (el) {
          var top = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, top);
        }
        document.querySelectorAll("[data-reveal]").forEach(function (r) { r.classList.add("in"); });
      }, 350);
    });
  }
})();
