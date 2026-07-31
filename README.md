# 🎵 SonicRefine — AI Audio Enhancement

> Perceptually enhance your audio with AI-powered processing.
> Upload MP3 files, analyze their characteristics, and apply an intelligent
> multi-stage enhancement pipeline.

⚠️ **Important:** SonicRefine provides *perceptual enhancement* — it optimizes
how your audio sounds and measures, but does **not** reconstruct original
lossless quality from lossy source material.

---

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Next.js 14  │───▶│  FastAPI API  │───▶│  PostgreSQL  │
│  (Frontend)  │    │  (Backend)   │    │  (Database)  │
└─────────────┘    └──────┬───────┘    └─────────────┘
                          │
                    ┌─────▼─────┐    ┌─────────────┐
                    │   Redis    │───▶│   Celery     │
                    │  (Queue)   │    │  (Worker)    │
                    └───────────┘    └──────┬──────┘
                                           │
                    ┌──────────────┐   ┌────▼───────┐
                    │  MinIO (S3)  │◀──│  FFmpeg +   │
                    │  (Storage)   │   │  librosa   │
                    └──────────────┘   └────────────┘
```

## 🛠️ Tech Stack

| Layer        | Technology                        |
|:-------------|:----------------------------------|
| Frontend     | Next.js 14, TypeScript, Tailwind  |
| Backend API  | FastAPI (Python)                  |
| Queue        | Celery + Redis                    |
| Database     | PostgreSQL + Drizzle ORM / SQLAlchemy |
| Storage      | S3-compatible (MinIO)             |
| Audio Engine | Python + FFmpeg + librosa + pyloudnorm |
| Auth         | JWT (jose / python-jose)          |
| Containers   | Docker + Docker Compose           |

## 🔊 Audio Processing Pipeline

1. **Analysis** — bitrate, loudness (LUFS), peak level, clipping detection,
   spectral balance, dynamic range, stereo width
2. **Input Normalization** — normalize levels to prevent clipping
3. **Noise Reduction** *(optional)* — spectral gating via noisereduce
4. **EQ Correction** — adaptive high-shelf / low-shelf based on spectral analysis
5. **Multiband Compression** — 3-band (low/mid/high) dynamic range control
6. **Stereo Enhancement** *(optional)* — mid-side widening
7. **Limiting** — brick-wall limiter at -1.0 dBTP
8. **Loudness Normalization** — target -14 LUFS (streaming standard)
9. **Render** — export to MP3 (320k), WAV (24-bit), FLAC, or AAC (256k)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### With Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/sonicrefine.git
cd sonicrefine

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# The app is now available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# MinIO Console: http://localhost:9001
```

### Local Development

#### Frontend (Next.js)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Push database schema
npx drizzle-kit push

# Start development server
npm run dev
```

#### Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (in another terminal)
celery -A app.worker.celery_app worker --loglevel=info
```

## 📁 Project Structure

```
sonicrefine/
├── src/                          # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Registration page
│   │   ├── dashboard/page.tsx    # User dashboard
│   │   ├── upload/page.tsx       # File upload + settings
│   │   ├── project/[id]/page.tsx # Project details + player
│   │   ├── api/                  # Next.js API routes
│   │   │   ├── auth/             # Auth endpoints
│   │   │   ├── projects/         # Project CRUD
│   │   │   └── health/           # Health check
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── AudioPlayerComparison.tsx  # Before/after player
│   │   ├── WaveformVisualizer.tsx     # Animated waveform
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── auth.ts               # JWT utilities
│   │   └── useAuth.ts            # Auth hook
│   └── db/
│       ├── schema.ts             # Drizzle schema
│       └── index.ts              # DB connection
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py               # FastAPI app
│   │   ├── config.py             # Settings
│   │   ├── auth.py               # JWT auth
│   │   ├── models.py             # SQLAlchemy models
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── database.py           # DB connection
│   │   ├── routes/
│   │   │   ├── auth.py           # Auth routes
│   │   │   └── projects.py       # Project routes
│   │   └── worker/
│   │       ├── celery_app.py     # Celery configuration
│   │       ├── tasks.py          # Celery tasks
│   │       └── audio_pipeline.py # Audio processing engine
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── Dockerfile.frontend
├── .env.example
└── README.md
```

## 🔐 API Endpoints

### Authentication
| Method | Endpoint          | Description      |
|:-------|:------------------|:-----------------|
| POST   | `/api/auth/register` | Create account |
| POST   | `/api/auth/login`    | Sign in        |
| GET    | `/api/auth/me`       | Get current user |
| POST   | `/api/auth/logout`   | Sign out       |

### Projects
| Method | Endpoint                       | Description            |
|:-------|:-------------------------------|:-----------------------|
| GET    | `/api/projects`                | List user projects     |
| POST   | `/api/projects`                | Create new project     |
| GET    | `/api/projects/:id`            | Get project details    |
| PATCH  | `/api/projects/:id`            | Update project         |
| DELETE | `/api/projects/:id`            | Delete project         |
| POST   | `/api/projects/:id/process`    | Start processing       |
| GET    | `/api/projects/:id/download`   | Download processed file|

## 📝 Key Design Decisions

1. **Perceptual Enhancement, Not Reconstruction** — We clearly communicate
   that the tool enhances perceived audio quality. It does not and cannot
   reconstruct lossless content from a lossy MP3 source.

2. **Dual Backend Architecture** — The Next.js app includes its own API routes
   for the MVP (with simulated processing), while the FastAPI backend provides
   the production-grade processing pipeline with Celery workers.

3. **Multi-Format Export** — MP3 (320kbps), WAV, FLAC, and AAC (256kbps)
   output options via FFmpeg.

4. **Streaming-Ready Loudness** — Default target of -14 LUFS matches
   Spotify/YouTube/Apple Music normalization standards.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
