import { connectDB, disconnectDB } from "../shared/db.js";
import {
  User,
  Institution,
  Community,
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
  UserTopicInterest,
  UserFeedPreferences,
  RoleDefinition,
  RoleAssignment,
  InstitutionAnnouncement,
  OrganisationRepresentative,
} from "../shared/models.js";

export async function seedDatabase(): Promise<void> {
  console.log("Seeding MongoDB demo dataset...");

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Institution.deleteMany({}),
    Community.deleteMany({}),
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
    UserTopicInterest.deleteMany({}),
    UserConnectionPreferences.deleteMany({}),
    UserFeedPreferences.deleteMany({}),
    Organisation.deleteMany({}),
    OrganisationRepresentative.deleteMany({}),
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

  const northstarInstitute = new Institution({
    _id: "inst-northstar-002",
    name: "Northstar Institute of Technology",
    displayName: "Northstar Institute",
    slug: "northstar-institute",
    type: "university",
  });
  await northstarInstitute.save();

  await Community.insertMany([
    new Community({
      _id: "com-apex-alumni",
      institutionId: "inst-apex-001",
      name: "Apex Alumni Network",
      slug: "alumni-network",
      createdBy: "usr-officer-001",
      createdAt: now,
    }),
    new Community({
      _id: "com-apex-research",
      institutionId: "inst-apex-001",
      name: "Apex Research Community",
      slug: "research-community",
      createdBy: "usr-officer-001",
      createdAt: now,
    }),
    new Community({
      _id: "com-northstar-builders",
      institutionId: "inst-northstar-002",
      name: "Northstar Builders",
      slug: "builders",
      createdBy: "usr-officer-northstar-001",
      createdAt: now,
    }),
  ]);

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
    new User({
      _id: "usr-alumnus-multi-001",
      name: "Taylor Morgan",
      email: "taylor.morgan@example.com",
      demoKey: "alumnus-multiple-institutions",
      bio: "Apex and Northstar alum working across software engineering and applied research.",
      skills: ["Software Engineering", "Research", "Cloud"],
      interests: ["Mentorship", "Cloud", "Research"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-dual-role-001",
      name: "Riley Chen",
      email: "riley.chen@example.com",
      demoKey: "alumnus-and-student",
      bio: "Apex alum and current Northstar graduate student.",
      skills: ["Machine Learning", "Data Science"],
      interests: ["Graduate School", "AI Research"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-admin-northstar-001",
      name: "Dr. Amara Okafor",
      email: "amara.okafor@northstar.edu",
      demoKey: "admin-northstar",
      bio: "Super Administrator for Northstar Institute.",
      skills: ["Institutional Governance", "Academic Administration"],
      interests: ["Higher Education", "Research"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-officer-northstar-001",
      name: "Noah Williams",
      email: "noah.williams@northstar.edu",
      demoKey: "officer-northstar",
      bio: "Northstar community and events coordinator.",
      skills: ["Community Management", "Events"],
      interests: ["Student Communities", "Events"],
      profileVisibility: "public",
    }),
    new User({
      _id: "usr-company-rep-001",
      name: "Avery Brooks",
      email: "avery@brightpath.example",
      demoKey: "company-representative",
      bio: "Founder of BrightPath Labs; company and representative verification are pending.",
      skills: ["Entrepreneurship", "Product Strategy"],
      interests: ["Startups", "Product Design"],
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
    new Affiliation({
      _id: "aff-taylor-apex",
      userId: "usr-alumnus-multi-001",
      institutionId: "inst-apex-001",
      role: "Alumnus",
      programme: "Information Systems M.S.",
      batch: "Class of 2019",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-taylor-northstar",
      userId: "usr-alumnus-multi-001",
      institutionId: "inst-northstar-002",
      role: "Alumnus",
      programme: "Computer Engineering B.S.",
      batch: "Class of 2016",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-riley-apex",
      userId: "usr-dual-role-001",
      institutionId: "inst-apex-001",
      role: "Alumnus",
      programme: "Computer Science B.S.",
      batch: "Class of 2022",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-riley-northstar",
      userId: "usr-dual-role-001",
      institutionId: "inst-northstar-002",
      role: "Student",
      programme: "Artificial Intelligence M.S.",
      batch: "Class of 2027",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-admin-northstar",
      userId: "usr-admin-northstar-001",
      institutionId: "inst-northstar-002",
      role: "Admin",
      programme: "Institute Administration",
      department: "Academic Affairs",
      batch: "Administration",
      verificationStatus: "institution-verified",
      verifiedAt: now,
    }),
    new Affiliation({
      _id: "aff-officer-northstar",
      userId: "usr-officer-northstar-001",
      institutionId: "inst-northstar-002",
      role: "Faculty",
      programme: "Student Engagement",
      department: "Community Programs",
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
    new EmploymentClaim({
      _id: "claim-avery-001",
      userId: "usr-company-rep-001",
      companyName: "BrightPath Labs",
      jobTitle: "Founder",
      status: "self-reported",
    }),
  ];
  await EmploymentClaim.insertMany(claims);

  const brightPath = new Organisation({
    _id: "org-brightpath-labs",
    name: "BrightPath Labs",
    type: "company",
    website: "https://brightpath.example",
    verificationStatus: "unverified",
  });
  await brightPath.save();
  await OrganisationRepresentative.create({
    _id: "rep-avery-brightpath",
    organisationId: brightPath._id,
    userId: "usr-company-rep-001",
    role: "Founder",
    verificationStatus: "pending",
  });

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

  // 6. Groups & Memberships across Apex & Northstar
  const groupsToSeed = [
    // Apex University Groups
    new Group({
      _id: "grp-cs-dept",
      institutionId: "inst-apex-001",
      name: "Computer Science Department",
      groupType: "department",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-admin-001",
    }),
    new Group({
      _id: "grp-bio-dept",
      institutionId: "inst-apex-001",
      name: "Bioengineering Department",
      groupType: "department",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-admin-001",
    }),
    new Group({
      _id: "grp-robotics-club",
      institutionId: "inst-apex-001",
      parentGroupId: "grp-cs-dept",
      name: "Apex AI & Robotics Club",
      groupType: "club",
      visibility: "restricted",
      postingPolicy: "all_members",
      createdBy: "usr-faculty-001",
    }),
    new Group({
      _id: "grp-web-dev",
      institutionId: "inst-apex-001",
      parentGroupId: "grp-cs-dept",
      name: "Web & Distributed Systems Society",
      groupType: "club",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-student-003",
    }),
    new Group({
      _id: "grp-fintech-club",
      institutionId: "inst-apex-001",
      name: "Campus Fintech & Quantitative Trading",
      groupType: "club",
      visibility: "public",
      postingPolicy: "all_members",
      createdBy: "usr-alumnus-001",
    }),
    new Group({
      _id: "grp-alumni-network",
      institutionId: "inst-apex-001",
      name: "Apex Engineering Alumni Circle",
      groupType: "general",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-alumnus-002",
    }),
    new Group({
      _id: "grp-cs-class-2025",
      institutionId: "inst-apex-001",
      parentGroupId: "grp-cs-dept",
      name: "CS Class of 2025 Cohort",
      groupType: "batch",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-student-001",
    }),
    new Group({
      _id: "grp-campus-research",
      institutionId: "inst-apex-001",
      name: "Undergraduate Research & Publications",
      groupType: "programme",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-faculty-001",
    }),
    // Northstar Institute Groups
    new Group({
      _id: "grp-northstar-ai",
      institutionId: "inst-northstar-002",
      name: "Northstar Applied AI & Data Labs",
      groupType: "department",
      visibility: "campus_only",
      postingPolicy: "all_members",
      createdBy: "usr-admin-northstar-001",
    }),
    new Group({
      _id: "grp-northstar-community",
      institutionId: "inst-northstar-002",
      name: "Northstar Campus Community & Outreach",
      groupType: "general",
      visibility: "public",
      postingPolicy: "all_members",
      createdBy: "usr-officer-northstar-001",
    }),
  ];
  await Group.insertMany(groupsToSeed);

  const memberships = [
    // Faculty & Supervisors
    new Membership({ _id: "mem-elena-robotics", userId: "usr-faculty-001", groupId: "grp-robotics-club", role: "supervisor", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-elena-cs-dept", userId: "usr-faculty-001", groupId: "grp-cs-dept", role: "admin", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-elena-research", userId: "usr-faculty-001", groupId: "grp-campus-research", role: "supervisor", status: "active", joinedAt: now }),
    
    // Students
    new Membership({ _id: "mem-alex-dept", userId: "usr-student-001", groupId: "grp-cs-dept", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-alex-webdev", userId: "usr-student-001", groupId: "grp-web-dev", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-alex-fintech", userId: "usr-student-001", groupId: "grp-fintech-club", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-alex-batch2025", userId: "usr-student-001", groupId: "grp-cs-class-2025", role: "member", status: "active", joinedAt: now }),
    
    new Membership({ _id: "mem-jordan-bio", userId: "usr-student-002", groupId: "grp-bio-dept", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-jordan-research", userId: "usr-student-002", groupId: "grp-campus-research", role: "member", status: "active", joinedAt: now }),
    
    new Membership({ _id: "mem-maya-dept", userId: "usr-student-003", groupId: "grp-cs-dept", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-maya-webdev", userId: "usr-student-003", groupId: "grp-web-dev", role: "moderator", status: "active", joinedAt: now }),
    
    // Alumni
    new Membership({ _id: "mem-priya-robotics", userId: "usr-alumnus-001", groupId: "grp-robotics-club", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-priya-fintech", userId: "usr-alumnus-001", groupId: "grp-fintech-club", role: "moderator", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-priya-alumni", userId: "usr-alumnus-001", groupId: "grp-alumni-network", role: "member", status: "active", joinedAt: now }),
    
    new Membership({ _id: "mem-marcus-alumni", userId: "usr-alumnus-002", groupId: "grp-alumni-network", role: "moderator", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-marcus-dept", userId: "usr-alumnus-002", groupId: "grp-cs-dept", role: "member", status: "active", joinedAt: now }),
    
    new Membership({ _id: "mem-sara-alumni", userId: "usr-alumnus-003", groupId: "grp-alumni-network", role: "member", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-sara-webdev", userId: "usr-alumnus-003", groupId: "grp-web-dev", role: "member", status: "active", joinedAt: now }),

    // Admins & Officers
    new Membership({ _id: "mem-admin-dept", userId: "usr-admin-001", groupId: "grp-cs-dept", role: "admin", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-admin-bio", userId: "usr-admin-001", groupId: "grp-bio-dept", role: "admin", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-officer-dept", userId: "usr-officer-001", groupId: "grp-cs-dept", role: "member", status: "active", joinedAt: now }),

    // Northstar Memberships
    new Membership({ _id: "mem-amara-ai", userId: "usr-admin-northstar-001", groupId: "grp-northstar-ai", role: "admin", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-noah-community", userId: "usr-officer-northstar-001", groupId: "grp-northstar-community", role: "supervisor", status: "active", joinedAt: now }),
    new Membership({ _id: "mem-riley-ai", userId: "usr-dual-role-001", groupId: "grp-northstar-ai", role: "member", status: "active", joinedAt: now }),
  ];
  await Membership.insertMany(memberships);

  // 7. Posts: Baseline anchors + ~100 realistic posts across accessible areas
  const posts: any[] = [
    // Crucial Anchor 1: Priya (Stripe) public post matching Alex's interests
    new Post({
      _id: "post-public-001",
      authorId: "usr-alumnus-001",
      text: "Stripe is hosting a distributed systems webinar this month! Sharing tips on scalable payment architectures.",
      audienceType: "public",
      topicLabels: ["Fintech", "Distributed Systems", "Cloud"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    }),
    // Crucial Anchor 2: Marcus (DeepMind) campus post for Apex students
    new Post({
      _id: "post-campus-001",
      authorId: "usr-alumnus-002",
      text: "DeepMind information session for Apex students this Thursday on Neural Information Retrieval and Reranking.",
      audienceType: "campus",
      institutionId: "inst-apex-001",
      topicLabels: ["AI", "Search", "Reranking"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
    }),
    // Crucial Anchor 3: Elena Vance / Robotics club restricted post
    new Post({
      _id: "post-restricted-robotics-001",
      authorId: "usr-alumnus-001",
      text: "[RESTRICTED] Robotics Club Drone Flight Testing Protocols and Lab Door Access Schedule for Spring 2026.",
      audienceType: "group",
      audienceId: "grp-robotics-club",
      institutionId: "inst-apex-001",
      topicLabels: ["AI", "Robotics", "Restricted", "Lab Access"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 1),
    }),
    // Crucial Anchor 4: Alex open-source student post
    new Post({
      _id: "post-student-001",
      authorId: "usr-student-001",
      text: "Building an open-source TypeScript feed ranking micro-service. Looking for peers interested in benchmarking!",
      audienceType: "public",
      topicLabels: ["TypeScript", "Node.js", "Open Source"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 12),
    }),
    // Crucial Anchor 5: Jordan bioengineering study partner post (Anchor for Jordan top rank in tests)
    new Post({
      _id: "post-student-002",
      authorId: "usr-student-002",
      text: "Seeking study partners for bioengineering genetics lab midterm this Friday in campus library. Covering genomic data pipelines, bioinformatics sequencing, and qPCR analysis.",
      audienceType: "campus",
      institutionId: "inst-apex-001",
      topicLabels: ["Bioengineering", "Genetics", "Bioinformatics", "Data Analysis"],
      createdAt: new Date(Date.now() - 3600 * 1000 * 1), // Fresh post for Jordan
    }),
  ];

  // Templates for generating bulk realistic posts
  const bulkPostTemplates = [
    // Alumni posts (Fintech, AI, Career, Distributed Systems, Cloud)
    {
      authors: ["usr-alumnus-001", "usr-alumnus-002", "usr-alumnus-003"],
      templates: [
        { text: "Career retrospective: What I learned transitioning from student projects to production-grade distributed consensus in Go.", topics: ["Distributed Systems", "Cloud", "Career"], audience: "public" },
        { text: "Sharing recommendations for software architecture books that fundamentally changed how I reason about system bottlenecks.", topics: ["System Design", "Engineering", "Mentorship"], audience: "public" },
        { text: "Apex alumni resume review session next Tuesday. If you are preparing for SWE internship interviews, reach out via connection requests!", topics: ["Mentorship", "Career", "Internships"], audience: "campus", inst: "inst-apex-001" },
        { text: "Deep dive into Lakehouse storage formats: Parquet, Delta Lake, and how metadata indexes optimize petabyte query latency.", topics: ["Big Data", "Cloud Computing", "Data Lakehouse"], audience: "public" },
        { text: "Hot take on vector search vs lexical BM25: In real-world enterprise retrieval, hybrid search with cross-encoder reranking always wins.", topics: ["AI Research", "Search Algorithms", "Reranking"], audience: "public" },
        { text: "Fintech engineering best practices: Designing idempotent webhook delivery pipelines that guarantee zero duplicate payouts.", topics: ["Fintech", "Distributed Systems", "Payments Architecture"], audience: "group", grp: "grp-fintech-club", inst: "inst-apex-001" },
        { text: "Tips for seniors negotiating full-time entry-level offers: Understanding equity vesting, base salaries, and team matching.", topics: ["Career", "Mentorship", "Alumni"], audience: "group", grp: "grp-alumni-network", inst: "inst-apex-001" },
        { text: "Excited to share that our infrastructure team at Stripe is open-sourcing our rate-limiting middleware written in Rust and TypeScript.", topics: ["Open Source", "Fintech", "TypeScript"], audience: "public" },
        { text: "Reflecting on graduate coursework vs undergraduate fundamentals. The balance between theory and practical systems code is vital.", topics: ["Research", "Career", "Cloud"], audience: "public" },
      ],
    },
    // Student posts (CS, Bioengineering, Frontend, Campus collaboration)
    {
      authors: ["usr-student-001", "usr-student-002", "usr-student-003"],
      templates: [
        { text: "Working on implementing a Raft consensus cluster in Node.js for my capstone. Anyone want to team up for formal verification testing?", topics: ["Distributed Systems", "Node.js", "TypeScript"], audience: "campus", inst: "inst-apex-001" },
        { text: "Accessibility checklist: Making sure dynamic React modals trap keyboard focus and announce state updates to screen readers.", topics: ["Frontend", "Accessibility", "React", "Design Systems"], audience: "public" },
        { text: "Completed the first draft of our genomic pipeline parser in Python. Visualizing chromosome variants using pandas and matplotlib.", topics: ["Bioinformatics", "Python", "Data Analysis"], audience: "campus", inst: "inst-apex-001" },
        { text: "Apex Hackathon 2026 is kicking off next month! Looking for a designer with Tailwind expertise to join our team.", topics: ["Campus Events", "Design Systems", "Frontend"], audience: "campus", inst: "inst-apex-001" },
        { text: "CS Class of 2025: Reminder that final project proposals for Advanced Operating Systems are due this Friday midnight.", topics: ["Computer Science", "Class of 2025", "Campus Events"], audience: "group", grp: "grp-cs-class-2025", inst: "inst-apex-001" },
        { text: "CSS grid subgrid has completely simplified our component library layout rules. Here is a quick code pen demonstrating the pattern.", topics: ["Frontend", "CSS", "Design Systems"], audience: "group", grp: "grp-web-dev", inst: "inst-apex-001" },
        { text: "Attended the DeepMind neural retrieval talk on campus today. Mind blown by how modern re-rankers leverage attention matrices.", topics: ["AI", "Search", "Information Retrieval"], audience: "public" },
        { text: "Any bioengineering students available for a collaborative study session on CRISPR sequence alignment algorithms in the library?", topics: ["Bioengineering", "Bioinformatics", "Genomics"], audience: "group", grp: "grp-bio-dept", inst: "inst-apex-001" },
        { text: "Just pushed v1.2 of our campus open-source event calendar. Feedback and PRs from fellow students are super welcome!", topics: ["Open Source", "TypeScript", "React"], audience: "public" },
      ],
    },
    // Faculty & Supervisor posts (Robotics, CS Dept, Research announcements)
    {
      authors: ["usr-faculty-001"],
      templates: [
        { text: "Autonomous Systems Lab is recruiting 2 undergraduate research assistants for our multi-agent drone swarm project.", topics: ["Robotics", "Student Research", "AI Ethics", "Autonomous Systems"], audience: "campus", inst: "inst-apex-001" },
        { text: "Computer Science department seminar this Wednesday: Dr. Vance on 'Safe Reinforcement Learning for Physical Robotic Systems'.", topics: ["Robotics", "Computer Science", "Student Research"], audience: "group", grp: "grp-cs-dept", inst: "inst-apex-001" },
        { text: "Undergraduate Research Journal submissions are now open for peer-reviewed student papers in STEM.", topics: ["Student Research", "Academic Research", "Publications"], audience: "group", grp: "grp-campus-research", inst: "inst-apex-001" },
        { text: "Reminder to all robotics club members: Safety goggles and sign-in sheets are mandatory before powering on the high-torque actuators.", topics: ["Robotics", "Lab Access", "Restricted"], audience: "group", grp: "grp-robotics-club", inst: "inst-apex-001" },
        { text: "Congratulations to our students who presented their distributed computing papers at the regional ACM student conference!", topics: ["Student Research", "Distributed Systems", "Academic Research"], audience: "public" },
      ],
    },
    // Campus Admins & Officers (Governance, Policies, Career services, Northstar)
    {
      authors: ["usr-admin-001", "usr-officer-001", "usr-admin-northstar-001", "usr-officer-northstar-001"],
      templates: [
        { text: "Apex University Career Services announces 15 new partner employers participating in the spring tech recruitment drive.", topics: ["Career Fair", "Alumni Relations", "Audits"], audience: "campus", inst: "inst-apex-001" },
        { text: "Official accreditation review completed with distinction across all Computing and Engineering divisions.", topics: ["Institutional Strategy", "Accreditation", "Higher Ed Leadership"], audience: "public" },
        { text: "Spring campus mentorship portal registrations have crossed 500 active pairs. Thank you to our dedicated alumni mentors!", topics: ["Alumni Relations", "Mentorship", "Career"], audience: "campus", inst: "inst-apex-001" },
        { text: "Northstar Institute welcomes all incoming graduate fellows to the Applied AI research orientation this week.", topics: ["Higher Education", "Research", "AI Research"], audience: "campus", inst: "inst-northstar-002" },
        { text: "Northstar Community Outreach: Sign up for our upcoming cross-institution hackathon with regional universities.", topics: ["Student Communities", "Events", "Campus Events"], audience: "public" },
      ],
    },
  ];

  // Generate ~100 posts with staggered timestamps over the past 30 days
  // Ensure background posts have createdAt older than primary anchor posts (24+ hours ago)
  let postCounter = 1;
  for (const group of bulkPostTemplates) {
    for (const authorId of group.authors) {
      for (let i = 0; i < group.templates.length; i++) {
        const tpl = group.templates[i];
        const hoursAgo = 24 + postCounter * 6 + (i * 2); // all older than anchor posts
        const postDoc: any = {
          _id: `post-bulk-${String(postCounter).padStart(3, "0")}`,
          authorId,
          text: tpl.text,
          audienceType: tpl.audience,
          topicLabels: tpl.topics,
          createdAt: new Date(Date.now() - 3600 * 1000 * hoursAgo),
        };
        if (tpl.inst) postDoc.institutionId = tpl.inst;
        if (tpl.grp) {
          postDoc.audienceId = tpl.grp;
          postDoc.audienceType = "group";
        }
        posts.push(new Post(postDoc));
        postCounter++;
      }
    }
  }

  await Post.insertMany(posts);
  console.log(`Successfully seeded ${posts.length} posts and ${groupsToSeed.length} groups across accessible spaces!`);


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
      "create_community",
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

  const northstarCommunityLead = new RoleDefinition({
    _id: "role-northstar-community-lead",
    institutionId: "inst-northstar-002",
    scopeType: "institution",
    scopeId: "inst-northstar-002",
    name: "Community Programs Lead",
    permissions: ["moderate_student_groups"],
    createdBy: "usr-admin-northstar-001",
  });

  await RoleDefinition.insertMany([
    roleVerificationOfficer,
    roleStudentAmbassador,
    northstarCommunityLead,
  ]);

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
    new RoleAssignment({
      _id: "rass-noah-community-lead",
      userId: "usr-officer-northstar-001",
      roleDefinitionId: "role-northstar-community-lead",
      scopeType: "institution",
      scopeId: "inst-northstar-002",
      assignedBy: "usr-admin-northstar-001",
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
