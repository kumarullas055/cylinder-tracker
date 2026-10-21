import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[TEST-AUTH] ===== AUTHORIZE CALLED =====')
        console.log('[TEST-AUTH] credentials:', JSON.stringify(credentials, null, 2))
        if (credentials?.email === 'test@test.com' && credentials?.password === 'test123') {
          return { id: '1', email: 'test@test.com', name: 'Test User' }
        }
        return null
      },
    }),
  ],
  debug: true,
  secret: 'test-secret-key-for-development-only',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }