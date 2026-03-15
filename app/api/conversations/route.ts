import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = 1 // Default user for now

    const conversations = db.getConversationsByUser(userId)

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      fileId: conv.file_id,
      updatedAt: new Date(conv.updated_at).toLocaleString(),
      messageCount: JSON.parse(conv.history_json).length,
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, fileId } = await request.json()
    const userId = 1 // Default user for now

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const conversation = db.createConversation(userId, title.trim(), fileId)

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        fileId: conversation.file_id,
        createdAt: conversation.created_at,
      },
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
