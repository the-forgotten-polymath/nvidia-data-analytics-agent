import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { FileStorageManager } from "@/lib/file-storage"

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB
const ALLOWED_TYPES = ["log", "csv", "xlsx", "txt"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const userId = 1 // Default user for now - will be dynamic with auth

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadResults = []

    for (const file of files) {
      // Validate file type
      const fileExtension = FileStorageManager.getFileExtension(file.name)
      if (!ALLOWED_TYPES.includes(fileExtension)) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: `Unsupported file type: ${fileExtension}`,
        })
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: "File size exceeds 200MB limit",
        })
        continue
      }

      try {
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Save file to storage
        const filePath = FileStorageManager.saveFile(userId, file.name, buffer)

        // Save file metadata to database
        const fileRecord = db.saveFileRecord({
          user_id: userId,
          filename: file.name,
          file_path: filePath,
          file_type: fileExtension as "log" | "csv" | "xlsx" | "txt",
          file_size: file.size,
        })

        uploadResults.push({
          id: fileRecord.id,
          filename: file.name,
          fileType: fileExtension,
          size: file.size,
          success: true,
        })
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error)
        uploadResults.push({
          filename: file.name,
          success: false,
          error: "Failed to save file",
        })
      }
    }

    return NextResponse.json({ results: uploadResults })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
