import { Resend } from "resend";
import { config } from "@/lib/config";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    if (!config.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    client = new Resend(config.resendApiKey);
  }
  return client;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { error } = await getClient().emails.send({
    from: config.newsletterFrom,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

export async function addContactToAudience(email: string): Promise<void> {
  if (!config.resendAudienceId) return;
  const { error } = await getClient().contacts.create({
    email,
    audienceId: config.resendAudienceId,
  });
  if (error) {
    throw new Error(`Resend contact create failed: ${error.message}`);
  }
}
