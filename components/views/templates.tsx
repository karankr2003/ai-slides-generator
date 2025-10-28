"use client"

import { Button } from "@/components/ui/button"

export function Templates() {
  const templates = [
    { id: 1, title: "Artificial Intelligence", color: "from-green-400 to-green-600" },
    { id: 2, title: "Business Strategy", color: "from-yellow-400 to-yellow-600" },
    { id: 3, title: "Market Opportunity", color: "from-blue-400 to-blue-600" },
    { id: 4, title: "E-Commerce Guide", color: "from-purple-400 to-purple-600" },
    { id: 5, title: "Data Analytics", color: "from-red-400 to-red-600" },
    { id: 6, title: "Tech Innovation", color: "from-indigo-400 to-indigo-600" },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Templates</h1>
        <p className="text-muted-foreground mb-6">Choose a template to get started</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${template.color} h-40`}></div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-3">{template.title}</h3>
                <Button className="w-full">Use Template</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
