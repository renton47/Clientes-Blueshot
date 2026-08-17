<?php
/**
 * Página de configuración del plugin en el panel de WordPress.
 * Ajustes → Blueshot Portal
 */

if (!defined('ABSPATH')) exit;

class Blueshot_Settings {

    public static function init(): void {
        add_action('admin_menu', [self::class, 'add_admin_menu']);
        add_action('admin_init', [self::class, 'register_settings']);
    }

    public static function add_admin_menu(): void {
        add_options_page(
            'Blueshot Portal',
            'Blueshot Portal',
            'manage_options',
            'blueshot-portal',
            [self::class, 'render_settings_page']
        );
    }

    public static function register_settings(): void {
        register_setting('blueshot_portal', 'blueshot_portal_url', [
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting('blueshot_portal', 'blueshot_portal_secret', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
        register_setting('blueshot_portal', 'blueshot_portal_button_text', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }

    public static function render_settings_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Sin permisos.');
        }
        ?>
        <div class="wrap">
            <h1>🔷 Blueshot Portal — Configuración</h1>
            <p>Configura la integración entre tu sitio WordPress y el Portal Privado de Clientes Blueshot.</p>

            <?php settings_errors(); ?>

            <form method="post" action="options.php">
                <?php settings_fields('blueshot_portal'); ?>

                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="blueshot_portal_url">URL del Portal</label>
                        </th>
                        <td>
                            <input
                                type="url"
                                id="blueshot_portal_url"
                                name="blueshot_portal_url"
                                value="<?php echo esc_attr(get_option('blueshot_portal_url', '')); ?>"
                                class="regular-text"
                                placeholder="https://clientes.blueshot.cl"
                            />
                            <p class="description">URL completa del portal de clientes (sin barra al final).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="blueshot_portal_secret">Secreto de Integración</label>
                        </th>
                        <td>
                            <input
                                type="password"
                                id="blueshot_portal_secret"
                                name="blueshot_portal_secret"
                                value="<?php echo esc_attr(get_option('blueshot_portal_secret', '')); ?>"
                                class="regular-text"
                                autocomplete="new-password"
                            />
                            <p class="description">
                                Debe coincidir exactamente con <code>WP_INTEGRATION_SECRET</code> en el archivo
                                <code>.env.local</code> del portal. Genera uno con:
                                <code>openssl rand -base64 32</code>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="blueshot_portal_button_text">Texto del botón</label>
                        </th>
                        <td>
                            <input
                                type="text"
                                id="blueshot_portal_button_text"
                                name="blueshot_portal_button_text"
                                value="<?php echo esc_attr(get_option('blueshot_portal_button_text', 'Acceder al Portal Blueshot')); ?>"
                                class="regular-text"
                            />
                        </td>
                    </tr>
                </table>

                <?php submit_button('Guardar configuración'); ?>
            </form>

            <hr>
            <h2>Uso del Shortcode</h2>
            <p>Inserta este shortcode en cualquier página o widget para mostrar el botón de acceso:</p>
            <code>[blueshot_portal_button]</code>
            <p>Con parámetros:</p>
            <code>[blueshot_portal_button text="Ir a Blueshot AI" redirect="/chat"]</code>

            <h2>Prueba de conexión</h2>
            <?php
            $url = get_option('blueshot_portal_url', '');
            $secret = get_option('blueshot_portal_secret', '');

            if (empty($url) || empty($secret)) {
                echo '<div class="notice notice-warning"><p>Configura la URL y el secreto primero.</p></div>';
            } else {
                echo '<div class="notice notice-success"><p>✅ Plugin configurado. Usa el shortcode en tus páginas.</p></div>';
            }
            ?>
        </div>
        <?php
    }
}
