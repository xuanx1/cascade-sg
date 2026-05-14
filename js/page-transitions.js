(function () {
  // Smooth scroll for back-to-top links
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#top"]');
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

(function () {
  // Auto-update copyright year
  var y = new Date().getFullYear();
  document.querySelectorAll('.copyright-year').forEach(function(el) { el.textContent = y; });
})();

(function () {
  // Custom cursor — skip if already present (index.html has its own)
  if (document.querySelector('.cursor-wrapper')) return;

  var style = document.createElement('style');
  style.textContent = [
    'body,*{cursor:none!important}',
    '.cursor,.cursor-follower{position:fixed;border-radius:100%;pointer-events:none;opacity:0;transition:opacity .3s;}',
    '.cursor{width:2em;height:2em;background:#00000033;transform:translate(-50%,-50%);transition:opacity .3s,transform .15s;}',
    '.cursor-follower{width:.4em;height:.4em;background:#333333;transform:translate(-50%,-50%);transition:opacity .3s,left .1s ease-out,top .1s ease-out;}',
    'body:hover .cursor,body:hover .cursor-follower{opacity:1;}',
    '.cursor.active{transform:translate(-50%,-50%) scale(1.6);}',
    '@media(max-width:768px){.cursor,.cursor-follower{display:none;}body,*{cursor:auto!important}}'
  ].join('');
  document.head.appendChild(style);

  var cursor = document.createElement('div');
  cursor.className = 'cursor';
  var follower = document.createElement('div');
  follower.className = 'cursor-follower';
  document.body.appendChild(cursor);
  document.body.appendChild(follower);

  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    follower.style.left = e.clientX + 'px';
    follower.style.top = e.clientY + 'px';
  });

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest('a, button')) cursor.classList.add('active');
  });
  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget || !e.relatedTarget.closest('a, button')) {
      cursor.classList.remove('active');
    }
  });
})();

(function () {
  // Mark active footer category button
  var currentDir = window.location.pathname.split('/').slice(0, -1).join('/');
  document.querySelectorAll('.footer__nav-link[data-hover-img]').forEach(function (link) {
    try {
      var linkDir = new URL(link.getAttribute('href'), window.location.href).pathname.split('/').slice(0, -1).join('/');
      if (currentDir && currentDir === linkDir) {
        link.classList.add('is-active');
      }
    } catch (e) {}
  });
})();

(function () {
  var root = document.documentElement;
  // Wait for: category-home thumbnails AND project-page hero images.
  var waitFor = document.querySelectorAll('.thumbnail-project, .absolute-img');

  function reveal() {
    if (root.classList.contains('page-ready')) return;
    root.classList.add('page-ready');
  }

  if (waitFor.length) {
    var remaining = waitFor.length;
    function tick() { if (--remaining <= 0) reveal(); }
    Array.prototype.forEach.call(waitFor, function (img) {
      if (img.complete && img.naturalWidth > 0) { tick(); return; }
      img.addEventListener('load', tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    });
    // Safety cap: don't wait longer than 3s even if some image stalls.
    setTimeout(reveal, 3000);
  } else {
    // Nothing to wait for — reveal next frame so the transition triggers.
    requestAnimationFrame(reveal);
  }

  // bfcache restore (browser back/forward) — re-trigger fade
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      root.classList.remove('page-ready', 'page-leaving');
      requestAnimationFrame(reveal);
    }
  });

  // Fade out: cover on link click, then navigate
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      link.target === '_blank' ||
      link.target === '_top'
    ) return;
    try {
      var url = new URL(href, window.location.href);
      if (url.hostname !== window.location.hostname) return;
    } catch (err) { return; }

    e.preventDefault();
    root.classList.remove('page-ready');
    root.classList.add('page-leaving');
    setTimeout(function () {
      window.location.href = href;
    }, 950);
  });
})();

// Magnifying glass lens on .project-image hover
(function () {
  var images = document.querySelectorAll('.project-image, .before-after__overlay img');
  if (!images.length) return;

  function isVideo(el) { return el && el.tagName === 'VIDEO'; }
  function isReady(el) {
    if (isVideo(el)) return el.readyState >= 2 && el.videoWidth > 0;
    return el.complete && el.naturalWidth > 0;
  }
  function natW(el) { return isVideo(el) ? el.videoWidth  : el.naturalWidth;  }
  function natH(el) { return isVideo(el) ? el.videoHeight : el.naturalHeight; }

  var RADIUS = 75;
  var ZOOM = 2;
  var DIAMETER = RADIUS * 2;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#mag-lens{display:none;position:fixed;width:' + DIAMETER + 'px;height:' + DIAMETER + 'px;',
    'border-radius:50%;border:3px solid rgba(255,255,255,0.5);',
    'box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 4px 24px rgba(0,0,0,0.18);',
    'overflow:hidden;pointer-events:none;z-index:2147483646;background:#fff;}',
    '#mag-lens canvas{position:absolute;top:0;left:0;pointer-events:none;}',
    'body.mag-active .cursor,body.mag-active .cursor-follower{opacity:0!important;transition:opacity .15s;}',
    '@media(max-width:768px){#mag-lens{display:none!important;}}'
  ].join('');
  document.head.appendChild(style);

  // Create lens
  var lens = document.createElement('div');
  lens.id = 'mag-lens';
  var canvas = document.createElement('canvas');
  canvas.width = DIAMETER;
  canvas.height = DIAMETER;
  lens.appendChild(canvas);
  document.body.appendChild(lens);
  var ctx = canvas.getContext('2d');

  var activeImg = null;

  function drawLens(e) {
    if (!activeImg || !isReady(activeImg)) return;
    var rect = activeImg.getBoundingClientRect();
    var relX = e.clientX - rect.left;
    var relY = e.clientY - rect.top;

    // Position the lens centered on cursor
    lens.style.left = (e.clientX - RADIUS) + 'px';
    lens.style.top = (e.clientY - RADIUS) + 'px';

    // Map mouse position to source media's natural coordinates, accounting for object-fit
    var nW = natW(activeImg), nH = natH(activeImg);
    var fit = isVideo(activeImg) ? 'fill' : (window.getComputedStyle(activeImg).objectFit || 'fill');
    var srcX, srcY, srcHalfW, srcHalfH;
    if (fit === 'cover' || fit === 'contain') {
      var displayScale = (fit === 'cover')
        ? Math.max(rect.width / nW, rect.height / nH)
        : Math.min(rect.width / nW, rect.height / nH);
      var offsetX = (nW * displayScale - rect.width) / 2;
      var offsetY = (nH * displayScale - rect.height) / 2;
      srcX = (relX + offsetX) / displayScale;
      srcY = (relY + offsetY) / displayScale;
      srcHalfW = RADIUS / displayScale / ZOOM;
      srcHalfH = RADIUS / displayScale / ZOOM;
    } else {
      var scaleX = nW / rect.width;
      var scaleY = nH / rect.height;
      srcX = relX * scaleX;
      srcY = relY * scaleY;
      srcHalfW = RADIUS * scaleX / ZOOM;
      srcHalfH = RADIUS * scaleY / ZOOM;
    }

    // Clear and clip to circle
    ctx.clearRect(0, 0, DIAMETER, DIAMETER);
    ctx.save();
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
    ctx.clip();

    // Draw zoomed portion of the original image
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      activeImg,
      srcX - srcHalfW, srcY - srcHalfH,
      srcHalfW * 2, srcHalfH * 2,
      0, 0, DIAMETER, DIAMETER
    );

    // Lens border ring
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS - 1.5, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();

    ctx.restore();
  }

  // Keep last pointer position so the rAF loop can redraw without a mousemove
  var lastEvt = null;
  var rafId = null;
  function loop() {
    rafId = null;
    if (activeImg && isVideo(activeImg) && lastEvt) {
      drawLens(lastEvt);
      rafId = requestAnimationFrame(loop);
    }
  }

  images.forEach(function (img) {
    img.addEventListener('mouseenter', function () {
      activeImg = this;
      lens.style.display = 'block';
      document.body.classList.add('mag-active');
      if (isVideo(activeImg) && lastEvt && rafId == null) {
        rafId = requestAnimationFrame(loop);
      }
    });

    img.addEventListener('mouseleave', function () {
      lens.style.display = 'none';
      activeImg = null;
      ctx.clearRect(0, 0, DIAMETER, DIAMETER);
      document.body.classList.remove('mag-active');
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
    });

    img.addEventListener('mousemove', function (e) {
      lastEvt = e;
      drawLens(e);
      if (isVideo(activeImg) && rafId == null) {
        rafId = requestAnimationFrame(loop);
      }
    });
  });
})();
