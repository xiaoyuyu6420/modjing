import { isAdminEnabled } from '@/lib/admin-auth'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginForm devMode={!isAdminEnabled()} />
}
