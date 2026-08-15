import { create } from 'zustand'
import { getEmployees } from './api'

export const useStore = create((set) => ({
  // ---- Existing ----
  employees: [],
  loadedReport: null,
  lunchHour: 13,
  setLunchHour: (hour) => set({ lunchHour: hour }),
  setLoadedReport: (report) => set({ loadedReport: report }),
  clearLoadedReport: () => set({ loadedReport: null }),
  loadEmployees: async () => {
    try {
      const data = await getEmployees()
      set({ employees: data })
    } catch (e) { console.error(e) }
  },
  // ---- New: sidebar state ----
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}))