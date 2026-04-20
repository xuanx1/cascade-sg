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
  // Auto-sync thumbnail tags from project spec pages
  var links = document.querySelectorAll('.projects__link[href]');
  if (!links.length) return;
  links.forEach(function (link) {
    var tagEl = link.querySelector('.tag .text-small');
    if (!tagEl) return;
    var href = link.getAttribute('href');
    fetch(href)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var addr = tmp.querySelector('.project__address .text-large');
        if (addr && addr.textContent.trim()) {
          tagEl.textContent = addr.textContent.trim();
        }
      })
      .catch(function () {});
  });
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
  // Inject overlay
  var overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:#fff',
    'z-index:99999',
    'pointer-events:none',
    'opacity:1',
    'transition:opacity 0.9s ease'
  ].join(';');
  document.documentElement.appendChild(overlay);

  // Fade in: reveal the incoming page (double rAF for paint timing)
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      overlay.style.opacity = '0';
    });
  });

  // bfcache restore (browser back/forward) — overlay stuck at opacity:1, force fade out
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      overlay.style.transition = 'none';
      overlay.style.opacity = '1';
      requestAnimationFrame(function () {
        overlay.style.transition = 'opacity 0.9s ease';
        requestAnimationFrame(function () {
          overlay.style.opacity = '0';
        });
      });
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
    overlay.style.opacity = '1';
    setTimeout(function () {
      window.location.href = href;
    }, 950);
  });
})();

// Magnifying glass lens on .project-image hover
(function () {
  var images = document.querySelectorAll('.project-image');
  if (!images.length) return;

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
    if (!activeImg || !activeImg.complete) return;
    var rect = activeImg.getBoundingClientRect();
    var relX = e.clientX - rect.left;
    var relY = e.clientY - rect.top;

    // Position the lens centered on cursor
    lens.style.left = (e.clientX - RADIUS) + 'px';
    lens.style.top = (e.clientY - RADIUS) + 'px';

    // Map mouse position to image natural coordinates
    var natW = activeImg.naturalWidth;
    var natH = activeImg.naturalHeight;
    var scaleX = natW / rect.width;
    var scaleY = natH / rect.height;

    var srcX = relX * scaleX;
    var srcY = relY * scaleY;
    var srcHalfW = RADIUS * scaleX / ZOOM;
    var srcHalfH = RADIUS * scaleY / ZOOM;

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

  images.forEach(function (img) {
    img.addEventListener('mouseenter', function () {
      activeImg = this;
      lens.style.display = 'block';
      document.body.classList.add('mag-active');
    });

    img.addEventListener('mouseleave', function () {
      lens.style.display = 'none';
      activeImg = null;
      ctx.clearRect(0, 0, DIAMETER, DIAMETER);
      document.body.classList.remove('mag-active');
    });

    img.addEventListener('mousemove', drawLens);
  });
})();
