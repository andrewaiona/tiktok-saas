'use client';

import BrandSettings from './BrandSettings';

type BrandSettingsData = {
    productName: string;
    productDescription: string;
    targetAudience: string;
    persona: string;
    ugcAccountId?: string;
} | null;

export default function BrandProfileTab({ brandSettings }: { brandSettings: BrandSettingsData }) {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Brand Profile</h2>
            <p className="text-zinc-500 mb-8">
                Configure your brand details for AI-powered comment generation and relevance analysis.
            </p>

            <BrandSettings initialSettings={brandSettings} />
        </div>
    );
}
