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
      await send(chatId,
        "🤖 *Welcome!*\n\nMain AI bot hoon.\nHindi ya English me sawaal pooch sakte ho.\n\nCommands:\n/help\n/reset"
      );
      return Response.json({ ok: true });
    }

    if (text === "/help") {
      await send(chatId,
        "🆘 *Help*\n\n• Normal question likho\n• Coding, study, chat sab supported\n• /reset se memory clear"
      );
      return Response.json({ ok: true });
    }

    if (text === "/reset") {
      resetHistory(chatId);
      await send(chatId, "✅ Memory reset ho gayi.");
      return Response.json({ ok: true });
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

    // 👇 LONG MESSAGE SAFE SEND
    await sendLongMessage(chatId, reply);

    return Response.json({ ok: true });

  } catch (err) {
    console.error("BOT ERROR:", err);
    return Response.json({ ok: true });
  }
}

// ========== HELPERS ==========

// Normal send
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
}

// Long message split send (Telegram 4096 limit)
async function sendLongMessage(chatId, text) {
  const MAX_LENGTH = 4000; // safe limit

  // Agar short hai to normal bhej do
  if (text.length <= MAX_LENGTH) {
    await send(chatId, text);
    return;
  }

  // Optional info message
  await send(chatId, "✍️ Reply thoda lamba hai, parts me bhej raha hoon...");

  for (let i = 0; i < text.length; i += MAX_LENGTH) {
    const chunk = text.substring(i, i + MAX_LENGTH);

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: "Markdown",
        }),
      }
    );
  }
}
