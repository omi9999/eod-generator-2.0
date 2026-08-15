export default function GlassCard({ children, className = '', dark = false }) {
  return (
    <div className={`${dark ? 'glass-card-dark' : 'glass-card'} ${className}`}>
      {children}
    </div>
  )
}