# NanoBot

> **"One platform. Every intelligent workflow."**

NanoBot is a unified, production-grade deep-learning multi-bot platform. It receives user tasks, automatically routes them through specialized bots, executes genuine backend processing pipelines (NLP tokenization, PyTorch tensor transformation, spatial feature extraction, statistical anomaly detection, and AST complexity profiling), and provides a transparent real-time visualization of how the task moves through every backend layer.

---

## Key Features

1. **Deterministic Multi-Bot Routing**: Automatically classifies queries into 7 specialized neural modules:
   - **ChatBot**: Conversational reasoning and contextual guidance.
   - **CodeBot**: AST inspection, static security heuristics, and algorithmic synthesis.
   - **VisionBot**: PyTorch tensor transformation [1, 3, 224, 224], normalization, spatial feature extraction, and salience mapping.
   - **ResearchBot**: Academic literature synthesis, thematic decomposition, and citation ranking.
   - **DocumentBot**: Hierarchical document chunking, table extraction, and structured summaries.
   - **DataBot**: Statistical distribution modeling, covariance estimation, and multi-dimensional Z-score outlier isolation.
   - **StudyBot**: Conceptual deconstruction, prerequisite mapping, and self-check quizzes.
2. **Transparent Real-Time Execution View (`/app/tasks/[id]`)**:
   - **Dynamic Live Execution Graph**: Animated interactive node topology tracking active backend layers.
   - **Level 1 (Pipeline Overview)**: High-level stage progression.
   - **Level 2 (Technical Stages)**: Step durations (ms), progress percentages, and layer telemetry.
   - **Level 3 (Execution Event Log)**: High-precision timestamped event stream with search and level filters.
3. **Zero Fake Data Policy**: All metrics, durations, logs, and outputs originate from genuine backend computation and database persistence.
4. **Model Provider Abstraction**: Interfaces expose capabilities (*"Semantic Analysis"*, *"Visual Feature Extraction"*, *"Statistical Anomaly Detection"*) with zero external provider branding in the user-facing UI.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript (`strict: true`), Tailwind CSS, `@phosphor-icons/react`, Framer Motion, GSAP.
- **Backend Orchestrator**: Next.js Server Actions & Route Handlers, Server-Sent Events (SSE).
- **ML Deep Learning Service**: Python FastAPI, PyTorch, Torchvision, Scikit-learn, SciPy, Pillow, NumPy.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) migrations.

---

## Project Structure

```
├── ml-service/                  # Python Deep-Learning Service
│   ├── app/
│   │   ├── main.py              # FastAPI server & endpoints
│   │   ├── events/              # Layer event emitter
│   │   └── pipelines/           # NLP, Vision, Data, Code, Research, Study pipelines
│   └── tests/                   # Pytest test suite
├── src/
│   ├── app/                     # App Router pages & API handlers
│   │   ├── (auth)/              # Sign in, Sign up, Forgot/Reset password
│   │   ├── app/                 # Command Center, Tasks, Bots, Network, Activity, Logs
│   │   └── api/                 # Tasks, SSE Stream, Bots, Overview, Conversations
│   ├── components/
│   │   ├── layout/              # Sidebar, Header
│   │   ├── tasks/               # NewTaskDialog modal
│   │   ├── execution/           # Live Execution Graph
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── bots/                # Canonical bot registry
│   │   ├── orchestration/       # TaskValidator, WorkflowBuilder, ExecutionEngine
│   │   ├── supabase/            # Client, Server, and DbService
│   │   └── ai/                  # Neural synthesis adapter
│   └── types/                   # Database & event types
├── supabase/
│   └── migrations/              # PostgreSQL schema & RLS migrations
└── tests/                       # Vitest unit test suite
```

---

## Getting Started

### 1. Prerequisites
- Node.js >= 18 and pnpm >= 9
- Python >= 3.10 and `uv`

### 2. Environment Setup
Copy the example environment file and configure credentials:
```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ML_SERVICE_URL=http://127.0.0.1:8000
NODE_ENV=development

# Optional high-speed neural synthesis:
GROQ_API_KEY=your-groq-key
OPENROUTER_API_KEY=your-openrouter-key
```

### 3. Run the ML Deep-Learning Backend Service
```bash
cd ml-service
uv venv .venv --python 3.11
uv pip install -r requirements.txt --python .venv/Scripts/python.exe
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Run the Next.js Frontend Application
In the project root:
```bash
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Test Suites

### Frontend Unit & Orchestration Tests
```bash
pnpm test
```

### TypeScript Strict Validation
```bash
pnpm typecheck
```

### Python ML Pipeline Tests
```bash
cd ml-service
$env:PYTHONPATH="."
.\.venv\Scripts\python.exe -m pytest tests/
```
