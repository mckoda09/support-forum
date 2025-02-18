import { Bot } from "grammy";
import { getTopicByUser, getUserByTopic, resetTopic } from "./db/topics.ts";

export const groupId = Number(Deno.env.get("GROUP_ID")!);

export const kv = await Deno.openKv();
export const bot = new Bot(Deno.env.get("BOT_TOKEN")!);

bot.chatType("private").command("start", async (c) => {
  await c.replyWithSticker("CAACAgIAAxkBAAEN1PNntCwsfN50bB74ZPhvIsdVakn7OgACAQEAAladvQoivp8OuMLmNDYE");

  const userId = c.from.id;
  const fullName = [c.from.first_name, c.from.last_name].join(" ");
  const username = c.from.username ? `@${c.from.username}` : "нет юза";
  const topic = await getTopicByUser(userId);
  await c.api.sendMessage(groupId, `<b>start</b>\n${userId}\n${fullName}\n${username}`, { message_thread_id: topic, parse_mode: "HTML" });

  await c.reply("<b>Привет!</b>\nМы внимательно тебя слушаем.\n\nОтвечаем не сразу, дождись ответа.", { parse_mode: "HTML" });
});

bot.chatType("private").on("msg", async (c) => {
  const topicId = await getTopicByUser(c.from.id);
  if (!topicId) return await c.reply("Произошла ошибка! Нажми /start");
  try {
    await c.copyMessage(groupId, { message_thread_id: topicId });
  } catch {
    const topic = await resetTopic(c.from.id);
    const userId = c.from.id;
    const fullName = [c.from.first_name, c.from.last_name].join(" ");
    const username = c.from.username ? `@${c.from.username}` : "нет юза";
    await c.api.sendMessage(groupId, `<b>start</b>\n${userId}\n${fullName}\n${username}`, { message_thread_id: topic, parse_mode: "HTML" });
    await c.copyMessage(groupId, { message_thread_id: topic });
  }
});

bot
  .chatType("supergroup")
  .filter(c => c.chatId == groupId)
  .filter(c => c.msg?.message_thread_id != 1)
  .filter(c => c.msg?.text ? (c.msg?.text.startsWith("!") ? false : true) : true)
  .on("msg", async (c) => {
    const userId = await getUserByTopic(c.msg.message_thread_id!);
    if (!userId) return await c.react("👻");

    try {
      await c.copyMessage(userId);
      await c.react("👍");
    } catch {
      await c.react("🤷‍♂");
    }
  });

bot.catch(e => console.error(e.error));