"use client"

export function MyPresentations() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">My Presentations</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No presentations yet</h2>
            <p className="text-muted-foreground">Create your first presentation to see it here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
