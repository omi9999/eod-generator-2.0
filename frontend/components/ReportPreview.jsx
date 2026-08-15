'use client'
import { useState, useEffect } from 'react'
import GlassCard from './GlassCard'
import { updateReport } from '@/lib/api'
import { useStore } from '@/lib/store'
import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

export default function ReportPreview({ report }) {
  const [schedule, setSchedule] = useState(report?.schedule || [])
  const [loading, setLoading] = useState(false)
  const [base64Data, setBase64Data] = useState({
    excel_base64: report?.excel_base64,
    pdf_base64: report?.pdf_base64,
  })
  const [reportMeta, setReportMeta] = useState({
    employee_name: report?.employee_name,
    position: report?.position,
    date: report?.date,
  })
  const { lunchHour } = useStore()

  useEffect(() => {
    if (report) {
      setSchedule(report.schedule)
      setBase64Data({ excel_base64: report.excel_base64, pdf_base64: report.pdf_base64 })
      setReportMeta({ employee_name: report.employee_name, position: report.position, date: report.date })
    }
  }, [report])

  const handleCellChange = (idx, field, value) => {
    const newSchedule = [...schedule]
    newSchedule[idx] = { ...newSchedule[idx], [field]: value }
    setSchedule(newSchedule)
  }

  const refreshFiles = async () => {
    if (!reportMeta) return
    setLoading(true)
    try {
      const updated = await updateReport({
        employee_name: reportMeta.employee_name,
        position: reportMeta.position,
        report_date: reportMeta.date,
        schedule: schedule,
        lunch_hour: lunchHour,
      })
      setBase64Data({ excel_base64: updated.excel_base64, pdf_base64: updated.pdf_base64 })
      return updated
    } catch (e) { alert('Failed to refresh report: ' + e.message); return null }
    finally { setLoading(false) }
  }

  const download = async (base64Key, filename, mime) => {
    const updated = await refreshFiles()
    const base64 = updated ? updated[base64Key] : base64Data[base64Key]
    if (!base64) { alert('Please wait while we refresh the report.'); return }
    const link = document.createElement('a')
    link.href = `data:${mime};base64,${base64}`
    link.download = filename
    link.click()
  }

  if (!report) return null
  const { employee_name, position, date } = reportMeta

  return (
    <GlassCard className="glow-pink animate-scale-in p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 className="text-sm sm:text-lg font-bold text-gray-800 flex items-center gap-1.5 sm:gap-2">
          <FileText className="text-indigo-600" size={16} />
          EOD Report
        </h2>
        <span className="text-[8px] sm:text-[10px] text-gray-400 bg-gray-100/80 px-1.5 sm:px-2 py-0.5 rounded-full">Generated</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 text-[9px] sm:text-xs bg-indigo-50/40 rounded-xl p-1.5 sm:p-2.5 mb-2 sm:mb-3">
        <div className="truncate"><span className="font-medium text-gray-600">Employee:</span> <span className="text-gray-800">{employee_name}</span></div>
        <div className="truncate"><span className="font-medium text-gray-600">Position:</span> <span className="text-gray-800">{position}</span></div>
        <div className="truncate"><span className="font-medium text-gray-600">Date:</span> <span className="text-gray-800">{formatDate(date)}</span></div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200/60 -mx-1 sm:mx-0">
        <table className="w-full text-[8px] sm:text-xs min-w-[400px]">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <th className="border-b border-gray-200/60 px-1 sm:px-2 py-0.5 sm:py-1.5 text-left font-semibold text-gray-600">Time</th>
              <th className="border-b border-gray-200/60 px-1 sm:px-2 py-0.5 sm:py-1.5 text-left font-semibold text-gray-600">Activity</th>
              <th className="border-b border-gray-200/60 px-1 sm:px-2 py-0.5 sm:py-1.5 text-left font-semibold text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                <td className="border-b border-gray-100 px-1 sm:px-2 py-0.5 sm:py-1 text-gray-500 whitespace-nowrap text-[7px] sm:text-xs">{item.slot}</td>
                <td className="border-b border-gray-100 px-1 sm:px-2 py-0.5 sm:py-1">
                  <input
                    type="text"
                    value={item.activity}
                    onChange={(e) => handleCellChange(idx, 'activity', e.target.value)}
                    className="w-full p-0.5 sm:p-1 text-[7px] sm:text-xs rounded-md border border-gray-200/60 bg-white/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/60 transition-all"
                  />
                </td>
                <td className="border-b border-gray-100 px-1 sm:px-2 py-0.5 sm:py-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleCellChange(idx, 'description', e.target.value)}
                    className="w-full p-0.5 sm:p-1 text-[7px] sm:text-xs rounded-md border border-gray-200/60 bg-white/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/60 transition-all"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
        <button
          onClick={() => download('excel_base64', `EOD_${formatDate(date)}_${employee_name.split(' ')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
          disabled={loading}
          className="flex-1 min-w-[60px] sm:min-w-[100px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <FileSpreadsheet size={12} className="sm:w-4 sm:h-4" /> {loading ? '...' : 'Excel'}
        </button>
        <button
          onClick={() => download('pdf_base64', `EOD_${formatDate(date)}_${employee_name.split(' ')[0]}.pdf`, 'application/pdf')}
          disabled={loading}
          className="flex-1 min-w-[60px] sm:min-w-[100px] bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-sm shadow-md shadow-rose-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <FileText size={12} className="sm:w-4 sm:h-4" /> {loading ? '...' : 'PDF'}
        </button>
        <button
          onClick={refreshFiles}
          disabled={loading}
          className="flex-1 min-w-[50px] sm:min-w-[90px] bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-sm border border-gray-200/60 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <RefreshCw size={12} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? '...' : 'Refresh'}
        </button>
      </div>

      <p className="text-[6px] sm:text-[10px] text-gray-400 mt-1.5 sm:mt-2 text-center">
        ✏️ Edit any field – downloads auto‑refresh with changes.
      </p>
    </GlassCard>
  )
}