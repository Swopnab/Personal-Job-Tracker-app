export const STATUS_OPTIONS = [
    "Interested",
    "Applied",
    "Phone Screen",
    "Technical Interview",
    "Final Round",
    "Offer Received",
    "Accepted",
    "Rejected",
    "No Reply",
    "Ghosted",
    "Withdrawn",
] as const

export type StatusType = typeof STATUS_OPTIONS[number]

export const STATUS_COLORS: Record<string, string> = {
    "Interested": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Applied": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "Phone Screen": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    "Technical Interview": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    "Final Round": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "Offer Received": "bg-green-500/20 text-green-300 border-green-500/30",
    "Accepted": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "Rejected": "bg-red-500/20 text-red-300 border-red-500/30",
    "No Reply": "bg-gray-500/20 text-gray-300 border-gray-500/30",
    "Ghosted": "bg-gray-600/20 text-gray-400 border-gray-600/30",
    "Withdrawn": "bg-slate-500/20 text-slate-300 border-slate-500/30",
}

export const STATUS_ROW_COLORS: Record<string, string> = {
    "Interested": "hover:bg-blue-500/5",
    "Applied": "hover:bg-purple-500/5",
    "Phone Screen": "hover:bg-cyan-500/5 bg-cyan-500/5",
    "Technical Interview": "hover:bg-yellow-500/5 bg-yellow-500/5",
    "Final Round": "hover:bg-orange-500/5 bg-orange-500/5",
    "Offer Received": "hover:bg-green-500/5 bg-green-500/10",
    "Accepted": "hover:bg-emerald-500/5 bg-emerald-500/10",
    "Rejected": "hover:bg-red-500/5",
    "No Reply": "hover:bg-gray-500/5",
    "Ghosted": "hover:bg-gray-600/5",
    "Withdrawn": "hover:bg-slate-500/5",
}
