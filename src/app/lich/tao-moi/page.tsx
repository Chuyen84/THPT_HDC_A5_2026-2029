import { submitEvent } from './actions'
import Link from 'next/link'

export default function TaoLichPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/lich" className="text-slate-500">Back</Link>
        <h1 className="text-2xl font-bold text-slate-800">Thêm sự kiện</h1>
      </div>
      <form action={submitEvent} className="space-y-4 bg-white p-6 rounded-xl border border-slate-100">
        <input name="title" required placeholder="Tên sự kiện..." className="w-full px-4 py-2 border rounded-lg" />
        <textarea name="description" placeholder="Mô tả chi tiết..." className="w-full px-4 py-2 border rounded-lg" rows={3}></textarea>
        <input name="event_date" type="datetime-local" required className="w-full px-4 py-2 border rounded-lg" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">Lưu sự kiện</button>
      </form>
    </div>
  )
}
