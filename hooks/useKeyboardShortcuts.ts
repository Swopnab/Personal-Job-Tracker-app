"use client"

import { useEffect, useCallback } from "react"

export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    options: {
        ctrl?: boolean
        meta?: boolean
        shift?: boolean
        alt?: boolean
    } = {}
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            const { ctrl = false, meta = false, shift = false, alt = false } = options

            const metaKey = event.metaKey || event.ctrlKey // Cmd on Mac, Ctrl on Windows

            if (
                event.key.toLowerCase() === key.toLowerCase() &&
                (ctrl ? event.ctrlKey : true) &&
                (meta ? metaKey : !metaKey || meta === false) &&
                (shift ? event.shiftKey : true) &&
                (alt ? event.altKey : true)
            ) {
                event.preventDefault()
                callback()
            }
        },
        [key, callback, options]
    )

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])
}

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
            const modifier = isMac ? event.metaKey : event.ctrlKey

            // Cmd/Ctrl + K
            if (modifier && event.key === "k") {
                event.preventDefault()
                shortcuts.quickAdd?.()
            }

            // Cmd/Ctrl + F
            if (modifier && event.key === "f") {
                event.preventDefault()
                shortcuts.focusSearch?.()
            }

            // Delete key (when row is focused)
            if (event.key === "Delete" && !isEditingInput()) {
                shortcuts.deleteSelected?.()
            }

            // ? for help
            if (event.key === "?" && !isEditingInput()) {
                event.preventDefault()
                shortcuts.showHelp?.()
            }

            // Escape
            if (event.key === "Escape") {
                shortcuts.escape?.()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [shortcuts])
}

function isEditingInput() {
    const activeElement = document.activeElement
    return (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.getAttribute("contenteditable") === "true"
    )
}
