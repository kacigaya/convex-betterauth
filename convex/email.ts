const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export type SendResendEmailOptions = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  fetchImpl?: typeof fetch;
};

export async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  text,
  fetchImpl = fetch,
}: SendResendEmailOptions): Promise<void> {
  let response: Response;

  try {
    response = await fetchImpl(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "convex-betterauth",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
  } catch {
    throw new Error("Resend email request failed");
  }

  try {
    await response.body?.cancel();
  } catch {
    // Response cleanup must not hide the provider's delivery status.
  }

  if (!response.ok) {
    throw new Error(`Resend email request failed with status ${response.status}`);
  }
}
