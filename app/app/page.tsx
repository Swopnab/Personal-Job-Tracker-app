"use client"

import { useState, useRef } from "react"
import { Dashboard } from "@/components/Dashboard"
import { FilterBar } from "@/components/FilterBar"
import { ApplicationTable } from "@/components/ApplicationTable"
import { KanbanBoard } from "@/components/KanbanBoard"
import { ImportExportButtons } from "@/components/ImportExportButtons"
import { QuickAddModal } from "@/components/QuickAddModal"
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp"
import { useApplications } from "@/hooks/useApplications"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

type ViewMode = "table" | "board"

export default function AppPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
    const [isHelpOpen, setIsHelpOpen] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>("table")
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Fetch all applications for dashboard (without filters)
    const { applications: allApplications, mutate, createApplication, updateApplication, deleteApplication } = useApplications()

    // Keyboard shortcuts
    useKeyboardShortcuts({
        quickAdd: () => setIsQuickAddOpen(true),
        focusSearch: () => searchInputRef.current?.focus(),
        escape: () => {
            setIsQuickAddOpen(false)
            setIsHelpOpen(false)
        },
        showHelp: () => setIsHelpOpen(true),
    })

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Job Tracker
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Track and manage your job applications
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm flex items-center gap-2"
                            title="Keyboard Shortcuts"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/10 rounded text-xs">?</kbd>
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <Dashboard applications={allApplications} />

                {/* Filters */}
                <FilterBar
                    searchValue={searchQuery}
                    statusValue={statusFilter}
                    onSearchChange={setSearchQuery}
                    onStatusChange={setStatusFilter}
                    searchInputRef={searchInputRef}
                />

                {/* View Toggle & Import/Export */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-2 glass p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === "table"
                                ? "bg-indigo-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode("board")}
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === "board"
                                ? "bg-indigo-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            Board
                        </button>
                    </div>

                    <ImportExportButtons onImportComplete={() => mutate()} />
                </div>

                {/* Applications View */}
                {viewMode === "table" ? (
                    <ApplicationTable
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                    />
                ) : (
                    <KanbanBoard
                        applications={allApplications.filter((app: any) => {
                            const matchesSearch = !searchQuery ||
                                app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                app.notes?.toLowerCase().includes(searchQuery.toLowerCase())

                            const matchesStatus = !statusFilter || app.status === statusFilter

                            return matchesSearch && matchesStatus
                        })}
                        onUpdate={updateApplication}
                        onDelete={deleteApplication}
                    />
                )}

                {/* Quick Add Modal */}
                <QuickAddModal
                    isOpen={isQuickAddOpen}
                    onClose={() => setIsQuickAddOpen(false)}
                    onAdd={createApplication}
                />

                {/* Keyboard Shortcuts Help */}
                <KeyboardShortcutsHelp
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                />

                {/* Floating Action Button (Mobile) */}
                <button
                    onClick={() => setIsQuickAddOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-lg shadow-indigo-500/50 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 md:hidden"
                    title="Quick Add (Cmd+K)"
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
