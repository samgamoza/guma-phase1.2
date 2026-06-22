import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export function requireAdminSession() {
  if (process.env.NODE_ENV === 'development') return true

  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('admin_session')

  if (!sessionCookie?.value) {
    redirect('/admin-login')
  }

  return true
}
