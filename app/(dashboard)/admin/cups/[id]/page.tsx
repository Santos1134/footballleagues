'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'

interface Cup {
  id: string
  name: string
  description: string | null
  season: string | null
  total_teams: number
  teams_per_group: number
  status: 'draft' | 'group_stage' | 'knockout' | 'completed'
  start_date: string | null
  end_date: string | null
}

interface CupTeam {
  cup_team_id: string
  id: string
  name: string
  short_name: string | null
  logo_url: string | null
  stadium: string | null
  city: string | null
  coach: string | null
  group_id: string | null
  group_name: string | null
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
}

interface Player {
  id: string
  name: string
  position: string | null
}

interface CupPlayer {
  id: string
  player_id: string
  player_name: string
  position: string | null
  jersey_number: number | null
  is_captain: boolean
}

interface Group {
  id: string
  group_name: string
  group_order: number
  teams: CupTeam[]
}

interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  home_team_name: string
  away_team_name: string
  match_date: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  stage: 'group' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final'
  group_id: string | null
  group_name: string | null
}

type TabType = 'overview' | 'teams' | 'players' | 'groups' | 'fixtures' | 'knockout' | 'standings'

export default function CupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const cupId = params.id as string
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [cup, setCup] = useState<Cup | null>(null)
  const [cupTeams, setCupTeams] = useState<CupTeam[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Team management
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    short_name: '',
    logo_url: '',
    stadium: '',
    city: '',
    coach: ''
  })

  // Player management
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState('')
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [cupPlayers, setCupPlayers] = useState<CupPlayer[]>([])
  const [showAddPlayers, setShowAddPlayers] = useState(false)

  useEffect(() => {
    fetchCupData()
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

      // Fetch teams in this cup from independent registry
      const { data: teamsData } = await supabase
        .from('cup_teams')
        .select(`
          id,
          cup_id,
          cup_team_id,
          group_id,
          points,
          played,
          won,
          drawn,
          lost,
          goals_for,
          goals_against,
          goal_difference,
          cup_team:cup_teams_registry (
            id,
            name,
            short_name,
            logo_url,
            stadium,
            city,
            coach
          ),
          cup_groups (
            id,
            group_name
          )
        `)
        .eq('cup_id', cupId)

      const formattedTeams = teamsData?.map((ct: any) => ({
        cup_team_id: ct.id,
        id: ct.cup_team?.id || ct.cup_team_id,
        name: ct.cup_team?.name || 'Unknown Team',
        short_name: ct.cup_team?.short_name || null,
        logo_url: ct.cup_team?.logo_url || null,
        stadium: ct.cup_team?.stadium || null,
        city: ct.cup_team?.city || null,
        coach: ct.cup_team?.coach || null,
        group_id: ct.group_id,
        group_name: ct.cup_groups?.group_name || null,
        points: ct.points,
        played: ct.played,
        won: ct.won,
        drawn: ct.drawn,
        lost: ct.lost,
        goals_for: ct.goals_for,
        goals_against: ct.goals_against,
        goal_difference: ct.goal_difference
      })) || []

      setCupTeams(formattedTeams)

      // Fetch groups
      const { data: groupsData } = await supabase
        .from('cup_groups')
        .select('*')
        .eq('cup_id', cupId)
        .order('group_order')

      if (groupsData) {
        const groupsWithTeams = groupsData.map(group => ({
          ...group,
          teams: formattedTeams.filter((t: CupTeam) => t.group_id === group.id)
        }))
        setGroups(groupsWithTeams)
      }

      // Fetch matches
      const { data: matchesData } = await supabase
        .from('cup_matches')
        .select(`
          *,
          home_team:teams!cup_matches_home_team_id_fkey(id, name),
          away_team:teams!cup_matches_away_team_id_fkey(id, name),
          cup_groups(group_name)
        `)
        .eq('cup_id', cupId)
        .order('match_date', { ascending: true })

      if (matchesData) {
        const formattedMatches = matchesData.map((m: any) => ({
          id: m.id,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          home_team_name: m.home_team.name,
          away_team_name: m.away_team.name,
          match_date: m.match_date,
          venue: m.venue,
          home_score: m.home_score,
          away_score: m.away_score,
          status: m.status,
          stage: m.stage,
          group_id: m.group_id,
          group_name: m.cup_groups?.group_name || null
        }))
        setMatches(formattedMatches)
      }
    }

    setLoading(false)
  }

  const addTeamToCup = async () => {
    if (!newTeamForm.name.trim()) {
      setError('Please enter a team name')
      return
    }

    // First, create the team in the registry
    const { data: newTeam, error: registryError } = await supabase
      .from('cup_teams_registry')
      .insert({
        cup_id: cupId,
        name: newTeamForm.name.trim(),
        short_name: newTeamForm.short_name.trim() || null,
        logo_url: newTeamForm.logo_url.trim() || null,
        stadium: newTeamForm.stadium.trim() || null,
        city: newTeamForm.city.trim() || null,
        coach: newTeamForm.coach.trim() || null
      })
      .select()
      .single()

    if (registryError) {
      setError(registryError.message)
      return
    }

    // Then, add it to cup_teams for stats tracking
    const { error: cupTeamsError } = await supabase
      .from('cup_teams')
      .insert({
        cup_id: cupId,
        cup_team_id: newTeam.id
      })

    if (cupTeamsError) {
      setError(cupTeamsError.message)
    } else {
      setSuccess(`Team "${newTeamForm.name}" added successfully`)
      setNewTeamForm({
        name: '',
        short_name: '',
        logo_url: '',
        stadium: '',
        city: '',
        coach: ''
      })
      setShowAddTeam(false)
      fetchCupData()
    }
  }

  const removeTeamFromCup = async (cupTeamId: string, teamName: string) => {
    if (!confirm(`Remove ${teamName} from this cup?`)) return

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
    if (cupTeams.length < cup!.total_teams) {
      setError(`Please add all ${cup!.total_teams} teams before generating groups`)
      return
    }

    if (!confirm('Generate groups? This will randomly assign teams to groups.')) return

    // Delete existing groups
    await supabase.from('cup_groups').delete().eq('cup_id', cupId)

    // Calculate number of groups
    const numberOfGroups = Math.ceil(cupTeams.length / cup!.teams_per_group)

    // Create groups
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const createdGroups = []

    for (let i = 0; i < numberOfGroups; i++) {
      const { data: newGroup } = await supabase
        .from('cup_groups')
        .insert({
          cup_id: cupId,
          group_name: `Group ${groupNames[i]}`,
          group_order: i + 1
        })
        .select()
        .single()

      if (newGroup) createdGroups.push(newGroup)
    }

    // Shuffle teams randomly
    const shuffled = [...cupTeams].sort(() => Math.random() - 0.5)

    // Assign teams to groups
    for (let i = 0; i < shuffled.length; i++) {
      const groupIndex = i % createdGroups.length
      await supabase
        .from('cup_teams')
        .update({ group_id: createdGroups[groupIndex].id })
        .eq('id', shuffled[i].cup_team_id)
    }

    setSuccess('Groups generated successfully!')
    fetchCupData()
  }

  const generateGroupFixtures = async () => {
    if (groups.length === 0) {
      setError('Please generate groups first')
      return
    }

    if (!confirm('Generate fixtures for group stage? This will create round-robin matches for each group.')) return

    // Delete existing group stage matches
    await supabase
      .from('cup_matches')
      .delete()
      .eq('cup_id', cupId)
      .eq('stage', 'group')

    // Generate round-robin fixtures for each group
    for (const group of groups) {
      const teams = group.teams

      // Round-robin algorithm
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          await supabase
            .from('cup_matches')
            .insert({
              cup_id: cupId,
              group_id: group.id,
              home_team_id: teams[i].id,
              away_team_id: teams[j].id,
              stage: 'group',
              status: 'scheduled'
            })
        }
      }
    }

    setSuccess('Group stage fixtures generated successfully!')
    fetchCupData()
  }

  const updateCupStatus = async (newStatus: Cup['status']) => {
    const { error: updateError } = await supabase
      .from('cups')
      .update({ status: newStatus })
      .eq('id', cupId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(`Cup status updated to ${newStatus}`)
      fetchCupData()
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  }

  if (!cup) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Cup Not Found</h2>
        <button
          onClick={() => router.push('/admin/cups')}
          className="text-liberia-blue hover:underline"
        >
          Back to Cups
        </button>
      </div>
    </div>
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'teams', label: `Teams (${cupTeams.length}/${cup.total_teams})` },
    { id: 'players', label: 'Players' },
    { id: 'groups', label: `Groups (${groups.length})` },
    { id: 'fixtures', label: `Fixtures (${matches.filter(m => m.stage === 'group').length})` },
    { id: 'knockout', label: 'Knockout' },
    { id: 'standings', label: 'Standings' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => router.push('/admin/cups')}
              className="text-blue-100 hover:text-white flex items-center"
            >
              ← Back to Cups
            </button>
            <LogoutButton />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{cup.name}</h1>
              <p className="text-blue-100">
                {cup.season && `${cup.season} • `}
                {cupTeams.length} / {cup.total_teams} teams • Status: {cup.status.replace('_', ' ')}
              </p>
            </div>
            <div className="flex gap-2">
              {cup.status === 'draft' && cupTeams.length === cup.total_teams && (
                <button
                  onClick={() => updateCupStatus('group_stage')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Start Group Stage
                </button>
              )}
              {cup.status === 'group_stage' && (
                <button
                  onClick={() => updateCupStatus('knockout')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Start Knockout Stage
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-b-4 border-liberia-red text-liberia-blue'
                    : 'text-gray-600 hover:text-liberia-blue'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Cup Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Name:</span> {cup.name}
                </div>
                {cup.description && (
                  <div>
                    <span className="font-semibold">Description:</span> {cup.description}
                  </div>
                )}
                {cup.season && (
                  <div>
                    <span className="font-semibold">Season:</span> {cup.season}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Total Teams:</span> {cup.total_teams}
                </div>
                <div>
                  <span className="font-semibold">Teams per Group:</span> {cup.teams_per_group}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {cup.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('teams')}
                  className="w-full bg-liberia-blue hover:bg-liberia-blue-dark text-white font-bold py-3 px-4 rounded-lg transition text-left"
                  disabled={cupTeams.length >= cup.total_teams}
                >
                  {cupTeams.length >= cup.total_teams ? '✓ All Teams Added' : '+ Add Teams'}
                </button>
                <button
                  onClick={generateGroups}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition text-left"
                  disabled={cupTeams.length < cup.total_teams || groups.length > 0}
                >
                  {groups.length > 0 ? '✓ Groups Generated' : 'Generate Groups'}
                </button>
                <button
                  onClick={generateGroupFixtures}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition text-left"
                  disabled={groups.length === 0}
                >
                  Generate Group Fixtures
                </button>
                <button
                  onClick={() => setActiveTab('fixtures')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition text-left"
                >
                  View & Manage Fixtures
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Teams in Cup</h2>
                {cupTeams.length < cup.total_teams && (
                  <button
                    onClick={() => setShowAddTeam(!showAddTeam)}
                    className="bg-liberia-red hover:bg-liberia-blue text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    {showAddTeam ? 'Cancel' : '+ Add Team'}
                  </button>
                )}
              </div>

              {showAddTeam && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold mb-4 text-lg">Create New Team for Cup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTeamForm.name}
                        onChange={(e) => setNewTeamForm({...newTeamForm, name: e.target.value})}
                        placeholder="e.g., Monrovia United"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={newTeamForm.short_name}
                        onChange={(e) => setNewTeamForm({...newTeamForm, short_name: e.target.value})}
                        placeholder="e.g., MON"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stadium
                      </label>
                      <input
                        type="text"
                        value={newTeamForm.stadium}
                        onChange={(e) => setNewTeamForm({...newTeamForm, stadium: e.target.value})}
                        placeholder="e.g., Samuel Kanyon Doe Stadium"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newTeamForm.city}
                        onChange={(e) => setNewTeamForm({...newTeamForm, city: e.target.value})}
                        placeholder="e.g., Monrovia"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coach
                      </label>
                      <input
                        type="text"
                        value={newTeamForm.coach}
                        onChange={(e) => setNewTeamForm({...newTeamForm, coach: e.target.value})}
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        value={newTeamForm.logo_url}
                        onChange={(e) => setNewTeamForm({...newTeamForm, logo_url: e.target.value})}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={addTeamToCup}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                    >
                      Create & Add Team
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTeam(false)
                        setNewTeamForm({name: '', short_name: '', logo_url: '', stadium: '', city: '', coach: ''})
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {cupTeams.map((team) => (
                  <div
                    key={team.cup_team_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-semibold">{team.name}</div>
                      {team.group_name && (
                        <div className="text-sm text-gray-600">{team.group_name}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeTeamFromCup(team.cup_team_id, team.name)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Player Registration</h2>
            <p className="text-gray-600 mb-6">Register players for each team in the cup competition</p>

            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-4">Player registration feature coming soon...</p>
              <p className="text-sm">Teams will be able to register specific players for cup matches</p>
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Cup Groups</h2>
                {cupTeams.length === cup.total_teams && groups.length === 0 && (
                  <button
                    onClick={generateGroups}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Generate Groups
                  </button>
                )}
              </div>

              {groups.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg mb-4">No groups created yet</p>
                  <p className="text-sm">Add all teams first, then generate groups</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map(group => (
                    <div key={group.id} className="border rounded-lg p-4">
                      <h3 className="text-xl font-bold mb-3 text-liberia-blue">{group.group_name}</h3>
                      <div className="space-y-2">
                        {group.teams.map(team => (
                          <div key={team.id} className="text-sm">
                            {team.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Group Stage Fixtures</h2>
              {groups.length > 0 && matches.filter(m => m.stage === 'group').length === 0 && (
                <button
                  onClick={generateGroupFixtures}
                  className="bg-liberia-red hover:bg-liberia-blue text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Generate Fixtures
                </button>
              )}
            </div>

            {matches.filter(m => m.stage === 'group').length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-4">No fixtures generated yet</p>
                <p className="text-sm">Generate groups first, then create fixtures</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map(group => {
                  const groupMatches = matches.filter(m => m.group_id === group.id)
                  return (
                    <div key={group.id}>
                      <h3 className="text-xl font-bold mb-3 text-liberia-blue">{group.group_name}</h3>
                      <div className="space-y-2">
                        {groupMatches.map(match => (
                          <div key={match.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                            <div className="flex-1">
                              <span className="font-semibold">{match.home_team_name}</span>
                              {match.status === 'completed' && match.home_score !== null && (
                                <span className="mx-2 text-liberia-red font-bold">
                                  {match.home_score} - {match.away_score}
                                </span>
                              )}
                              {match.status !== 'completed' && <span className="mx-2">vs</span>}
                              <span className="font-semibold">{match.away_team_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                match.status === 'live' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {match.status}
                              </span>
                              <button
                                onClick={() => router.push(`/admin/cups/${cupId}/matches/${match.id}`)}
                                className="text-liberia-blue hover:underline text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Knockout Tab */}
        {activeTab === 'knockout' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Knockout Stage</h2>
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-4">Knockout stage feature coming soon...</p>
              <p className="text-sm">Bracket generation and knockout matches will be available here</p>
            </div>
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Group Standings</h2>

            {groups.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-4">No standings available yet</p>
                <p className="text-sm">Generate groups and play matches to see standings</p>
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map(group => (
                  <div key={group.id}>
                    <h3 className="text-xl font-bold mb-3 text-liberia-blue">{group.group_name}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Pos</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">P</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">W</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">D</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">L</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">GF</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">GA</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">GD</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.teams
                            .sort((a, b) => {
                              if (b.points !== a.points) return b.points - a.points
                              if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
                              return b.goals_for - a.goals_for
                            })
                            .map((team, index) => (
                              <tr key={team.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 text-center font-semibold">{index + 1}</td>
                                <td className="px-4 py-3 font-semibold">{team.name}</td>
                                <td className="px-4 py-3 text-center">{team.played}</td>
                                <td className="px-4 py-3 text-center">{team.won}</td>
                                <td className="px-4 py-3 text-center">{team.drawn}</td>
                                <td className="px-4 py-3 text-center">{team.lost}</td>
                                <td className="px-4 py-3 text-center">{team.goals_for}</td>
                                <td className="px-4 py-3 text-center">{team.goals_against}</td>
                                <td className="px-4 py-3 text-center font-semibold">{team.goal_difference}</td>
                                <td className="px-4 py-3 text-center font-bold text-liberia-blue">{team.points}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
