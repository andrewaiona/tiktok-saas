'use client';

import { useState, useTransition } from 'react';
import { addTarget, removeTarget, runScrape, analyzeVideo, analyzeAllVideos, generateCommentForVideo, generateCommentsForAllRelevant, postCommentToVideo, boostComment, deleteVideo } from '../actions';
import { Trash2, Hash, User, Plus, Loader2, Play, Eye, MessageCircle, Share2, Heart, ExternalLink, Sparkles, CheckCircle2, XCircle, Send, AlertCircle, Settings2, Zap, X } from 'lucide-react';
import Image from 'next/image';
import WorkflowTimeline from './WorkflowTimeline';
import PromptSettings from './PromptSettings';

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
    boostOrderId: string | null;
    boostStatus: string | null;
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
    const [showPromptSettings, setShowPromptSettings] = useState(false);

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
            const res = await addTarget(type, newTarget.value, activeWorkflow);
            if (res.target) {
                setTargets([...targets, res.target]);
                setNewTarget({ ...newTarget, value: '' });
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

    const [scrapeLimit, setScrapeLimit] = useState(10); // Default limit

    const handleScrape = () => {
        if (targets.length === 0) {
            alert("Add some targets first!");
            return;
        }
        startScrapeTransition(async () => {
            const res = await runScrape(scrapeLimit);
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
    const [boostingCommentId, setBoostingCommentId] = useState<number | null>(null);

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

    const handleBoostComment = (videoId: number) => {
        setBoostingCommentId(videoId);
        startTransition(async () => {
            const res = await boostComment(videoId);
            setBoostingCommentId(null);
            if (res.error) {
                alert(res.error);
            } else {
                alert('Boost ordered successfully!');
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
            <div className="flex items-center justify-between">
                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                    <button
                        onClick={() => setActiveWorkflow('general')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeWorkflow === 'general' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        General Relevant Videos
                    </button>
                    <button
                        onClick={() => setActiveWorkflow('competitor')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeWorkflow === 'competitor' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Competitor Accounts
                    </button>
                    <button
                        onClick={() => setActiveWorkflow('brand')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeWorkflow === 'brand' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Your Brand Accounts
                    </button>
                </div>

                <button
                    onClick={() => setShowPromptSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-violet-400 text-sm font-medium transition-colors hover:bg-violet-500/10 rounded-lg border border-transparent hover:border-violet-500/20"
                >
                    <Settings2 size={16} /> Customize AI Prompts
                </button>
            </div>

            {showPromptSettings && (
                <PromptSettings
                    workflowType={activeWorkflow}
                    onClose={() => setShowPromptSettings(false)}
                />
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Targets Column */}
                <div className="space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm h-[calc(100vh-140px)] sticky top-6 z-10 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                <Hash className="text-[#00BC1F]" /> Targets
                                <span className="text-sm font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                    {targets.length}
                                </span>
                            </h2>
                        </div>

                        <form onSubmit={handleAdd} className="mb-6">
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setType('HASHTAG')}
                                    className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${type === 'HASHTAG' ? 'bg-[#00BC1F]/10 text-[#00BC1F]' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                                >
                                    Hashtag
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('USERNAME')}
                                    className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${type === 'USERNAME' ? 'bg-[#00BC1F]/10 text-[#00BC1F]' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                                >
                                    Username
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTarget.value}
                                    onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })}
                                    placeholder={type === 'HASHTAG' ? "Enter hashtag..." : "Enter username..."}
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={isPending || !newTarget.value}
                                    className="bg-[#00BC1F] hover:bg-[#009b19] text-white p-2 rounded-lg transition-colors flex-shrink-0 shadow-sm"
                                >
                                    {isPending ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {targets.length === 0 && (
                                <div className="text-center py-6 text-zinc-500 text-sm font-medium">
                                    No targets yet.
                                </div>
                            )}
                            {targets.map((target) => (
                                <div
                                    key={target.id}
                                    className="group flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl p-3 hover:border-[#00BC1F]/30 transition-all hover:bg-white hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-1.5 rounded-md flex-shrink-0 ${target.type === 'HASHTAG' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>
                                            {target.type === 'HASHTAG' ? <Hash size={16} /> : <User size={16} />}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-700 truncate">
                                            {target.value}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(target.id)}
                                        className="text-zinc-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 mt-6 border-t border-zinc-200 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Max Videos Per Target</label>
                                <select
                                    value={scrapeLimit}
                                    onChange={(e) => setScrapeLimit(Number(e.target.value))}
                                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BC1F]/50 shadow-sm"
                                >
                                    <option value={1}>1 Video</option>
                                    <option value={5}>5 Videos</option>
                                    <option value={10}>10 Videos</option>
                                    <option value={20}>20 Videos</option>
                                    <option value={30}>30 Videos</option>
                                    <option value={50}>50 Videos</option>
                                </select>
                            </div>
                            <button onClick={handleScrape} disabled={isScraping || targets.length === 0} className="w-full bg-[#00BC1F] hover:bg-[#009b19] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#00BC1F]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isScraping ? <><Loader2 className="animate-spin" /> Scraping...</> : <><Play size={20} fill="currentColor" /> Run Scraper</>}
                            </button>
                            <p className="text-xs text-zinc-500 mt-2 text-center">Runs scrape for all active targets.</p>
                        </div>

                    </div>
                </div>

                {/* Videos Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center justify-between sticky top-6 z-10">
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <Play className="text-[#00BC1F]" /> New Videos
                            <span className="text-sm font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                {filteredVideos.length}
                            </span>
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAnalyzeAll}
                                disabled={isAnalyzingAll || filteredVideos.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap shadow-sm"
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
                                className="flex items-center gap-2 px-4 py-2 bg-[#00BC1F] hover:bg-[#009b19] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap shadow-sm"
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
                            <div className="col-span-full py-20 text-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed text-zinc-400">
                                No videos scraped yet. Add targets and run the scraper.
                            </div>
                        )}
                        {filteredVideos.map((video) => (
                            <div key={video.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-[#00BC1F]/40 transition-all group shadow-sm">
                                <div className="aspect-[9/16] relative bg-zinc-100">
                                    {video.coverUrl ? (
                                        <img
                                            src={video.coverUrl}
                                            alt={video.description}
                                            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">No Preview</div>
                                    )}
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg border border-zinc-200 text-xs font-medium text-zinc-800 shadow-sm">
                                            {video.sourceType === 'HASHTAG' ? <Hash size={12} className="text-pink-500" /> : <User size={12} className="text-blue-500" />}
                                            <span className="max-w-[100px] truncate">{video.sourceValue}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (confirm('Are you sure you want to remove this video?')) {
                                                    startTransition(async () => {
                                                        await deleteVideo(video.id);
                                                        window.location.reload();
                                                    });
                                                }
                                            }}
                                            className="p-1 bg-white/90 hover:bg-red-50 backdrop-blur-md rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-500 shadow-sm transition-colors"
                                            title="Remove video"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* AI Analysis Badge */}
                                    {video.isRelevant !== null && (
                                        <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 backdrop-blur-md rounded-lg text-xs font-bold shadow-sm z-10 ${video.isRelevant
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
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

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-white text-sm font-medium line-clamp-2 mb-2 flex-1 drop-shadow-md">
                                                {video.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-zinc-200 mt-1">
                                            <span className="flex items-center gap-1 font-semibold text-white drop-shadow-md">
                                                @{video.author}
                                            </span>
                                            <a
                                                href={`https://www.tiktok.com/@${video.author}/video/${video.tiktokId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-white hover:text-violet-200 px-2 py-1 bg-white/20 rounded-md backdrop-blur-sm border border-white/20"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-white border-t border-zinc-200 flex items-center justify-between text-xs">
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
                                        className="flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 rounded-md transition-all disabled:opacity-50 text-xs font-medium"
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
                                    <div className="p-3 bg-purple-50 border-t border-purple-100">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                                                <MessageCircle size={12} /> AI Comment
                                                {video.commentPosted && (
                                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded border border-green-200">Posted</span>
                                                )}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(video.generatedComment!)}
                                                    className="text-xs text-purple-600 hover:text-purple-800 px-2 py-0.5 bg-purple-100/50 rounded hover:bg-purple-100 transition-colors"
                                                >
                                                    Copy
                                                </button>
                                                {!video.commentPosted && (
                                                    <button
                                                        onClick={() => handlePostComment(video.id)}
                                                        disabled={postingCommentId === video.id}
                                                        className="text-xs text-green-700 hover:text-green-800 px-2 py-0.5 bg-green-100 rounded hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1 border border-green-200"
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
                                                {video.commentPosted && !video.boostOrderId && (
                                                    <button
                                                        onClick={() => handleBoostComment(video.id)}
                                                        disabled={boostingCommentId === video.id}
                                                        className="text-xs text-orange-700 hover:text-orange-800 px-2 py-0.5 bg-orange-100 rounded hover:bg-orange-200 transition-colors disabled:opacity-50 flex items-center gap-1 border border-orange-200"
                                                    >
                                                        {boostingCommentId === video.id ? <><Loader2 size={10} className="animate-spin" /> Boosting...</> : <><Zap size={10} /> Boost 100❤️</>}
                                                    </button>
                                                )}
                                                {video.boostOrderId && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200 flex items-center gap-1"><Zap size={10} /> Boosted</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-700 italic">"{video.generatedComment}"</p>
                                    </div>
                                )}

                                {/* Generate Comment Button (if relevant but no comment) */}
                                {video.isRelevant && !video.generatedComment && (
                                    <div className="p-2 bg-zinc-50 border-t border-zinc-200">
                                        <button
                                            onClick={() => handleGenerateComment(video.id)}
                                            disabled={generatingCommentId === video.id}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-md transition-all disabled:opacity-50 text-xs font-medium shadow-sm"
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
