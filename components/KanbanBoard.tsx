"use client"

import { Application } from "@/hooks/useApplications"
import { DndContext, closestCorners, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useState } from "react"
import { STATUS_COLORS } from "@/lib/constants"
import toast from "react-hot-toast"

interface KanbanBoardProps {
    applications: Application[]
    onUpdate: (id: string, data: Partial<Application>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

const KANBAN_COLUMNS = [
    { id: "Interested", title: "Interested", statuses: ["Interested"] },
    { id: "Applied", title: "Applied", statuses: ["Applied"] },
    { id: "Interviewing", title: "Interviewing", statuses: ["Phone Screen", "Technical Interview", "Final Round"] },
    { id: "Offer", title: "Offer", statuses: ["Offer Received", "Accepted"] },
    { id: "Closed", title: "Closed", statuses: ["Rejected", "No Reply", "Ghosted", "Withdrawn"] },
]

function ApplicationCard({ application, onDelete }: { application: Application; onDelete: (id: string) => Promise<void> }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("Delete this application?")) return

        setIsDeleting(true)
        try {
            await onDelete(application.id)
            toast.success("Application deleted")
        } catch (error) {
            toast.error("Failed to delete")
            setIsDeleting(false)
        }
    }

    return (
        <div className={`glass p-4 rounded-lg ${isDeleting ? "opacity-50" : ""} cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-white">{application.company}</h4>
                <button
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <p className="text-sm text-gray-400 mb-3">{application.jobTitle}</p>

            <div className="space-y-2">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[application.status]}`}>
                    {application.status}
                </span>

                {application.salary && (
                    <div className="text-xs text-gray-500">
                        💰 {application.salary}
                    </div>
                )}

                {application.dateApplied && (
                    <div className="text-xs text-gray-500">
                        📅 {new Date(application.dateApplied).toLocaleDateString()}
                    </div>
                )}

                {application.link && (
                    <a
                        href={application.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 block truncate"
                    >
                        🔗 View Job
                    </a>
                )}
            </div>
        </div>
    )
}

export function KanbanBoard({ applications, onUpdate, onDelete }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const appId = active.id as string
        const newColumnId = over.id as string

        const column = KANBAN_COLUMNS.find(col => col.id === newColumnId)
        if (!column) return

        const app = applications.find(a => a.id === appId)
        if (!app) return

        // If dropped in same column and status hasn't changed, don't update
        const currentColumn = KANBAN_COLUMNS.find(col => col.statuses.includes(app.status))
        if (currentColumn?.id === newColumnId) return

        // Use the first status of the new column
        const newStatus = column.statuses[0]

        try {
            await onUpdate(appId, { status: newStatus })
            toast.success(`Moved to ${column.title}`)
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const getColumnApplications = (columnStatuses: string[]) => {
        return applications.filter(app => columnStatuses.includes(app.status))
    }

    const activeApp = applications.find(app => app.id === activeId)

    return (
        <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {KANBAN_COLUMNS.map((column) => {
                    const columnApps = getColumnApplications(column.statuses)

                    return (
                        <div key={column.id} className="flex flex-col min-h-[400px]">
                            <div className="glass rounded-t-xl p-3 mb-2">
                                <h3 className="font-semibold text-white flex items-center justify-between">
                                    <span>{column.title}</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{columnApps.length}</span>
                                </h3>
                            </div>

                            <div
                                className="flex-1 glass rounded-b-xl p-3 space-y-3 min-h-[200px]"
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    e.currentTarget.classList.add('ring-2', 'ring-indigo-500/50')
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('ring-2', 'ring-indigo-500/50')
                                }}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    e.currentTarget.classList.remove('ring-2', 'ring-indigo-500/50')
                                }}
                                data-column-id={column.id}
                            >
                                <SortableContext
                                    items={columnApps.map(app => app.id)}
                                    strategy={verticalListSortingStrategy}
                                    id={column.id}
                                >
                                    {columnApps.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            Drop here
                                        </div>
                                    ) : (
                                        columnApps.map((app) => (
                                            <div
                                                key={app.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.effectAllowed = 'move'
                                                    e.dataTransfer.setData('application/json', JSON.stringify({ id: app.id }))
                                                }}
                                                onDragEnd={(e) => {
                                                    const target = document.elementFromPoint(e.clientX, e.clientY)
                                                    const column = target?.closest('[data-column-id]')
                                                    if (column) {
                                                        const columnId = column.getAttribute('data-column-id')
                                                        if (columnId) {
                                                            const targetColumn = KANBAN_COLUMNS.find(c => c.id === columnId)
                                                            if (targetColumn && !targetColumn.statuses.includes(app.status)) {
                                                                onUpdate(app.id, { status: targetColumn.statuses[0] })
                                                                    .then(() => toast.success(`Moved to ${targetColumn.title}`))
                                                                    .catch(() => toast.error("Failed to update"))
                                                            }
                                                        }
                                                    }
                                                }}
                                            >
                                                <ApplicationCard application={app} onDelete={onDelete} />
                                            </div>
                                        ))
                                    )}
                                </SortableContext>
                            </div>
                        </div>
                    )
                })}
            </div>

            <DragOverlay>
                {activeApp && (
                    <div className="opacity-80">
                        <ApplicationCard application={activeApp} onDelete={onDelete} />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    )
}
