import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const text = await file.text()
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
            return NextResponse.json(
                { error: "CSV file is empty or invalid" },
                { status: 400 }
            )
        }

        // Skip header row
        const dataLines = lines.slice(1)

        const imported = []
        const errors = []

        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i]
            const values = parseCSVLine(line)

            if (values.length < 2) {
                errors.push(`Line ${i + 2}: Invalid format`)
                continue
            }

            try {
                const application = await prisma.application.create({
                    data: {
                        company: values[0] || "Unknown",
                        jobTitle: values[1] || "Unknown",
                        salary: values[2] || null,
                        status: values[3] || "Interested",
                        link: values[4] || null,
                        dateApplied: values[5] ? new Date(values[5]) : null,
                        notes: values[6] || null,
                        tags: values[7] || null,
                    },
                })
                imported.push(application)
            } catch (error) {
                errors.push(`Line ${i + 2}: Failed to import`)
            }
        }

        return NextResponse.json({
            success: true,
            imported: imported.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error) {
        console.error("Error importing applications:", error)
        return NextResponse.json(
            { error: "Failed to import applications" },
            { status: 500 }
        )
    }
}

function parseCSVLine(line: string): string[] {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === "," && !inQuotes) {
            result.push(current.trim())
            current = ""
        } else {
            current += char
        }
    }

    result.push(current.trim())
    return result
}
