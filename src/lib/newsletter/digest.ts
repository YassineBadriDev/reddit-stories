import { fetchStories } from "@/lib/scraper";
import type { Story } from "@/lib/scraper/types";
import { config } from "@/lib/config";
import { listSubscribers } from "./store";
import { sendEmail } from "./send";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function digestHtml(stories: Story[], date: Date): string {
  const items = stories
    .slice(0, 10)
    .map(
      (story, index) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #eee;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;">
            ${index + 1} &middot; r/${esc(story.subreddit)} &middot; ${story.score.toLocaleString()} upvotes &middot; ${story.comments.toLocaleString()} comments
          </p>
          <h2 style="margin:0 0 8px;font-size:18px;line-height:1.4;font-family:Georgia,serif;">
            <a href="${story.url}" style="color:#2b2320;text-decoration:none;">${esc(story.title)}</a>
          </h2>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#555;">${esc(
            story.excerpt
          )}</p>
          <a href="${story.url}" style="color:#d4a017;font-size:13px;text-decoration:none;">Read the full reddit story &rarr;</a>
        </td>
      </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#faf6ef;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;background:#2b2320;">
              <h1 style="margin:0;color:#faf6ef;font-family:Georgia,serif;font-size:24px;">${esc(
                config.siteName
              )}</h1>
              <p style="margin:4px 0 0;color:#d4a017;font-size:13px;">The latest reddit stories, ${date.toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" }
              )}</p>
            </tr>
          </tr>
          <tr>
            <td style="padding:8px 32px;">${items}</td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;font-size:12px;color:#999;">
              <p style="margin:0 0 8px;">You are receiving this because you subscribed at ${esc(
                config.siteUrl
              )}.</p>
              <a href="${config.siteUrl}/unsubscribe?email=%EMAIL%" style="color:#d4a017;text-decoration:none;">Unsubscribe from reddit stories</a>
              <p style="margin:12px 0 0;">Not affiliated with Reddit Inc. Stories belong to their authors.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function digestText(stories: Story[], date: Date): string {
  const lines = stories
    .slice(0, 10)
    .map(
      (story, i) =>
        `${i + 1}. ${story.title}\nr/${story.subreddit} · ${story.score} upvotes\n${story.excerpt}\n${story.url}`
    );
  return `${config.siteName} — ${date.toLocaleDateString("en-US")}\n\n${lines.join(
    "\n\n"
  )}\n\nUnsubscribe: ${config.siteUrl}/unsubscribe`;
}

export async function sendDigest(): Promise<{ sent: number; stories: number }> {
  const subscribers = await listSubscribers();
  if (subscribers.length === 0) {
    return { sent: 0, stories: 0 };
  }
  const stories = await fetchStories();
  if (stories.length === 0) {
    return { sent: 0, stories: 0 };
  }
  const date = new Date();
  for (const subscriber of subscribers) {
    await sendEmail({
      to: subscriber.email,
      subject: `Latest reddit stories — ${date.toLocaleDateString("en-US")}`,
      html: digestHtml(stories, date).replaceAll(
        "%EMAIL%",
        encodeURIComponent(subscriber.email)
      ),
      text: digestText(stories, date),
    });
  }
  return { sent: subscribers.length, stories: stories.length };
}
