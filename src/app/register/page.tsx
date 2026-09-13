import { register } from './actions'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Đăng ký tài khoản</h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fullName">Họ và tên</label>
            <input 
              id="fullName"
              name="fullName"
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="role">Vai trò</label>
            <select
              id="role"
              name="role"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hoc_sinh">Học sinh</option>
              <option value="phu_huynh">Phụ huynh</option>
              <option value="gvcn">Giáo viên chủ nhiệm</option>
            </select>
          </div>

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
            formAction={register}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-medium"
          >
            Đăng ký
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
