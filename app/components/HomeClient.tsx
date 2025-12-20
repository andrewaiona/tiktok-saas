'use client';

import { useState } from 'react';
import Dashboard from './Dashboard';
import Sidebar from './Sidebar';
import BrandProfileTab from './BrandProfileTab';
import ManualTab from './ManualTab';

type Tab = 'workflow' | 'brand' | 'manual';

export default function HomeClient({ targets, videos, brandSettings }: {
    targets: any[],
    videos: any[],
    brandSettings: any
}) {
    const [activeTab, setActiveTab] = useState<Tab>('workflow');

    const renderContent = () => {
        switch (activeTab) {
            case 'workflow':
                return <Dashboard initialTargets={targets} initialVideos={videos} />;
            case 'brand':
                return <BrandProfileTab brandSettings={brandSettings} />;
            case 'manual':
                return <ManualTab />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'workflow' && <Dashboard initialTargets={targets} initialVideos={videos} />}
                {activeTab === 'brand' && <BrandProfileTab brandSettings={brandSettings} />}
                {activeTab === 'manual' && <ManualTab />}
            </div>
        </div>
    );
}
