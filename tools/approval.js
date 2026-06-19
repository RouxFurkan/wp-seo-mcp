import nodemailer from "nodemailer";
import crypto from "crypto";
import { config } from "../src/config.js";
import { getPendingPost, updatePostStatus, getAllPosts } from "./generateBlog.js";

// ─── Mail Transporter ─────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.gmailUser,
    pass: config.email.gmailAppPassword, // Gmail App Password (2FA gerekli)
  },
});

// ─── Token Store (production'da Redis/DB kullanın) ────────────────────────────

const tokenStore = new Map();

function generateToken(post_id) {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, {
    post_id,
    expires: Date.now() + config.approval.tokenExpiry,
  });
  return token;
}

export function validateToken(token) {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    tokenStore.delete(token);
    return null;
  }
  return entry.post_id;
}

// ─── Send Approval Email ──────────────────────────────────────────────────────

export async function sendApprovalEmail(args) {
  const { post_id, title, summary, preview_url = "" } = args;

  const approveToken = generateToken(`${post_id}:approve`);
  const rejectToken = generateToken(`${post_id}:reject`);

  const approveUrl = `${config.approval.baseUrl}/approval?token=${approveToken}&action=approve`;
  const rejectUrl = `${config.approval.baseUrl}/approval?token=${rejectToken}&action=reject`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .container { background: white; border-radius: 8px; padding: 32px; margin: 20px; }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 8px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    .summary { background: #f8f9fa; border-left: 4px solid #4CAF50; padding: 16px; border-radius: 4px; margin: 20px 0; }
    .buttons { display: flex; gap: 12px; margin-top: 24px; }
    .btn { display: inline-block; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .btn-approve { background: #4CAF50; color: white; }
    .btn-reject { background: #f44336; color: white; }
    .btn-preview { background: #2196F3; color: white; }
    .footer { color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📝 Yeni Blog Yazısı Onay Bekliyor</h1>
    <div class="meta">Post ID: ${post_id} | ${new Date().toLocaleString("tr-TR")}</div>
    
    <h2>${title}</h2>
    
    <div class="summary">
      <strong>Özet:</strong><br>
      ${summary}
    </div>

    ${preview_url ? `<p><a href="${preview_url}" class="btn btn-preview">👁️ Önizle</a></p>` : ""}

    <p><strong>Bu yazıyı yayınlamak istiyor musunuz?</strong></p>
    
    <div class="buttons">
      <a href="${approveUrl}" class="btn btn-approve">✅ Onayla ve Yayınla</a>
      <a href="${rejectUrl}" class="btn btn-reject">❌ Reddet</a>
    </div>

    <div class="footer">
      Bu link 7 gün geçerlidir. Galaxy Design / WP SEO Otomasyon Sistemi
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"WP SEO Bot 🤖" <${config.email.from}>`,
    to: config.email.to,
    subject: `📝 Blog Onay: ${title}`,
    html,
  });

  await updatePostStatus(post_id, "pending_approval");

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          message: `✅ Onay e-postası gönderildi: ${config.email.to}`,
          post_id,
          approve_url: approveUrl,
          reject_url: rejectUrl,
          note: "E-postadaki butonlara tıklayarak yazıyı onaylayabilir veya reddedebilirsiniz.",
        }, null, 2),
      },
    ],
  };
}

// ─── Check Approval Status ────────────────────────────────────────────────────

export async function checkApprovalStatus(args) {
  const { post_id } = args;
  const post = await getPendingPost(post_id);

  if (!post) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: "Post bulunamadı", post_id }) }],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          post_id,
          title: post.title,
          status: post.status,
          created_at: post.created_at,
          message: statusMessage(post.status),
        }, null, 2),
      },
    ],
  };
}

function statusMessage(status) {
  const map = {
    pending_approval: "⏳ Onay bekleniyor",
    approved: "✅ Onaylandı - WordPress'e yayınlanabilir",
    rejected: "❌ Reddedildi",
    published: "🚀 Yayınlandı",
    draft: "📄 Taslak",
  };
  return map[status] || status;
}
