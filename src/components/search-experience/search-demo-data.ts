export type SearchMode = "search" | "research" | "deep_search" | "local" | "compare" | "debug";

export type VerificationType = "verified" | "community" | "reference" | "official";

export interface SearchResultItem {
  id: string;
  upvotes: string;
  title: string;
  domain: string;
  tag: string;
  sourceCategory: string;
  confidence: number; // e.g. 97 for 97%
  verification: VerificationType;
  distance?: string;
  statusBadge?: string;
  snippet?: string;
}

export interface ComparisonMetric {
  name: string;
  optionA: { name: string; score: number };
  optionB: { name: string; score: number };
}

export interface DebugDiagnostic {
  errorType: string;
  rootCause: string;
  suggestedFix: string;
  confidence: number;
  stages: string[];
}

export interface DeepResearchInfo {
  sourcesCount: number;
  findingsCount: number;
  confidence: number;
  analyzingItems: string[];
}

export interface SearchScenario {
  id: string;
  query: string;
  mode: SearchMode;
  intent: string;
  intentCategory: string;
  understandingSteps: string[];
  resultsCount: number;
  sourcesSearched: number;
  layoutType: "standard" | "comparison" | "debugging" | "deep_research" | "local";
  results: SearchResultItem[];
  aiAnswer?: {
    summary: string;
    sourcesCount: number;
    citations: { number: number; name: string; resultId: string }[];
  };
  comparisonData?: {
    optionA: string;
    optionB: string;
    metrics: ComparisonMetric[];
  };
  debugData?: DebugDiagnostic;
  deepResearchData?: DeepResearchInfo;
}

export const SEARCH_MODES_LIST: { id: SearchMode; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "research", label: "Research" },
  { id: "deep_search", label: "Deep Search" },
  { id: "compare", label: "Compare" },
  { id: "debug", label: "Debug" },
  { id: "local", label: "Local" },
];

export const RECENT_SEARCHES = [
  "How do I fix authentication errors in React?",
  "PostgreSQL vs MongoDB for AI applications",
  "CUDA out of memory error during PyTorch training",
  "Multi-bot DAG orchestration whitepaper",
  "FastAPI event loop closed in background worker",
];

export const SEARCH_COMMANDS = [
  { command: "/research", description: "Deep synthesis over papers & docs" },
  { command: "/compare", description: "Side-by-side architectural benchmark" },
  { command: "/debug", description: "Analyze stack traces & find root cause" },
  { command: "/explain", description: "Deconstruct complex codebases" },
  { command: "/local", description: "Contextual proximity & workspace search" },
];

export const SEARCH_SCENARIOS: SearchScenario[] = [
  {
    id: "scenario-auth",
    query: "How do I fix authentication errors in my React app?",
    mode: "search",
    intent: "Technical Question",
    intentCategory: "Debugging & Architecture",
    understandingSteps: [
      "Intent detected: React Authentication",
      "Context: Token Refresh & Protected Routes",
      "Sources selected: Official Docs & Repos",
      "Results ranked by verified solutions",
    ],
    resultsCount: 42,
    sourcesSearched: 2480,
    layoutType: "standard",
    results: [
      {
        id: "res-auth-1",
        upvotes: "2.4k",
        title: "JWT Authentication & Axios Interceptor Token Refresh",
        domain: "developer.mozilla.org",
        tag: "Web Security",
        sourceCategory: "Documentation",
        confidence: 97,
        verification: "verified",
        snippet: "Attach automatic token renewal handlers before expired requests return 401 Unauthorized.",
      },
      {
        id: "res-auth-2",
        upvotes: "1.8k",
        title: "Fixing CORS & Credential Cookies in React 19 Client",
        domain: "github.com/auth-workflow",
        tag: "Code Repository",
        sourceCategory: "GitHub",
        confidence: 94,
        verification: "verified",
        snippet: "Ensure withCredentials: true is set on axios instances and Access-Control-Allow-Origin matches exactly.",
      },
      {
        id: "res-auth-3",
        upvotes: "950",
        title: "AuthContext State Hydration & Protected Route Guards",
        domain: "stackoverflow.com",
        tag: "State Management",
        sourceCategory: "Stack Overflow",
        confidence: 91,
        verification: "community",
        snippet: "Avoid flashing unauthenticated state by caching local token session prior to initial mount.",
      },
      {
        id: "res-auth-4",
        upvotes: "620",
        title: "Zero-Trust Cookie vs LocalStorage Token Security",
        domain: "auth0.com/blog",
        tag: "Security Whitepaper",
        sourceCategory: "Official Websites",
        confidence: 88,
        verification: "reference",
        snippet: "Store refresh tokens in HttpOnly SameSite=Strict cookies to prevent cross-site scripting vulnerabilities.",
      },
    ],
    aiAnswer: {
      summary: "Authentication errors in React are typically caused by unhandled token expirations or mismatched CORS credentials. Configure an Axios response interceptor to catch 401s and refresh JWT tokens seamlessly.",
      sourcesCount: 4,
      citations: [
        { number: 1, name: "MDN", resultId: "res-auth-1" },
        { number: 2, name: "GitHub", resultId: "res-auth-2" },
        { number: 3, name: "Stack Overflow", resultId: "res-auth-3" },
        { number: 4, name: "Auth0", resultId: "res-auth-4" },
      ],
    },
  },
  {
    id: "scenario-debug",
    query: "Find the root cause of this Python CUDA error",
    mode: "debug",
    intent: "Error Diagnostic",
    intentCategory: "Deep Learning Runtime",
    understandingSteps: [
      "Stack trace detected: PyTorch CUDA",
      "Analyzing memory allocation tensors",
      "Cross-referencing GPU gradient memory buffers",
      "Synthesizing memory release patch",
    ],
    resultsCount: 28,
    sourcesSearched: 1890,
    layoutType: "debugging",
    results: [
      {
        id: "res-cuda-1",
        upvotes: "3.4k",
        title: "CUDA Out of Memory: Gradient Accumulation & Detach",
        domain: "pytorch.org/docs",
        tag: "Tensor Ops",
        sourceCategory: "Documentation",
        confidence: 98,
        verification: "verified",
      },
      {
        id: "res-cuda-2",
        upvotes: "2.1k",
        title: "Resolving Memory Leaks in PyTorch Training Loops",
        domain: "github.com/pytorch",
        tag: "Runtime Fix",
        sourceCategory: "GitHub",
        confidence: 95,
        verification: "verified",
      },
    ],
    debugData: {
      errorType: "RuntimeError: CUDA out of memory (OOM)",
      rootCause: "Loss tensors retained in computational graph without .item() or .detach() across iterations.",
      suggestedFix: "Use loss.item() when accumulating epoch metrics and call torch.cuda.empty_cache() after validation steps.",
      confidence: 98,
      stages: [
        "Memory allocation mapped: 23.4 GB / 24.0 GB VRAM",
        "Retained computation graphs detected in epoch loop",
        "Zero-copy tensor detach verified",
        "Deterministic fix verified with 98% confidence",
      ],
    },
  },
  {
    id: "scenario-compare",
    query: "Compare PostgreSQL vs MongoDB for my AI application",
    mode: "compare",
    intent: "Architecture Comparison",
    intentCategory: "Database Engineering",
    understandingSteps: [
      "Entities identified: PostgreSQL vs MongoDB",
      "Workload profile: AI Embeddings & Vector Search",
      "Benchmarking pgvector vs Atlas Vector Search",
      "Generating comparative tradeoff matrix",
    ],
    resultsCount: 56,
    sourcesSearched: 3120,
    layoutType: "comparison",
    results: [
      {
        id: "res-db-1",
        upvotes: "4.1k",
        title: "PostgreSQL pgvector vs Dedicated Vector Databases",
        domain: "supabase.com/blog",
        tag: "Vector Benchmark",
        sourceCategory: "Research",
        confidence: 97,
        verification: "verified",
      },
      {
        id: "res-db-2",
        upvotes: "2.8k",
        title: "MongoDB Atlas Vector Search Scaling & Hybrid Queries",
        domain: "mongodb.com/developer",
        tag: "Document Storage",
        sourceCategory: "Official Websites",
        confidence: 93,
        verification: "reference",
      },
    ],
    comparisonData: {
      optionA: "PostgreSQL (pgvector)",
      optionB: "MongoDB (Atlas)",
      metrics: [
        { name: "Vector Similarity & HNSW Indexing", optionA: { name: "PostgreSQL", score: 98 }, optionB: { name: "MongoDB", score: 87 } },
        { name: "ACID Transactions & Strict Schemas", optionA: { name: "PostgreSQL", score: 99 }, optionB: { name: "MongoDB", score: 82 } },
        { name: "Unstructured JSON Flexibility", optionA: { name: "PostgreSQL", score: 89 }, optionB: { name: "MongoDB", score: 97 } },
        { name: "Multi-Model AI RAG Ecosystem", optionA: { name: "PostgreSQL", score: 96 }, optionB: { name: "MongoDB", score: 88 } },
      ],
    },
  },
  {
    id: "scenario-research",
    query: "Find the best architecture for a multi-agent AI application",
    mode: "research",
    intent: "Deep Research",
    intentCategory: "Distributed Systems",
    understandingSteps: [
      "Topic: Multi-Agent AI Orchestration",
      "Scanning arXiv, IEEE, & production topologies",
      "Evaluating deterministic DAGs vs autonomous agents",
      "Extracting latency, token cost, and accuracy benchmarks",
    ],
    resultsCount: 84,
    sourcesSearched: 5400,
    layoutType: "deep_research",
    results: [
      {
        id: "res-arch-1",
        upvotes: "4.8k",
        title: "Deterministic Multi-Bot DAGs vs Cyclic Agentic Loops",
        domain: "arxiv.org/abs/2403.18901",
        tag: "ArXiv Paper",
        sourceCategory: "Research",
        confidence: 99,
        verification: "verified",
      },
      {
        id: "res-arch-2",
        upvotes: "3.2k",
        title: "Real-Time Telemetry & SSE Event Streaming in AI Pipelines",
        domain: "vercel.com/blog",
        tag: "Production System",
        sourceCategory: "Official Websites",
        confidence: 95,
        verification: "verified",
      },
    ],
    deepResearchData: {
      sourcesCount: 24,
      findingsCount: 8,
      confidence: 99,
      analyzingItems: [
        "12 Peer-reviewed arXiv whitepapers",
        "6 Production open-source architectures",
        "4 Benchmark datasets on latency & error propagation",
        "2 Industry security & data governance specs",
      ],
    },
    aiAnswer: {
      summary: "For production AI applications, a deterministic Directed Acyclic Graph (DAG) with specialized neural nodes consistently outperforms unconstrained multi-agent loops, reducing error propagation by 78% and latency by 3.4x.",
      sourcesCount: 4,
      citations: [
        { number: 1, name: "ArXiv", resultId: "res-arch-1" },
        { number: 2, name: "Vercel", resultId: "res-arch-2" },
      ],
    },
  },
  {
    id: "scenario-local",
    query: "Find local AI developer meetups and workspaces near me",
    mode: "local",
    intent: "Contextual Location Search",
    intentCategory: "Community & Workspaces",
    understandingSteps: [
      "Geolocation context resolved: San Francisco / Silicon Valley",
      "Filtering developer hubs & tech coworking spaces",
      "Checking live availability & active community hours",
      "Ranking by proximity & developer ratings",
    ],
    resultsCount: 16,
    sourcesSearched: 420,
    layoutType: "local",
    results: [
      {
        id: "res-loc-1",
        upvotes: "3.1k",
        title: "Frontier AI Lab & Collaborative Builder Hub",
        domain: "frontierlab.io",
        tag: "Coworking Space",
        sourceCategory: "Local Search",
        confidence: 97,
        verification: "verified",
        distance: "0.8 km away",
        statusBadge: "Open now",
      },
      {
        id: "res-loc-2",
        upvotes: "2.2k",
        title: "Silicon Valley PyTorch & Neural Hackers Meetup",
        domain: "meetup.com/sv-pytorch",
        tag: "Weekly Event",
        sourceCategory: "Community",
        confidence: 94,
        verification: "verified",
        distance: "1.4 km away",
        statusBadge: "Tonight 6:30 PM",
      },
      {
        id: "res-loc-3",
        upvotes: "1.5k",
        title: "The Workshop: High-Speed Fiber Workspace",
        domain: "theworkshop.dev",
        tag: "Tech Cafe",
        sourceCategory: "Local Search",
        confidence: 91,
        verification: "community",
        distance: "2.1 km away",
        statusBadge: "Open now",
      },
    ],
  },
];
