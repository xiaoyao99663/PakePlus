console.log(
    '%cbuild from PakePlus https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
)

// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

document.addEventListener('click', hookClick, { capture: true })


/* ===== Douyin Light Script (added) ===== */
// ============================================================
//  鎶栭煶缃戦〉鐗堢簿绠€鑴氭湰  douyin_light.js
//  浣滅敤锛氳鎶栭煶鏇存祦鐣?鈥斺€?灞忚斀鍩嬬偣涓婃姤銆侀殣钘忚€楄祫婧愮殑鐗规晥/骞垮憡娴獥/绾㈠寘闆?//  淇濈暀锛氱偣璧炪€佽瘎璁恒€佹敹钘忋€佽浆鍙戙€佸叧娉ㄣ€佹粦鍔ㄣ€佺洿鎾€佸脊骞曘€佺孩鍖?绂忚棰嗗彇
//  绾㈠寘闆細甯﹀彸涓嬭涓€閿紑鍏虫寜閽紙鐘舵€佸瓨 localStorage锛屽埛鏂板悗淇濇寔锛?//  璇存槑锛氳嫢鎵撳寘鍚庤闅愯棌浜嗘煇涓姛鑳斤紝鏀规鏂囦欢瀵瑰簲鍏抽敭璇嶅嵆鍙?// ============================================================
(function () {
  'use strict';

  var RAIN_KEY = '__dyRainOff__';      // 绾㈠寘闆ㄥ紑鍏崇姸鎬?  var LIGHT_KEY = '__dyLightOn__';     // 绮剧畝鎬诲紑鍏筹紙榛樿寮€锛?
  // =========================================================
  // 1. 灞忚斀鍩嬬偣涓婃姤锛堢粺璁?鏃ュ織鍩熷悕锛夛紝鍑忓皯缃戠粶璇锋眰涓?CPU 寮€閿€
  //    杩欎簺鍙槸缁熻涓婃姤锛屼笉褰卞搷鍒疯棰戙€佺偣璧炪€佺洿鎾瓑鍔熻兘
  // =========================================================
  var TRACK_RE = /(log\.byteacctimg\.com|mon\.byteimg\.com|lf[0-9]-log\.byteimg\.com|bytegecko|fourier|zjs\.douyin\.com|statsig|rum\.bytedance)/i;

  function isTrackUrl(u) {
    return typeof u === 'string' && TRACK_RE.test(u);
  }

  // 鎷︽埅 fetch
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

  // 鎷︽埅 XHR
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) {
    try { this.__blk = isTrackUrl(u); } catch (e) { this.__blk = false; }
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (this.__blk) return; // 涓嶅彂閫佸煁鐐硅姹?    return _send.apply(this, arguments);
  };

  // =========================================================
  // 2. 闅愯棌鑰楄祫婧愮殑鍔ㄦ晥 / 骞垮憡娴獥 / 绀肩墿鐗规晥 / 绾㈠寘闆?  //    鐢ㄧ壒寰佸叧閿瘝鍖归厤 + MutationObserver 鍔ㄦ€佺洃鍚紝
  //    椤甸潰闅忔椂鎻掑叆鐨勫厓绱犱篃鑳借澶勭悊锛堟姈闊充細鍔ㄦ€佺敓鎴愶級
  // =========================================================
  function rainOff() { return localStorage.getItem(RAIN_KEY) === '1'; }

  // 骞垮憡/寮圭獥/娴獥鐗瑰緛鍏抽敭璇嶏紙鍛戒腑灏遍殣钘忥級
  var AD_KEYWORDS = ['feed-ad', 'douyin-ad', 'banner-ad', 'ad-container', 'advert',
    'promotion-card', 'fullscreen-guide', 'download-guide', 'app-download',
    'guide-layer', 'popup-ad'];
  // 绀肩墿/鐗规晥/鍔ㄧ敾锛堝崰鏄惧崱璧勬簮锛?  var FX_KEYWORDS = ['gift-effect', 'gift-panel-anim', 'effect-canvas', 'webcast-gift',
    'sticker-anim', 'animation-layer', 'fx-container'];
  // 绾㈠寘闆?  var RAIN_KEYWORDS = ['redpack-rain', 'red-packet-rain', 'rain-anim', 'lucky-money-rain'];

  function shouldHide(el) {
    if (!el || el.nodeType !== 1) return false;
    var cls = (el.className && String(el.className)) || '';
    var id = (el.id && String(el.id)) || '';
    var lower = (cls + ' ' + id).toLowerCase();

    // 绾㈠寘闆ㄦ寜寮€鍏冲喅瀹?    if (RAIN_KEYWORDS.some(function (k) { return lower.indexOf(k) > -1; })) {
      return rainOff(); // 寮€鍏虫墦寮€鏃堕殣钘忥紝鍏抽棴鏃朵繚鐣?    }
    // 骞垮憡 / 鐗规晥
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
  // 3. 鍙充笅瑙掓偓娴細绾㈠寘闆ㄤ竴閿紑鍏虫寜閽?  // =========================================================
  function addToggle() {
    if (document.getElementById('dy-light-toggle')) return;
    var btn = document.createElement('div');
    btn.id = 'dy-light-toggle';
    btn.textContent = rainOff() ? '绾㈠寘闆?鍏? : '绾㈠寘闆?寮€';
    btn.style.cssText =
      'position:fixed;right:16px;bottom:120px;z-index:2147483647;' +
      'background:rgba(20,20,20,.85);color:#fff;font-size:13px;' +
      'padding:6px 12px;border-radius:16px;cursor:pointer;' +
      'font-family:system-ui;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.3);';
    btn.onclick = function () {
      var now = localStorage.getItem(RAIN_KEY) === '1';
      localStorage.setItem(RAIN_KEY, now ? '0' : '1');
      btn.textContent = now ? '绾㈠寘闆?寮€' : '绾㈠寘闆?鍏?;
      process(document.body); // 绔嬪嵆搴旂敤
    };
    (document.body || document.documentElement).appendChild(btn);
  }

  function boot() {
    // 鎬诲紑鍏抽粯璁ゅ紑鍚簿绠€
    if (localStorage.getItem(LIGHT_KEY) === '0') return;
    process(document.body || document.documentElement);
    addToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  // 鍏滃簳锛氭煇浜涢〉闈㈠欢杩熸敞鍏?  setTimeout(boot, 1500);
  setTimeout(function () { process(document.body); }, 4000);
})();
