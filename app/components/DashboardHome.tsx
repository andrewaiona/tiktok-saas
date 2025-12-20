import { Users, Video, MessageCircle, Activity } from 'lucide-react';
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
                <div className="grid grid-cols-1 gap-4">
                    {workflowStats.map((workflow) => {
                        let status = 'Inactive';
                        let statusColor = 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';

                        if (workflow.targets > 0) {
                            status = 'Active';
                            statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                        }

                        return (
                            <div key={workflow.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${workflow.bg}`}>
                                        <Activity size={20} className={workflow.color} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-zinc-200">{workflow.label}</h3>
                                        <p className="text-xs text-zinc-500">{workflow.targets} targets monitoring</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                    {status}
                                </div>
                            </div>
                        );
                    })}
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
