'use client'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useStore } from '@/lib/store'

export default function LayoutClient({ children }) {
  const { isSidebarOpen, closeSidebar } = useStore()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 relative">
      <Header />
      
      {/* Sidebar drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main content – with top padding for fixed header on mobile */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}