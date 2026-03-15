import { type NextRequest, NextResponse } from "next/server"
import { aiAgent } from "@/lib/ai-agents"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, fileId } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get conversation history if conversationId is provided
    let conversationHistory: any[] = []
    if (conversationId) {
      const conversation = db.getConversation(conversationId)
      if (conversation) {
        conversationHistory = JSON.parse(conversation.history_json)
      }
    }

    // Process the query with AI Agent
    const agentResponse = await aiAgent.processQuery(message, fileId, conversationHistory)

    // Create response message
    const assistantMessage = {
      role: "assistant",
      content: agentResponse.content,
      timestamp: new Date().toISOString(),
      visualizations: agentResponse.visualizations,
      tables: agentResponse.tables,
      confidence: agentResponse.confidence,
      sources: agentResponse.sources,
    }

    // Update conversation history if conversationId exists
    if (conversationId) {
      const userMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      }

      const updatedHistory = [...conversationHistory, userMessage, assistantMessage]
      db.updateConversationHistory(conversationId, updatedHistory)
    }

    return NextResponse.json({
      message: assistantMessage,
      conversationId,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
