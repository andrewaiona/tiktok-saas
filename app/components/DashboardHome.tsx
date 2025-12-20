import { Users, Video, MessageCircle, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface DashboardHomeProps {
    targets: any[];
    videos: any[];
}

export default function DashboardHome({ targets, videos }: DashboardHomeProps) {
    // Calculate global stats
    const stats = useMemo(() => {
        const totalTargets = targets.length;
        const totalVideos = videos.length;
        const relevantVideos = videos.filter(v => v.isRelevant).length;
        const commentsGenerated = videos.filter(v => v.generatedComment).length;
        const commentsPosted = videos.filter(v => v.commentPosted).length;

        // Calculate recent activity (last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newVideos24h = videos.filter(v => new Date(v.scrapedAt) > oneDayAgo).length;

        return {
            totalTargets,
            totalVideos,
            relevantVideos,
            commentsGenerated,
            commentsPosted,
            newVideos24h
        };
    }, [targets, videos]);

    // Calculate per-workflow stats
    const workflowStats = useMemo(() => {
        const workflows = {
            general: { label: 'General Relevant', targets: 0, videos: 0, relevant: 0, pending: 0, posted: 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            competitor: { label: 'Competitor Accounts', targets: 0, videos: 0, relevant: 0, pending: 0, posted: 0, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            brand: { label: 'Brand Accounts', targets: 0, videos: 0, relevant: 0, pending: 0, posted: 0, color: 'text-pink-400', bg: 'bg-pink-500/10' }
        };

        // Map targets to workflows
        const targetWorkflowMap = new Map();
        targets.forEach(t => {
            if (workflows[t.workflowType as keyof typeof workflows]) {
                workflows[t.workflowType as keyof typeof workflows].targets++;
                targetWorkflowMap.set(t.value, t.workflowType);
            }
        });

        // Map videos to workflows
        videos.forEach(v => {
            const type = targetWorkflowMap.get(v.sourceValue) || 'general'; // Default to general if unknown
            if (workflows[type as keyof typeof workflows]) {
                const w = workflows[type as keyof typeof workflows];
                w.videos++;
                if (v.isRelevant) {
                    w.relevant++;
                    if (v.commentPosted) {
                        w.posted++;
                    } else {
                        w.pending++;
                    }
                }
            }
        });

        return Object.entries(workflows).map(([key, data]) => ({ id: key, ...data }));
    }, [targets, videos]);

    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
                <p className="text-zinc-400">Overview of your TikTok monitoring and engagement.</p>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Targets"
                    value={stats.totalTargets}
                    icon={Users}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    title="Videos Scraped"
                    value={stats.totalVideos}
                    subValue={`+${stats.newVideos24h} today`}
                    icon={Video}
                    color="text-violet-400"
                    bg="bg-violet-500/10"
                />
                <StatCard
                    title="Relevant Found"
                    value={stats.relevantVideos}
                    icon={Activity}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                />
                <StatCard
                    title="Comments Posted"
                    value={stats.commentsPosted}
                    subValue={`${stats.commentsGenerated} generated`}
                    icon={MessageCircle}
                    color="text-pink-400"
                    bg="bg-pink-500/10"
                />
            </div>

            {/* Workflow Status Breakdown */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-100">Workflow Status</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {workflowStats.map((workflow) => (
                        <div key={workflow.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-zinc-200">{workflow.label}</h3>
                                <div className={`p-2 rounded-lg ${workflow.bg}`}>
                                    <Activity size={18} className={workflow.color} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Active Targets</span>
                                    <span className="font-medium text-zinc-200">{workflow.targets}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Relevant Videos</span>
                                    <span className="font-medium text-zinc-200">{workflow.relevant}</span>
                                </div>

                                {/* Status Indicator */}
                                <div className="pt-4 border-t border-zinc-800">
                                    {workflow.pending > 0 ? (
                                        <div className="flex items-center gap-2 text-amber-400">
                                            <AlertCircle size={16} />
                                            <span className="text-sm font-medium">{workflow.pending} comments pending</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <CheckCircle2 size={16} />
                                            <span className="text-sm font-medium">All caught up</span>
                                        </div>
                                    )}
                                </div>

                                {/* Mini Progress Bar for Posted/Relevant */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>Completion</span>
                                        <span>{workflow.relevant > 0 ? Math.round((workflow.posted / workflow.relevant) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${workflow.id === 'general' ? 'bg-blue-500' : workflow.id === 'competitor' ? 'bg-violet-500' : 'bg-pink-500'}`}
                                            style={{ width: `${workflow.relevant > 0 ? (workflow.posted / workflow.relevant) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subValue, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-400">{title}</p>
                    <h3 className="text-3xl font-bold text-zinc-100 mt-2">{value}</h3>
                    {subValue && <p className="text-xs text-zinc-500 mt-1">{subValue}</p>}
                </div>
                <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={color} size={24} />
                </div>
            </div>
        </div>
    );
}
