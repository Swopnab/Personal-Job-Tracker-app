"use client"

import { useState, useRef } from "react"
import toast from "react-hot-toast"

interface ImportExportButtonsProps {
    onImportComplete: () => void
}

export function ImportExportButtons({ onImportComplete }: ImportExportButtonsProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch("/api/applications/export")

            if (!response.ok) {
                throw new Error("Export failed")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `job-applications-${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Applications exported successfully!")
        } catch (error) {
            toast.error("Failed to export applications")
        } finally {
            setIsExporting(false)
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/applications/import", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(`Imported ${data.imported} applications!`)
                if (data.errors) {
                    toast.error(`${data.errors.length} errors occurred`, { duration: 5000 })
                }
                onImportComplete()
            } else {
                toast.error(data.error || "Failed to import")
            }
        } catch (error) {
            toast.error("Failed to import applications")
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    return (
        <div className="flex gap-3">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
            />

            <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 transition-all"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
            </button>

            <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 transition-all"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{isImporting ? "Importing..." : "Import CSV"}</span>
            </button>
        </div>
    )
}
