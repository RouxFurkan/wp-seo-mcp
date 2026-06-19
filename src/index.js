#!/usr/bin/env node
import "dotenv/config";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { generateBlogPost } from "../tools/generateBlog.js";
import { generateImage } from "../tools/generateImage.js";
import { publishToWordPress } from "../tools/wordpress.js";
import { sendApprovalEmail, checkApprovalStatus } from "../tools/approval.js";
import { analyzeSEO } from "../tools/seoAnalyze.js";
import { listPendingPosts } from "../tools/listPosts.js";

const server = new Server(
  { name: "wp-seo-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ─── Tool Definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_blog_post",
      description:
        "Verilen konuya göre SEO uyumlu bir blog yazısı üretir. Başlık, meta description, slug ve içerik döner.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Blog konusu veya anahtar kelime" },
          language: { type: "string", enum: ["tr", "en"], default: "en" },
          word_count: { type: "number", default: 800, description: "Tahmini kelime sayısı" },
          tone: { type: "string", enum: ["professional", "casual", "informative"], default: "informative" },
        },
        required: ["topic"],
      },
    },
    {
      name: "generate_image",
      description: "Blog için DALL-E 3 ile AI görsel oluşturur.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Görsel için açıklama / prompt" },
          style: { type: "string", enum: ["realistic", "illustrative", "minimalist"], default: "realistic" },
        },
        required: ["prompt"],
      },
    },
    {
      name: "analyze_seo",
      description: "Blog içeriğini SEO açısından analiz eder. Skor, öneriler ve anahtar kelime yoğunluğu döner.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Blog içeriği (HTML veya plain text)" },
          target_keyword: { type: "string", description: "Hedef anahtar kelime" },
        },
        required: ["content", "target_keyword"],
      },
    },
    {
      name: "send_approval_email",
      description: "Blog taslağını onay için e-posta ile gönderir. Onay linki içerir.",
      inputSchema: {
        type: "object",
        properties: {
          post_id: { type: "string", description: "Taslak post ID'si" },
          title: { type: "string" },
          summary: { type: "string", description: "Blog özetini içeren kısa açıklama" },
          preview_url: { type: "string", description: "WordPress taslak önizleme URL'si" },
        },
        required: ["post_id", "title", "summary"],
      },
    },
    {
      name: "check_approval_status",
      description: "Bir blog taslağının onay durumunu kontrol eder.",
      inputSchema: {
        type: "object",
        properties: {
          post_id: { type: "string" },
        },
        required: ["post_id"],
      },
    },
    {
      name: "publish_to_wordpress",
      description: "Onaylanmış blog yazısını WordPress'e yayınlar veya taslak olarak kaydeder.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string", description: "HTML formatında blog içeriği" },
          meta_description: { type: "string" },
          slug: { type: "string" },
          status: { type: "string", enum: ["draft", "publish"], default: "draft" },
          featured_image_url: { type: "string", description: "Görsel URL'si (opsiyonel)" },
          categories: { type: "array", items: { type: "string" }, description: "Kategori adları" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "list_pending_posts",
      description: "Onay bekleyen veya taslak haldeki blog yazılarını listeler.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "draft", "all"], default: "all" },
        },
      },
    },
  ],
}));

// ─── Tool Handlers ───────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_blog_post":
        return await generateBlogPost(args);
      case "generate_image":
        return await generateImage(args);
      case "analyze_seo":
        return await analyzeSEO(args);
      case "send_approval_email":
        return await sendApprovalEmail(args);
      case "check_approval_status":
        return await checkApprovalStatus(args);
      case "publish_to_wordpress":
        return await publishToWordPress(args);
      case "list_pending_posts":
        return await listPendingPosts(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `❌ Hata: ${err.message}` }],
      isError: true,
    };
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ WP SEO MCP Server başlatıldı.");
