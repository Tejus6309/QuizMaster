# QuizMaster 🧠

> **An interactive, timed quiz application built with React.js and Vite.**

QuizMaster is a college-level frontend web application designed to provide an engaging and structured quiz experience. Users can configure a quiz, answer timed multiple-choice questions, navigate between questions, review difficult questions, submit the quiz, and analyze their performance through detailed results and attempt history.

The project demonstrates practical application of **React component-based architecture, state management, custom hooks, client-side routing, reusable UI components, local data handling, and responsive interface design**.

---

## 📌 Project Information

**Project Name:** QuizMaster  
**Project Type:** College / Academic Web Development Project  
**Application Type:** Single Page Application (SPA)  
**Frontend:** React.js  
**Build Tool:** Vite  
**Language:** JavaScript / JSX  
**Data Storage:** Browser Local Storage  

---

## 🎯 Project Objectives

The main objectives of QuizMaster are to:

- Develop a functional and interactive quiz application using React.js.
- Demonstrate component-based frontend architecture.
- Implement client-side navigation between application screens.
- Manage application state using React hooks.
- Create reusable components for questions, answers, progress, timers, and results.
- Implement timed quiz functionality and automatic timeout handling.
- Store quiz attempt records locally and display performance statistics.
- Provide an intuitive and responsive user interface.
- Apply modular project organization and reusable utility functions.

---

## ✨ Key Features

### 1. Quiz Configuration

Users can configure a quiz before starting it by selecting:

- **Category** – Science, History, Geography, Movies & TV, Sports, Music, or Mixed.
- **Difficulty** – Any, Easy, Medium, or Hard.
- **Number of Questions** – 5, 10, 15, or 20.

The application validates the required selections before starting the quiz.

### 2. Timed Questions ⏱️

Each question has a **20-second timer**. When the timer expires, the question is automatically recorded as unanswered and the application can move to the next question automatically.

### 3. Multiple-Choice Questions

Each question contains multiple answer options. After selecting an answer, the application immediately indicates whether the response is correct and can display an explanation for the question.

### 4. Question Navigation

Users can:

- Move to the **previous** question.
- Move to the **next** question.
- **Skip** a question.
- Jump directly to any question using the question palette.

### 5. Flag Questions for Review 🚩

Users can mark questions for review. The quiz sidebar shows how many questions are currently flagged.

### 6. Quiz Progress Tracking

The application displays:

- Current question number.
- Total number of questions.
- Progress bar.
- Number of answered questions.
- Number of unanswered questions.
- Number of flagged questions.

### 7. Flexible Quiz Submission

Users can finish the quiz before reaching the last question. When unanswered questions remain, the application displays a confirmation dialog before submission.

### 8. Detailed Results 📊

After completing a quiz, QuizMaster calculates and displays:

- Number of correct answers.
- Number of incorrect answers.
- Number of skipped/unanswered questions.
- Overall score percentage.
- Answer accuracy.
- Total time taken.
- Personal-best status.

### 9. Answer Review

Users can review the questions after completing the quiz and inspect their selected answers along with question explanations.

### 10. Retry Wrong Questions 🔄

QuizMaster allows users to retry only the questions they answered incorrectly or left unanswered, making it useful for focused practice.

### 11. Attempt History 🏆

Quiz attempts are stored locally in the browser. The history section provides:

- Total quizzes taken.
- Personal best score.
- Best accuracy.
- Average score.
- Individual attempt records.
- Category filtering.
- Delete individual attempts.
- Clear all attempt history.

### 12. Personal Best Tracking

The application identifies and highlights the user's highest-performing attempt and displays it on the quiz configuration and history screens.

### 13. Responsive User Interface 📱

The interface is designed to adapt to different screen sizes, including desktop and smaller-screen layouts.

---

## 🧩 Application Workflow

```text
Start Application
       ↓
Quiz Configuration
       ↓
Select Category
       ↓
Select Difficulty
       ↓
Select Number of Questions
       ↓
Start Challenge
       ↓
Timed Quiz
       ↓
Answer / Skip / Flag / Navigate
       ↓
Submit Quiz
       ↓
Calculate Score & Accuracy
       ↓
Results Screen
       ↓
Review Answers / Retry Wrong Questions / Play Again
       ↓
Attempt History & Statistics
```

---

## 🏗️ Project Architecture

QuizMaster follows a modular React architecture in which application screens, reusable UI components, custom hooks, data, and utility functions are separated into dedicated folders.

### Main architectural areas

- **Routes / Screens** – Handle major application views such as configuration, quiz, results, and history.
- **Components** – Reusable UI building blocks.
- **Hooks** – Encapsulate reusable React logic such as question selection and quiz timing.
- **Data** – Contains categories, difficulty levels, question counts, and quiz questions.
- **Utils** – Provides helper functions and browser storage operations.
- **Styles** – Contains application-wide styling.

---

## 📂 Project Structure

```text
QuizMaster/
│
├── public/
│   ├── education-pattern.svg
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── icons/
│   │   │   └── Icons.jsx
│   │   ├── OptionButton.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── QuestionCard.jsx
│   │   └── ...
│   │
│   ├── data/
│   │   └── questionBank.js
│   │
│   ├── hooks/
│   │   ├── useQuestionBank.js
│   │   └── useQuizTimer.js
│   │
│   ├── routes/
│   │   ├── ConfigScreen.jsx
│   │   ├── HistoryScreen.jsx
│   │   ├── NotFound.jsx
│   │   ├── QuizScreen.jsx
│   │   └── ResultScreen.jsx
│   │
│   ├── styles/
│   │   └── index.css
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   └── storage.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## 🛠️ Technologies & Tools Used

| Technology | Purpose |
|---|---|
| **React.js** | Building the interactive user interface |
| **JavaScript (ES6+)** | Application logic and functionality |
| **JSX** | Writing React UI components |
| **Vite** | Development server and production build tooling |
| **React Router** | Client-side navigation |
| **Tailwind CSS** | Utility-based styling support |
| **CSS** | Custom application styling and responsive layouts |
| **Local Storage** | Persistent storage of quiz attempt history |
| **Axios** | HTTP client available for application requests |
| **ESLint** | Code quality and linting |
| **Canvas Confetti** | Celebration effect for high quiz scores |
| **npm** | Dependency and package management |

---

## 🔧 React Concepts Demonstrated

This project was developed to demonstrate several important React concepts:

### Components

The interface is divided into reusable components such as question cards, option buttons, timers, progress bars, question palettes, result summaries, and review lists.

### Props

Data and callback functions are passed between components to keep the UI modular and reusable.

### State Management

React's `useState` is used to manage quiz configuration, selected answers, current question, review flags, submission state, timers, and UI controls.

### Side Effects

`useEffect` is used for time-based behavior, timer updates, and saving quiz results.

### Memoization

`useMemo` is used where derived data is calculated from existing state, such as statistics and filtered results.

### Custom Hooks

The project contains reusable hooks for:

- Selecting and preparing questions based on quiz configuration.
- Managing the countdown timer for each question.

### Client-Side Routing

React Router is used to structure navigation between the application's major screens.

---

## 🧠 Question Selection Logic

QuizMaster uses a question-selection strategy that attempts to satisfy the user's selected category and difficulty first.

If there are not enough matching questions, the application progressively expands the selection pool:

```text
1. Exact Category + Difficulty
          ↓
2. Same Category + Any Difficulty
          ↓
3. Same Difficulty + Any Category
          ↓
4. Any Remaining Questions
```

Questions and their answer options are shuffled so that quiz attempts are not presented in the same order every time.

---

## 💾 Data Persistence

Quiz attempt records are stored in the browser using **Local Storage**.

Stored information includes values such as:

- Quiz category.
- Score percentage.
- Accuracy.
- Correct / incorrect / skipped counts.
- Number of questions.
- Time taken.
- Attempt date.
- Personal-best status.

This allows users to close or refresh the page without losing their locally stored attempt history.

> **Note:** Because the application uses browser Local Storage rather than a backend database, attempt history is specific to the browser/device being used.

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed on your system:

- **Node.js**
- **npm**

### Installation

Clone the repository:

```bash
git clone https://github.com/Tejus6309/QuizMaster.git
```

Move into the project directory:

```bash
cd QuizMaster
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown by Vite in your browser.

---

## 📦 Available Scripts

```bash
npm run dev
```
Starts the Vite development server.

```bash
npm run build
```
Creates a production build of the application.

```bash
npm run preview
```
Previews the production build locally.

```bash
npm run lint
```
Runs ESLint to identify code-quality issues.

---

## 🧪 Testing the Application

A simple manual testing flow for evaluation is:

1. Open the application.
2. Select a category, difficulty, and question count.
3. Start the quiz.
4. Verify the 20-second timer for each question.
5. Select correct and incorrect options and verify feedback.
6. Try skipping and moving between questions.
7. Flag one or more questions.
8. Submit the quiz, including with unanswered questions.
9. Verify score, accuracy, skipped count, and total time.
10. Open answer review.
11. Retry wrong questions.
12. Open attempt history and verify the saved record and statistics.
13. Test deleting a record and clearing the history.

---

## 🎓 Academic Learning Outcomes

Through this project, the following practical skills are demonstrated:

- Frontend application development using React.js.
- Component-based software design.
- JavaScript programming and event handling.
- State and effect management with React Hooks.
- Custom hook development.
- Client-side routing.
- Data filtering, shuffling, and derived state calculations.
- Browser-based persistent storage using Local Storage.
- Responsive UI development.
- Code organization and modularity.
- Basic linting and development workflow using npm and Vite.
- Use of Git and GitHub for project version control.

---

## 🔮 Future Enhancements

The current version is focused on a frontend-only academic implementation. Possible future improvements include:

- User authentication and individual profiles.
- Backend database integration.
- Cloud-based synchronization of quiz history.
- Admin panel for adding and managing questions.
- Larger and externally managed question banks.
- Leaderboards and multiplayer quizzes.
- More advanced analytics and performance charts.
- Difficulty-based adaptive questioning.
- Category-wise progress tracking.
- Accessibility improvements and keyboard-first navigation.

---

## ⚠️ Current Limitations

- Quiz questions are maintained in the project rather than through a backend/admin system.
- Attempt history is stored locally in the browser.
- There is no user authentication or cloud synchronization.
- The application is primarily intended as a frontend academic project rather than a production-scale quiz platform.

---

## 👨‍💻 Author

**Tejus Pathania**  
GitHub: [@Tejus6309](https://github.com/Tejus6309)

---

## 📄 License

This project was created for **educational and academic purposes**.

---

## ⭐ Project Summary

**QuizMaster** is a React-based quiz platform that combines timed multiple-choice questions, configurable difficulty and categories, question navigation, review functionality, performance analytics, and locally stored attempt history into a single-page web application.

It is designed to demonstrate how modern frontend development concepts can be combined to build a complete, interactive application suitable for academic evaluation and practical learning.
