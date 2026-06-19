// ─── Yapılandırma ─────────────────────────────────────────────────────────────
// .env dosyasına taşımanız önerilir (dotenv kullanın)

export const config = {
  // WordPress
  wordpress: {
    siteUrl: process.env.WP_SITE_URL || "https://yoursite.com",
    username: process.env.WP_USERNAME || "admin",
    // WordPress > Kullanıcılar > Profil > Application Passwords'den al
    appPassword: process.env.WP_APP_PASSWORD || "xxxx xxxx xxxx xxxx xxxx xxxx",
  },

  // OpenAI (DALL-E + Blog üretimi)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "sk-...",
  },

  // Gmail SMTP (onay mailleri için)
  email: {
    from: process.env.EMAIL_FROM || "ornek@gmail.com",
    to: process.env.EMAIL_TO || "ornek@gmail.com",  // onay alıcısı
    // Gmail > Hesap > Güvenlik > 2FA açık olmalı > App Password oluştur
    gmailUser: process.env.GMAIL_USER || "ornek@gmail.com",
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "xxxx xxxx xxxx xxxx",
  },

  // Onay sistemi
  approval: {
    // Bu sunucun dışarıdan erişilebilir URL'si
    baseUrl: process.env.APPROVAL_BASE_URL || "http://localhost:3001",
    // Onay tokenları bu süre sonra geçersiz olur (ms)
    tokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 gün
  },

  // Approval HTTP server portu
  approvalServerPort: process.env.APPROVAL_PORT || 3001,
};
