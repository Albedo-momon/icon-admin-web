# Icon Admin Web

A minimal admin web application built with Vite + React (TypeScript).

## Tech Stack

- **Frontend**: Vite + React (TypeScript)
- **Styling**: TailwindCSS
- **Routing**: React Router
- **State Management**: React Query
- **HTTP Client**: Axios
- **Forms**: react-hook-form + zod
- **Testing**: Vitest + Testing Library

## Getting Started

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:8080)
- `VITE_USE_MOCK`: Use mock data instead of real API (0 or 1)

## Mock Mode

Set `VITE_USE_MOCK=1` in your `.env` file to use local mock data instead of calling the backend API.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
