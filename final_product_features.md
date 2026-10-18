# CAMPUS NETWORK — MASTER PRODUCT, ARCHITECTURE AND DEVELOPMENT PROMPT
## Building a Network, Not a Directory

Act as a senior product architect, UX designer, backend engineer, frontend engineer, database architect, and recommendation-system engineer. Your task is to design and build **Campus Network**, an institution-centric professional social networking platform that connects students, alumni, faculty, companies, founders, recruiters, and other professionals.

Do not build merely an alumni directory or a conventional social media clone. Build a trusted ecosystem in which institutions establish verified identities, administrators create structured communities, members discover relevant people and opportunities, and a personalized recommendation engine helps users find the right connections.

The primary product priorities are:

1. **Exceptional user experience:** the platform should feel intuitive, fast, coherent, and easy to navigate.
2. **Personalized discovery:** users should discover relevant posts, people, organizations, opportunities, and communities.
3. **Trust and verification:** institutional identity, professional claims, roles, and administrative privileges must have clear verification states.
4. **Secure communication:** permissions must be enforced by the backend, not merely hidden in the frontend.
5. **Practical implementation:** prioritize a working end-to-end workflow over unnecessary complexity.

Build a modular, maintainable application with clear separation between the frontend, backend, data models, permissions, recommendation engine, and real-time messaging.

---

# 1. PRODUCT VISION

Campus Network combines the most useful aspects of professional networking platforms, community platforms, institutional portals, and messaging applications.

Its fundamental principle is:

**Find the right person, not just browse a directory.**

Users should be able to discover a former student who works at a target company, identify an expert in a particular field, join a relevant institutional group, receive official announcements, explore professional discussions, and establish meaningful connections.

Institutions and companies receive their own verified spaces within Campus Network. Their authorized administrators manage affiliations, roles, communities, announcements, and access according to explicit permissions.

However, institutional control must not extend unnecessarily into private conversations between users.

The platform must maintain a distinction between:

- A verified institution or organization.
- A verified affiliation with that institution.
- An employer-verified employment claim.
- A self-reported employment claim.
- A platform connection between two people.
- A group membership.
- Permission to post or broadcast within a group.
- Permission to communicate privately.

These are separate states and must never be treated as interchangeable.

# 2. USER TYPES AND ACCESS LEVELS

Implement the following user categories.

## 2.1 Campus Network verifier

The verifier is an authorized platform-level operator responsible for verifying institutions and companies.

Verifiers belong to the Campus Network platform administration team. They are not ordinary institution administrators.

Their responsibilities include:

- Reviewing institution and company registration requests.
- Checking whether a request appears official and authentic.
- Approving or rejecting organization verification requests.
- Assigning the initial Super Admin or authorized founding administrators for an approved institution or company.
- Issuing a unique, human-readable institutional or organizational identifier.
- Suspending or revoking organizational verification when necessary.
- Reviewing suspicious registrations and ownership disputes.
- Maintaining an audit trail of verification and administrative decisions.

A verifier must not be able to impersonate ordinary users or inspect private conversations by default merely because they have platform-level privileges.

## 2.2 Institution or company Super Admin

Every approved organization should have an authorized Super Admin.

The initial Super Admin must be appointed through the Campus Network verifier workflow. An institution must not be able to appoint its first Super Admin independently and bypass platform verification.

Super Admin responsibilities include:

- Managing the organization's community space.
- Reviewing affiliation or membership verification requests.
- Creating institution-specific roles.
- Assigning roles to eligible, verified people.
- Creating, editing, archiving, and managing groups.
- Selecting group members individually or through carefully defined eligible-member filters.
- Assigning group administrators and supervisors.
- Managing restricted-group access requests.
- Publishing official announcements within their authorized scope.
- Viewing relevant counts and administrative summaries.
- Managing institutional branding and display identifiers within platform rules.
- Reviewing moderation reports within their scope.
- Escalating problems to Campus Network administration.

A Super Admin's authority applies only to their organization and authorized descendants or groups. It must not grant universal administrative access to other institutions, organizations, or private user conversations.

## 2.3 Institution or company administrator

Super Admins may create additional administrative roles and assign responsibilities to verified members.

These roles may include:

- Verification administrator.
- Group administrator.
- Group moderator.
- Department administrator.
- Announcement publisher.
- Placement or career-services administrator.
- Community supervisor.

Each role must have explicit, scoped permissions. A role label alone must never grant permissions.

## 2.4 Default user

A default user is any ordinary Campus Network member, including a student, alumnus, faculty member, founder, recruiter, or unaffiliated professional.

A user can:

- Create and manage their own profile.
- Have multiple institutional affiliations.
- Belong to multiple groups.
- Follow people and topics.
- Publish posts within permitted audiences.
- Discover profiles, posts, groups, institutions, companies, and opportunities.
- Send connection requests.
- Accept or decline connection requests.
- Request access to restricted groups.
- Receive announcements from groups they are authorized to access.
- Control their own interest profile and feed preferences.
- Block users and report inappropriate content.

Users must not need to be institution-verified to use every public feature of Campus Network. However, unverified accounts must be clearly labeled and must not receive verified institutional privileges.

# 3. ORGANIZATION REGISTRATION AND VERIFICATION

Build a dedicated organization onboarding workflow.

## 3.1 Institution and company registration

An institution or company submits a registration request containing the relevant information:

- Official organization name.
- Organization type.
- Official website.
- Country and location where appropriate.
- Official contact email and domain.
- Organization description.
- Registration or institutional evidence where applicable.
- Authorized representative's name and contact details.
- Supporting evidence required by the Campus Network verification policy.

The submission is initially marked Pending.

The organization must not become verified merely because someone possesses an email address or completes a form.

Email-domain ownership can support verification, but it may not be sufficient on its own to establish authority to represent an organization.

## 3.2 Verifier dashboard

Create a dedicated verifier dashboard with a queue of pending institution and company requests.

The dashboard should display:

- Organization details.
- Submission date.
- Submitter information.
- Supporting evidence.
- Domain and website information.
- Review status.
- Previous decisions, where applicable.
- Risk indicators or duplicate-registration warnings.

The verifier can approve, reject, request additional evidence, or escalate a request.

Every decision should include the reviewing verifier, timestamp, decision, and reason.

Use explicit states such as:

- Pending.
- Under Review.
- More Information Required.
- Approved.
- Rejected.
- Suspended.
- Revoked.

Rejected or suspended organizations must not continue to display an active verified badge.

## 3.3 Assigning the founding Super Admin

After approving an institution or company, the verifier selects and appoints its initial Super Admin.

The appointed person must have a platform account, or receive a secure invitation to create one.

The invitation must be bound to the intended organization and role, expire after a defined period, and be single-use.

The Super Admin appointment becomes effective only when the invitation is accepted and the required identity checks are completed.

The verifier's organization-level setup work is then largely complete. Ongoing organizational operations are managed by the appointed administrators, subject to platform-wide policies, auditing, and escalation.

## 3.4 Organization identifiers

Each verified organization receives a unique, human-readable identifier.

Examples:

- Indian Institute of Technology Delhi: IITD.
- Stripe: STR.

These are illustrative identifiers and must be checked for uniqueness before assignment.

Allow a display name, canonical organization ID, short code, and optional approved abbreviation to coexist.

If two institutions have similar names or abbreviations, resolve the collision using a uniqueness check and an appropriate alternative.

Organization codes are for identification, navigation, and display. They are **not authentication credentials or security tokens**.

# 4. INSTITUTIONAL IDENTITY AND AFFILIATION VERIFICATION

A person has one global Campus Network identity but may have multiple institutional affiliations.

For example, someone could be an alumnus of one university, a current faculty member at another, and a member of a professional organization.

Do not create duplicate user accounts to represent these relationships.

## 4.1 Affiliation types

Support affiliation categories including:

- Student.
- Alumnus or alumna.
- Faculty.
- Guest faculty.
- Researcher.
- Staff member.
- Placement representative.
- Other organization-approved categories.

The exact categories should be configurable rather than permanently hard-coded.

## 4.2 Verification workflow

An individual submits a request to associate their profile with a verified institution.

The request may include:

- Institution.
- Requested affiliation type.
- Programme or degree.
- Department.
- Batch or graduation year where applicable.
- Official email or institutional identifier.
- Supporting evidence required by policy.

The institution's authorized verification administrator reviews the request and approves, rejects, or requests additional information.

Once approved, the person's profile displays an institutional verification badge and the relevant verified affiliation.

The verified label must communicate precisely what was checked.

Institution verification does not automatically verify the person's current employer, salary, job title, skills, or every other profile claim.

Employment claims require a separate status, such as Self-Reported, Pending Verification, Employer-Verified, or Stale.

## 4.3 Verification queue

The organization dashboard must include a dedicated verification queue with:

- Pending applications.
- Applicant profile.
- Requested affiliation.
- Submitted evidence.
- Approve and reject actions.
- Rejection reason or request for additional evidence.
- Verification history.
- Timestamp and reviewer information.

The user must receive an in-app status update when their application changes state.

Make this workflow easy to understand and avoid unnecessary steps.

# 5. ROLE CREATION AND ORGANIZATION IDENTIFIERS

Super Admins can create organization-specific roles and assign eligible roles to verified people.

## 5.1 Role creation

A role should contain:

- Role name.
- Display abbreviation.
- Organization.
- Optional group or department scope.
- Permissions.
- Eligibility requirements.
- Status.
- Creator and creation timestamp.

Examples include:

- Guest Faculty.
- Placement Coordinator.
- Department Administrator.
- Group Supervisor.
- Announcement Publisher.

A Super Admin can decide the display prefix, abbreviation, or naming convention subject to uniqueness and platform rules.

## 5.2 Human-readable role identifiers

Use readable identifiers to show institutional context.

For example:

`IITD / Faculty / Sunil Pal`

Or a compact handle such as:

`GA-IITD-00481`

The displayed form is customizable, but the underlying user ID, role assignment ID, organization ID, and scope ID must remain separate.

A hash or unique suffix may be appended for collision avoidance. Do not use a predictable hash or readable identifier as proof of authorization.

## 5.3 Role assignments

Role assignment must be stored as a real database relationship.

A role assignment must include:

- User.
- Organization.
- Role definition.
- Scope.
- Status.
- Assigned by.
- Assignment date.
- Expiry or review date where applicable.

Only authorized administrators can assign roles within their scope. A user cannot grant themselves an administrative role by changing their profile fields, email, display name, or handle.

When a role is revoked, the corresponding permissions must stop working immediately, including on active sessions and real-time connections.

# 6. INSTITUTIONAL COMMUNITY AND GROUP MANAGEMENT

Each verified organization has a community space managed by its authorized administrators.

The institution can see relevant counts of verified people available on Campus Network, subject to privacy and authorization rules.

Provide separate, clearly labeled counts for:

- Pending affiliation requests.
- Verified students.
- Verified alumni.
- Verified faculty and staff.
- Other verified members.
- Active groups.
- Pending restricted-group requests.

Counts should represent distinct people within the selected organization scope. Do not count the same person repeatedly merely because they have several memberships.

## 6.1 Institution hierarchy

Support the following hierarchy:

Institution → Programme → Department → Batch/Section → Group.

Groups may also exist directly at the institutional level.

Each group should have a stable ID, name, description, parent group if any, creator, organization, visibility policy, membership policy, posting policy, and administrative scope.

Do not rely on group names alone to establish identity or access.

## 6.2 Group creation

Authorized Super Admins can create groups.

During creation, they specify:

- Group name.
- Unique organization-scoped slug or identifier.
- Description.
- Parent group or institutional unit, if applicable.
- Group visibility.
- Membership policy.
- Posting policy.
- Eligible audience.
- Initial members.
- Group administrators and moderators.
- Announcement permissions.

The interface should let administrators select members individually or choose a supported filter, such as verified alumni of a specific department.

If bulk selection is available, preview the resulting recipient count before confirming.

Show the administrator a clear summary of group settings and members before creation.

Enforce uniqueness of the group slug within the relevant organization namespace. If a collision occurs, offer alternatives rather than failing silently.

## 6.3 Group membership and permissions

Separate the following concepts:

**Discoverability:** Whether the group can appear in search or browsing.

**Read access:** Whether the person can see group posts and members.

**Membership:** Whether the person is currently a member.

**Posting permission:** Whether the member can post or comment.

**Broadcast permission:** Whether the member can send announcements to the group.

A group may be publicly discoverable but require approval before membership. Another may be invisible to non-members.

Being verified by an institution must not automatically grant access to every restricted group in that institution.

A group administrator can manage only groups and actions that fall within their assigned scope.

## 6.4 Group access requests

For groups that require approval, users can request access.

The request includes the requester, group, optional reason, status, and timestamps.

Authorized reviewers can approve or decline the request.

The applicant must receive the result.

Prevent duplicate active requests and repeated notifications for the same unchanged state.

Approval grants only the permissions specified by the group policy; it does not create a personal connection or grant unrestricted institutional privileges.

## 6.5 Group administrators

A group creator can appoint eligible group administrators and moderators if authorized to do so.

These roles should support different levels of control.

For example:

- A group moderator can manage reported content.
- A group administrator can manage membership and group settings.
- An announcement publisher can broadcast official messages.
- A read-only supervisor may inspect relevant membership and moderation states without posting.

Do not assume every group administrator can perform every action.

# 7. BROADCASTS AND INSTITUTIONAL COMMUNICATION

Group administrators can publish announcements to their authorized groups.

An announcement should appear as a group message or notification for eligible recipients, depending on their notification settings and the product's delivery policy.

Support:

- Message text.
- Optional attachment or link.
- Author identity and role.
- Group or recipient scope.
- Creation timestamp.
- Edit or deletion policy.
- Delivery and read state where implemented.

The UI should distinguish official announcements from ordinary member posts.

A member who is not an administrator must not be able to impersonate an announcement publisher.

Broadcast recipients must be resolved from the database using authorized group membership and role assignments. Never use a prefix, suffix, or token supplied by the caller as proof of authorization.

Also support institution-level announcements that are directed to all eligible members or a permitted segment, such as students in a particular programme.

Institution-to-individual messages must be represented as an official communication workflow with clear sender identity, intended recipient, and permissions. They are not the same as ordinary private user-to-user chats.

For the MVP, use an in-app notification system. Email, push notifications, scheduling, delivery retries, and advanced announcement analytics can be added later.

# 8. PERSONAL PROFILES AND PROFESSIONAL IDENTITY

Each user should have a polished professional profile.

Support:

- Name and profile photo.
- Bio.
- Institutions and affiliations.
- Affiliation verification labels.
- Department, programme, batch, or graduation year where relevant.
- Company and job title.
- Employment verification status.
- Skills and areas of expertise.
- Interests.
- Portfolio or personal website.
- Public projects or professional work.
- Mentorship availability.
- Referral availability.
- Availability for general professional questions.
- Privacy settings.
- Follow and connection status.

The profile must visually distinguish verified facts from self-reported information.

Do not overwhelm viewers with every database field. Present the most relevant information first and offer expandable sections for detail.

Users must be able to control their public profile information and availability without losing their institutional membership.

# 9. DISCOVER — PROFESSIONAL SEARCH AND NETWORK DISCOVERY

Build an advanced discovery page that helps users find relevant people, institutions, companies, groups, posts, and opportunities.

Search should not be a basic text box with an unfiltered list.

## 9.1 Search categories

Provide distinct result categories:

- People.
- Companies and organizations.
- Institutions.
- Groups and communities.
- Posts and discussions.
- Opportunities, when supported.

## 9.2 People search

Support filters for:

- Name.
- Institution.
- Affiliation type.
- Programme.
- Department.
- Batch or graduation year.
- Company.
- Role or job title.
- Skills.
- Location.
- Mentorship or referral availability.
- Verification status.

Structured filters must match explicit fields, while text search can match profile descriptions and related fields.

## 9.3 Search result cards

People result cards should show relevant facts such as:

- Name.
- Profile image.
- Verified affiliation.
- Current employment claim and verification label.
- Role and skills relevant to the query.
- Mutual connections or shared institutional context where appropriate.
- Mentorship or referral availability.
- Connection status.

Explain why a result matches. Example:

“Verified IIT Delhi alumnus · Backend engineering · Works at Oracle · Open to mentorship.”

Do not claim that an employment status or role is current unless its data supports that claim.

## 9.4 Connecting with unverified users and companies

Users should be able to discover and initiate contact with publicly discoverable users, including unverified users, where those users permit such interactions.

Keep verification status visible and distinguish verified organizations, verified affiliations, and unverified public accounts.

Unverified status must not automatically make a person invisible. Instead, apply appropriate limits to administrative privileges, restricted groups, official announcements, and institutional claims.

When a user initiates contact, use a clear connection or contact-request workflow rather than immediately exposing a private messaging channel.

Company pages can provide an authorized representative or official contact path. A company profile should not automatically give all its employees access to the company's administrative capabilities.

# 10. CONNECTION REQUESTS AND PRIVATE MESSAGING

A personal connection is a bilateral relationship separate from institutional verification and group membership.

## 10.1 Connection workflow

Users can send connection requests to other eligible users.

A request may include a short purpose-specific introduction, such as:

- Requesting mentorship.
- Asking about a career path.
- Seeking a referral.
- Discussing a project.
- General professional networking.

The recipient can accept or decline.

Only an accepted connection unlocks private one-to-one messaging in the MVP.

Support incoming requests, outgoing requests, pending state, accepted connections, declined requests, duplicate-request prevention, and blocking.

Use request limits and allow users to pause or limit incoming requests.

## 10.2 Blocking

A user can block another user.

Blocking must prevent new direct communication and apply consistently to profile recommendations, search results where applicable, connection requests, and messaging.

Blocking should not automatically remove either person's shared institutional memberships.

Define a clear policy for historical messages and conversation visibility after a block.

## 10.3 Real-time messaging

Use Socket.IO for real-time communication, with MongoDB storing durable messages and conversation records.

The backend must verify, on every relevant operation, that:

- The authenticated user is a participant in the conversation.
- The connection is accepted.
- Neither party is blocked in a way that prohibits communication.
- The requested conversation room is authorized.
- The payload is valid and within defined limits.

Persist a message before acknowledging successful sending. Socket room names are not authorization controls.

Private messages must not be accessible to institution or group administrators by default.

If time is limited, complete the connection-acceptance gate first, then implement real-time chat as a stretch feature.

# 11. PERSONALIZED HOME FEED — A CORE PRODUCT PRIORITY

The home feed is one of the most important features of Campus Network.

Do not make it a generic chronological stream of every post from the user's institution.

Design a personalized feed that understands the user's interests and professional goals, while introducing relevant people and ideas beyond the user's immediate circle.

The feed should feel useful from the first session and progressively improve as the user interacts with the platform.

## 11.1 Feed tabs

Provide three main personalized tabs:

### For You

This feed introduces users to content across the wider Campus Network.

It may include:

- Public professional posts.
- Relevant discussions.
- Posts from people connected to the user's interests.
- Relevant content from outside the user's institutions.
- Posts from people the user follows.
- Professional opportunities.
- Relevant activity from the broader network.
- Discovery of new authors and adjacent interests.

The purpose is to expand the user's professional horizon without making the feed feel random.

### Alumni

This feed emphasizes relevant posts from eligible alumni affiliated with the user's selected institution or institutions.

Content may include career experiences, professional discussions, mentorship, job opportunities, industry insights, and community activity.

Use actual verified affiliation records to determine eligibility. Do not infer alumni status from a name, email string, or unverified profile claim.

### Students

This feed emphasizes relevant posts from eligible student communities.

Content may include projects, campus activities, collaborations, technical discussions, events, and student opportunities.

Only include posts the viewer is permitted to see.

Allow an institution selector where users have multiple affiliations or need to switch institutional context.

An optional Following feed can provide a more predictable feed of followed accounts and topics. A Latest or Chronological option should also be available where appropriate.

## 11.2 Personalized interest map

Build a user interest map that evolves based on appropriate, disclosed activity.

The system may use:

- Declared interests.
- Followed topics.
- Search queries.
- Followed users.
- Posts opened and meaningfully read.
- Saves.
- Likes.
- Comments.
- Shares.
- Explicit “Not interested” feedback.
- Muted topics and blocked authors.

Do not silently mine private one-to-one message contents for interest extraction.

### Topic normalization

The system must recognize that related terms can refer to the same topic.

Examples:

- “Postgres” and “PostgreSQL.”
- “ML” and “Machine Learning.”
- “Backend” and “Backend Engineering.”
- “System Design” and “Distributed Systems,” when the content context supports that relationship.

Start with a manageable topic taxonomy containing canonical terms, aliases, categories, and parent-child relationships.

Use semantic similarity as a later improvement to match content by meaning even when the wording differs.

### Interest profile

Maintain topic scores for each user.

A topic profile may distinguish:

- Long-term interests.
- Short-term intent.
- Explicitly selected interests.
- Inferred interests.
- Negative preferences.

A search for “Oracle internship” should influence recommendations related to that current goal without forcing every future feed to focus on Oracle.

Use time decay to reduce the influence of old activity.

One possible starting rule is:

Interest(user, topic) = sum of signal weight × exponential time-decay factor.

Initial weights must be configurable and evaluated against observed usefulness; they are not proven constants.

Offer user controls to inspect, correct, mute, reset, or disable inferred interests.

### 11.2.1 15-Topic Noun Affinity Engine & Semantic Validation

To prevent topic pollution, noise bloat, and engagement spam from distorting user profiles, the topic engine enforces strict semantic validation and a hard cardinality ceiling:

1. **Maximum Cardinality Cap (15 Topics):**
   - The user's active topic map output (`getUserTopicMap`) is strictly capped at the **top 15 topics** (`MAX_TOPIC_MAP_ENTRIES = 15`), sorted by composite decay score descending (`Score = 0.6 × ShortTerm + 0.4 × LongTerm`).
   - Profile interests (`PATCH /api/me/interests`) are capped at a maximum of 15 explicit concepts.

2. **Strict Noun & Noun-Phrase Parsing (`isValidTopicNoun`):**
   - **Length Bounds:** 2 to 35 characters.
   - **Word Limit:** 1 to 3 words maximum (e.g. `Distributed Systems`, `Machine Learning`, `Quantum Computing`). Sentences and multi-word commentary are strictly rejected.
   - **Bogus Filler Word Blacklist:** Automatically rejects phrases containing conversational filler words, internet slang, non-nouns, pronouns, and filler verbs (e.g., `stuff`, `really`, `today`, `awesome`, `things`, `cool`, `update`, `hello`, `doing`, `please`, `good`, `bad`, `nice`, `great`, `lol`).
   - **Technical Naming Patterns:** Fully supports valid technical nomenclature including symbols (`.`, `#`, `+`, `-`), such as `c++`, `c#`, `node.js`, `.net`, and `web3`.
   - **Noise Elimination:** Rejects pure numbers (`12345`), pure punctuation (`???`, `---`), and strings without letters.

3. **End-to-End Ingestion Gates:**
   - **Profile Interests:** `PATCH /api/me/interests` validates all submitted items against `isValidTopicNoun`, rejecting bogus filler phrases with HTTP 400 Bad Request.
   - **Signal Recording:** `recordTopicSignal` and `recordTopicFollow` verify candidates prior to persisting short-term or long-term interest vectors.

### 11.2.2 Post Muting & Negative Term Complete Exclusion Pipeline

When a user mutes topics or terms (e.g. `crypto`, `layoffs`, `politics`, `fintech`):
- **Pre-Ranking Exclusion:** The candidate filter inspects both declared `topicLabels` and post body `text` using whole-word boundary regular expressions (`/(^|\W)term(\W|$)/i`).
- **Complete Omission (`do not include it`):** Any post containing any muted word is completely eliminated from the eligible candidate pool before scoring. It is never included in the returned feed results, not merely downranked.
- **Absolute Priority Over Positive Signals:** Even if a user has a high positive topic affinity (e.g. 95% affinity in Distributed Systems), if that post contains a muted word (e.g. `crypto`), it is strictly excluded. Muting is an inviolable negative gate.
- **Immediate Reversibility:** Updating feed preferences to remove the muted term immediately restores matching posts to their proper ranked positions.
- **Positive Content Promotion:** Non-muted posts with matching declared interests, verified authors, high substantive text length, and recent timestamps are scored and placed at the top of the feed.

### 11.2.3 Needs-Based Alumni Network Ranking Engine (`computeAlumniNeedsScore`)

When students and members search the alumni network—particularly when applying for **Job Referrals**, seeking **Mentorship**, or requesting **Career Q&A**:
- **Referral Readiness Boost (+40 pts):** Alumni who have explicitly enabled referrals (`availableForReferrals: true`) and whose requests are active (`pauseIncomingRequests: false`) receive top priority.
- **Penalty for Paused/Disabled Requests (-40 pts / -30 pts):** Alumni who have paused requests or disabled referrals are ranked at the bottom.
- **Employer Verification Trust (+45 pts total):** Verified employees at the target company (`verificationStatus: "verified"` or `status: "employer-verified"`) receive +25 general verification boost + 20 target company boost, ensuring students reach professionals who can genuinely submit internal ATS referrals.
- **Alma Mater Synergy (+15 pts):** Alumni from the student's own institution receive an alma mater affinity boost.
- **Department & Degree Alignment (+10 pts):** Alumni from the same academic programme or department receive relevance boosts.
- **Skill Overlap (+15 pts max):** Shared technical and professional skills provide granular rank refinement.
- **Transparent Match Metrics:** Every returned alumnus includes an interpretable `relevanceScore` (1–100%) and `rankingReasons` explaining why they were recommended (e.g. `["Available for job referrals", "Employer-verified at Stripe", "Fellow alma mater member"]`).
- **Dual Discovery Access:** Provided via `GET /api/discover/alumni` (accessible to all verified students and members) and `GET /api/discover/people` (for alumni).

## 11.3 Feed-ranking architecture

Build the feed as a staged system.

1. Generate candidate posts from recent posts, follows, matching topics, institutional indexes, graph relationships, and a controlled discovery pool.
2. Filter inaccessible, blocked, deleted, moderated, or otherwise ineligible content before ranking.
3. Compute relevance features.
4. Apply a baseline ranker or optional FlashRank-based reranker.
5. Apply freshness, diversity, repetition, and discovery controls.
6. Revalidate permissions before returning the feed.
7. Record impressions and appropriate feedback for later evaluation.

Never run an expensive model against the entire post database for every feed request. Retrieve a limited set of candidates, rank those candidates, and paginate the result.

## 11.4 Initial ranking signals

Begin with an interpretable, configurable ranking score. Potential signals include:

- Topic relevance.
- Recent search intent.
- Meaningful interaction history.
- Follow relationships.
- Social graph proximity.
- Institutional relevance.
- Content freshness.
- Content quality.
- Relevant verification status.
- Normalized popularity.
- Author and topic diversity.
- Negative feedback.

For a first experiment, a possible baseline is:

- Topic relevance: 28%.
- Behavioural relevance: 20%.
- Graph affinity: 15%.
- Freshness: 12%.
- Content quality: 10%.
- Relevant verification: 10%.
- Normalized popularity: 5%.

Treat these values as tunable hypotheses. Normalize feature values and evaluate whether they improve useful discovery.

Do not allow popularity or verified status alone to make a post dominate a feed.

Verification is a trust attribute, not proof that every post is relevant or valuable.

## 11.5 FlashRank and deterministic fallback

Implement a ranking interface that allows different ranking systems to be substituted without rewriting feed retrieval or permission enforcement.

The baseline ranking mode must work independently of FlashRank.

If using FlashRank, pass only already-eligible candidates to the reranker. Configure timeouts and handle errors gracefully.

If the reranker is unavailable, return eligible posts using deterministic baseline ranking or chronological ordering.

A model failure must never make the feed unusable or expose inaccessible posts.

## 11.6 Diversity and discovery

A personalized feed should not repeatedly show the same author or a wall of posts about one narrow topic.

Apply practical controls such as:

- Limiting repeated posts from the same author within a short sequence.
- Removing or penalizing near-duplicate posts.
- Balancing known interests with adjacent topics.
- Including relevant authors outside the immediate network.
- Reserving some opportunities for discovery.
- Respecting explicit negative feedback.
- Avoiding repetitive recommendations that the user repeatedly skips.

The discovery budget should be configurable and evaluated, not fixed permanently without evidence.

## 11.7 Cold-start experience

A first-time user may have no interaction history.

Do not show a broken or empty personalized feed simply because the algorithm has not learned enough.

Offer a lightweight onboarding flow in which users can select a few interests, skills, industries, and goals. Do not force them to complete a long questionnaire.

Use institution and profile context only where available and appropriate, then progressively personalize based on subsequent interactions.

Always provide useful fallback content and a clear path to search for people or topics manually.

## 11.8 “Why am I seeing this?”

For recommendations, provide a concise, understandable explanation where useful.

Examples:

- “Because you follow distributed systems.”
- “Popular among people in your department.”
- “Matches your recent search for backend internships.”
- “Posted by an alumnus from your selected institution.”

Explanations must correspond to real ranking signals and must not reveal private information about another user.

# 12. SOCIAL GRAPH AND NETWORK-AWARE DISCOVERY

Maintain a graph of professional relationships, follows, institutional affiliations, group memberships, organization relationships, and meaningful public interactions.

For the MVP, this can be represented through MongoDB collections and computed ranking features. Do not introduce a dedicated graph database unless actual requirements justify it.

Distinguish:

- Direct accepted connections.
- Followed accounts.
- Followed topics.
- Shared group membership.
- Shared institutional affiliation.
- Second-degree relationships.
- Broader community relationships.

Use graph features to improve candidate discovery and ranking, not to block discovery beyond the user's immediate circle.

A less-connected person with highly relevant expertise must still be discoverable.

Avoid turning popularity into a self-reinforcing feedback loop. Evaluate graph relevance alongside content relevance, freshness, and diversity.

# 13. ADMIN DASHBOARDS AND ORGANIZATION MANAGEMENT

Provide separate dashboard experiences for Campus Network verifiers, organization Super Admins, other administrators, and ordinary members.

Do not present every role with one confusing administrative interface.

## 13.1 Campus Network verifier dashboard

Include:

- Pending organization registrations.
- Organization detail and evidence review.
- Approve, reject, request evidence, suspend, and revoke actions.
- Initial Super Admin appointments.
- Duplicate or suspicious organization indicators.
- Verification history and audit events.

## 13.2 Organization dashboard

Include:

- Organization profile and verification status.
- Verified-member counts.
- Affiliation verification queue.
- Role management.
- Community and group management.
- Group access requests where permitted.
- Announcement management.
- Administrative activity and audit history.
- Moderation overview.
- Escalation to Campus Network.

## 13.3 Default user dashboard

Include:

- Personalized home feed.
- Alumni and Students feeds.
- Discover.
- Institutional communities.
- Connection requests.
- Group invitations and access requests.
- Notifications.
- User profile and verification status.
- Interest controls and privacy settings.
- Messages, if enabled.

The interface should make the next useful action obvious without overwhelming users with administration-style menus.

# 14. NOTIFICATIONS

Implement in-app notifications for important product events.

Examples:

- Connection request received.
- Connection accepted or declined.
- Group access request decision.
- Invitation to a group.
- Affiliation verification approved or rejected.
- Announcement from an authorized institution or group.
- Relevant moderation status updates.
- New private message, if messaging is implemented.

Notifications must be visible only to their intended recipients.

Support unread state and read timestamps. Prevent duplicate notifications for repeated processing of the same event.

For the MVP, use a simple notification collection and API. More advanced delivery channels, batching, push notifications, and configurable delivery schedules can come later.

# 15. MODERATION, REPORTING, AND PRIVACY

Provide reporting for users, posts, groups, organizations, and administrative conduct where relevant.

A report should include:

- Reporter.
- Target.
- Reason.
- Creation timestamp.
- Current status.
- Assigned reviewer.
- Resolution.
- Escalation history.

Moderation should have explicit states such as Submitted, Assigned, Under Review, Resolved, Rejected, and Escalated.

Provide an independent escalation path for reports involving senior administrators, role conflicts, or potential abuse of authority.

Private messages must not be open to routine institutional inspection.

Do not put message bodies in ordinary application logs or audit events.

Use role-scoped moderation views and make sure users can report problematic conduct without giving the reported person control over their complaint.

# 16. USER EXPERIENCE AND INTERFACE DESIGN

User experience is a first-class requirement, not a final styling task.

Create a clean, modern, professional interface that feels like a coherent network rather than a collection of administrative forms.

Use consistent typography, spacing, component patterns, status labels, and interaction states.

## 16.1 Main navigation

The main navigation should provide quick access to:

- Home.
- Discover.
- Communities.
- Notifications.
- Connections.
- Messages, if enabled.
- Profile.

Administrative dashboards should be available only to users with the relevant permissions.

## 16.2 Feed interface

The feed should include:

- Clear tabs for For You, Alumni, and Students.
- An obvious post composer.
- Readable content cards.
- Author identity and verification labels.
- Topic or context indicators where useful.
- Relevant actions such as like, comment, save, follow, and not interested, depending on implemented scope.
- Loading skeletons rather than abrupt blank areas.
- Meaningful empty states.
- Error states with a retry action.
- Stable pagination or controlled infinite scrolling.
- Refresh behaviour that avoids surprising jumps in reading position.

Users should be able to distinguish sponsored or official content from ordinary user posts if those features are introduced later.

## 16.3 Discovery interface

Provide a prominent search field with autocomplete and clear filters.

Make the result type and key matching information immediately visible.

Provide useful empty states and suggestions when a search returns no results.

Do not hide verification status or connection status deep inside profile pages.

## 16.4 Forms and workflows

Keep registration, verification requests, role creation, group creation, and access requests short and understandable.

Use appropriate form validation, clear field labels, inline errors, progress indicators for asynchronous operations, and confirmation messages for consequential actions.

Provide confirmation dialogs for destructive or high-impact actions.

Do not make users re-enter information unnecessarily.

## 16.5 Responsive design and accessibility

Support desktop and mobile layouts.

Ensure important workflows remain usable on smaller screens.

Use accessible contrast, keyboard navigation, clear focus states, semantic elements, descriptive buttons, and status indicators that do not rely solely on color.

Optimize loading states and interaction feedback so the application feels responsive even when the backend or ranking service is slow.

# 17. TECHNICAL ARCHITECTURE

Use this default implementation stack unless the existing repository establishes an equivalent working setup.

**Frontend**
- React.
- TypeScript.
- Vite.
- Tailwind CSS or an existing consistent design system.

**Backend**
- Node.js.
- TypeScript.
- Express.
- Validation middleware such as Zod or an equivalent schema validator.

**Database**
- MongoDB.
- Official MongoDB driver or Mongoose, selected consistently throughout the project.

**Real-time communication**
- Socket.IO.
- MongoDB as persistent message storage.
- Redis only if needed for multi-instance real-time delivery, caching, rate limiting, or another justified purpose.

**Recommendation system**
- A model-independent ranking interface.
- A deterministic baseline ranker.
- Optional FlashRank integration.
- A clean fallback when the reranker is unavailable.

Keep the implementation as a modular monolith for the MVP. Do not add microservices, a separate graph database, a vector database, or an expensive LLM pipeline without a demonstrated need.

# 18. MONGODB DATA MODEL

Design collections with stable IDs, explicit relationships, appropriate indexes, and clear permission semantics.

At minimum, consider the following collections:

- users
- institutions
- organizations
- organizationVerificationRequests
- affiliations
- employmentClaims
- roleDefinitions
- roleAssignments
- groups
- memberships
- groupAccessRequests
- posts
- comments
- postInteractions
- follows
- topicDefinitions
- userTopicInterests
- connections
- blocks
- conversations
- messages
- notifications
- reports
- auditEvents

Use separate collections for independently permissioned or growing relationships such as memberships, messages, connections, and interactions.

Enforce unique constraints where appropriate, including:

- Organization identifiers.
- Organization-scoped group slugs.
- User/group memberships.
- User/topic relationships.
- Follow relationships.
- Connection pairs, normalized so two directional duplicates cannot exist.
- Active group access requests.
- Conversation identity for a pair of users where the product requires only one direct conversation.

Validate relationship ownership and permissions in the service layer. A stored reference alone does not establish authorization.

Use timestamps consistently and paginate with stable cursors.

Design state transitions to be idempotent so retried HTTP requests and socket events do not create duplicated relationships, messages, or notifications.

Do not store every impression forever by default. Establish a reasonable event retention strategy and keep private message content separate from personalization logs.

# 19. BACKEND MODULES

Organize the backend into clearly separated modules, for example:

- auth
- users
- institutions
- organizations
- verification
- roles
- groups
- posts
- feed
- interests
- discovery
- connections
- messaging
- notifications
- moderation
- audit
- shared database and permission utilities

Each module should contain relevant routes, schemas, service functions, persistence logic, and tests.

Do not put all application logic inside Express route handlers.

Create a central permission service or a small set of domain-specific authorization utilities that are reused consistently throughout the backend.

# 20. API DESIGN

Implement the following endpoint families or equivalent routes that fit the existing application architecture.

## Identity and profiles

- GET /api/me
- PATCH /api/me/profile
- GET /api/users/:userId
- PATCH /api/me/privacy
- GET /api/users/:userId/affiliations
- POST /api/affiliation-requests
- GET /api/me/affiliation-requests

## Organization verification

- POST /api/organization-registrations
- GET /api/admin/organization-registrations
- GET /api/admin/organization-registrations/:id
- PATCH /api/admin/organization-registrations/:id
- POST /api/admin/organizations/:id/appoint-super-admin
- PATCH /api/admin/organizations/:id/verification

Only authorized Campus Network verifiers can use platform-level verification operations.

## Institutional affiliation and roles

- GET /api/institutions/:id/tree
- GET /api/organizations/:id/verification-requests
- PATCH /api/affiliation-requests/:id
- GET /api/organizations/:id/roles
- POST /api/organizations/:id/roles
- PATCH /api/roles/:roleId
- POST /api/role-assignments
- PATCH /api/role-assignments/:assignmentId

Every operation must check organization scope and the caller's actual assigned permissions.

## Groups

- GET /api/organizations/:id/groups
- POST /api/organizations/:id/groups
- GET /api/groups/:groupId
- PATCH /api/groups/:groupId
- POST /api/groups/:groupId/members
- DELETE /api/groups/:groupId/members/:userId
- GET /api/groups/:groupId/access-requests
- POST /api/groups/:groupId/access-requests
- PATCH /api/group-access-requests/:requestId
- POST /api/groups/:groupId/posts

## Posts and feeds

- GET /api/feed
- POST /api/posts
- GET /api/posts/:postId
- PATCH /api/posts/:postId
- DELETE /api/posts/:postId
- POST /api/posts/:postId/interactions
- GET /api/posts/:postId/comments
- POST /api/posts/:postId/comments

Implement only the interaction types that have been built, and enforce permissions for every operation.

## Discover

- GET /api/discover/people
- GET /api/discover/organizations
- GET /api/discover/institutions
- GET /api/discover/groups
- GET /api/discover/posts

Support structured filters, pagination, visibility checks, and appropriate indexing.

## Follows and interests

- POST /api/users/:userId/follow
- DELETE /api/users/:userId/follow
- POST /api/topics/:topicId/follow
- DELETE /api/topics/:topicId/follow
- GET /api/me/interests
- PATCH /api/me/interests
- POST /api/me/interests/reset

Provide a clear user-facing interest-control workflow.

## Connections

- POST /api/connections
- GET /api/connections
- GET /api/connections/requests/incoming
- GET /api/connections/requests/outgoing
- PATCH /api/connections/:connectionId
- POST /api/users/:userId/block
- DELETE /api/users/:userId/block

## Notifications

- GET /api/notifications
- PATCH /api/notifications/:notificationId
- POST /api/notifications/read-all

## Announcements

- GET /api/organizations/:id/announcements
- POST /api/organizations/:id/announcements
- POST /api/groups/:groupId/announcements

Every announcement must verify the author's permissions and the recipient scope.

## Moderation

- POST /api/reports
- GET /api/admin/reports
- PATCH /api/admin/reports/:reportId
- POST /api/admin/reports/:reportId/escalate

Restrict administrative endpoints to authorized reviewers.

## Messaging

- POST /api/conversations
- GET /api/conversations
- GET /api/conversations/:conversationId/messages
- POST /api/conversations/:conversationId/messages

If Socket.IO is enabled, use it for authorized real-time delivery while retaining secure HTTP history retrieval.

The route list is an implementation contract. Follow consistent response formats, HTTP status codes, validation, pagination, and error handling.

# 21. SECURITY AND PERMISSION RULES

Authorization must be enforced by the backend on every protected operation.

Never rely on hiding a button in the frontend as the security mechanism.

Important rules:

- Campus Network verifiers control institutional verification and initial Super Admin appointments.
- Organization Super Admins can administer only their organization and authorized scope.
- Group administrators act only within assigned groups.
- User affiliation verification does not imply employer verification.
- A display suffix, prefix, role label, handle, hash, or organization code does not establish authorization.
- Group membership does not imply a personal connection.
- Personal connections do not imply restricted-group membership.
- A pending connection request does not permit private messaging.
- Block relationships must be applied consistently across relevant interaction paths.
- Inaccessible posts must be filtered before ranking and before returning results.
- Final permissions must be revalidated for sensitive operations.
- Socket.IO room membership must be authorized server-side.
- Institutional administrators do not have default access to private one-to-one message contents.
- Platform-level verification does not grant unrestricted private-data access.

Validate inputs, apply rate limits to sensitive endpoints, store secrets in environment variables, and avoid exposing sensitive personal data in logs.

Use secure authentication in production. Seeded-user switching may be used for development demos but must never be presented as production authentication.

# 22. PERFORMANCE AND RELIABILITY

Prioritize fast, predictable user interactions.

- Use database indexes for high-frequency queries.
- Retrieve bounded feed candidates rather than scanning entire collections.
- Paginate feed, search, messages, members, and administrative queues.
- Use caching only where useful and invalidate it safely.
- Make background work optional and isolated from critical request paths.
- Handle database errors and ranking failures gracefully.
- Avoid redundant database lookups inside repeated candidate-processing loops.
- Use request validation, timeouts, and sensible payload-size limits.
- Ensure notification or message retries do not create duplicate records.
- Monitor response latency for feed loading, search, and core user workflows.

Do not sacrifice permission correctness for caching or ranking speed.

# 23. TESTING AND ACCEPTANCE CRITERIA

The application is not complete merely because the pages render.

Seed an example environment containing:

- At least one verified institution.
- At least one verified company.
- One Campus Network verifier.
- Institution Super Admin and group administrator accounts.
- Multiple students, alumni, and faculty members.
- A mixture of verified and unverified employment claims.
- Public and restricted groups.
- Different post audiences and topics.
- Pending and accepted connections.
- Different user-interest profiles.

The following workflows must be demonstrable:

1. A verifier receives an institution registration, examines the evidence, approves it, and appoints its founding Super Admin.
2. The Super Admin creates roles and groups, assigns eligible members, and appoints authorized group administrators.
3. A student submits an affiliation request and is verified by the appropriate administrator.
4. An authorized group administrator publishes an announcement visible to the eligible group members.
5. A user requests access to a restricted group and receives an approval or rejection.
6. A student searches for an alumnus at a target company by company and role.
7. The student sees the alumnus's relevant verification labels and sends a purpose-specific connection request.
8. The alumnus accepts, after which private messaging becomes available if messaging has been implemented.
9. Two seeded users with different interests receive meaningfully different For You results.
10. The feed works in baseline mode even when FlashRank is unavailable.
11. Users can follow and unfollow people and topics, and their feed responds to those changes.
12. An unverified public user can participate in the permitted public discovery workflow without gaining verified institutional privileges.
13. Blocked or unauthorized users cannot use search, feeds, groups, broadcasts, APIs, or sockets to bypass applicable restrictions.
14. Reports can be reviewed and escalated according to assigned authority.
15. The application can be started from a clean checkout using the documented setup instructions.

Automated negative tests must confirm that unauthorized access fails. A UI demonstration alone does not prove security.

# 24. SUCCESS METRICS

Evaluate product usefulness instead of optimizing exclusively for clicks or time spent.

Track:

- Time taken to find a relevant alumnus.
- Percentage of searches returning a useful person.
- Successful connection-request rate.
- Mentorship conversations and meaningful introductions.
- Percentage of recommendations considered relevant.
- Feed diversity across authors and topics.
- Useful discoveries outside the user's immediate network.
- User feedback such as saves, hides, and not-interested actions.
- Alumni participation and repeat engagement.
- Institutional administrative time saved.
- Unauthorized access attempts and permission-test failures.
- Feed and search latency.

For ranking evaluation, compare the personalized feed against a chronological baseline. Change weights only when evaluation shows improvement.

Do not assume a high click-through rate means the system is helping users build stronger professional relationships.

# 25. IMPLEMENTATION PRIORITIES

Use the following delivery sequence. Keep the long-term vision intact while avoiding unnecessary hackathon scope.

## P0 — Essential working product

- Authentication or seeded demo identities.
- User profiles.
- Organization registration and verification.
- Founding Super Admin appointment.
- Institutional affiliation verification.
- Roles and basic scoped permissions.
- Group creation, memberships, and backend access checks.
- Text posts and a baseline feed.
- For You personalization with basic interest signals.
- Discover people by company, role, skills, and institution.
- Connection request and acceptance workflow.
- Permission tests and reproducible setup instructions.

## P1 — Important product differentiation

- Alumni and Students feeds.
- Topic map with explicit interest controls.
- Following users and topics.
- FlashRank reranking with baseline fallback.
- Restricted groups and access approval.
- Group announcements and in-app notifications.
- Social-graph ranking signals.
- Organisation profiles and public discovery.
- Basic reporting and escalation.

## P2 — Stretch features

- Complete real-time private messaging.
- More advanced semantic search and retrieval.
- Advanced moderation dashboard.
- Rich media uploads.
- Notification preferences and expanded delivery channels.
- Sophisticated ranking models and offline evaluation tooling.
- Advanced organisation workflows and institutional analytics.

For a hackathon, complete P0 reliably before allowing P1 or P2 to compromise the core workflow.

# 26. DESIGN AND DEVELOPMENT EXPECTATIONS

Before implementation, inspect the existing repository and preserve functional code wherever possible.

Identify the current stack, entry points, routes, database access, dependencies, and existing design system.

Produce a concise implementation plan, then build the product end to end.

Do not stop after generating mockups, isolated UI components, or a static prototype.

The application must contain working frontend-backend interactions, persistence, validation, authorization, and meaningful loading, error, empty, and success states.

Do not fabricate verification, employment, or messaging states just to make a demo look successful. Seeded data should clearly be identified as demo data.

Keep business logic out of UI components. Keep permissions centralized and consistently enforced. Keep the ranking system replaceable.

When a feature is too large for the available schedule, implement its smallest secure vertical slice or explicitly mark it as deferred. Do not create fake controls that appear functional but do nothing.

Document setup, environment variables, seed scripts, demo accounts, tests, known limitations, and the main architectural decisions.

# 27. FINAL PRODUCT EXPERIENCE

The final product should make three things feel effortless.

**First: Trust.** Users can immediately distinguish a verified institution, verified affiliation, verified company representative, and self-reported claim.

**Second: Discovery.** Users can find relevant people and content without needing to know their exact names, without being trapped in their existing circle, and without being overwhelmed by irrelevant posts.

**Third: Action.** After discovering a relevant person, users can understand why that person matters, check their stated availability, initiate a connection, and progress toward a meaningful conversation.

Institutional administration should be powerful but understandable. Public discovery should be open but honest about verification. Private messaging should be convenient but protected. Personalized feeds should be adaptive but controllable.

**The defining requirement is that Campus Network must not become another noisy social feed or a static directory. It must become a trusted, personalized professional network that helps people find the right communities, the right knowledge, and the right people.**

Build toward that goal in every product, architectural, database, ranking, security, and UX decision.
