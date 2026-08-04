import type { APIRoute } from "astro";
import { addSubscriber } from "@/lib/newsletter/store";
import { addContactToAudience } from "@/lib/newsletter/send";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  await addSubscriber(email);

  try {
    await addContactToAudience(email);
  } catch {
    // audience sync is best-effort
  }

  return json({ ok: true });
};
