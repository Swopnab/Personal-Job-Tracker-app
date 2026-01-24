"use client"

import { STATUS_OPTIONS } from "@/lib/constants"
import { useState } from "react"

interface FilterBarProps {
    onSearchChange: (search: string) => void
    onStatusChange: (status: string) => void
    searchValue: string
    statusValue: string
    searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export function FilterBar({
    onSearchChange,
    onStatusChange,
    searchValue,
    statusValue,
    searchInputRef,
}: FilterBarProps) {
    const [search, setSearch] = useState(searchValue)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        onSearchChange(e.target.value)
    }

    const clearFilters = () => {
        setSearch("")
        onSearchChange("")
        onStatusChange("")
    }

    const hasFilters = search || statusValue

    return (
        <div className="glass rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search company, job title, or notes..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                        <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                <div className="flex gap-3">
                    <select
                        value={statusValue}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    >
                        <option value="" className="bg-gray-900">All Statuses</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status} className="bg-gray-900">
                                {status}
                            </option>
                        ))}
                    </select>

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-sm"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
