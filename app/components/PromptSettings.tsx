import { useState, useEffect } from 'react';
import { Settings2, X, Save, RefreshCcw, Loader2 } from 'lucide-react';
import { getWorkflowSettings, updateWorkflowSettings } from '../actions';

interface PromptSettingsProps {
    workflowType: string;
    onClose: () => void;
}

const DEFAULT_RELEVANCY_PROMPT = `You are a marketing expert. Analyze this TikTok video based on the following brand context:

BRAND CONTEXT:
{{BRAND_CONTEXT}}

VIDEO INFORMATION:
Description: "{{VIDEO_DESCRIPTION}}"

Determine if this video is relevant for the brand to engage with (e.g., commenting, collaborating).

Return a JSON object with:
- isRelevant: boolean
- relevanceScore: number (0-100)
- reasoning: string (brief explanation)`;

const DEFAULT_COMMENT_PROMPT = `You are a social media engagement expert. Write a TikTok comment that:

1. Feels GENUINE and ORGANIC (not spammy)
2. Relates naturally to the video content
3. Subtly promotes the product WITHOUT being pushy
4. Matches the brand persona: {{PERSONA}}
5. Is short (1-2 sentences max)
6. Uses casual language, emojis where appropriate

VIDEO DESCRIPTION:
"{{VIDEO_DESCRIPTION}}"

BRAND TO PROMOTE:
{{BRAND_CONTEXT}}

Write ONLY the comment text, nothing else. Make it conversational and authentic.`;

export default function PromptSettings({ workflowType, onClose }: PromptSettingsProps) {
    const [relevancyPrompt, setRelevancyPrompt] = useState('');
    const [commentPrompt, setCommentPrompt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const result = await getWorkflowSettings(workflowType);
            if (result.success && result.settings) {
                setRelevancyPrompt(result.settings.relevancyPrompt);
                setCommentPrompt(result.settings.commentPrompt);
            } else {
                // If no settings exist yet, load defaults
                setRelevancyPrompt(DEFAULT_RELEVANCY_PROMPT);
                setCommentPrompt(DEFAULT_COMMENT_PROMPT);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [workflowType]);

    const handleSave = async () => {
        setSaving(true);
        await updateWorkflowSettings(workflowType, relevancyPrompt, commentPrompt);
        setSaving(false);
        onClose();
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset to default prompts?')) {
            setRelevancyPrompt(DEFAULT_RELEVANCY_PROMPT);
            setCommentPrompt(DEFAULT_COMMENT_PROMPT);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                            <Settings2 className="text-violet-500" />
                            {workflowType.charAt(0).toUpperCase() + workflowType.slice(1)} Prompts
                        </h2>
                        <p className="text-sm text-zinc-400">Customize AI behavior for this workflow.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-violet-500" size={32} />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Relevancy Analysis Prompt</label>
                                <p className="text-xs text-zinc-500">Variables: {'{{BRAND_CONTEXT}}'}, {'{{VIDEO_DESCRIPTION}}'}</p>
                                <textarea
                                    value={relevancyPrompt}
                                    onChange={(e) => setRelevancyPrompt(e.target.value)}
                                    className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono resize-none leading-relaxed"
                                    placeholder="Enter custom prompt..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Comment Generation Prompt</label>
                                <p className="text-xs text-zinc-500">Variables: {'{{BRAND_CONTEXT}}'}, {'{{VIDEO_DESCRIPTION}}'}, {'{{PERSONA}}'}</p>
                                <textarea
                                    value={commentPrompt}
                                    onChange={(e) => setCommentPrompt(e.target.value)}
                                    className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono resize-none leading-relaxed"
                                    placeholder="Enter custom prompt..."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/30 rounded-b-2xl">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
                    >
                        <RefreshCcw size={16} /> Reset Defaults
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-zinc-900 rounded-lg text-zinc-300 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
