'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

type FilterType = 'all' | 'league' | 'cup'

export default function FixturesPage() {
  const supabase = createClient()

  const [allMatches, setAllMatches] = useState<any[]>([])
  const [leagues, setLeagues] = useState<any[]>([])
  const [cups, setCups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [selectedCup, setSelectedCup] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // Fetch leagues for filter dropdown
    const { data: leaguesData } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name')

    // Fetch cups for filter dropdown
    const { data: cupsData } = await supabase
      .from('cups')
      .select('id, name')
      .order('name')

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
          league_id,
          league:leagues (
            id,
            name
          )
        )
      `)
      .order('match_date', { ascending: true })
      .limit(100)

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
      .limit(100)

    // Format cup matches to match league match structure
    const formattedCupMatches = cupMatches?.map((match: any) => ({
      ...match,
      division: { name: match.cup?.name || 'Cup Competition', league_id: null },
      cup_id: match.cup?.id,
      competition_type: 'cup'
    })) || []

    // Format league matches
    const formattedLeagueMatches = leagueMatches?.map((match: any) => ({
      ...match,
      competition_type: 'league'
    })) || []

    // Combine league and cup matches
    const combined = [...formattedLeagueMatches, ...formattedCupMatches]
      .sort((a, b) => {
        // Matches without dates go to the end
        if (!a.match_date && !b.match_date) return 0
        if (!a.match_date) return 1
        if (!b.match_date) return -1

        // Sort by date/time (earliest first)
        const dateA = new Date(a.match_date).getTime()
        const dateB = new Date(b.match_date).getTime()
        return dateA - dateB
      })

    setAllMatches(combined)
    setLeagues(leaguesData || [])
    setCups(cupsData || [])
    setLoading(false)
  }

  // Filter matches based on selected filters
  const getFilteredMatches = () => {
    let filtered = allMatches

    // Filter by competition type
    if (filterType === 'league') {
      filtered = filtered.filter(m => m.competition_type === 'league')
    } else if (filterType === 'cup') {
      filtered = filtered.filter(m => m.competition_type === 'cup')
    }

    // Filter by specific league
    if (selectedLeague !== 'all' && filterType === 'league') {
      filtered = filtered.filter(m => m.division?.league_id === selectedLeague)
    }

    // Filter by specific cup
    if (selectedCup !== 'all' && filterType === 'cup') {
      filtered = filtered.filter(m => m.cup_id === selectedCup)
    }

    return filtered
  }

  const filteredMatches = getFilteredMatches()

  // Group matches by status
  const upcomingMatches = filteredMatches.filter((m) => m.status === 'scheduled')
  const liveMatches = filteredMatches.filter((m) => m.status === 'live')
  const completedMatches = filteredMatches.filter((m) => m.status === 'completed')

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
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
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
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-gray-600">Loading fixtures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Fixtures & Results</h1>
          <p className="text-blue-100">View matches across all competitions</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Filter Fixtures</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Competition Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competition Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as FilterType)
                  setSelectedLeague('all')
                  setSelectedCup('all')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
              >
                <option value="all">All Competitions</option>
                <option value="league">League Matches Only</option>
                <option value="cup">Cup Matches Only</option>
              </select>
            </div>

            {/* League Filter */}
            {filterType === 'league' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select League
                </label>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                >
                  <option value="all">All Leagues</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cup Filter */}
            {filterType === 'cup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cup
                </label>
                <select
                  value={selectedCup}
                  onChange={(e) => setSelectedCup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                >
                  <option value="all">All Cups</option>
                  {cups.map((cup) => (
                    <option key={cup.id} value={cup.id}>
                      {cup.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
            {filterType !== 'all' && ` in ${filterType} competitions`}
          </div>
        </div>

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
              <p className="text-gray-600">
                {filterType === 'all'
                  ? 'Check back later for new fixtures'
                  : `No upcoming ${filterType} matches found`}
              </p>
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
              <p className="text-gray-600">
                {filterType === 'all'
                  ? 'Results will appear here after matches are played'
                  : `No completed ${filterType} matches found`}
              </p>
            </div>
          )}
        </div>

        {completedMatches.length > 9 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {/* Could implement pagination here */}}
              className="bg-liberia-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-liberia-blue transition"
            >
              Load More Results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
