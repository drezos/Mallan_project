# MarketPulse Frontend

Real-time iGaming market intelligence dashboard built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `VITE_API_URL` - Your backend API URL

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Layout.tsx        # Main layout with sidebar
│   ├── MetricCard.tsx    # Scorecard metric display
│   ├── AlertsPanel.tsx   # Alert list component
│   ├── CompetitorTable.tsx # Competitor comparison table
│   └── TrendChart.tsx    # Recharts area chart
├── pages/          # Route pages
│   ├── Dashboard.tsx     # Main dashboard
│   ├── Competitors.tsx   # Competitor analysis (Week 3)
│   ├── Alerts.tsx        # Alert history (Week 2)
│   └── Settings.tsx      # User settings (Week 2)
├── hooks/          # Custom React hooks (Week 2)
├── lib/            # Utilities and data
│   ├── mockData.ts       # Mock data for development
│   └── utils.ts          # Helper functions
└── styles/         # Global styles
```

## Deployment

This project is configured for Vercel deployment:

1. Push to GitHub
2. Connect repo to Vercel
3. Vercel auto-detects Vite and deploys

Or deploy manually:

```bash
npm run build
# Upload 'dist' folder to your hosting
```

## Design System

### Colors

- **Forest Green (Primary):** `#2d6e40` - Trust, growth, positive
- **Burnt Orange (Accent):** `#fe7c11` - Alerts, emphasis, CTAs
- **Slate (Neutrals):** Warm grays for text and backgrounds

### Typography

- **Display:** Outfit - Headlines and scores
- **Body:** DM Sans - All other text
- **Mono:** JetBrains Mono - Numbers and data

## Next Steps

- [ ] Week 2: Connect to real API, add auth
- [ ] Week 3: Competitor detail pages, email settings
- [ ] Week 4: Polish, testing, launch
