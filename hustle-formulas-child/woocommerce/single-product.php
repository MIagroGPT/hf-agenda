<?php
/**
 * WooCommerce — Página de producto individual (single-product.php)
 * Template override para Hustle Formulas Child
 *
 * @package HustleFormulasChild
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

while ( have_posts() ) :
  the_post();
  global $product;
?>

<main id="hf-product" class="hf-single-product">
  <div class="hf-container">

    <!-- Breadcrumb -->
    <div class="hf-breadcrumb-wrap">
      <?php woocommerce_breadcrumb(); ?>
    </div>

    <!-- Layout principal: galería + info -->
    <div class="hf-product-layout">

      <!-- ===== GALERÍA ===== -->
      <div class="hf-product-gallery">
        <?php woocommerce_show_product_images(); ?>
      </div>

      <!-- ===== INFO DEL PRODUCTO ===== -->
      <div class="hf-product-summary">

        <!-- Categorías como etiquetas pequeñas -->
        <?php
        $cats = get_the_terms( $product->get_id(), 'product_cat' );
        if ( $cats && ! is_wp_error( $cats ) ) :
        ?>
          <div class="hf-product-cats">
            <?php foreach ( $cats as $cat ) : ?>
              <a href="<?php echo esc_url( get_term_link( $cat ) ); ?>" class="hf-cat-tag">
                <?php echo esc_html( $cat->name ); ?>
              </a>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <!-- Título -->
        <h1 class="hf-product-title product_title entry-title">
          <?php the_title(); ?>
        </h1>

        <!-- Rating -->
        <?php woocommerce_template_single_rating(); ?>

        <!-- Precio -->
        <div class="hf-product-price">
          <?php woocommerce_template_single_price(); ?>
        </div>

        <!-- Descripción corta -->
        <div class="hf-product-excerpt">
          <?php woocommerce_template_single_excerpt(); ?>
        </div>

        <!-- Formulario ATC (variantes, cantidad, botón) -->
        <div class="hf-product-form">
          <?php woocommerce_template_single_add_to_cart(); ?>
        </div>

        <!-- Meta: SKU, categorías -->
        <div class="hf-product-meta">
          <?php woocommerce_template_single_meta(); ?>
        </div>

        <!-- Compartir -->
        <div class="hf-product-share">
          <?php woocommerce_template_single_sharing(); ?>
        </div>

        <!-- Iconos de confianza -->
        <div class="hf-trust-badges">
          <div class="hf-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Compra 100% segura</span>
          </div>
          <div class="hf-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span>Envíos a todo México</span>
          </div>
          <div class="hf-trust-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            <span>Devoluciones fáciles</span>
          </div>
        </div>

      </div><!-- /.hf-product-summary -->
    </div><!-- /.hf-product-layout -->

    <!-- ===== TABS: Descripción, Información, Reseñas ===== -->
    <div class="hf-product-tabs">
      <?php woocommerce_output_product_data_tabs(); ?>
    </div>

    <!-- ===== PRODUCTOS RELACIONADOS ===== -->
    <div class="hf-related-products">
      <?php woocommerce_output_related_products(); ?>
    </div>

  </div><!-- /.hf-container -->
</main>

<?php
endwhile;
get_footer( 'shop' );
?>
