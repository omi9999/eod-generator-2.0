import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ---------- Report Generation ----------
export const generateReport = async (data) => {
  const res = await api.post('/api/generation/generate', data)
  return res.data
}

// ---------- Update Report (after editing) ----------
export const updateReport = async (data) => {
  const res = await api.post('/api/generation/update', data)
  return res.data
}

// ---------- Employees ----------
export const getEmployees = async () => {
  const res = await api.get('/api/employees')
  return res.data
}

export const addEmployee = async (emp) => {
  const res = await api.post('/api/employees', emp)
  return res.data
}

export const deleteEmployee = async (name) => {
  await api.delete(`/api/employees/${encodeURIComponent(name)}`)
}

// ---------- History ----------
export const getHistory = async (employeeName) => {
  const params = employeeName ? { employee_name: employeeName } : {}
  const res = await api.get('/api/history', { params })
  return res.data
}

// ---------- Secure API Key Management ----------
export const saveApiKey = async (keyName, keyValue) => {
  const res = await api.post('/api/config/api-keys', { key_name: keyName, key_value: keyValue })
  return res.data
}

export const deleteApiKey = async (keyName) => {
  await api.delete(`/api/config/api-keys/${keyName}`)
}
export const deleteHistory = async (entryId) => {
  await api.delete(`/api/history/${entryId}`)
}
export const deleteEmployeeHistory = async (employeeName) => {
  await api.delete(`/api/history/employee/${encodeURIComponent(employeeName)}`)
}
import useSWR from 'swr'
export const useHistory = (filter) => useSWR(['history', filter], () => getHistory(filter))