# QuizMaster 🧠

> **A personalized quiz and study platform built with React, Vite, and Supabase.**

QuizMaster turns quick quizzes into a complete learning workflow. Configure timed challenges, choose between a curated question bank and live trivia, review answers, retry weak areas, save questions to a study cart, create custom questions, and track your progress across attempts.

The application combines a modular React interface with account-aware experiences, persistent browser storage, and optional Supabase authentication.

## ✨ Features

### 🎯 Customizable quiz sessions
- Choose from **Science, History, Geography, Movies & TV, Sports, Music**, or a mixed quiz.
- Select **Any, Easy, Medium, or Hard** difficulty.
- Choose a session length of **5, 10, 15, or 20 questions**.
- Question selection prioritizes matching category and difficulty, then fills remaining slots from broader pools when needed.
- Questions and answer options are shuffled between sessions.

### ⏱️ Timed quiz experience
- A **20-second countdown per question**.
- Immediate answer feedback and explanations where available.
- Previous/next navigation, skipping, and a question palette.
- Flag questions to revisit later.
- Track answered, unanswered, and flagged questions.
- Submit before reaching the final question, with confirmation when unanswered questions remain.

### 📊 Results and answer review
- Score percentage, correct/incorrect/unanswered counts, and accuracy.
- Time taken and average time per question.
- Performance grade and personal-best indicators.
- Review questions alongside your answers, the correct answers, and explanations.
- Retry incorrect or unanswered questions as a focused practice session.

### 🌐 Curated and live trivia sources
- Use the built-in curated question bank for a fast, offline-ready experience.
- Fetch questions from the **Open Trivia Database** using Axios.
- Configure online trivia category, difficulty, and question count.
- Retry a failed API request or switch back to curated questions.

### 📚 Study Deck & Question Studio
- Save tricky questions to a **Study Cart** while browsing or practicing.
- Launch a quiz using saved questions.
- Explore the question bank with search, category and difficulty filters, sorting, and pagination.
- Create, edit, and delete custom multiple-choice questions.
- Add explanations to custom questions and use them in personalized practice sessions.

### 👤 Accounts, dashboard, and profile
- Sign-up and sign-in screens.
- Supabase Auth integration when credentials are configured.
- Demo/offline fallback when Supabase is not configured.
- Dashboard, profile, and account-aware navigation.
- Quiz history and personal performance statistics.

### 🏆 Attempt history and progress
- View previous quiz attempts and filter history by category.
- Track total attempts, best score, best accuracy, and average score.
- Identify personal-best attempts.
- Delete individual attempts or clear the history.
- Keep quiz history, saved questions, and custom questions scoped to the active account in browser storage.

### 📱 Responsive interface
A modular, responsive UI built from reusable components, shared styling, progress indicators, modals, tabs, forms, and toast notifications.

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| JavaScript (ES modules) and JSX | Application logic and UI |
| Vite | Development server and production build |
| React Router | Client-side routing |
| Zustand | Shared state for saved and custom questions |
| Supabase JS | Optional authentication integration |
| Axios | HTTP requests to the trivia API |
| Tailwind CSS 4 and custom CSS | Styling and responsive layouts |
| Browser Local Storage | Local attempt history, study cart, custom questions, and demo account state |
| Canvas Confetti | Score celebration effects |
| ESLint | Code quality checks |
| npm | Package and script management |

## 🗺️ App Routes

| Route | Purpose |
|---|---|
| `/` | Quiz setup for signed-in users; authentication entry for signed-out users |
| `/quiz` | Timed quiz session |
| `/result` | Results and answer review |
| `/dashboard` | Dashboard and study/progress overview |
| `/deck` | Study Cart, Question Bank Explorer, and Custom Question Studio |
| `/history` | Past attempts and statistics |
| `/profile` | User profile |
| `/login` | Sign in |
| `/signup` | Create an account |

Unknown routes display a not-found screen.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (use a current version compatible with the installed Vite release)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Tejus6309/QuizMaster.git
cd QuizMaster
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables (optional)

QuizMaster can use its demo/offline fallback without Supabase credentials. To enable Supabase authentication:

1. Create a project at [Supabase](https://supabase.com/).
2. In the project dashboard, open **Project Settings → API**.
3. Copy the project URL and anon/public key.
4. Create a local `.env` file from the example:

```bash
cp .env.example .env
```

On Windows Command Prompt, you can instead run:

```bat
copy .env.example .env
```

Set the values in `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Use your own project values. Do not commit real secrets or private credentials. Vite exposes `VITE_*` variables to client-side code, so only use a Supabase anon/public key here—never a service-role key.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

### 5. Build for production

```bash
npm run build
npm run preview
```

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Creates the production build |
| `npm run preview` | Serves the production build locally for preview |
| `npm run lint` | Runs ESLint |

## 🧭 Typical Workflow

```text
Sign in / Create an account
          ↓
Configure a quiz
          ↓
Choose curated questions or fetch online trivia
          ↓
Answer timed questions, navigate, skip, or bookmark
          ↓
Submit the quiz
          ↓
Review results and explanations
          ↓
Retry wrong questions or practice your Study Cart
          ↓
Check dashboard and attempt history
```

## 🏗️ Project Structure

The repository is organized by application responsibility. The key areas include:

```text
QuizMaster/
├── public/                  # Public assets and icons
├── src/
│   ├── assets/              # Images and static assets
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared forms, tabs, modals, etc.
│   │   └── icons/           # Icon components
│   ├── context/             # Authentication and toast contexts
│   ├── data/                # Curated questions and quiz options
│   ├── hooks/               # Reusable quiz logic and hooks
│   ├── lib/                 # Supabase client/configuration
│   ├── routes/              # App screens
│   ├── services/             # External API services
│   ├── store/                # Zustand store
│   ├── styles/               # Global and component styling
│   ├── utils/                # Helpers and local persistence
│   ├── App.jsx               # Route definitions and app flow
│   └── main.jsx              # React entry point and providers
├── .env.example              # Supabase configuration template
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🧠 Implementation Notes

- **Component architecture:** Screens are composed from reusable UI components for questions, options, progress, results, forms, navigation, and dialogs.
- **React hooks:** Local state and effects manage quiz configuration, timers, UI state, and lifecycle events.
- **Routing:** React Router separates the quiz, results, dashboard, history, profile, study deck, and authentication views.
- **Shared state:** Zustand stores study-cart questions, custom questions, and trivia-source settings.
- **Question selection:** The curated bank first matches the selected category and difficulty, then uses progressively broader fallback pools if the requested count is not available.
- **Answer randomization:** Questions and answer options are shuffled to vary practice sessions.
- **Persistence:** Quiz results and study data use browser Local Storage with user-scoped keys.
- **External trivia:** Axios-based service code retrieves online questions from Open Trivia Database.
- **Error handling:** An app-level error boundary provides a recovery screen for unexpected rendering errors.

## 💾 Data and Privacy Notes

QuizMaster uses browser Local Storage for local records such as quiz attempts, study-cart items, custom questions, and demo-mode state. These records are tied to the browser profile and are not automatically synchronized across devices.

When configured, Supabase is used for authentication. Local browser storage used by the application should not be treated as a secure store for sensitive information. Avoid using real passwords in demo/offline mode, and do not store sensitive personal data in custom questions or local records.

## ⚠️ Current Scope and Limitations

- The curated question bank is bundled with the frontend.
- Open Trivia Database access requires an internet connection and depends on that service's availability.
- Browser-stored history and custom study data are device/browser-specific unless additional backend synchronization is implemented.
- Authentication behavior depends on whether Supabase is configured and on its project settings.
- The project is intended as an academic and learning application; review security, accessibility, and deployment configuration before production use.

## 👥 Team

- **Tejus Pathania** — Team Leader
- **Anish Kumar** — Team Member
- **Ranteg Singh Virk** — Team Member
- **Anmol** — Team Member

## 🎓 Learning Outcomes

QuizMaster demonstrates practical work with React component composition, hooks, client-side routing, shared state, form validation, REST API integration, browser persistence, account-aware UI flows, and modular frontend architecture.

## 📄 License

This repository was developed for educational and academic purposes. No separate open-source license is specified here; check the repository for licensing updates before redistributing the project.

---

<p align="center">
  Built with 🧠 and React
</p>
