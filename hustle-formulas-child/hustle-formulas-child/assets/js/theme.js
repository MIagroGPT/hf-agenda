/**
 * Hustle Formulas Child Theme — theme.js
 * Interacciones y micro-animaciones
 */

(function($) {
  'use strict';

  /* ============================================================
     DOCUMENT READY
     ============================================================ */
  $(document).ready(function() {
    hf.init();
  });

  const hf = {

    init() {
      this.productCardHover();
      this.stickyHeader();
      this.mobileMenu();
      this.cartAnimation();
      this.lazyImages();
      this.smoothScroll();
    },

    /* ----------------------------------------------------------
       PRODUCT CARD — Efecto hover botón ATC
       ---------------------------------------------------------- */
    productCardHover() {
      const cards = document.querySelectorAll('.product-wrapper');

      cards.forEach(card => {
        const btn = card.querySelector('.product-buttons');
        const thumb = card.querySelector('.thumbnail-wrapper');

        if (!btn || !thumb) return;

        // Posicionar el botón dentro del área de la imagen
        const positionBtn = () => {
          const thumbRect = thumb.getBoundingClientRect();
          const cardRect  = card.getBoundingClientRect();
          const thumbBottom = thumbRect.bottom - cardRect.top;
          btn.style.top    = (thumbBottom - 56) + 'px';
          btn.style.bottom = 'auto';
        };

        // Reposicionar en resize
        positionBtn();
        window.addEventListener('resize', positionBtn);
      });
    },

    /* ----------------------------------------------------------
       STICKY HEADER — Shadow al hacer scroll
       ---------------------------------------------------------- */
    stickyHeader() {
      const header = document.querySelector('.tx-header, .site-header');
      if (!header) return;

      const onScroll = () => {
        if (window.scrollY > 10) {
          header.classList.add('hf-scrolled');
          header.style.boxShadow = '0 1px 20px rgba(23,23,23,0.08)';
        } else {
          header.classList.remove('hf-scrolled');
          header.style.boxShadow = 'none';
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
    },

    /* ----------------------------------------------------------
       MOBILE MENU — Toggle hamburger
       ---------------------------------------------------------- */
    mobileMenu() {
      const toggle = document.querySelector('.hf-menu-toggle, .mobile-menu-toggle');
      const nav    = document.querySelector('.hf-mobile-nav, .mobile-nav');

      if (!toggle || !nav) return;

      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('hf-open');
        toggle.setAttribute('aria-expanded', isOpen);
        document.body.classList.toggle('hf-menu-open', isOpen);
      });

      // Cerrar al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
          nav.classList.remove('hf-open');
          document.body.classList.remove('hf-menu-open');
        }
      });
    },

    /* ----------------------------------------------------------
       CART ANIMATION — Feedback al agregar producto
       ---------------------------------------------------------- */
    cartAnimation() {
      // Escuchar evento de WooCommerce al agregar al carrito
      $(document.body).on('added_to_cart', function(e, fragments, cart_hash, $button) {
        // Animar ícono del carrito
        const cartIcon = document.querySelector('.cart-icon, .header-cart, [class*="cart-icon"]');
        if (cartIcon) {
          cartIcon.classList.add('hf-cart-bump');
          setTimeout(() => cartIcon.classList.remove('hf-cart-bump'), 600);
        }

        // Cambiar texto del botón temporalmente
        if ($button && $button.length) {
          const original = $button.text();
          $button.text('¡Agregado! ✓').addClass('hf-btn-success');
          setTimeout(() => {
            $button.text(original).removeClass('hf-btn-success');
          }, 2000);
        }
      });
    },

    /* ----------------------------------------------------------
       LAZY IMAGES — Fade in al cargar
       ---------------------------------------------------------- */
    lazyImages() {
      const images = document.querySelectorAll('.product-wrapper img, .hf-hero img');

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        images.forEach(img => {
          img.style.opacity = '0';
          img.style.transition = 'opacity 0.4s ease';
          if (img.complete) {
            img.style.opacity = '1';
          } else {
            img.addEventListener('load', () => { img.style.opacity = '1'; });
            observer.observe(img);
          }
        });
      }
    },

    /* ----------------------------------------------------------
       SMOOTH SCROLL — Anclas internas
       ---------------------------------------------------------- */
    smoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }

  }; // end hf object

  /* ============================================================
     VARIANTE DE PRODUCTO — Cambiar imagen al seleccionar
     ============================================================ */
  $(document.body).on('found_variation', function(e, variation) {
    if (variation.image && variation.image.src) {
      const gallery = document.querySelector('.woocommerce-product-gallery__image img');
      if (gallery) {
        gallery.style.opacity = '0';
        gallery.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          gallery.src = variation.image.src;
          gallery.style.opacity = '1';
        }, 150);
      }
    }
  });

  /* ============================================================
     QUANTITY BUTTONS — Incrementar/decrementar cantidad
     ============================================================ */
  $(document.body).on('click', '.hf-qty-plus, .hf-qty-minus', function() {
    const $input  = $(this).siblings('input.qty');
    const val     = parseInt($input.val()) || 1;
    const max     = parseInt($input.attr('max')) || 999;
    const min     = parseInt($input.attr('min')) || 1;
    const step    = parseInt($input.attr('step')) || 1;

    if ($(this).hasClass('hf-qty-plus') && val < max) {
      $input.val(val + step).trigger('change');
    } else if ($(this).hasClass('hf-qty-minus') && val > min) {
      $input.val(val - step).trigger('change');
    }
  });

})(jQuery);
