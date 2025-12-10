'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return

    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-liberia-blue text-white shadow-lg border-b-4 border-liberia-red">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="text-2xl font-bold">
              <span className="text-white">Liberia</span>
              <span className="text-liberia-red"> League</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-liberia-red transition font-semibold">
              Home
            </Link>
            <Link href="/fixtures" className="hover:text-liberia-red transition">
              Fixtures
            </Link>
            <Link href="/standings" className="hover:text-liberia-red transition">
              Standings
            </Link>
            <Link href="/teams" className="hover:text-liberia-red transition">
              Teams
            </Link>
            <Link href="/players" className="hover:text-liberia-red transition">
              Players
            </Link>
            <Link href="/admin" className="hover:text-liberia-red transition">
              Dashboard
            </Link>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-liberia-red text-white px-4 py-2 rounded-lg font-semibold hover:bg-liberia-red-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-liberia-red text-white px-4 py-2 rounded-lg font-semibold hover:bg-liberia-red-dark transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-3">
            <Link
              href="/"
              className="block py-2 hover:text-liberia-red transition font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/fixtures"
              className="block py-2 hover:text-liberia-red transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fixtures
            </Link>
            <Link
              href="/standings"
              className="block py-2 hover:text-liberia-red transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Standings
            </Link>
            <Link
              href="/teams"
              className="block py-2 hover:text-liberia-red transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Teams
            </Link>
            <Link
              href="/players"
              className="block py-2 hover:text-liberia-red transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Players
            </Link>
            <Link
              href="/admin"
              className="block py-2 hover:text-liberia-red transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                disabled={isLoggingOut}
                className="block w-full bg-liberia-red text-white px-4 py-2 rounded-lg font-semibold hover:bg-liberia-red-dark transition text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            ) : (
              <Link
                href="/login"
                className="block bg-liberia-red text-white px-4 py-2 rounded-lg font-semibold hover:bg-liberia-red-dark transition text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
