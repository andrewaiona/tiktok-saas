'use client';

import { useState } from 'react';
import { LayoutDashboard, Workflow, User, Zap, TestTube2 } from 'lucide-react';

type Tab = 'dashboard' | 'workflow' | 'brand' | 'manual' | 'api-tester';

export default function Sidebar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
    const tabs = [
        { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'workflow' as Tab, label: 'Workflow', icon: Workflow },
        { id: 'brand' as Tab, label: 'Brand Profile', icon: User },
        { id: 'manual' as Tab, label: 'Manual', icon: Zap },
        { id: 'api-tester' as Tab, label: 'API Tester', icon: TestTube2 },
    ];

    return (
        <div className="w-64 bg-white border-r border-zinc-200 h-screen sticky top-0 flex flex-col">
            {/* Logo/Header */}
            <div className="p-6 border-b border-zinc-200">
                <img src="/logo.png" alt="CommentFarm" className="h-8 w-auto" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-[#00BC1F]/10 text-[#00BC1F] border border-[#00BC1F]/20'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 text-center">v1.0.0</p>
            </div>
        </div>
    );
}
