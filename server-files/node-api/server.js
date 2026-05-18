const express = require("express");
const Tiktok = require("@tobyg74/tiktok-api-dl");
const { createClient } = require("redis");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3002;

// ── Load API key from .env file ─────────────────────────────────────────
let API_KEY = process.env.API_KEY || "";
const envPath = path.join(__dirname, "..", "tiktok-api", ".env");
if (!API_KEY && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  const match = content.match(/^API_KEY=(.+)$/m);
  if (match) API_KEY = match[1].trim();
}

// ── Redis ───────────────────────────────────────────────────────────────
let redis = null;
(async () => {
  try {
    redis = createClient({ socket: { host: "127.0.0.1", port: 6379 } });
    await redis.connect();
    console.log("[redis] Connected");
  } catch {
    console.warn("[redis] Not available — running without cache");
    redis = null;
  }
})();

// ── Express setup ───────────────────────────────────────────────────────
app.use(express.json());

// Auth middleware
app.use((req, res, next) => {
  const key = req.query.key || req.headers["x-api-key"] || "";
  if (!API_KEY || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ── GET / — fetch user posts ────────────────────────────────────────────
app.get("/", async (req, res) => {
  const username = String(req.query.username || "").replace(/^@/, "").trim();
  const limit = Math.min(parseInt(req.query.limit) || 30, 50);

  if (!username) {
    return res.status(400).json({ error: "Username diperlukan" });
  }

  const cacheKey = `tiktok:posts:${username}:${limit}`;

  // Try Redis cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }
    } catch {}
    res.setHeader("X-Cache", "MISS");
  }

  // Fetch from TikTok
  try {
    const data = await Promise.race([
      Tiktok.GetUserPosts(username, { postLimit: limit }),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Timeout 40s")), 40_000)
      ),
    ]);

    if (data?.status !== "success" || !Array.isArray(data?.result)) {
      return res
        .status(404)
        .json({ error: data?.message || "Username tidak ditemukan" });
    }

    const posts = data.result.map((p) => {
      const imgPost = p.imagePost;
      const v = p.video;
      const stats = p.stats || {};

      return {
        id: String(p.id || ""),
        desc: String(p.desc || ""),
        type: imgPost && imgPost.length > 0 ? "photo" : "video",
        thumbnail: String(
          v?.originCover || v?.cover || imgPost?.[0] || ""
        ),
        url: String(
          v?.downloadAddr || v?.playAddr || imgPost?.[0] || ""
        ),
        urls: imgPost || undefined,
        stats: {
          playCount: stats.playCount || 0,
          likeCount: stats.likeCount || 0,
          shareCount: stats.shareCount || 0,
          commentCount: stats.commentCount || 0,
        },
        createTime: Number(p.createTime) || 0,
      };
    });

    const result = {
      username,
      totalPosts: posts.length,
      posts,
    };

    // Cache in Redis (30 min)
    if (redis) {
      try {
        await redis.setEx(cacheKey, 1800, JSON.stringify(result));
      } catch {}
    }

    return res.json(result);
  } catch (err) {
    console.error("[tiktok-api]", err.message || err);
    return res.status(502).json({
      error: "Gagal menghubungi server TikTok. Coba lagi nanti.",
    });
  }
});

// ── Start ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[tiktok-api] Listening on port ${PORT}`);
});
