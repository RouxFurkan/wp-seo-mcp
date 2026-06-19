import { config } from "../src/config.js";
import fetch from "node-fetch";

const { siteUrl, username, appPassword } = config.wordpress;

const authHeader =
  "Basic " + Buffer.from(`${username}:${appPassword}`).toString("base64");

const wpApi = `${siteUrl}/wp-json/wp/v2`;

// ─── Yardımcı: Kategori ID al veya oluştur ────────────────────────────────────

async function getCategoryIds(names = []) {
  if (!names.length) return [];
  const ids = [];
  for (const name of names) {
    // Ara
    const res = await fetch(`${wpApi}/categories?search=${encodeURIComponent(name)}`, {
      headers: { Authorization: authHeader },
    });
    const cats = await res.json();
    if (cats.length) {
      ids.push(cats[0].id);
    } else {
      // Oluştur
      const create = await fetch(`${wpApi}/categories`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newCat = await create.json();
      if (newCat.id) ids.push(newCat.id);
    }
  }
  return ids;
}

// ─── Yardımcı: Tag ID al veya oluştur ────────────────────────────────────────

async function getTagIds(names = []) {
  if (!names.length) return [];
  const ids = [];
  for (const name of names) {
    const res = await fetch(`${wpApi}/tags?search=${encodeURIComponent(name)}`, {
      headers: { Authorization: authHeader },
    });
    const tags = await res.json();
    if (tags.length) {
      ids.push(tags[0].id);
    } else {
      const create = await fetch(`${wpApi}/tags`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newTag = await create.json();
      if (newTag.id) ids.push(newTag.id);
    }
  }
  return ids;
}

// ─── Yardımcı: Görseli WP Media Library'e yükle ──────────────────────────────

async function uploadFeaturedImage(imageUrl, title) {
  try {
    // Görseli indir
    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.buffer();
    const filename = `${title.toLowerCase().replace(/\s+/g, "-")}.jpg`;

    const uploadRes = await fetch(`${wpApi}/media`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "image/jpeg",
      },
      body: buffer,
    });
    const media = await uploadRes.json();
    return media.id || null;
  } catch {
    return null;
  }
}

// ─── Ana Fonksiyon: WordPress'e Gönder ───────────────────────────────────────

export async function publishToWordPress(args) {
  const {
    title,
    content,
    meta_description = "",
    slug = "",
    status = "draft",
    featured_image_url = null,
    categories = [],
    tags = [],
  } = args;

  // Kategori ve tag ID'lerini al
  const categoryIds = await getCategoryIds(categories);
  const tagIds = await getTagIds(tags);

  // Görseli yükle
  let featuredMediaId = null;
  if (featured_image_url) {
    featuredMediaId = await uploadFeaturedImage(featured_image_url, title);
  }

  // Post oluştur
  const postBody = {
    title,
    content,
    status,
    slug: slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    categories: categoryIds,
    tags: tagIds,
    ...(featuredMediaId && { featured_media: featuredMediaId }),
    // Yoast SEO veya RankMath meta
    meta: {
      _yoast_wpseo_metadesc: meta_description,
      rank_math_description: meta_description,
    },
  };

  const res = await fetch(`${wpApi}/posts`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postBody),
  });

  const post = await res.json();

  if (!post.id) {
    throw new Error(`WordPress hatası: ${JSON.stringify(post)}`);
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            post_id: post.id,
            status: post.status,
            title: post.title?.rendered,
            url: post.link,
            edit_url: `${siteUrl}/wp-admin/post.php?post=${post.id}&action=edit`,
            message: `✅ WordPress'e ${status === "publish" ? "yayınlandı" : "taslak olarak kaydedildi"}! ${post.link}`,
          },
          null,
          2
        ),
      },
    ],
  };
}
