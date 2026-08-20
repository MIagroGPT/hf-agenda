<?php
/**
 * WooCommerce — Tarjeta de producto (content-product.php)
 * Template override para el child theme Hustle Formulas
 *
 * @see https://woocommerce.com/document/template-structure/
 * @package HustleFormulasChild
 */

defined( 'ABSPATH' ) || exit;

global $product;

// Asegurarse que $product es un objeto válido
if ( empty( $product ) || ! $product->is_visible() ) return;
?>
<li <?php wc_product_class( 'hf-product-card', $product ); ?>>
  <div class="product-wrapper">

    <!-- ===== IMAGEN ===== -->
    <div class="thumbnail-wrapper">
      <?php
      // Badge de oferta
      if ( $product->is_on_sale() ) :
        $regular = floatval( $product->get_regular_price() );
        $sale    = floatval( $product->get_sale_price() );
        $pct     = ( $regular > 0 ) ? round( ( ( $regular - $sale ) / $regular ) * 100 ) : 0;
      ?>
        <span class="onsale">-<?php echo $pct; ?>%</span>
      <?php endif; ?>

      <?php
      // Imagen del producto
      if ( has_post_thumbnail() ) :
        echo woocommerce_get_product_thumbnail( 'hf-product-card' );
      else :
      ?>
        <img src="<?php echo esc_url( wc_placeholder_img_src( 'hf-product-card' ) ); ?>"
             alt="<?php echo esc_attr( $product->get_name() ); ?>"
             class="wp-post-image" />
      <?php endif; ?>

      <!-- Botón agregar al carrito (overlay) -->
      <div class="product-buttons">
        <?php
        woocommerce_template_loop_add_to_cart( array(
          'quantity' => 1,
          'class'    => implode( ' ', array_filter( array(
            'button',
            'product_type_' . $product->get_type(),
            $product->is_purchasable() && $product->is_in_stock() ? 'add_to_cart_button' : '',
            $product->supports( 'ajax_add_to_cart' ) && $product->is_purchasable() && $product->is_in_stock() ? 'ajax_add_to_cart' : '',
          ) ) ),
          'aria-label'        => $product->add_to_cart_description(),
          'data-product_id'   => $product->get_id(),
          'data-product_sku'  => $product->get_sku(),
        ) );
        ?>
      </div>

      <!-- Acciones: wishlist, quickview -->
      <div class="product-actions">
        <?php do_action( 'woocommerce_after_shop_loop_item' ); ?>
      </div>
    </div><!-- /.thumbnail-wrapper -->

    <!-- ===== INFO DEL PRODUCTO ===== -->
    <div class="product-info">
      <?php
      // Marca / categoría
      $cats = get_the_terms( $product->get_id(), 'product_cat' );
      if ( $cats && ! is_wp_error( $cats ) ) :
        $cat = reset( $cats );
      ?>
        <span class="product-brand"><?php echo esc_html( $cat->name ); ?></span>
      <?php endif; ?>

      <!-- Nombre -->
      <h2 class="woocommerce-loop-product__title">
        <a href="<?php echo esc_url( get_the_permalink() ); ?>">
          <?php echo get_the_title(); ?>
        </a>
      </h2>

      <!-- Precio -->
      <div class="price-wrapper">
        <?php echo $product->get_price_html(); ?>
      </div>
    </div><!-- /.product-info -->

  </div><!-- /.product-wrapper -->
</li>
