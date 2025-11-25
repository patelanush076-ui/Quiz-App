# Quiz App Backend

This is a minimal Node.js (Express) backend with Prisma and SQLite for local development.

Getting started:

1. Install dependencies:

```powershell
cd backend
npm install
```

2. Generate Prisma client and migrate DB:

```powershell
# creates a SQLite database 'dev.db' using Prisma migration
npm run prisma:migrate
```

3. Start the dev server:

```powershell
npm run dev
```

Endpoints:

- POST /api/quizzes — create quiz: { title, adminName }
- GET /api/quizzes/:code — fetch public quiz data (no answers)
- POST /api/quizzes/:code/questions — admin add question
- POST /api/quizzes/:code/join — create participant: { username }
- POST /api/quizzes/:code/submit — submit answers: { participantId, answers }
- GET /api/quizzes/:code/result?participantId=xxx — retrieve rank & results after deadline

Notes:

- This is a starter template and intentionally minimal. Add authentication and authorization (JWT) in production.
- Use Redis and Prisma in production; use Postgres in production for robust DB features.
