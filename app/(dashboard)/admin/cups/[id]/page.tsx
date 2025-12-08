'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Cup {
  id: string
  name: string
  description: string | null
  league_id: string
  season: string | null
  total_teams: number
  teams_per_group: number
  status: 'draft' | 'group_stage' | 'knockout' | 'completed'
}

interface Team {
  id: string
  name: string
  division_id: string
}

interface CupTeam {
  id: string
  team_id: string
  group_id: string | null
  team: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  group_name: string
  group_order: number
  teams: CupTeam[]
}

export default function CupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const cupId = params?.id as string

  const [cup, setCup] = useState<Cup | null>(null)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [cupTeams, setCupTeams] = useState<CupTeam[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (cupId) {
      fetchCupData()
    }
  }, [cupId])

  const fetchCupData = async () => {
    setLoading(true)

    // Fetch cup details
    const { data: cupData } = await supabase
      .from('cups')
      .select('*')
      .eq('id', cupId)
      .single()

    if (cupData) {
      setCup(cupData)

      // Fetch available teams from the cup's league
      const { data: teamsData } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          division_id,
          division:divisions!inner(league_id)
        `)
        .eq('division.league_id', cupData.league_id)
        .order('name')

      if (teamsData) {
        setAvailableTeams(teamsData as any)
      }

      // Fetch cup teams
      const { data: cupTeamsData } = await supabase
        .from('cup_teams')
        .select(`
          id,
          team_id,
          group_id,
          team:teams(id, name)
        `)
        .eq('cup_id', cupId)

      if (cupTeamsData) {
        setCupTeams(cupTeamsData as any)
      }

      // Fetch groups
      const { data: groupsData } = await supabase
        .from('cup_groups')
        .select('*')
        .eq('cup_id', cupId)
        .order('group_order')

      if (groupsData) {
        // Organize teams by group
        const groupsWithTeams = groupsData.map(group => ({
          ...group,
          teams: (cupTeamsData || []).filter((ct: any) => ct.group_id === group.id)
        }))
        setGroups(groupsWithTeams)
      }
    }

    setLoading(false)
  }

  const addTeamsToCup = async () => {
    if (selectedTeams.length === 0) {
      setError('Please select at least one team')
      return
    }

    if (!cup) return

    const currentCount = cupTeams.length
    const newCount = currentCount + selectedTeams.length

    if (newCount > cup.total_teams) {
      setError(`Cannot add ${selectedTeams.length} teams. Maximum is ${cup.total_teams}, and you already have ${currentCount}.`)
      return
    }

    setError('')

    const teamsToInsert = selectedTeams.map(teamId => ({
      cup_id: cupId,
      team_id: teamId
    }))

    const { error: insertError } = await supabase
      .from('cup_teams')
      .insert(teamsToInsert)

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(`${selectedTeams.length} team(s) added successfully`)
      setSelectedTeams([])
      setSearchQuery('')
      fetchCupData()
    }
  }

  const removeTeamFromCup = async (cupTeamId: string) => {
    if (!confirm('Remove this team from the cup?')) return

    const { error: deleteError } = await supabase
      .from('cup_teams')
      .delete()
      .eq('id', cupTeamId)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setSuccess('Team removed successfully')
      fetchCupData()
    }
  }

  const generateGroups = async () => {
    if (!cup) return

    if (cupTeams.length !== cup.total_teams) {
      setError(`Please add exactly ${cup.total_teams} teams before generating groups. Currently have ${cupTeams.length}.`)
      return
    }

    if (!confirm(`This will create ${Math.ceil(cup.total_teams / cup.teams_per_group)} groups and randomly distribute teams. Continue?`)) {
      return
    }

    setError('')

    // Delete existing groups first
    await supabase
      .from('cup_groups')
      .delete()
      .eq('cup_id', cupId)

    // Calculate number of groups
    const totalGroups = Math.ceil(cup.total_teams / cup.teams_per_group)

    // Create groups
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
    const groupsToInsert = []

    for (let i = 0; i < totalGroups; i++) {
      groupsToInsert.push({
        cup_id: cupId,
        group_name: `Group ${groupNames[i]}`,
        group_order: i + 1
      })
    }

    const { data: createdGroups, error: groupError } = await supabase
      .from('cup_groups')
      .insert(groupsToInsert)
      .select()

    if (groupError) {
      setError(groupError.message)
      return
    }

    if (!createdGroups) return

    // Shuffle teams randomly
    const shuffledTeams = [...cupTeams].sort(() => Math.random() - 0.5)

    // Distribute teams to groups
    for (let i = 0; i < shuffledTeams.length; i++) {
      const groupIndex = i % totalGroups
      const group = createdGroups[groupIndex]

      await supabase
        .from('cup_teams')
        .update({ group_id: group.id })
        .eq('id', shuffledTeams[i].id)
    }

    setSuccess('Groups generated and teams distributed successfully!')
    fetchCupData()
  }

  const toggleTeamSelection = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId))
    } else {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  const filteredAvailableTeams = availableTeams.filter(team =>
    !cupTeams.some(ct => ct.team_id === team.id) &&
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-liberia-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cup details...</p>
        </div>
      </div>
    )
  }

  if (!cup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Cup not found</p>
          <button
            onClick={() => router.push('/admin/cups')}
            className="mt-4 text-liberia-blue hover:underline"
          >
            Back to Cups
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.push('/admin/cups')}
            className="text-blue-100 hover:text-white mb-4 flex items-center"
          >
            ← Back to Cups
          </button>
          <h1 className="text-3xl font-bold mb-2">{cup.name}</h1>
          <p className="text-blue-100">
            {cup.season && `${cup.season} • `}
            {cupTeams.length} / {cup.total_teams} teams
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-liberia-blue mb-2">
              {cupTeams.length} / {cup.total_teams}
            </div>
            <div className="text-gray-600">Teams Added</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {groups.length}
            </div>
            <div className="text-gray-600">Groups Created</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {cup.teams_per_group}
            </div>
            <div className="text-gray-600">Teams per Group</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {cup.status.replace('_', ' ').toUpperCase()}
            </div>
            <div className="text-gray-600">Status</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Teams Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Teams</h2>
              {selectedTeams.length > 0 && (
                <button
                  onClick={addTeamsToCup}
                  className="bg-liberia-red hover:bg-liberia-blue text-white font-bold py-2 px-4 rounded transition text-sm"
                >
                  Add {selectedTeams.length} Team{selectedTeams.length > 1 ? 's' : ''}
                </button>
              )}
            </div>

            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailableTeams.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {searchQuery ? 'No teams found' : 'All teams have been added'}
                  </p>
                ) : (
                  filteredAvailableTeams.map(team => (
                    <label
                      key={team.id}
                      className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => toggleTeamSelection(team.id)}
                        className="w-5 h-5 text-liberia-blue rounded focus:ring-liberia-blue"
                      />
                      <span className="ml-3 font-medium">{team.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Current Teams Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Cup Teams ({cupTeams.length})</h2>
              {cupTeams.length === cup.total_teams && groups.length === 0 && (
                <button
                  onClick={generateGroups}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition text-sm"
                >
                  Generate Groups
                </button>
              )}
            </div>

            <div className="p-6">
              {cupTeams.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No teams added yet</p>
                  <p className="text-sm mt-2">Select teams from the left to add them</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cupTeams.map(cupTeam => (
                    <div
                      key={cupTeam.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{cupTeam.team.name}</p>
                        {cupTeam.group_id && (
                          <p className="text-xs text-gray-500">
                            {groups.find(g => g.id === cupTeam.group_id)?.group_name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeTeamFromCup(cupTeam.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Groups Display */}
        {groups.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Groups</h2>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {groups.map(group => (
                    <div key={group.id} className="border-2 border-liberia-blue rounded-lg p-4">
                      <h3 className="text-lg font-bold text-liberia-blue mb-4">
                        {group.group_name}
                      </h3>
                      <div className="space-y-2">
                        {group.teams.length === 0 ? (
                          <p className="text-sm text-gray-500">No teams assigned</p>
                        ) : (
                          group.teams.map((team, index) => (
                            <div key={team.id} className="flex items-center">
                              <span className="text-gray-500 w-6">{index + 1}.</span>
                              <span className="font-medium">{team.team.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
