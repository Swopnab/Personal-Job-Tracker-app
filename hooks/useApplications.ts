import useSWR from "swr"

export interface Application {
    id: string
    company: string
    jobTitle: string
    salary?: string | null
    status: string
    link?: string | null
    dateApplied?: Date | string | null
    notes?: string | null
    followUpDate?: Date | string | null
    tags?: string | null
    createdAt: Date | string
    updatedAt: Date | string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useApplications(search?: string, status?: string) {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (status) params.append("status", status)

    const queryString = params.toString()
    const url = `/api/applications${queryString ? `?${queryString}` : ""}`

    const { data, error, mutate, isLoading } = useSWR(url, fetcher)

    const createApplication = async (appData: Partial<Application>) => {
        const response = await fetch("/api/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appData),
        })

        if (!response.ok) {
            throw new Error("Failed to create application")
        }

        const result = await response.json()
        mutate()
        return result.application
    }

    const updateApplication = async (id: string, appData: Partial<Application>) => {
        // Optimistic update
        const applications = data?.applications || []
        const optimisticData = {
            applications: applications.map((app: Application) =>
                app.id === id ? { ...app, ...appData } : app
            ),
        }

        mutate(optimisticData, false)

        const response = await fetch(`/api/applications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appData),
        })

        if (!response.ok) {
            mutate() // Revalidate on error
            throw new Error("Failed to update application")
        }

        const result = await response.json()
        mutate()
        return result.application
    }

    const deleteApplication = async (id: string) => {
        // Optimistic update
        const applications = data?.applications || []
        const optimisticData = {
            applications: applications.filter((app: Application) => app.id !== id),
        }

        mutate(optimisticData, false)

        const response = await fetch(`/api/applications/${id}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            mutate() // Revalidate on error
            throw new Error("Failed to delete application")
        }

        mutate()
    }

    return {
        applications: data?.applications || [],
        isLoading,
        error,
        createApplication,
        updateApplication,
        deleteApplication,
        mutate,
    }
}
