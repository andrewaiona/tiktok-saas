import { Check, Circle, Loader2 } from 'lucide-react';

interface WorkflowTimelineProps {
    status: {
        scanned: boolean;
        filtered: boolean;
        commented: boolean;
        boosted: boolean; // We might not have data for this yet, but we'll include it structurally
    };
    counts: {
        total: number;
        analyzed: number;
        commented: number;
    }
}

export default function WorkflowTimeline({ status, counts }: WorkflowTimelineProps) {
    const steps = [
        { id: 1, name: 'Scan', isCompleted: status.scanned, isActive: !status.scanned, description: `${counts.total} Videos Found` },
        { id: 2, name: 'Relevancy Filter', isCompleted: status.filtered, isActive: status.scanned && !status.filtered, description: `${counts.analyzed}/${counts.total} Analyzed` },
        { id: 3, name: 'Comment', isCompleted: status.commented, isActive: status.filtered && !status.commented, description: `${counts.commented} Posted` },
        { id: 4, name: 'Boost Comment', isCompleted: status.boosted, isActive: status.commented && !status.boosted, description: 'Manual Action' },
    ];

    return (
        <div className="w-full">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 -z-10 rounded-full"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-violet-600 transition-all duration-500 rounded-full -z-10"
                    style={{
                        width: `${(steps.findIndex(s => s.isActive) / (steps.length - 1)) * 100}%`
                    }}
                ></div>

                {steps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center gap-2 relative bg-[var(--background)] px-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.isCompleted
                                    ? 'bg-violet-600 border-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]'
                                    : step.isActive
                                        ? 'bg-zinc-900 border-violet-500 text-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.3)] animate-pulse'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                                }`}
                        >
                            {step.isCompleted ? (
                                <Check size={20} strokeWidth={3} />
                            ) : step.isActive ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <span className="font-bold text-sm">{step.id}</span>
                            )}
                        </div>

                        <div className="text-center absolute top-12 w-32">
                            <p className={`font-bold text-sm transition-colors ${step.isActive || step.isCompleted ? 'text-zinc-100' : 'text-zinc-600'
                                }`}>
                                {step.name}
                            </p>
                            {step.isCompleted || step.isActive ? (
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mt-1">
                                    {step.description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
            {/* Spacer for the text labels below */}
            <div className="h-16"></div>
        </div>
    );
}
