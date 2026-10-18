import {
  Follow,
  IFollow,
  IUser,
  IUserTopicInterest,
  User,
  UserFeedPreferences,
  UserTopicInterest,
} from "./models.js";

export type TopicSignalType = "save" | "comment" | "search" | "like" | "hide" | "post";

const SIGNAL_WEIGHTS: Record<TopicSignalType, number> = {
  save: 0.8,
  comment: 0.6,
  search: 0.4,
  like: 0.25,
  hide: -1,
  post: 0.6,
};

const SIGNAL_DECAY_RATES: Record<TopicSignalType, number> = {
  save: 0.01,
  comment: 0.02,
  search: 0.08,
  like: 0.03,
  hide: 0.03,
  post: 0.02,
};

export function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase().slice(0, 80);
}

function topicInterestId(userId: string, topic: string): string {
  return `uti-${userId}-${Buffer.from(topic, "utf8").toString("hex")}`;
}

export async function recordTopicSignal(
  userId: string,
  rawTopic: string,
  signalType: TopicSignalType,
  eventId: string,
  occurredAt = new Date()
): Promise<void> {
  const topic = normalizeTopic(rawTopic);
  if (!topic || !eventId) return;

  if (await UserTopicInterest.exists({ userId, topic, "signals.eventId": eventId })) {
    return;
  }

  const weight = SIGNAL_WEIGHTS[signalType];
  await UserTopicInterest.findOneAndUpdate(
    { userId, topic },
    {
      $setOnInsert: {
        _id: topicInterestId(userId, topic),
        longTermWeight: 0,
      },
      $set: { lastInteractedAt: occurredAt },
      $inc: { shortTermWeight: weight },
      $addToSet: {
        signals: {
          eventId,
          signalType,
          weight,
          decayRate: SIGNAL_DECAY_RATES[signalType],
          occurredAt,
        },
      },
    },
    { upsert: true }
  );
}

export async function recordTopicFollow(
  userId: string,
  rawTopic: string,
  followed: boolean,
  occurredAt = new Date()
): Promise<void> {
  const topic = normalizeTopic(rawTopic);
  if (!topic) return;

  if (followed) {
    await UserTopicInterest.findOneAndUpdate(
      { userId, topic },
      {
        $setOnInsert: {
          _id: topicInterestId(userId, topic),
          shortTermWeight: 0,
        },
        $set: { lastInteractedAt: occurredAt },
        $max: { longTermWeight: 1 },
      },
      { upsert: true }
    );
    return;
  }

  const [user, remainingFollow] = await Promise.all([
    User.findById(userId).select("interests skills"),
    Follow.findOne({
      followerId: userId,
      targetType: "topic",
      targetId: { $regex: `^${escapeRegExp(topic)}$`, $options: "i" },
    }),
  ]);
  const remainsExplicit = [...(user?.interests || []), ...(user?.skills || [])].some(
    (item) => normalizeTopic(item) === topic
  );

  await UserTopicInterest.updateOne(
    { userId, topic },
    { $set: { longTermWeight: remainsExplicit || remainingFollow ? 1 : 0 } }
  );
  if (!remainsExplicit && !remainingFollow) {
    await UserTopicInterest.deleteOne({
      userId,
      topic,
      shortTermWeight: 0,
      signals: { $size: 0 },
    });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TopicMapEntry {
  topic: string;
  score: number;
  longTermWeight: number;
  shortTermWeight: number;
  lastActive: Date | null;
  muted: boolean;
  hasInferredSignals: boolean;
}

export async function getUserTopicMap(
  user: IUser,
  now = new Date(),
  existingFollows?: IFollow[],
  existingMutedTopicIds?: string[]
): Promise<{ topicMap: TopicMapEntry[]; mutedTopicIds: string[] }> {
  const [interests, follows, muted] = await Promise.all([
    UserTopicInterest.find({ userId: user._id }),
    existingFollows
      ? Promise.resolve(existingFollows.filter((follow) => follow.targetType === "topic"))
      : Follow.find({ followerId: user._id, targetType: "topic" }),
    existingMutedTopicIds
      ? Promise.resolve(existingMutedTopicIds)
      : UserFeedPreferences.findOne({ userId: user._id }).then(
          (preferences) => preferences?.mutedTopicIds || []
        ),
  ]);

  const mutedTopicIds = [...new Set(muted.map(normalizeTopic))];
  const topics = new Map<
    string,
    { longTermWeight: number; signals: IUserTopicInterest["signals"]; lastActive: Date | null }
  >();

  for (const interest of interests) {
    topics.set(normalizeTopic(interest.topic), {
      longTermWeight: interest.longTermWeight,
      signals: interest.signals || [],
      lastActive: interest.lastInteractedAt,
    });
  }

  for (const topicValue of [...(user.interests || []), ...(user.skills || [])]) {
    const topic = normalizeTopic(topicValue);
    if (!topic) continue;
    const entry = topics.get(topic) || { longTermWeight: 0, signals: [], lastActive: null };
    entry.longTermWeight = 1;
    topics.set(topic, entry);
  }

  for (const follow of follows) {
    const topic = normalizeTopic(follow.targetId);
    if (!topic) continue;
    const entry = topics.get(topic) || { longTermWeight: 0, signals: [], lastActive: null };
    entry.longTermWeight = 1;
    if (!entry.lastActive || follow.createdAt > entry.lastActive) entry.lastActive = follow.createdAt;
    topics.set(topic, entry);
  }

  for (const topic of mutedTopicIds) {
    if (!topics.has(topic)) {
      topics.set(topic, { longTermWeight: 0, signals: [], lastActive: null });
    }
  }

  const topicMap = [...topics.entries()].map(([topic, entry]) => {
    const shortTerm = entry.signals.reduce((total, signal) => {
      const ageDays = Math.max(0, (now.getTime() - new Date(signal.occurredAt).getTime()) / 86_400_000);
      return total + signal.weight * Math.exp(-signal.decayRate * ageDays);
    }, 0);
    const score = Math.max(0, Math.min(1, entry.longTermWeight * 0.6 + shortTerm * 0.4));
    const recentPositiveWeight = Math.max(
      0,
      entry.signals.reduce((total, signal) => {
        if (signal.weight <= 0) return total;
        const ageDays = Math.max(0, (now.getTime() - new Date(signal.occurredAt).getTime()) / 86_400_000);
        return total + signal.weight * Math.exp(-signal.decayRate * ageDays);
      }, 0)
    );
    const lastSignalAt = entry.signals.reduce<Date | null>(
      (latest, signal) =>
        !latest || signal.occurredAt > latest ? signal.occurredAt : latest,
      entry.lastActive
    );

    return {
      topic,
      score: Math.round(score * 100) / 100,
      longTermWeight: entry.longTermWeight,
      shortTermWeight: Math.round(Math.min(1, recentPositiveWeight) * 100) / 100,
      lastActive: lastSignalAt,
      muted: mutedTopicIds.includes(topic),
      hasInferredSignals: entry.signals.length > 0,
    };
  }).filter((entry) => entry.score > 0 || entry.hasInferredSignals || entry.muted);

  topicMap.sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic));
  return { topicMap, mutedTopicIds };
}
