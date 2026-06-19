import "dotenv/config";
/**
 * approval-server.js
 * 
 * E-postadaki "Onayla" / "Reddet" butonlarını handle eden küçük HTTP server.
 * MCP server ile ayrı çalışır. `node approval-server.js` ile başlatın.
 * 
 * IIS'de reverse proxy ile dışarıya açılabilir:
 * yoursite.com/approval → localhost:3001/approval
 */

import express from "express";
import { validateToken } from "./tools/approval.js";
import { updatePostStatus, getPendingPost } from "./tools/generateBlog.js";
import { config } from "./src/config.js";
import { publishToWordPress } from "./tools/wordpress.js";

const app = express();

app.get("/approval", async (req, res) => {
  const { token, action } = req.query;

  if (!token || !["approve", "reject"].includes(action)) {
    return res.status(400).send(renderPage("❌ Geçersiz İstek", "Token veya eylem geçersiz.", "error"));
  }

  const tokenKey = validateToken(token);
  if (!tokenKey) {
    return res.status(400).send(renderPage("⏰ Token Süresi Dolmuş", "Bu link artık geçerli değil.", "error"));
  }

  const [post_id, expectedAction] = tokenKey.split(":");

  if (expectedAction !== action) {
    return res.status(400).send(renderPage("❌ Hata", "Geçersiz işlem.", "error"));
  }

  const post = await getPendingPost(post_id);
  if (!post) {
    return res.status(404).send(renderPage("❌ Bulunamadı", "Blog yazısı bulunamadı.", "error"));
  }

  if (post.status === "published") {
    return res.send(renderPage("ℹ️ Zaten Yayınlandı", `"${post.title}" zaten yayınlandı.`, "info"));
  }

  if (action === "approve") {
    // WordPress'e yayınla
    try {
      await publishToWordPress({
        title: post.title,
        content: post.content_html,
        meta_description: post.meta_description,
        slug: post.slug,
        status: "publish",
        tags: post.suggested_tags || [],
      });
      await updatePostStatus(post_id, "published");
      return res.send(renderPage(
        "✅ Yayınlandı!",
        `"${post.title}" başarıyla WordPress'e yayınlandı.`,
        "success"
      ));
    } catch (err) {
      return res.status(500).send(renderPage("❌ Hata", `Yayınlama başarısız: ${err.message}`, "error"));
    }
  }

  if (action === "reject") {
    await updatePostStatus(post_id, "rejected");
    return res.send(renderPage(
      "❌ Reddedildi",
      `"${post.title}" reddedildi ve yayınlanmayacak.`,
      "reject"
    ));
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

function renderPage(title, message, type) {
  const colors = {
    success: "#4CAF50",
    error: "#f44336",
    reject: "#FF9800",
    info: "#2196F3",
  };
  const color = colors[type] || "#666";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 48px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.1); max-width: 480px; }
    h1 { color: ${color}; font-size: 28px; }
    p { color: #555; font-size: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

const PORT = config.approvalServerPort;
app.listen(PORT, () => {
  console.log(`✅ Approval Server çalışıyor: http://localhost:${PORT}`);
});
