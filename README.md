# HabitFlow ⚡

A stunning PWA habit tracker built with Next.js 14, MongoDB, TypeScript & Tailwind CSS.

## Features
- 🌙 Dark aurora theme with glassmorphism
- ✅ Good habits daily tracking with streaks
- 🚭 Bad habit breaking with money & health savings calculator
- 📝 Todo list with priority levels
- 📊 Stats page with weekly chart
- 👤 Auth (register/login) with NextAuth
- 🛡️ Admin panel
- 📱 PWA — install on iPhone/Android

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Create `.env.local` (already included):
```
MONGODB_URI=mongodb+srv://hesamhadadi03_db_user:5fvCmN5TjcBhhsVI@habit.laeanj5.mongodb.net/habitflow?appName=habit
NEXTAUTH_SECRET=habitflow-super-secret-key-2024-change-in-production
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=your-email@example.com
```

> ⚠️ Change `ADMIN_EMAIL` to your email — that account gets admin role automatically on register.

### 3. Run development
```bash
npm run dev
```

### 4. Open
Go to [http://localhost:3000](http://localhost:3000)

### 5. Register
- Go to `/auth/register`
- Use the email you set as `ADMIN_EMAIL` to get admin access
- 5 default habits are added automatically

## Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Add env vars in Vercel dashboard and change `NEXTAUTH_URL` to your domain.

## Install as PWA
- On iPhone: Safari → Share → Add to Home Screen
- On Android: Chrome → Menu → Install App

## Tech Stack
- **Next.js 14** (App Router)
- **MongoDB** + Mongoose
- **NextAuth.js** (JWT)
- **Tailwind CSS** (custom aurora design)
- **TypeScript**
- **next-pwa**
- **Playfair Display** + **DM Sans** fonts
- **Lucide React** icons
