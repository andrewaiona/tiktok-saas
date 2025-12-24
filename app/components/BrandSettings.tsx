'use client';

import { useState, useTransition } from 'react';
import { updateBrandSettings, fetchUGCAccounts } from '../actions';
import { Save, Loader2, Sparkles } from 'lucide-react';

type BrandSettingsData = {
    productName: string;
    productDescription: string;
    targetAudience: string;
    persona: string;
    ugcAccountId?: string;
};

export default function BrandSettings({ initialSettings }: { initialSettings: BrandSettingsData | null }) {
    const [settings, setSettings] = useState<BrandSettingsData>(
        initialSettings || {
            productName: '',
            productDescription: '',
            targetAudience: '',
            persona: 'Professional',
            ugcAccountId: 'acc_placeholder_get_real_id_from_ugc_inc',
        }
    );
    const [isPending, startTransition] = useTransition();
    const [accounts, setAccounts] = useState<Array<{ id: string; username: string | null; nick_name: string | null; type: string }>>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        const result = await fetchUGCAccounts();
        setLoadingAccounts(false);

        if (result.success && result.accounts) {
            setAccounts(result.accounts);
        } else {
            alert(result.error || 'Failed to load accounts');
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateBrandSettings(settings);
            if (res.success) {
                alert('Brand settings saved!');
            } else {
                alert('Failed to save settings');
            }
        });
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <Sparkles className="text-[#00BC1F]" /> Brand AI Profile
            </h2>
            <p className="text-zinc-500 text-sm">
                Configure your brand details so the AI can identify relevant videos.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Product / App Name</label>
                    <input
                        type="text"
                        value={settings.productName}
                        onChange={(e) => setSettings({ ...settings, productName: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                        placeholder="e.g. TikTok SaaS Tool"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Product Description</label>
                    <textarea
                        value={settings.productDescription}
                        onChange={(e) => setSettings({ ...settings, productDescription: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 min-h-[80px] shadow-sm"
                        placeholder="What does your product do? Key features?"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Target Audience</label>
                    <input
                        type="text"
                        value={settings.targetAudience}
                        onChange={(e) => setSettings({ ...settings, targetAudience: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                        placeholder="e.g. Indie hackers, marketers"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Persona</label>
                    <select
                        value={settings.persona}
                        onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                    >
                        <option value="Professional">Professional</option>
                        <option value="Casual">Casual</option>
                        <option value="Edgy">Edgy</option>
                        <option value="Friendly">Friendly</option>
                    </select>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-zinc-500">UGC Account (Optional)</label>
                        <button
                            type="button"
                            onClick={loadAccounts}
                            disabled={loadingAccounts}
                            className="text-xs text-[#00BC1F] hover:text-[#009b19] flex items-center gap-1 disabled:opacity-50"
                        >
                            {loadingAccounts ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" /> Loading...
                                </>
                            ) : (
                                <>Refresh Accounts</>
                            )}
                        </button>
                    </div>

                    {accounts.length > 0 ? (
                        <select
                            value={settings.ugcAccountId || ''}
                            onChange={(e) => setSettings({ ...settings, ugcAccountId: e.target.value })}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                        >
                            <option value="">Select an account...</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.username || account.nick_name || account.id} ({account.type})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={settings.ugcAccountId || ''}
                            onChange={(e) => setSettings({ ...settings, ugcAccountId: e.target.value })}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                            placeholder="Click 'Refresh Accounts' to load"
                        />
                    )}
                    <p className="text-xs text-zinc-500 mt-1">
                        {accounts.length > 0
                            ? 'Select a TikTok account to post comments from'
                            : 'Click "Refresh Accounts" to load your UGC accounts'}
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full bg-[#00BC1F] hover:bg-[#009b19] text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
                >
                    {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Profile
                </button>
            </div>
        </div>
    );
}
