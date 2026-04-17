# GPA Analyzer

A modern, responsive GPA calculator and target planner built with React and Tailwind CSS. The analyzer features automatic point interpolation, grade estimation, and a powerful "Target Planner" to determine precisely what marks are needed to achieve a specific Semester or Cumulative GPA.

## Features

- **Calculator Mode**: Instantly compute SGPA and update projections as you input raw internals, externals, or expected grades for each subject.
- **Target Planner Mode**: 
  - Input a target SGPA or CGPA.
  - Automatically back-calculates the required marks in the remaining external subjects.
  - Interactive "locking" mechanism: lock specific subjects or externals, and let the planner automatically redistribute the remaining required marks across the rest of the subjects.
- **Visual Analytics**: Interactive grading charts and stat cards to give a clear breakdown of grade distributions.
- **Local Storage Integration**: Ensures all your inputs, subjects, and parameters persist across reloads.
- **Theming**: Grade-color coding and highly responsive, sleek teal/dark UI powered by Tailwind CSS.

## Project Structure

The project has been organized for clarity and maintainability:

`
src/
├── components/          # Reusable UI building blocks
│   ├── GradeBarChart.jsx  # Recharts implementation for grade distributions
│   ├── GradeTooltip.jsx   # Custom tooltip for charts
│   ├── StatCard.jsx       # Analytical KPI displays (Target SGPA etc)
│   ├── SubjectRow.jsx     # Individual subject inputs in Calculator
│   ├── SubjectTable.jsx   # Main wrapper for subject entries
│   └── TinySnackbar.jsx   # Toast notifications
│
├── pages/               # Top-level route modules
│   ├── CalculatorPage.jsx # Core "What is my GPA?" page
│   └── TargetPage.jsx     # Complex "How to get this GPA?" planner 
│
├── utils/               # Pure business-logic & helper functions
│   ├── gpa.js             # Core math for points, credits, required marks
│   ├── grading.js         # Constants/helpers for grade themes, bounds
│   └── storage.js         # AppState localStorage serialization wrapper
│
├── App.jsx              # Main Router and State container
├── index.css            # Tailwind directives and base CSS
└── main.jsx             # React DOM initialization
`

## Running Locally

1. Install dependencies:
   `ash
   npm install
   `

2. Start the Vite dev server:
   `ash
   npm run dev
   `

3. Build for production:
   `ash
   npm run build
   `

## Technology Stack

- **React 19**
- **React Router v7**
- **Vite**
- **Tailwind CSS 3.4**
- **Recharts**
