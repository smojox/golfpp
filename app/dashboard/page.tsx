'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getGolfTerm, getGolfTermColor } from '@/lib/golf-terms'
import {
  Home,
  User,
  Trophy,
  Target,
  Settings,
  Plus,
  CloudRain,
  Sun,
  Wind,
  Shield,
  Calendar,
  Users,
  DollarSign,
  Map,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const formatLocation = (location: any) => {
  if (!location) return 'Unknown Location'
  
  const parts = [
    location.city,
    location.state,
    location.country
  ].filter(Boolean)
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location'
}

const ScoreEntryView = ({ tournament, onBack }: { tournament: any, onBack: () => void }) => {
  const [scores, setScores] = useState<{ [key: number]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseData, setCourseData] = useState<any>(null)
  const { data: session } = useSession()

  useEffect(() => {
    fetchCourseData()
  }, [tournament.courseId])

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}`)
      if (response.ok) {
        const data = await response.json()
        setCourseData(data.tournament.courseId)
        // Initialize scores object for all holes
        if (data.tournament.courseId?.holes) {
          const initialScores: { [key: number]: string } = {}
          data.tournament.courseId.holes.forEach((hole: any) => {
            initialScores[hole.number] = ''
          })
          setScores(initialScores)
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error)
    }
  }

  const handleScoreChange = (holeNumber: number, score: string) => {
    setScores(prev => ({
      ...prev,
      [holeNumber]: score
    }))
  }

  const calculateTotal = () => {
    return Object.values(scores).reduce((total, score) => {
      const numScore = parseInt(score) || 0
      return total + numScore
    }, 0)
  }

  const isAllHolesScored = () => {
    if (!courseData?.holes) return false
    return courseData.holes.every((hole: any) => scores[hole.number] && parseInt(scores[hole.number]) > 0)
  }

  const calculateTotalPar = () => {
    if (!courseData?.holes) return 0
    return courseData.holes.reduce((total: number, hole: any) => total + hole.par, 0)
  }

  const handleSubmit = async () => {
    if (!isAllHolesScored()) {
      toast.error('Please score all holes before submitting')
      return
    }

    setIsSubmitting(true)
    
    try {
      const holeScores = courseData?.holes?.map((hole: any) => ({
        hole: hole.number,
        par: hole.par,
        strokes: parseInt(scores[hole.number]),
        score: parseInt(scores[hole.number]),
        strokesOverPar: parseInt(scores[hole.number]) - hole.par
      })) || []

      const totalScore = calculateTotal()
      const totalPar = calculateTotalPar()

      console.log('Submitting tournament score:', {
        tournamentId: tournament._id,
        tournamentName: tournament.name,
        totalScore,
        totalPar,
        holeScores
      })

      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament._id,
          courseId: courseData._id || tournament.courseId,
          date: new Date().toISOString(),
          holes: holeScores,
          scores: holeScores, // Send both for compatibility
          totalScore,
          totalPar,
          weather: {
            conditions: 'Fair',
            temperature: 72
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Score submission successful:', result)
        
        // Create golf terms summary
        const golfTerms = holeScores.reduce((acc: any, hole: any) => {
          const term = getGolfTerm(hole.score, hole.par)
          acc[term] = (acc[term] || 0) + 1
          return acc
        }, {})
        
        const termsText = Object.entries(golfTerms)
          .filter(([term, count]) => (count as number) > 0)
          .map(([term, count]) => `${count} ${term}${(count as number) > 1 ? 's' : ''}`)
          .join(', ')
        
        toast.success(`Round completed! Total: ${totalScore} (${scoreToPar > 0 ? '+' : ''}${scoreToPar}) - ${termsText}`)
        onBack()
      } else {
        const error = await response.json()
        console.error('Score submission error:', error)
        toast.error(error.error || 'Failed to submit score')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error submitting score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!courseData) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <div className="bg-green-600 text-white p-4">
          <h1 className="text-xl font-semibold">Loading Course...</h1>
        </div>
        <div className="p-4">
          <div className="text-center">Loading course information...</div>
        </div>
      </div>
    )
  }

  const holes = courseData.holes || []
  const totalScore = calculateTotal()
  const totalPar = calculateTotalPar()
  const scoreToPar = totalScore - totalPar

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{tournament.name}</h1>
            <p className="text-green-100 text-sm">{courseData.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-700"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{totalScore || 0}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalPar}</div>
                <div className="text-sm text-gray-600">Course Par</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${scoreToPar > 0 ? 'text-red-600' : scoreToPar < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {scoreToPar > 0 ? '+' : ''}{scoreToPar || 0}
                </div>
                <div className="text-sm text-gray-600">To Par</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Hole by Hole Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {holes.map((hole: any) => (
              <div key={hole.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {hole.number}
                  </div>
                  <div>
                    <div className="font-medium">Hole {hole.number}</div>
                    <div className="text-sm text-gray-600">Par {hole.par}</div>
                    {scores[hole.number] && (
                      <div className={`text-xs font-medium ${getGolfTermColor(parseInt(scores[hole.number]), hole.par)}`}>
                        {getGolfTerm(parseInt(scores[hole.number]), hole.par)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-20">
                  <Select 
                    value={scores[hole.number] || ''} 
                    onValueChange={(value) => handleScoreChange(hole.number, value)}
                  >
                    <SelectTrigger className="text-center">
                      <SelectValue placeholder="0" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="sticky bottom-24 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isAllHolesScored()}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Submitting...' : isAllHolesScored() ? 'Submit Score' : `Score ${courseData?.holes?.length || 0} holes to submit`}
          </Button>
        </div>
      </div>
    </div>
  )
}

const RoundEditView = ({ roundId, onBack }: { roundId: string, onBack: () => void }) => {
  const [round, setRound] = useState<any>(null)
  const [scores, setScores] = useState<{ [key: number]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    fetchRoundData()
  }, [roundId])

  const fetchRoundData = async () => {
    try {
      const response = await fetch(`/api/rounds/${roundId}`)
      if (response.ok) {
        const data = await response.json()
        setRound(data.round)
        // Initialize scores from existing round data
        const initialScores: { [key: number]: string } = {}
        if (data.round.holes || data.round.scores) {
          const holeData = data.round.holes || data.round.scores
          holeData.forEach((hole: any) => {
            initialScores[hole.hole] = hole.score?.toString() || hole.strokes?.toString() || ''
          })
        }
        setScores(initialScores)
      }
    } catch (error) {
      console.error('Error fetching round data:', error)
      toast.error('Failed to load round data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreChange = (holeNumber: number, score: string) => {
    setScores(prev => ({
      ...prev,
      [holeNumber]: score
    }))
  }

  const calculateTotal = () => {
    return Object.values(scores).reduce((total, score) => {
      const numScore = parseInt(score) || 0
      return total + numScore
    }, 0)
  }

  const handleSubmit = async () => {
    if (!round?.courseId?.holes) {
      toast.error('Course data not available')
      return
    }

    setIsSubmitting(true)
    
    try {
      const holeScores = round.courseId.holes.map((hole: any) => ({
        hole: hole.number,
        par: hole.par,
        strokes: parseInt(scores[hole.number]) || 0,
        score: parseInt(scores[hole.number]) || 0,
        strokesOverPar: (parseInt(scores[hole.number]) || 0) - hole.par
      }))

      const totalScore = calculateTotal()
      const totalPar = round.courseId.holes.reduce((total: number, hole: any) => total + hole.par, 0)

      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holes: holeScores,
          scores: holeScores,
          totalScore,
          totalPar,
        }),
      })

      if (response.ok) {
        toast.success('Score updated successfully!')
        onBack()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update score')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error updating score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <div className="bg-green-600 text-white p-4">
          <h1 className="text-xl font-semibold">Loading...</h1>
        </div>
        <div className="p-4">
          <div className="text-center">Loading round data...</div>
        </div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <div className="bg-green-600 text-white p-4">
          <h1 className="text-xl font-semibold">Round Not Found</h1>
        </div>
        <div className="p-4">
          <Button onClick={onBack}>Back</Button>
        </div>
      </div>
    )
  }

  const holes = round.courseId?.holes || []
  const totalScore = calculateTotal()
  const totalPar = holes.reduce((total: number, hole: any) => total + hole.par, 0)
  const scoreToPar = totalScore - totalPar

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Edit Score</h1>
            <p className="text-green-100 text-sm">{round.courseId?.name}</p>
            {round.tournamentId && (
              <p className="text-green-100 text-xs">{round.tournamentId.name}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-green-700"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{totalScore || 0}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalPar}</div>
                <div className="text-sm text-gray-600">Course Par</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${scoreToPar > 0 ? 'text-red-600' : scoreToPar < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {scoreToPar > 0 ? '+' : ''}{scoreToPar || 0}
                </div>
                <div className="text-sm text-gray-600">To Par</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Edit Hole Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {holes.map((hole: any) => (
              <div key={hole.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {hole.number}
                  </div>
                  <div>
                    <div className="font-medium">Hole {hole.number}</div>
                    <div className="text-sm text-gray-600">Par {hole.par}</div>
                    {scores[hole.number] && (
                      <div className={`text-xs font-medium ${getGolfTermColor(parseInt(scores[hole.number]), hole.par)}`}>
                        {getGolfTerm(parseInt(scores[hole.number]), hole.par)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-20">
                  <Select 
                    value={scores[hole.number] || ''} 
                    onValueChange={(value) => handleScoreChange(hole.number, value)}
                  >
                    <SelectTrigger className="text-center">
                      <SelectValue placeholder="0" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="sticky bottom-24 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Updating...' : 'Update Score'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const AdminScoreManagement = ({ onBack }: { onBack: () => void }) => {
  const [pendingRounds, setPendingRounds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPendingScores()
  }, [])

  const fetchPendingScores = async () => {
    try {
      const response = await fetch('/api/rounds?status=submitted')
      if (response.ok) {
        const data = await response.json()
        setPendingRounds(data.rounds || [])
      }
    } catch (error) {
      console.error('Error fetching pending scores:', error)
      toast.error('Failed to load pending scores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmScore = async (roundId: string, action: 'confirm' | 'reject') => {
    try {
      const response = await fetch(`/api/rounds/${roundId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast.success(`Score ${action}ed successfully!`)
        fetchPendingScores()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${action} score`)
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error(`Error ${action}ing score:`, error)
    }
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <div className="bg-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Score Management</h1>
            <p className="text-orange-100 text-sm">Review and confirm player scores</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-orange-700"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pending scores...</p>
          </div>
        ) : pendingRounds.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending scores</h3>
              <p className="text-gray-600">All submitted scores have been reviewed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRounds.map((round) => (
              <Card key={round._id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{round.userId?.name || 'Unknown Player'}</h3>
                      <p className="text-sm text-gray-600">{round.courseId?.name || 'Unknown Course'}</p>
                      {round.tournamentId && (
                        <p className="text-xs text-blue-600 font-medium">{round.tournamentId.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{round.totalScore}</div>
                      <div className="text-sm text-gray-600">
                        {round.totalScore > round.totalPar ? '+' : ''}
                        {round.totalScore - round.totalPar} to par
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Submitted: {new Date(round.createdAt).toLocaleString()}
                  </div>

                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {(round.holes || round.scores || []).slice(0, 18).map((hole: any, index: number) => (
                      <div key={index} className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">H{hole.hole}</div>
                        <div className="font-semibold">{hole.score || hole.strokes}</div>
                        <div className={`text-xs ${getGolfTermColor(hole.score || hole.strokes, hole.par)}`}>
                          {getGolfTerm(hole.score || hole.strokes, hole.par)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleConfirmScore(round._id, 'confirm')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Confirm Score
                    </Button>
                    <Button
                      onClick={() => handleConfirmScore(round._id, 'reject')}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      Reject Score
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const BottomNavigation = ({ currentView, setCurrentView }: any) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2">
    <div className="flex justify-around">
      {[
        { id: "dashboard", icon: Home, label: "Home" },
        { id: "scoring", icon: Target, label: "Scores" },
        { id: "tournaments", icon: Trophy, label: "Tournaments" },
        { id: "settings", icon: Settings, label: "Settings" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentView(item.id)}
          className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
            currentView === item.id ? "text-golf-fairway bg-green-50" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  </div>
)

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentView, setCurrentView] = useState("dashboard")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [rounds, setRounds] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [registering, setRegistering] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('user')
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserProfile()
      fetchRounds()
      fetchTournaments()
      refreshUserRole()
    }
  }, [status, session?.user?.id])

  const fetchUserProfile = async () => {
    // Only fetch profile if we have a valid session and are authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('No valid session available, skipping profile fetch. Status:', status)
      return
    }

    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        // Update role from profile data
        if (data.user.role) {
          setCurrentUserRole(data.user.role)
        }
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        console.log('Profile fetch unauthorized, redirecting to login')
        router.push('/login')
      } else {
        console.error('Failed to fetch profile:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('Profile error details:', errorData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchRounds = async () => {
    try {
      const response = await fetch('/api/rounds')
      if (response.ok) {
        const data = await response.json()
        setRounds(data.rounds)
      }
    } catch (error) {
      console.error('Error fetching rounds:', error)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    }
  }

  const refreshUserRole = () => {
    // Check if user profile has admin role
    if (userProfile?.role) {
      setCurrentUserRole(userProfile.role)
    } else if (session?.user?.email === 'admin@golfpigeon.com') {
      // Force admin role for the admin user
      setCurrentUserRole('admin')
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const handleTournamentRegistration = async (tournamentId: string, isRegistered: boolean) => {
    setRegistering(tournamentId)
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: isRegistered ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success(isRegistered ? 'Unregistered successfully!' : 'Registered successfully!')
        fetchTournaments() // Refresh tournaments
      } else {
        const error = await response.json()
        toast.error(error.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Registration error:', error)
    } finally {
      setRegistering(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }


  if (currentView === "settings") {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Settings</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-700"
              onClick={() => setCurrentView("dashboard")}
            >
              Done
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Admin Section */}
          {currentUserRole === 'admin' && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center text-blue-800">
                    <Shield className="h-5 w-5 mr-2" />
                    Admin Tournament Controls
                  </CardTitle>
                  <Badge className="bg-blue-600 text-white">
                    ADMIN
                  </Badge>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Create and manage golf tournaments
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start h-12 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                  onClick={() => router.push('/admin/tournaments')}
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  View All Tournaments
                </Button>
                <Button
                  className="w-full justify-start h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => router.push('/admin/tournaments/create')}
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create New Tournament
                </Button>
                <Button
                  className="w-full justify-start h-12 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                  onClick={() => router.push('/admin/courses')}
                >
                  <Map className="h-5 w-5 mr-3" />
                  Manage Courses & Par
                </Button>
                <Button
                  className="w-full justify-start h-12 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="h-5 w-5 mr-3" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Score Management */}
          {currentUserRole === 'admin' && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-100 border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center text-orange-800">
                    <Target className="h-5 w-5 mr-2" />
                    Score Management
                  </CardTitle>
                  <Badge className="bg-orange-600 text-white">
                    ADMIN
                  </Badge>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  Review and confirm player scores
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start h-12 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 shadow-sm"
                  onClick={() => setCurrentView('admin-scores')}
                >
                  <Shield className="h-5 w-5 mr-3" />
                  Review Pending Scores
                </Button>
              </CardContent>
            </Card>
          )}

          {/* User Profile Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Name</div>
                  <div className="text-sm text-gray-600">{session.user?.name}</div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-sm text-gray-600">{session.user?.email}</div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Handicap</div>
                  <div className="text-sm text-gray-600">{userProfile?.handicap || 0}</div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              {currentUserRole === 'admin' && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium">Role</div>
                    <div className="text-sm text-blue-600 font-medium">Administrator</div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Admin
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">App Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Units</div>
                  <div className="text-sm text-gray-600">{userProfile?.preferences?.units || 'Imperial'}</div>
                </div>
                <Button variant="ghost" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-sm text-gray-600">
                    {userProfile?.preferences?.notifications ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <Button variant="ghost" size="sm">Toggle</Button>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Button 
                onClick={handleSignOut}
                variant="destructive" 
                className="w-full h-12"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <BottomNavigation currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    )
  }

  // Handle round editing
  if (editingRoundId) {
    return <RoundEditView roundId={editingRoundId} onBack={() => setEditingRoundId(null)} />
  }

  if (currentView === "scoring") {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Add Score</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-700"
              onClick={() => setCurrentView("dashboard")}
            >
              Done
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Tournament</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tournaments.filter(t => t.status === 'active' || t.status === 'upcoming').length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tournaments</h3>
                  <p className="text-gray-600">There are no tournaments available for scoring at the moment.</p>
                </div>
              ) : (
                tournaments.filter(t => t.status === 'active' || t.status === 'upcoming').map((tournament) => (
                  <Card key={tournament._id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <p className="text-sm text-gray-600">{tournament.description}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setCurrentView(`scoring-${tournament._id}`)}
                        >
                          Add Score
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        
        <BottomNavigation currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    )
  }

  // Handle individual tournament scoring views
  if (currentView.startsWith("scoring-")) {
    const tournamentId = currentView.replace("scoring-", "")
    const selectedTournament = tournaments.find(t => t._id === tournamentId)
    
    if (!selectedTournament) {
      return (
        <div className="pb-20 min-h-screen bg-slate-50">
          <div className="bg-green-600 text-white p-4">
            <h1 className="text-xl font-semibold">Tournament Not Found</h1>
          </div>
          <div className="p-4">
            <Button onClick={() => setCurrentView("scoring")}>Back to Tournaments</Button>
          </div>
        </div>
      )
    }

    return <ScoreEntryView tournament={selectedTournament} onBack={() => setCurrentView("scoring")} />
  }

  if (currentView === "tournaments") {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Tournaments</h1>
            {currentUserRole === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-700"
                onClick={() => router.push('/admin/tournaments/create')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {tournaments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments available</h3>
                <p className="text-gray-600 mb-4">Check back later for upcoming tournaments</p>
                {currentUserRole === 'admin' && (
                  <Button
                    onClick={() => router.push('/admin/tournaments/create')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Tournament
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            tournaments.map((tournament) => (
              <Card key={tournament._id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      <p className="text-sm text-gray-600">{tournament.description}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tournament.status}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(tournament.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {tournament.participants?.length || 0} / {tournament.maxParticipants} participants
                    </div>
                    {tournament.entryFee > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ${tournament.entryFee} entry fee
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {tournament.courseId?.name} - {formatLocation(tournament.courseId?.location)}
                    </div>
                    {(() => {
                      const isRegistered = tournament.participants?.some((p: any) => p.userId === session.user.id)
                      const isFull = tournament.participants?.length >= tournament.maxParticipants
                      const isLoading = registering === tournament._id
                      
                      return (
                        <Button
                          size="sm"
                          variant={isRegistered ? "outline" : "default"}
                          className={isRegistered ? "border-green-600 text-green-600 hover:bg-green-50" : "bg-green-600 hover:bg-green-700"}
                          disabled={tournament.status !== 'upcoming' || (isFull && !isRegistered) || isLoading}
                          onClick={() => handleTournamentRegistration(tournament._id, isRegistered)}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isRegistered ? (
                            'Unregister'
                          ) : isFull ? (
                            'Full'
                          ) : (
                            'Register'
                          )}
                        </Button>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <BottomNavigation currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === "admin-scores") {
    return <AdminScoreManagement onBack={() => setCurrentView("settings")} />
  }

  return (
    <div className="pb-20 min-h-screen bg-gradient-to-b from-green-50 to-slate-50">
      <div className="bg-golf-fairway text-white p-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 relative">
              <Image src="/pp-cup-logo.png" alt="PP Cup 2026" fill className="object-contain" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">PP CUP 2026</h2>
              <p className="text-green-100 text-sm">Tournament Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={userProfile?.profileImage || "/placeholder.svg"} />
              <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="font-medium text-sm">{session.user?.name}</p>
              <p className="text-green-100 text-xs">Handicap: {userProfile?.handicap || 0}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={() => setCurrentView("settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/10 border-0 text-white">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{userProfile?.stats.totalRounds || 0}</div>
              <div className="text-xs text-green-100">Total Rounds</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-0 text-white">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{userProfile?.stats.bestRound || '-'}</div>
              <div className="text-xs text-green-100">Best Score</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-0 text-white">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{userProfile?.achievements?.length || 0}</div>
              <div className="text-xs text-green-100">Achievements</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CloudRain className="h-5 w-5 mr-2 text-blue-500" />
              Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sun className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-semibold">72°F</div>
                  <div className="text-sm text-slate-600">Perfect for golf</div>
                </div>
              </div>
              <div className="text-right text-sm text-slate-600">
                <div className="flex items-center">
                  <Wind className="h-4 w-4 mr-1" />5 mph SW
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="h-16 bg-golf-fairway hover:bg-golf-rough flex-col" 
            onClick={() => setCurrentView("scoring")}
          >
            <Plus className="h-6 w-6 mb-1" />
            Add Score
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col bg-transparent"
            onClick={() => setCurrentView("tournaments")}
          >
            <Trophy className="h-6 w-6 mb-1" />
            Tournaments
          </Button>
        </div>


        {tournaments.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Upcoming Tournaments
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentView("tournaments")}
                  className="text-green-600 hover:text-green-700"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tournaments.filter(t => t.status === 'upcoming').slice(0, 2).map((tournament) => (
                <div key={tournament._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium">{tournament.name}</div>
                    <div className="text-sm text-slate-600 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {tournament.participants?.length || 0}/{tournament.maxParticipants}
                    </Badge>
                  </div>
                </div>
              ))}
              {tournaments.filter(t => t.status === 'upcoming').length === 0 && (
                <div className="text-center py-2 text-slate-500 text-sm">
                  No upcoming tournaments
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rounds.length > 0 ? (
              rounds.slice(0, 5).map((round, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium">{round.courseId?.name || 'Unknown Course'}</div>
                    {round.tournamentId && (
                      <div className="text-xs text-blue-600 font-medium">{round.tournamentId.name}</div>
                    )}
                    <div className="text-sm text-slate-600 flex items-center space-x-2">
                      <span>{new Date(round.date).toLocaleDateString()}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          round.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                          round.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {round.status === 'confirmed' ? 'Confirmed' : 
                         round.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right mr-2">
                    <div className="font-semibold">{round.totalScore}</div>
                    <div className="text-sm text-slate-600">
                      {round.totalScore > round.totalPar ? "+" : ""}
                      {round.totalScore - round.totalPar}
                    </div>
                  </div>
                  {(round.status !== 'confirmed' || currentUserRole === 'admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRoundId(round._id)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500">
                No rounds recorded yet. Start by adding your first score!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNavigation currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  )
}