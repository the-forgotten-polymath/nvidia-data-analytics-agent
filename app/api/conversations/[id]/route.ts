import { type NextRequest, NextResponse } from "next/server"
import { DatabaseManager } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = DatabaseManager.getInstance()
    const conversationId = Number.parseInt(params.id)

    const conversation = await db.getConversation(conversationId)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = DatabaseManager.getInstance()
    const conversationId = Number.parseInt(params.id)
    const { title } = await request.json()

    await db.updateConversation(conversationId, { title })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = DatabaseManager.getInstance()
    const conversationId = Number.parseInt(params.id)

    await db.deleteConversation(conversationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}
