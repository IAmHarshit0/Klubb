import {
  User,
  Affiliation,
  Membership,
  Group,
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

export async function canConfigureAvailability(userId: string): Promise<boolean> {
  const affiliations = await Affiliation.find({ userId, status: "active" });

  // If user has any non-student affiliation (e.g. Alumnus, Faculty, Admin), they have availability
  const hasNonStudentRole = affiliations.some((a) => a.role !== "Student");
  if (hasNonStudentRole) return true;

  // Check if user is an organisation representative
  const { OrganisationRepresentative } = await import("./models.js");
  const rep = await OrganisationRepresentative.findOne({ userId });
  if (rep) return true;

  // If user has NO affiliations at all, check if they have employment claims (e.g. company rep)
  if (affiliations.length === 0) {
    const { EmploymentClaim } = await import("./models.js");
    const claim = await EmploymentClaim.findOne({ userId });
    if (claim) return true;
  }

  // Pure student: user has affiliations and ALL of them are role === "Student"
  return false;
}

export async function isInstitutionAdmin(userId: string, institutionId?: string): Promise<boolean> {
  if (institutionId) {
    const adminAff = await Affiliation.findOne({
      userId,
      institutionId,
      role: "Admin",
      status: "active",
    });
    if (adminAff) return true;

    // Check custom role assignments
    const { RoleAssignment, RoleDefinition } = await import("./models.js");
    const assignments = await RoleAssignment.find({
      userId,
      status: "active",
      scopeType: "institution",
      scopeId: institutionId,
    });
    if (assignments.length > 0) {
      const roleDefIds = assignments.map((a) => a.roleDefinitionId);
      const roles = await RoleDefinition.find({ _id: { $in: roleDefIds } });
      if (
        roles.some(
          (r) =>
            r.permissions.includes("*") ||
            r.permissions.includes("admin") ||
            r.permissions.includes("manage_groups")
        )
      ) {
        return true;
      }
    }
    return false;
  }

  const anyAdmin = await Affiliation.findOne({
    userId,
    role: "Admin",
    status: "active",
  });
  return !!anyAdmin;
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

  // Institution Admin bypass: if viewer is superadmin/admin of the post's institution
  if (post.institutionId && (await isInstitutionAdmin(viewer._id, post.institutionId))) {
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
    if (mem) return true;

    // Check if user is admin of group's owning institution
    const group = await Group.findById(post.audienceId);
    if (group && (await isInstitutionAdmin(viewer._id, group.institutionId))) {
      return true;
    }
    return false;
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
    if (await isInstitutionAdmin(userId, institutionId)) return true;
    const aff = await Affiliation.findOne({
      userId,
      institutionId,
      status: "active",
    });
    return !!aff;
  }

  if (audienceType === "group") {
    if (!audienceId) return false;
    if (institutionId && (await isInstitutionAdmin(userId, institutionId))) return true;
    const group = await Group.findById(audienceId);
    if (group && (await isInstitutionAdmin(userId, group.institutionId))) return true;
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

  // Institution Admins can send and receive direct messages with members for administrative & support purposes
  if ((await isInstitutionAdmin(senderId)) || (await isInstitutionAdmin(recipientId))) {
    return true;
  }

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
  const group = await Group.findById(groupId);
  if (group && (await isInstitutionAdmin(userId, group.institutionId))) {
    return true;
  }
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
