import { MessageSquare } from 'lucide-react'

export default function HoiDapPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Hỏi đáp</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium">
          + Đặt câu hỏi
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>
      </div>
    </div>
  )
}
