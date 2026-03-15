"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChartRenderer } from "@/components/visualizations/chart-renderer"
import { TableRenderer } from "@/components/visualizations/table-renderer"
import { VoiceControls } from "@/components/voice/voice-controls"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  visualizations?: any[]
  tables?: any[]
  confidence?: number
  sources?: string[]
}

interface ChatInterfaceProps {
  conversationId?: number
  fileId?: number
}

export function ChatInterface({ conversationId, fileId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI Agent assistant. Upload a file and ask me questions about it. I can analyze data, create visualizations, and provide insights. You can type your questions or use voice input!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [speakResponseFunction, setSpeakResponseFunction] = useState<((text: string) => void) | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!messageText) setInput("") // Only clear input if not from voice
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
          fileId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message.content,
          timestamp: new Date(data.message.timestamp).toLocaleTimeString(),
          visualizations: data.message.visualizations,
          tables: data.message.tables,
          confidence: data.message.confidence,
          sources: data.message.sources,
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Show success toast if high confidence
        if (data.message.confidence > 0.8) {
          toast({
            title: "High confidence response",
            description: "The AI is confident about this analysis.",
          })
        }
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    // Send the voice transcript as a message
    handleSendMessage(transcript)
  }

  const handleSpeakResponse = (speakFunction: (text: string) => void) => {
    setSpeakResponseFunction(() => speakFunction)
  }

  const speakMessage = (text: string) => {
    if (speakResponseFunction) {
      speakResponseFunction(text)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch {
      return timestamp
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div className={`max-w-[80%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                <Card className={`p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{message.content}</p>

                      {/* Added voice playback button for assistant messages */}
                      {message.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                          onClick={() => speakMessage(message.content)}
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {/* Confidence and Sources */}
                    {message.role === "assistant" && (message.confidence || message.sources) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                        {message.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(message.confidence * 100)}% confident
                          </Badge>
                        )}
                        {message.sources && message.sources.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Source: {message.sources.join(", ")}
                          </Badge>
                        )}
                      </div>
                    )}

                    <p
                      className={`text-xs opacity-70 ${
                        message.role === "user" ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </Card>

                {/* Visualizations */}
                {message.visualizations && message.visualizations.length > 0 && (
                  <div className="space-y-2">
                    {message.visualizations.map((viz, index) => (
                      <ChartRenderer key={index} visualization={viz} />
                    ))}
                  </div>
                )}

                {/* Tables */}
                {message.tables && message.tables.length > 0 && (
                  <div className="space-y-2">
                    {message.tables.map((table, index) => (
                      <TableRenderer key={index} table={table} />
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <Card className="bg-card p-4">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is analyzing...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Added voice controls above the text input */}
        <div className="max-w-4xl mx-auto">
          <VoiceControls
            onTranscript={handleVoiceTranscript}
            onSpeakResponse={handleSpeakResponse}
            disabled={isLoading}
          />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  fileId
                    ? "Ask me anything about your uploaded file... (or use voice input above)"
                    : "Upload a file first, then ask me questions about it..."
                }
                className="min-h-[60px] max-h-32 resize-none"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="nvidia-gradient hover:opacity-90 transition-opacity h-[60px] px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line • Use voice input for hands-free interaction
          </p>
        </div>
      </div>
    </div>
  )
}
