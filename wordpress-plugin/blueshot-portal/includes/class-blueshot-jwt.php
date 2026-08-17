<?php
/**
 * Generación y verificación de JWT para la integración WordPress → Portal
 *
 * SEGURIDAD:
 * - Implementa HS256 sin dependencias externas (PHP puro)
 * - Token de corta duración (5 minutos)
 * - El secreto nunca se expone al navegador
 */

if (!defined('ABSPATH')) exit;

class Blueshot_JWT {

    /**
     * Genera un JWT firmado con HS256 para autenticar al usuario en el portal.
     *
     * @param int    $wp_user_id  ID del usuario en WordPress
     * @param string $email       Email del usuario
     * @param string $name        Nombre del usuario
     * @return string             JWT firmado
     * @throws RuntimeException   Si el secreto no está configurado
     */
    public static function generate(int $wp_user_id, string $email, string $name): string {
        $secret = get_option('blueshot_portal_secret', '');

        if (empty($secret)) {
            throw new RuntimeException(
                'Blueshot Portal: El secreto de integración no está configurado. ' .
                'Ve a Ajustes → Blueshot Portal para configurarlo.'
            );
        }

        $issued_at = time();
        $expires_at = $issued_at + (5 * 60); // 5 minutos

        $header = self::base64url_encode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));

        $payload = self::base64url_encode(json_encode([
            'wp_user_id' => $wp_user_id,
            'email'      => $email,
            'name'       => $name,
            'iat'        => $issued_at,
            'exp'        => $expires_at,
        ]));

        $signature = self::base64url_encode(
            hash_hmac('sha256', "{$header}.{$payload}", $secret, true)
        );

        return "{$header}.{$payload}.{$signature}";
    }

    /**
     * Codifica en base64url (sin padding, URL-safe).
     */
    private static function base64url_encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
