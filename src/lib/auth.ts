import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Disabled for credentials + JWT
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@cylintrack.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials or account disabled')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'ADMIN' | 'STAFF',
          avatarUrl: user.avatarUrl ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.avatarUrl = (user as any).avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).avatarUrl = token.avatarUrl
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

declare module 'next-auth' {
  interface User {
    role: 'ADMIN' | 'STAFF'
    avatarUrl?: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'ADMIN' | 'STAFF'
      avatarUrl?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'STAFF'
    avatarUrl?: string
  }
}