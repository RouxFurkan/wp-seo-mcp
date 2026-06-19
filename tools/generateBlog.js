import OpenAI from "openai";
import { config } from "../src/config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateBlogPost(args) {
  const { topic, language = "en", word_count = 800, tone = "informative" } = args;

  const langLabel = language === "tr" ? "Türkçe" : "English";
  const toneMap = {
    professional: "professional and authoritative",
    casual: "friendly and conversational",
    informative: "clear, educational and informative",
  };

  const systemPrompt = `You are an expert SEO content writer. 
Write high-quality blog posts optimized for search engines.
Always respond in ${langLabel}.
Tone: ${toneMap[tone]}.`;

  const userPrompt = `Write a complete SEO-optimized blog post about: "${topic}"

Requirements:
- Target word count: ~${word_count} words
- Include proper H1, H2, H3 headings (use markdown)
- Natural keyword usage throughout
- Engaging introduction and strong conclusion
- Include a FAQ section at the end (3-5 questions)

Respond ONLY with valid JSON in this exact format:
{
  "title": "SEO-optimized title (50-60 chars)",
  "slug": "url-friendly-slug",
  "meta_description": "150-160 char meta description",
  "focus_keyword": "main target keyword",
  "content_markdown": "full blog post in markdown",
  "content_html": "full blog post converted to HTML",
  "estimated_read_time": "X min read",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "A detailed DALL-E prompt for a featured image for this blog post"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Unique post ID oluştur
  result.post_id = `post_${Date.now()}`;
  result.status = "pending_approval";
  result.created_at = new Date().toISOString();
  result.topic = topic;

  // Geçici olarak sakla (production'da DB kullanın)
  await savePendingPost(result);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            post_id: result.post_id,
            title: result.title,
            slug: result.slug,
            meta_description: result.meta_description,
            focus_keyword: result.focus_keyword,
            estimated_read_time: result.estimated_read_time,
            suggested_tags: result.suggested_tags,
            image_prompt: result.image_prompt,
            preview_content: result.content_markdown.substring(0, 500) + "...",
            message: `✅ Blog yazısı oluşturuldu! Post ID: ${result.post_id}. Görseli oluşturup onay e-postası gönderebilirsiniz.`,
          },
          null,
          2
        ),
      },
    ],
  };
}

// ─── Pending Posts Storage (JSON file - production'da DB kullanın) ────────────

import fs from "fs/promises";
import path from "path";

const STORAGE_FILE = path.join(process.cwd(), "data", "pending_posts.json");

export async function savePendingPost(post) {
  await fs.mkdir(path.dirname(STORAGE_FILE), { recursive: true });
  let posts = [];
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf-8");
    posts = JSON.parse(raw);
  } catch {}
  posts.push(post);
  await fs.writeFile(STORAGE_FILE, JSON.stringify(posts, null, 2));
}

export async function getPendingPost(post_id) {
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf-8");
    const posts = JSON.parse(raw);
    return posts.find((p) => p.post_id === post_id);
  } catch {
    return null;
  }
}

export async function updatePostStatus(post_id, status) {
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf-8");
    let posts = JSON.parse(raw);
    posts = posts.map((p) => (p.post_id === post_id ? { ...p, status } : p));
    await fs.writeFile(STORAGE_FILE, JSON.stringify(posts, null, 2));
  } catch {}
}

export async function getAllPosts() {
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
