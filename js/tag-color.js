(function () {
  var items = document.querySelectorAll('.projects__thumb');
  items.forEach(function (thumb) {
    var img = thumb.querySelector('.thumbnail-project');
    var tag = thumb.querySelector('.tag');
    if (!img) return;

    function markLoaded() { img.classList.add('is-loaded'); }
    if (img.complete && img.naturalWidth > 0) markLoaded();
    else img.addEventListener('load', markLoaded);

    if (!tag) return;

    function applyColor() {
      try {
        var sw = img.naturalWidth, sh = img.naturalHeight;
        if (!sw || !sh) return;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var sampleW = Math.floor(sw * 0.35);
        var sampleH = Math.floor(sh * 0.25);
        canvas.width = 24;
        canvas.height = 24;
        ctx.drawImage(img, 0, 0, sampleW, sampleH, 0, 0, 24, 24);
        var data = ctx.getImageData(0, 0, 24, 24).data;
        var r = 0, g = 0, b = 0, n = 0;
        for (var i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum > 0.6) {
          tag.style.backgroundColor = '#808080';
          tag.style.color = '#fff';
        } else {
          tag.style.backgroundColor = '#fff';
          tag.style.color = '#000';
        }
      } catch (e) { /* CORS / decode errors — leave default */ }
    }

    if (img.complete && img.naturalWidth > 0) setTimeout(applyColor, 400);
    else img.addEventListener('load', function () { setTimeout(applyColor, 400); });
  });
})();
