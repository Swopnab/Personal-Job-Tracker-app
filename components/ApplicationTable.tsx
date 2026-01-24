"use client"

import { useApplications } from "@/hooks/useApplications"
import { ApplicationRow } from "./ApplicationRow"
import { useState } from "react"
import toast from "react-hot-toast"

interface ApplicationTableProps {
    searchQuery: string
    statusFilter: string
}

export function ApplicationTable({ searchQuery, statusFilter }: ApplicationTableProps) {
    const { applications, isLoading, createApplication, updateApplication, deleteApplication } =
        useApplications(searchQuery, statusFilter)
    const [isAdding, setIsAdding] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const handleAddRow = async () => {
        setIsAdding(true)
        try {
            await createApplication({
                company: "New Company",
                jobTitle: "Position",
                status: "Interested",
            })
            toast.success("Application added")
        } catch (error) {
            toast.error("Failed to add application")
        } finally {
            setIsAdding(false)
        }
    }

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedIds.size === applications.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(applications.map((app: any) => app.id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return

        if (!confirm(`Delete ${selectedIds.size} application(s)?`)) return

        try {
            await Promise.all(
                Array.from(selectedIds).map((id) => deleteApplication(id))
            )
            toast.success(`Deleted ${selectedIds.size} application(s)`)
            setSelectedIds(new Set())
        } catch (error) {
            toast.error("Failed to delete applications")
        }
    }

    const handleBulkStatusUpdate = async (status: string) => {
        if (selectedIds.size === 0) return

        try {
            await Promise.all(
                Array.from(selectedIds).map((id) => updateApplication(id, { status }))
            )
            toast.success(`Updated ${selectedIds.size} application(s)`)
            setSelectedIds(new Set())
        } catch (error) {
            toast.error("Failed to update applications")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-gray-400">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading applications...</span>
                </div>
            </div>
        )
    }

    if (applications.length === 0 && !searchQuery && !statusFilter) {
        return (
            <div className="glass rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Start Tracking Your Applications</h3>
                        <p className="text-gray-400">
                            Add your first job application to get started. You can track company, job title, status, and more!
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleAddRow}
                            disabled={isAdding}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Your First Application</span>
                        </button>

                        <p className="text-sm text-gray-500">
                            Or press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Cmd/Ctrl + K</kbd> to quick-add
                        </p>
                    </div>

                    <div className="pt-6 border-t border-white/10 text-left space-y-2">
                        <p className="text-sm font-semibold text-gray-300">Quick Tips:</p>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• Click any cell to edit inline</li>
                            <li>• Use Tab to navigate between fields</li>
                            <li>• Track interview dates and follow-ups</li>
                            <li>• Export to CSV anytime</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="glass rounded-lg p-4 flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-2">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkStatusUpdate(e.target.value)
                                    e.target.value = ""
                                }
                            }}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        >
                            <option value="">Change Status...</option>
                            <option value="Applied">Applied</option>
                            <option value="Phone Screen">Phone Screen</option>
                            <option value="Technical Interview">Technical Interview</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Offer Received">Offer Received</option>
                        </select>
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors border border-red-500/30"
                        >
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors border border-white/10"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto glass rounded-xl">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="p-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={applications.length > 0 && selectedIds.size === applications.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                            </th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Company</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Job Title</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Salary</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Status</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Link</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Date Applied</th>
                            <th className="text-left p-3 text-sm font-semibold text-gray-300">Notes</th>
                            <th className="p-3 text-sm font-semibold text-gray-300 w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-12 text-gray-500">
                                    No applications found. Try adjusting your filters.
                                </td>
                            </tr>
                        ) : (
                            applications.map((app: any) => (
                                <ApplicationRow
                                    key={app.id}
                                    application={app}
                                    onUpdate={updateApplication}
                                    onDelete={deleteApplication}
                                    isSelected={selectedIds.has(app.id)}
                                    onToggleSelect={handleToggleSelect}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <button
                onClick={handleAddRow}
                disabled={isAdding}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Application</span>
            </button>
        </div>
    )
}
