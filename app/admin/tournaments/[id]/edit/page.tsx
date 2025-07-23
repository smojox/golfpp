'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Home } from 'lucide-react'

interface Course {
  _id: string
  name: string
  location: {
    address?: string
    city?: string
    state?: string
    country?: string
    coordinates?: number[]
  }
}

interface Tournament {
  _id: string
  name: string
  description: string
  courseId: string
  startDate: string
  endDate: string
  format: string
  maxParticipants: number
  entryFee: number
  prizes: {
    first: string
    second: string
    third: string
    bestDressed: string
  }
  status: string
}

const formatLocation = (location: Course['location']) => {
  if (!location) return 'Unknown Location'
  
  const parts = [
    location.city,
    location.state,
    location.country
  ].filter(Boolean)
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location'
}

export default function EditTournamentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const tournamentId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    startDate: '',
    endDate: '',
    format: 'stroke-play',
    maxParticipants: '',
    entryFee: '',
    prizes: {
      first: '',
      second: '',
      third: '',
      bestDressed: ''
    }
  })

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

    fetchCourses()
    fetchTournament()
  }, [session, status, router, tournamentId])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      if (response.ok) {
        const data = await response.json()
        const tournament = data.tournament
        setTournament(tournament)
        
        // Populate form with tournament data
        setFormData({
          name: tournament.name || '',
          description: tournament.description || '',
          courseId: tournament.courseId || '',
          startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : '',
          endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 16) : '',
          format: tournament.format || 'stroke-play',
          maxParticipants: tournament.maxParticipants?.toString() || '',
          entryFee: tournament.entryFee?.toString() || '0',
          prizes: {
            first: tournament.prizes?.first || '',
            second: tournament.prizes?.second || '',
            third: tournament.prizes?.third || '',
            bestDressed: tournament.prizes?.bestDressed || ''
          }
        })
      } else {
        toast.error('Tournament not found')
        router.push('/admin/tournaments')
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
      toast.error('Failed to load tournament')
      router.push('/admin/tournaments')
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePrizeChange = (prizeType: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      prizes: {
        ...prev.prizes,
        [prizeType]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: parseInt(formData.maxParticipants),
          entryFee: parseFloat(formData.entryFee) || 0,
        }),
      })

      if (response.ok) {
        toast.success('Tournament updated successfully!')
        router.push('/admin/tournaments')
      } else {
        const error = await response.json()
        console.error('Tournament update error:', error)
        toast.error(error.error || 'Failed to update tournament')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error updating tournament:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isFetching) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!session || (session.user.role !== 'admin' && session.user.email !== 'admin@golfpigeon.com')) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Edit Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tournament Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter tournament name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tournament description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select value={formData.courseId} onValueChange={(value) => handleInputChange('courseId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name} - {formatLocation(course.location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stroke-play">Stroke Play</SelectItem>
                    <SelectItem value="match-play">Match Play</SelectItem>
                    <SelectItem value="scramble">Scramble</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Participants</label>
                  <Input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                    placeholder="e.g. 50"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entry Fee ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) => handleInputChange('entryFee', e.target.value)}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Prizes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">1st Place</label>
                    <Input
                      value={formData.prizes.first}
                      onChange={(e) => handlePrizeChange('first', e.target.value)}
                      placeholder="e.g. Golf Set"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">2nd Place</label>
                    <Input
                      value={formData.prizes.second}
                      onChange={(e) => handlePrizeChange('second', e.target.value)}
                      placeholder="e.g. Golf Bag"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">3rd Place</label>
                    <Input
                      value={formData.prizes.third}
                      onChange={(e) => handlePrizeChange('third', e.target.value)}
                      placeholder="e.g. Golf Balls"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Best Dressed</label>
                    <Input
                      value={formData.prizes.bestDressed}
                      onChange={(e) => handlePrizeChange('bestDressed', e.target.value)}
                      placeholder="e.g. Golf Shirt"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Updating...' : 'Update Tournament'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}