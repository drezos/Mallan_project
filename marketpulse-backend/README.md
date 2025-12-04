# MarketPulse Backend

Real-time iGaming market intelligence platform API for Netherlands operators.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations (requires DATABASE_URL)
npm run db:migrate

# Seed with mock data (optional, for development)
npm run db:seed

# Start development server
npm run dev
```

## Configuration

This instance is configured for:
- **Brand**: Jacks.nl
- **Market**: Netherlands (region ID: 2528)
- **Language**: Dutch (nl)

### Tracked Competitors (10)
1. Toto
2. Unibet
3. Bet365
4. BetCity
5. Holland Casino
6. Circus
7. 711
8. Kansino
9. BetMGM
10. LeoVegas

### Intent Keywords (20)
Tracking Dutch search terms across 5 categories:
- **Comparison**: beste online casino, casino vergelijken
- **Problem**: casino uitbetaling problemen, casino klacht
- **Regulation**: casino vergunning nederland, legaal online casino
- **Product**: casino bonus, welkomstbonus casino
- **Review**: casino review, casino ervaring

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Server status & config |
| `/api/config` | GET | Public configuration |
| `/api/metrics` | GET | Today's calculated metrics |
| `/api/metrics/history` | GET | 12-week trend data |
| `/api/metrics/summary` | GET | Dashboard summary cards |
| `/api/competitors` | GET | All tracked competitors |
| `/api/competitors/:id` | GET | Competitor detail |
| `/api/alerts` | GET | Recent alerts |
| `/api/alerts/count` | GET | Unread alert count |

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL

## Project Structure

```
backend/
├── src/
│   ├── config/app.config.ts    # Brand, competitors, keywords
│   ├── db/
│   │   ├── index.ts            # Database connection
│   │   ├── migrate.ts          # Schema migration
│   │   └── seed.ts             # Mock data seeding
│   ├── routes/
│   │   ├── metrics.ts          # /api/metrics
│   │   ├── competitors.ts      # /api/competitors
│   │   ├── alerts.ts           # /api/alerts
│   │   └── health.ts           # /api/health
│   ├── types/index.ts          # TypeScript types
│   └── index.ts                # Express app entry
├── .env.example
├── package.json
└── tsconfig.json
```

## Development Roadmap

### Week 1 (Current) ✅
- [x] Project setup
- [x] Express server
- [x] Database schema
- [x] Mock data endpoints
- [ ] Frontend dashboard (next)

### Week 2
- [ ] DataForSEO integration
- [ ] Real data pipeline
- [ ] 5 formula calculations
- [ ] Daily cron job (06:00 CET)

### Week 3
- [ ] Email digests (SendGrid)
- [ ] Advanced alerts
- [ ] Competitor detail screens

### Week 4
- [ ] Polish & deploy
- [ ] Landing page
- [ ] Production launch

---

Built for Jacks.nl competitive intelligence.
