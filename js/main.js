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
// MÓDULO DE CARRITO Y PEDIDOS MULTI-PRODUCTO (OSLY)
// ==========================================
(function() {
  var RESTAURANT_WA = '573127848305';
  var CART_STORAGE_KEY = 'osly_cart_items';

  // Estado del Carrito
  var cart = [];
  var tempDish = {
    name: '',
    priceStr: '',
    rawPriceNum: 0,
    qty: 1,
    category: '',
    desc: '',
    imageSrc: '',
    hasImg: false
  };

  // Elementos DOM - Modal de Personalización de Plato
  var customDishModal = document.getElementById('customDishModal');
  var customModalTitle = document.getElementById('customDishModalTitle');
  var customModalCategory = document.getElementById('customDishCategory');
  var customModalDesc = document.getElementById('customDishDesc');
  var customModalPrice = document.getElementById('customDishPrice');
  var customModalImg = document.getElementById('customDishImg');
  var customModalImgPlaceholder = document.getElementById('customDishImgPlaceholder');
  var customQtyVal = document.getElementById('customQtyVal');
  var customDishSubtotal = document.getElementById('customDishSubtotal');
  var btnCustomQtyMinus = document.getElementById('btnCustomQtyMinus');
  var btnCustomQtyPlus = document.getElementById('btnCustomQtyPlus');
  var btnCloseCustomModal = document.getElementById('btnCloseCustomDishModal');
  var btnCancelCustomDish = document.getElementById('btnCancelCustomDish');
  var customDishForm = document.getElementById('customDishForm');
  var customIngredients = document.getElementById('customIngredients');
  var btnAddToCartText = document.getElementById('btnAddToCartText');
  var sauceGroup = document.getElementById('sauceGroup');

  // Elementos DOM - Modal del Carrito
  var cartModal = document.getElementById('cartModal');
  var btnCloseCartModal = document.getElementById('btnCloseCartModal');
  var btnContinueShopping = document.getElementById('btnContinueShopping');
  var cartItemsList = document.getElementById('cartItemsList');
  var cartHeaderCount = document.getElementById('cartHeaderCount');
  var cartTotalAmount = document.getElementById('cartTotalAmount');
  var btnClearCart = document.getElementById('btnClearCart');
  var cartCheckoutForm = document.getElementById('cartCheckoutForm');
  var cartFormError = document.getElementById('cartFormError');
  var btnSubmitCartOrder = document.getElementById('btnSubmitCartOrder');
  var btnSubmitCartText = document.getElementById('btnSubmitCartText');
  var cartSuccessScreen = document.getElementById('cartSuccessScreen');
  var cartWaDirectLink = document.getElementById('cartWaDirectLink');

  // Elementos DOM - Formulario de Checkout
  var cartDeliveryAddressGroup = document.getElementById('cartDeliveryAddressGroup');
  var cartInputAddress = document.getElementById('cartAddress');
  var cartInputName = document.getElementById('cartCustomerName');
  var cartInputPhone = document.getElementById('cartCustomerPhone');
  var cartInputCashAmount = document.getElementById('cartCashAmount');
  var cartSelectTransferApp = document.getElementById('cartTransferApp');
  var cartInputOrderNotes = document.getElementById('cartOrderNotes');
  var cartPaymentEfectivoBox = document.getElementById('cartPaymentEfectivoBox');
  var cartPaymentTransferenciaBox = document.getElementById('cartPaymentTransferenciaBox');

  // Elementos DOM - Barra Flotante y Navbar
  var btnNavCart = document.getElementById('btnNavCart');
  var navCartBadge = document.getElementById('navCartBadge');
  var floatingCartBar = document.getElementById('floatingCartBar');
  var floatingCartTrigger = document.getElementById('floatingCartTrigger');
  var floatingCartCount = document.getElementById('floatingCartCount');
  var floatingCartTotal = document.getElementById('floatingCartTotal');
  var cartToast = document.getElementById('cartToast');
  var cartToastMsg = document.getElementById('cartToastMsg');

  // Enlaces rápidos en carrito
  var cartAddDrinksLink = document.getElementById('cartAddDrinksLink');
  var cartAddDessertsLink = document.getElementById('cartAddDessertsLink');
  var cartAddMoreLink = document.getElementById('cartAddMoreLink');

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

  // Funciones de formateo y almacenamiento
  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    var digits = priceStr.replace(/[^\d]/g, '');
    var num = parseInt(digits, 10);
    return isNaN(num) ? 0 : num;
  }

  function formatPrice(num) {
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function loadCart() {
    try {
      var saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        cart = JSON.parse(saved);
        if (!Array.isArray(cart)) cart = [];
      }
    } catch (e) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function getCartCount() {
    return cart.reduce(function(acc, item) {
      return acc + (item.qty || 1);
    }, 0);
  }

  function getCartTotal() {
    return cart.reduce(function(acc, item) {
      return acc + ((item.rawPriceNum || 0) * (item.qty || 1));
    }, 0);
  }

  // Cargar datos previos del cliente
  try {
    var savedName = localStorage.getItem('osly_customer_name');
    var savedPhone = localStorage.getItem('osly_customer_phone');
    var savedAddress = localStorage.getItem('osly_customer_address');
    if (savedName && cartInputName) cartInputName.value = savedName;
    if (savedPhone && cartInputPhone) cartInputPhone.value = savedPhone;
    if (savedAddress && cartInputAddress) cartInputAddress.value = savedAddress;
  } catch (e) {}

  // ==========================================
  // ACTUALIZACIÓN DE INTERFAZ DEL CARRITO
  // ==========================================
  function updateCartUI() {
    var count = getCartCount();
    var total = getCartTotal();
    var totalFormatted = formatPrice(total);

    // Navbar badge
    if (navCartBadge) {
      navCartBadge.textContent = count;
      if (count > 0) {
        navCartBadge.classList.add('has-items');
      } else {
        navCartBadge.classList.remove('has-items');
      }
    }

    // Barra flotante
    if (floatingCartBar) {
      if (count > 0) {
        floatingCartBar.style.display = 'block';
        if (floatingCartCount) floatingCartCount.textContent = count;
        if (floatingCartTotal) floatingCartTotal.textContent = totalFormatted;
      } else {
        floatingCartBar.style.display = 'none';
      }
    }

    // Modal Header count y Total amount
    if (cartHeaderCount) {
      cartHeaderCount.textContent = count + (count === 1 ? ' artículo' : ' artículos');
    }
    if (cartTotalAmount) {
      cartTotalAmount.textContent = totalFormatted;
    }
    if (btnSubmitCartText) {
      btnSubmitCartText.textContent = count > 0 
        ? 'Pedir todo por WhatsApp (' + totalFormatted + ')' 
        : 'Pedir por WhatsApp';
    }

    // Renderizar lista de artículos en el modal
    renderCartItemsList();
  }

  function renderCartItemsList() {
    if (!cartItemsList) return;

    if (cart.length === 0) {
      cartItemsList.innerHTML = 
        '<div class="cart-empty-state">' +
          '<div class="cart-empty-icon">🛒</div>' +
          '<h4 class="cart-empty-title">Tu carrito está vacío</h4>' +
          '<p class="cart-empty-text">Explora nuestra carta y agrega tus platos y bebidas favoritos para realizar tu pedido.</p>' +
          '<a href="#carta" class="btn-explore-menu" id="btnCartEmptyExplore">Ver la carta</a>' +
        '</div>';
      
      var btnExplore = document.getElementById('btnCartEmptyExplore');
      if (btnExplore) {
        btnExplore.addEventListener('click', function() {
          closeCartModal();
        });
      }
      return;
    }

    var html = '';
    cart.forEach(function(item, idx) {
      var itemSubtotal = item.rawPriceNum > 0 
        ? formatPrice(item.rawPriceNum * item.qty) 
        : item.priceStr + (item.qty > 1 ? ' (x' + item.qty + ')' : '');

      var chips = '';
      if (item.sauceText) {
        chips += '<span class="cart-note-chip">🥣 ' + escapeHtml(item.sauceText) + '</span>';
      }
      if (item.ingredients) {
        chips += '<span class="cart-note-chip">🥓 ' + escapeHtml(item.ingredients) + '</span>';
      }

      html += 
        '<div class="cart-item-card" data-index="' + idx + '">' +
          '<div class="cart-item-top">' +
            '<div class="cart-item-title-wrap">' +
              '<h4 class="cart-item-name">' + escapeHtml(item.name) + '</h4>' +
              '<span class="cart-item-unit-price">' + escapeHtml(item.priceStr) + ' c/u</span>' +
            '</div>' +
            '<button type="button" class="cart-item-remove-btn" data-action="remove" data-index="' + idx + '" title="Eliminar este artículo">🗑️</button>' +
          '</div>' +
          (chips ? '<div class="cart-item-notes">' + chips + '</div>' : '') +
          '<div class="cart-item-bottom">' +
            '<div class="order-qty-control">' +
              '<button type="button" class="order-qty-btn" data-action="qty-minus" data-index="' + idx + '" aria-label="Disminuir cantidad">−</button>' +
              '<span class="order-qty-val">' + item.qty + '</span>' +
              '<button type="button" class="order-qty-btn" data-action="qty-plus" data-index="' + idx + '" aria-label="Aumentar cantidad">+</button>' +
            '</div>' +
            '<span class="cart-item-subtotal">' + itemSubtotal + '</span>' +
          '</div>' +
        '</div>';
    });

    cartItemsList.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ==========================================
  // MODAL DE PERSONALIZACIÓN DEL PLATO
  // ==========================================
  function openCustomDishModal(dishEl) {
    var titleEl = dishEl.querySelector('.item-head b');
    var priceEl = dishEl.querySelector('.item-head u');
    var descEl = dishEl.querySelector('.item-info small');
    var imgEl = dishEl.querySelector('.item-img img');
    var catSection = dishEl.closest('details.m');

    var rawName = titleEl ? titleEl.textContent.trim() : 'Plato del menú';
    var cleanName = rawName.replace(/^★\s*/, '');
    var price = priceEl ? priceEl.textContent.trim() : '$0';
    var desc = descEl ? descEl.textContent.trim() : '';

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

    var hasImg = imgEl && imgEl.getAttribute('src') && !dishEl.querySelector('.item-img.no-img');

    tempDish = {
      name: cleanName,
      priceStr: price,
      rawPriceNum: parsePrice(price),
      qty: 1,
      category: category,
      desc: desc,
      imageSrc: hasImg ? imgEl.src : '',
      hasImg: !!hasImg
    };

    // Actualizar vista del modal
    if (customModalTitle) customModalTitle.textContent = cleanName;
    if (customModalCategory) customModalCategory.textContent = category;
    if (customModalPrice) customModalPrice.textContent = price;
    if (customModalDesc) {
      customModalDesc.textContent = desc;
      customModalDesc.style.display = desc ? 'block' : 'none';
    }

    if (tempDish.hasImg) {
      customModalImg.src = tempDish.imageSrc;
      customModalImg.style.display = 'block';
      if (customModalImgPlaceholder) customModalImgPlaceholder.style.display = 'none';
    } else {
      customModalImg.src = '';
      customModalImg.style.display = 'none';
      if (customModalImgPlaceholder) customModalImgPlaceholder.style.display = 'inline-block';
    }

    // Reiniciar cantidad a 1
    if (customQtyVal) customQtyVal.textContent = '1';

    // Ocultar o mostrar salsas según categoría (bebidas o helados no llevan salsa tradicional)
    var isBeverageOrDessert = category.toLowerCase().indexOf('bebida') >= 0 || 
                              category.toLowerCase().indexOf('fruta') >= 0 || 
                              category.toLowerCase().indexOf('helado') >= 0;
    if (sauceGroup) {
      sauceGroup.style.display = isBeverageOrDessert ? 'none' : 'block';
    }

    // Reiniciar opciones de salsa
    var radioSauce = document.querySelector('input[name="customSauceOption"][value="salsa_aparte"]');
    if (radioSauce) radioSauce.checked = true;
    syncRadioCards('customSauceOption');

    // Reiniciar ingredientes
    if (customIngredients) customIngredients.value = '';

    updateCustomModalSubtotal();

    // Mostrar modal
    if (customDishModal) {
      customDishModal.classList.add('is-active');
      customDishModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }
  }

  function closeCustomDishModal() {
    if (customDishModal) {
      customDishModal.classList.remove('is-active');
      customDishModal.setAttribute('aria-hidden', 'true');
    }
    // Solo quitar modal-open si el carrito no está abierto
    if (!cartModal || !cartModal.classList.contains('is-active')) {
      document.body.classList.remove('modal-open');
    }
  }

  function updateCustomModalSubtotal() {
    if (customQtyVal) customQtyVal.textContent = tempDish.qty;
    var subtotalText = '';
    if (tempDish.rawPriceNum > 0) {
      subtotalText = formatPrice(tempDish.rawPriceNum * tempDish.qty);
    } else {
      subtotalText = tempDish.priceStr + (tempDish.qty > 1 ? ' (x' + tempDish.qty + ')' : '');
    }
    if (customDishSubtotal) customDishSubtotal.textContent = subtotalText;
    if (btnAddToCartText) {
      btnAddToCartText.textContent = 'Añadir al pedido · ' + subtotalText;
    }
  }

  // Controles de cantidad en personalización
  if (btnCustomQtyMinus) {
    btnCustomQtyMinus.addEventListener('click', function() {
      if (tempDish.qty > 1) {
        tempDish.qty--;
        updateCustomModalSubtotal();
      }
    });
  }
  if (btnCustomQtyPlus) {
    btnCustomQtyPlus.addEventListener('click', function() {
      if (tempDish.qty < 99) {
        tempDish.qty++;
        updateCustomModalSubtotal();
      }
    });
  }

  // Añadir plato al carrito desde formulario
  if (customDishForm) {
    customDishForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var sauceText = '';
      if (sauceGroup && sauceGroup.style.display !== 'none') {
        var selectedSauce = document.querySelector('input[name="customSauceOption"]:checked');
        var val = selectedSauce ? selectedSauce.value : 'salsa_aparte';
        if (val === 'salsa_aparte') sauceText = 'Salsa aparte (en vasitos)';
        else if (val === 'salsa_en_plato') sauceText = 'En el plato';
        else if (val === 'sin_salsa') sauceText = 'Sin salsas';
      }

      var notes = customIngredients ? customIngredients.value.trim() : '';

      // Crear objeto del item
      var cartItem = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: tempDish.name,
        priceStr: tempDish.priceStr,
        rawPriceNum: tempDish.rawPriceNum,
        qty: tempDish.qty,
        category: tempDish.category,
        sauceText: sauceText,
        ingredients: notes,
        imageSrc: tempDish.imageSrc
      };

      cart.push(cartItem);
      saveCart();
      updateCartUI();

      closeCustomDishModal();
      showToast('¡' + tempDish.name + ' añadido a tu pedido!');
    });
  }

  if (btnCloseCustomModal) btnCloseCustomModal.addEventListener('click', closeCustomDishModal);
  if (btnCancelCustomDish) btnCancelCustomDish.addEventListener('click', closeCustomDishModal);

  // ==========================================
  // MODAL DEL CARRITO Y CHECKOUT
  // ==========================================
  function openCartModal() {
    closeCustomDishModal();
    updateCartUI();

    if (cartFormError) {
      cartFormError.style.display = 'none';
      cartFormError.textContent = '';
    }
    if (cartCheckoutForm) cartCheckoutForm.style.display = 'block';
    if (cartSuccessScreen) cartSuccessScreen.style.display = 'none';

    // Sincronizar estado de radios
    var radioDomicilio = document.querySelector('input[name="cartDeliveryType"][value="domicilio"]');
    if (radioDomicilio && radioDomicilio.checked && cartDeliveryAddressGroup) {
      cartDeliveryAddressGroup.style.display = 'block';
    }
    syncRadioCards('cartDeliveryType');
    syncRadioCards('cartPaymentMethod');

    if (cartModal) {
      cartModal.classList.add('is-active');
      cartModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }
  }

  function closeCartModal() {
    if (cartModal) {
      cartModal.classList.remove('is-active');
      cartModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
  }

  if (btnNavCart) btnNavCart.addEventListener('click', openCartModal);
  if (floatingCartTrigger) floatingCartTrigger.addEventListener('click', openCartModal);
  if (btnCloseCartModal) btnCloseCartModal.addEventListener('click', closeCartModal);
  if (btnContinueShopping) btnContinueShopping.addEventListener('click', closeCartModal);

  // Enlaces rápidos dentro del carrito para ir a secciones
  function bindQuickLink(el, targetId) {
    if (el) {
      el.addEventListener('click', function(e) {
        closeCartModal();
        var target = document.getElementById(targetId);
        if (target) {
          if (target.tagName.toLowerCase() === 'details') target.open = true;
          setTimeout(function() {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      });
    }
  }
  bindQuickLink(cartAddDrinksLink, 'bebidas');
  bindQuickLink(cartAddDessertsLink, 'frutas');
  bindQuickLink(cartAddMoreLink, 'carta');

  // Acciones dentro de la lista de artículos en el carrito
  if (cartItemsList) {
    cartItemsList.addEventListener('click', function(e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;

      var action = btn.getAttribute('data-action');
      var index = parseInt(btn.getAttribute('data-index'), 10);
      if (isNaN(index) || !cart[index]) return;

      if (action === 'qty-plus') {
        if (cart[index].qty < 99) {
          cart[index].qty++;
          saveCart();
          updateCartUI();
        }
      } else if (action === 'qty-minus') {
        if (cart[index].qty > 1) {
          cart[index].qty--;
          saveCart();
          updateCartUI();
        } else {
          // Si está en 1 y le da menos, eliminar
          cart.splice(index, 1);
          saveCart();
          updateCartUI();
        }
      } else if (action === 'remove') {
        cart.splice(index, 1);
        saveCart();
        updateCartUI();
      }
    });
  }

  // Vaciar carrito
  if (btnClearCart) {
    btnClearCart.addEventListener('click', function() {
      if (cart.length === 0) return;
      if (confirm('¿Estás seguro de que deseas vaciar todos los artículos de tu pedido?')) {
        cart = [];
        saveCart();
        updateCartUI();
      }
    });
  }

  // ==========================================
  // SINCRONIZACIÓN DE RADIOS Y CONDICIONALES
  // ==========================================
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

  document.addEventListener('change', function(e) {
    var name = e.target.name;
    if (name === 'customSauceOption') {
      syncRadioCards('customSauceOption');
    } else if (name === 'cartDeliveryType') {
      syncRadioCards('cartDeliveryType');
      if (cartDeliveryAddressGroup) {
        if (e.target.value === 'domicilio') {
          cartDeliveryAddressGroup.style.display = 'block';
          if (cartInputAddress) cartInputAddress.focus();
        } else {
          cartDeliveryAddressGroup.style.display = 'none';
        }
      }
    } else if (name === 'cartPaymentMethod') {
      syncRadioCards('cartPaymentMethod');
      if (e.target.value === 'efectivo') {
        if (cartPaymentEfectivoBox) cartPaymentEfectivoBox.style.display = 'block';
        if (cartPaymentTransferenciaBox) cartPaymentTransferenciaBox.style.display = 'none';
      } else {
        if (cartPaymentEfectivoBox) cartPaymentEfectivoBox.style.display = 'none';
        if (cartPaymentTransferenciaBox) cartPaymentTransferenciaBox.style.display = 'block';
      }
    }
  });

  // Cerrar modales con clic afuera
  document.addEventListener('click', function(e) {
    if (e.target === customDishModal) closeCustomDishModal();
    if (e.target === cartModal) closeCartModal();
  });

  // Cerrar modales con tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (customDishModal && customDishModal.classList.contains('is-active')) {
        closeCustomDishModal();
      } else if (cartModal && cartModal.classList.contains('is-active')) {
        closeCartModal();
      }
    }
  });

  // Delegación de clic para abrir personalización al hacer clic en "Ordenar"
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.btn-ordenar');
    if (btn) {
      e.preventDefault();
      var dishEl = btn.closest('li');
      if (dishEl) {
        openCustomDishModal(dishEl);
      }
    }
  });

  // ==========================================
  // CHECKOUT Y ENVÍO A WHATSAPP DEL PEDIDO COMPLETO
  // ==========================================
  if (cartCheckoutForm) {
    cartCheckoutForm.addEventListener('submit', function(e) {
      e.preventDefault();

      if (cart.length === 0) {
        showCartError('Tu carrito está vacío. Agrega al menos un plato o bebida antes de enviar tu pedido.');
        return;
      }

      var name = cartInputName ? cartInputName.value.trim() : '';
      if (!name) {
        showCartError('Por favor ingresa tu nombre para saber a quién entregarle el pedido.');
        if (cartInputName) cartInputName.focus();
        return;
      }

      var deliveryRadio = document.querySelector('input[name="cartDeliveryType"]:checked');
      var deliveryType = deliveryRadio ? deliveryRadio.value : 'domicilio';
      var address = cartInputAddress ? cartInputAddress.value.trim() : '';

      if (deliveryType === 'domicilio' && !address) {
        showCartError('Por favor ingresa la dirección de entrega de tu domicilio.');
        if (cartInputAddress) cartInputAddress.focus();
        return;
      }

      var paymentRadio = document.querySelector('input[name="cartPaymentMethod"]:checked');
      var paymentMethod = paymentRadio ? paymentRadio.value : 'efectivo';
      var cashAmount = cartInputCashAmount ? cartInputCashAmount.value.trim() : '';
      var transferApp = cartSelectTransferApp ? cartSelectTransferApp.value : 'Por definir';

      var phone = cartInputPhone ? cartInputPhone.value.trim() : '';
      var orderNotes = cartInputOrderNotes ? cartInputOrderNotes.value.trim() : '';

      // Guardar datos en localStorage
      try {
        localStorage.setItem('osly_customer_name', name);
        if (phone) localStorage.setItem('osly_customer_phone', phone);
        if (address) localStorage.setItem('osly_customer_address', address);
      } catch (err) {}

      var totalCount = getCartCount();
      var totalSum = getCartTotal();
      var totalText = formatPrice(totalSum);

      // CONSTRUCCIÓN DEL MENSAJE COMPLETO DE WHATSAPP
      var lines = [];
      lines.push('🍔 *NUEVO PEDIDO COMPLETO - OSLY*');
      lines.push('────────────────────────');
      lines.push('📦 *ARTÍCULOS DEL PEDIDO:*');
      lines.push('');

      var numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      cart.forEach(function(item, idx) {
        var numBadge = (idx < numberEmojis.length) ? numberEmojis[idx] : '▪️';
        var itemLine = numBadge + ' *' + item.name + '* (x' + item.qty + ')';
        if (item.rawPriceNum > 0) {
          itemLine += ' - ' + formatPrice(item.rawPriceNum * item.qty);
          if (item.qty > 1) {
            itemLine += ' (' + item.priceStr + ' c/u)';
          }
        } else {
          itemLine += ' - ' + item.priceStr;
        }
        lines.push(itemLine);

        var details = [];
        if (item.sauceText) details.push('🥣 ' + item.sauceText);
        if (item.ingredients) details.push('🥓 ' + item.ingredients);

        if (details.length > 0) {
          lines.push('   ' + details.join(' | '));
        }
        lines.push('');
      });

      lines.push('────────────────────────');
      lines.push('💰 *TOTAL ESTIMADO (' + totalCount + (totalCount === 1 ? ' artículo):*' : ' artículos):*') + ' ' + totalText);
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

      if (orderNotes) {
        lines.push('📝 *Notas adicionales:* ' + orderNotes);
      }

      lines.push('────────────────────────');
      lines.push('¡Hola Osly! Acabo de armar mi pedido en la página web. ¿Me confirman disponibilidad y tiempo estimado, por favor? ¡Muchas gracias!');

      var messageText = lines.join('\n');
      var waUrl = 'https://wa.me/' + RESTAURANT_WA + '?text=' + encodeURIComponent(messageText);

      // Mostrar pantalla de éxito y vaciar carrito
      if (cartCheckoutForm) cartCheckoutForm.style.display = 'none';
      if (cartSuccessScreen) {
        cartSuccessScreen.style.display = 'block';
        if (cartWaDirectLink) cartWaDirectLink.href = waUrl;
      }

      // Vaciar carrito
      cart = [];
      saveCart();
      updateCartUI();

      // Abrir WhatsApp en nueva pestaña
      var win = window.open(waUrl, '_blank');
      if (!win) {
        window.location.href = waUrl;
      }
    });
  }

  function showCartError(msg) {
    if (cartFormError) {
      cartFormError.textContent = '⚠️ ' + msg;
      cartFormError.style.display = 'flex';
      cartFormError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      alert(msg);
    }
  }

  // Toast flotante
  var toastTimer = null;
  function showToast(msg) {
    if (!cartToast) return;
    if (cartToastMsg) cartToastMsg.textContent = msg;
    cartToast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      cartToast.classList.remove('is-visible');
    }, 2800);
  }

  // Inicializar estado del carrito al cargar
  loadCart();
  updateCartUI();
})();
