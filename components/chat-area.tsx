"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Presentation, BarChart3, Code2, Search, Copy, Check } from "lucide-react"
import { getGeminiService } from "@/lib/gemini-service"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
}

export function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set())
  const [chatHistory, setChatHistory] = useState<{id: string, title: string, messages: Message[], timestamp: number}[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message on component mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: "Hello! How can I help you today?"
        }
      ])
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      const geminiService = getGeminiService()
      const response = await geminiService.generateChatResponse(currentInput)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response,
      }
        
        setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating response:', error)
      
      let errorContent = "I'm sorry, I encountered an error while processing your request."
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('Quota exceeded') || error.message.includes('429')) {
          errorContent = `**Quota Exceeded:** You've reached the daily limit for the free Gemini API tier.

**Current Status:**
• Free tier allows 50 requests per day
• You've used all your daily quota
• Quota resets in 24 hours

**Solutions:**
1. **Wait 24 hours** - Your quota will reset automatically
2. **Upgrade to paid plan** - Visit https://ai.google.dev/pricing for unlimited requests
3. **Use a different API key** - Create a new Google account for additional free quota

The AI chat will work perfectly once your quota resets!`
        } else if (error.message.includes('API key')) {
          errorContent = `**Setup Required:** ${error.message}

To fix this:
1. Get your free Gemini API key from: https://makersuite.google.com/app/apikey
2. Create a \`.env.local\` file in your project root
3. Add: \`NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here\`
4. Restart the development server

Once configured, the AI chat will work perfectly!`
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: errorContent,
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      "ask-magicslides": "Help me understand ",
      visualize: "Explain and visualize ",
      "write-code": "Generate code for ",
      "search-info": "Search and compile information about ",
    }
    setInput(prompts[action] || "")
  }

  const handleNewChat = () => {
    // Save current chat to history if it has more than just the welcome message
    if (messages.length > 1) {
      const chatTitle = messages.find(m => m.type === "user")?.content?.substring(0, 50) || "New Chat"
      const newChat = {
        id: currentChatId || Date.now().toString(),
        title: chatTitle,
        messages: messages,
        timestamp: Date.now()
      }
      setChatHistory(prev => [newChat, ...prev])
    }
    
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "Hello! How can I help you today?"
      }
    ])
    setInput("")
    setCopiedMessages(new Set())
    setCurrentChatId(null)
  }

  const handleLoadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId)
    if (chat) {
      setMessages(chat.messages)
      setCurrentChatId(chatId)
      setShowHistory(false)
    }
  }

  const handleDeleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(c => c.id !== chatId))
    if (currentChatId === chatId) {
      handleNewChat()
    }
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessages(prev => new Set(prev).add(messageId))
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(messageId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-border flex items-center justify-end">

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowHistory(!showHistory)} 
            variant="outline" 
            className="flex items-center gap-2 text-sm bg-transparent"
          >
            <span>📋</span>
            History
          </Button>
        <Button onClick={handleNewChat} variant="outline" className="flex items-center gap-2 text-sm bg-transparent">
          <span>+</span>
          New Chat
        </Button>
      </div>
      </div>

      {/* Chat History Panel */}
      {showHistory && (
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3">Chat History</h3>
            {chatHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No previous chats found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentChatId === chat.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-card border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleLoadChat(chat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {chat.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(chat.timestamp).toLocaleDateString()} • {chat.messages.length} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChat(chat.id)
                        }}
                        className="text-muted-foreground hover:text-destructive ml-2"
                        title="Delete chat"
                        suppressHydrationWarning
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h3 className="text-3xl font-bold text-foreground mb-2">Hi there!</h3>
            <p className="text-muted-foreground mb-8">How can I help you today?</p>

            {/* Input Area for Empty State */}
            <form onSubmit={handleSendMessage} className="w-full max-w-2xl">
              <div className="mb-6">
                <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-4 py-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
                    suppressHydrationWarning
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="bg-muted hover:bg-muted/80 text-foreground"
                  >
                    <Send size={18} />
                  </Button>
                </div>

              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickAction("ask-magicslides")}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition-colors"
                  suppressHydrationWarning
                >
                  <Presentation size={16} />
                  Ask AI
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction("visualize")}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition-colors"
                  suppressHydrationWarning
                >
                  <BarChart3 size={16} />
                  Explain
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction("write-code")}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition-colors"
                  suppressHydrationWarning
                >
                  <Code2 size={16} />
                  Write code
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction("search-info")}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm text-foreground transition-colors"
                  suppressHydrationWarning
                >
                  <Search size={16} />
                  Search info
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-6 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.type === "user" ? (
                  <div className="max-w-2xl px-4 py-3 rounded-lg bg-primary text-primary-foreground">
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : (
                  <div className="max-w-4xl w-full">
                    {/* AI Response with enhanced formatting */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          AI
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-600">AI Assistant</div>
                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Copy message"
                              suppressHydrationWarning
                            >
                              {copiedMessages.has(message.id) ? (
                                <>
                                  <Check size={14} />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-sm text-gray-900 leading-relaxed">
                            {message.content.split('\n').map((line, index) => {
                              // Handle thinking states
                              if (line.includes('Thinking...') || line.includes('**Thinking**')) {
                                return (
                                  <div key={index} className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-purple-600 font-semibold">Thinking...</span>
                                      <span className="text-purple-800 font-bold">
                                        {line.replace(/.*?Thinking\.\.\.\s*(.*)/, '$1').replace(/\*\*Thinking\*\*\s*(.*)/, '$1')}
                                      </span>
                                    </div>
                                    <div className="text-gray-700 text-sm leading-relaxed">
                                      {message.content.split('\n').slice(index + 1, index + 3).join('\n')}
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Handle search actions
                              if (line.includes('Searching') || line.includes('Reading')) {
                                return (
                                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{line}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {message.content.split('\n')[index + 1] || ''}
                                        </div>
                                      </div>
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Handle bold text (**text**)
                              if (line.includes('**')) {
                                const parts = line.split(/(\*\*.*?\*\*)/);
                                return (
                                  <div key={index} className="mb-3">
                                    {parts.map((part, partIndex) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                        const boldText = part.slice(2, -2);
                                        return (
                                          <strong key={partIndex} className="font-semibold text-gray-900">
                                            {boldText}
                                          </strong>
                                        );
                                      }
                                      return <span key={partIndex} className="text-gray-700">{part}</span>;
                                    })}
                                  </div>
                                );
                              }
                              
                              // Handle bullet points
                              if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                                return (
                                  <div key={index} className="flex items-start mb-2">
                                    <span className="text-blue-500 mr-3 mt-1 text-lg">•</span>
                                    <span className="flex-1 text-gray-700">{line.trim().substring(1).trim()}</span>
                                  </div>
                                );
                              }
                              
                              // Handle numbered lists
                              if (/^\d+\./.test(line.trim())) {
                                return (
                                  <div key={index} className="flex items-start mb-2">
                                    <span className="text-blue-500 mr-3 mt-1 font-semibold text-sm">
                                      {line.trim().match(/^\d+/)?.[0]}.
                                    </span>
                                    <span className="flex-1 text-gray-700">{line.trim().replace(/^\d+\.\s*/, '')}</span>
                                  </div>
                                );
                              }
                              
                              // Regular paragraphs
                              if (line.trim()) {
                                return (
                                  <div key={index} className="mb-3 text-gray-700 leading-relaxed">
                                    {line}
                                  </div>
                                );
                              }
                              
                              return <div key={index} className="mb-2"></div>;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="max-w-4xl w-full">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">AI Assistant</div>
                        <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          </div>
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Input Area for Chat */}
            <form onSubmit={handleSendMessage} className="mt-6">
              <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-4 py-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
                  suppressHydrationWarning
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-muted hover:bg-muted/80 text-foreground"
                >
                  <Send size={18} />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
