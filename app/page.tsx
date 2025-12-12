import Link from 'next/link'
import AnnouncementsFeed from '@/components/AnnouncementsFeed'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Fetch active cups with their teams
  const { data: activeCups } = await supabase
    .from('cups')
    .select(`
      id,
      name,
      start_date,
      end_date,
      status,
      cup_teams_registry (
        id,
        name
      )
    `)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(3)

  // Fetch real stats from database
  const [
    leaguesResult,
    divisionsResult,
    leagueTeamsResult,
    cupTeamsResult,
    playersResult
  ] = await Promise.all([
    supabase.from('leagues').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('divisions').select('id, leagues!inner(is_active)', { count: 'exact', head: true }).eq('leagues.is_active', true),
    // Count teams from leagues/divisions
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    // Count teams from cups
    supabase.from('cup_teams_registry').select('id', { count: 'exact', head: true }),
    supabase.from('players').select('id', { count: 'exact', head: true }),
  ])

  // Calculate stats from database queries

  const stats = {
    leagues: leaguesResult.count || 0,
    divisions: divisionsResult.count || 0,
    // Total teams = league teams + cup teams
    teams: (leagueTeamsResult.count || 0) + (cupTeamsResult.count || 0),
    players: playersResult.count || 0,
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Liberia Leagues",
    "description": "Official platform for Liberia's football leagues. View fixtures, standings, teams, players, and live match results.",
    "url": "https://www.liberialeagues.com",
    "logo": "https://www.liberialeagues.com/logo.png",
    "sameAs": [
      "https://twitter.com/liberialeagues",
      "https://facebook.com/liberialeagues"
    ],
    "sport": "Football",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "LR"
    }
  }

  return (
    <div className="bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Liberia Division League
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Your complete platform for managing and tracking Liberia's football leagues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/standings"
                className="bg-yellow-500 text-liberia-blue-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition"
              >
                View Standings
              </Link>
              <Link
                href="/fixtures"
                className="bg-white text-liberia-blue-dark px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
              >
                Fixtures & Scores
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-liberia-blue mb-2">{stats.leagues}</div>
              <div className="text-gray-600">Active Leagues</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-liberia-blue mb-2">{stats.divisions}</div>
              <div className="text-gray-600">Divisions</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-liberia-blue mb-2">{stats.teams}</div>
              <div className="text-gray-600">Teams</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-liberia-blue mb-2">{stats.players}</div>
              <div className="text-gray-600">Players</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <AnnouncementsFeed />
          </div>

          {/* Active Cups Section */}
          {activeCups && activeCups.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                Active Cup Competitions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeCups.map((cup: any) => (
                  <Link
                    key={cup.id}
                    href={`/admin/cups/${cup.id}`}
                    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4 border-liberia-red"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {cup.name}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {new Date(cup.start_date).toLocaleDateString()} - {new Date(cup.end_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {cup.cup_teams_registry?.length || 0} Teams
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">⚽</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Live Standings
              </h3>
              <p className="text-gray-600">
                Real-time league standings updated automatically after each match.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Player Statistics
              </h3>
              <p className="text-gray-600">
                Comprehensive player stats including goals, assists, and cards.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Fixtures & Live Scores
              </h3>
              <p className="text-gray-600">
                Complete fixture schedules, live matches, and results for all divisions.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
