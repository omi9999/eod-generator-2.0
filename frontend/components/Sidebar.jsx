'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { addEmployee, deleteEmployee } from '@/lib/api'
import { useStore } from '@/lib/store'
import {
  Users, Plus, X, Utensils, LayoutDashboard, History, Settings,
  UserPlus, Check, FileText, Lock
} from 'lucide-react'

export default function Sidebar() {
  const [newName, setNewName] = useState('')
  const [newPos, setNewPos] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const pathname = usePathname()
  const { 
    employees, 
    loadEmployees, 
    lunchHour, 
    setLunchHour, 
    closeSidebar 
  } = useStore()

  useEffect(() => {
    loadEmployees()
  }, [])

  const handleAdd = async () => {
    if (!newName || !newPos) return
    await addEmployee({ name: newName, position: newPos })
    setNewName(''); setNewPos('')
    setShowAddForm(false)
    await loadEmployees() // refresh the store
  }

  const handleDelete = async (name) => {
    if (!confirm(`Delete ${name}?`)) return
    await deleteEmployee(name)
    await loadEmployees() // refresh the store
  }

  const formatLunchTime = (hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const display = hour > 12 ? hour - 12 : hour
    return `${display}:00 ${suffix}`
  }

  const handleNavClick = () => closeSidebar()

  return (
    <div className="w-64 sm:w-72 h-screen bg-white/80 backdrop-blur-2xl border-r border-white/40 shadow-2xl p-3 sm:p-5 overflow-y-auto flex flex-col transition-all duration-300 animate-fade-in">
      {/* Brand */}
      <div className="mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
          <FileText className="text-white" size={16} />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-gray-800">EOD<span className="text-indigo-600">Gen</span></h1>
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-widest hidden sm:block">AI‑powered reports</p>
        </div>
      </div>

      {/* Employees – uses store */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
            <Users size={12} className="text-indigo-500" />
            Employees
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-indigo-600 hover:text-indigo-800 transition-colors text-[10px] sm:text-xs font-medium flex items-center gap-0.5 sm:gap-1"
          >
            {showAddForm ? <X size={12} /> : <UserPlus size={12} />}
            {showAddForm ? 'Cancel' : 'Add'}
          </button>
        </div>

        {showAddForm && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/60 space-y-1.5 sm:space-y-2 animate-scale-in">
            <input
              type="text"
              placeholder="Full name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="text"
              placeholder="Position"
              value={newPos}
              onChange={e => setNewPos(e.target.value)}
              className="w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-1 text-xs sm:text-sm rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-1"
            >
              <Check size={12} /> Save
            </button>
          </div>
        )}

        <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1">
          {employees.map(emp => (
            <div key={emp.id || emp.name} className="flex justify-between items-center group px-2 sm:px-3 py-1 sm:py-2 rounded-xl hover:bg-indigo-50/50 transition-all duration-200">
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{emp.name}</span>
              <button
                onClick={() => handleDelete(emp.name)}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {employees.length === 0 && !showAddForm && (
            <p className="text-[10px] sm:text-xs text-gray-400 text-center py-1 sm:py-2">No employees yet.</p>
          )}
        </div>
      </div>

      {/* Lunch Break – unchanged */}
      <div className="mb-4 sm:mb-6 pt-3 sm:pt-4 border-t border-gray-200/40">
        <h2 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
          <Utensils size={12} className="text-amber-500" />
          Lunch Break
        </h2>
        <div className="mt-1.5 sm:mt-3">
          <div className="flex justify-between text-[9px] sm:text-xs text-gray-500 mb-0.5">
            <span>12:00 PM</span>
            <span className="font-medium text-indigo-600">{formatLunchTime(lunchHour)}</span>
            <span>2:00 PM</span>
          </div>
          <input
            type="range"
            min="12"
            max="14"
            value={lunchHour}
            onChange={(e) => setLunchHour(parseInt(e.target.value))}
            className="w-full h-1 sm:h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
            style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((lunchHour-12)/2)*100}%, #e5e7eb ${((lunchHour-12)/2)*100}%, #e5e7eb 100%)` }}
          />
          <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5">
            Lunch at <span className="font-medium text-gray-600">{formatLunchTime(lunchHour)}</span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-0.5 sm:space-y-1 flex-1">
        <Link href="/" onClick={handleNavClick} className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 ${pathname === '/' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50/80'}`}>
          <LayoutDashboard size={16} className={pathname === '/' ? 'text-indigo-600' : 'text-gray-400'} />
          <span className="text-xs sm:text-sm">Dashboard</span>
        </Link>
        <Link href="/history" onClick={handleNavClick} className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 ${pathname === '/history' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50/80'}`}>
          <History size={16} className={pathname === '/history' ? 'text-indigo-600' : 'text-gray-400'} />
          <span className="text-xs sm:text-sm">History</span>
        </Link>
        <Link href="/settings" onClick={handleNavClick} className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 ${pathname === '/settings' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50/80'}`}>
          <Settings size={16} className={pathname === '/settings' ? 'text-indigo-600' : 'text-gray-400'} />
          <span className="text-xs sm:text-sm">Settings</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="text-[8px] sm:text-[10px] text-gray-400 border-t border-gray-200/40 pt-2 sm:pt-3 mt-2 sm:mt-4 flex items-center gap-1">
        <Lock size={10} className="text-gray-400" />
        <span>Files never stored – history only</span>
      </div>
    </div>
  )
}