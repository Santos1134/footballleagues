'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface LeagueAdmin {
  id: string
  email: string
  full_name: string | null
  role: string
  managed_league_id: string | null
  created_at: string
  league?: {
    id: string
    name: string
  }
}

interface League {
  id: string
  name: string
}

export default function LeagueAdminsPage() {
  const [leagueAdmins, setLeagueAdmins] = useState<LeagueAdmin[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    managed_league_id: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchLeagueAdmins()
    fetchLeagues()
  }, [])

  const fetchLeagueAdmins = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        managed_league_id,
        created_at,
        league:leagues(id, name)
      `)
      .eq('role', 'league_admin')
      .order('created_at', { ascending: false })

    if (data) {
      setLeagueAdmins(data as any)
    }

    setLoading(false)
  }

  const fetchLeagues = async () => {
    const { data } = await supabase
      .from('leagues')
      .select('id, name')
      .order('name')

    if (data) {
      setLeagues(data)
    }
  }

  const createLeagueAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required')
      return
    }

    if (!formData.managed_league_id) {
      setError('Please select a league to manage')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', formData.email.trim().toLowerCase())
      .single()

    if (existingProfile) {
      setError('An account with this email already exists')
      return
    }

    // Create auth user via Supabase Admin API
    // Note: This requires the service role key and should ideally be done via an API route
    // For now, we'll use a workaround by creating a profile directly

    // Step 1: Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name.trim() || null,
          role: 'league_admin',
          managed_league_id: formData.managed_league_id
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (authData.user) {
      // Step 2: Update the profile with league admin role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'league_admin',
          managed_league_id: formData.managed_league_id,
          full_name: formData.full_name.trim() || null
        })
        .eq('id', authData.user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(`League admin account created successfully! Login credentials sent to ${formData.email}`)
      resetForm()
      fetchLeagueAdmins()
    }
  }

  const removeLeagueAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Remove league admin access for ${email}?\n\nThis will change their role to 'fan' but will not delete their account.`)) {
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'fan',
        managed_league_id: null
      })
      .eq('id', adminId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('League admin access removed successfully')
      fetchLeagueAdmins()
    }
  }

  const changeAssignedLeague = async (adminId: string, newLeagueId: string) => {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ managed_league_id: newLeagueId })
      .eq('id', adminId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('League assignment updated successfully')
      fetchLeagueAdmins()
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      managed_league_id: ''
    })
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-liberia-blue to-liberia-blue-dark text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">League Administrators</h1>
          <p className="text-blue-100">Create and manage league-specific admin accounts</p>
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

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About League Administrators</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>League admins have full control over their assigned league, including:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Managing divisions within the league</li>
                  <li>Managing teams and players</li>
                  <li>Creating and managing fixtures/matches</li>
                  <li>Creating cup competitions for the league</li>
                  <li>Updating match results and statistics</li>
                </ul>
                <p className="mt-2">They cannot access or modify other leagues or system settings.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        {!showForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="bg-liberia-red hover:bg-liberia-blue text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
            >
              + Create League Admin
            </button>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create League Administrator</h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createLeagueAdmin} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                    placeholder="admin@example.com"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">This will be used for login</p>
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">Share this with the admin after creation</p>
                </div>

                <div>
                  <label htmlFor="managed_league" className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned League *
                  </label>
                  <select
                    id="managed_league"
                    value={formData.managed_league_id}
                    onChange={(e) => setFormData({ ...formData, managed_league_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent"
                    required
                  >
                    <option value="">Select a league</option>
                    {leagues.map(league => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">This admin will only manage this league</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-liberia-red hover:bg-liberia-blue text-white font-bold py-3 px-8 rounded-lg transition"
                >
                  Create League Admin
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* League Admins List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">League Administrators ({leagueAdmins.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-liberia-blue mx-auto mb-4"></div>
              Loading administrators...
            </div>
          ) : leagueAdmins.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg mb-2">No league administrators yet</p>
              <p className="text-sm">Create your first league admin to delegate management</p>
            </div>
          ) : (
            <div className="divide-y">
              {leagueAdmins.map(admin => (
                <div key={admin.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">
                          {admin.full_name || admin.email}
                        </h3>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          League Admin
                        </span>
                      </div>

                      {admin.full_name && (
                        <p className="text-gray-600 text-sm mb-2">{admin.email}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <span className="text-gray-500 text-sm">Manages:</span>
                          <span className="ml-2 font-medium text-liberia-blue">
                            {(admin as any).league?.name || 'No league assigned'}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500 text-sm">Created:</span>
                          <span className="ml-2 text-sm">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <select
                        value={admin.managed_league_id || ''}
                        onChange={(e) => changeAssignedLeague(admin.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-liberia-blue"
                      >
                        <option value="">Reassign League</option>
                        {leagues.map(league => (
                          <option key={league.id} value={league.id}>
                            {league.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => removeLeagueAdmin(admin.id, admin.email)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition text-sm"
                      >
                        Remove Access
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {leagueAdmins.length}
            </div>
            <div className="text-gray-600">Total League Admins</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {new Set(leagueAdmins.map(a => a.managed_league_id).filter(Boolean)).size}
            </div>
            <div className="text-gray-600">Leagues with Admins</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {leagues.length - new Set(leagueAdmins.map(a => a.managed_league_id).filter(Boolean)).size}
            </div>
            <div className="text-gray-600">Unassigned Leagues</div>
          </div>
        </div>
      </div>
    </div>
  )
}
