# Liberia Division League Management App

A comprehensive web-based platform for managing local sports division leagues in Liberia. This application enables league administrators to organize divisions, schedule matches, track results, manage teams and players, and engage with fans through real-time updates and analytics.

![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-38B2AC?style=flat-square&logo=tailwind-css)

## Features

### Core Functionality
- **League & Division Management** - Create and manage multiple leagues and divisions
- **Team Registration** - Register teams with detailed information (logo, home city, etc.)
- **Player Management** - Track player profiles, statistics, and performance
- **Fixture Generation** - Automatic round-robin fixture scheduling
- **Match Management** - Real-time score submission and match event tracking
- **Live Standings** - Automatically calculated league tables with promotion/relegation
- **Analytics & Reports** - Comprehensive statistics and exportable reports
- **Fan Engagement** - Voting systems, announcements, and public pages

### User Roles
- **Admin** - Full system control and configuration
- **Team Manager** - Team and player management
- **Match Official** - Score submission and match reports
- **Player** - Personal statistics and profile
- **Fan** - View fixtures, results, and participate in voting

## Tech Stack

- **Frontend**: Next.js 15+ with TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Hosting**: Supabase
- **Styling**: TailwindCSS with custom design system

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Santos1134/localLeagues.git
cd localLeagues
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

The `.env.local` file is already configured with Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ytmdnkghtnbotbnftlej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Set up the database**

Go to your Supabase dashboard and run the SQL script:
- Navigate to SQL Editor in Supabase dashboard
- Copy contents from `database-schema.sql`
- Execute the script to create all tables, views, and policies

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
localLeagues/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Header/Footer
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components (Header, Footer)
│   ├── ui/               # Reusable UI components
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── supabase/         # Supabase client configuration
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── database-schema.sql   # Complete database schema
├── middleware.ts         # Next.js middleware for auth
├── SETUP.md             # Detailed setup instructions
└── PROJECT_STATUS.md    # Current project status and roadmap
```

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following key tables:

- **profiles** - User profiles with role-based access
- **leagues** - Sports leagues configuration
- **divisions** - Divisions within leagues
- **teams** - Team information and management
- **players** - Player profiles and statistics
- **matches** - Fixtures and match results
- **match_events** - Goals, cards, substitutions
- **fan_votes** - Fan engagement and voting
- **announcements** - League announcements

Plus materialized views for:
- **division_standings** - Auto-calculated league standings
- **player_stats** - Aggregated player statistics

## Key Features by Role

### Admin
- Create and manage leagues and divisions
- Configure seasons and rules
- Manage user roles and permissions
- Access all analytics and reports

### Team Manager
- Register and manage team
- Add/remove players
- Update team information
- View team statistics

### Match Official
- Submit match scores
- Record match events (goals, cards, etc.)
- Add match notes

### Player
- View personal statistics
- Update profile
- View match schedules

### Fan
- View fixtures and results
- View league standings
- View player statistics
- Vote for player of the week

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Documentation

- [SETUP.md](SETUP.md) - Detailed setup instructions
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status and roadmap
- [database-schema.sql](database-schema.sql) - Complete database schema

## Roadmap

### Current Phase: Foundation Complete ✅
- [x] Project setup and configuration
- [x] Database schema design
- [x] Basic UI and navigation
- [x] Supabase integration

### Next Phase: Core Features
- [ ] Authentication and user management
- [ ] Admin dashboard
- [ ] Team and player management
- [ ] Fixture generation
- [ ] Match management
- [ ] Standings calculation

### Future Enhancements
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Video highlights
- [ ] Social media integration
- [ ] Sponsor management

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control at database level
- Secure authentication via Supabase Auth
- Protected API routes and pages

## Contributing

This is a proprietary project for managing Liberian football leagues.

## License

Proprietary - Liberia Division League Management System

## Support

For questions or issues, please refer to the documentation in this repository.
