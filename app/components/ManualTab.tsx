'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { fetchUGCAccounts, postManualComment, checkManualCommentStatus, boostManualComment } from '../actions';
import { Loader2, Send, ThumbsUp } from 'lucide-react';

type UGCAccount = {
    id: string;
    username: string | null;
    nick_name: string | null;
    type: string;
};

export default function ManualTab() {
    const [isPending, startTransition] = useTransition();

    // Create Comment State
    const [accounts, setAccounts] = useState<UGCAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [postUrl, setPostUrl] = useState('');
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);

    // Comment Boosting State
    const [boostUrl, setBoostUrl] = useState('');
    const [boostUsername, setBoostUsername] = useState('');
    const [boostLikes, setBoostLikes] = useState(10);
    const [boosting, setBoosting] = useState(false);

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

    const handlePostComment = () => {
        if (!selectedAccount || !postUrl || !commentText) {
            alert('Please fill in all fields');
            return;
        }

        setPosting(true);
        startTransition(async () => {
            const res = await postManualComment(selectedAccount, postUrl, commentText);
            setPosting(false);

            if (res.error) {
                alert(res.error);
            } else {
                alert('Comment posted successfully!');
                setPostUrl('');
                setCommentText('');
            }
        });
    };

    // Post & Boost Logic
    const [pollingCommentId, setPollingCommentId] = useState<string | null>(null);
    const [wantsBoostLikes, setWantsBoostLikes] = useState(100);
    const [pollingStatus, setPollingStatus] = useState<string>(''); // 'Waiting...'

    const handlePostAndBoost = () => {
        if (!selectedAccount || !postUrl || !commentText) {
            alert('Please fill in all fields');
            return;
        }

        setPosting(true);
        setPollingStatus('Posting comment...');
        startTransition(async () => {
            // 1. Post Comment
            const res = await postManualComment(selectedAccount, postUrl, commentText);

            if (res.error) {
                setPosting(false);
                setPollingStatus('');
                alert(res.error);
                return;
            }

            if (res.commentId) {
                setPollingStatus('Waiting for TikTok (approx 30s)...');
                setPollingCommentId(res.commentId);
                // The useEffect below will handle polling
            }
        });
    };

    // Polling Effect
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!pollingCommentId) return;

        const checkStatus = async () => {
            const statusRes = await checkManualCommentStatus(pollingCommentId);

            if (statusRes.success) {
                if (statusRes.status === 'completed' && statusRes.commentUrl) {
                    setPollingStatus('Boosting...');

                    // Stop Polling
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setPollingCommentId(null);

                    // Boost
                    const account = accounts.find(a => a.id === selectedAccount);
                    const username = account?.username;

                    if (username) {
                        const boostRes = await boostManualComment(statusRes.commentUrl, username, wantsBoostLikes);
                        if (boostRes.success) {
                            alert(`Success! Posted & Boosted (Order ${boostRes.orderId})`);
                            setPostUrl('');
                            setCommentText('');
                        } else {
                            alert(`Comment posted, but boost failed: ${boostRes.error}`);
                        }
                    } else {
                        alert('Comment posted, but could not find username for boosting.');
                    }
                    setPosting(false);
                    setPollingStatus('');

                } else if (statusRes.status === 'failed') {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setPollingCommentId(null);
                    setPosting(false);
                    setPollingStatus('');
                    alert('Comment posting failed on TikTok side.');
                }
                // If pending/running, keep polling
            }
        };

        // Poll every 10s (user asked for 30s, but 10s is better UX, I'll do 30s if insistent, but 30s is long gap)
        // User explicitly said "check every 30 seconds". I will follow instructions.
        pollIntervalRef.current = setInterval(checkStatus, 30000);
        checkStatus(); // Initial check

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [pollingCommentId, selectedAccount, accounts, wantsBoostLikes]);

    const handleBoostComment = () => {
        if (!boostUrl || !boostUsername || boostLikes < 1) {
            alert('Please fill in all fields');
            return;
        }

        setBoosting(true);
        startTransition(async () => {
            const res = await boostManualComment(boostUrl, boostUsername, boostLikes);
            setBoosting(false);

            if (res.error) {
                alert(res.error);
            } else {
                alert(`Comment boost order placed! Order ID: ${res.orderId}`);
                setBoostUrl('');
                setBoostUsername('');
                setBoostLikes(10);
            }
        });
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Manual Actions</h2>
            <p className="text-zinc-500 mb-8">
                Manually execute individual actions without the full automation workflow.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Create Comment Service */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Send className="text-[#00BC1F]" size={24} />
                        <h3 className="text-xl font-bold text-zinc-900">Create Comment</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-6">Post a comment to any TikTok video using your UGC accounts.</p>

                    <div className="space-y-4">
                        {/* Account Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-zinc-500">Account</label>
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
                                        <>Load Accounts</>
                                    )}
                                </button>
                            </div>

                            {accounts.length > 0 ? (
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50"
                                >
                                    <option value="">Select account...</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.username || account.nick_name || account.id}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    disabled
                                    placeholder="Click 'Load Accounts' first"
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400"
                                />
                            )}
                        </div>

                        {/* TikTok URL */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">TikTok Post URL</label>
                            <input
                                type="url"
                                value={postUrl}
                                onChange={(e) => setPostUrl(e.target.value)}
                                placeholder="https://www.tiktok.com/@username/video/123..."
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50"
                            />
                        </div>

                        {/* Comment Text */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Comment Text</label>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Enter your comment..."
                                rows={3}
                                maxLength={150}
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 resize-none"
                            />
                            <p className="text-xs text-zinc-400 mt-1">{commentText.length}/150 characters</p>
                        </div>

                        {/* Post Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handlePostComment}
                                disabled={posting || !selectedAccount || !postUrl || !commentText || pollingCommentId !== null}
                                className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {posting && !pollingCommentId ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} /> Post Only
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handlePostAndBoost}
                                disabled={posting || !selectedAccount || !postUrl || !commentText || pollingCommentId !== null}
                                className="flex-1 bg-[#00BC1F] hover:bg-[#009b19] text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                            >
                                {pollingCommentId ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> {pollingStatus}
                                    </>
                                ) : (
                                    <>
                                        <ThumbsUp size={16} /> Post & Boost
                                    </>
                                )}
                            </button>
                        </div>
                        {/* Boost Likes Input for Post & Boost */}
                        <div className="flex items-center gap-2 justify-end">
                            <label className="text-xs text-zinc-500">Boost Likes:</label>
                            <input
                                type="number"
                                value={wantsBoostLikes}
                                onChange={(e) => setWantsBoostLikes(parseInt(e.target.value) || 0)}
                                className="w-20 bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50"
                                min={10}
                            />
                        </div>
                    </div>
                </div>

                {/* Comment Boosting Service */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ThumbsUp className="text-amber-500" size={24} />
                        <h3 className="text-xl font-bold text-zinc-900">Comment Boosting</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-6">Boost engagement on specific TikTok comments with targeted likes.</p>

                    <div className="space-y-4">
                        {/* Comment URL */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Comment URL</label>
                            <input
                                type="url"
                                value={boostUrl}
                                onChange={(e) => setBoostUrl(e.target.value)}
                                placeholder="https://www.tiktok.com/@username/video/123..."
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Comment Author Username</label>
                            <input
                                type="text"
                                value={boostUsername}
                                onChange={(e) => setBoostUsername(e.target.value)}
                                placeholder="@username"
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                            />
                        </div>

                        {/* Like Count */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Number of Likes</label>
                            <input
                                type="number"
                                value={boostLikes}
                                onChange={(e) => setBoostLikes(parseInt(e.target.value) || 0)}
                                min={1}
                                max={1000}
                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                            />
                        </div>

                        {/* Boost Button */}
                        <button
                            onClick={handleBoostComment}
                            disabled={boosting || !boostUrl || !boostUsername}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                        >
                            {boosting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Boosting...
                                </>
                            ) : (
                                <>
                                    <ThumbsUp size={16} /> Boost Comment
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
