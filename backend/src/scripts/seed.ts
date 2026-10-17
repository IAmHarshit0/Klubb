import { connectDB, disconnectDB } from "../shared/db.js";
import {
  User,
  Institution,
  Affiliation,
  EmploymentClaim,
  Group,
  Membership,
  Post,
  Connection,
  GroupAccessRequest,
  UserConnectionPreferences,
  Organisation,
  Follow,
  Block,
  Conversation,
  Message,
  Report,
  Comment,
  PostInteraction,
  UserFeedPreferences,
  RoleDefinition,
  RoleAssignment,
  InstitutionAnnouncement,
} from "../shared/models.js";

export async function seedDatabase(): Promise<void> {
  console.log("Seeding MongoDB demo dataset...");

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Institution.deleteMany({}),
    Affiliation.deleteMany({}),
    EmploymentClaim.deleteMany({}),
    Group.deleteMany({}),
    Membership.deleteMany({}),
    Post.deleteMany({}),
    Connection.deleteMany({}),
    Block.deleteMany({}),
    GroupAccessRequest.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Report.deleteMany({}),
    Comment.deleteMany({}),
    PostInteraction.deleteMany({}),
    UserConnectionPreferences.deleteMany({}),
    UserFeedPreferences.deleteMany({}),
    Organisation.deleteMany({}),
    Follow.deleteMany({}),
    RoleDefinition.deleteMany({}),
    RoleAssignment.deleteMany({}),
    InstitutionAnnouncement.deleteMany({}),
  ]);

  const now = new Date();

  // 1. Institution
  const apexUniv = new Institution({
    _id: "inst-apex-001",
    name: "Apex University",
    displayName: "Apex University",
    slug: "apex-university",
    type: "university",
  });
  await apexUniv.save();

  // 2. Users (Students, Alumni, Faculty, Admin)
  const users = [
    new User({
      _id: "usr-student-001",
      name: "Alex Rivera",
      email: "alex@apex.edu",
      demoKey: "student-alex",
      bio: "Junior Computer Science student passionate about distributed systems and AI applications.",
      portfolioUrl: "https://alexrivera.dev",
      skills: ["TypeScript", "Node.js", "Python", "React", "Distributed Systems"],
      interests: ["AI", "Fintech", "Cloud", "Mentorship"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-student-002",
      name: "Jordan Lee",
      email: "jordan@apex.edu",
      demoKey: "student-jordan",
      bio: "Sophomore Bioengineering student researching genomic data pipelines.",
      skills: ["Python", "Bioinformatics", "Data Analysis", "Genomics"],
      interests: ["Biotech", "Healthcare", "Campus Events"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-student-003",
      name: "Maya Patel",
      email: "maya@apex.edu",
      demoKey: "student-maya",
      bio: "Senior CS student building accessible web applications.",
      skills: ["React", "CSS", "Accessibility", "TypeScript"],
      interests: ["Frontend", "Design Systems", "Web Accessibility"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-alumnus-001",
      name: "Priya Sharma",
      email: "priya@stripe.com",
      demoKey: "alumnus-priya",
      bio: "Senior Software Engineer at Stripe. Apex CS '20 alumna. Available for career advice and referrals!",
      portfolioUrl: "https://priyasharma.io",
      skills: ["TypeScript", "Node.js", "Go", "Distributed Systems", "Payments Architecture"],
      interests: ["Fintech", "Mentorship", "Scalable Systems"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-alumnus-002",
      name: "Marcus Chen",
      email: "marcus@deepmind.com",
      demoKey: "alumnus-marcus",
      bio: "Staff ML Engineer at DeepMind. Apex EECS '18 alumnus. Focusing on neural retrieval and reranking.",
      skills: ["Python", "PyTorch", "JAX", "NLP", "Reranking", "Search Algorithms"],
      interests: ["AI Research", "Foundation Models", "Information Retrieval"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-alumnus-003",
      name: "Sara Kim",
      email: "sara@databricks.com",
      demoKey: "alumnus-sara",
      bio: "Solutions Architect at Databricks. Apex CS '21 alumna.",
      skills: ["Spark", "Python", "Data Lakehouse", "Cloud Architecture"],
      interests: ["Big Data", "Cloud Computing", "Mentorship"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-faculty-001",
      name: "Dr. Elena Vance",
      email: "evance@apex.edu",
      demoKey: "faculty-elena",
      bio: "Associate Professor of CS & Robotics Lab Director at Apex University.",
      skills: ["Robotics", "Autonomous Systems", "Academic Research", "C++"],
      interests: ["Robotics Lab", "AI Ethics", "Student Research"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-admin-001",
      name: "Dean Robert Sterling",
      email: "dean.sterling@apex.edu",
      demoKey: "admin-robert",
      bio: "Dean of Academic Affairs & Super Administrator for Apex University Campus Network.",
      skills: ["Academic Governance", "Institutional Policy", "Campus Administration"],
      interests: ["Higher Ed Leadership", "Institutional Strategy", "Accreditation"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-officer-001",
      name: "Sarah Jenkins",
      email: "s.jenkins@apex.edu",
      demoKey: "officer-sarah",
      bio: "Campus Placement & Verification Officer. Manages student credentials and employer verifications.",
      skills: ["Credential Verification", "Student Affairs", "Career Development"],
      interests: ["Alumni Relations", "Career Fair", "Audits"],
      profileVisibility: "public",
    }),
  ];
  await User.insertMany(users);

  // 3. Affiliations (Verified vs Unverified)
  const affiliations = [
    new Affiliation({
      _id: "aff-alex-001",
      userId: "usr-student-001",
      institutionId: "inst-apex-001",
      role: "Student",
      programme: "Computer Science B.S.",
      department: "Computer Science",
      batch: "Class of 2025",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-jordan-001",
      userId: "usr-student-002",
      institutionId: "inst-apex-001",
      role: "Student",
      programme: "Bioengineering B.S.",
      department: "Bioengineering",
      batch: "Class of 2026",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-maya-001",
      userId: "usr-student-003",
      institutionId: "inst-apex-001",
      role: "Student",
      programme: "Computer Science B.S.",
      department: "Computer Science",
      batch: "Class of 2024",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-priya-001",
      userId: "usr-alumnus-001",
      institutionId: "inst-apex-001",
      role: "Alumnus",
      programme: "Computer Science B.S.",
      department: "Computer Science",
      batch: "Class of 2020",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-marcus-001",
      userId: "usr-alumnus-002",
      institutionId: "inst-apex-001",
      role: "Alumnus",
      programme: "EECS B.S.",
      department: "Computer Science",
      batch: "Class of 2018",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-sara-001",
      userId: "usr-alumnus-003",
      institutionId: "inst-apex-001",
      role: "Alumnus",
      programme: "Computer Science B.S.",
      department: "Computer Science",
      batch: "Class of 2021",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-elena-001",
      userId: "usr-faculty-001",
      institutionId: "inst-apex-001",
      role: "Faculty",
      programme: "School of Computing",
      department: "Computer Science",
      batch: "Faculty",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-admin-001",
      userId: "usr-admin-001",
      institutionId: "inst-apex-001",
      role: "Admin",
      programme: "University Administration",
      department: "Academic Affairs",
      batch: "Administration",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-officer-001",
      userId: "usr-officer-001",
      institutionId: "inst-apex-001",
      role: "Faculty",
      programme: "Placement & Verification Division",
      department: "Career Services",
      batch: "Staff",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
  ];
  await Affiliation.insertMany(affiliations);

  // 4. Employment Claims: Distinguish Employer-Verified vs Self-Reported
  const claims = [
    new EmploymentClaim({
      _id: "claim-priya-001",
      userId: "usr-alumnus-001",
      companyName: "Stripe",
      jobTitle: "Senior Software Engineer",
      status: "employer-verified",
      verifiedAt: now,
    }),
    new EmploymentClaim({
      _id: "claim-marcus-001",
      userId: "usr-alumnus-002",
      companyName: "Google DeepMind",
      jobTitle: "Staff ML Engineer",
      status: "self-reported",
    }),
    new EmploymentClaim({
      _id: "claim-sara-001",
      userId: "usr-alumnus-003",
      companyName: "Databricks",
      jobTitle: "Solutions Architect",
      status: "employer-verified",
      verifiedAt: now,
    }),
  ];
  await EmploymentClaim.insertMany(claims);

  // 5. Connection Preferences
  const prefs = [
    new UserConnectionPreferences({
      _id: "cpref-priya",
      userId: "usr-alumnus-001",
      availableForMentorship: true,
      availableForReferrals: true,
      availableForQuestions: true,
      pauseIncomingRequests: false,
    }),
    new UserConnectionPreferences({
      _id: "cpref-marcus",
      userId: "usr-alumnus-002",
      availableForMentorship: false,
      availableForReferrals: false,
      availableForQuestions: true,
      pauseIncomingRequests: false,
    }),
  ];
  await UserConnectionPreferences.insertMany(prefs);

  // 6. Groups & Memberships
  const deptGroup = new Group({
    _id: "grp-cs-dept",
    institutionId: "inst-apex-001",
    name: "Computer Science Department",
    groupType: "department",
    visibility: "campus_only",
    postingPolicy: "all_members",
  });
  const roboticsClub = new Group({
    _id: "grp-robotics-club",
    institutionId: "inst-apex-001",
    parentGroupId: "grp-cs-dept",
    name: "Apex AI & Robotics Club",
    groupType: "club",
    visibility: "restricted",
    postingPolicy: "all_members",
  });
  await Group.insertMany([deptGroup, roboticsClub]);

  const memberships = [
    new Membership({
      _id: "mem-elena-robotics",
      userId: "usr-faculty-001",
      groupId: "grp-robotics-club",
      role: "supervisor",
      status: "active",
    }),
    new Membership({
      _id: "mem-priya-robotics",
      userId: "usr-alumnus-001",
      groupId: "grp-robotics-club",
      role: "member",
      status: "active",
    }),
    new Membership({
      _id: "mem-alex-dept",
      userId: "usr-student-001",
      groupId: "grp-cs-dept",
      role: "member",
      status: "active",
    }),
  ];
  await Membership.insertMany(memberships);

  // 7. Posts across audiences and topics
  const posts = [
    new Post({
      _id: "post-public-001",
      authorId: "usr-alumnus-001",
      text: "Stripe is hosting a distributed systems webinar this month! Sharing tips on scalable payment architectures.",
      audienceType: "public",
      topicLabels: ["Fintech", "Distributed Systems", "Cloud"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    }),
    new Post({
      _id: "post-campus-001",
      authorId: "usr-alumnus-002",
      text: "DeepMind information session for Apex students this Thursday on Neural Information Retrieval and Reranking.",
      audienceType: "campus",
      institutionId: "inst-apex-001",
      topicLabels: ["AI", "Search", "Reranking"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
    }),
    new Post({
      _id: "post-restricted-robotics-001",
      authorId: "usr-faculty-001",
      text: "[RESTRICTED] Robotics Club Drone Flight Testing Protocols and Lab Door Access Schedule for Spring 2026.",
      audienceType: "group",
      audienceId: "grp-robotics-club",
      institutionId: "inst-apex-001",
      topicLabels: ["Robotics", "Restricted", "Lab Access"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 10),
    }),
    new Post({
      _id: "post-student-001",
      authorId: "usr-student-001",
      text: "Building an open-source TypeScript feed ranking micro-service. Looking for peers interested in benchmarking!",
      audienceType: "public",
      topicLabels: ["TypeScript", "Node.js", "Open Source"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 12),
    }),
    new Post({
      _id: "post-student-002",
      authorId: "usr-student-002",
      text: "Seeking study partners for bioengineering genetics lab midterm this Friday in campus library.",
      audienceType: "campus",
      institutionId: "inst-apex-001",
      topicLabels: ["Bioengineering", "Genetics", "Campus Events"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 18),
    }),
  ];
  await Post.insertMany(posts);

  // 8. Pending connection request (Alex -> Priya)
  const [p1, p2] = ["usr-student-001", "usr-alumnus-001"].sort();
  const demoConn = new Connection({
    _id: "conn-alex-priya",
    pairKey: `${p1}_${p2}`,
    requesterId: "usr-student-001",
    recipientId: "usr-alumnus-001",
    status: "pending",
    message: "Hi Priya! I'm a fellow Apex CS student interested in payments infrastructure at Stripe.",
    createdAt: new Date(Date.now() - 3600 * 1000),
  });
  await demoConn.save();

  // 9. Pending group access request (Alex -> Robotics Club)
  const demoReq = new GroupAccessRequest({
    _id: "gar-alex-robotics",
    requesterId: "usr-student-001",
    groupId: "grp-robotics-club",
    status: "pending",
  });
  await demoReq.save();

  // 10. Demo follow relationship
  const demoFollow = new Follow({
    _id: "fol-alex-topic",
    followerId: "usr-student-001",
    targetType: "topic",
    targetId: "Distributed Systems",
  });
  await demoFollow.save();

  // 11. Custom Role Definitions created by Super Admin (Dean Sterling)
  const roleVerificationOfficer = new RoleDefinition({
    _id: "role-verif-officer",
    institutionId: "inst-apex-001",
    scopeType: "institution",
    scopeId: "inst-apex-001",
    name: "Verification & Placement Officer",
    permissions: [
      "verify_affiliation",
      "verify_employment",
      "publish_announcement",
      "view_audit_logs",
    ],
    createdBy: "usr-admin-001",
  });

  const roleStudentAmbassador = new RoleDefinition({
    _id: "role-student-ambassador",
    institutionId: "inst-apex-001",
    scopeType: "institution",
    scopeId: "inst-apex-001",
    name: "Campus Student Ambassador",
    permissions: [
      "host_campus_events",
      "broadcast_student_announcements",
      "moderate_student_groups",
    ],
    createdBy: "usr-admin-001",
  });

  await RoleDefinition.insertMany([roleVerificationOfficer, roleStudentAmbassador]);

  // 12. Role Assignments (Created by Dean Robert Sterling)
  const roleAssignments = [
    new RoleAssignment({
      _id: "rass-sarah-verif",
      userId: "usr-officer-001",
      roleDefinitionId: "role-verif-officer",
      scopeType: "institution",
      scopeId: "inst-apex-001",
      assignedBy: "usr-admin-001",
      status: "active",
      createdAt: now,
    }),
    new RoleAssignment({
      _id: "rass-maya-ambassador",
      userId: "usr-student-003",
      roleDefinitionId: "role-student-ambassador",
      scopeType: "institution",
      scopeId: "inst-apex-001",
      assignedBy: "usr-admin-001",
      status: "active",
      createdAt: now,
    }),
  ];
  await RoleAssignment.insertMany(roleAssignments);

  // 13. Official Institution Announcements (Broadcasts by Dean Sterling and Officer Sarah)
  const announcements = [
    new InstitutionAnnouncement({
      _id: "ann-dean-welcome",
      institutionId: "inst-apex-001",
      senderId: "usr-admin-001",
      targetType: "institution",
      targetIds: [],
      title: "Welcome to Academic Year 2026-2027",
      body: "Welcome all Apex University students, faculty, and alumni. Campus Network v3.0 is now live for all department collaborations and verified professional networking.",
      status: "published",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24),
    }),
    new InstitutionAnnouncement({
      _id: "ann-sarah-placements",
      institutionId: "inst-apex-001",
      senderId: "usr-officer-001",
      targetType: "institution",
      targetIds: [],
      title: "Spring Career Fair & Alumni Mentorship Window Open",
      body: "All verified students may now submit connection requests directly to verified alumni at Stripe, DeepMind, and Databricks. Verify your department affiliations in your profile tab.",
      status: "published",
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
    }),
  ];
  await InstitutionAnnouncement.insertMany(announcements);

  console.log("MongoDB demo dataset seeded successfully!");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  connectDB()
    .then(seedDatabase)
    .then(disconnectDB)
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
