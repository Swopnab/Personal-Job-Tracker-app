import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const applications = await prisma.application.findMany({
            orderBy: { createdAt: "desc" },
        })

        // Convert to CSV
        const headers = [
            "Company",
            "Job Title",
            "Salary",
            "Status",
            "Link",
            "Date Applied",
            "Notes",
            "Tags",
        ]

        const rows = applications.map((app: any) => [
            app.company,
            app.jobTitle,
            app.salary || "",
            app.status,
            app.link || "",
            app.dateApplied ? new Date(app.dateApplied).toISOString().split("T")[0] : "",
            app.notes || "",
            app.tags || "",
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n")

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="job-applications-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        })
    } catch (error) {
        console.error("Error exporting applications:", error)
        return NextResponse.json(
            { error: "Failed to export applications" },
            { status: 500 }
        )
    }
}
