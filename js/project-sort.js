(function () {
  function sortProjectLists() {
    var lists = document.querySelectorAll('.projects__list');
    if (!lists.length) return;

    lists.forEach(function (list) {
      var items = Array.prototype.slice.call(list.querySelectorAll('.projects__item'));
      if (!items.length) return;

      var hasYear = items.some(function (item) {
        return item.hasAttribute('data-year');
      });
      if (!hasYear) return;

      items.sort(function (a, b) {
        var ay = parseInt(a.getAttribute('data-year') || '0', 10);
        var by = parseInt(b.getAttribute('data-year') || '0', 10);
        return by - ay;
      });

      items.forEach(function (item) {
        list.appendChild(item);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sortProjectLists);
  } else {
    sortProjectLists();
  }
})();
