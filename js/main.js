document.addEventListener('click', function(e) {
  var anchor = e.target.closest('a[href^="#"]');
  if (anchor) {
    var targetHref = anchor.getAttribute('href');
    if (targetHref && targetHref.length > 1) {
      var targetId = targetHref.slice(1);
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

// ==========================================
// MÓDULO DE PEDIDOS: MODAL Y FORMULARIO WHATSAPP
// ==========================================
(function() {
  var RESTAURANT_WA = '573127848305';

  var currentDish = {
    name: '',
    price: '',
    rawPriceNum: 0,
    category: '',
    imageSrc: ''
  };
  var currentQty = 1;

  // Elementos DOM del modal
  var modal = document.getElementById('orderModal');
  if (!modal) return;

  var modalTitle = document.getElementById('orderModalTitle');
  var modalCategory = document.getElementById('orderDishCategory');
  var modalPrice = document.getElementById('orderDishPrice');
  var modalImg = document.getElementById('orderDishImg');
  var modalImgPlaceholder = document.getElementById('orderDishImgPlaceholder');
  var qtyVal = document.getElementById('orderQtyVal');
  var totalAmount = document.getElementById('orderTotalAmount');
  var btnQtyMinus = document.getElementById('btnQtyMinus');
  var btnQtyPlus = document.getElementById('btnQtyPlus');
  var btnCloseModal = document.getElementById('btnCloseOrderModal');
  var btnCancel = document.getElementById('btnCancelOrder');

  var orderForm = document.getElementById('orderForm');
  var orderFormError = document.getElementById('orderFormError');
  var orderSuccessScreen = document.getElementById('orderSuccessScreen');
  var orderWaDirectLink = document.getElementById('orderWaDirectLink');

  var deliveryAddressGroup = document.getElementById('deliveryAddressGroup');
  var inputAddress = document.getElementById('orderAddress');
  var inputName = document.getElementById('orderCustomerName');
  var inputPhone = document.getElementById('orderCustomerPhone');
  var inputCashAmount = document.getElementById('orderCashAmount');
  var selectTransferApp = document.getElementById('orderTransferApp');
  var inputIngredients = document.getElementById('orderIngredients');

  var paymentEfectivoBox = document.getElementById('paymentEfectivoBox');
  var paymentTransferenciaBox = document.getElementById('paymentTransferenciaBox');

  // Asegurar que todos los platos tengan el botón "Ordenar"
  document.querySelectorAll('section#carta .m li').forEach(function(item) {
    var info = item.querySelector('.item-info');
    if (info && !info.querySelector('.btn-ordenar')) {
      var btnWrap = document.createElement('div');
      btnWrap.className = 'item-actions';
      btnWrap.innerHTML = '<button type="button" class="btn-ordenar"><span class="btn-ordenar-icon">🛍️</span> Ordenar</button>';
      info.appendChild(btnWrap);
    }
  });

  // Funciones de parseo y formato de precios
  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    var digits = priceStr.replace(/[^\d]/g, '');
    var num = parseInt(digits, 10);
    return isNaN(num) ? 0 : num;
  }

  function formatPrice(num) {
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function updateSubtotal() {
    if (qtyVal) qtyVal.textContent = currentQty;
    if (totalAmount) {
      if (currentDish.rawPriceNum > 0) {
        var subtotal = currentDish.rawPriceNum * currentQty;
        totalAmount.textContent = formatPrice(subtotal);
      } else {
        totalAmount.textContent = currentDish.price + (currentQty > 1 ? ' (x' + currentQty + ')' : '');
      }
    }
  }

  // Cargar datos previos del cliente desde localStorage si existen
  try {
    var savedName = localStorage.getItem('osly_customer_name');
    var savedPhone = localStorage.getItem('osly_customer_phone');
    var savedAddress = localStorage.getItem('osly_customer_address');
    if (savedName && inputName) inputName.value = savedName;
    if (savedPhone && inputPhone) inputPhone.value = savedPhone;
    if (savedAddress && inputAddress) inputAddress.value = savedAddress;
  } catch (e) {}

  // Abrir modal con los datos del plato
  function openOrderModal(dishEl) {
    var titleEl = dishEl.querySelector('.item-head b');
    var priceEl = dishEl.querySelector('.item-head u');
    var imgEl = dishEl.querySelector('.item-img img');
    var catSection = dishEl.closest('details.m');

    var rawName = titleEl ? titleEl.textContent.trim() : 'Plato del menú';
    var cleanName = rawName.replace(/^★\s*/, '');
    var price = priceEl ? priceEl.textContent.trim() : '$0';
    var category = 'Menú';
    if (catSection) {
      var h3 = catSection.querySelector('summary h3');
      if (h3) {
        var catClone = h3.cloneNode(true);
        var badge = catClone.querySelector('.badge-count');
        if (badge) badge.remove();
        category = catClone.textContent.trim();
      }
    }

    currentDish.name = cleanName;
    currentDish.price = price;
    currentDish.rawPriceNum = parsePrice(price);
    currentDish.category = category;
    currentQty = 1;

    // Actualizar vista del modal
    if (modalTitle) modalTitle.textContent = cleanName;
    if (modalCategory) modalCategory.textContent = category;
    if (modalPrice) modalPrice.textContent = price;

    // Manejar imagen del plato en el modal
    if (imgEl && imgEl.getAttribute('src') && !dishEl.querySelector('.item-img.no-img')) {
      modalImg.src = imgEl.src;
      modalImg.style.display = 'block';
      if (modalImgPlaceholder) modalImgPlaceholder.style.display = 'none';
    } else {
      modalImg.src = '';
      modalImg.style.display = 'none';
      if (modalImgPlaceholder) modalImgPlaceholder.style.display = 'inline-block';
    }

    // Reiniciar selecciones a valores por defecto
    var radioDomicilio = document.querySelector('input[name="deliveryType"][value="domicilio"]');
    if (radioDomicilio) {
      radioDomicilio.checked = true;
      syncRadioCards('deliveryType');
      if (deliveryAddressGroup) deliveryAddressGroup.style.display = 'block';
    }

    var radioEfectivo = document.querySelector('input[name="paymentMethod"][value="efectivo"]');
    if (radioEfectivo) {
      radioEfectivo.checked = true;
      syncRadioCards('paymentMethod');
      if (paymentEfectivoBox) paymentEfectivoBox.style.display = 'block';
      if (paymentTransferenciaBox) paymentTransferenciaBox.style.display = 'none';
    }

    var radioSalsa = document.querySelector('input[name="sauceOption"][value="salsa_aparte"]');
    if (radioSalsa) {
      radioSalsa.checked = true;
      syncRadioCards('sauceOption');
    }

    if (inputIngredients) inputIngredients.value = '';
    if (inputCashAmount) inputCashAmount.value = '';
    if (selectTransferApp) selectTransferApp.selectedIndex = 0;

    if (orderFormError) {
      orderFormError.style.display = 'none';
      orderFormError.textContent = '';
    }

    if (orderForm) orderForm.style.display = 'block';
    if (orderSuccessScreen) orderSuccessScreen.style.display = 'none';

    updateSubtotal();

    // Mostrar modal
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Foco en nombre si está vacío, o en dirección
    setTimeout(function() {
      if (inputName && !inputName.value) {
        inputName.focus();
      } else if (inputAddress && radioDomicilio && radioDomicilio.checked) {
        inputAddress.focus();
      }
    }, 150);
  }

  // Cerrar modal
  function closeOrderModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // Sincronizar estilo visual (.is-selected) de las tarjetas de radio
  function syncRadioCards(name) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function(radio) {
      var card = radio.closest('.delivery-card, .payment-card, .sauce-card');
      if (card) {
        if (radio.checked) {
          card.classList.add('is-selected');
        } else {
          card.classList.remove('is-selected');
        }
      }
    });
  }

  // Event Listeners para cambios de radio
  document.addEventListener('change', function(e) {
    if (e.target.name === 'deliveryType') {
      syncRadioCards('deliveryType');
      if (e.target.value === 'domicilio') {
        if (deliveryAddressGroup) deliveryAddressGroup.style.display = 'block';
        if (inputAddress) inputAddress.focus();
      } else {
        if (deliveryAddressGroup) deliveryAddressGroup.style.display = 'none';
      }
    } else if (e.target.name === 'paymentMethod') {
      syncRadioCards('paymentMethod');
      if (e.target.value === 'efectivo') {
        if (paymentEfectivoBox) paymentEfectivoBox.style.display = 'block';
        if (paymentTransferenciaBox) paymentTransferenciaBox.style.display = 'none';
      } else {
        if (paymentEfectivoBox) paymentEfectivoBox.style.display = 'none';
        if (paymentTransferenciaBox) paymentTransferenciaBox.style.display = 'block';
      }
    } else if (e.target.name === 'sauceOption') {
      syncRadioCards('sauceOption');
    }
  });

  // Controles de cantidad
  if (btnQtyMinus) {
    btnQtyMinus.addEventListener('click', function() {
      if (currentQty > 1) {
        currentQty--;
        updateSubtotal();
      }
    });
  }

  if (btnQtyPlus) {
    btnQtyPlus.addEventListener('click', function() {
      if (currentQty < 99) {
        currentQty++;
        updateSubtotal();
      }
    });
  }

  // Botón cerrar y cancelar
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeOrderModal);
  if (btnCancel) btnCancel.addEventListener('click', closeOrderModal);

  // Cerrar al dar click fuera del contenido del modal
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeOrderModal();
    }
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeOrderModal();
    }
  });

  // Delegación de click para abrir modal desde cualquier botón "Ordenar"
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.btn-ordenar');
    if (btn) {
      e.preventDefault();
      var dishEl = btn.closest('li');
      if (dishEl) {
        openOrderModal(dishEl);
      }
    }
  });

  // Envío del formulario y generación del mensaje de WhatsApp
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Validación
      var name = inputName ? inputName.value.trim() : '';
      if (!name) {
        showError('Por favor ingresa tu nombre para saber a quién entregarle el pedido.');
        if (inputName) inputName.focus();
        return;
      }

      var deliveryRadio = document.querySelector('input[name="deliveryType"]:checked');
      var deliveryType = deliveryRadio ? deliveryRadio.value : 'domicilio';
      var address = inputAddress ? inputAddress.value.trim() : '';

      if (deliveryType === 'domicilio' && !address) {
        showError('Por favor ingresa tu dirección de entrega para llevarte el pedido a domicilio.');
        if (inputAddress) inputAddress.focus();
        return;
      }

      var paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
      var paymentMethod = paymentRadio ? paymentRadio.value : 'efectivo';
      var cashAmount = inputCashAmount ? inputCashAmount.value.trim() : '';
      var transferApp = selectTransferApp ? selectTransferApp.value : 'Por definir';

      var sauceRadio = document.querySelector('input[name="sauceOption"]:checked');
      var sauceOption = sauceRadio ? sauceRadio.value : 'salsa_aparte';
      var sauceText = 'Salsa aparte (en vasitos)';
      if (sauceOption === 'salsa_en_plato') {
        sauceText = 'En el plato (tradicional)';
      } else if (sauceOption === 'sin_salsa') {
        sauceText = 'Sin salsas';
      }

      var ingredients = inputIngredients ? inputIngredients.value.trim() : '';
      var phone = inputPhone ? inputPhone.value.trim() : '';

      // Guardar en localStorage para futuros pedidos
      try {
        localStorage.setItem('osly_customer_name', name);
        if (phone) localStorage.setItem('osly_customer_phone', phone);
        if (address) localStorage.setItem('osly_customer_address', address);
      } catch (err) {}

      // Cálculo de subtotal
      var subtotalText = '';
      if (currentDish.rawPriceNum > 0) {
        subtotalText = formatPrice(currentDish.rawPriceNum * currentQty);
      } else {
        subtotalText = currentDish.price + (currentQty > 1 ? ' (x' + currentQty + ')' : '');
      }

      // Construcción del mensaje de WhatsApp
      var lines = [];
      lines.push('🍔 *NUEVO PEDIDO - OSLY*');
      lines.push('────────────────────────');
      lines.push('🍽️ *Plato:* ' + currentDish.name);
      lines.push('🔢 *Cantidad:* ' + currentQty);
      lines.push('💵 *Precio unitario:* ' + currentDish.price);
      lines.push('💰 *Subtotal estimado:* ' + subtotalText);
      lines.push('────────────────────────');
      lines.push('👤 *Cliente:* ' + name);
      if (phone) {
        lines.push('📞 *Teléfono:* ' + phone);
      }

      if (deliveryType === 'domicilio') {
        lines.push('🛵 *Tipo de entrega:* Envío a domicilio');
        lines.push('📍 *Dirección de entrega:* ' + address);
      } else {
        lines.push('🛍️ *Tipo de entrega:* Recoger en restaurante (Cra. 9 #4-31)');
      }

      lines.push('────────────────────────');
      if (paymentMethod === 'efectivo') {
        var cashMsg = 'Efectivo';
        if (cashAmount) {
          cashMsg += ' (Paga con: ' + cashAmount + ')';
        }
        lines.push('💳 *Método de pago:* ' + cashMsg);
      } else {
        var transMsg = 'Transferencia';
        if (transferApp && transferApp !== 'Por definir') {
          transMsg += ' (' + transferApp + ')';
        }
        lines.push('💳 *Método de pago:* ' + transMsg);
      }

      lines.push('🥣 *Preferencia de salsa:* ' + sauceText);
      lines.push('🥓 *Ingredientes (agregar / quitar):* ' + (ingredients || 'Sin modificaciones'));
      lines.push('────────────────────────');
      lines.push('¡Hola Osly! Acabo de armar mi pedido en la página web. ¿Me confirman disponibilidad y tiempo estimado, por favor? ¡Gracias!');

      var messageText = lines.join('\n');
      var waUrl = 'https://wa.me/' + RESTAURANT_WA + '?text=' + encodeURIComponent(messageText);

      // Mostrar pantalla de éxito dentro del modal
      if (orderForm) orderForm.style.display = 'none';
      if (orderSuccessScreen) {
        orderSuccessScreen.style.display = 'block';
        if (orderWaDirectLink) orderWaDirectLink.href = waUrl;
      }

      // Abrir WhatsApp en nueva pestaña
      var win = window.open(waUrl, '_blank');
      if (!win) {
        // En caso de que el navegador bloquee el popup automático
        window.location.href = waUrl;
      }
    });
  }

  function showError(msg) {
    if (orderFormError) {
      orderFormError.textContent = '⚠️ ' + msg;
      orderFormError.style.display = 'flex';
      orderFormError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      alert(msg);
    }
  }
})();
