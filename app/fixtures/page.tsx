import { createClient } from '@/lib/supabase/server'
import type { Match } from '@/lib/types/database.types'

export default async function FixturesPage() {
  const supabase = await createClient()

  // Fetch league matches with team information
  const { data: leagueMatches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey (
        id,
        name,
        logo_url
      ),
      away_team:teams!matches_away_team_id_fkey (
        id,
        name,
        logo_url
      ),
      division:divisions (
        id,
        name,
        league:leagues (
          name
        )
      )
    `)
    .order('match_date', { ascending: true })
    .limit(50)

  // Fetch cup matches with team information from cup_teams_registry
  const { data: cupMatches } = await supabase
    .from('cup_matches')
    .select(`
      *,
      home_team:cup_teams_registry!cup_matches_home_cup_team_id_fkey (
        id,
        name,
        logo_url
      ),
      away_team:cup_teams_registry!cup_matches_away_cup_team_id_fkey (
        id,
        name,
        logo_url
      ),
      cup:cups (
        id,
        name
      )
    `)
    .order('match_date', { ascending: true })
    .limit(50)

  // Format cup matches to match league match structure
  const formattedCupMatches = cupMatches?.map((match: any) => ({
    ...match,
    division: { name: match.cup?.name || 'Cup Competition' },
    competition_type: 'cup'
  })) || []

  // Combine league and cup matches
  const allMatches = [...(leagueMatches || []), ...formattedCupMatches]
    .sort((a, b) => {
      const dateA = a.match_date ? new Date(a.match_date).getTime() : 0
      const dateB = b.match_date ? new Date(b.match_date).getTime() : 0
      return dateA - dateB
    })

  // Group matches by status
  const upcomingMatches = allMatches.filter((m) => m.status === 'scheduled')
  const liveMatches = allMatches.filter((m) => m.status === 'live')
  const completedMatches = allMatches.filter((m) => m.status === 'completed')

  const MatchCard = ({ match }: { match: any }) => {
    const matchDate = new Date(match.match_date)
    const isCompleted = match.status === 'completed'
    const isLive = match.status === 'live'

    return (
      <div className={`bg-white rounded-lg shadow p-6 ${isLive ? 'border-2 border-red-500' : ''}`}>
        {/* Match Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-gray-600">
            {match.division?.name}
            {isLive && <span className="ml-2 text-red-500 font-bold">LIVE</span>}
          </div>
          <div className="text-sm text-gray-500">
            {matchDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-4">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                {match.home_team?.logo_url ? (
                  <img
                    src={match.home_team.logo_url}
                    alt={match.home_team.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-xs">⚽</span>
                )}
              </div>
              <span className="font-semibold">{match.home_team?.name || 'TBD'}</span>
            </div>
            {isCompleted || isLive ? (
              <div className="text-3xl font-bold text-gray-900 w-12 text-center">
                {match.home_score}
              </div>
            ) : null}
          </div>

          {/* Versus or Time */}
          <div className="text-center text-gray-400 text-sm">
            {!isCompleted && !isLive ? (
              matchDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            ) : (
              'vs'
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                {match.away_team?.logo_url ? (
                  <img
                    src={match.away_team.logo_url}
                    alt={match.away_team.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-xs">⚽</span>
                )}
              </div>
              <span className="font-semibold">{match.away_team?.name || 'TBD'}</span>
            </div>
            {isCompleted || isLive ? (
              <div className="text-3xl font-bold text-gray-900 w-12 text-center">
                {match.away_score}
              </div>
            ) : null}
          </div>
        </div>

        {/* Match Info */}
        {match.venue && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600 flex items-center">
            <span className="mr-2">📍</span>
            {match.venue}
          </div>
        )}

        {isCompleted && (
          <div className="mt-3 text-center">
            <button className="text-sm text-liberia-red hover:text-liberia-blue font-medium">
              View Match Report →
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Fixtures & Results</h1>
          <p className="text-blue-100">All matches across divisions</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Live Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
          {upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-5xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Upcoming Matches</h3>
              <p className="text-gray-600">Check back later for new fixtures</p>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
          {completedMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedMatches.slice(0, 9).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-5xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Results Yet</h3>
              <p className="text-gray-600">Results will appear here after matches are played</p>
            </div>
          )}
        </div>

        {completedMatches.length > 9 && (
          <div className="mt-6 text-center">
            <button className="bg-liberia-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-liberia-blue transition">
              Load More Results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
