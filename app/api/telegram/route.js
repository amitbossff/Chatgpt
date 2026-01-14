import OpenAI from "openai";
import { getHistory, addMessage, resetHistory } from "../../../lib/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const msg = body.message;
    if (!msg?.text) return Response.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // Commands
    if (text === "/start") {
      return send(chatId,
        "🤖 *Welcome!*\n\nMain AI bot hoon.\nHindi ya English me sawaal pooch sakte ho.\n\nCommands:\n/help\n/reset"
      );
    }

    if (text === "/help") {
      return send(chatId,
        "🆘 *Help*\n\n• Normal question likho\n• Coding, study, chat sab supported\n• /reset se memory clear"
      );
    }

    if (text === "/reset") {
      resetHistory(chatId);
      return send(chatId, "✅ Memory reset ho gayi.");
    }

    // AI Chat
    const history = getHistory(chatId);

    const messages = [
      {
        role: "system",
        content:
          "Tum ek smart, polite aur helpful AI assistant ho. Hinglish/Hindi prefer karo."
      },
      ...history,
      { role: "user", content: text }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const reply = completion.choices[0].message.content;

    addMessage(chatId, "user", text);
    addMessage(chatId, "assistant", reply);

    return send(chatId, reply);

  } catch (err) {
    console.error(err);
    return Response.json({ ok: true });
  }
}

// Send message to Telegram
async function send(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    }
  );

  return Response.json({ ok: true });
    }
