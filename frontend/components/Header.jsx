'use client'
import { useStore } from '@/lib/store'
import { Menu, X, FileText } from 'lucide-react'

export default function Header() {
  const { isSidebarOpen, toggleSidebar } = useStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-white/40 px-4 py-3 flex items-center justify-between md:hidden shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <FileText className="text-white" size={16} />
        </div>
        <span className="font-bold text-gray-800">EOD<span className="text-indigo-600">Gen</span></span>
      </div>
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-gray-100/80 transition-colors"
      >
        {isSidebarOpen ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
      </button>
    </header>
  )
}