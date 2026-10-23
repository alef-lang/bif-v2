/*
 * Tema global do portal BIF — controlador (v9)
 * API pública (inalterada): BIFTheme.get(), .set(theme), .toggle(), .apply()
 * Extra: BIFTheme.refresh() força uma nova varredura de correções.
 *
 * No tema claro, além de aplicar o atributo data-bif-theme, este script faz
 * uma varredura "inteligente" dos módulos, que nasceram no tema escuro e têm
 * muitas cores fixas no próprio CSS/HTML:
 *   • data-bif-auto-surface  → bloco com fundo escuro vira cartão claro
 *   • data-bif-auto-tint     → véu escuro translúcido vira faixa sutil
 *   • data-bif-auto-flat     → gradiente escuro decorativo é removido
 *   • data-bif-auto-border   → borda branca translúcida vira borda neutra
 *   • data-bif-auto-contrast → texto ilegível ganha contraste (mantendo o
 *                              matiz quando a cor é "de marca"/semântica)
 * Elementos podem ser protegidos com o atributo data-keep-dark ou
 * data-keep-light-text.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'bif-theme';
  var THEMES = { light: true, dark: true };
  var TITLE_STYLE_ID = 'bif-page-title-standardizer';
  var PAGE_BG = { r: 245, g: 245, b: 242, a: 1 };
  var MARKS = ['data-bif-auto-surface', 'data-bif-auto-tint', 'data-bif-auto-flat', 'data-bif-auto-border', 'data-bif-auto-contrast'];
  var observer = null;
  var pending = [];
  var scanTimer = null;

  /* ------------------------------------------------------------------ tema */
  function normalize(theme) { return THEMES[theme] ? theme : 'light'; }

  function read() {
    try { return normalize(localStorage.getItem(STORAGE_KEY)); }
    catch (error) { return 'light'; }
  }

  function isLight() { return document.documentElement.getAttribute('data-bif-theme') === 'light'; }

  function updateThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', theme === 'light' ? '#f5f5f2' : '#0d1b2a');
  }

  function apply(theme, persist) {
    var nextTheme = normalize(theme);
    var changed = document.documentElement.getAttribute('data-bif-theme') !== nextTheme;
    document.documentElement.setAttribute('data-bif-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;

    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, nextTheme); }
      catch (error) { /* tema continua funcionando sem armazenamento */ }
    }
    if (document.head) updateThemeColor(nextTheme);

    if (changed || persist !== false) {
      window.dispatchEvent(new CustomEvent('bif-theme-change', { detail: { theme: nextTheme } }));
    }
    return nextTheme;
  }

  /* ------------------------------------------------- títulos padronizados */
  function ensureTitleStyleTag() {
    if (!document.head || document.getElementById(TITLE_STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = TITLE_STYLE_ID;
    style.textContent =
      'html[data-bif-theme="light"] body [data-bif-page-title][data-bif-page-title]{' +
        'font-family:"Poppins",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;' +
        'font-weight:700!important;letter-spacing:-.02em!important;' +
        'color:#172a42!important;-webkit-text-fill-color:#172a42!important;' +
        'background:none!important;background-image:none!important;text-shadow:none!important;' +
      '}' +
      'html[data-bif-theme="light"] body [data-bif-page-title][data-bif-page-title] span{color:#172a42!important;-webkit-text-fill-color:#172a42!important;}' +
      'html[data-bif-theme="light"] [data-bif-page-subtitle]{color:#627084!important;-webkit-text-fill-color:#627084!important;text-shadow:none!important;}';
    document.head.appendChild(style);
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    if (el.closest('template,script,style,noscript,svg,defs,[hidden]')) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  function markSubtitle(titleEl) {
    var next = titleEl && titleEl.nextElementSibling;
    while (next) {
      if (/^(P|DIV|SMALL)$/i.test(next.tagName)) { next.setAttribute('data-bif-page-subtitle', ''); return; }
      next = next.nextElementSibling;
    }
  }

  function standardizePageTitles() {
    ensureTitleStyleTag();
    var selectors = [
      'body > header h1', '.app-header h1', '.app-title h1', '.header h1', '.hero h1', '.bif-hero h1',
      '.kanban-topbar h1', '.title-block h1', '.head-title h1', '.brand h1', '.page-header h1',
      '.page-header h2', '.topbar h1', '.header-title', '.page-title'
    ];
    var candidates = [];
    document.querySelectorAll(selectors.join(',')).forEach(function (title) {
      if (!isVisible(title)) return;
      if (title.closest('.modal,dialog,.login-card,[role="dialog"],[data-keep-dark]')) return;
      if (title.matches('.header-title,.page-title') && title.querySelector('h1,h2')) return;
      var tbg = effectiveBackground(title);
      if (tbg && luminance(tbg) < 0.3) return; /* título sobre bloco escuro intencional */
      if (!(title.textContent || '').replace(/\s+/g, ' ').trim()) return;
      if (candidates.indexOf(title) < 0) candidates.push(title);
    });
    if (!candidates.length) {
      document.querySelectorAll('h1').forEach(function (title) {
        if (!isVisible(title) || title.closest('.modal,dialog,.login-card,[role="dialog"],[data-keep-dark]')) return;
        if (!(title.textContent || '').replace(/\s+/g, ' ').trim()) return;
        var fbg = effectiveBackground(title);
        if (fbg && luminance(fbg) < 0.3) return;
        candidates.push(title);
      });
    }
    candidates.sort(function (a, b) {
      var ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
      if (Math.abs(ar.top - br.top) > 4) return ar.top - br.top;
      return ar.left - br.left;
    });
    var primary = candidates[0] || null;
    document.querySelectorAll('[data-bif-page-title]').forEach(function (el) { if (el !== primary) el.removeAttribute('data-bif-page-title'); });
    document.querySelectorAll('[data-bif-page-subtitle]').forEach(function (el) { el.removeAttribute('data-bif-page-subtitle'); });
    if (!primary) return;
    primary.setAttribute('data-bif-page-title', '');
    markSubtitle(primary);
  }

  /* ------------------------------------------------------ cores (helpers) */
  function parseColor(value) {
    if (!value || value === 'transparent') return null;
    var m = value.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    var p = m[1].split(/[,\s/]+/).filter(Boolean).map(function (v) { return parseFloat(v); });
    return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0, a: p.length > 3 ? p[3] : 1 };
  }
  function colorsIn(value) {
    var out = [];
    (value.match(/rgba?\([^)]+\)/gi) || []).forEach(function (c) { var p = parseColor(c); if (p) out.push(p); });
    return out;
  }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function blend(fg, bg) {
    var a = fg.a == null ? 1 : fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function toHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }
  function fromHsl(h, s, l) {
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    var r, g, b;
    if (s === 0) { r = g = b = l; } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: 1 };
  }
  /* Escurece a cor mantendo o matiz até atingir o contraste mínimo. */
  function darkenFor(fg, bg, target) {
    var hsl = toHsl(fg), s = Math.min(hsl.s, 0.78), l = Math.min(hsl.l, 0.5), c;
    for (var i = 0; i < 30; i += 1) {
      c = fromHsl(hsl.h, s, l);
      if (contrast(c, bg) >= target) return c;
      l -= 0.025;
      if (l <= 0.12) break;
    }
    return fromHsl(hsl.h, s, 0.18);
  }

  /* Fundo "escuro de tema escuro": navy/azulado ou quase preto/cinza.
     Dourados, vermelhos e verdes escuros são cores de marca/semânticas. */
  function isDarkSurface(c) {
    if (!c || luminance(c) >= 0.2) return false;
    var hsl = toHsl(c), deg = hsl.h * 360;
    return hsl.s < 0.28 || hsl.l < 0.09 || (deg >= 175 && deg <= 265);
  }

  /* --------------------------------------------------------- varredura */
  var SKIP_TAGS = /^(IMG|SVG|CANVAS|VIDEO|IFRAME|INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE|LINK|META|BR|HR|PATH|G|USE|PICTURE|SOURCE|OBJECT|EMBED|HTML|BODY)$/;
  var SKIP_CLASS = /(^|[\s_-])(logo|avatar|swatch|color-btn|card-color|dot|toggle|switch|progress|bar-fill|fill|chart|spark|knob|thumb|slider|glyph|symbol|app-logo|brand-mark|qr|signature|preview-email|kbd)([\s_-]|$)/i;
  var BUTTONISH = /^(BUTTON|A|SUMMARY|LABEL)$/;

  function protectedEl(el) {
    return !!el.closest('[data-keep-dark],[data-keep-light-text],.btn-primary,button.primary,.btn.primary,.btn-gold,.btn.gold,button.gold,.btn-login,.btn-save,.btn-abrir,.btn-open,.obr-btn-gold,.toast,.snackbar,.notification,.tooltip,pre code,.CodeMirror,.monaco-editor');
  }

  function elClass(el) { return typeof el.className === 'string' ? el.className : (el.getAttribute('class') || ''); }

  function clearMarks(el) {
    for (var i = 0; i < MARKS.length; i += 1) el.removeAttribute(MARKS[i]);
    if (el.style && el.style.getPropertyValue('--bif-fix-color')) el.style.removeProperty('--bif-fix-color');
  }

  function hasDirectText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  }

  function evaluateSurface(el, cs) {
    var tag = el.tagName;
    if (SKIP_TAGS.test(tag) || SKIP_CLASS.test(elClass(el))) return;
    var rect = null;
    function area() { if (!rect) rect = el.getBoundingClientRect(); return rect.width * rect.height; }

    var bg = parseColor(cs.backgroundColor);
    var img = cs.backgroundImage;
    var lightText = (function () { var c = parseColor(cs.color); return c && luminance(c) > 0.5; }());

    /* Botões/pílulas escuras pequenas com texto claro são intencionais. */
    var small = function () { return area() < 9000 || (rect.height < 46 && rect.width < 320); };

    /* Véu de modal (fixo e cobrindo quase toda a tela): escurece de leve, não vira cartão */
    if ((cs.position === 'fixed' || cs.position === 'absolute') && bg && bg.a >= 0.2 && isDarkSurface(bg)) {
      var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
      if (!rect) rect = el.getBoundingClientRect();
      if (rect.width >= vw * 0.85 && rect.height >= vh * 0.85) { el.setAttribute('data-bif-auto-surface', 'overlay'); return; }
    }
    if (bg && bg.a >= 0.35 && isDarkSurface(bg)) {
      if (BUTTONISH.test(tag) && lightText && small()) return;
      if (small() && lightText && /badge|chip|pill|tag|count|num/i.test(elClass(el))) return;
      if (area() < 60) return;
      el.setAttribute('data-bif-auto-surface', area() > 14000 ? 'raised' : 'flat');
      return;
    }
    if (bg && bg.a > 0.04 && bg.a < 0.35 && isDarkSurface(bg) && area() > 900) {
      el.setAttribute('data-bif-auto-tint', '');
    }
    if (img && img !== 'none' && img.indexOf('gradient') > -1 && img.indexOf('url(') < 0) {
      var stops = colorsIn(img);
      var darkStop = stops.some(function (c) { return c.a >= 0.3 && isDarkSurface(c); });
      var faint = stops.length && stops.every(function (c) { return c.a < 0.14; });
      if (darkStop) {
        if (BUTTONISH.test(tag) && lightText && small()) return;
        el.setAttribute('data-bif-auto-surface', area() > 14000 ? 'raised' : 'flat');
        return;
      }
      if (faint) el.setAttribute('data-bif-auto-flat', '');
    }
    var bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    if (bw > 0) {
      var bc = parseColor(cs.borderTopColor) || parseColor(cs.borderLeftColor);
      if (bc && bc.a < 0.35 && luminance(bc) > 0.8) el.setAttribute('data-bif-auto-border', '');
    }
  }

  function effectiveBackground(el) {
    var node = el, layers = [];
    while (node && node.nodeType === 1) {
      var cs = getComputedStyle(node);
      var bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0.04) {
        layers.push(bg);
        if (bg.a >= 0.92) break;
      } else if (cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.indexOf('gradient') > -1) {
        var stops = colorsIn(cs.backgroundImage);
        if (stops.length) {
          var avg = stops.reduce(function (acc, c) { return { r: acc.r + c.r / stops.length, g: acc.g + c.g / stops.length, b: acc.b + c.b / stops.length, a: Math.max(acc.a, c.a) }; }, { r: 0, g: 0, b: 0, a: 0 });
          layers.push(avg);
          if (avg.a >= 0.92) break;
        }
      } else if (cs.backgroundImage && cs.backgroundImage.indexOf('url(') > -1) {
        return null; /* imagem de fundo: não dá para saber */
      }
      node = node.parentElement;
    }
    var result = PAGE_BG;
    for (var i = layers.length - 1; i >= 0; i -= 1) result = blend(layers[i], result);
    return result;
  }

  function evaluateText(el, cs) {
    if (SKIP_TAGS.test(el.tagName) || !hasDirectText(el)) return;
    var fg = parseColor(cs.color);
    if (!fg || fg.a < 0.3) return; /* texto transparente (gradiente) */
    var fill = parseColor(cs.webkitTextFillColor);
    if (fill && fill.a < 0.3) return;
    var bg = effectiveBackground(el);
    if (!bg || luminance(bg) < 0.45) return; /* só corrige texto sobre fundo claro */
    var solid = blend(fg, bg);
    var size = parseFloat(cs.fontSize) || 14;
    var bold = parseInt(cs.fontWeight, 10) >= 600;
    var target = (size >= 18 || (size >= 14 && bold)) ? 3 : 4.5;
    var current = contrast(solid, bg);
    if (current >= target) return;
    /* Muito abaixo e sem matiz (cinza/branco) → tinta padrão. Colorido → mesmo matiz, escurecido. */
    var hsl = toHsl(fg);
    if (hsl.s < 0.18 || luminance(fg) > 0.75) {
      el.setAttribute('data-bif-auto-contrast', size >= 15 || bold ? 'strong' : '');
    } else {
      var c = darkenFor(fg, bg, target + 0.3);
      el.style.setProperty('--bif-fix-color', 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')');
      el.setAttribute('data-bif-auto-contrast', 'hue');
    }
  }

  function collect(root) {
    var list = [];
    if (!root || root.nodeType !== 1) root = document.body;
    if (!root) return list;
    if (root !== document.body) list.push(root);
    var all = root.getElementsByTagName('*');
    for (var i = 0; i < all.length && list.length < 14000; i += 1) list.push(all[i]);
    return list;
  }

  function scan(roots) {
    if (!isLight() || !document.body) return;
    var seen = new Set(), els = [];
    (roots && roots.length ? roots : [document.body]).forEach(function (r) {
      if (!r || !r.isConnected) return;
      collect(r).forEach(function (el) { if (!seen.has(el)) { seen.add(el); els.push(el); } });
    });
    /* 1ª passada: superfícies (lê o estilo "original", sem as marcas) */
    var visible = [];
    els.forEach(function (el) { clearMarks(el); });
    els.forEach(function (el) {
      if (protectedEl(el)) return;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      visible.push(el);
      evaluateSurface(el, cs);
    });
    /* 2ª passada: contraste do texto, já sobre as superfícies corrigidas */
    visible.forEach(function (el) {
      if (el.closest('[data-keep-light-text]')) return;
      evaluateText(el, getComputedStyle(el));
    });
    if (observer) observer.takeRecords();
  }

  function clearAll() {
    if (!document.body) return;
    MARKS.forEach(function (m) {
      document.querySelectorAll('[' + m + ']').forEach(function (el) { el.removeAttribute(m); });
    });
    document.querySelectorAll('[style*="--bif-fix-color"]').forEach(function (el) { el.style.removeProperty('--bif-fix-color'); });
    if (observer) observer.takeRecords();
  }

  function schedule(root, delay) {
    if (root && pending.indexOf(root) < 0) pending.push(root);
    clearTimeout(scanTimer);
    scanTimer = setTimeout(function () {
      var roots = pending.slice(); pending = [];
      /* Reduz raízes aninhadas */
      roots = roots.filter(function (r) { return r && r.isConnected && !roots.some(function (o) { return o !== r && o.contains && o.contains(r); }); });
      if (roots.length > 25 || roots.indexOf(document.body) > -1 || roots.indexOf(document.documentElement) > -1) roots = [document.body];
      standardizePageTitles();
      scan(roots);
    }, delay == null ? 90 : delay);
  }

  function ensureFixStyle() {
    if (!document.head || document.getElementById('bif-auto-fix-style')) return;
    var st = document.createElement('style');
    st.id = 'bif-auto-fix-style';
    st.textContent = 'html[data-bif-theme="light"] [data-bif-auto-contrast="hue"]{color:var(--bif-fix-color)!important;-webkit-text-fill-color:var(--bif-fix-color)!important;text-shadow:none!important;}';
    document.head.appendChild(st);
  }

  /* --------------------------------------------------------------- API */
  window.BIFTheme = {
    get: read,
    set: function (theme) { return apply(theme, true); },
    toggle: function () { return apply(read() === 'dark' ? 'light' : 'dark', true); },
    apply: function () { return apply(read(), false); },
    refresh: function () { schedule(document.body, 0); }
  };

  apply(read(), false);

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) apply(event.newValue, false);
  });

  window.addEventListener('bif-theme-change', function () {
    if (!document.body) return;
    if (isLight()) schedule(document.body, 30);
    else { clearAll(); standardizePageTitles(); }
  });

  document.addEventListener('DOMContentLoaded', function () {
    apply(read(), false);
    ensureFixStyle();
    standardizePageTitles();
    schedule(document.body, 40);
    setTimeout(function () { schedule(document.body, 0); }, 450);
    setTimeout(function () { schedule(document.body, 0); }, 1400);

    observer = new MutationObserver(function (mutations) {
      if (!isLight()) return;
      for (var i = 0; i < mutations.length; i += 1) {
        var m = mutations[i];
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j += 1) {
            var n = m.addedNodes[j];
            if (n.nodeType === 1) schedule(n);
            else if (n.nodeType === 3 && m.target.nodeType === 1) schedule(m.target);
          }
        } else if (m.type === 'attributes' && m.target.nodeType === 1) {
          schedule(m.target);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
  });

  window.addEventListener('load', function () { schedule(document.body, 0); });
}());
