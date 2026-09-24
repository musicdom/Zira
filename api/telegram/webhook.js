const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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
      "Привет! ✨\n\n" +
      "Добро пожаловать в Kildisheva_food 🥑\n\n" +
      "Здесь собраны готовые идеи питания для тех, кто устал каждый день думать: «Что сегодня приготовить?»\n\n" +
      "🥗 Завтраки, обеды, ужины и перекусы\n" +
      "🍽️ Готовое БЖУ для каждого блюда\n" +
      "🤎 Разнообразное питание без сложностей и вечного стояния у плиты\n\n" +
      "Всё уже придумано за тебя — остаётся только выбрать, что хочется сегодня 💫",
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
            "🔐 ДОСТУП К МЕНЮ\n\n" +
            "60 готовых блюд: 20 завтраков, 20 обедов и 20 ужинов.\n\n" +
            "Стоимость доступа — 1 490 ₽.",
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(200).json({ ok: true });
  }
}
