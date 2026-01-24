"use client"

export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null

    const shortcuts = [
        { keys: ["Cmd", "K"], description: "Quick add application" },
        { keys: ["Cmd", "F"], description: "Focus search" },
        { keys: ["Tab"], description: "Navigate to next cell" },
        { keys: ["Shift", "Tab"], description: "Navigate to previous cell" },
        { keys: ["Enter"], description: "Edit selected cell" },
        { keys: ["Esc"], description: "Cancel edit / Close modal" },
        { keys: ["Delete"], description: "Delete selected application(s)" },
        { keys: ["?"], description: "Show this help" },
    ]

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="glass rounded-2xl p-6 max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Keyboard Shortcuts
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

                <div className="space-y-3">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="text-gray-300">{shortcut.description}</span>
                            <div className="flex gap-1">
                                {shortcut.keys.map((key, i) => (
                                    <kbd
                                        key={i}
                                        className="px-3 py-1 bg-white/10 rounded text-sm font-mono border border-white/20"
                                    >
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 text-center">
                        Press <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> or click outside to close
                    </p>
                </div>
            </div>
        </div>
    )
}
