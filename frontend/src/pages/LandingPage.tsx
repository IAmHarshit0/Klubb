import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Compass,
  Users,
  Sparkles,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Cpu,
  Layers,
  GraduationCap,
  MessageSquare,
  BadgeCheck,
  Search,
  BellRing,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../types/api';

export function LandingPage() {
  const navigate = useNavigate();
  const { switchUser, userId } = useAuth();

  const handleSelectPersona = (id: string, targetPath = '/feed') => {
    switchUser(id);
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-mercury-gray-50 text-mercury-black pb-24">
      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-mercury-gray-200 bg-white">
        {/* Ambient Decorative Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-mercury-gray-200 bg-mercury-gray-50 text-xs font-semibold uppercase tracking-wider text-mercury-gray-700 mb-6 shadow-mercury-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Campus Network v3.0 Master Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-mercury-black leading-[1.15] mb-6">
            Building a Network, <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600">
              Not Just a Directory
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-mercury-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            Find the right person, not just browse a static list. Campus Network unites verified institutional identities, structured academic communities, purpose-driven connections, and a personalized 7-signal recommendation engine.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleSelectPersona('usr-student-001', '/feed')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-mercury-black text-white font-semibold text-sm shadow-mercury-md hover:bg-neutral-800 transition-all transform hover:-translate-y-0.5"
            >
              Enter Live Network <ArrowRight size={18} />
            </button>
            <button
              onClick={() => handleSelectPersona('usr-alumnus-001', '/discover')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-mercury-gray-300 text-mercury-black font-semibold text-sm shadow-mercury-xs hover:bg-mercury-gray-50 transition-all"
            >
              <Search size={18} className="text-mercury-gray-500" />
              Explore Alumni Discovery
            </button>
            <button
              onClick={() => handleSelectPersona('usr-verifier-001', '/verifier')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-sm hover:bg-blue-100 transition-all"
            >
              <ShieldCheck size={18} className="text-blue-600" />
              Platform Verifier Portal
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 pt-8 border-t border-mercury-gray-100 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-mercury-gray-50/80 border border-mercury-gray-100">
              <p className="text-2xl font-bold text-mercury-black">100%</p>
              <p className="text-xs font-medium text-mercury-gray-500 mt-1">Backend Authoritative Security</p>
            </div>
            <div className="p-4 rounded-xl bg-mercury-gray-50/80 border border-mercury-gray-100">
              <p className="text-2xl font-bold text-mercury-black">7 Signals</p>
              <p className="text-xs font-medium text-mercury-gray-500 mt-1">Personalized Feed Scoring</p>
            </div>
            <div className="p-4 rounded-xl bg-mercury-gray-50/80 border border-mercury-gray-100">
              <p className="text-2xl font-bold text-mercury-black">4 Tiers</p>
              <p className="text-xs font-medium text-mercury-gray-500 mt-1">Distinct Identity Verification</p>
            </div>
            <div className="p-4 rounded-xl bg-mercury-gray-50/80 border border-mercury-gray-100">
              <p className="text-2xl font-bold text-mercury-black">Real-time</p>
              <p className="text-xs font-medium text-mercury-gray-500 mt-1">Socket.IO Direct Messaging</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEMS VS OUR SOLUTIONS ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="spatial-label text-blue-600">The Paradigm Shift</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-mercury-black mt-2">
            Why Traditional Alumni Portals Fail & How Campus Network Solves It
          </h2>
          <p className="text-mercury-gray-500 mt-4 text-base">
            Conventional platforms trap members in noisy feeds or dead directories. We engineered a trusted ecosystem with clear separation between identity, membership, and communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problem 1 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-mercury-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-mercury-black">Problem 1: The Stale Directory Trap</h3>
                  <p className="text-xs text-rose-500 font-medium">Static lists where outreaches die</p>
                </div>
              </div>
              <p className="text-sm text-mercury-gray-600 leading-relaxed">
                Traditional portals are glorified, outdated PDF-like rosters. Students search for an alumnus, send an uncontextualized cold message into the void, and never receive an answer because availability, intent, and relevance are absent.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mercury-gray-100 bg-emerald-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" /> Our Solution: Purpose-Driven Discovery
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Structured people discovery with stated availability flags (Mentorship, Referrals, Career Q&A). Connection requests require an introduction purpose, and accepted requests gate private Socket.IO messaging.
              </p>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-mercury-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-mercury-black">Problem 2: The Social Noise & Rage Trap</h3>
                  <p className="text-xs text-rose-500 font-medium">Vanity metrics instead of learning</p>
                </div>
              </div>
              <p className="text-sm text-mercury-gray-600 leading-relaxed">
                Public social feeds optimize for viral outrage, polarizing hot-takes, and engagement farming. Academic discourse, student collaborations, and verified alumni insights get buried under generic promotional noise.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mercury-gray-100 bg-emerald-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" /> Our Solution: 7-Signal Personalized Feed & 15-Topic Noun Engine
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Multi-stage feed with candidate pre-filtering, our <strong>15-Topic Noun Affinity Engine</strong> (strictly eliminating conversational filler words, enforcing valid 1–3 word nouns, and capping at the top 15 highest-affinity topics), time-decayed interest vectors, canonical normalization (Postgres → PostgreSQL, ML → Machine Learning), and transparent "Why am I seeing this?" score breakdowns.
              </p>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-mercury-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-mercury-black">Problem 3: The Verification Conflation Deficit</h3>
                  <p className="text-xs text-rose-500 font-medium">Unverified claims treated as facts</p>
                </div>
              </div>
              <p className="text-sm text-mercury-gray-600 leading-relaxed">
                Existing platforms conflate email domain ownership with authority, and allow self-reported job titles or fake campus affiliations to masquerade as verified credentials.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mercury-gray-100 bg-emerald-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" /> Our Solution: Strict 4-Tier Verification States
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Explicit separation between verified institutions, verified affiliations (Student, Alumnus, Faculty), employer-verified claims, and self-reported claims. Verification officers review evidence in an audited queue.
              </p>
            </div>
          </div>

          {/* Problem 4 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-mercury-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-mercury-black">Problem 4: Monolithic Administrative Chaos</h3>
                  <p className="text-xs text-rose-500 font-medium">Unscoped superusers or no governance</p>
                </div>
              </div>
              <p className="text-sm text-mercury-gray-600 leading-relaxed">
                Platforms either give administrators god-mode access to spy on private student messages or offer zero structured governance for departments, batches, and clubs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-mercury-gray-100 bg-emerald-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" /> Our Solution: Scoped Roles & Private Privacy
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Hierarchical communities (Institution → Programme → Department → Batch → Groups). Platform verifiers appoint initial Super Admins; Super Admins delegate granular scoped roles. Private messages remain inaccessible to institutional admins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW WE MAKE THE FEED PERSONALIZED ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-mercury-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="spatial-label text-indigo-600">Deep Architectural Focus</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-mercury-black mt-2">
              How the Recommendation Engine Powers Personalized Discovery
            </h2>
            <p className="text-mercury-gray-600 mt-4 text-base">
              The feed is not a chronological firehose. It is a multi-stage pipeline designed to expand professional horizons while respecting privacy and diversity.
            </p>
          </div>

          {/* Staged Pipeline Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-mercury-gray-50 border border-mercury-gray-200 shadow-mercury-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-mercury-black mb-2">Candidate Generation & Security Filter</h3>
              <p className="text-xs text-mercury-gray-600 leading-relaxed">
                Pulls candidates from recent campus discussions, followed topics, and institutional spaces. Inaccessible, hidden, blocked, or deleted posts are eliminated <strong>server-side before scoring</strong>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-mercury-gray-50 border border-mercury-gray-200 shadow-mercury-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-mercury-black mb-2">7-Factor Weighted Scoring & Reranking</h3>
              <p className="text-xs text-mercury-gray-600 leading-relaxed">
                Applies our formula: 28% Topic Relevance + 20% Behavioural Intent + 15% Graph Affinity + 12% Freshness + 10% Quality + 10% Verified Author + 5% Popularity. Optional FlashRank cross-encoder with deterministic fallback.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-mercury-gray-50 border border-mercury-gray-200 shadow-mercury-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-mercury-black mb-2">Diversity & Explainable Feedback</h3>
              <p className="text-xs text-mercury-gray-600 leading-relaxed">
                Enforces author diversity (no more than 2 consecutive posts by the same author). Generates transparent "Why am I seeing this?" score breakdowns with time-decayed topic signals.
              </p>
            </div>
          </div>

          {/* Detailed Weights Card */}
          <div className="p-6 rounded-2xl bg-mercury-black text-white shadow-mercury-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
              <div>
                <h4 className="font-bold text-lg text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-400" /> The 7 Baseline Ranking Signals
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">Mathematically normalized weights evaluated on every request</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-mono font-medium">
                Deterministic + FlashRank
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-blue-400">28%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Topic Match</p>
                <p className="text-[10px] text-neutral-400">Declared & decayed</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-indigo-400">20%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Behaviour</p>
                <p className="text-[10px] text-neutral-400">Follows & saves</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-sky-400">15%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Graph Proximity</p>
                <p className="text-[10px] text-neutral-400">Campus network</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-amber-400">12%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Freshness</p>
                <p className="text-[10px] text-neutral-400">Exponential decay</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-purple-400">10%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Quality</p>
                <p className="text-[10px] text-neutral-400">Text & structure</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-emerald-400">10%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Verification</p>
                <p className="text-[10px] text-neutral-400">Verified author</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-xl font-extrabold text-rose-400">5%</span>
                <p className="text-xs font-semibold text-neutral-200 mt-1">Popularity</p>
                <p className="text-[10px] text-neutral-400">Bounded influence</p>
              </div>
            </div>

            {/* 15-Topic Noun Affinity Engine Deep-Dive */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100 shadow-mercury-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-mercury-black">
                      15-Topic Noun Affinity Engine: Pure Intent, Zero Noise
                    </h4>
                    <p className="text-xs text-mercury-gray-500">
                      Eliminates conversational pollution and strictly caps active topic state to maximum 15 high-value concepts
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
                  Max 15 Cardinality Cap
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                <div className="p-4 rounded-xl bg-white border border-indigo-100/80 shadow-mercury-xs">
                  <div className="flex items-center gap-2 mb-1.5 text-indigo-700 font-semibold text-xs">
                    <CheckCircle2 size={15} /> 1–3 Word Noun Phrases Only
                  </div>
                  <p className="text-xs text-mercury-gray-600 leading-relaxed">
                    Conversational slang and filler words (<em>"stuff", "really", "today", "awesome", "cool", "things"</em>), sentences, and pure numbers are strictly rejected. Only legitimate technical and academic nouns are ingested.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-indigo-100/80 shadow-mercury-xs">
                  <div className="flex items-center gap-2 mb-1.5 text-indigo-700 font-semibold text-xs">
                    <CheckCircle2 size={15} /> Top 15 Ranked Cardinality
                  </div>
                  <p className="text-xs text-mercury-gray-600 leading-relaxed">
                    Your dynamic Campus Topic Map retains only the top 15 topics with the highest composite decay-weighted affinity. Prevents unbounded graph bloat and keeps user intent crisp and distinct.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-indigo-100/80 shadow-mercury-xs">
                  <div className="flex items-center gap-2 mb-1.5 text-indigo-700 font-semibold text-xs">
                    <CheckCircle2 size={15} /> Dual-State Exponential Decay
                  </div>
                  <p className="text-xs text-mercury-gray-600 leading-relaxed">
                    Combines short-term transient signals (60% weight, half-life 3–14 days) with declared long-term profile anchors (40% weight). Members can mute topics or reset inferred activity at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PERSONA TESTER ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="spatial-label text-blue-600">Instant Role Switching</span>
          <h2 className="text-3xl font-extrabold text-mercury-black mt-2">
            Experience Campus Network from Every Lens
          </h2>
          <p className="text-mercury-gray-500 mt-3 text-sm">
            Click any persona to test their authoritative permissions, personalized feed, and administrative portals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Persona 1: Platform Verifier */}
          <div
            onClick={() => handleSelectPersona('usr-verifier-001', '/verifier')}
            className="p-5 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 shadow-mercury-xs hover:shadow-mercury-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                AT
              </div>
              <div>
                <h4 className="font-bold text-sm text-mercury-black group-hover:text-blue-600 transition-colors">
                  Dr. Aris Thorne
                </h4>
                <p className="text-xs font-semibold text-blue-600">Platform Verifier</p>
              </div>
            </div>
            <p className="text-xs text-mercury-gray-600 leading-relaxed mb-4">
              Review institution registrations (Caltech, Quantum Labs), approve unique identifiers (IITD, STR), and appoint founding Super Admins.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
              Launch Verifier Dashboard <ArrowRight size={14} />
            </span>
          </div>

          {/* Persona 2: Super Admin */}
          <div
            onClick={() => handleSelectPersona('usr-admin-001', '/communities')}
            className="p-5 rounded-2xl bg-white border border-mercury-gray-200 hover:border-indigo-400 shadow-mercury-xs hover:shadow-mercury-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                RS
              </div>
              <div>
                <h4 className="font-bold text-sm text-mercury-black group-hover:text-indigo-600 transition-colors">
                  Dean Robert Sterling
                </h4>
                <p className="text-xs font-semibold text-indigo-600">Apex Super Admin</p>
              </div>
            </div>
            <p className="text-xs text-mercury-gray-600 leading-relaxed mb-4">
              Apex University governance, view distinct member metrics, review affiliation queues, create scoped custom roles, and broadcast announcements.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              Open Governance Portal <ArrowRight size={14} />
            </span>
          </div>

          {/* Persona 3: Verified Alumna */}
          <div
            onClick={() => handleSelectPersona('usr-alumnus-001', '/feed')}
            className="p-5 rounded-2xl bg-white border border-mercury-gray-200 hover:border-emerald-400 shadow-mercury-xs hover:shadow-mercury-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                PS
              </div>
              <div>
                <h4 className="font-bold text-sm text-mercury-black group-hover:text-emerald-600 transition-colors">
                  Priya Sharma
                </h4>
                <p className="text-xs font-semibold text-emerald-600">Alumna at Stripe</p>
              </div>
            </div>
            <p className="text-xs text-mercury-gray-600 leading-relaxed mb-4">
              Employer-verified claim at Stripe. Configures mentorship and referral availability toggles. Receives purpose-specific student connection requests.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              View Alumna Experience <ArrowRight size={14} />
            </span>
          </div>

          {/* Persona 4: Student Alex */}
          <div
            onClick={() => handleSelectPersona('usr-student-001', '/feed')}
            className="p-5 rounded-2xl bg-white border border-mercury-gray-200 hover:border-purple-400 shadow-mercury-xs hover:shadow-mercury-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                AR
              </div>
              <div>
                <h4 className="font-bold text-sm text-mercury-black group-hover:text-purple-600 transition-colors">
                  Alex Rivera
                </h4>
                <p className="text-xs font-semibold text-purple-600">CS Student (AI & Cloud)</p>
              </div>
            </div>
            <p className="text-xs text-mercury-gray-600 leading-relaxed mb-4">
              Personalized "For You" feed biased towards distributed systems and AI. Searches for alumni at Stripe and sends contextual mentorship requests.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
              Explore Student Feed <ArrowRight size={14} />
            </span>
          </div>

          {/* Persona 5: Student Jordan (Bioengineering) */}
          <div
            onClick={() => handleSelectPersona('usr-student-002', '/feed')}
            className="p-5 rounded-2xl bg-white border border-mercury-gray-200 hover:border-amber-400 shadow-mercury-xs hover:shadow-mercury-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                JL
              </div>
              <div>
                <h4 className="font-bold text-sm text-mercury-black group-hover:text-amber-600 transition-colors">
                  Jordan Lee
                </h4>
                <p className="text-xs font-semibold text-amber-600">Bioengineering Student</p>
              </div>
            </div>
            <p className="text-xs text-mercury-gray-600 leading-relaxed mb-4">
              Completely different feed divergence from Alex: Biotech and genomics posts scored highest. Demonstrates time-decayed topic map interest shifts.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
              Compare Feed Divergence <ArrowRight size={14} />
            </span>
          </div>

          {/* Persona 6: Verification Officer Sarah */}
          <div
            onClick={() => handleSelectPersona('usr-officer-001', '/communities')}
            className="p-5 rounded-2xl bg-white border border-mercury-gray-200 hover:border-sky-400 shadow-mercury-xs hover:shadow-mercury-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                SJ
              </div>
              <div>
                <h4 className="font-bold text-sm text-mercury-black group-hover:text-sky-600 transition-colors">
                  Sarah Jenkins
                </h4>
                <p className="text-xs font-semibold text-sky-600">Verification Officer</p>
              </div>
            </div>
            <p className="text-xs text-mercury-gray-600 leading-relaxed mb-4">
              Holds delegated `verify_affiliation` and `create_community` permissions. Reviews student ID submissions in the institution verification queue.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 group-hover:translate-x-1 transition-transform">
              Test Officer Verification Queue <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-mercury-black via-neutral-900 to-indigo-950 text-white shadow-mercury-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Explore the Platform?</h2>
          <p className="text-neutral-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Experience verified institutional trust, real-time messaging, and personalized discovery in action.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleSelectPersona('usr-student-001', '/feed')}
              className="px-8 py-3.5 rounded-xl bg-white text-mercury-black font-bold text-sm hover:bg-neutral-100 transition-all shadow-mercury-md"
            >
              Start as Alex Rivera (Student)
            </button>
            <button
              onClick={() => handleSelectPersona('usr-verifier-001', '/verifier')}
              className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-mercury-md"
            >
              Start as Platform Verifier
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
