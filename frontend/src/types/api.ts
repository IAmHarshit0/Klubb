// ── API Type Definitions ─────────────────────────────────────────────────────
// Mirrors the backend Mongoose models exactly.

export interface User {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  portfolioUrl?: string;
  skills: string[];
  interests: string[];
  profileVisibility: 'public' | 'campus' | 'restricted';
  affiliations?: Affiliation[];
  employmentClaims?: EmploymentClaim[];
  availability?: Availability;
  connectionPreferences?: ConnectionPreferences;
}

export interface Affiliation {
  id?: string;
  institutionId: string;
  role: 'Student' | 'Alumnus' | 'Faculty' | 'Admin';
  programme?: string;
  department?: string;
  batch?: string;
  verificationStatus: 'institution-verified' | 'unverified';
}

export interface EmploymentClaim {
  id?: string;
  companyName: string;
  jobTitle: string;
  status: 'employer-verified' | 'self-reported' | 'pending';
}

export interface Availability {
  mentorship: boolean;
  referrals: boolean;
  questions: boolean;
  paused: boolean;
}

export interface ConnectionPreferences {
  availableForMentorship: boolean;
  availableForReferrals: boolean;
  availableForQuestions: boolean;
  pauseIncomingRequests: boolean;
}

export interface Institution {
  _id: string;
  name: string;
  displayName: string;
  slug: string;
  type?: string;
  logoUrl?: string;
  themeColors?: { primary: string; secondary: string };
}

export interface Group {
  _id: string;
  institutionId: string;
  parentGroupId?: string;
  name: string;
  groupType: 'programme' | 'batch' | 'department' | 'club' | 'general';
  visibility: 'public' | 'campus_only' | 'restricted';
  postingPolicy: 'all_members' | 'moderators_only';
}

export interface Membership {
  _id: string;
  userId: string;
  groupId: string;
  role: 'member' | 'moderator' | 'supervisor' | 'admin';
  status: 'active' | 'invited' | 'suspended' | 'banned';
  joinedAt: string;
}

export interface Post {
  id: string;
  text: string;
  media: string[];
  audienceType: 'public' | 'campus' | 'group';
  audienceId?: string;
  institutionId?: string;
  topicLabels: string[];
  createdAt: string;
  author: PostAuthor;
}

export interface PostAuthor {
  id: string;
  name: string;
  role: string;
  institutionId?: string;
  verificationStatus: 'institution-verified' | 'unverified';
}

export interface FeedItem {
  rank: number;
  score: number;
  explanation: string;
  post: Post;
}

export interface FeedResponse {
  tab: string;
  mode: string;
  totalCandidates: number;
  eligibleCandidates: number;
  returnedCount: number;
  nextCursor: string | null;
  items: FeedItem[];
}

export interface Comment {
  _id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Connection {
  _id: string;
  pairKey: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string;
  otherUser: {
    id: string;
    name: string;
    skills: string[];
  } | null;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface DiscoveryPerson {
  id: string;
  name: string;
  bio?: string;
  skills: string[];
  affiliations: Affiliation[];
  employmentClaims: EmploymentClaim[];
  availability: Availability;
}

export interface Organisation {
  _id: string;
  name: string;
  type: string;
  website?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export interface GroupAccessRequest {
  _id: string;
  requesterId: string;
  groupId: string;
  status: 'pending' | 'approved' | 'declined';
  reviewedBy?: string;
  createdAt: string;
}

// ── Demo Users ────────────────────────────────────────────────────────────────
export interface DemoUser {
  id: string;
  name: string;
  role: string;
  demoKey: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'usr-student-001', name: 'Alex Rivera', role: 'Student — CS', demoKey: 'student-alex' },
  { id: 'usr-student-002', name: 'Jordan Lee', role: 'Student — Bioengineering', demoKey: 'student-jordan' },
  { id: 'usr-student-003', name: 'Maya Patel', role: 'Student — CS', demoKey: 'student-maya' },
  { id: 'usr-alumnus-001', name: 'Priya Sharma', role: 'Alumni — Stripe', demoKey: 'alumnus-priya' },
  { id: 'usr-alumnus-002', name: 'Marcus Chen', role: 'Alumni — DeepMind', demoKey: 'alumnus-marcus' },
  { id: 'usr-alumnus-003', name: 'Sara Kim', role: 'Alumni — Databricks', demoKey: 'alumnus-sara' },
  { id: 'usr-faculty-001', name: 'Dr. Elena Vance', role: 'Faculty — CS', demoKey: 'faculty-elena' },
];
