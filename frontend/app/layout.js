import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import LayoutClient from '@/components/LayoutClient'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

export const metadata = {
  title: 'EOD Report Generator – AI‑powered End of Day Reports',
  description: 'Generate professional End of Day reports with AI. Fast, accurate, and beautifully formatted.',
  keywords: 'EOD, report, generator, AI, productivity, business',
  authors: [{ name: 'EOD Gen' }],
  openGraph: {
    title: 'EOD Report Generator',
    description: 'AI‑powered End of Day reports – fast, accurate, and beautifully formatted',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}