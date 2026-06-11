# 🧳 Batik Nareswara Heritage E-Commerce

> **A highly optimized Next.js 14 App Router frontend powered by a robust, secure .NET 8 Minimal API and Supabase PostgreSQL data layer.**

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![.NET 8](https://img.shields.io/badge/.NET-8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## 🏗️ KEY ARCHITECTURAL FEATURES

- **🌟 Full-Screen Curtain Parallax**: Smooth 100vh overlay transition for premium brand storytelling.
- **📱 Instagram-style Active Story Reels**: Disappearing media interaction with 24-hour expiration filter.
- **🧪 ACID-Compliant Inventory Management**: Composite database indexing and explicit .NET database transactions to guarantee zero inventory leakage.
- **🧹 Cascading Storage Clean-up**: Instant bucket asset physical wipeout during admin data deletions.

---

## 🛠️ TECH STACK & SYSTEM DIRECTORY

### System Directory

BatikNareswara/
├── Frontend/                 # Next.js 14 App Router UI
│   ├── app/                  # Application Routes & Pages
│   ├── components/           # Reusable React Components
│   ├── public/               # Static Assets
│   └── tailwind.config.ts    # Tailwind CSS Configuration
└── Backend/                  # .NET 8 Minimal API
    ├── Controllers/          # API Endpoint Handlers
    ├── Models/               # Data Transfer Objects & Entities
    ├── Data/                 # Entity Framework Core Context
    └── Program.cs            # Application Entry Point & DI
```

### Specifications Table

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **UI Layer (Frontend)** | Next.js 14, TailwindCSS | React framework using App Router for server-side rendering and static site generation, styled with Tailwind CSS for modern aesthetics. |
| **API Gateway (Backend)** | .NET 8 Minimal API | High-performance API routing and business logic execution. |
| **Core Database** | PostgreSQL (Supabase) | Relational data persistence with strong ACID guarantees and Supabase integration for extended functionalities. |

---

## 🚀 QUICK START & RUNTIME INSTALLATION

### Backend Setup

1. Ensure .NET 10 SDK & runtime are installed (project targets net10). If you prefer net8, install .NET 8 and change csproj accordingly.
2. From repo root, restore & build backend projects:
   ```bash
   dotnet restore backend/BatikNareswaraBackend.csproj
   dotnet restore backend/BatikNareswara.Api.csproj
   dotnet build backend/BatikNareswaraBackend.csproj
   dotnet build backend/BatikNareswara.Api.csproj
   ```
3. Run backend (Git Bash / macOS / Linux):
   ```bash
   export PORT=5000   # optional; default 5000 used if PORT not set
   dotnet run --project backend/BatikNareswaraBackend.csproj
   ```

> If no real database is configured and the environment is Development, the backend will fall back to an in-memory EF database so the API can start without errors.

### Frontend Setup

1. Install Node dependencies and start dev server:
   ```bash
   npm install
   npm run dev
   ```

2. The frontend uses NEXT_PUBLIC_API_BASE_URL from .env.local (default set to http://localhost:5000/api). Ensure this matches the backend PORT.

---

If desired, helper scripts were added: `run-backend.sh` (Git Bash) to export PORT and run dotnet; open an issue or ask me to create Windows PowerShell helper as well.
