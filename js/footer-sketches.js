(function () {
  var scriptEl = document.currentScript;
  var scriptSrc = scriptEl ? scriptEl.src : null;

  function init() {
    var container = document.querySelector('.footer-bg-container');
    if (!container) return;

    var bgFolder = scriptSrc ? new URL('../bg/', scriptSrc).href : 'bg/';
    var totalImages = 51;
    var bgImages = [];
    for (var i = 1; i <= totalImages; i++) {
      bgImages.push(bgFolder + 'sketch png-' + String(i).padStart(2, '0') + '.webp');
    }

    var SLOT_COUNT = 5;
    var IMG_SIZE = 11; // vw; also used for overlap distance (% of container)
    // The footer is shorter than the viewport, so clamp vertical range.
    var TOP_RANGE = 60;
    var LEFT_RANGE = 80;

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    var slots = [];

    function findPosition(self) {
      for (var attempt = 0; attempt < 40; attempt++) {
        var top = Math.random() * TOP_RANGE;
        var left = Math.random() * LEFT_RANGE;
        var overlap = false;
        for (var j = 0; j < slots.length; j++) {
          var other = slots[j];
          if (other === self || other.top === null) continue;
          if (Math.abs(other.top - top) < IMG_SIZE && Math.abs(other.left - left) < IMG_SIZE) {
            overlap = true;
            break;
          }
        }
        if (!overlap) return { top: top, left: left };
      }
      return { top: Math.random() * TOP_RANGE, left: Math.random() * LEFT_RANGE };
    }

    function pickUniqueImage(self) {
      var taken = {};
      for (var j = 0; j < slots.length; j++) {
        if (slots[j] !== self && slots[j].img) taken[slots[j].img] = true;
      }
      var available = bgImages.filter(function (src) { return !taken[src]; });
      return pick(available.length ? available : bgImages);
    }

    function runSlot(slot) {
      var pos = findPosition(slot);
      slot.top = pos.top;
      slot.left = pos.left;

      var img = pickUniqueImage(slot);
      slot.img = img;

      var scale = rand(0.8, 1.2);
      var fadeIn = rand(1.5, 3);
      var hold = rand(2, 5.5);
      var fadeOut = rand(1.5, 3);
      var gap = rand(0.3, 2.5);

      slot.div.style.transition = 'none';
      slot.div.style.opacity = '0';
      slot.div.style.backgroundImage = "url('" + img + "')";
      slot.div.style.top = pos.top + '%';
      slot.div.style.left = pos.left + '%';
      slot.div.style.transform = 'scale(' + scale + ')';

      requestAnimationFrame(function () {
        slot.div.style.transition = 'opacity ' + fadeIn + 's ease-in-out';
        slot.div.style.opacity = '1';
      });

      setTimeout(function () {
        slot.div.style.transition = 'opacity ' + fadeOut + 's ease-in-out';
        slot.div.style.opacity = '0';
        setTimeout(function () {
          slot.top = null;
          slot.left = null;
          slot.img = null;
          setTimeout(function () { runSlot(slot); }, gap * 1000);
        }, fadeOut * 1000);
      }, (fadeIn + hold) * 1000);
    }

    for (var i2 = 0; i2 < SLOT_COUNT; i2++) {
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;background-size:contain;background-position:center;background-repeat:no-repeat;opacity:0;width:' + IMG_SIZE + 'vw;height:' + IMG_SIZE + 'vw;pointer-events:none;';
      container.appendChild(d);
      var slot = { div: d, top: null, left: null, img: null };
      slots.push(slot);
      (function (s, delay) {
        setTimeout(function () { runSlot(s); }, delay);
      })(slot, rand(0, 2500));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
