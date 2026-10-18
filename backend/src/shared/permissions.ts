import {
  User,
  Affiliation,
  Membership,
  Block,
  Connection,
  Conversation,
  IPost,
  IUser,
} from "./models.js";

export async function isBlocked(userAId: string, userBId: string): Promise<boolean> {
  if (userAId === userBId) return false;
  const block = await Block.findOne({
    $or: [
      { blockerId: userAId, blockedId: userBId },
      { blockerId: userBId, blockedId: userAId },
    ],
  });
  return !!block;
}

export async function canViewProfile(viewerId: string, targetUserId: string): Promise<boolean> {
  if (viewerId === targetUserId) return true;
  return !(await isBlocked(viewerId, targetUserId));
}

export async function hasVerifiedAlumniAffiliation(userId: string): Promise<boolean> {
  const affiliation = await Affiliation.findOne({
    userId,
    role: "Alumnus",
    status: "active",
    verificationStatus: "institution-verified",
  });
  return !!affiliation;
}

export async function canViewPost(viewer: IUser | null, post: IPost): Promise<boolean> {
  // 1. Mutual block check
  if (viewer) {
    if (await isBlocked(viewer._id, post.authorId)) {
      return false;
    }
    if (viewer._id === post.authorId) {
      return true;
    }
  } else {
    return post.audienceType === "public";
  }

  // 2. Audience checks
  if (post.audienceType === "public") {
    return true;
  }

  if (post.audienceType === "campus") {
    if (!post.institutionId) return true;
    const aff = await Affiliation.findOne({
      userId: viewer._id,
      institutionId: post.institutionId,
      status: "active",
      verificationStatus: "institution-verified",
    });
    return !!aff;
  }

  if (post.audienceType === "group") {
    if (!post.audienceId) return false;
    const mem = await Membership.findOne({
      userId: viewer._id,
      groupId: post.audienceId,
      status: "active",
    });
    return !!mem;
  }

  return false;
}

export async function canPostToAudience(
  userId: string,
  audienceType: "public" | "campus" | "group",
  audienceId?: string,
  institutionId?: string
): Promise<boolean> {
  if (audienceType === "public") return true;

  if (audienceType === "campus") {
    if (!institutionId) return false;
    const aff = await Affiliation.findOne({
      userId,
      institutionId,
      status: "active",
    });
    return !!aff;
  }

  if (audienceType === "group") {
    if (!audienceId) return false;
    const mem = await Membership.findOne({
      userId,
      groupId: audienceId,
      status: "active",
    });
    return !!mem;
  }

  return false;
}

export async function canMessageUser(senderId: string, recipientId: string): Promise<boolean> {
  if (senderId === recipientId) return false;
  if (await isBlocked(senderId, recipientId)) return false;

  const [id1, id2] = [senderId, recipientId].sort();
  const pairKey = `${id1}_${id2}`;

  const conn = await Connection.findOne({
    pairKey,
    status: "accepted",
  });
  return !!conn;
}

export function canAccessConversation(userId: string, conversation: any): boolean {
  return conversation.participantIds.includes(userId);
}

export async function canModerateGroup(userId: string, groupId: string): Promise<boolean> {
  const mem = await Membership.findOne({
    userId,
    groupId,
    status: "active",
    role: { $in: ["moderator", "supervisor", "admin"] },
  });
  return !!mem;
}

export async function hasInstitutionPermission(
  userId: string,
  institutionId: string,
  requiredPermission: string
): Promise<boolean> {
  // 1. Check if user is institution admin affiliation
  const adminAff = await Affiliation.findOne({
    userId,
    institutionId,
    role: "Admin",
    status: "active",
  });
  if (adminAff) return true;

  // 2. Check role assignments and definitions
  const { RoleAssignment, RoleDefinition } = await import("./models.js");
  const assignments = await RoleAssignment.find({
    userId,
    status: "active",
    scopeType: "institution",
    scopeId: institutionId,
  });

  if (assignments.length === 0) return false;

  const roleDefIds = assignments.map((a) => a.roleDefinitionId);
  const roles = await RoleDefinition.find({
    _id: { $in: roleDefIds },
  });

  return roles.some((r) => r.permissions.includes(requiredPermission) || r.permissions.includes("*"));
}
