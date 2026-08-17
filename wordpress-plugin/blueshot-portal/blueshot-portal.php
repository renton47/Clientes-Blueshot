<?php
/**
 * Plugin Name: Blueshot Portal
 * Plugin URI: https://blueshot.cl
 * Description: Integración segura entre WordPress y el Portal Privado de Clientes Blueshot. Permite a los clientes acceder al portal y a Blueshot AI sin una segunda cuenta.
 * Version: 1.0.0
 * Author: Blueshot
 * Author URI: https://blueshot.cl
 * Text Domain: blueshot-portal
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * License: Private
 */

if (!defined('ABSPATH')) {
    exit; // Previene acceso directo
}

define('BLUESHOT_PORTAL_VERSION', '1.0.0');
define('BLUESHOT_PORTAL_FILE', __FILE__);
define('BLUESHOT_PORTAL_DIR', plugin_dir_path(__FILE__));
define('BLUESHOT_PORTAL_URL', plugin_dir_url(__FILE__));

// Cargar clases
require_once BLUESHOT_PORTAL_DIR . 'includes/class-blueshot-settings.php';
require_once BLUESHOT_PORTAL_DIR . 'includes/class-blueshot-jwt.php';
require_once BLUESHOT_PORTAL_DIR . 'includes/class-blueshot-auth.php';

/**
 * Inicializar el plugin
 */
function blueshot_portal_init(): void {
    Blueshot_Settings::init();
    Blueshot_Auth::init();
}
add_action('plugins_loaded', 'blueshot_portal_init');

/**
 * Activación del plugin — crear opciones por defecto
 */
function blueshot_portal_activate(): void {
    add_option('blueshot_portal_url', '');
    add_option('blueshot_portal_secret', '');
    add_option('blueshot_portal_button_text', 'Acceder al Portal Blueshot');
    add_option('blueshot_portal_button_position', 'after_login');
}
register_activation_hook(__FILE__, 'blueshot_portal_activate');

/**
 * Desactivación del plugin
 */
function blueshot_portal_deactivate(): void {
    // No eliminamos opciones al desactivar (solo al desinstalar)
}
register_deactivation_hook(__FILE__, 'blueshot_portal_deactivate');

/**
 * Desinstalación completa
 */
function blueshot_portal_uninstall(): void {
    delete_option('blueshot_portal_url');
    delete_option('blueshot_portal_secret');
    delete_option('blueshot_portal_button_text');
    delete_option('blueshot_portal_button_position');
}
register_uninstall_hook(__FILE__, 'blueshot_portal_uninstall');
