'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (status === 'loading' || redirecting) return

    const redirect = async () => {
      setRedirecting(true)
      
      if (session) {
        await router.push('/dashboard')
      } else {
        await router.push('/login')
      }
    }

    redirect()
  }, [session, status, router, redirecting])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading Golf & Pigeon...</p>
      </div>
    </div>
  )
}
