'use client'
import { useState, useEffect } from 'react'
import { generateReport, addEmployee } from '@/lib/api'
import GlassCard from '@/components/GlassCard'
import dynamic from 'next/dynamic'
import { useStore } from '@/lib/store'
import { FileText, Utensils, Clock, Sparkles, User, Briefcase, Calendar, Rocket, Check } from 'lucide-react'

const ReportPreview = dynamic(() => import('@/components/ReportPreview'), { ssr: false, loading: () => <p className="text-gray-500">Loading preview...</p> })

// ---------- Helpers ----------
function getTimeSlots(lunchHour) {
  const slots = []
  for (let h = 10; h < 18; h++) {
    let start = h, end = h + 1
    let startStr, endStr
    if (h < 12) startStr = `${h.toString().padStart(2, '0')}:00 am`
    else if (h === 12) startStr = '12:00 pm'
    else startStr = `${(h - 12).toString().padStart(2, '0')}:00 pm`
    if (end < 12) endStr = `${end.toString().padStart(2, '0')}:00 am`
    else if (end === 12) endStr = '12:00 pm'
    else endStr = `${(end - 12).toString().padStart(2, '0')}:00 pm`
    slots.push(`${startStr} to ${endStr}`)
  }
  return slots
}

function getTimeSlotsShort(lunchHour) {
  const slots = []
  for (let h = 10; h < 18; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00-${(h+1).toString().padStart(2, '0')}:00`)
  }
  return slots
}

function formatSlotDisplay(shortSlot) {
  const parts = shortSlot.split('-')
  if (parts.length !== 2) return shortSlot
  const startHour = parseInt(parts[0].split(':')[0])
  const endHour = parseInt(parts[1].split(':')[0])
  const formatHour = (h) => {
    const suffix = h >= 12 ? 'PM' : 'AM'
    const display = h > 12 ? h - 12 : h
    return `${display}:00 ${suffix}`
  }
  return `${formatHour(startHour)}–${formatHour(endHour)}`
}

export default function Home() {
  const [employeeName, setEmployeeName] = useState('')
  const [position, setPosition] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [showAddNew, setShowAddNew] = useState(false)
  const [newEmpName, setNewEmpName] = useState('')
  const [newEmpPos, setNewEmpPos] = useState('')
  const [addError, setAddError] = useState('')

  const { employees, loadEmployees, loadedReport, clearLoadedReport, lunchHour, setLunchHour } = useStore()

  // Force sync employees when they change
  useEffect(() => {
    loadEmployees()
  }, [])

  // Auto-select first employee if none selected
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId && !employeeName) {
      const first = employees[0]
      setEmployeeName(first.name)
      setPosition(first.position)
      setSelectedEmployeeId(first.id)
    }
  }, [employees])

  useEffect(() => {
    if (loadedReport) {
      setReport(loadedReport)
      clearLoadedReport()
    }
  }, [loadedReport])

  const [slotTasks, setSlotTasks] = useState({})
  const fullSlots = getTimeSlots(lunchHour)
  const shortSlots = getTimeSlotsShort(lunchHour)
  const lunchIndex = lunchHour - 10

  useEffect(() => {
    const newSlotTasks = {}
    fullSlots.forEach(slot => { if (!slotTasks[slot]) newSlotTasks[slot] = '' })
    fullSlots.forEach(slot => { if (slotTasks[slot] !== undefined) newSlotTasks[slot] = slotTasks[slot] })
    setSlotTasks(newSlotTasks)
  }, [lunchHour])

  const handleEmployeeSelect = (e) => {
    const value = e.target.value
    if (value === 'add_new') {
      setShowAddNew(true)
      setSelectedEmployeeId('')
      setEmployeeName('')
      setPosition('')
      setAddError('')
    } else {
      setShowAddNew(false)
      const emp = employees.find(e => e.id === value)
      if (emp) {
        setEmployeeName(emp.name)
        setPosition(emp.position)
        setSelectedEmployeeId(emp.id)
      }
    }
  }

  const handleAddNewEmployee = async () => {
    if (!newEmpName || !newEmpPos) {
      setAddError('Please fill in both name and position')
      return
    }
    setAddError('')
    try {
      // 1. Add the employee (backend returns the full employee object)
      const added = await addEmployee({ name: newEmpName, position: newEmpPos })
      // 2. Refresh the employee list in the store
      await loadEmployees()
      // 3. Use the returned employee to select it (or fallback to the store's list)
      const newEmp = added || employees.find(e => e.name === newEmpName)
      if (newEmp) {
        setEmployeeName(newEmp.name)
        setPosition(newEmp.position)
        setSelectedEmployeeId(newEmp.id)
        setShowAddNew(false)      // <-- closes the add form
        setNewEmpName('')
        setNewEmpPos('')
      }
    } catch (e) {
      let msg = 'Failed to add employee.'
      if (e.response && e.response.data && e.response.data.detail) {
        msg = e.response.data.detail
      } else if (e.message) {
        msg = e.message
      }
      setAddError(msg)
    }
  }

  const handleSlotChange = (slot, value) => setSlotTasks(prev => ({ ...prev, [slot]: value }))

  const buildTaskSummary = () => {
    const lines = []
    fullSlots.forEach((slot, idx) => {
      if (idx === lunchIndex) return
      const short = shortSlots[idx]
      const task = slotTasks[slot] || ''
      lines.push(`${short}: ${task}`)
    })
    return lines.join('\n')
  }

  const templates = {
    'Feng Shui & Content': {
      '10:00-11:00': 'Posted Feng Shui stories',
      '11:00-12:00': 'Created post on July animal signs',
      '12:00-13:00': 'Started editing Kedarnath reel',
      '14:00-15:00': 'Created 15 AI creatives for reel',
      '15:00-16:00': 'Continued editing reel',
      '16:00-17:00': 'Reviewed performance',
      '17:00-18:00': 'Planned next steps'
    },
    'Meetings & Documentation': {
      '10:00-11:00': 'Team sync meeting',
      '11:00-12:00': 'Wrote meeting notes',
      '12:00-13:00': 'Follow-up emails',
      '14:00-15:00': 'Project planning',
      '15:00-16:00': 'Client call',
      '16:00-17:00': 'Prepared status report',
      '17:00-18:00': 'Reviewed and finalized'
    },
    'Development & Testing': {
      '10:00-11:00': 'Fixed bugs',
      '11:00-12:00': 'Developed new feature',
      '12:00-13:00': 'Code review',
      '14:00-15:00': 'Wrote tests',
      '15:00-16:00': 'Deployed to staging',
      '16:00-17:00': 'Updated documentation',
      '17:00-18:00': 'Sprint planning'
    }
  }

  const applyTemplate = (template) => {
    const newTasks = { ...slotTasks }
    Object.keys(template).forEach(short => {
      const idx = shortSlots.indexOf(short)
      if (idx !== -1 && idx !== lunchIndex) {
        const slot = fullSlots[idx]
        newTasks[slot] = template[short]
      }
    })
    setSlotTasks(newTasks)
  }

  const handleGenerate = async () => {
    const taskSummary = buildTaskSummary()
    if (!taskSummary.trim()) { setError('Please add at least one task.'); return }
    setError(null); setLoading(true)
    try {
      const data = await generateReport({
        user_tasks: taskSummary,
        employee_name: employeeName || employees[0]?.name || '',
        position: position || employees[0]?.position || '',
        report_date: reportDate,
        provider: 'Groq (Fastest)',
        model: 'llama-3.1-8b-instant',
        api_key: '',
        lunch_hour: lunchHour,
      })
      setReport(data)
    } catch (err) { setError(err.message || 'Failed to generate report.') }
    finally { setLoading(false) }
  }

  const handleUpdate = (updatedReport) => setReport(updatedReport)

  const formatLunchTime = (hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const display = hour > 12 ? hour - 12 : hour
    return `${display}:00 ${suffix}`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-indigo-50/80 backdrop-blur-sm rounded-full border border-indigo-200/50 text-indigo-700 text-[9px] sm:text-xs font-medium">
          <Sparkles size={11} /> AI‑powered
        </div>
        <h1 className="text-2xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent animate-gradient">
          EOD Report Generator
        </h1>
        <p className="text-[10px] sm:text-base text-gray-500 max-w-2xl mx-auto px-2">
          Generate professional End of Day reports with AI — fast, accurate, and beautifully formatted.
        </p>
      </div>

      <GlassCard className="glow-indigo p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-5">
          {/* Employee & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 flex items-center gap-1">
                <User size={12} className="text-indigo-500" /> Employee
              </label>
              <select
                value={selectedEmployeeId}
                onChange={handleEmployeeSelect}
                className="w-full p-1.5 sm:p-3 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
              >
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                <option value="add_new">+ Add new employee</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 flex items-center gap-1">
                <Briefcase size={12} className="text-purple-500" /> Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Position"
                className="w-full p-1.5 sm:p-3 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
              />
            </div>
          </div>

          {showAddNew && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50/70 p-2 sm:p-4 rounded-xl border border-indigo-200/60 space-y-2 animate-scale-in">
              <p className="text-xs sm:text-sm font-medium text-indigo-700">Add new employee</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full name"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full p-1.5 sm:p-3 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text"
                  placeholder="Position"
                  value={newEmpPos}
                  onChange={(e) => setNewEmpPos(e.target.value)}
                  className="w-full p-1.5 sm:p-3 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {addError && (
                <p className="text-red-500 text-xs sm:text-sm">{addError}</p>
              )}
              <button
                onClick={handleAddNewEmployee}
                className="btn-primary !w-auto px-4 py-1 text-xs sm:text-sm"
              >
                <Check size={12} className="mr-1" /> Save
              </button>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 flex items-center gap-1">
              <Calendar size={12} className="text-pink-500" /> Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full p-1.5 sm:p-3 text-xs sm:text-sm rounded-xl border border-gray-200/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
          </div>

          {/* Lunch Break */}
          <div>
            <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 flex items-center gap-1">
              <Utensils size={12} className="text-amber-500" /> Lunch Break
            </label>
            <div className="mt-0.5">
              <div className="flex justify-between text-[9px] sm:text-xs text-gray-500">
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
                className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500 mt-0.5"
                style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((lunchHour-12)/2)*100}%, #e5e7eb ${((lunchHour-12)/2)*100}%, #e5e7eb 100%)` }}
              />
              <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5">
                Lunch at <span className="font-medium text-gray-600">{formatLunchTime(lunchHour)}</span>
              </p>
            </div>
          </div>

          {/* Tasks per Time Slot */}
          <div>
            <label className="block text-[10px] sm:text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Clock size={12} className="text-indigo-500" /> Tasks per Time Slot
            </label>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {fullSlots.map((slot, idx) => {
                const short = shortSlots[idx]
                const displayLabel = formatSlotDisplay(short)
                if (idx === lunchIndex) {
                  return (
                    <div key={slot} className="flex items-center gap-1.5 p-1 sm:p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60">
                      <Utensils size={10} className="text-amber-500 flex-shrink-0" />
                      <span className="text-[9px] sm:text-sm font-medium text-amber-600 w-20 sm:w-36 flex-shrink-0 whitespace-nowrap">{displayLabel}</span>
                      <span className="text-[9px] sm:text-sm text-amber-700">Lunch Break</span>
                    </div>
                  )
                }
                return (
                  <div key={slot} className="flex items-center gap-1 p-0.5 sm:p-1.5 hover:bg-indigo-50/30 rounded-lg transition-colors">
                    <span className="text-[9px] sm:text-sm font-medium text-gray-500 w-20 sm:w-36 flex-shrink-0 whitespace-nowrap">{displayLabel}</span>
                    <input
                      type="text"
                      value={slotTasks[slot] || ''}
                      onChange={(e) => handleSlotChange(slot, e.target.value)}
                      placeholder="Enter task..."
                      className="flex-1 p-1 sm:p-2 text-[9px] sm:text-sm rounded-lg border border-gray-200/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-indigo-400/60 placeholder:text-gray-400 min-w-0"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Templates */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {Object.keys(templates).map((name) => (
              <button
                key={name}
                onClick={() => applyTemplate(templates[name])}
                className="text-[7px] sm:text-xs bg-gray-100/80 hover:bg-gray-200/80 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full transition-all duration-200 flex items-center gap-0.5"
              >
                <FileText size={9} className="text-gray-500" /> {name}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary mt-0.5 flex items-center justify-center gap-1.5 text-xs sm:text-base py-2 sm:py-3"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <><Rocket size={14} className="sm:w-4 sm:h-4" /> Generate Report</>
            )}
          </button>
          {error && <p className="text-red-500 text-[10px] sm:text-xs text-center mt-0.5">{error}</p>}
        </div>
      </GlassCard>

      {report && <ReportPreview report={report} onUpdate={handleUpdate} />}
    </div>
  )
}