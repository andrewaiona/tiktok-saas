'use client';

import { useState } from 'react';
import Dashboard from './Dashboard';
import DashboardHome from './DashboardHome';
import Sidebar from './Sidebar';
import BrandProfileTab from './BrandProfileTab';
import ManualTab from './ManualTab';

type Tab = 'dashboard' | 'workflow' | 'brand' | 'manual';

export default function HomeClient({ targets, videos, brandSettings }: {
    targets: any[],
    videos: any[],
    brandSettings: any
}) {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    return (
        <div className="flex h-screen overflow-hidden bg-[#F3F4EF] text-zinc-900">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'dashboard' && <DashboardHome targets={targets} videos={videos} />}
                {activeTab === 'workflow' && <Dashboard initialTargets={targets} initialVideos={videos} />}
                {activeTab === 'brand' && <BrandProfileTab brandSettings={brandSettings} />}
                {activeTab === 'manual' && <ManualTab />}
            </div>
        </div>
    );
}
