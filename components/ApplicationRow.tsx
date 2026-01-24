"use client"

import { Application } from "@/hooks/useApplications"
import { useState, useRef, useEffect } from "react"
import { STATUS_OPTIONS, STATUS_COLORS, STATUS_ROW_COLORS } from "@/lib/constants"
import toast from "react-hot-toast"

interface EditableCellProps {
    value: any
    type: "text" | "date" | "select" | "url"
    options?: readonly string[]
    onSave: (value: any) => Promise<void>
    placeholder?: string
}

export function EditableCell({
    value,
    type,
    options,
    onSave,
    placeholder,
}: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(value || "")
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            if (type === "text" || type === "url") {
                ; (inputRef.current as HTMLInputElement).select()
            }
        }
    }, [isEditing, type])

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await onSave(editValue || null)
            setIsEditing(false)
        } catch (error) {
            toast.error("Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSave()
        } else if (e.key === "Escape") {
            setEditValue(value || "")
            setIsEditing(false)
        } else if (e.key === "Tab") {
            handleSave()
        }
    }

    if (isEditing) {
        if (type === "select" && options) {
            return (
                <select
                    ref={inputRef as React.RefObject<HTMLSelectElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className="w-full px-2 py-1 bg-white/10 border border-indigo-500 rounded outline-none"
                >
                    {options.map((option) => (
                        <option key={option} value={option} className="bg-gray-900 text-white">
                            {option}
                        </option>
                    ))}
                </select>
            )
        }

        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type === "date" ? "date" : "text"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                placeholder={placeholder}
                className="w-full px-2 py-1 bg-white/10 border border-indigo-500 rounded outline-none"
            />
        )
    }

    const displayValue = type === "date" && value
        ? new Date(value).toLocaleDateString()
        : value || <span className="text-gray-500 italic">{placeholder || "Empty"}</span>

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="w-full px-2 py-1 cursor-pointer hover:bg-white/5 rounded min-h-[32px] flex items-center"
        >
            {type === "select" && value ? (
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[value] || ""}`}>
                    {value}
                </span>
            ) : type === "url" && value ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-indigo-400 hover:text-indigo-300 underline truncate"
                >
                    Link
                </a>
            ) : (
                displayValue
            )}
        </div>
    )
}

interface ApplicationRowProps {
    application: Application
    onUpdate: (id: string, data: Partial<Application>) => Promise<void>
    onDelete: (id: string) => Promise<void>
    isSelected?: boolean
    onToggleSelect?: (id: string) => void
}

export function ApplicationRow({
    application,
    onUpdate,
    onDelete,
    isSelected = false,
    onToggleSelect,
}: ApplicationRowProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this application?")) {
            return
        }

        setIsDeleting(true)
        try {
            await onDelete(application.id)
            toast.success("Application deleted")
        } catch (error) {
            toast.error("Failed to delete application")
            setIsDeleting(false)
        }
    }

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return ""
        return new Date(date).toISOString().split("T")[0]
    }

    const rowColorClass = STATUS_ROW_COLORS[application.status] || "hover:bg-white/5"

    return (
        <tr className={`border-b border-white/5 transition-all ${rowColorClass} ${isDeleting ? "opacity-50" : ""} ${isSelected ? "bg-indigo-500/10 ring-1 ring-indigo-500/30" : ""}`}>
            <td className="p-2">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect?.(application.id)}
                    className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={application.company}
                    type="text"
                    onSave={(value) => onUpdate(application.id, { company: value })}
                    placeholder="Company name"
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={application.jobTitle}
                    type="text"
                    onSave={(value) => onUpdate(application.id, { jobTitle: value })}
                    placeholder="Job title"
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={application.salary || ""}
                    type="text"
                    onSave={(value) => onUpdate(application.id, { salary: value })}
                    placeholder="e.g. 70-85k"
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={application.status}
                    type="select"
                    options={STATUS_OPTIONS}
                    onSave={(value) => onUpdate(application.id, { status: value })}
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={application.link || ""}
                    type="url"
                    onSave={(value) => onUpdate(application.id, { link: value })}
                    placeholder="Job URL"
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={formatDate(application.dateApplied)}
                    type="date"
                    onSave={(value) => onUpdate(application.id, { dateApplied: value })}
                    placeholder="Select date"
                />
            </td>
            <td className="p-0">
                <EditableCell
                    value={application.notes || ""}
                    type="text"
                    onSave={(value) => onUpdate(application.id, { notes: value })}
                    placeholder="Notes"
                />
            </td>
            <td className="p-2">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                    title="Delete"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>
    )
}
