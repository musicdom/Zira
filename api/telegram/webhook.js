const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = "https://zira-lyart.vercel.app/";

async function telegram(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

function welcome() {
  return {
    text:
      "🥑 Kildisheva_food\n\n" +
      "Твой доступ к готовому меню питания на каждый день 🤎\n\n" +
      "🍳 20 завтраков\n" +
      "🍲 20 обедов\n" +
      "🥗 20 ужинов\n\n" +
      "Всего 60 готовых блюд с:\n" +
      "• калорийностью\n" +
      "• БЖУ\n" +
      "• граммовкой\n" +
      "• списком ингредиентов\n" +
      "• подробным приготовлением\n\n" +
      "Не нужно каждый день думать, что приготовить — просто открывай меню и выбирай блюдо ✨\n\n" +
      "💳 Стоимость доступа — 1 490 ₽\n\n" +
      "Нажми кнопку ниже, чтобы получить доступ к меню 👇",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔐 ПОЛУЧИТЬ ДОСТУП", callback_data: "buy_access" }],
      ],
    },
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "zira-telegram-webhook" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!BOT_TOKEN) {
    return res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" });
  }

  try {
    const update = req.body || {};
    const message = update.message;
    const callback = update.callback_query;

    if (message?.chat?.id) {
      const text = (message.text || "").trim().toLowerCase();

      if (text === "/start" || text === "start" || text === "старт" || text === "начать") {
        await telegram("sendMessage", {
          chat_id: message.chat.id,
          ...welcome(),
        });
      }
    }

    if (callback?.message?.chat?.id) {
      await telegram("answerCallbackQuery", { callback_query_id: callback.id });

      if (callback.data === "buy_access") {
        await telegram("sendMessage", {
          chat_id: callback.message.chat.id,
          text:
            "🎉 Оплата прошла!\n\n" +
            "Ваш доступ к материалам открыт.\n\n" +
            "Сейчас оплата отключена — это тестовый режим разработки.",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🍽 ОТКРЫТЬ МЕНЮ", web_app: { url: MINI_APP_URL } }],
            ],
          },
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(200).json({ ok: true });
  }
}
