/* ============================================================
   記事ページのレンダラー
   article.html?id=<slug> を読み、window.LEADERS から該当データを描画する。
   ============================================================ */
(function () {
  'use strict';

  var list = window.LEADERS || [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function nl2br(s) {
    return esc(s).split('\n').filter(function (l) { return l.trim(); }).join('<br>');
  }

  function currentSlug() {
    var q = new URLSearchParams(location.search).get('id');
    return q || location.hash.replace('#', '') || (list[0] && list[0].slug);
  }

  /* 章。写真は本文に回り込ませる（1・3 章のみ／左右交互） */
  function section(sec, i, isMsg) {
    var text = sec.paras.map(function (p) {
      return '<p' + (p.q ? ' class="p-spot__q"' : '') + '>' + nl2br(p.t) + '</p>';
    }).join('\n          ');
    var fig = sec.photo
      ? '<figure class="p-spot__ph p-spot__ph--' + (i % 4 === 0 ? 'r' : 'l') + '">' +
        '<img src="' + esc(sec.photo) + '" alt="" loading="lazy"></figure>'
      : '';
    return '' +
      '<section class="p-spot' + (isMsg ? ' p-spot--msg' : '') + '">' +
      '  <div class="l-wrap">' +
      '    <p class="c-chip">' + (isMsg ? 'MESSAGE' : 'STORY') + '</p>' +
      '    <h2 class="p-spot__ttl">' + esc(sec.title) + '</h2>' +
      '    <div class="p-spot__text">' + fig + text + '</div>' +
      '  </div>' +
      '</section>';
  }

  var STRIP_MIN = 8;    /* 1 周がビューポート幅を超えるまで繰り返す枚数 */
  var STRIP_SEC = 4;    /* 1 枚あたりの流れる秒数 */

  function strip(photos, name) {
    if (!photos || !photos.length) return '';
    var base = photos.slice();
    while (base.length < STRIP_MIN) base = base.concat(photos);
    var cells = base.concat(base).map(function (p, i) {
      return i < base.length
        ? '<img src="' + esc(p) + '" alt="' + esc(name) + ' の写真" loading="lazy">'
        : '<img src="' + esc(p) + '" alt="" aria-hidden="true" loading="lazy">';
    }).join('');
    return '<div class="p-strip">' +
      '<div class="p-strip__track" style="animation-duration:' + (base.length * STRIP_SEC) + 's">' +
      cells + '</div></div>';
  }

  /* タイトルと description は静的には出せないので、描画時に差し替える */
  function setMeta(r) {
    document.title = r.catch + '｜HOKKAIDO 未来リーダーズ';
    var meta = document.querySelector('meta[name="description"]');
    if (!meta) return;
    meta.setAttribute('content',
      r.jp + '（' + r.co + (r.role ? ' ' + r.role : '') + '）— ' + r.catch);
  }

  function render(r, idx) {
    var prev = list[(idx - 1 + list.length) % list.length];
    var next = list[(idx + 1) % list.length];

    var blocks = '';
    r.sections.forEach(function (sec, i) {
      blocks += section(sec, i, i === r.sections.length - 1);
      if (i === 1) blocks += strip(r.strip, r.jp);
    });

    setMeta(r);

    return '' +
      '<section class="p-lead">' +
      '  <div class="p-lead__bg"><img src="' + esc(r.bg) + '" alt=""></div>' +
      '  <div class="l-wrap">' +
      '    <div class="p-lead__grid">' +
      '      <figure class="p-lead__ph"><img src="' + esc(r.face) + '" alt="' + esc(r.jp) + '"></figure>' +
      '      <div class="p-lead__info">' +
      '        <h1 class="p-lead__catch">' + esc(r.catch) + '</h1>' +
      '        <p class="p-lead__en">' + esc(r.en) + '</p>' +
      '        <p class="p-lead__jp">' + esc(r.jp) + '</p>' +
      '        <p class="p-lead__co">' + esc(r.co) + (r.role ? '　' + esc(r.role) : '') + '</p>' +
      '        <p class="p-lead__prof">' + nl2br(r.lead) + '</p>' +
      (r.site ? '        <a class="p-lead__site" href="' + esc(r.site) + '" target="_blank" rel="noopener">' +
        '公式サイトを見る</a>' : '') +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</section>' +
      blocks +
      '<div class="l-wrap">' +
      '  <div class="p-art__nav">' +
      '    <a class="p-art__prev" href="article.html?id=' + esc(prev.slug) + '">' +
      '<span>PREV</span><em><i>←</i>' + esc(prev.jp) + '</em></a>' +
      '    <a class="p-art__idx" href="index.html#leaders">一覧へ戻る</a>' +
      '    <a class="p-art__next" href="article.html?id=' + esc(next.slug) + '">' +
      '<span>NEXT</span><em>' + esc(next.jp) + '<i>→</i></em></a>' +
      '  </div>' +
      '</div>';
  }

  function notFound(slug) {
    return '<div class="l-wrap"><div class="p-art__404">' +
      '<p>該当する記事が見つかりませんでした。' + (slug ? '（id: ' + esc(slug) + '）' : '') + '</p>' +
      '<a href="index.html">← INDEX へ戻る</a></div></div>';
  }

  function mount() {
    var el = document.getElementById('article');
    if (!el) return;
    var slug = currentSlug();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].slug === slug) { idx = i; break; } }
    el.innerHTML = idx < 0 ? notFound(slug) : render(list[idx], idx);
    if (window.siteReveal) window.siteReveal(el);   /* 生成した中身にもフェードインを適用 */
    window.scrollTo(0, 0);
  }

  document.addEventListener('DOMContentLoaded', mount);
  window.addEventListener('hashchange', mount);
})();
