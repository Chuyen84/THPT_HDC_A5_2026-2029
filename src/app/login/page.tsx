import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const message = params?.message

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Đăng nhập</h1>
        
        {message && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
            {message}
          </div>
        )}
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
            <input 
              id="email"
              name="email"
              type="email" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Mật khẩu</label>
            <input 
              id="password"
              name="password"
              type="password"
              required 
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            formAction={login}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
          >
            Đăng nhập
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  )
}
