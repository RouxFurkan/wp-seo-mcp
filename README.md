# AI SEO WordPress — Yapay Zeka Destekli WordPress SEO Blog Üretim Sistemi

> MCP (Model Context Protocol) tabanlı, blog içeriği üretiminden yayınlamaya kadar tüm süreci otomatikleştiren WordPress SEO otomasyon sistemi. (Repo/klasör adı: `wp-seo-mcp`)

[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o_%7C_DALL--E_3-412991.svg)](https://platform.openai.com/)
[![WordPress](https://img.shields.io/badge/wordpress-REST_API-21759b.svg)](https://developer.wordpress.org/rest-api/)

---

## 👤 Öğrenci Bilgileri

| | |
|---|---|
| **Ad Soyad** | {AD_SOYAD} |
| **Öğrenci No** | {OGRENCI_NO} |
| **Ders** | CPP214 |

---

## 🎯 Projenin Amacı ve Kısa Açıklaması

Küçük işletmeler ve dijital ajanslar için düzenli, SEO uyumlu blog içeriği üretmek ciddi bir zaman ve maliyet yüküdür. Bu proje, bir **MCP sunucusu** olarak çalışarak içerik üretiminden yayınlamaya kadar tüm akışı otomatikleştirir.

Kullanıcı, Claude'a bir konu (veya anahtar kelime) verir; sistem GPT-4o ile SEO uyumlu blog yazısını üretir, DALL-E 3 ile yazıya uygun öne çıkan görseli oluşturur, Gmail üzerinden onay maili gönderir ve onaylanan içeriği WordPress REST API ile siteye yayınlar. Tüm süreç Claude arayüzünden tek bir komutla yönetilebilir.

---

## 🧰 Kullanılan Teknolojiler / Kütüphaneler

- **Node.js 18+** — çalışma zamanı (ES Modules)
- **@modelcontextprotocol/sdk** — MCP sunucu altyapısı (Claude entegrasyonu)
- **OpenAI (`openai`)** — GPT-4o ile blog içeriği, DALL-E 3 ile görsel üretimi
- **WordPress REST API** — içeriğin otomatik yayınlanması
- **Nodemailer** — Gmail üzerinden onay maili gönderimi
- **Express** — onay butonları için HTTP sunucusu (`approval-server.js`)
- **node-fetch** — HTTP istekleri

---

## 📁 Proje Klasör Yapısı

```
wp-seo-mcp/
├── src/
│   ├── index.js          ← MCP Server (ana giriş noktası, tool tanımları)
│   └── config.js         ← Yapılandırma (API anahtarları, .env okuma)
├── tools/
│   ├── generateBlog.js   ← GPT-4o ile SEO blog üretimi
│   ├── generateImage.js  ← DALL-E 3 ile görsel üretimi
│   ├── wordpress.js      ← WordPress REST API yayınlama
│   ├── approval.js       ← Gmail onay sistemi (mail + token)
│   ├── seoAnalyze.js     ← İçerik SEO analizi
│   └── listPosts.js      ← Bekleyen / taslak yazıları listeleme
├── approval-server.js    ← Onay butonları için HTTP sunucusu
├── .env.example          ← Örnek ortam değişkenleri
├── .gitignore
├── package.json
└── README.md             ← Bu dosya
```

---

## 🧩 Mevcut MCP Araçları

| Araç | Açıklama |
|------|----------|
| `generate_blog_post` | GPT-4o ile SEO uyumlu blog yazısı üretir |
| `generate_image` | DALL-E 3 ile öne çıkan görsel üretir |
| `analyze_seo` | İçeriğin SEO analizini ve puanını verir |
| `send_approval_email` | Kullanıcıya onay maili gönderir |
| `check_approval_status` | Onay durumunu sorgular |
| `publish_to_wordpress` | İçeriği WordPress'e yayınlar / taslak kaydeder |
| `list_pending_posts` | Bekleyen yazıları listeler |

---

## 🛠️ Kurulum Adımları

### 1. Projeyi Klonla ve Bağımlılıkları Yükle
```bash
git clone {GITHUB_LINK}
cd wp-seo-mcp
npm install
```

### 2. Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env
# .env içindeki değerleri doldurun
```

```bash
WP_SITE_URL=https://siteniz.com
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
OPENAI_API_KEY=sk-...
GMAIL_USER=ornek@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
APPROVAL_BASE_URL=https://siteniz.com
APPROVAL_PORT=3001
```

### 3. WordPress Application Password
WP Admin → **Users → Profile → Application Passwords** → "wp-seo-mcp" adıyla oluştur, çıkan şifreyi `WP_APP_PASSWORD`'e yaz. REST API testi: `https://siteniz.com/wp-json/wp/v2/posts`

### 4. Gmail App Password
Gmail → Hesap → Güvenlik → 2 Adımlı Doğrulama **açık** → Uygulama Şifreleri → 16 haneli şifreyi `GMAIL_APP_PASSWORD`'e yaz.

---

## ▶️ Çalıştırma / Kullanım Talimatları

### MCP Sunucusu
```bash
node src/index.js
```

### Onay Sunucusu (ayrı terminal)
```bash
node approval-server.js
# veya arka planda:
pm2 start approval-server.js --name wp-approval
```

### Claude Desktop Bağlantısı
`%APPDATA%\Claude\claude_desktop_config.json` içine ekleyin:
```json
{
  "mcpServers": {
    "wp-seo-mcp": {
      "command": "node",
      "args": ["C:/path/to/wp-seo-mcp/src/index.js"],
      "env": {
        "WP_SITE_URL": "https://siteniz.com",
        "WP_USERNAME": "admin",
        "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx",
        "OPENAI_API_KEY": "sk-...",
        "GMAIL_USER": "ornek@gmail.com",
        "GMAIL_APP_PASSWORD": "xxxx xxxx xxxx xxxx",
        "APPROVAL_BASE_URL": "https://siteniz.com",
        "APPROVAL_PORT": "3001"
      }
    }
  }
}
```

### Örnek Kullanım Akışı
Claude'a şu komut verilir:
```
"car wrap renk değişimi hakkında Türkçe bir blog yaz,
SEO analizi yap, görsel oluştur ve onay maili gönder"
```
Sistem sırasıyla: `generate_blog_post` → `analyze_seo` → `generate_image` → `send_approval_email` → (mailden onay) → `publish_to_wordpress` adımlarını otomatik yürütür.

---

## 🖼️ Ekran Görüntüleri

> Ekran görüntüleri repodaki `docs/screenshots/` klasöründe yer almaktadır.

- `01-claude-command.png` — Claude'a verilen komut ve araç çağrıları
- `02-approval-email.png` — Gmail'e gelen onay maili
- `03-wordpress-post.png` — WordPress'te yayınlanan yazı ve öne çıkan görsel

---

## 🔗 GitHub Proje Bağlantısı

{GITHUB_LINK}

---

## 📚 Kaynakça / Yararlanılan Bağlantılar

- Model Context Protocol — https://modelcontextprotocol.io/
- OpenAI API (GPT-4o, DALL-E 3) — https://platform.openai.com/docs/
- WordPress REST API Handbook — https://developer.wordpress.org/rest-api/
- Nodemailer — https://nodemailer.com/
- Express — https://expressjs.com/

---

**Not:** Bu proje eğitim amaçlı geliştirilmiştir. API anahtarları ve şifreler `.env` dosyasında tutulur ve repoya dahil edilmez (`.gitignore`).
