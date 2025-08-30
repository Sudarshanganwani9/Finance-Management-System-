# 📊 Finance Management System

A modern Finance Management Web Application built with React, TypeScript, Vite, Tailwind CSS, and Supabase.
It helps users manage budgets, transactions, and analytics in a clean and interactive dashboard.

## 🚀 Features

🔑 Authentication (Supabase Auth)

📂 Dashboard Overview (income, expenses, balance)

💰 Budget Management (create, track, progress bar)

📊 Transaction Tracking (add, view, filter transactions)

📈 Analytics (charts for spending & savings)

🎨 Responsive UI with reusable components (ShadCN, Tailwind)


## 🛠️ Tech Stack

Frontend: React, TypeScript, Vite

Styling: Tailwind CSS, ShadCN UI

Backend & Auth: Supabase

State Management & Hooks: React Hooks


## 📂 Project Structure

src/
 ├── assets/            # Images & static assets
 ├── components/        # Reusable UI + feature components
 ├── hooks/             # Custom React hooks
 ├── integrations/      # Supabase integration
 ├── lib/               # Utility functions
 ├── pages/             # Main app pages
 ├── App.tsx            # Root component
 └── main.tsx           # Entry point

## ⚡ Getting Started

1. Clone the repository

git clone https://github.com/Sudarshanganwani9/Finance-Management-System-
cd Finance-Management-System

2. Install dependencies

npm install
# or
bun install

3. Configure environment variables

Create a .env file in the project root:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Run the project

npm run dev

The app will start at:
👉 http://localhost:5173

## 📊 Screens & Modules

Login/Register (Supabase Auth)

Dashboard (overview cards, charts)

Budgets (create & manage budgets)

Transactions (list & add expenses/income)

Analytics (graphs and spending insights)

