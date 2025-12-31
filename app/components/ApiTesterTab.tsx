'use client';

import { useState, useEffect } from 'react';
import { fetchUGCAccounts, fetchUGCComments } from '../actions';
import { Loader2, RefreshCw, Copy, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function ApiTesterTab() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [comments, setComments] = useState<any[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        const res = await fetchUGCAccounts();
        if (res.success && res.accounts) {
            setAccounts(res.accounts);
            if (res.accounts.length > 0) {
                // select first one by default if not set
                if (!selectedAccount) setSelectedAccount(res.accounts[0].id);
            }
        } else {
            setError(res.error || 'Failed to load accounts');
        }
        setLoadingAccounts(false);
    };

    const loadComments = async () => {
        if (!selectedAccount) return;
        setLoadingComments(true);
        setComments([]);
        const res = await fetchUGCComments(selectedAccount);
        if (res.success && res.comments) {
            setComments(res.comments);
        } else {
            alert(res.error || 'Failed to load comments');
        }
        setLoadingComments(false);
    };

    // Auto load comments when account changes
    useEffect(() => {
        if (selectedAccount) {
            loadComments();
        }
    }, [selectedAccount]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">API Tester</h1>
                    <p className="text-zinc-500 mt-1">Debug comments and view raw data from UGC.inc API.</p>
                </div>
                <button
                    onClick={loadAccounts}
                    className="p-2 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg shadow-sm"
                    title="Refresh Accounts"
                >
                    <RefreshCw size={18} className={loadingAccounts ? "animate-spin" : ""} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-2">
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                    <label className="text-sm font-bold text-zinc-900">Select UGC Account</label>
                    <div className="flex gap-4">
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00BC1F]/50 appearance-none font-mono text-sm"
                            disabled={loadingAccounts}
                        >
                            <option value="">Select an account...</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.username || acc.nick_name || acc.id} ({acc.id}) - {acc.status}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={loadComments}
                            disabled={loadingComments || !selectedAccount}
                            className="bg-[#00BC1F] hover:bg-[#009b19] text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {loadingComments ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                            Fetch Comments
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900">Comments Output</h3>
                    <span className="text-xs text-zinc-500 font-mono">{comments.length} results</span>
                </div>

                {loadingComments ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-zinc-300" size={32} />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 italic">
                        No comments found for this account.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Comment Text</th>
                                    <th className="px-6 py-3">Comment URL</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {comments.map((comment) => (
                                    <tr key={comment.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {comment.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle2 size={12} /> Completed
                                                    </span>
                                                ) : comment.status === 'pending' || comment.status === 'running' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                        <Clock size={12} /> {comment.status}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                                        {comment.status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 max-w-xs truncate text-zinc-700 font-medium" title={comment.commentText}>
                                            {comment.commentText}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                                            {comment.commentUrl ? (
                                                <div className="flex items-center gap-2">
                                                    <a href={comment.commentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                        Link <ExternalLink size={10} />
                                                    </a>
                                                    <button onClick={() => copyToClipboard(comment.commentUrl)} className="text-zinc-400 hover:text-zinc-600" title="Copy URL">
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-zinc-500">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
