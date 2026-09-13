'use client'

import { useState } from 'react'
import { login } from './actions'
import Link from 'next/link'
import { Phone, Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-fill password format <phone>_phhs when phone changes or on button click
  const handlePhoneChange = (val: string) => {
    // Keep only numbers
    const clean = val.replace(/[^\d]/g, '')
    setPhone(clean)
  }

  const handleApplyDefaultPassword = () => {
    if (!phone) {
      alert('Vui lòng nhập số điện thoại trước!')
      return
    }
    setPassword(`${phone}_phhs`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('phone', phone)
    formData.append('password', password)

    try {
      await login(formData)
    } catch (err: any) {
      // Next redirect throws NEXT_REDIRECT which shouldn't be caught as error
      if (err?.message && !err.message.includes('NEXT_REDIRECT')) {
        setErrorMessage(err.message)
        setLoading(false)
      }
    }
  }

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <Phone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Đăng nhập Phụ huynh / Học sinh
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đăng nhập bằng số điện thoại đã đăng ký trong hồ sơ học sinh Lớp 10A5
          </p>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/60 font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              htmlFor="phone"
            >
              Số điện thoại đăng nhập <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                placeholder="VD: 0912345678"
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                htmlFor="password"
              >
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              {phone && (
                <button
                  type="button"
                  onClick={handleApplyDefaultPassword}
                  className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline font-medium"
                  title="Điền tự động mật khẩu mặc định"
                >
                  Điền mẫu: {phone}_phhs
                </button>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="VD: 0912345678_phhs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Guide hint */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-cyan-200 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              Quy ước đăng nhập dành cho Phụ huynh:
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-800 dark:text-cyan-300/90">
              <li>
                <b>Tài khoản:</b> Là số điện thoại của Bố hoặc Mẹ trong danh sách học sinh.
              </li>
              <li>
                <b>Mật khẩu mặc định:</b> Là số điện thoại thêm hậu tố <code>_phhs</code>
                <br />
                (Ví dụ: Số ĐT <code>0948697997</code> thì mật khẩu là <code>0948697997_phhs</code>).
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition shadow-md shadow-blue-500/20 disabled:opacity-50 text-sm"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
          <span>Quản trị viên / GVCN?</span>
          <button
            type="button"
            onClick={() => {
              const emailAdmin = prompt('Nhập Email quản trị viên (GVCN):')
              if (emailAdmin) {
                setPhone(emailAdmin)
                const pass = prompt('Nhập mật khẩu:')
                if (pass) {
                  setPassword(pass)
                }
              }
            }}
            className="text-blue-600 dark:text-cyan-400 hover:underline font-medium"
          >
            Đăng nhập Email
          </button>
        </div>
      </div>
    </div>
  )
}
