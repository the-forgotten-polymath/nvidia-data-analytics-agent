"use client"

import { useState, useEffect } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { Sidebar } from "@/components/sidebar"
import { FileUploadArea } from "@/components/file-upload-area"
import type { ChatMessage } from "@/lib/database"

export default function HomePage() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const [showFileUpload, setShowFileUpload] = useState(true)

  // Load conversation history when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationHistory(activeConversationId)
      setShowFileUpload(false)
    }
  }, [activeConversationId])

  const loadConversationHistory = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const conversation = await response.json()
        const history = JSON.parse(conversation.history_json || "[]")
        setConversationHistory(history)
      }
    } catch (error) {
      console.error("Error loading conversation history:", error)
      setConversationHistory([])
    }
  }

  const handleConversationSelect = (id: number) => {
    setActiveConversationId(id)
  }

  const handleNewConversation = () => {
    setConversationHistory([])
    setShowFileUpload(true)
  }

  const handleFileUploaded = () => {
    setShowFileUpload(false)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for conversations and file management */}
      <Sidebar
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* File upload area - show when no active conversation or new conversation */}
        {showFileUpload && <FileUploadArea onFileUploaded={handleFileUploaded} />}

        {/* Chat interface */}
        <ChatInterface
          conversationId={activeConversationId}
          initialMessages={conversationHistory}
          onMessagesUpdate={setConversationHistory}
        />
      </div>
    </div>
  )
}
