import { Application } from "@/hooks/useApplications"

export function calculateFollowUps(applications: Application[]) {
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    return applications.filter((app) => {
        if (app.status !== "Applied" && app.status !== "No reply") {
            return false
        }

        const appDate = app.dateApplied ? new Date(app.dateApplied) : null
        if (!appDate) return false

        return appDate < fourteenDaysAgo
    })
}

export function calculateStats(applications: Application[]) {
    const total = applications.length
    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const applied = statusCounts["Applied"] || 0
    const noReply = statusCounts["No reply"] || 0
    const ghosted = statusCounts["Ghosted"] || 0
    const rejected = statusCounts["Rejected"] || 0
    const interviewing = statusCounts["Interviewing"] || 0
    const offer = statusCounts["Offer"] || 0

    const totalResponded = interviewing + offer + rejected
    const totalSent = applied + noReply + ghosted + rejected + interviewing + offer
    const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0

    return {
        total,
        statusCounts,
        responseRate,
    }
}
