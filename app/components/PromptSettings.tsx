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

export default function PromptSettings({ workflowType = 'general', onClose }: { workflowType?: string, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState(workflowType);
    const [relevancyPrompt, setRelevancyPrompt] = useState('');
    const [commentPrompt, setCommentPrompt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const result = await getWorkflowSettings(activeTab);
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
    }, [activeTab]);

    const handleSave = async () => {
        setSaving(true);
        await updateWorkflowSettings(activeTab, relevancyPrompt, commentPrompt);
        setSaving(false);
        // Don't close, maybe show success toast? Or just stays open to edit others.
        // Let's just flash saved state or similar, or close if user expects it. 
        // User probably wants to save and maybe switch tabs. Let's not close.
        // Actually, for simplicity let's close or add a "Saved" indicator. 
        // I'll close for now to mimic previous behavior, but optimal UX might differ. 
        // Wait, if I have tabs, saving shouldn't close the whole modal usually.
        // I'll just keep it open and maybe show a brief "Saved!" on the button text?
        // For now I'll adhere to previous behavior of onClose() BUT since we have tabs, user might want to edit multiple.
        // I will make Save ONLY save the current one.
        // For best UX in "One Workflow" ethos, maybe "Save & Close"?
        alert('Settings saved!');
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset to default prompts?')) {
            setRelevancyPrompt(DEFAULT_RELEVANCY_PROMPT);
            setCommentPrompt(DEFAULT_COMMENT_PROMPT);
        }
    };

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'competitor', label: 'Competitor' },
        { id: 'brand', label: 'Brand' },
    ];

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Settings2 className="text-[#00BC1F]" />
                            <h2 className="text-xl font-bold text-zinc-900">AI Prompts</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex p-1 bg-zinc-100 rounded-xl w-fit">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-zinc-500 mt-3">Customize AI behavior for the <strong>{activeTab}</strong> workflow tag.</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-[#00BC1F]" size={32} />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Relevancy Analysis Prompt</label>
                                <p className="text-xs text-zinc-500">Variables: {'{{BRAND_CONTEXT}}'}, {'{{VIDEO_DESCRIPTION}}'}</p>
                                <textarea
                                    value={relevancyPrompt}
                                    onChange={(e) => setRelevancyPrompt(e.target.value)}
                                    className="w-full h-48 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#00BC1F]/50 font-mono resize-none leading-relaxed shadow-inner"
                                    placeholder="Enter custom prompt..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Comment Generation Prompt</label>
                                <p className="text-xs text-zinc-500">Variables: {'{{BRAND_CONTEXT}}'}, {'{{VIDEO_DESCRIPTION}}'}, {'{{PERSONA}}'}</p>
                                <textarea
                                    value={commentPrompt}
                                    onChange={(e) => setCommentPrompt(e.target.value)}
                                    className="w-full h-48 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#00BC1F]/50 font-mono resize-none leading-relaxed shadow-inner"
                                    placeholder="Enter custom prompt..."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-200 flex items-center justify-between bg-zinc-50/50 rounded-b-2xl">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors text-sm"
                    >
                        <RefreshCcw size={16} /> Reset
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors font-medium text-sm"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-[#00BC1F] hover:bg-[#009b19] text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 shadow-sm"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save {activeTab} Prompts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
