"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Download, Eye, Loader2 } from "lucide-react"
import { getGeminiService } from "@/lib/gemini-service"
import { PresentationData } from "@/lib/gemini-service"
import { SlidePreview } from "@/components/slide-preview"
import { Templates } from "@/components/views/templates"

export function AiSlide() {
  const [input, setInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState("")

  const templates = [
    {
      id: 1,
      title: "Artificial Intelligence",
      image: "/placeholder.jpg",
      color: "from-green-400 to-green-600",
      prompt: "Create a comprehensive presentation about Artificial Intelligence covering its history, current applications, and future prospects"
    },
    {
      id: 2,
      title: "Business Strategy",
      image: "/placeholder.jpg",
      color: "from-yellow-400 to-yellow-600",
      prompt: "Generate a business strategy presentation covering market analysis, competitive landscape, and strategic recommendations"
    },
    {
      id: 3,
      title: "Market Opportunity",
      image: "/market-opportunity.jpg",
      color: "from-blue-400 to-blue-600",
      prompt: "Create a presentation analyzing market opportunities, trends, and potential for growth in emerging markets"
    },
    {
      id: 4,
      title: "E-Commerce Guide",
      image: "/amazon-ecommerce.jpg",
      color: "from-purple-400 to-purple-600",
      prompt: "Develop a comprehensive e-commerce guide covering best practices, strategies, and success factors"
    },
    {
      id: 5,
      title: "Data Analytics",
      image: "/placeholder.jpg",
      color: "from-red-400 to-red-600",
      prompt: "Create a presentation about data analytics, including methodologies, tools, and real-world applications"
    },
    {
      id: 6,
      title: "Tech Innovation",
      image: "/placeholder.jpg",
      color: "from-indigo-400 to-indigo-600",
      prompt: "Generate a presentation on technological innovation, covering emerging technologies and their impact on society"
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStep("Initializing AI...")
    
    try {
      // Simulate progress steps
      const progressSteps = [
        { step: "Analyzing your request...", progress: 20 },
        { step: "Generating content structure...", progress: 40 },
        { step: "Creating slide content...", progress: 60 },
        { step: "Optimizing presentation...", progress: 80 },
        { step: "Finalizing presentation...", progress: 100 }
      ]

      // Simulate streaming progress
      for (const { step, progress } of progressSteps) {
        setGenerationStep(step)
        setGenerationProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      const geminiService = getGeminiService()
      const presentationData = await geminiService.generatePresentationContent(input)
      setPresentationData(presentationData)
      setInput("")
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error generating presentation:', error)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
      setGenerationStep("")
    }
  }

  const handleTemplateClick = (templateId: number) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null)
      setInput("")
    } else {
      setSelectedTemplate(templateId)
      const template = templates.find(t => t.id === templateId)
      if (template) {
        setInput(template.prompt)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      {presentationData ? (
        <div className="flex-1 flex gap-4 p-4">
          <div className="flex-1">
            <SlidePreview 
              presentationData={presentationData}
              onRegeneratePresentation={() => {
                setPresentationData(null)
                setSelectedTemplate(null)
                setInput("")
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-8">
        {/* Input Section */}
        <div className="max-w-4xl mx-auto w-full mb-12">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gradient-to-r from-card to-card/80 border border-border/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Start with a topic, we'll turn it into slides!"
                className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-lg font-medium focus:placeholder-transparent transition-all duration-200"
              />

              {/* Input Toolbar */}
              <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">

                {/* Template Preview and Send Button */}
                <div className="flex items-center gap-3">
                  {selectedTemplate && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 px-4 py-2 rounded-xl shadow-sm">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white text-sm flex items-center justify-center font-bold shadow-md">
                        {selectedTemplate}
                      </div>
                      <span className="text-sm text-green-700 font-medium">Template selected</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(null)
                          setInput("")
                        }}
                        className="text-sm text-green-600 hover:text-green-800 ml-2 p-1 rounded-full hover:bg-green-100 transition-colors"
                        title="Clear template"
                      >
                        ✕
                      </button>
                    </div>
                  )}
          <Button
            type="submit"
            disabled={!input.trim() || isGenerating}
            size="icon"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-900">{generationStep}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` } as React.CSSProperties}
              ></div>
            </div>
            <div className="text-xs text-blue-700 mt-2 text-center">
              {generationProgress}% Complete
            </div>
          </div>
        )}

        {/* Templates Section */}
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Templates</h2>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`group relative overflow-hidden rounded-xl transition-all hover:shadow-lg cursor-pointer ${
                  selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleTemplateClick(template.id)}
              >
                <div className="aspect-video bg-card border border-border overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{template.title}</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between w-full">
                    <p className="text-white text-xs font-medium line-clamp-2">{template.title}</p>
                    <div
                      className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTemplateClick(template.id)
                      }}
                    >
                      Use Template
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
