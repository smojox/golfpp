'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Login successful!')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      if (response.ok) {
        toast.success('Account created! Please sign in.')
        setIsRegistering(false)
        setName('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/golf-background.png" 
          alt="Golf Course Background" 
          fill 
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      <div className="relative z-10 w-full max-w-sm space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-32 h-32 relative mb-6 drop-shadow-lg">
            <Image src="/pp-cup-logo.png" alt="PP Cup 2026 Logo" fill className="object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">PP CUP 2026</h1>
          <p className="text-white/90 text-lg drop-shadow-md">Golf Tournament Management</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required
              />

              {!isRegistering && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-green-700 hover:underline hover:text-green-800">
                    Forgot password?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-green-700 hover:bg-green-800 text-white font-semibold shadow-lg"
              >
                {isLoading ? 'Loading...' : isRegistering ? 'Create Account' : 'Sign In'}
              </Button>
            </form>


            <p className="text-center text-sm text-slate-600">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-green-700 hover:underline hover:text-green-800 font-medium"
              >
                {isRegistering ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}