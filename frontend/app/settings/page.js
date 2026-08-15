'use client'
import { useEffect, useState } from 'react'
import { getEmployees, addEmployee, deleteEmployee, saveApiKey } from '@/lib/api'
import GlassCard from '@/components/GlassCard'
import Link from 'next/link'
import { Users, Plus, Trash2, Key, Lock, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  // ----- Employee management -----
  const [employees, setEmployees] = useState([])
  const [newName, setNewName] = useState('')
  const [newPos, setNewPos] = useState('')
  const [loading, setLoading] = useState(true)

  // ----- API key management -----
  const [groqKey, setGroqKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [apiMessage, setApiMessage] = useState('')
  const [apiMessageType, setApiMessageType] = useState('success') // 'success' | 'error'

  // Load employees on mount
  const loadEmployees = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  // ----- Employee handlers -----
  const handleAddEmployee = async () => {
    if (!newName || !newPos) return
    try {
      await addEmployee({ name: newName, position: newPos })
      setNewName('')
      setNewPos('')
      await loadEmployees()
    } catch (e) {
      alert('Failed to add employee')
    }
  }

  const handleDeleteEmployee = async (name) => {
    if (!confirm(`Delete ${name}?`)) return
    try {
      await deleteEmployee(name)
      await loadEmployees()
    } catch (e) {
      alert('Failed to delete')
    }
  }

  // ----- API key handlers -----
  const handleSaveApiKey = async (keyName, value) => {
    if (!value) return
    try {
      await saveApiKey(keyName, value)
      setApiMessage(`${keyName} saved successfully!`)
      setApiMessageType('success')
      // Clear the field
      if (keyName === 'groq') setGroqKey('')
      else if (keyName === 'openai') setOpenaiKey('')
      else if (keyName === 'gemini') setGeminiKey('')
    } catch (e) {
      setApiMessage(`Failed to save ${keyName}`)
      setApiMessageType('error')
    }
    // Auto‑dismiss message after 5 seconds
    setTimeout(() => setApiMessage(''), 5000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Key className="text-indigo-600" size={28} />
          Settings
        </h1>
        <Link href="/" className="text-indigo-500 hover:underline flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* ===== Employee Management ===== */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users size={20} className="text-indigo-500" />
          Manage Employees
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            placeholder="Position"
            value={newPos}
            onChange={(e) => setNewPos(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={handleAddEmployee} className="btn-primary !w-auto px-6 flex items-center gap-2">
            <Plus size={18} /> Add
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : employees.length === 0 ? (
          <p className="text-gray-500">No employees yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <li key={emp.id || emp.name} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-gray-500">{emp.position}</p>
                </div>
                <button
                  onClick={() => handleDeleteEmployee(emp.name)}
                  className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* ===== API Key Management ===== */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Lock size={20} className="text-amber-500" />
          API Keys
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Keys are encrypted and never displayed again.
        </p>
        <div className="space-y-4">
          {/* Groq */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Groq API Key</label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="Enter Groq key (starts with gsk_)"
                className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => handleSaveApiKey('groq', groqKey)}
                className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          {/* OpenAI */}
          <div>
            <label className="block text-sm font-medium text-gray-700">OpenAI API Key</label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="Enter OpenAI key (starts with sk-...)"
                className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => handleSaveApiKey('openai', openaiKey)}
                className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          {/* Gemini */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter Gemini key"
                className="flex-1 p-2 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => handleSaveApiKey('gemini', geminiKey)}
                className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          {apiMessage && (
            <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${apiMessageType === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
              {apiMessageType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {apiMessage}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Your keys are stored encrypted on Supabase. An encryption key must be set on the server.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}