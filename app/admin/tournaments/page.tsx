'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users, DollarSign, Home } from 'lucide-react'
import { toast } from 'sonner'

interface Tournament {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  format: string
  maxParticipants: number
  entryFee: number
  status: string
  participants: Array<any>
  courseId: {
    name: string
    location: {
      address?: string
      city?: string
      state?: string
      country?: string
      coordinates?: number[]
    }
  }
  organizerId: {
    name: string
  }
}

const formatLocation = (location: Tournament['courseId']['location']) => {
  if (!location) return 'Unknown Location'
  
  const parts = [
    location.city,
    location.state,
    location.country
  ].filter(Boolean)
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location'
}

export default function AdminTournamentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Check if user is admin (allow admin@golfpigeon.com as fallback)
    if (session.user.role !== 'admin' && session.user.email !== 'admin@golfpigeon.com') {
      toast.error('Admin access required')
      router.push('/dashboard')
      return
    }

    fetchTournaments()
  }, [session, status, router])

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
      toast.error('Failed to load tournaments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to close this tournament? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Tournament closed successfully!')
        fetchTournaments() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to close tournament')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error closing tournament:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tournament Management</h1>
          <p className="text-gray-600 mt-2">Create and manage golf tournaments</p>
        </div>
        <Button
          onClick={() => router.push('/admin/tournaments/create')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first tournament</p>
            <Button
              onClick={() => router.push('/admin/tournaments/create')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {tournament.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{tournament.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(tournament.startDate)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {tournament.participants.length} / {tournament.maxParticipants} participants
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    ${tournament.entryFee} entry fee
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-700">
                    {tournament.courseId?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatLocation(tournament.courseId?.location)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/admin/tournaments/${tournament._id}/edit`)}
                  >
                    Edit
                  </Button>
                </div>
                
                {tournament.status === 'active' && (
                  <div className="mt-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCloseTournament(tournament._id)}
                    >
                      Close Tournament
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}