document.addEventListener('click', function(e) {
  var anchor = e.target.closest('a[href^="#"]');
  if (anchor) {
    var targetId = anchor.getAttribute('href').slice(1);
    var targetEl = document.getElementById(targetId);
    if (targetEl && targetEl.tagName.toLowerCase() === 'details') {
      targetEl.open = true;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    var navDrop = document.getElementById('navDropdownMenu');
    if (navDrop && !navDrop.contains(anchor)) {
      navDrop.removeAttribute('open');
    }
  }
  if (e.target.closest('#btnExpandAll')) {
    document.querySelectorAll('section#carta details.m').forEach(function(d) { d.open = true; });
  }
  if (e.target.closest('#btnCollapseAll')) {
    document.querySelectorAll('section#carta details.m').forEach(function(d) { d.open = false; });
  }
  var navDropdown = document.getElementById('navDropdownMenu');
  if (navDropdown && navDropdown.hasAttribute('open') && !navDropdown.contains(e.target)) {
    navDropdown.removeAttribute('open');
  }
});

// Imágenes de los artículos: si el archivo existe se muestra la foto,
// si no, se deja el recuadro vacío (sin ícono de imagen rota).
(function () {
  document.querySelectorAll('.item-img img').forEach(function (img) {
    var box = img.parentElement;
    function ok()  { box.classList.add('has-img'); }
    function bad() { box.classList.add('no-img'); }
    if (img.complete) { (img.naturalWidth > 0) ? ok() : bad(); }
    else { img.addEventListener('load', ok); img.addEventListener('error', bad); }
  });
})();
