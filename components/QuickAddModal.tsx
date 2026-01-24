"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { Application } from "@/hooks/useApplications"

interface QuickAddModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (data: Partial<Application>) => Promise<void>
}

export function QuickAddModal({ isOpen, onClose, onAdd }: QuickAddModalProps) {
    const [company, setCompany] = useState("")
    const [jobTitle, setJobTitle] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!company.trim() || !jobTitle.trim()) {
            toast.error("Company and Job Title are required")
            return
        }

        setIsSubmitting(true)
        try {
            await onAdd({
                company: company.trim(),
                jobTitle: jobTitle.trim(),
                status: "Interested",
            })
            toast.success("Application added!")
            setCompany("")
            setJobTitle("")
            onClose()
        } catch (error) {
            toast.error("Failed to add application")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="glass rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Quick Add Application
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                            Company *
                        </label>
                        <input
                            id="company"
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            autoFocus
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                            placeholder="e.g. Google, Microsoft"
                        />
                    </div>

                    <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-2">
                            Job Title *
                        </label>
                        <input
                            id="jobTitle"
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                            placeholder="e.g. Software Engineering Intern"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/50"
                        >
                            {isSubmitting ? "Adding..." : "Add Application"}
                        </button>
                    </div>
                </form>

                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 text-center">
                        Press <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> to close •{" "}
                        <kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd> to submit
                    </p>
                </div>
            </div>
        </div>
    )
}
