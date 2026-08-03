// Vercel Serverless API Handler for EduNiti Demo / Cloud Deployment

const mockUser = {
  id: "usr_8829a",
  name: "Kshitij Datir",
  email: "kshitij@eduniti.com",
  role: "STUDENT",
  createdAt: "2026-01-15T10:00:00.000Z"
};

const mockProfile = {
  id: "usr_8829a",
  name: "Kshitij Datir",
  email: "kshitij@eduniti.com",
  enrolledCourses: 4,
  completedTests: 12,
  averageScore: 94.5,
  rank: 1,
  recentActivity: [
    { id: "act_1", title: "Completed Advanced Data Structures Test", score: 98, date: "2026-08-01T14:30:00Z" },
    { id: "act_2", title: "Watched Microservices Architecture Video", duration: "45m", date: "2026-07-30T11:00:00Z" },
    { id: "act_3", title: "Completed System Design Mock Exam", score: 91, date: "2026-07-28T09:15:00Z" }
  ]
};

const mockResults = [
  { id: "res_101", testTitle: "Advanced Data Structures & Algorithms", score: 98, totalQuestions: 50, durationMinutes: 45, date: "2026-08-01", status: "PASSED" },
  { id: "res_102", testTitle: "Distributed Systems & Redis Caching", score: 91, totalQuestions: 40, durationMinutes: 30, date: "2026-07-28", status: "PASSED" },
  { id: "res_103", testTitle: "Database Indexing & PostgreSQL Internals", score: 94, totalQuestions: 30, durationMinutes: 25, date: "2026-07-20", status: "PASSED" }
];

const mockSessions = [
  { id: "sess_1", device: "Chrome / macOS", ip: "192.168.1.45", lastActive: "Just now", isCurrent: true },
  { id: "sess_2", device: "EduNiti Mobile App / iOS", ip: "49.37.120.14", lastActive: "2 hours ago", isCurrent: false }
];

const mockUpcomingTests = [
  { id: "test_live_01", title: "Xenia '26 Hackathon Final Assessment - High Scale Architecture", scheduledAt: "2026-08-04T12:00:00Z", durationMinutes: 60, questionCount: 10, totalMarks: 100 },
  { id: "test_02", title: "Kubernetes & Microservices Orchestration", scheduledAt: "2026-08-06T15:00:00Z", durationMinutes: 45, questionCount: 20, totalMarks: 100 }
];

const mockLiveTest = {
  id: "test_live_01",
  title: "Xenia '26 Hackathon Final Assessment - High Scale Architecture",
  durationMinutes: 60,
  questionCount: 4,
  questions: [
    {
      id: "q1",
      questionText: "Which HTTP caching header allows CloudFront CDN to serve edge-cached responses without hitting the origin NGINX proxy?",
      mediaUrl: null,
      mediaType: null,
      options: [
        { id: "q1_a", text: "Cache-Control: public, max-age=31536000, immutable" },
        { id: "q1_b", text: "Pragma: no-cache" },
        { id: "q1_c", text: "X-Accel-Buffering: no" },
        { id: "q1_d", text: "Transfer-Encoding: chunked" }
      ]
    },
    {
      id: "q2",
      questionText: "In EduNiti's microservices architecture, how does the Test Service achieve sub-millisecond retrieval latency for live exam questions?",
      mediaUrl: null,
      mediaType: null,
      options: [
        { id: "q2_a", text: "Using Redis in-memory cache-first pattern before querying PostgreSQL" },
        { id: "q2_b", text: "Reading directly from disk on every HTTP request" },
        { id: "q2_c", text: "Using NGINX file system caching without database access" },
        { id: "q2_d", text: "Executing recursive SQL queries with deep JOINs on demand" }
      ]
    },
    {
      id: "q3",
      questionText: "What is the primary function of NGINX reverse proxy in the EduNiti backend architecture?",
      mediaUrl: null,
      mediaType: null,
      options: [
        { id: "q3_a", text: "Single API Gateway routing /api/auth, /api/student, and /api/test to respective microservices with rate limiting" },
        { id: "q3_b", text: "Serving static HTML files and executing JavaScript logic" },
        { id: "q3_c", text: "Generating JWT authentication tokens" },
        { id: "q3_d", text: "Managing database migrations for Prisma ORM" }
      ]
    },
    {
      id: "q4",
      questionText: "How are student databases structured across microservices to maintain strict isolation?",
      mediaUrl: null,
      mediaType: null,
      options: [
        { id: "q4_a", text: "Database-per-service pattern using distinct PostgreSQL databases (xenia_auth, xenia_dash, xenia_tests)" },
        { id: "q4_b", text: "Single shared SQLite file for all services" },
        { id: "q4_c", text: "Global JSON file storage on local host" },
        { id: "q4_d", text: "No persistence store; data stored in browser localStorage" }
      ]
    }
  ]
};

let cacheStatsData = {
  hits: 142,
  misses: 8,
  totalRequests: 150,
  hitRatioPercent: 94.67,
  avgLatencyMs: 0.42,
  redisMemoryUsage: "14.2 MB",
  keysCount: 38
};

export default function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  // Route matching
  if (path === "/api/auth/login" || path === "/api/auth/register") {
    return res.status(200).json({
      token: "demo-jwt-token-eduniti-hackathon-winner",
      user: mockUser
    });
  }

  if (path === "/api/auth/me") {
    return res.status(200).json({ user: mockUser });
  }

  if (path === "/api/student/profile") {
    return res.status(200).json(mockProfile);
  }

  if (path === "/api/student/results") {
    return res.status(200).json(mockResults);
  }

  if (path === "/api/student/sessions") {
    return res.status(200).json(mockSessions);
  }

  if (path === "/api/student/upcoming-tests") {
    return res.status(200).json(mockUpcomingTests);
  }

  if (path === "/api/test/live" || path.startsWith("/api/test/test_live_01") || path.match(/\/api\/test\/[^\/]+$/)) {
    cacheStatsData.hits += 1;
    cacheStatsData.totalRequests += 1;
    cacheStatsData.hitRatioPercent = parseFloat(((cacheStatsData.hits / cacheStatsData.totalRequests) * 100).toFixed(2));
    return res.status(200).json(mockLiveTest);
  }

  if (path.includes("/submit")) {
    return res.status(200).json({
      score: 100,
      totalQuestions: 4,
      correctAnswers: 4,
      percentage: 100,
      message: "Test submitted successfully! Perfect score!",
      submittedAt: new Date().toISOString()
    });
  }

  if (path === "/api/test/cache/stats") {
    return res.status(200).json(cacheStatsData);
  }

  if (path === "/api/test/cache/reset") {
    cacheStatsData = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRatioPercent: 0,
      avgLatencyMs: 0.15,
      redisMemoryUsage: "2.1 MB",
      keysCount: 0
    };
    return res.status(200).json({ message: "Cache stats reset successfully", stats: cacheStatsData });
  }

  return res.status(200).json({ status: "OK", message: "EduNiti API Gateway operational", timestamp: new Date().toISOString() });
}
