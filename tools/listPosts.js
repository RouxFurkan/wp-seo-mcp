import { getAllPosts } from "./generateBlog.js";

// ─── Bekleyen / Tüm Yazıları Listele ─────────────────────────────────────────
// MCP aracı: list_pending_posts
// status verilirse o duruma göre filtreler (ör. "pending", "approved", "published"),
// verilmezse tüm yazıları döner.

export async function listPendingPosts(args = {}) {
  const { status } = args;
  const posts = await getAllPosts();

  const filtered = status
    ? posts.filter((p) => p.status === status)
    : posts;

  const summary = filtered.map((p) => ({
    post_id: p.post_id,
    title: p.title,
    status: p.status,
    created_at: p.created_at,
  }));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            count: summary.length,
            filter: status || "all",
            posts: summary,
          },
          null,
          2
        ),
      },
    ],
  };
}
