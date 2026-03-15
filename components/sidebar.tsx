"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Plus, MessageSquare, FileText, Settings, Trash2, Edit2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Conversation {
  id: number
  title: string
  updated_at: string
  file_id?: number
  filename?: string
  file_type?: string
}

interface FileRecord {
  id: number
  filename: string
  file_type: string
  upload_date: string
}

interface SidebarProps {
  activeConversationId: number | null
  onConversationSelect: (id: number) => void
  onNewConversation: () => void
}

export function Sidebar({ activeConversationId, onConversationSelect, onNewConversation }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadConversations()
    loadFiles()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error("Error loading files:", error)
    }
  }

  const handleNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      })

      if (response.ok) {
        const newConv = await response.json()
        setConversations([newConv, ...conversations])
        onConversationSelect(newConv.id)
        onNewConversation()
        toast({
          title: "Success",
          description: "New conversation created",
        })
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== id))
        if (activeConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id)
          if (remaining.length > 0) {
            onConversationSelect(remaining[0].id)
          }
        }
        toast({
          title: "Success",
          description: "Conversation deleted",
        })
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      })
    }
  }

  const handleEditTitle = (id: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleSaveTitle = async (id: number) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      })

      if (response.ok) {
        setConversations(conversations.map((c) => (c.id === id ? { ...c, title: editTitle } : c)))
        setEditingId(null)
        toast({
          title: "Success",
          description: "Conversation renamed",
        })
      }
    } catch (error) {
      console.error("Error updating conversation:", error)
      toast({
        title: "Error",
        description: "Failed to rename conversation",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">AI Agent</h1>
        </div>

        <Button
          onClick={handleNewConversation}
          className="w-full nvidia-gradient hover:opacity-90 transition-opacity"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Conversations Section */}
          <div>
            <h2 className="text-sm font-medium text-sidebar-foreground mb-3">Recent Conversations</h2>
            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-sidebar-foreground/60">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-sidebar-foreground/60">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-sidebar-accent group ${
                      activeConversationId === conv.id ? "bg-sidebar-accent nvidia-border" : ""
                    }`}
                    onClick={() => onConversationSelect(conv.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingId === conv.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-6 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveTitle(conv.id)
                                if (e.key === "Escape") handleCancelEdit()
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveTitle(conv.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-sidebar-foreground truncate">{conv.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-sidebar-foreground/60">{formatDate(conv.updated_at)}</p>
                              {conv.filename && (
                                <>
                                  <span className="text-xs text-sidebar-foreground/40">•</span>
                                  <p className="text-xs text-primary">{conv.filename}</p>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {editingId !== conv.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-primary"
                            onClick={(e) => handleEditTitle(conv.id, conv.title, e)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-destructive"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Files Section */}
          <div>
            <h2 className="text-sm font-medium text-sidebar-foreground mb-3">Uploaded Files</h2>
            <div className="space-y-2">
              {files.length === 0 ? (
                <div className="text-sm text-sidebar-foreground/60">No files uploaded yet</div>
              ) : (
                files.map((file) => (
                  <Card key={file.id} className="p-3 hover:bg-sidebar-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">{file.filename}</p>
                        <p className="text-xs text-sidebar-foreground/60">
                          {file.file_type.toUpperCase()} • {formatDate(file.upload_date)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}
