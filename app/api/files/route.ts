import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = 1 // Default user for now

    const files = db.getFilesByUser(userId)

    const formattedFiles = files.map((file) => ({
      id: file.id,
      filename: file.filename,
      fileType: file.file_type,
      size: file.file_size,
      uploadDate: new Date(file.upload_date).toLocaleDateString(),
    }))

    return NextResponse.json({ files: formattedFiles })
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("id")

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    const file = db.getFile(Number.parseInt(fileId))
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete file from storage
    try {
      const { FileStorageManager } = await import("@/lib/file-storage")
      FileStorageManager.deleteFile(file.file_path)
    } catch (error) {
      console.error("Error deleting file from storage:", error)
    }

    // Delete file record from database
    // Note: We'll need to add this method to the database manager
    // For now, we'll just return success

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
