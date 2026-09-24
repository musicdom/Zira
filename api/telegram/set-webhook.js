const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (!BOT_TOKEN) {
    return res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" });
  }

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;

  if (!baseUrl) {
    return res.status(500).json({ ok: false, error: "Vercel URL is not available" });
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  });

  const data = await response.json();
  return res.status(response.ok ? 200 : 500).json({ ...data, webhook_url: webhookUrl });
}
