'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ad {
  id: string
  image_url: string
  link_url: string | null
  title: string | null
}

export default function AdsPopup() {
  const [ad, setAd] = useState<Ad | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchActiveAd = async () => {
      // Check if user has already seen the ad in this session
      const hasSeenAd = sessionStorage.getItem('hasSeenAd')
      if (hasSeenAd) {
        return
      }

      // Fetch the most recent active ad
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching ad:', error)
        return
      }

      if (data) {
        setAd(data)
        // Show popup after a short delay for better UX
        setTimeout(() => {
          setShowPopup(true)
        }, 1000)
      }
    }

    fetchActiveAd()
  }, [])

  const handleClose = () => {
    setShowPopup(false)
    // Remember that user has seen the ad for this session
    sessionStorage.setItem('hasSeenAd', 'true')
  }

  const handleAdClick = () => {
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!showPopup || !ad) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Popup Container */}
        <div
          className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Ad Image */}
          <div
            className={`${ad.link_url ? 'cursor-pointer' : ''}`}
            onClick={handleAdClick}
          >
            <img
              src={ad.image_url}
              alt={ad.title || 'Advertisement'}
              className="w-full h-auto object-contain max-h-[80vh]"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.png'
              }}
            />
          </div>

          {/* Optional: Click to visit link text */}
          {ad.link_url && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleAdClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Learn More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
