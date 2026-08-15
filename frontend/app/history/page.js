'use client'
import { useEffect, useState } from 'react'
import { getHistory, deleteHistory, deleteEmployeeHistory } from '@/lib/api'
import GlassCard from '@/components/GlassCard'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, User, Calendar, Clock, Filter, Trash2, Loader2, Users } from 'lucide-react'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)         // id of single entry being deleted
  const [deletingEmployee, setDeletingEmployee] = useState(null) // name of employee being bulk‑deleted
  const [expandedEmployee, setExpandedEmployee] = useState(null)
  const [expandedDate, setExpandedDate] = useState(null)
  const { setLoadedReport } = useStore()
  const router = useRouter()

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const data = await getHistory(filter || undefined)
      setHistory(data)
    } catch (e) {
      console.error('Failed to fetch history:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [filter])

  // Group and sort
  const groupedByEmployee = history.reduce((acc, entry) => {
    const empName = entry.employee_name || 'Unknown'
    if (!acc[empName]) acc[empName] = []
    acc[empName].push(entry)
    return acc
  }, {})
  const sortedEmployees = Object.keys(groupedByEmployee).sort()
  const sortEntriesByDate = (entries) => entries.sort((a, b) => new Date(b.date) - new Date(a.date))

  const toggleEmployee = (empName) => {
    setExpandedEmployee(expandedEmployee === empName ? null : empName)
    setExpandedDate(null)
  }
  const toggleDate = (empName, date) => {
    const key = `${empName}-${date}`
    setExpandedDate(expandedDate === key ? null : key)
  }

  // ---- Load a report ----
  const handleLoad = (entry) => {
    setLoadedReport(entry)
    router.push('/')
  }

  // ---- Delete single (no confirm) ----
  const handleDelete = async (entryId, empName, dateStr) => {
    setDeleting(entryId)
    try {
      await deleteHistory(entryId)
      await fetchHistory()
    } catch (e) {
      alert('Failed to delete: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  // ---- Delete all for an employee (no confirm) ----
  const handleDeleteAll = async (empName) => {
    setDeletingEmployee(empName)
    try {
      await deleteEmployeeHistory(empName)
      await fetchHistory()
      // Collapse the employee group after deletion
      setExpandedEmployee(null)
    } catch (e) {
      alert('Failed to delete all: ' + e.message)
    } finally {
      setDeletingEmployee(null)
    }
  }

  // ---- Helpers ----
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return dateStr }
  }
  const formatTime = (isoStr) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    } catch { return isoStr }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="text-indigo-600" size={28} />
          Report History
        </h1>
        <Link href="/" className="text-indigo-500 hover:underline flex items-center gap-1 text-sm">
          ← Back
        </Link>
      </div>

      <GlassCard>
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Filter by employee name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </GlassCard>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500">No reports found.</p>
      ) : (
        <div className="space-y-4">
          {sortedEmployees.map((empName) => {
            const entries = sortEntriesByDate([...groupedByEmployee[empName]])
            const isEmployeeExpanded = expandedEmployee === empName
            const isDeletingAll = deletingEmployee === empName

            return (
              <GlassCard key={empName} className="overflow-hidden">
                {/* Employee header with "Delete All" button */}
                <div
                  className="flex justify-between items-center cursor-pointer hover:bg-gray-50/50 -m-4 p-4 rounded-xl transition-colors"
                  onClick={() => toggleEmployee(empName)}
                >
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-indigo-500" />
                    <span className="font-bold text-lg">{empName}</span>
                    <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {entries.length} report{entries.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAll(empName)
                      }}
                      disabled={isDeletingAll}
                      className="text-red-500 hover:text-red-700 text-xs font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isDeletingAll ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      {isDeletingAll ? 'Deleting...' : 'Delete All'}
                    </button>
                    <span className="text-gray-400">
                      {isEmployeeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </div>
                </div>

                {isEmployeeExpanded && (
                  <div className="mt-4 space-y-3">
                    {Object.entries(
                      entries.reduce((dateAcc, entry) => {
                        const d = entry.date || 'Unknown date'
                        if (!dateAcc[d]) dateAcc[d] = []
                        dateAcc[d].push(entry)
                        return dateAcc
                      }, {})
                    )
                    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                    .map(([date, dateEntries]) => {
                      const dateKey = `${empName}-${date}`
                      const isDateExpanded = expandedDate === dateKey

                      return (
                        <div key={dateKey} className="border border-gray-100 rounded-xl overflow-hidden">
                          <div
                            className="flex justify-between items-center p-3 bg-gray-50/60 cursor-pointer hover:bg-gray-100/50 transition-colors"
                            onClick={() => toggleDate(empName, date)}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-500" />
                              <span className="font-medium text-gray-700">{formatDate(date)}</span>
                              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">
                                {dateEntries.length} entry{dateEntries.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="text-gray-400">
                              {isDateExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>

                          {isDateExpanded && (
                            <div className="divide-y divide-gray-100">
                              {dateEntries.map((entry) => {
                                const entryId = entry.id
                                const isDeletingEntry = deleting === entryId
                                return (
                                  <div key={entryId} className="p-3 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-500">{entry.position}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Generated: {formatTime(entry.created_at)}
                                        </p>
                                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                                          {entry.schedule?.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex gap-2">
                                              <span className="font-medium w-24 flex-shrink-0">{item.slot}</span>
                                              <span className="truncate">{item.activity}</span>
                                            </div>
                                          ))}
                                          {entry.schedule?.length > 3 && (
                                            <span className="text-gray-400">… {entry.schedule.length - 3} more</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleLoad(entry) }}
                                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                          Load
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDelete(entryId, empName, formatDate(entry.date)) }}
                                          disabled={isDeletingEntry}
                                          className="text-red-500 hover:text-red-700 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                          {isDeletingEntry ? (
                                            <Loader2 size={14} className="animate-spin" />
                                          ) : (
                                            <Trash2 size={14} />
                                          )}
                                          {isDeletingEntry ? 'Deleting...' : 'Delete'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}