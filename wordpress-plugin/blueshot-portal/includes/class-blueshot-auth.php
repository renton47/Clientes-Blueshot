<?php
/**
 * Lógica de autenticación: genera el enlace seguro de acceso al portal
 * y lo inyecta en las páginas de WordPress apropiadas.
 */

if (!defined('ABSPATH')) exit;

class Blueshot_Auth {

    public static function init(): void {
        // Shortcode para insertar botón de acceso al portal en cualquier página
        add_shortcode('blueshot_portal_button', [self::class, 'render_portal_button']);

        // Botón después del login de WooCommerce
        add_action('woocommerce_account_navigation', [self::class, 'add_portal_link_to_woo_account']);

        // Endpoint REST para generar el token (usado internamente)
        add_action('rest_api_init', [self::class, 'register_rest_endpoints']);
    }

    /**
     * Genera el enlace de acceso seguro al portal para el usuario actual.
     * El token JWT se pasa al endpoint /api/wp-auth del portal.
     *
     * @return string|null URL de acceso al portal, o null si no hay usuario o no hay configuración
     */
    public static function generate_portal_access_url(string $redirect = '/dashboard'): ?string {
        if (!is_user_logged_in()) return null;

        $portal_url = rtrim(get_option('blueshot_portal_url', ''), '/');
        if (empty($portal_url)) return null;

        $user = wp_get_current_user();

        try {
            $token = Blueshot_JWT::generate(
                $user->ID,
                $user->user_email,
                $user->display_name
            );
        } catch (RuntimeException $e) {
            // Log del error sin exponer detalles al usuario
            error_log('[Blueshot Portal] Error generando token: ' . $e->getMessage());
            return null;
        }

        $params = http_build_query([
            'token'    => $token,
            'redirect' => $redirect,
        ]);

        // El portal verifica el JWT en /api/wp-auth antes de autenticar
        return "{$portal_url}/api/wp-auth?" . $params;
    }

    /**
     * Shortcode [blueshot_portal_button] — inserta un botón de acceso al portal.
     * Uso: [blueshot_portal_button text="Acceder" redirect="/chat"]
     */
    public static function render_portal_button(array $atts): string {
        $atts = shortcode_atts([
            'text'     => get_option('blueshot_portal_button_text', 'Acceder al Portal Blueshot'),
            'redirect' => '/dashboard',
            'class'    => 'blueshot-portal-btn',
        ], $atts);

        if (!is_user_logged_in()) {
            return '<a href="' . esc_url(wp_login_url(get_permalink())) . '" class="' . esc_attr($atts['class']) . '">'
                . esc_html($atts['text'])
                . '</a>';
        }

        $url = self::generate_portal_access_url($atts['redirect']);

        if (!$url) {
            return '<!-- Blueshot Portal: no configurado -->';
        }

        // El enlace abre en nueva pestaña por seguridad (el portal maneja el token)
        return '<a href="' . esc_url($url) . '" target="_blank" rel="noopener" class="' . esc_attr($atts['class']) . '">'
            . esc_html($atts['text'])
            . '</a>';
    }

    /**
     * Agrega un enlace al portal en el menú de "Mi cuenta" de WooCommerce.
     */
    public static function add_portal_link_to_woo_account(): void {
        if (!is_user_logged_in()) return;

        $url = self::generate_portal_access_url('/dashboard');
        if (!$url) return;

        echo '<li class="woocommerce-MyAccount-navigation-link blueshot-portal-link">'
            . '<a href="' . esc_url($url) . '" target="_blank" rel="noopener">'
            . '🔷 Portal Blueshot'
            . '</a>'
            . '</li>';
    }

    /**
     * Endpoint REST: POST /wp-json/blueshot/v1/generate-token
     * Genera un token para el usuario autenticado. Solo accesible para usuarios logueados.
     */
    public static function register_rest_endpoints(): void {
        register_rest_route('blueshot/v1', '/generate-token', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'rest_generate_token'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public static function rest_generate_token(\WP_REST_Request $request): \WP_REST_Response {
        $user     = wp_get_current_user();
        $redirect = sanitize_text_field($request->get_param('redirect') ?? '/dashboard');

        $url = self::generate_portal_access_url($redirect);

        if (!$url) {
            return new \WP_REST_Response([
                'error' => 'Portal no configurado. Contacta al administrador.',
            ], 503);
        }

        return new \WP_REST_Response(['redirect_url' => $url], 200);
    }
}
