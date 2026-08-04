import { gotScraping } from "got-scraping";
import { Resend } from "resend";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const env = process.env;
const siteUrl = (env.SITE_URL ?? "http://localhost:4321").replace(/\/$/, "");
const dataDir = env.DATA_DIR ?? join(process.cwd(), "data");
const subreddits = (env.SUBREDDITS ?? "stories,RedditStoryTime,nosleep")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const sort = env.DEFAULT_SORT ?? "top";
const limit = Number(env.DEFAULT_LIMIT ?? "25");
const userAgent =
  env.REDDIT_USER_AGENT ?? "redditstories.org/0.1 by redditstories.org";

function slugify(title) {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "story";
}

function excerpt(text, max = 220) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchStories() {
  const results = await Promise.allSettled(
    subreddits.map(async (sub) => {
      const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/${sort}.json?limit=${limit}&raw_json=1`;
      const { body } = await gotScraping(url, {
        responseType: "json",
        resolveBodyOnly: false,
        timeout: { request: 20000 },
        headers: {
          "user-agent": userAgent,
          accept: "application/json, text/plain, */*",
        },
      });
      const children = body?.data?.children ?? [];
      return children
        .map((child) => child.data)
        .filter(
          (post) =>
            post.is_self &&
            !post.over_18 &&
            !post.stickied &&
            !post.removed_by_category &&
            post.selftext?.trim().length >= 20 &&
            post.author !== "[deleted]"
        )
        .map((post) => ({
          id: post.id,
          title: post.title.trim(),
          excerpt: excerpt(post.selftext),
          subreddit: post.subreddit,
          score: post.score,
          comments: post.num_comments,
          url: `${siteUrl}/story/${post.id}/${slugify(post.title)}`,
        }));
    })
  );
  const stories = [];
  for (const result of results) {
    if (result.status === "fulfilled") stories.push(...result.value);
  }
  const seen = new Set();
  return stories
    .sort((a, b) => b.score - a.score)
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
    .slice(0, 10);
}

async function loadSubscribers() {
  try {
    const raw = await readFile(join(dataDir, "subscribers.json"), "utf8");
    return JSON.parse(raw).filter((s) => s.subscribed);
  } catch {
    return [];
  }
}

function buildHtml(stories, date) {
  const items = stories
    .map(
      (story, i) => `
      <tr><td style="padding:16px 0;border-bottom:1px solid #eee;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;">${i + 1} &middot; r/${esc(story.subreddit)} &middot; ${story.score.toLocaleString()} upvotes &middot; ${story.comments.toLocaleString()} comments</p>
        <h2 style="margin:0 0 8px;font-size:18px;line-height:1.4;font-family:Georgia,serif;"><a href="${story.url}" style="color:#2b2320;text-decoration:none;">${esc(story.title)}</a></h2>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#555;">${esc(story.excerpt)}</p>
        <a href="${story.url}" style="color:#d4a017;font-size:13px;text-decoration:none;">Read the full reddit story &rarr;</a>
      </td></tr>`
    )
    .join("\n");
  return `<!DOCTYPE html><html lang="en"><body style="margin:0;background:#faf6ef;padding:24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:24px 32px;background:#2b2320;">
            <h1 style="margin:0;color:#faf6ef;font-family:Georgia,serif;font-size:24px;">Reddit Stories</h1>
            <p style="margin:4px 0 0;color:#d4a017;font-size:13px;">The latest reddit stories, ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </td></tr>
          <tr><td style="padding:8px 32px;">${items}</td></tr>
          <tr><td style="padding:24px 32px;text-align:center;font-size:12px;color:#999;">
            <p style="margin:0 0 8px;">You are receiving this because you subscribed at ${siteUrl}.</p>
            <a href="${siteUrl}/unsubscribe?email=%EMAIL%" style="color:#d4a017;text-decoration:none;">Unsubscribe from reddit stories</a>
            <p style="margin:12px 0 0;">Not affiliated with Reddit Inc. Stories belong to their authors.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function buildText(stories) {
  return stories
    .map((s, i) => `${i + 1}. ${s.title}\nr/${s.subreddit} · ${s.score} upvotes\n${s.excerpt}\n${s.url}`)
    .join("\n\n");
}

async function main() {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set.");
    process.exit(1);
  }
  const subscribers = await loadSubscribers();
  if (subscribers.length === 0) {
    console.log("No subscribers.");
    return;
  }
  const stories = await fetchStories();
  if (stories.length === 0) {
    console.log("No stories to send.");
    return;
  }

  const date = new Date();
  const resend = new Resend(apiKey);
  const from = env.NEWSLETTER_FROM ?? "Reddit Stories <stories@redditstories.org>";
  const subject = `Latest reddit stories — ${date.toLocaleDateString("en-US")}`;
  const html = buildHtml(stories, date);
  const text = buildText(stories);

  let sent = 0;
  for (const subscriber of subscribers) {
    const { error } = await resend.emails.send({
      from,
      to: subscriber.email,
      subject,
      html: html.replaceAll("%EMAIL%", encodeURIComponent(subscriber.email)),
      text,
    });
    if (error) {
      console.error(`Failed ${subscriber.email}: ${error.message}`);
    } else {
      sent += 1;
    }
  }
  console.log(`Sent digest to ${sent}/${subscribers.length} subscribers (${stories.length} stories).`);
}

await mkdir(dataDir, { recursive: true });
await main();
