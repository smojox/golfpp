'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Home, Edit, Save, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  _id: string
  name: string
  location: {
    address?: string
    city?: string
    state?: string
    country?: string
  }
  holes: Array<{
    number: number
    par: number
    yardage: {
      black: number
      blue: number
      white: number
      red: number
    }
    handicap: number
  }>
}

export default function AdminCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [editingCourse, setEditingCourse] = useState<string | null>(null)
  const [editingHoles, setEditingHoles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    numHoles: 18
  })

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

    fetchCourses()
  }, [session, status, router])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course._id)
    setEditingHoles([...course.holes])
  }

  const handleCancelEdit = () => {
    setEditingCourse(null)
    setEditingHoles([])
  }

  const handleParChange = (holeIndex: number, newPar: string) => {
    const par = parseInt(newPar)
    if (par >= 3 && par <= 6) {
      const updatedHoles = [...editingHoles]
      updatedHoles[holeIndex] = { ...updatedHoles[holeIndex], par }
      setEditingHoles(updatedHoles)
    }
  }

  const handleSaveCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holes: editingHoles
        }),
      })

      if (response.ok) {
        toast.success('Course updated successfully!')
        setEditingCourse(null)
        setEditingHoles([])
        fetchCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update course')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error updating course:', error)
    }
  }

  const handleAddCourse = async () => {
    if (!newCourse.name.trim()) {
      toast.error('Course name is required')
      return
    }

    try {
      // Generate holes with default par values
      const holes = Array.from({ length: newCourse.numHoles }, (_, i) => ({
        number: i + 1,
        par: i < 4 || (i >= 9 && i < 13) ? 4 : (i === 4 || i === 13) ? 5 : 3, // Typical par layout
        yardage: {
          black: 400 + Math.floor(Math.random() * 200),
          blue: 380 + Math.floor(Math.random() * 180),
          white: 360 + Math.floor(Math.random() * 160),
          red: 320 + Math.floor(Math.random() * 140)
        },
        handicap: i + 1
      }))

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCourse.name,
          location: {
            address: newCourse.address,
            city: newCourse.city,
            state: newCourse.state,
            country: newCourse.country
          },
          holes,
          rating: {
            slope: 113,
            courseRating: newCourse.numHoles === 18 ? 72 : 36
          },
          contact: {
            phone: '',
            website: ''
          }
        }),
      })

      if (response.ok) {
        toast.success('Course created successfully!')
        setShowAddCourse(false)
        setNewCourse({
          name: '',
          address: '',
          city: '',
          state: '',
          country: '',
          numHoles: 18
        })
        fetchCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create course')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error creating course:', error)
    }
  }

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Course deleted successfully!')
        fetchCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete course')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Error deleting course:', error)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage golf courses</p>
        </div>
        <Button
          onClick={() => setShowAddCourse(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Course
        </Button>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-green-800">Add New Course</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCourse(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Course Name *</label>
                <Input
                  value={newCourse.name}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter course name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Number of Holes</label>
                <Input
                  type="number"
                  min="9"
                  max="27"
                  value={newCourse.numHoles}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, numHoles: parseInt(e.target.value) || 18 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={newCourse.address}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={newCourse.city}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  value={newCourse.state}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={newCourse.country}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddCourse(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCourse}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Get started by creating your first course</p>
            <Button
              onClick={() => setShowAddCourse(true)}
              className="mt-4 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold">{course.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{formatLocation(course.location)}</p>
                    <p className="text-sm text-gray-500 mt-1">{course.holes.length} holes</p>
                  </div>
                  {editingCourse === course._id ? (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveCourse(course._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Par Values
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCourse(course._id, course.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(editingCourse === course._id ? editingHoles : course.holes).map((hole, index) => (
                    <div key={hole.number} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="font-semibold text-gray-700">Hole {hole.number}</div>
                        <div className="mt-2">
                          {editingCourse === course._id ? (
                            <Input
                              type="number"
                              min="3"
                              max="6"
                              value={hole.par}
                              onChange={(e) => handleParChange(index, e.target.value)}
                              className="w-16 text-center mx-auto"
                            />
                          ) : (
                            <Badge variant="outline" className="text-lg font-bold">
                              Par {hole.par}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Handicap {hole.handicap}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}