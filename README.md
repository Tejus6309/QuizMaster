# QuizMaster 🧠

**QuizMaster** is a React.js-based interactive quiz application developed as a college-level frontend project. It provides a configurable, timed quiz experience with question navigation, review functionality, performance analysis, and locally stored attempt history.

## Team

* **Tejus Pathania** — Team Leader
* **Anish Kumar** — Team Member
* **Ranteg Singh Virk** — Team Member
* **Anmol** — Team Member

## Overview

The application allows users to configure quizzes by **category, difficulty, and number of questions**, attempt timed multiple-choice questions, review their answers, and analyze their performance. Quiz attempts are stored using browser Local Storage.

### Key Features

* Configurable quiz categories, difficulty levels, and question counts
* 20-second timer for each question
* Multiple-choice questions with immediate feedback
* Previous, next, skip, and direct question navigation
* Question flagging for later review
* Real-time progress and answer tracking
* Early submission with unanswered-question confirmation
* Detailed results including score, accuracy, time, and grade
* Complete answer review with explanations
* Retry mode for incorrect or unanswered questions
* Attempt history with statistics and personal-best tracking
* Responsive interface for different screen sizes

## Technology Stack

| Technology         | Purpose                                     |
| ------------------ | ------------------------------------------- |
| React.js           | User interface and application architecture |
| JavaScript / JSX   | Application logic and UI development        |
| Vite               | Development and build tooling               |
| React Router       | Client-side navigation                      |
| Tailwind CSS / CSS | Styling and responsive layouts              |
| Local Storage      | Persistent quiz attempt history             |
| ESLint             | Code quality and linting                    |
| Git & GitHub       | Version control and collaboration           |

## Project Structure

```text
QuizMaster/
├── public/              # Public assets
├── src/
│   ├── assets/          # Images and static assets
│   ├── components/      # Reusable UI components
│   ├── data/            # Question bank and quiz data
│   ├── hooks/            # Custom React hooks
│   ├── routes/           # Application screens
│   ├── styles/           # Global styles
│   ├── utils/            # Helper and storage utilities
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

The project follows a modular React architecture, separating screens, reusable components, hooks, data, utilities, and styling.

## Application Flow

```text
Quiz Configuration
        ↓
   Start Quiz
        ↓
    Timed Quiz
        ↓
Answer / Skip / Flag / Navigate
        ↓
   Submit Quiz
        ↓
Calculate Score & Accuracy
        ↓
     Results
        ↓
Review / Retry / Play Again
        ↓
Attempt History
```

## Question Selection

Questions are selected according to the configured category and difficulty. If sufficient matching questions are unavailable, the application progressively broadens the selection criteria:

1. Exact category + difficulty
2. Same category + any difficulty
3. Same difficulty + any category
4. Any remaining questions

Questions and options are shuffled to provide variation between attempts.

## Data Storage

Quiz attempts are stored in the browser's **Local Storage**, including score, accuracy, answer statistics, question count, time taken, date, and personal-best status. Since there is no backend database, this history is limited to the browser/device where the application is used.

## Limitations

* Questions are maintained within the project rather than through an admin/backend system.
* Attempt history is stored locally.
* No authentication or cloud synchronization is implemented.
* The application is primarily intended as an academic frontend project.

## Future Scope

Potential improvements include backend integration, user authentication, cloud-synchronized history, an admin question-management system, leaderboards, multiplayer quizzes, advanced analytics, adaptive difficulty, and improved accessibility.
