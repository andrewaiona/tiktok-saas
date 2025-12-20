'use client';

import { useState, useTransition } from 'react';
import { addTarget, removeTarget, runScrape, analyzeVideo, analyzeAllVideos, generateCommentForVideo, generateCommentsForAllRelevant, postCommentToVideo } from '../actions';
import { Trash2, Hash, User, Plus, Loader2, Play, Eye, MessageCircle, Share2, Heart, ExternalLink, Sparkles, CheckCircle2, XCircle, Send, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import WorkflowTimeline from './WorkflowTimeline';

type Target = {
    id: number;
    type: string;
    value: string;
    workflowType: string;
    createdAt: Date;
};

type Video = {
    id: number;
    tiktokId: string;
    description: string;
    coverUrl: string | null;
    author: string;
    diggCount: number;
    commentCount: number;
    playCount: number;
    shareCount: number;
    createdAt: Date;
    scrapedAt: Date;
    sourceType: string;
    sourceValue: string;
    playUrl: string | null;
    isRelevant: boolean | null;
    relevanceScore: number | null;
    analysisReason: string | null;
    generatedComment: string | null;
    commentPosted: boolean;
    commentStatus: string | null;
};

type BrandSettingsData = {
    productName: string;
    productDescription: string;
    targetAudience: string;
    persona: string;
} | null;

export default function Dashboard({ initialTargets, initialVideos }: {
    initialTargets: Target[],
    initialVideos: Video[]
}) {
    const [targets, setTargets] = useState<Target[]>(initialTargets);
    const [videos, setVideos] = useState<Video[]>(initialVideos);
    const [activeWorkflow, setActiveWorkflow] = useState<'general' | 'competitor' | 'brand'>('general');

    // Filter targets and videos by active workflow
    const filteredTargets = targets.filter(t => t.workflowType === activeWorkflow);
    const filteredVideos = videos.filter(v => {
        const target = targets.find(t => t.type === v.sourceType && t.value === v.sourceValue);
        return target?.workflowType === activeWorkflow;
    });

    const [newTarget, setNewTarget] = useState({ type: 'HASHTAG', value: '' });
    const [type, setType] = useState('HASHTAG'); // This line is kept as per instruction, though newTarget.type might make it redundant.
    const [isPending, startTransition] = useTransition();
    const [isScraping, startScrapeTransition] = useTransition();

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTarget.value.trim()) return;

        startTransition(async () => {
            const res = await addTarget(newTarget.type, newTarget.value, activeWorkflow);
            if (res.target) {
                setTargets([...targets, res.target]);
                setNewTarget({ type: 'HASHTAG', value: '' });
            } else {
                alert('Failed to add target');
            }
        });
    };

    const handleRemove = async (id: number) => {
        const optimisticallyRemoved = targets.filter((t) => t.id !== id);
        setTargets(optimisticallyRemoved);
        const res = await removeTarget(id);
        if (!res.success) {
            setTargets(targets); // Revert
            alert('Failed to remove');
        }
    };

    const handleScrape = () => {
        if (targets.length === 0) {
            alert("Add some targets first!");
            return;
        }
        startScrapeTransition(async () => {
            const res = await runScrape();
            if (res.error) {
                alert(res.error);
            } else {
                window.location.reload();
            }
        });
    }

    const [analyzingId, setAnalyzingId] = useState<number | null>(null);
    const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
    const [generatingCommentId, setGeneratingCommentId] = useState<number | null>(null);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [postingCommentId, setPostingCommentId] = useState<number | null>(null);

    const handleAnalyze = (videoId: number) => {
        setAnalyzingId(videoId);
        startTransition(async () => {
            const res = await analyzeVideo(videoId);
            setAnalyzingId(null);
            if (res.error) {
                alert(res.error);
            } else {
                window.location.reload();
            }
        });
    }

    const handleAnalyzeAll = () => {
        setIsAnalyzingAll(true);
        startTransition(async () => {
            const res = await analyzeAllVideos();
            setIsAnalyzingAll(false);
            if (res.error) {
                alert(res.error);
            } else {
                alert(`Analyzed ${res.count} videos!`);
                window.location.reload();
            }
        });
    }

    const handleGenerateComment = (videoId: number) => {
        setGeneratingCommentId(videoId);
        startTransition(async () => {
            const res = await generateCommentForVideo(videoId);
            setGeneratingCommentId(null);
            if (res.error) {
                alert(res.error);
            } else {
                window.location.reload();
            }
        });
    }

    const handleGenerateAllComments = () => {
        setIsGeneratingAll(true);
        startTransition(async () => {
            const res = await generateCommentsForAllRelevant();
            setIsGeneratingAll(false);
            if (res.error) {
                alert(res.error);
            } else {
                alert(`Generated ${res.count} comments!`);
                window.location.reload();
            }
        });
    }

    const handlePostComment = (videoId: number) => {
        setPostingCommentId(videoId);
        startTransition(async () => {
            const res = await postCommentToVideo(videoId);
            setPostingCommentId(null);
            if (res.error) {
                alert(res.error);
            } else {
                alert('Comment posted successfully!');
                window.location.reload();
            }
        });
    }

    // Calculate Workflow Status
    const hasVideos = filteredVideos.length > 0;
    const totalVideos = filteredVideos.length;
    const analyzedCount = filteredVideos.filter(v => v.isRelevant !== null).length;
    const relevantCount = filteredVideos.filter(v => v.isRelevant === true).length;
    const commentedCount = filteredVideos.filter(v => v.commentPosted).length;

    // Determine step completion
    const isScanned = hasVideos;
    const isFiltered = hasVideos && analyzedCount === totalVideos;
    const isCommented = hasVideos && isFiltered && (commentedCount >= relevantCount); // Assuming we only comment on relevant ones
    const isBoosted = false; // Placeholder for now as we don't track auto-boosts

    const workflowStatus = {
        scanned: isScanned,
        filtered: isFiltered,
        commented: isCommented,
        boosted: isBoosted
    };

    const workflowCounts = {
        total: totalVideos,
        analyzed: analyzedCount,
        commented: commentedCount
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header & Timeline */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-start gap-12 border-b border-zinc-800 pb-6">
                <div className="space-y-2 shrink-0">
                    <h2 className="text-3xl font-bold text-zinc-100">Workflow</h2>
                    <p className="text-zinc-400">Automate your TikTok engagement from scraping to posting.</p>
                </div>

                {/* Visual Timeline */}
                <div className="flex-1 max-w-3xl pb-2">
                    <WorkflowTimeline status={workflowStatus} counts={workflowCounts} />
                </div>
            </div>

            {/* Workflow Type Tabs */}
            <div className="flex gap-2 border-b border-zinc-800">
                <button
                    onClick={() => setActiveWorkflow('general')}
                    className={`px-4 py-2 font-medium transition-colors ${activeWorkflow === 'general'
                        ? 'text-violet-400 border-b-2 border-violet-500'
                        : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    General Relevant Videos
                </button>
                <button
                    onClick={() => setActiveWorkflow('competitor')}
                    className={`px-4 py-2 font-medium transition-colors ${activeWorkflow === 'competitor'
                        ? 'text-violet-400 border-b-2 border-violet-500'
                        : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Competitor Accounts
                </button>
                <button
                    onClick={() => setActiveWorkflow('brand')}
                    className={`px-4 py-2 font-medium transition-colors ${activeWorkflow === 'brand'
                        ? 'text-violet-400 border-b-2 border-violet-500'
                        : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Your Brand Accounts
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Targets Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-6">
                        <h2 className="text-xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
                            <Hash className="text-pink-500" /> Targets
                        </h2>

                        <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-6">
                            <div className="flex bg-zinc-800/80 rounded-lg p-1 border border-zinc-700/50">
                                <button
                                    type="button"
                                    onClick={() => setType('HASHTAG')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${type === 'HASHTAG'
                                        ? 'bg-zinc-700 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    Hash
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('USERNAME')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${type === 'USERNAME'
                                        ? 'bg-zinc-700 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    User
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTarget.value}
                                    onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })}
                                    placeholder={newTarget.type === 'HASHTAG' ? 'e.g., fashiontrends' : 'e.g., @username'}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-lg transition-colors flex-shrink-0"
                                >
                                    {isPending ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {targets.length === 0 && (
                                <div className="text-center py-6 text-zinc-600 text-sm font-medium">
                                    No targets yet.
                                </div>
                            )}
                            {targets.map((target) => (
                                <div
                                    key={target.id}
                                    className="group flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 hover:border-violet-500/30 transition-all hover:bg-zinc-800/50"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-1.5 rounded-md flex-shrink-0 ${target.type === 'HASHTAG' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {target.type === 'HASHTAG' ? <Hash size={16} /> : <User size={16} />}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300 truncate">
                                            {target.value}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(target.id)}
                                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 mt-6 border-t border-zinc-800">
                            <button
                                onClick={handleScrape}
                                disabled={isScraping || targets.length === 0}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isScraping ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Scraping...
                                    </>
                                ) : (
                                    <>
                                        <Play size={20} fill="currentColor" /> Run Scraper
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-zinc-500 mt-2 text-center">
                                Runs scrape for all active targets.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Videos Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between sticky top-6 z-10">
                        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                            <Play className="text-violet-500" /> New Videos
                            <span className="text-sm font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                                {filteredVideos.length}
                            </span>
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAnalyzeAll}
                                disabled={isAnalyzingAll || filteredVideos.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            >
                                {isAnalyzingAll ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} /> Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} /> Analyze All
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleGenerateAllComments}
                                disabled={isGeneratingAll || filteredVideos.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            >
                                {isGeneratingAll ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle size={16} /> Generate Comments
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {filteredVideos.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed text-zinc-500">
                                No videos scraped yet. Add targets and run the scraper.
                            </div>
                        )}
                        {filteredVideos.map((video) => (
                            <div key={video.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all group">
                                <div className="aspect-[9/16] relative bg-zinc-950">
                                    {video.coverUrl ? (
                                        <img
                                            src={video.coverUrl}
                                            alt={video.description}
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700">No Preview</div>
                                    )}
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-medium text-white shadow-lg z-10">
                                        {video.sourceType === 'HASHTAG' ? <Hash size={12} className="text-pink-400" /> : <User size={12} className="text-blue-400" />}
                                        <span className="max-w-[100px] truncate">{video.sourceValue}</span>
                                    </div>

                                    {/* AI Analysis Badge */}
                                    {video.isRelevant !== null && (
                                        <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 backdrop-blur-md rounded-lg text-xs font-bold shadow-lg z-10 ${video.isRelevant
                                            ? 'bg-emerald-500/80 text-white border border-emerald-300/50'
                                            : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                                            }`}>
                                            {video.isRelevant ? (
                                                <>
                                                    <CheckCircle2 size={12} /> Relevant
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={12} /> Not Relevant
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-white text-sm font-medium line-clamp-2 mb-2 flex-1">
                                                {video.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                                            <span className="flex items-center gap-1 font-semibold text-zinc-300">
                                                @{video.author}
                                            </span>
                                            <a
                                                href={`https://www.tiktok.com/@${video.author}/video/${video.tiktokId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-violet-400 hover:text-violet-300 px-2 py-1 bg-violet-500/10 rounded-md backdrop-blur-sm"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-900 border-t border-zinc-800/50 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <span className="flex items-center gap-1" title="Views">
                                            <Play size={12} /> {formatNumber(video.playCount)}
                                        </span>
                                        <span className="flex items-center gap-1" title="Likes">
                                            <Heart size={12} /> {formatNumber(video.diggCount)}
                                        </span>
                                        <span className="flex items-center gap-1" title="Comments">
                                            <MessageCircle size={12} /> {formatNumber(video.commentCount)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleAnalyze(video.id)}
                                        disabled={analyzingId === video.id}
                                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-md transition-all disabled:opacity-50 text-xs font-medium"
                                        title={video.analysisReason || 'Analyze with AI'}
                                    >
                                        {analyzingId === video.id ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={12} />
                                        )}
                                        {analyzingId === video.id ? 'Analyzing...' : 'Analyze'}
                                    </button>
                                </div>

                                {/* Generated Comment Section */}
                                {video.generatedComment && (
                                    <div className="p-3 bg-violet-950/30 border-t border-violet-800/30">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-xs font-semibold text-violet-300 flex items-center gap-1">
                                                <MessageCircle size={12} /> AI Comment
                                                {video.commentPosted && (
                                                    <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">Posted</span>
                                                )}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(video.generatedComment!)}
                                                    className="text-xs text-violet-400 hover:text-violet-300 px-2 py-0.5 bg-violet-500/10 rounded hover:bg-violet-500/20 transition-colors"
                                                >
                                                    Copy
                                                </button>
                                                {!video.commentPosted && (
                                                    <button
                                                        onClick={() => handlePostComment(video.id)}
                                                        disabled={postingCommentId === video.id}
                                                        className="text-xs text-green-400 hover:text-green-300 px-2 py-0.5 bg-green-500/10 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {postingCommentId === video.id ? (
                                                            <>
                                                                <Loader2 size={10} className="animate-spin" /> Posting...
                                                            </>
                                                        ) : (
                                                            <>Post</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-300 italic">"{video.generatedComment}"</p>
                                    </div>
                                )}

                                {/* Generate Comment Button (if relevant but no comment) */}
                                {video.isRelevant && !video.generatedComment && (
                                    <div className="p-2 bg-zinc-900/50 border-t border-zinc-800/50">
                                        <button
                                            onClick={() => handleGenerateComment(video.id)}
                                            disabled={generatingCommentId === video.id}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-md transition-all disabled:opacity-50 text-xs font-medium"
                                        >
                                            {generatingCommentId === video.id ? (
                                                <>
                                                    <Loader2 size={12} className="animate-spin" /> Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <MessageCircle size={12} /> Generate Comment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatNumber(num: number) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
