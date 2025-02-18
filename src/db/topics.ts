import { bot, groupId, kv } from "../mod.ts";

const byTopicKey = (topicId: number) => ["byTopic", topicId];
const byUserKey = (userId: number) => ["byUser", userId];

export const getTopicByUser = async (userId: number) => {
  const existing = await kv.get<number>(byUserKey(userId));
  if (existing.versionstamp) return existing.value;

  const topic = await bot.api.createForumTopic(groupId, userId.toString());
  await kv.atomic()
    .set(byUserKey(userId), topic.message_thread_id)
    .set(byTopicKey(topic.message_thread_id), userId)
    .commit();
  return topic.message_thread_id;
};

export const getUserByTopic = async (topicId: number) => (await kv.get<number>(byTopicKey(topicId))).value;

export const resetTopic = async (userId: number) => {
  const topic = await bot.api.createForumTopic(groupId, userId.toString());
  await kv.atomic()
    .set(byUserKey(userId), topic.message_thread_id)
    .set(byTopicKey(topic.message_thread_id), userId)
    .commit();
  return topic.message_thread_id;
};