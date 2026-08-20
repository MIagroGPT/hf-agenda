<?php
/**
 * Hustle Formulas Child Theme — functions.php
 * Child theme de Cozzy Corner con estética premium L3VEL3
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* ============================================================
   ENCOLAR ESTILOS Y SCRIPTS
   ============================================================ */
add_action( 'wp_enqueue_scripts', 'hf_child_enqueue_styles', 20 );
function hf_child_enqueue_styles() {
    // Estilo del tema padre (Cozzy Corner)
    wp_enqueue_style(
        'cozycorner-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme( 'cozycorner' )->get( 'Version' )
    );

    // Google Fonts — Inter
    wp_enqueue_style(
        'hf-google-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        array(),
        null
    );

    // Estilo del child theme
    wp_enqueue_style(
        'hf-child-style',
        get_stylesheet_uri(),
        array( 'cozycorner-parent-style' ),
        wp_get_theme()->get( 'Version' )
    );

    // CSS tienda y producto
    if ( is_shop() || is_product_category() || is_product() || is_cart() || is_checkout() ) {
        wp_enqueue_style(
            'hf-shop-style',
            get_stylesheet_directory_uri() . '/assets/css/shop.css',
            array( 'hf-child-style' ),
            wp_get_theme()->get( 'Version' )
        );
    }
}

add_action( 'wp_enqueue_scripts', 'hf_child_enqueue_scripts', 20 );
function hf_child_enqueue_scripts() {
    wp_enqueue_script(
        'hf-theme-js',
        get_stylesheet_directory_uri() . '/assets/js/theme.js',
        array( 'jquery' ),
        wp_get_theme()->get( 'Version' ),
        true
    );

    // Pasar variables de PHP a JS
    wp_localize_script( 'hf-theme-js', 'hfData', array(
        'ajaxurl'    => admin_url( 'admin-ajax.php' ),
        'nonce'      => wp_create_nonce( 'hf-nonce' ),
        'cartUrl'    => wc_get_cart_url(),
        'addedText'  => __( '¡Agregado!', 'hustle-formulas-child' ),
        'addText'    => __( 'Agregar al carrito', 'hustle-formulas-child' ),
    ) );
}

/* ============================================================
   SOPORTE PARA IMÁGENES DESTACADAS
   ============================================================ */
add_action( 'after_setup_theme', 'hf_child_setup' );
function hf_child_setup() {
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'woocommerce' );
    add_theme_support( 'wc-product-gallery-zoom' );
    add_theme_support( 'wc-product-gallery-lightbox' );
    add_theme_support( 'wc-product-gallery-slider' );

    // Tamaños de imagen personalizados
    add_image_size( 'hf-product-card', 600, 600, true );
    add_image_size( 'hf-product-large', 900, 900, true );
    add_image_size( 'hf-hero', 1920, 900, true );
}

/* ============================================================
   WOOCOMMERCE — Ajustes globales
   ============================================================ */

// Cantidad de productos por página en shop
add_filter( 'loop_shop_per_page', function() { return 24; }, 20 );

// Columnas en shop (4 en desktop)
add_filter( 'loop_shop_columns', function() { return 4; } );

// Columnas en productos relacionados
add_filter( 'woocommerce_output_related_products_args', function( $args ) {
    $args['posts_per_page'] = 4;
    $args['columns']        = 4;
    return $args;
} );

// Desactivar sidebar en shop (diseño full width)
add_filter( 'woocommerce_product_tabs', 'hf_reorder_product_tabs', 98 );
function hf_reorder_product_tabs( $tabs ) {
    if ( isset( $tabs['description'] ) ) {
        $tabs['description']['priority'] = 10;
    }
    if ( isset( $tabs['additional_information'] ) ) {
        $tabs['additional_information']['priority'] = 20;
    }
    if ( isset( $tabs['reviews'] ) ) {
        $tabs['reviews']['priority'] = 30;
    }
    return $tabs;
}

/* ============================================================
   MODIFICAR EL BREADCRUMB DE WOOCOMMERCE
   ============================================================ */
add_filter( 'woocommerce_breadcrumb_defaults', function( $defaults ) {
    $defaults['delimiter']   = ' <span class="hf-breadcrumb-sep">›</span> ';
    $defaults['wrap_before'] = '<nav class="hf-breadcrumb" aria-label="breadcrumb"><ol>';
    $defaults['wrap_after']  = '</ol></nav>';
    $defaults['before']      = '<li>';
    $defaults['after']       = '</li>';
    return $defaults;
} );

/* ============================================================
   AGREGAR CLASE "added" AL BOTÓN DESPUÉS DE AGREGAR AL CARRITO
   ============================================================ */
add_filter( 'woocommerce_loop_add_to_cart_args', function( $args, $product ) {
    $args['class'] .= ' hf-atc-btn';
    return $args;
}, 10, 2 );

/* ============================================================
   FOOTER PERSONALIZADO — Texto de copyright
   ============================================================ */
add_action( 'wp_footer', 'hf_custom_footer_script' );
function hf_custom_footer_script() {
    ?>
    <script>
    // Agregar año dinámico al footer si existe el elemento
    const yearEl = document.querySelector('.hf-footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    </script>
    <?php
}

/* ============================================================
   WIDGETS — Registrar zonas de widget
   ============================================================ */
add_action( 'widgets_init', 'hf_register_sidebars' );
function hf_register_sidebars() {
    register_sidebar( array(
        'name'          => __( 'Shop Sidebar', 'hustle-formulas-child' ),
        'id'            => 'shop-sidebar',
        'before_widget' => '<div class="hf-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="hf-widget-title">',
        'after_title'   => '</h3>',
    ) );

    register_sidebar( array(
        'name'          => __( 'Footer Col 1', 'hustle-formulas-child' ),
        'id'            => 'footer-col-1',
        'before_widget' => '<div class="hf-footer-widget">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="hf-footer-title">',
        'after_title'   => '</h4>',
    ) );
}

/* ============================================================
   SHORTCODES ÚTILES
   ============================================================ */

// [hf_products count="8" category="afeitado"]
add_shortcode( 'hf_products', function( $atts ) {
    $atts = shortcode_atts( array(
        'count'    => 8,
        'category' => '',
        'orderby'  => 'date',
        'order'    => 'DESC',
    ), $atts );

    return do_shortcode( '[products limit="' . $atts['count'] . '" category="' . $atts['category'] . '" orderby="' . $atts['orderby'] . '" order="' . $atts['order'] . '" columns="4"]' );
} );

// Fin del archivo
