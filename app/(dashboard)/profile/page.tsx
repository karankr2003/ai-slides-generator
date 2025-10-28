"use client"

export default function ProfilePage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-2xl mx-auto mb-4">
          U
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">User Profile</h2>
        <p className="text-muted-foreground mb-6">Guest Account</p>
        
        <div className="text-sm text-muted-foreground">
          Profile settings coming soon
        </div>
      </div>
    </div>
  )
}
