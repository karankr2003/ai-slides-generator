"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Edit, Eye, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react'
import { PresentationData, SlideContent, getGeminiService } from '@/lib/gemini-service'
import { getPowerPointService } from '@/lib/ppt-service'

interface SlidePreviewProps {
  presentationData: PresentationData | null
  onEditSlide?: (slideIndex: number) => void
  onRegeneratePresentation?: () => void
}

export function SlidePreview({ 
  presentationData, 
  onEditSlide, 
  onRegeneratePresentation 
}: SlidePreviewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [editedSlides, setEditedSlides] = useState<SlideContent[]>([])
  const [editPrompt, setEditPrompt] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  if (!presentationData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Presentation Generated
          </h3>
          <p className="text-sm text-muted-foreground">
            Start a conversation to generate your presentation
          </p>
        </div>
      </div>
    )
  }

  // Initialize edited slides when presentation data changes
  React.useEffect(() => {
    if (presentationData) {
      setEditedSlides([...presentationData.slides])
    }
  }, [presentationData])

  const currentSlide = editedSlides.length > 0 ? editedSlides[currentSlideIndex] : presentationData.slides[currentSlideIndex]
  const totalSlides = presentationData.slides.length


  const handleEdit = async () => {
    if (!editPrompt.trim() || !presentationData) return

    setIsEditing(true)
    try {
      const geminiService = getGeminiService()
      const updatedPresentation = await geminiService.editPresentationContent(
        {
          ...presentationData,
          slides: editedSlides.length > 0 ? editedSlides : presentationData.slides,
        },
        editPrompt
      )
      setEditedSlides(updatedPresentation.slides)
      setEditPrompt("")
    } catch (error) {
      console.error('Error editing presentation:', error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDownload = async (format: 'pptx' | 'pdf' = 'pptx') => {
    setIsDownloading(true)
    try {
      const pptService = getPowerPointService()
      // Use edited slides if available, otherwise use original
      const presentationToDownload = editedSlides.length > 0 ? {
        ...presentationData,
        slides: editedSlides
      } : presentationData
      await pptService.downloadPresentation(presentationToDownload, format)
    } catch (error) {
      console.error('Error downloading presentation:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreviousSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => Math.min(totalSlides - 1, prev + 1))
  }

  const renderSlideContent = (slide: SlideContent) => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="text-center space-y-6">
            <input
              type="text"
              value={slide.title}
              onChange={(e) => {
                const updatedSlide = { ...slide, title: e.target.value }
                setEditedSlides(prev => {
                  const newSlides = [...prev]
                  newSlides[currentSlideIndex] = updatedSlide
                  return newSlides
                })
              }}
              className="text-3xl font-bold text-foreground leading-tight max-w-3xl mx-auto bg-transparent border-none outline-none text-center w-full"
              placeholder="Enter slide title..."
            />
            {slide.content && (
              <textarea
                value={slide.content}
                onChange={(e) => {
                  const updatedSlide = { ...slide, content: e.target.value }
                  setEditedSlides(prev => {
                    const newSlides = [...prev]
                    newSlides[currentSlideIndex] = updatedSlide
                    return newSlides
                  })
                }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed bg-transparent border-none outline-none text-center w-full resize-none"
                placeholder="Enter slide subtitle..."
                rows={3}
              />
            )}
          </div>
        )
      
      case 'content':
        return (
          <div className="space-y-4 h-full flex flex-col">
            <input
              type="text"
              value={slide.title}
              onChange={(e) => {
                const updatedSlide = { ...slide, title: e.target.value }
                setEditedSlides(prev => {
                  const newSlides = [...prev]
                  newSlides[currentSlideIndex] = updatedSlide
                  return newSlides
                })
              }}
              className="text-2xl font-bold text-foreground text-center leading-tight bg-transparent border-none outline-none w-full"
              placeholder="Enter slide title..."
            />
            <textarea
              value={slide.content}
              onChange={(e) => {
                const updatedSlide = { ...slide, content: e.target.value }
                setEditedSlides(prev => {
                  const newSlides = [...prev]
                  newSlides[currentSlideIndex] = updatedSlide
                  return newSlides
                })
              }}
              className="text-base text-foreground max-w-3xl mx-auto flex-1 bg-transparent border-none outline-none resize-none w-full"
              placeholder="Enter slide content (use • for bullet points)..."
              rows={8}
            />
          </div>
        )
      
      case 'image':
        return (
          <div className="space-y-4 h-full flex flex-col">
            <input
              type="text"
              value={slide.title}
              onChange={(e) => {
                const updatedSlide = { ...slide, title: e.target.value }
                setEditedSlides(prev => {
                  const newSlides = [...prev]
                  newSlides[currentSlideIndex] = updatedSlide
                  return newSlides
                })
              }}
              className="text-2xl font-bold text-foreground text-center leading-tight bg-transparent border-none outline-none w-full"
              placeholder="Enter slide title..."
            />
            <div className="flex flex-col items-center space-y-4 flex-1">
              <div className="w-full max-w-md h-48 bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center shadow-md">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-primary/60 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Image Placeholder</p>
                  <p className="text-xs text-muted-foreground mt-1">Visual content will appear here</p>
                </div>
              </div>
              <textarea
                value={slide.content}
                onChange={(e) => {
                  const updatedSlide = { ...slide, content: e.target.value }
                  setEditedSlides(prev => {
                    const newSlides = [...prev]
                    newSlides[currentSlideIndex] = updatedSlide
                    return newSlides
                  })
                }}
                className="text-base text-foreground text-center max-w-2xl leading-relaxed bg-transparent border-none outline-none resize-none w-full"
                placeholder="Enter image description..."
                rows={3}
              />
            </div>
          </div>
        )
      
      case 'chart':
        return (
          <div className="space-y-4 h-full flex flex-col">
            <input
              type="text"
              value={slide.title}
              onChange={(e) => {
                const updatedSlide = { ...slide, title: e.target.value }
                setEditedSlides(prev => {
                  const newSlides = [...prev]
                  newSlides[currentSlideIndex] = updatedSlide
                  return newSlides
                })
              }}
              className="text-2xl font-bold text-foreground text-center leading-tight bg-transparent border-none outline-none w-full"
              placeholder="Enter slide title..."
            />
            <div className="flex flex-col items-center space-y-4 flex-1">
              <div className="w-full max-w-lg h-48 bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center shadow-md">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded"></div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Chart Placeholder</p>
                  <p className="text-xs text-muted-foreground mt-1">Data visualization will appear here</p>
                </div>
              </div>
              <textarea
                value={slide.content}
                onChange={(e) => {
                  const updatedSlide = { ...slide, content: e.target.value }
                  setEditedSlides(prev => {
                    const newSlides = [...prev]
                    newSlides[currentSlideIndex] = updatedSlide
                    return newSlides
                  })
                }}
                className="text-base text-foreground text-center max-w-2xl leading-relaxed bg-transparent border-none outline-none resize-none w-full"
                placeholder="Enter chart description..."
                rows={3}
              />
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-foreground text-center leading-tight">
              {slide.title}
            </h2>
            <p className="text-base text-foreground text-center max-w-3xl mx-auto leading-relaxed flex-1 flex items-center">
              {slide.content}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            {presentationData.title}
            {editedSlides.length > 0 && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Edited
              </span>
            )}
          </h2>
          <span className="text-sm text-muted-foreground">
            {totalSlides} slides
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegeneratePresentation}
            className="flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Generate new</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('pptx')}
              disabled={isDownloading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'PPTX'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousSlide}
          disabled={currentSlideIndex === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {currentSlideIndex + 1} of {totalSlides}
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              title={`Go to slide ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlideIndex 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextSlide}
          disabled={currentSlideIndex === totalSlides - 1}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Edit Controls */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Enter a prompt to edit the slides..."
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
          />
          <Button onClick={handleEdit} disabled={isEditing || !editPrompt.trim()}>
            {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
            <span className="ml-2">Edit</span>
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 p-4 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-4xl aspect-video p-6 flex items-center justify-center shadow-2xl border-2 border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="w-full h-full flex items-center justify-center">
            {renderSlideContent(currentSlide)}
          </div>
        </Card>
      </div>

      {/* Slide Thumbnails */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex space-x-2 overflow-x-auto">
          {presentationData.slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              title={`Go to slide ${index + 1}`}
              className={`flex-shrink-0 w-20 h-12 rounded border-2 transition-colors ${
                index === currentSlideIndex
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
              }`}
            >
              <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}