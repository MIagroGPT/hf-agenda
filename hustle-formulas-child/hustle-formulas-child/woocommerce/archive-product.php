<?php
/**
 * WooCommerce — Página de tienda (archive-product.php)
 * Template override para el child theme Hustle Formulas
 *
 * @package HustleFormulasChild
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );
?>

<main id="hf-shop" class="hf-shop-page">

  <!-- ===== BANNER CATEGORÍA (si tiene imagen) ===== -->
  <?php
  $current_term = get_queried_object();
  if ( $current_term && isset( $current_term->term_id ) ) :
    $thumbnail_id = get_term_meta( $current_term->term_id, 'thumbnail_id', true );
    if ( $thumbnail_id ) :
  ?>
    <div class="hf-cat-banner">
      <div class="hf-cat-banner__img">
        <?php echo wp_get_attachment_image( $thumbnail_id, 'hf-hero' ); ?>
      </div>
      <div class="hf-cat-banner__text">
        <h1 class="hf-cat-banner__title"><?php echo esc_html( $current_term->name ); ?></h1>
        <?php if ( $current_term->description ) : ?>
          <p class="hf-cat-banner__desc"><?php echo esc_html( $current_term->description ); ?></p>
        <?php endif; ?>
      </div>
    </div>
  <?php else : ?>
    <div class="hf-shop-header">
      <div class="hf-container">
        <?php woocommerce_page_title(); ?>
      </div>
    </div>
  <?php
    endif;
  else : ?>
    <div class="hf-shop-header">
      <div class="hf-container">
        <?php woocommerce_page_title(); ?>
      </div>
    </div>
  <?php endif; ?>

  <!-- ===== CONTENIDO TIENDA ===== -->
  <div class="hf-container hf-shop-content">

    <!-- Breadcrumb -->
    <div class="hf-breadcrumb-wrap">
      <?php woocommerce_breadcrumb(); ?>
    </div>

    <!-- Barra superior: resultados + ordenar -->
    <div class="hf-shop-topbar">
      <div class="hf-shop-topbar__left">
        <?php woocommerce_result_count(); ?>
      </div>
      <div class="hf-shop-topbar__right">
        <?php woocommerce_catalog_ordering(); ?>
      </div>
    </div>

    <!-- Grid de productos -->
    <?php if ( woocommerce_product_loop() ) : ?>
      <?php woocommerce_product_loop_start(); ?>
        <?php while ( have_posts() ) : the_post(); ?>
          <?php wc_get_template_part( 'content', 'product' ); ?>
        <?php endwhile; ?>
      <?php woocommerce_product_loop_end(); ?>

      <!-- Paginación -->
      <div class="hf-pagination">
        <?php woocommerce_pagination(); ?>
      </div>

    <?php else : ?>
      <div class="hf-no-products">
        <?php wc_get_template( 'loop/no-products-found.php' ); ?>
      </div>
    <?php endif; ?>

  </div><!-- /.hf-container -->

</main><!-- /#hf-shop -->

<?php get_footer( 'shop' ); ?>
