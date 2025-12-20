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

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'workflow' && <Dashboard initialTargets={targets} initialVideos={videos} />}
                {activeTab === 'brand' && <BrandProfileTab brandSettings={brandSettings} />}
                {activeTab === 'manual' && <ManualTab />}
            </div>
        </main>
    );
}
