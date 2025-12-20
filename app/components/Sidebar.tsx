'use client';

import { useState } from 'react';
import { Workflow, User, Zap } from 'lucide-react';

type Tab = 'workflow' | 'brand' | 'manual';

export default function Sidebar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
    const tabs = [
        { id: 'workflow' as Tab, label: 'Workflow', icon: Workflow },
        { id: 'brand' as Tab, label: 'Brand Profile', icon: User },
        { id: 'manual' as Tab, label: 'Manual', icon: Zap },
    ];

    return (
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 flex flex-col">
            {/* Logo/Header */}
            <div className="p-6 border-b border-zinc-800">
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                    TikTok Monitor
                </h1>
                <p className="text-xs text-zinc-500 mt-1">Automate your growth</p>
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
                                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-600 text-center">v1.0.0</p>
            </div>
        </div>
    );
}
