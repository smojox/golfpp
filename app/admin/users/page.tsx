'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Home, Users, Crown, Trash2, UserPlus, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  stats: {
    totalRounds: number
    averageScore: number
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (session.user.role !== 'admin' && session.user.email !== 'admin@golfpigeon.com') {
      toast.error('Admin access required')
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromoteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to promote ${userName} to admin? This will give them full administrative access.`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'promote' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to promote user')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error promoting user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDemoteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to demote ${userName} from admin to regular user?`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'demote' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to demote user')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error demoting user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to DELETE ${userName}? This action cannot be undone and will remove all their data.`)) {
      return
    }

    if (!confirm(`FINAL WARNING: This will permanently delete ${userName} and all their golf data. Type DELETE to confirm.`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error deleting user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50">
        <Users className="w-3 h-3 mr-1" />
        User
      </Badge>
    )
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!session || (session.user.role !== 'admin' && session.user.email !== 'admin@golfpigeon.com')) {
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {users.length} Total Users
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            {users.filter(u => u.role === 'admin').length} Admins
          </Badge>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">Administrative Actions</p>
              <p className="text-sm">Use caution when promoting users to admin or deleting accounts. These actions have significant security implications.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">No users are registered in the system</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{user.name}</CardTitle>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="mt-1">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Rounds</p>
                    <p className="font-semibold">{user.stats?.totalRounds || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Score</p>
                    <p className="font-semibold">{user.stats?.averageScore || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>

                <div className="space-y-2">
                  {user.role === 'admin' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => handleDemoteUser(user._id, user.name)}
                      disabled={actionLoading === user._id || user._id === session.user.id}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {actionLoading === user._id ? 'Processing...' : 'Demote to User'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handlePromoteUser(user._id, user.name)}
                      disabled={actionLoading === user._id}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {actionLoading === user._id ? 'Processing...' : 'Promote to Admin'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    disabled={actionLoading === user._id || user._id === session.user.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {actionLoading === user._id ? 'Processing...' : 'Delete User'}
                  </Button>
                </div>

                {user._id === session.user.id && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    This is your account
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