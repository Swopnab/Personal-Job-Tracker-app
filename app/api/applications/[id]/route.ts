import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
    company: z.string().min(1).optional(),
    jobTitle: z.string().min(1).optional(),
    salary: z.string().optional(),
    status: z.string().optional(),
    link: z.string().url().optional().or(z.literal("")),
    dateApplied: z.string().optional().nullable(),
    notes: z.string().optional(),
    followUpDate: z.string().optional().nullable(),
    tags: z.string().optional(),
})

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const application = await prisma.application.findUnique({
            where: { id: params.id },
        })

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ application })
    } catch (error) {
        console.error("Error fetching application:", error)
        return NextResponse.json(
            { error: "Failed to fetch application" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const existingApp = await prisma.application.findUnique({
            where: { id: params.id },
        })

        if (!existingApp) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )
        }

        const body = await req.json()
        const validatedData = updateSchema.parse(body)

        const updateData: any = { ...validatedData }

        if (validatedData.dateApplied !== undefined) {
            updateData.dateApplied = validatedData.dateApplied ? new Date(validatedData.dateApplied) : null
        }

        if (validatedData.followUpDate !== undefined) {
            updateData.followUpDate = validatedData.followUpDate ? new Date(validatedData.followUpDate) : null
        }

        const application = await prisma.application.update({
            where: { id: params.id },
            data: updateData,
        })

        return NextResponse.json({ application })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.errors },
                { status: 400 }
            )
        }

        console.error("Error updating application:", error)
        return NextResponse.json(
            { error: "Failed to update application" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const existingApp = await prisma.application.findUnique({
            where: { id: params.id },
        })

        if (!existingApp) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )
        }

        await prisma.application.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ message: "Application deleted successfully" })
    } catch (error) {
        console.error("Error deleting application:", error)
        return NextResponse.json(
            { error: "Failed to delete application" },
            { status: 500 }
        )
    }
}
