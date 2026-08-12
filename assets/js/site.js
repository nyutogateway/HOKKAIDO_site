/* ============================================================
   全ページ共通の動き
   1) 画面の左右を縦に流れるロゴタイプ（l-rail）
   2) スクロール連動のフェードイン（reveal / 3 種類の出方）
   3) ヘッダーの縮小と、上端のスクロール進捗バー
   4) 記事ヒーロー背景の視差スクロール
   ※ 隠す指定はすべて JS が付けるクラス側に持たせているので、
      JS が動かない環境でも中身はそのまま読めます。
   ============================================================ */
(function () {
  'use strict';

  var RAIL_TEXT = 'HOKKAIDO FUTURE LEADERS';
  var RAIL_REPEAT = 8;   /* 1 かたまりの繰り返し数。2 かたまり並べてループさせる */

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1) 縦に流れるロゴタイプ ---- */
  function buildRails() {
    if (document.querySelector('.l-rail')) return;
    var unit = '';
    for (var i = 0; i < RAIL_REPEAT; i++) unit += RAIL_TEXT + '　·　';
    ['left', 'right'].forEach(function (side) {
      var rail = document.createElement('div');
      rail.className = 'l-rail l-rail--' + side;
      rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<div class="l-rail__track"><span>' + unit + '</span><span>' + unit + '</span></div>';
      document.body.appendChild(rail);
    });
  }

  /* ---- 1a) 全面のざらつき ---- */
  function buildGrain() {
    if (document.querySelector('.u-grain')) return;
    var g = document.createElement('div');
    g.className = 'u-grain';
    g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
  }

  /* ---- 1b) ヒーローを横に流れる人物写真（白黒・縦長） ---- */
  var HERO_DUR = 170;   /* 1 周の秒数 */

  function buildHeroFlow() {
    var strip = document.querySelector('.p-hero__strip');
    if (!strip || strip.firstChild || !window.LEADERS) return;
    var faces = window.LEADERS.map(function (r) { return r.face; }).filter(Boolean);
    if (faces.length < 2) return;
    var cells = faces.concat(faces).map(function (p) {
      return '<img src="' + p + '" alt="" loading="lazy">';
    }).join('');
    strip.innerHTML = '<div class="p-hero__track" style="animation-duration:' +
      HERO_DUR + 's">' + cells + '</div>';
  }

  /* ---- 1c) イントロのコピーを 1 文字ずつ出す ---- */
  var TYPE_SPEED = 55;   /* 1 文字あたりのミリ秒 */

  function typewriter(el) {
    if (el.dataset.typed) return;
    el.dataset.typed = '1';

    /* <br> は残したまま、文字を 1 つずつ span に包む */
    var out = el.innerHTML.split(/(<br\s*\/?>)/i).map(function (part) {
      if (/^<br/i.test(part)) return part;
      return part.split('').map(function (ch) {
        return ch.trim() === '' ? ch : '<span class="u-t">' + ch + '</span>';
      }).join('');
    }).join('');
    el.innerHTML = out;

    var chars = el.querySelectorAll('.u-t');
    if (reduced) {
      Array.prototype.forEach.call(chars, function (c) { c.classList.add('is-on'); });
      return;
    }
    var i = 0;
    (function step() {
      if (i >= chars.length) return;
      chars[i++].classList.add('is-on');
      setTimeout(step, TYPE_SPEED);
    })();
  }

  function initTypewriter() {
    var els = document.querySelectorAll('.p-intro__copy');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, typewriter);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        typewriter(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ---- 2) スクロールでフェードイン ---- */
  /* sel にマッチした要素へ cls を付け、画面に入ったら is-in を足す */
  var REVEAL = [
    { cls: 'js-up', sel: '.p-display__sub,.p-display__nav,' +
                          '.c-shead,.c-p,.p-media__lead,.p-contact__lead,.p-contact__btn,' +
                          '.p-lead__info,.p-spot__text,.p-art__nav,.p-display__ttl' },
    { cls: 'js-left', sel: '.c-ghead,.c-idx__row' },
    { cls: 'js-mask', sel: '.p-lead__ph,.p-spot__ph,.p-strip,.c-bnr' },
    { cls: 'js-pop',  sel: '.c-chip,.p-spot__ttl' }
  ];

  var observer = null;

  function ensureObserver() {
    if (observer || !('IntersectionObserver' in window)) return observer;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        observer.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    return observer;
  }

  function reveal(root) {
    if (reduced || !ensureObserver()) return;
    root = root || document;
    REVEAL.forEach(function (r) {
      var items = root.querySelectorAll(r.sel);
      Array.prototype.forEach.call(items, function (el) {
        if (el.dataset.revealed) return;
        el.dataset.revealed = '1';
        el.classList.add(r.cls);
        /* 同じ親に並ぶ要素は少しずつ遅らせる */
        var i = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        if (i > 0) el.style.transitionDelay = (Math.min(i, 6) * 70) + 'ms';
        observer.observe(el);
      });
    });
  }

  /* ---- 3) ヘッダー縮小 + 進捗バー ---- */
  function buildProgress() {
    if (document.querySelector('.l-progress')) return null;
    var bar = document.createElement('div');
    bar.className = 'l-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    return bar.firstChild;
  }

  /* ---- 4) 視差スクロール ---- */
  function parallaxTargets() {
    return Array.prototype.slice.call(document.querySelectorAll('.p-lead__bg img'));
  }

  function initScroll() {
    var header = document.querySelector('.l-header');
    var fill = buildProgress();
    var ticking = false;

    function onFrame() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;

      if (header) header.classList.toggle('is-scrolled', y > 40);

      if (fill) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        fill.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      }

      if (!reduced) {
        parallaxTargets().forEach(function (img) {
          var box = img.parentNode.getBoundingClientRect();
          if (box.bottom < 0 || box.top > window.innerHeight) return;
          img.style.transform = 'translate3d(0,' + (-box.top * 0.12) + 'px,0)';
        });
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(onFrame);
    }

    window.addEventListener('scroll', function () { onScroll(); safety(); }, { passive: true });
    window.addEventListener('resize', onScroll);
    onFrame();
  }

  /* 保険：何らかの理由で観測が働かなくても、画面内の要素は必ず出す */
  function safety() {
    var hidden = document.querySelectorAll('[data-revealed]:not(.is-in)');
    Array.prototype.forEach.call(hidden, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }

  window.siteReveal = reveal;

  document.addEventListener('DOMContentLoaded', function () {
    buildRails();
    buildGrain();
    buildHeroFlow();
    reveal(document);
    initTypewriter();
    initScroll();
    setTimeout(safety, 1500);
  });
})();
