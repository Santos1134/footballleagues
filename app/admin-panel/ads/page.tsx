'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ad {
  id: string
  image_url: string
  link_url: string | null
  title: string | null
  is_active: boolean
  created_at: string
}

export default function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ads:', error)
    } else {
      setAds(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageUrl.trim()) {
      alert('Image URL is required')
      return
    }

    if (editingId) {
      // Update existing ad
      const { error } = await supabase
        .from('ads')
        .update({
          image_url: imageUrl,
          link_url: linkUrl || null,
          title: title || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)

      if (error) {
        console.error('Error updating ad:', error)
        alert(`Failed to update ad: ${error.message}`)
      } else {
        alert('Ad updated successfully!')
        resetForm()
        fetchAds()
      }
    } else {
      // Create new ad
      const { error } = await supabase
        .from('ads')
        .insert([{
          image_url: imageUrl,
          link_url: linkUrl || null,
          title: title || null,
          is_active: true
        }])

      if (error) {
        console.error('Error creating ad:', error)
        alert(`Failed to create ad: ${error.message}\n\nDetails: ${error.details || 'No details'}\nHint: ${error.hint || 'No hint'}`)
      } else {
        alert('Ad created successfully!')
        resetForm()
        fetchAds()
      }
    }
  }

  const resetForm = () => {
    setImageUrl('')
    setLinkUrl('')
    setTitle('')
    setEditingId(null)
  }

  const handleEdit = (ad: Ad) => {
    setImageUrl(ad.image_url)
    setLinkUrl(ad.link_url || '')
    setTitle(ad.title || '')
    setEditingId(ad.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('ads')
      .update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error toggling ad status:', error)
      alert(`Failed to update ad status: ${error.message}\n\nDetails: ${error.details || 'No details'}\nHint: ${error.hint || 'No hint'}`)
    } else {
      alert(`Ad ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
      fetchAds()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) return

    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting ad:', error)
      alert(`Failed to delete ad: ${error.message}\n\nDetails: ${error.details || 'No details'}\nHint: ${error.hint || 'No hint'}`)
    } else {
      alert('Ad deleted successfully!')
      fetchAds()
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Advertisement Management</h1>

        {/* Ad Form */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            {editingId ? 'Edit Advertisement' : 'Create New Advertisement'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the full URL of the advertisement image
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Link URL (Optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/promotion"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Users will be redirected here when clicking the ad
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer Sale 2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Internal title for your reference
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
              >
                {editingId ? 'Update Ad' : 'Create Ad'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Active Ads List */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Current Advertisements</h2>

          {loading ? (
            <p className="text-gray-500">Loading ads...</p>
          ) : ads.length === 0 ? (
            <p className="text-gray-500">No ads created yet. Create your first ad above!</p>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className={`border rounded-lg p-3 sm:p-4 ${
                    ad.is_active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <img
                        src={ad.image_url}
                        alt={ad.title || 'Ad'}
                        className="w-full sm:w-24 md:w-32 h-auto sm:h-24 md:h-32 object-cover rounded border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png'
                        }}
                      />
                    </div>

                    {/* Ad Info */}
                    <div className="flex-grow w-full">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-base sm:text-lg">
                            {ad.title || 'Untitled Ad'}
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-1">
                            <p className="break-all">
                              <span className="font-medium">Image:</span>{' '}
                              <a
                                href={ad.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {ad.image_url.substring(0, 40)}...
                              </a>
                            </p>
                            {ad.link_url && (
                              <p className="break-all">
                                <span className="font-medium">Link:</span>{' '}
                                <a
                                  href={ad.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {ad.link_url.substring(0, 40)}...
                                </a>
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Created: {new Date(ad.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="self-start">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              ad.is_active
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {ad.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(ad.id, ad.is_active)}
                          className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm rounded transition ${
                            ad.is_active
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {ad.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">How It Works</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Active ads will appear as a popup when users first visit the website</li>
            <li>• Only one active ad will be shown at a time (the most recent)</li>
            <li>• Users can close the popup, and it won't show again in that session</li>
            <li>• Deactivate or delete an ad to stop showing it</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
