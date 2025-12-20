'use client';

import { useState, useTransition } from 'react';
import { fetchUGCAccounts, postManualComment, boostComment } from '../actions';
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

    const handleBoostComment = () => {
        if (!boostUrl || !boostUsername || boostLikes < 1) {
            alert('Please fill in all fields');
            return;
        }

        setBoosting(true);
        startTransition(async () => {
            const res = await boostComment(boostUrl, boostUsername, boostLikes);
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
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">Manual Actions</h2>
            <p className="text-zinc-400 mb-8">
                Manually execute individual actions without the full automation workflow.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Create Comment Service */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Send className="text-violet-500" size={24} />
                        <h3 className="text-xl font-bold text-zinc-100">Create Comment</h3>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">Post a comment to any TikTok video using your UGC accounts.</p>

                    <div className="space-y-4">
                        {/* Account Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-zinc-500">Account</label>
                                <button
                                    type="button"
                                    onClick={loadAccounts}
                                    disabled={loadingAccounts}
                                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 disabled:opacity-50"
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
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
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
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-500"
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
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
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
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none"
                            />
                            <p className="text-xs text-zinc-600 mt-1">{commentText.length}/150 characters</p>
                        </div>

                        {/* Post Button */}
                        <button
                            onClick={handlePostComment}
                            disabled={posting || !selectedAccount || !postUrl || !commentText}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {posting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Posting...
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> Post Comment
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Comment Boosting Service */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ThumbsUp className="text-amber-500" size={24} />
                        <h3 className="text-xl font-bold text-zinc-100">Comment Boosting</h3>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">Boost engagement on specific TikTok comments with targeted likes.</p>

                    <div className="space-y-4">
                        {/* Comment URL */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Comment URL</label>
                            <input
                                type="url"
                                value={boostUrl}
                                onChange={(e) => setBoostUrl(e.target.value)}
                                placeholder="https://www.tiktok.com/@username/video/123..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
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
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
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
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                            />
                        </div>

                        {/* Boost Button */}
                        <button
                            onClick={handleBoostComment}
                            disabled={boosting || !boostUrl || !boostUsername}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
