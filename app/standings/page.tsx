'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import ExportButton from '@/components/ExportButton'
import Image from 'next/image'

type FilterType = 'all' | 'league' | 'cup'

export default function StandingsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [selectedCup, setSelectedCup] = useState<string>('all')

  const [leagues, setLeagues] = useState<any[]>([])
  const [cups, setCups] = useState<any[]>([])
  const [leagueStandings, setLeagueStandings] = useState<any[]>([])
  const [cupStandings, setCupStandings] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // Fetch leagues for filter (only active leagues)
    const { data: leaguesData } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    // Fetch cups for filter
    const { data: cupsData } = await supabase
      .from('cups')
      .select('id, name')
      .order('name')

    // Fetch all divisions with league info (only from active leagues)
    const { data: divisions } = await supabase
      .from('divisions')
      .select(`
        id,
        name,
        league_id,
        leagues!inner (
          id,
          name,
          is_active
        )
      `)
      .eq('leagues.is_active', true)
      .order('name')

    // Fetch standings for each division with team logos
    const standingsPromises = divisions?.map(async (division: any) => {
      const { data } = await supabase
        .from('division_standings')
        .select('*')
        .eq('division_id', division.id)
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .order('goals_for', { ascending: false })

      // Fetch team logos
      const standingsWithLogos = await Promise.all(
        (data || []).map(async (standing: any) => {
          const { data: team } = await supabase
            .from('teams')
            .select('logo_url')
            .eq('id', standing.team_id)
            .single()

          return {
            ...standing,
            logo_url: team?.logo_url
          }
        })
      )

      return {
        division,
        league_id: division.league_id,
        standings: standingsWithLogos,
      }
    }) || []

    const allLeagueStandings = await Promise.all(standingsPromises)

    // Fetch cup standings (groups)
    const { data: cupGroups } = await supabase
      .from('cup_groups')
      .select(`
        id,
        group_name,
        group_order,
        cup_id,
        cups (
          id,
          name
        )
      `)
      .order('group_order')

    const cupStandingsPromises = cupGroups?.map(async (group: any) => {
      const { data: teams } = await supabase
        .from('cup_teams')
        .select(`
          *,
          cup_team:cup_teams_registry (
            id,
            name,
            logo_url
          )
        `)
        .eq('group_id', group.id)
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .order('goals_for', { ascending: false })

      return {
        group,
        cup_id: group.cup_id,
        cup_name: (group.cups as any)?.name,
        teams: teams || []
      }
    }) || []

    const allCupStandings = await Promise.all(cupStandingsPromises)

    setLeagues(leaguesData || [])
    setCups(cupsData || [])
    setLeagueStandings(allLeagueStandings)
    setCupStandings(allCupStandings)
    setLoading(false)
  }

  const getFilteredStandings = () => {
    let filteredLeague = leagueStandings
    let filteredCup = cupStandings

    if (filterType === 'league') {
      filteredCup = []
      if (selectedLeague !== 'all') {
        filteredLeague = filteredLeague.filter(s => s.league_id === selectedLeague)
      }
    } else if (filterType === 'cup') {
      filteredLeague = []
      if (selectedCup !== 'all') {
        filteredCup = filteredCup.filter(s => s.cup_id === selectedCup)
      }
    }

    return { league: filteredLeague, cup: filteredCup }
  }

  const { league: filteredLeagueStandings, cup: filteredCupStandings } = getFilteredStandings()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">Loading standings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Standings</h1>
          <p className="text-blue-100">Current positions across all competitions</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Filter Standings</h3>

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
                <option value="league">League Standings Only</option>
                <option value="cup">Cup Standings Only</option>
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
        </div>

        {/* Standings Tables */}
        {filteredLeagueStandings.length === 0 && filteredCupStandings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Standings Available</h3>
            <p className="text-gray-600">
              {filterType === 'all'
                ? 'Standings will appear here once matches have been played'
                : `No ${filterType} standings found`}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* League Standings */}
            {filteredLeagueStandings.map(({ division, standings }) => (
              <div key={division.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-liberia-blue text-white px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{division.name}</h2>
                    {division.leagues && (
                      <p className="text-blue-100 text-sm">
                        {(division.leagues as any).name}
                      </p>
                    )}
                  </div>
                  <ExportButton data={standings} divisionName={division.name} type="standings" />
                </div>

                {standings && standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GF</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GA</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GD</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {standings.map((team: any, index: number) => {
                          const position = index + 1
                          const isPromotion = position <= 2
                          const isRelegation = position > standings.length - 2

                          return (
                            <tr
                              key={team.team_id}
                              className={`hover:bg-gray-50 ${
                                isPromotion ? 'border-l-4 border-green-500' :
                                isRelegation ? 'border-l-4 border-red-500' :
                                'border-l-4 border-transparent'
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{position}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                <div className="flex items-center gap-3">
                                  {team.logo_url ? (
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                      <Image src={team.logo_url} alt={team.team_name} width={32} height={32} className="object-contain" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                      {team.team_name.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{team.team_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.played}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.wins}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.draws}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.losses}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.goals_for}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.goals_against}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {team.goal_difference >= 0 ? '+' : ''}{team.goal_difference}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">{team.points}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No teams or matches in this division yet</div>
                )}

                {standings && standings.length > 0 && (
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex gap-6 text-xs text-gray-600">
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-l-4 border-green-500 mr-2"></div>
                        Promotion
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-l-4 border-red-500 mr-2"></div>
                        Relegation
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      P: Played, W: Won, D: Draw, L: Lost, GF: Goals For, GA: Goals Against, GD: Goal Difference, Pts: Points
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Cup Group Standings */}
            {filteredCupStandings.map(({ group, cup_name, teams }) => (
              <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-purple-600 text-white px-6 py-4">
                  <h2 className="text-2xl font-bold">{group.group_name}</h2>
                  <p className="text-purple-100 text-sm">{cup_name}</p>
                </div>

                {teams && teams.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GF</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GA</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GD</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teams.map((team: any, index: number) => {
                          const position = index + 1
                          const isQualified = position <= 2

                          return (
                            <tr
                              key={team.id}
                              className={`hover:bg-gray-50 ${
                                isQualified ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{position}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                <div className="flex items-center gap-3">
                                  {team.cup_team?.logo_url ? (
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                      <Image src={team.cup_team.logo_url} alt={team.cup_team.name} width={32} height={32} className="object-contain" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                      {team.cup_team?.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{team.cup_team?.name || 'Unknown Team'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.played}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.won}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.drawn}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.lost}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.goals_for}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{team.goals_against}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {team.goal_difference >= 0 ? '+' : ''}{team.goal_difference}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">{team.points}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No teams in this group yet</div>
                )}

                {teams && teams.length > 0 && (
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex gap-6 text-xs text-gray-600">
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-l-4 border-green-500 mr-2"></div>
                        Qualifies to Knockout Stage (Top 2)
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      P: Played, W: Won, D: Draw, L: Lost, GF: Goals For, GA: Goals Against, GD: Goal Difference, Pts: Points
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
