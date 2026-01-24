import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const applicationSchema = z.object({
    company: z.string().min(1),
    jobTitle: z.string().min(1),
    salary: z.string().optional(),
    status: z.string().default("Interested"),
    link: z.string().url().optional().or(z.literal("")),
    dateApplied: z.string().optional(),
    notes: z.string().optional(),
    followUpDate: z.string().optional(),
    tags: z.string().optional(),
})

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status") || ""

        const where: any = {}

        // Add search filter
        if (search) {
            where.OR = [
                { company: { contains: search, mode: "insensitive" } },
                { jobTitle: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
            ]
        }

        // Add status filter
        if (status) {
            where.status = status
        }

        const applications = await prisma.application.findMany({
            where,
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ applications })
    } catch (error) {
        console.error("Error fetching applications:", error)
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validatedData = applicationSchema.parse(body)

        const application = await prisma.application.create({
            data: {
                ...validatedData,
                dateApplied: validatedData.dateApplied ? new Date(validatedData.dateApplied) : null,
                followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
            },
        })

        return NextResponse.json({ application }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.errors },
                { status: 400 }
            )
        }

        console.error("Error creating application:", error)
        return NextResponse.json(
            { error: "Failed to create application" },
            { status: 500 }
        )
    }
}
