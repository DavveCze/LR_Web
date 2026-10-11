<?php
declare(strict_types=1);

/**
 * Universal Socket SMTP & CRLF-Safe Mailer
 * Zero-dependency PHP Mailer supporting mail(), direct authenticated Socket SMTP (TLS/SSL),
 * cascading config resolution, CRLF sanitization and responsive HTML templates.
 */
class UniversalMailer {
    private string $defaultFrom;
    private string $defaultTo;
    private string $templatesDir;

    public function __construct(
        ?string $defaultFrom = null,
        ?string $defaultTo = null,
        ?string $templatesDir = null
    ) {
        $this->templatesDir = $templatesDir ?? __DIR__ . '/templates';
        
        $from = $defaultFrom ?? self::getConfigValue('MAIL_FROM', 'from', 'noreply@localhost');
        $this->defaultFrom = ($from && filter_var($from, FILTER_VALIDATE_EMAIL)) 
            ? $from 
            : 'noreply@localhost';

        $to = $defaultTo ?? self::getConfigValue('MAIL_TO', 'to', 'admin@localhost');
        $this->defaultTo = ($to && filter_var($to, FILTER_VALIDATE_EMAIL)) 
            ? $to 
            : 'admin@localhost';
    }

    /**
     * Resolves configuration value with cascading fallback:
     * 1. getenv() / $_ENV
     * 2. $_SERVER (including Apache REDIRECT_ prefixed by mod_rewrite)
     * 3. Config PHP file (if available)
     */
    public static function getConfigValue(string $envKey, ?string $configKey = null, ?string $default = null): ?string {
        if (!empty(getenv($envKey))) {
            return (string)getenv($envKey);
        }
        if (!empty($_ENV[$envKey])) {
            return (string)$_ENV[$envKey];
        }
        if (!empty($_SERVER[$envKey])) {
            return (string)$_SERVER[$envKey];
        }
        if (!empty($_SERVER['REDIRECT_' . $envKey])) {
            return (string)$_SERVER['REDIRECT_' . $envKey];
        }

        // Optional local config file
        $configFile = __DIR__ . '/config.php';
        if (file_exists($configFile)) {
            $config = @include $configFile;
            if (is_array($config) && isset($config['mail']) && is_array($config['mail'])) {
                $cKey = $configKey ?? strtolower(str_replace('MAIL_', '', $envKey));
                if (!empty($config['mail'][$cKey])) {
                    return (string)$config['mail'][$cKey];
                }
            }
        }

        return $default;
    }

    /**
     * Sanitizes a single-line email header value to prevent CRLF injection attacks.
     */
    public static function sanitizeHeader(string $value): string {
        return trim(preg_replace('/[\r\n\t]+/', ' ', $value) ?? '');
    }

    /**
     * Sends an email via mail() or authenticated SMTP with UTF-8 base64 headers.
     */
    public function send(
        string $to,
        string $subject,
        string $htmlBody,
        ?string $replyTo = null,
        string $fromName = 'Web Notification'
    ): bool {
        $to = self::sanitizeHeader($to);
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log('Mailer error: Invalid recipient email: ' . $to);
            return false;
        }

        $fromEmail = $this->defaultFrom;
        $cleanFromName = self::sanitizeHeader($fromName);
        $encodedFromName = '=?UTF-8?B?' . base64_encode($cleanFromName) . '?=';
        $encodedSubject = '=?UTF-8?B?' . base64_encode(self::sanitizeHeader($subject)) . '?=';

        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $encodedFromName . ' <' . $fromEmail . '>',
            'X-Mailer: PHP/' . phpversion(),
        ];

        if ($replyTo !== null) {
            $cleanReplyTo = self::sanitizeHeader($replyTo);
            if (filter_var($cleanReplyTo, FILTER_VALIDATE_EMAIL)) {
                $headers[] = 'Reply-To: ' . $cleanReplyTo;
            }
        }

        // Prefer SMTP if host is configured
        if (!empty(self::getConfigValue('SMTP_HOST', 'smtpHost'))) {
            $smtpResult = $this->sendViaSmtp($to, $encodedSubject, $htmlBody, $headers);
            if ($smtpResult) {
                return true;
            }
            error_log('Mailer: SMTP delivery failed, falling back to mail()');
        }

        $headerString = implode("\r\n", $headers);
        $extraParams = '-f' . escapeshellarg($fromEmail);

        $result = @mail($to, $encodedSubject, $htmlBody, $headerString, $extraParams);
        if (!$result) {
            error_log('Mailer: mail() call returned false for ' . $to);
        }

        return $result;
    }

    /**
     * Direct Socket SMTP delivery without heavy dependencies (e.g. PHPMailer).
     */
    private function sendViaSmtp(string $to, string $subject, string $htmlBody, array $headers): bool {
        $host = (string)self::getConfigValue('SMTP_HOST', 'smtpHost', '');
        $port = (int)(self::getConfigValue('SMTP_PORT', 'smtpPort', '587') ?: 587);
        $user = (string)self::getConfigValue('SMTP_USER', 'smtpUser', '');
        $pass = (string)self::getConfigValue('SMTP_PASS', 'smtpPass', '');
        $secure = strtolower((string)(self::getConfigValue('SMTP_SECURE', 'smtpSecure', 'tls') ?: 'tls'));

        $prefix = ($secure === 'ssl') ? 'ssl://' : '';
        $socket = @fsockopen($prefix . $host, $port, $errno, $errstr, 5);
        if (!$socket) {
            error_log("Mailer SMTP Connection failed: $errstr ($errno)");
            return false;
        }

        $read = function() use ($socket) {
            $data = '';
            while ($str = fgets($socket, 515)) {
                $data .= $str;
                if (substr($str, 3, 1) === ' ') break;
            }
            return $data;
        };

        $write = function(string $cmd) use ($socket) {
            fputs($socket, $cmd . "\r\n");
        };

        $read();
        $write('EHLO ' . gethostname());
        $ehlo = $read();

        if ($secure === 'tls' && str_contains($ehlo, 'STARTTLS')) {
            $write('STARTTLS');
            $read();
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                return false;
            }
            $write('EHLO ' . gethostname());
            $read();
        }

        if (!empty($user) && !empty($pass)) {
            $write('AUTH LOGIN');
            $read();
            $write(base64_encode($user));
            $read();
            $write(base64_encode($pass));
            $authRes = $read();
            if (!str_starts_with($authRes, '235')) {
                error_log('Mailer SMTP Auth failed: ' . trim($authRes));
                fclose($socket);
                return false;
            }
        }

        $write('MAIL FROM: <' . $this->defaultFrom . '>');
        $read();
        $write('RCPT TO: <' . $to . '>');
        $read();
        $write('DATA');
        $read();

        $allHeaders = implode("\r\n", $headers);
        $allHeaders .= "\r\nTo: " . $to;
        $allHeaders .= "\r\nSubject: " . $subject;

        // Ensure proper CRLF and dot-stuffing
        $cleanBody = str_replace(["\r\n", "\r"], "\n", $htmlBody);
        $cleanBody = str_replace("\n", "\r\n", $cleanBody);
        $cleanBody = preg_replace('/^\./m', '..', $cleanBody);

        $write($allHeaders . "\r\n\r\n" . $cleanBody . "\r\n.");
        $dataRes = $read();

        $write('QUIT');
        fclose($socket);

        return str_starts_with($dataRes, '250');
    }

    /**
     * Loads and populates an HTML email template with placeholders.
     */
    public function renderTemplate(string $templateName, array $placeholders = []): string {
        $templatePath = $this->templatesDir . '/' . $templateName . '.html';
        if (!file_exists($templatePath)) {
            throw new RuntimeException("Email template not found: {$templatePath}");
        }

        $html = file_get_contents($templatePath);
        if ($html === false) {
            throw new RuntimeException("Failed to read email template: {$templatePath}");
        }

        foreach ($placeholders as $key => $value) {
            $safeVal = htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
            $html = str_replace('{{' . $key . '}}', $safeVal, $html);
            // Support raw HTML placeholder if prefixed with RAW_
            $html = str_replace('{{RAW_' . $key . '}}', (string)$value, $html);
        }

        return $html;
    }
}
