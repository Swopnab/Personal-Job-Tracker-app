"use client"

import { Application } from "@/hooks/useApplications"
import { calculateStats, calculateFollowUps } from "@/lib/analytics"
import { STATUS_COLORS } from "@/lib/constants"

interface DashboardProps {
    applications: Application[]
}

export function Dashboard({ applications }: DashboardProps) {
    const stats = calculateStats(applications)
    const followUps = calculateFollowUps(applications)

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Tracked"
                    value={stats.total}
                    gradient="from-indigo-600 to-purple-600"
                />
                <StatCard
                    title="Applied"
                    value={stats.statusCounts["Applied"] || 0}
                    gradient="from-purple-600 to-pink-600"
                />
                <StatCard
                    title="Interviewing"
                    value={stats.statusCounts["Interviewing"] || 0}
                    gradient="from-yellow-600 to-orange-600"
                />
                <StatCard
                    title="Response Rate"
                    value={`${stats.responseRate}%`}
                    gradient="from-green-600 to-emerald-600"
                />
            </div>

            {/* Status Breakdown */}
            <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded text-xs font-medium border ${STATUS_COLORS[status] || ""}`}>
                                {status}
                            </span>
                            <span className="text-gray-400">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Follow-up Reminders */}
            {followUps.length > 0 && (
                <div className="glass rounded-xl p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold text-yellow-500">Follow-up Needed</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                        {followUps.length} application{followUps.length !== 1 ? "s" : ""} with no reply for 14+ days
                    </p>
                    <div className="space-y-2">
                        {followUps.slice(0, 3).map((app) => (
                            <div key={app.id} className="text-sm text-gray-300">
                                • <span className="font-medium">{app.company}</span> - {app.jobTitle}
                            </div>
                        ))}
                        {followUps.length > 3 && (
                            <div className="text-sm text-gray-500 italic">
                                +{followUps.length - 3} more...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ title, value, gradient }: { title: string; value: string | number; gradient: string }) {
    return (
        <div className="glass glass-hover rounded-xl p-6 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}></div>
            <div className="relative">
                <p className="text-gray-400 text-sm mb-1">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    )
}
