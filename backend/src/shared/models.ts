import mongoose, { Schema, Document } from "mongoose";

// --- Users ---
export interface IUser {
  _id: string;
  name: string;
  email: string;
  demoKey?: string;
  bio?: string;
  portfolioUrl?: string;
  skills: string[];
  interests: string[];
  profileVisibility: "public" | "campus" | "restricted";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    demoKey: { type: String },
    bio: { type: String },
    portfolioUrl: { type: String },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    profileVisibility: {
      type: String,
      enum: ["public", "campus", "restricted"],
      default: "public",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Institutions ---
export interface IInstitution {
  _id: string;
  name: string;
  displayName: string;
  slug: string;
  type?: string;
  logoUrl?: string;
  themeColors?: { primary: string; secondary: string };
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, default: "university" },
    logoUrl: { type: String },
    themeColors: {
      primary: { type: String, default: "#1e3a8a" },
      secondary: { type: String, default: "#3b82f6" },
    },
  },
  { _id: false }
);

// --- Affiliations ---
export interface IAffiliation {
  _id: string;
  userId: string;
  institutionId: string;
  role: "Student" | "Alumnus" | "Faculty" | "Admin";
  programme?: string;
  department?: string;
  batch?: string;
  status: "active" | "inactive";
  verificationStatus: "institution-verified" | "unverified";
  verifiedAt?: Date;
  source?: string;
}

const AffiliationSchema = new Schema<IAffiliation>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    programme: { type: String },
    department: { type: String },
    batch: { type: String },
    status: { type: String, default: "active" },
    verificationStatus: {
      type: String,
      enum: ["institution-verified", "unverified"],
      default: "unverified",
    },
    verifiedAt: { type: Date },
    source: { type: String },
  },
  { _id: false }
);

// --- Employment Claims ---
export interface IEmploymentClaim {
  _id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  status: "employer-verified" | "self-reported" | "pending";
  verifiedAt?: Date;
}

const EmploymentClaimSchema = new Schema<IEmploymentClaim>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    status: {
      type: String,
      enum: ["employer-verified", "self-reported", "pending"],
      default: "self-reported",
    },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

// --- Groups ---
export interface IGroup {
  _id: string;
  institutionId: string;
  parentGroupId?: string;
  name: string;
  groupType: "programme" | "batch" | "department" | "club" | "general";
  visibility: "public" | "campus_only" | "restricted";
  postingPolicy: "all_members" | "moderators_only";
  createdBy?: string;
}

const GroupSchema = new Schema<IGroup>(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    parentGroupId: { type: String },
    name: { type: String, required: true },
    groupType: {
      type: String,
      enum: ["programme", "batch", "department", "club", "general"],
      default: "general",
    },
    visibility: {
      type: String,
      enum: ["public", "campus_only", "restricted"],
      default: "campus_only",
    },
    postingPolicy: {
      type: String,
      enum: ["all_members", "moderators_only"],
      default: "all_members",
    },
    createdBy: { type: String },
  },
  { _id: false }
);

// --- Memberships ---
export interface IMembership {
  _id: string;
  userId: string;
  groupId: string;
  role: "member" | "moderator" | "supervisor" | "admin";
  status: "active" | "invited" | "suspended" | "banned";
  joinedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["member", "moderator", "supervisor", "admin"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended", "banned"],
      default: "active",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
MembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });

// --- Group Access Requests ---
export interface IGroupAccessRequest {
  _id: string;
  requesterId: string;
  groupId: string;
  status: "pending" | "approved" | "declined";
  reviewedBy?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

const GroupAccessRequestSchema = new Schema<IGroupAccessRequest>(
  {
    _id: { type: String, required: true },
    requesterId: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    reviewedBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

// --- Posts ---
export interface IPost {
  _id: string;
  authorId: string;
  text: string;
  media: string[];
  audienceType: "public" | "campus" | "group";
  audienceId?: string;
  institutionId?: string;
  topicLabels: string[];
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    _id: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    media: { type: [String], default: [] },
    audienceType: {
      type: String,
      enum: ["public", "campus", "group"],
      default: "public",
    },
    audienceId: { type: String },
    institutionId: { type: String },
    topicLabels: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { _id: false }
);

// --- Post Interactions ---
export interface IPostInteraction {
  _id: string;
  userId: string;
  postId: string;
  type: "like" | "save" | "hide";
  createdAt: Date;
}

const PostInteractionSchema = new Schema<IPostInteraction>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: true, index: true },
    type: { type: String, enum: ["like", "save", "hide"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
PostInteractionSchema.index({ userId: 1, postId: 1, type: 1 }, { unique: true });

// --- Comments ---
export interface IComment {
  _id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    _id: { type: String, required: true },
    postId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Connections ---
export interface IConnection {
  _id: string;
  pairKey: string;
  requesterId: string;
  recipientId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    _id: { type: String, required: true },
    pairKey: { type: String, required: true, unique: true },
    requesterId: { type: String, required: true },
    recipientId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
    message: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Blocks ---
export interface IBlock {
  _id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

const BlockSchema = new Schema<IBlock>(
  {
    _id: { type: String, required: true },
    blockerId: { type: String, required: true },
    blockedId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

// --- Conversations ---
export interface IConversation {
  _id: string;
  conversationKey: string;
  participantIds: string[];
  createdAt: Date;
  lastMessageAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    _id: { type: String, required: true },
    conversationKey: { type: String, required: true, unique: true },
    participantIds: { type: [String], required: true },
    createdAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Messages ---
export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    _id: { type: String, required: true },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Reports ---
export interface IReport {
  _id: string;
  reporterId: string;
  targetType: "post" | "user" | "group";
  targetId: string;
  reason: string;
  status: "pending" | "investigating" | "resolved" | "escalated";
  escalatedTo?: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    _id: { type: String, required: true },
    reporterId: { type: String, required: true },
    targetType: { type: String, enum: ["post", "user", "group"], required: true },
    targetId: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "escalated"],
      default: "pending",
    },
    escalatedTo: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Follows ---
export interface IFollow {
  _id: string;
  followerId: string;
  targetType: "user" | "topic";
  targetId: string;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    _id: { type: String, required: true },
    followerId: { type: String, required: true },
    targetType: { type: String, enum: ["user", "topic"], required: true },
    targetId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
FollowSchema.index({ followerId: 1, targetType: 1, targetId: 1 }, { unique: true });

// --- User Topic Interests ---
export interface IUserTopicSignal {
  eventId: string;
  signalType: "save" | "comment" | "search" | "like" | "hide" | "post";
  weight: number;
  decayRate: number;
  occurredAt: Date;
}

export interface IUserTopicInterest {
  _id: string;
  userId: string;
  topic: string;
  longTermWeight: number;
  shortTermWeight: number;
  lastInteractedAt: Date;
  signals: IUserTopicSignal[];
}

const UserTopicSignalSchema = new Schema<IUserTopicSignal>(
  {
    eventId: { type: String, required: true },
    signalType: {
      type: String,
      enum: ["save", "comment", "search", "like", "hide", "post"],
      required: true,
    },
    weight: { type: Number, required: true },
    decayRate: { type: Number, required: true },
    occurredAt: { type: Date, required: true },
  },
  { _id: false }
);

const UserTopicInterestSchema = new Schema<IUserTopicInterest>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    longTermWeight: { type: Number, default: 0 },
    shortTermWeight: { type: Number, default: 0 },
    lastInteractedAt: { type: Date, default: Date.now },
    signals: { type: [UserTopicSignalSchema], default: [] },
  },
  { _id: false }
);
UserTopicInterestSchema.index({ userId: 1, topic: 1 }, { unique: true });

// --- User Feed Preferences ---
export interface IUserFeedPreferences {
  _id: string;
  userId: string;
  defaultFeedMode: "baseline" | "reranked";
  mutedTopicIds: string[];
  mutedAuthorIds: string[];
  updatedAt: Date;
}

const UserFeedPreferencesSchema = new Schema<IUserFeedPreferences>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    defaultFeedMode: { type: String, enum: ["baseline", "reranked"], default: "baseline" },
    mutedTopicIds: { type: [String], default: [] },
    mutedAuthorIds: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- User Connection Preferences ---
export interface IUserConnectionPreferences {
  _id: string;
  userId: string;
  availableForMentorship: boolean;
  availableForReferrals: boolean;
  availableForQuestions: boolean;
  pauseIncomingRequests: boolean;
}

const UserConnectionPreferencesSchema = new Schema<IUserConnectionPreferences>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    availableForMentorship: { type: Boolean, default: true },
    availableForReferrals: { type: Boolean, default: true },
    availableForQuestions: { type: Boolean, default: true },
    pauseIncomingRequests: { type: Boolean, default: false },
  },
  { _id: false }
);

// --- Organisations ---
export interface IOrganisation {
  _id: string;
  name: string;
  type: string;
  website?: string;
  verificationStatus: "verified" | "pending" | "unverified";
}

const OrganisationSchema = new Schema<IOrganisation>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "company" },
    website: { type: String },
    verificationStatus: {
      type: String,
      enum: ["verified", "pending", "unverified"],
      default: "unverified",
    },
  },
  { _id: false }
);

// --- Institution Announcements ---
export interface IInstitutionAnnouncement {
  _id: string;
  institutionId: string;
  senderId: string;
  targetType: "institution" | "group" | "individual";
  targetIds: string[];
  title: string;
  body: string;
  createdAt: Date;
  status: "draft" | "published";
}

const InstitutionAnnouncementSchema = new Schema<IInstitutionAnnouncement>(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    targetType: { type: String, enum: ["institution", "group", "individual"], default: "institution" },
    targetIds: { type: [String], default: [] },
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["draft", "published"], default: "published" },
  },
  { _id: false }
);

// --- Role Definitions ---
export interface IRoleDefinition {
  _id: string;
  institutionId: string;
  scopeType: "institution" | "group";
  scopeId: string;
  name: string;
  permissions: string[];
  createdBy: string;
}

const RoleDefinitionSchema = new Schema<IRoleDefinition>(
  {
    _id: { type: String, required: true },
    institutionId: { type: String, required: true, index: true },
    scopeType: { type: String, enum: ["institution", "group"], default: "institution" },
    scopeId: { type: String, required: true },
    name: { type: String, required: true },
    permissions: { type: [String], default: [] },
    createdBy: { type: String, required: true },
  },
  { _id: false }
);

// --- Role Assignments ---
export interface IRoleAssignment {
  _id: string;
  userId: string;
  roleDefinitionId: string;
  scopeType: "institution" | "group";
  scopeId: string;
  assignedBy: string;
  status: "active" | "revoked";
  createdAt: Date;
}

const RoleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    roleDefinitionId: { type: String, required: true },
    scopeType: { type: String, enum: ["institution", "group"], required: true },
    scopeId: { type: String, required: true },
    assignedBy: { type: String, required: true },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Organisation Representatives ---
export interface IOrganisationRepresentative {
  _id: string;
  organisationId: string;
  userId: string;
  role: string;
  verificationStatus: "verified" | "pending" | "rejected";
  verifiedBy?: string;
  verifiedAt?: Date;
}

const OrganisationRepresentativeSchema = new Schema<IOrganisationRepresentative>(
  {
    _id: { type: String, required: true },
    organisationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, default: "representative" },
    verificationStatus: { type: String, enum: ["verified", "pending", "rejected"], default: "pending" },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

// --- Audit Events ---
export interface IAuditEvent {
  _id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  scopeId?: string;
  createdAt: Date;
  metadata?: any;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    _id: { type: String, required: true },
    actorId: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    scopeId: { type: String },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

// Export Mongoose Models
export const User = mongoose.model<IUser>("User", UserSchema);
export const Institution = mongoose.model<IInstitution>("Institution", InstitutionSchema);
export const Affiliation = mongoose.model<IAffiliation>("Affiliation", AffiliationSchema);
export const EmploymentClaim = mongoose.model<IEmploymentClaim>("EmploymentClaim", EmploymentClaimSchema);
export const Group = mongoose.model<IGroup>("Group", GroupSchema);
export const Membership = mongoose.model<IMembership>("Membership", MembershipSchema);
export const GroupAccessRequest = mongoose.model<IGroupAccessRequest>("GroupAccessRequest", GroupAccessRequestSchema);
export const Post = mongoose.model<IPost>("Post", PostSchema);
export const PostInteraction = mongoose.model<IPostInteraction>("PostInteraction", PostInteractionSchema);
export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
export const Connection = mongoose.model<IConnection>("Connection", ConnectionSchema);
export const Block = mongoose.model<IBlock>("Block", BlockSchema);
export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);
export const Message = mongoose.model<IMessage>("Message", MessageSchema);
export const Report = mongoose.model<IReport>("Report", ReportSchema);
export const Follow = mongoose.model<IFollow>("Follow", FollowSchema);
export const UserTopicInterest = mongoose.model<IUserTopicInterest>("UserTopicInterest", UserTopicInterestSchema);
export const UserFeedPreferences = mongoose.model<IUserFeedPreferences>("UserFeedPreferences", UserFeedPreferencesSchema);
export const UserConnectionPreferences = mongoose.model<IUserConnectionPreferences>("UserConnectionPreferences", UserConnectionPreferencesSchema);
export const Organisation = mongoose.model<IOrganisation>("Organisation", OrganisationSchema);
export const InstitutionAnnouncement = mongoose.model<IInstitutionAnnouncement>("InstitutionAnnouncement", InstitutionAnnouncementSchema);
export const RoleDefinition = mongoose.model<IRoleDefinition>("RoleDefinition", RoleDefinitionSchema);
export const RoleAssignment = mongoose.model<IRoleAssignment>("RoleAssignment", RoleAssignmentSchema);
export const OrganisationRepresentative = mongoose.model<IOrganisationRepresentative>("OrganisationRepresentative", OrganisationRepresentativeSchema);
export const AuditEvent = mongoose.model<IAuditEvent>("AuditEvent", AuditEventSchema);
