window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// ============================================================
//  抖音网页版精简脚本  douyin_light.js
//  作用：让抖音更流畅 —— 屏蔽埋点上报、隐藏耗资源的特效/广告浮窗/红包雨
//  保留：点赞、评论、收藏、转发、关注、滑动、直播、弹幕、红包/福袋领取
//  红包雨：带右下角一键开关按钮（状态存 localStorage，刷新后保持）
//  说明：若打包后误隐藏了某个功能，改此文件对应关键词即可
// ============================================================
(function () {
  'use strict';

  var RAIN_KEY = '__dyRainOff__';      // 红包雨开关状态
  var LIGHT_KEY = '__dyLightOn__';     // 精简总开关（默认开）

  // =========================================================
  // 1. 屏蔽埋点上报（统计/日志域名），减少网络请求与 CPU 开销
  //    这些只是统计上报，不影响刷视频、点赞、直播等功能
  // =========================================================
  var TRACK_RE = /(log\.byteacctimg\.com|mon\.byteimg\.com|lf[0-9]-log\.byteimg\.com|bytegecko|fourier|zjs\.douyin\.com|statsig|rum\.bytedance)/i;

  function isTrackUrl(u) {
    return typeof u === 'string' && TRACK_RE.test(u);
  }

  // 拦截 fetch
  var _fetch = window.fetch;
  if (typeof _fetch === 'function') {
    window.fetch = function () {
      try {
        var u = arguments[0] && (arguments[0].url || arguments[0]);
        if (isTrackUrl(u)) return Promise.reject(new Error('blocked-track'));
      } catch (e) {}
      return _fetch.apply(this, arguments);
    };
  }

  // 拦截 XHR
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) {
    try { this.__blk = isTrackUrl(u); } catch (e) { this.__blk = false; }
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (this.__blk) return; // 不发送埋点请求
    return _send.apply(this, arguments);
  };

  // =========================================================
  // 2. 隐藏耗资源的动效 / 广告浮窗 / 礼物特效 / 红包雨
  // =========================================================
  function rainOff() { return localStorage.getItem(RAIN_KEY) === '1'; }

  // 广告/弹窗/浮窗特征关键词（命中就隐藏）
  var AD_KEYWORDS = ['feed-ad', 'douyin-ad', 'banner-ad', 'ad-container', 'advert',
    'promotion-card', 'fullscreen-guide', 'download-guide', 'app-download',
    'guide-layer', 'popup-ad'];
  // 礼物/特效/动画（占显卡资源）
  var FX_KEYWORDS = ['gift-effect', 'gift-panel-anim', 'effect-canvas', 'webcast-gift',
    'sticker-anim', 'animation-layer', 'fx-container'];
  // 红包雨
  var RAIN_KEYWORDS = ['redpack-rain', 'red-packet-rain', 'rain-anim', 'lucky-money-rain'];

  function shouldHide(el) {
    if (!el || el.nodeType !== 1) return false;
    var cls = (el.className && String(el.className)) || '';
    var id = (el.id && String(el.id)) || '';
    var lower = (cls + ' ' + id).toLowerCase();

    // 红包雨按开关决定
    if (RAIN_KEYWORDS.some(function (k) { return lower.indexOf(k) > -1; })) {
      return rainOff(); // 开关打开时隐藏，关闭时保留
    }
    // 广告 / 特效
    if (AD_KEYWORDS.some(function (k) { return lower.indexOf(k) > -1; })) return true;
    if (FX_KEYWORDS.some(function (k) { return lower.indexOf(k) > -1; })) return true;

    return false;
  }

  function process(root) {
    if (!root) return;
    var list = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (var i = 0; i < list.length; i++) {
      if (shouldHide(list[i])) {
        try {
          list[i].style.display = 'none';
          list[i].style.visibility = 'hidden';
        } catch (e) {}
      }
    }
    if (shouldHide(root)) {
      try { root.style.display = 'none'; } catch (e) {}
    }
  }

  var _mob = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      if (added) for (var j = 0; j < added.length; j++) process(added[j]);
    }
  });
  _mob.observe(document.documentElement, { childList: true, subtree: true });

  // =========================================================
  // 3. 右下角悬浮：红包雨一键开关按钮
  // =========================================================
  function addToggle() {
    if (document.getElementById('dy-light-toggle')) return;
    var btn = document.createElement('div');
    btn.id = 'dy-light-toggle';
    btn.textContent = rainOff() ? '红包雨:关' : '红包雨:开';
    btn.style.cssText =
      'position:fixed;right:16px;bottom:120px;z-index:2147483647;' +
      'background:rgba(20,20,20,.85);color:#fff;font-size:13px;' +
      'padding:6px 12px;border-radius:16px;cursor:pointer;' +
      'font-family:system-ui;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.3);';
    btn.onclick = function () {
      var now = localStorage.getItem(RAIN_KEY) === '1';
      localStorage.setItem(RAIN_KEY, now ? '0' : '1');
      btn.textContent = now ? '红包雨:开' : '红包雨:关';
      process(document.body); // 立即应用
    };
    (document.body || document.documentElement).appendChild(btn);
  }

  function boot() {
    if (localStorage.getItem(LIGHT_KEY) === '0') return;
    process(document.body || document.documentElement);
    addToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(boot, 1500);
  setTimeout(function () { process(document.body); }, 4000);
})();
