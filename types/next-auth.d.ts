import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      handicap?: number
      role?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    handicap?: number
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    handicap?: number
    role?: string
  }
}