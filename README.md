# 🎓 GPA Toolkit

A beautiful, fully responsive **GPA Calculator & Target Planner** built from the ground up with **React** and **Tailwind CSS**. It helps students track current performance and mathematically plan out the precise scores needed to hit graduation targets.

---

## ✨ Core Features

- **📱 Beautiful Responsive UI:** Grade-color coded interface built with Tailwind CSS, seamlessly snapping from mobile to ultra-wide displays.
- **📊 Real-time Math:** Point interpolation dynamically changes SGPA bounds based on specific Internal (max 50) and External (max 100) university marks.
- **🎯 Target Architect:** The powerful Target Planner computes exactly what external scores you need out of 100 to reverse-engineer a specific SGPA or CGPA target.
- **🔒 Context Locks:** Lock specific subjects and the planner automatically trickles down your required points to all remaining unlocked subjects.
- **💾 Local Persistence:** Browser localStorage natively caches all entered grades and configuration values to never lose your working state.

---

## 🛠️ Project Structure

The project has been extensively modularized into standard React feature directories.

- **src/pages/** (*Route views*)
  - **CalculatorPage.jsx** — The standard *"What is my GPA?"* view.
  - **TargetPage.jsx** — The complex backward-calculating *"How do I get this GPA?"* view.
  
- **src/components/** (*Reusable UI building blocks*)
  - **GradeBarChart.jsx** / **GradeTooltip.jsx** — Recharts graph integrations.
  - **StatCard.jsx** — Clean, animated stat cards displaying metrics.
  - **SubjectTable.jsx** / **SubjectRow.jsx** — The core dynamic list of inputs for internals, externals, and grades.
  - **TinySnackbar.jsx** — Lightweight notification feedback toaster.
  - **HelpModal.jsx** — Quick interactive visual guide overlay.

- **src/utils/** (*Pure application logic*)
  - **gpa.js** — Advanced mathematically pure constraints, required grading, credits aggregation, and logic.
  - **grading.js** — Grade lookup tables and Tailwind theme bindings for specific marks (e.g., S → Green, F → Red).
  - **storage.js** — Safely handles hydration and serialization against browser LocalStorage window state.

---

## 🚀 Running Locally

1. **Install runtime dependencies:**
   \\\ash
   npm install
   \\\

2. **Spin up the Vite development server:**
   \\\ash
   npm run dev
   \\\

3. **Build optimized bundles for production:**
   \\\ash
   npm run build
   \\\

---

### *Powered up by:*
**React 19** • **Vite** • **Tailwind CSS 3.4** • **React Router v7** • **Recharts**
