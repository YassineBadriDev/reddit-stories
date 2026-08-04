import type { APIRoute } from "astro";
import { sendEmail } from "@/lib/newsletter/send";
import { config } from "@/lib/config";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim().slice(0, 120) ?? "";
  const message = body.message?.trim().slice(0, 4000) ?? "";

  if (!EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (message.length < 10) {
    return json({ error: "Please write a message (at least 10 characters)." }, 400);
  }

  const subject = `New contact message from ${name || email}`;
  const text = `From: ${name || "Anonymous"} <${email}>\n\n${message}`;
  const html = `<p><b>From:</b> ${name || "Anonymous"} &lt;${email}&gt;</p><hr/><p style="white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;

  try {
    await sendEmail({ to: config.contactEmail, subject, text, html });
    return json({ ok: true });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      502
    );
  }
};
