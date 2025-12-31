'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { scrapeProfileVideos, scrapeHashtagVideos, ScrapedVideoData } from '@/lib/scrape-creators';

// Workflow Settings Actions
export async function getWorkflowSettings(workflowType: string) {
    try {
        const settings = await prisma.workflowSettings.findUnique({
            where: { workflowType }
        });
        return { success: true, settings };
    } catch (error) {
        console.error('Error fetching workflow settings:', error);
        return { error: 'Failed to fetch settings' };
    }
}

export async function updateWorkflowSettings(workflowType: string, relevancyPrompt: string, commentPrompt: string) {
    try {
        await prisma.workflowSettings.upsert({
            where: { workflowType },
            update: { relevancyPrompt, commentPrompt },
            create: { workflowType, relevancyPrompt, commentPrompt }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating workflow settings:', error);
        return { error: 'Failed to update settings' };
    }
}

export async function addTarget(type: string, value: string, workflowType: string) {
    try {
        const target = await prisma.monitoringTarget.create({
            data: {
                type,
                value,
                workflowType
            }
        });
        revalidatePath('/');
        return { success: true, target };
    } catch (error) {
        console.error('Add target error:', error);
        return { error: 'Failed to add target' };
    }
}

export async function getTargets() {
    return await prisma.monitoringTarget.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function removeTarget(id: number) {
    try {
        await prisma.monitoringTarget.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete' };
    }
}

export async function runScrape(limit: number = 10) {
    try {
        const targets = await prisma.monitoringTarget.findMany();
        let newVideosCount = 0;

        for (const target of targets) {
            let videos: ScrapedVideoData[] = [];
            if (target.type === 'HASHTAG') {
                videos = await scrapeHashtagVideos(target.value, limit);
            } else if (target.type === 'USERNAME') {
                videos = await scrapeProfileVideos(target.value, limit);
            }

            for (const video of videos) {
                await prisma.scrapedVideo.upsert({
                    where: { tiktokId: video.tiktokId },
                    update: {
                        // Update stats if they changed
                        diggCount: video.diggCount,
                        commentCount: video.commentCount,
                        playCount: video.playCount,
                        shareCount: video.shareCount,
                    },
                    create: {
                        tiktokId: video.tiktokId,
                        description: video.description,
                        coverUrl: video.coverUrl,
                        playUrl: video.playUrl,
                        author: video.author,
                        diggCount: video.diggCount,
                        commentCount: video.commentCount,
                        playCount: video.playCount,
                        shareCount: video.shareCount,
                        createdAt: new Date(video.createdAt * 1000), // Convert API timestamp to Date
                        sourceType: target.type,
                        sourceValue: target.value
                    },
                });
                newVideosCount++;
            }
        }

        revalidatePath('/');
        return { success: true, count: newVideosCount };
    } catch (error) {
        console.error('Scrape error:', error);
        return { error: 'Failed to run scrape. Check API Key.' };
    }
}

export async function getScrapedVideos() {
    return await prisma.scrapedVideo.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit for now
    });
}

// --- Brand Settings Actions ---

export async function updateBrandSettings(data: { productName: string; productDescription: string; targetAudience: string; persona: string }) {
    try {
        // We only support one brand profile for now, so we upsert ID 1
        const settings = await prisma.brandSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { ...data, id: 1 },
        });
        revalidatePath('/');
        return { success: true, data: settings };
    } catch (error) {
        return { error: 'Failed to save settings' };
    }
}

export async function getBrandSettings() {
    return await prisma.brandSettings.findUnique({
        where: { id: 1 },
    });
}

import { analyzeVideoContent } from '@/lib/ai';

export async function analyzeVideo(videoId: number) {
    try {
        const video = await prisma.scrapedVideo.findUnique({ where: { id: videoId } });
        const brand = await prisma.brandSettings.findUnique({ where: { id: 1 } });

        if (!video) return { error: 'Video not found' };
        if (!brand) return { error: 'Brand settings not found. Please configure them first.' };

        // Determine workflow type from the video's source target (if possible) or default to 'general'
        // For now, we'll try to find the target that scraped this video
        const target = await prisma.monitoringTarget.findFirst({
            where: { value: video.sourceValue, type: video.sourceType }
        });
        const workflowType = target?.workflowType || 'general';

        // Fetch custom prompts if they exist
        const workflowSettings = await prisma.workflowSettings.findUnique({
            where: { workflowType }
        });

        // Construct brand context
        const brandContext = `
            Product: ${brand.productName}
            Description: ${brand.productDescription}
            Target Audience: ${brand.targetAudience}
            Persona: ${brand.persona}
        `;

        const analysis = await analyzeVideoContent(
            video.playUrl || '',
            video.description,
            brandContext,
            workflowSettings?.relevancyPrompt // Pass custom prompt
        );

        await prisma.scrapedVideo.update({
            where: { id: videoId },
            data: {
                isRelevant: analysis.isRelevant,
                relevanceScore: analysis.relevanceScore,
                analysisReason: analysis.reasoning,
            }
        });

        revalidatePath('/');
        return { success: true, analysis };
    } catch (error) {
        console.error('Analysis action error:', error);
        return { error: 'Analysis failed' };
    }
}

export async function analyzeAllVideos() {
    try {
        const videos = await prisma.scrapedVideo.findMany({
            where: {
                isRelevant: null, // Only analyze videos that haven't been analyzed yet
            }
        });
        const brand = await prisma.brandSettings.findUnique({ where: { id: 1 } });

        if (!brand) return { error: 'Brand settings not found. Please configure them first.' };
        if (videos.length === 0) return { success: true, count: 0, message: 'No videos to analyze' };

        const brandContext = `
            Product: ${brand.productName}
            Description: ${brand.productDescription}
            Target Audience: ${brand.targetAudience}
            Persona: ${brand.persona}
        `;

        let analyzedCount = 0;
        for (const video of videos) {
            try {
                // Determine workflow type for the current video
                const target = await prisma.monitoringTarget.findFirst({
                    where: { value: video.sourceValue, type: video.sourceType }
                });
                const workflowType = target?.workflowType || 'general';

                // Fetch custom prompts if they exist
                const workflowSettings = await prisma.workflowSettings.findUnique({
                    where: { workflowType }
                });

                const analysis = await analyzeVideoContent(
                    video.playUrl || '',
                    video.description,
                    brandContext,
                    workflowSettings?.relevancyPrompt // Pass custom prompt
                );

                await prisma.scrapedVideo.update({
                    where: { id: video.id },
                    data: {
                        isRelevant: analysis.isRelevant,
                        relevanceScore: analysis.relevanceScore,
                        analysisReason: analysis.reasoning,
                    }
                });
                analyzedCount++;
            } catch (error) {
                console.error(`Failed to analyze video ${video.id}:`, error);
            }
        }

        revalidatePath('/');
        return { success: true, count: analyzedCount };
    } catch (error) {
        return { error: 'Batch analysis failed' };
    }
}

import { generateComment } from '@/lib/ai';

export async function generateCommentForVideo(videoId: number) {
    try {
        const video = await prisma.scrapedVideo.findUnique({ where: { id: videoId } });
        const brand = await prisma.brandSettings.findUnique({ where: { id: 1 } });

        if (!video) return { error: 'Video not found' };
        if (!brand) return { error: 'Brand settings not found' };
        if (!video.isRelevant) return { error: 'Video is not marked as relevant' };

        // Determine workflow type
        const target = await prisma.monitoringTarget.findFirst({
            where: { value: video.sourceValue, type: video.sourceType }
        });
        const workflowType = target?.workflowType || 'general';

        // Fetch custom prompts
        const workflowSettings = await prisma.workflowSettings.findUnique({
            where: { workflowType }
        });

        const brandContext = `
            Product: ${brand.productName}
            Description: ${brand.productDescription}
        `;

        const comment = await generateComment(
            video.description,
            brandContext,
            brand.persona,
            workflowSettings?.commentPrompt // Pass custom prompt
        );

        await prisma.scrapedVideo.update({
            where: { id: videoId },
            data: { generatedComment: comment }
        });

        revalidatePath('/');
        return { success: true, comment };
    } catch (error) {
        console.error('Comment generation error:', error);
        return { error: 'Failed to generate comment' };
    }
}

export async function generateCommentsForAllRelevant() {
    try {
        const videos = await prisma.scrapedVideo.findMany({
            where: {
                isRelevant: true,
                generatedComment: null
            }
        });
        const brand = await prisma.brandSettings.findUnique({ where: { id: 1 } });

        if (!brand) return { error: 'Brand settings not found' };
        if (videos.length === 0) return { success: true, count: 0 };

        const brandContext = `
            Product: ${brand.productName}
            Description: ${brand.productDescription}
            Target Audience: ${brand.targetAudience}
        `;

        let count = 0;
        for (const video of videos) {
            try {
                // Determine workflow type
                const target = await prisma.monitoringTarget.findFirst({
                    where: { value: video.sourceValue, type: video.sourceType }
                });
                const workflowType = target?.workflowType || 'general';

                // Fetch custom prompts
                const workflowSettings = await prisma.workflowSettings.findUnique({
                    where: { workflowType }
                });

                const comment = await generateComment(
                    video.description,
                    brandContext,
                    brand.persona,
                    workflowSettings?.commentPrompt // Pass custom prompt
                );

                await prisma.scrapedVideo.update({
                    where: { id: video.id },
                    data: { generatedComment: comment }
                });
                count++;
            } catch (error) {
                console.error(`Failed to generate comment for video ${video.id}:`, error);
            }
        }

        revalidatePath('/');
        return { success: true, count };
    } catch (error) {
        return { error: 'Failed to generate comments' };
    }
}

import { postComment } from '@/lib/ugc-api';

export async function postCommentToVideo(videoId: number) {
    try {
        const video = await prisma.scrapedVideo.findUnique({ where: { id: videoId } });
        const brand = await prisma.brandSettings.findUnique({ where: { id: 1 } });

        if (!video) return { error: 'Video not found' };
        if (!brand) return { error: 'Brand settings not found' };
        if (!video.generatedComment) return { error: 'No comment generated yet' };
        if (!brand.ugcAccountId || brand.ugcAccountId.includes('placeholder')) {
            return { error: 'Please configure a real UGC Account ID in Brand Settings (get one from ugc.inc)' };
        }

        // Construct TikTok URL
        const postUrl = `https://www.tiktok.com/@${video.author}/video/${video.tiktokId}`;

        const result = await postComment(brand.ugcAccountId, postUrl, video.generatedComment);

        if (result.ok && result.commentId) {
            await prisma.scrapedVideo.update({
                where: { id: videoId },
                data: {
                    commentPosted: true,
                    commentId: result.commentId,
                    commentStatus: 'pending'
                }
            });

            revalidatePath('/');
            return { success: true, commentId: result.commentId };
        } else {
            return { error: result.error || 'Failed to post comment' };
        }
    } catch (error) {
        return { error: 'Failed to post comment' };
    }
}

import { getAccounts } from '@/lib/ugc-api';

export async function fetchUGCAccounts() {
    try {
        const result = await getAccounts();

        if (result.ok && result.accounts) {
            return { success: true, accounts: result.accounts };
        } else {
            return { error: result.error || 'Failed to fetch accounts' };
        }
    } catch (error) {
        return { error: 'Failed to fetch accounts' };
    }
}

export async function postManualComment(accountId: string, postUrl: string, commentText: string) {
    try {
        const result = await postComment(accountId, postUrl, commentText);

        if (result.ok && result.commentId) {
            return { success: true, commentId: result.commentId };
        } else {
            return { error: result.error || 'Failed to post comment' };
        }
    } catch (error) {
        return { error: 'Failed to post comment' };
    }
}

import { boostCommentLikes } from '@/lib/smm-api';

import { getComments, getCommentStatus } from '@/lib/ugc-api';

export async function deleteVideo(videoId: number) {
    try {
        await prisma.scrapedVideo.delete({ where: { id: videoId } });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete video' };
    }
}

export async function boostComment(videoId: number) {
    try {
        const video = await prisma.scrapedVideo.findUnique({ where: { id: videoId } });
        if (!video) return { status: 'error', message: 'Video not found' };
        if (!video.commentId) return { status: 'error', message: 'No comment ID' };

        // 1. Check Comment Status from UGC API
        const statusResponse = await getCommentStatus(video.commentId);

        if (!statusResponse.ok) {
            return { status: 'error', message: `Status check failed: ${statusResponse.error}` };
        }

        const currentStatus = statusResponse.status || 'unknown';

        if (currentStatus !== 'completed') {
            return { status: currentStatus, message: `Status: ${currentStatus}` };
        }

        if (!statusResponse.commentUrl) {
            return { status: 'error', message: 'Completed but no URL' };
        }

        // 2. Completed! Get Account Details to find the Username
        // We'll return the URL info now as requested
        const ugcComment = { commentUrl: statusResponse.commentUrl };

        const commentResponse = await getComments({ commentIds: [video.commentId] });
        if (!commentResponse.ok || !commentResponse.comments || commentResponse.comments.length === 0) {
            return { status: 'completed', message: 'URL found, but failed to fetch details for boost', commentUrl: ugcComment.commentUrl };
        }
        const fullCommentDetails = commentResponse.comments[0];

        const accountsResponse = await getAccounts();
        if (!accountsResponse.ok || !accountsResponse.accounts) {
            return { status: 'completed', message: 'URL found, but failed to fetch accounts for boost', commentUrl: ugcComment.commentUrl };
        }

        const account = accountsResponse.accounts.find(a => a.id === fullCommentDetails.accountId);
        if (!account || !account.username) {
            return { status: 'completed', message: 'URL found, but username not found', commentUrl: ugcComment.commentUrl };
        }

        // 3. Boost with SMM API
        const boostResponse = await boostCommentLikes(ugcComment.commentUrl, account.username, 100);

        if (!boostResponse.ok) {
            return { status: 'completed', message: `URL found. Boost failed: ${boostResponse.error}`, commentUrl: ugcComment.commentUrl };
        }

        // 4. Update Database
        await prisma.scrapedVideo.update({
            where: { id: videoId },
            data: {
                boostOrderId: boostResponse.orderId?.toString(),
                boostStatus: 'ordered'
            }
        });

        revalidatePath('/');
        return { status: 'boosted', boosted: true, message: 'Boost ordered!', commentUrl: ugcComment.commentUrl };

    } catch (error) {
        console.error('Boost action error:', error);
        return { status: 'error', message: 'Internal error' };
    }
}

export async function checkManualCommentStatus(commentId: string) {
    try {
        const result = await getCommentStatus(commentId);
        if (result.ok) {
            return { success: true, status: result.status, commentUrl: result.commentUrl };
        } else {
            return { error: result.error || 'Failed to check status' };
        }
    } catch (error) {
        return { error: 'Failed to check status' };
    }
}

export async function boostManualComment(commentUrl: string, username: string, likes: number) {
    try {
        const result = await boostCommentLikes(commentUrl, username, likes);
        if (result.ok) {
            return { success: true, orderId: result.orderId };
        } else {
            return { error: result.error || 'Failed to boost comment' };
        }
    } catch (error) {
        return { error: 'Failed to boost comment' };
    }
}

export async function postAllComments() {
    try {
        const videos = await prisma.scrapedVideo.findMany({
            where: {
                isRelevant: true,
                generatedComment: { not: null },
                commentPosted: false, // or null
            }
        });

        if (videos.length === 0) return { success: true, count: 0 };

        let postedCount = 0;
        const postedIds: number[] = [];

        // We can run these in parallel or sequence. Sequence is safer for rate limits.
        for (const video of videos) {
            const result = await postCommentToVideo(video.id);
            if (result.success) {
                postedCount++;
                postedIds.push(video.id);
            }
        }

        revalidatePath('/');
        return { success: true, count: postedCount, postedIds };
    } catch (error) {
        console.error('Batch post error:', error);
        return { error: 'Batch post failed' };
    }
}

export async function boostAllReadyComments() {
    try {
        // Find videos that have been posted but not yet boosted
        const videos = await prisma.scrapedVideo.findMany({
            where: {
                commentPosted: true,
                commentStatus: 'completed', // Only boost if explicitly completed/verified
                boostOrderId: null
            }
        });

        if (videos.length === 0) return { success: true, boostedCount: 0, pendingCount: 0, results: [] };

        let boostedCount = 0;
        let pendingCount = 0;
        const results = [];

        for (const video of videos) {
            // Re-use our single boost logic which handles status checking
            const result = await boostComment(video.id);

            results.push({
                id: video.id,
                ...result
            });

            if (result.boosted) {
                boostedCount++;
            } else if (result.status !== 'error' && result.status !== 'failed') {
                // Pending, running, completed (but not boosted yet due to error?)
                // Actually if it is completed but failed to boost, we might not want to count strictly as pending forever?
                // But for now, let's treat non-final states as pending.
                pendingCount++;
            }
        }

        revalidatePath('/');
        return { success: true, boostedCount, pendingCount, results };
    } catch (error) {
        console.error('Batch boost error:', error);
        return { error: 'Batch boost failed' };
    }
}

export async function clearAllScrapedData() {
    try {
        await prisma.scrapedVideo.deleteMany({});
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Clear data error:', error);
        return { error: 'Failed to clear data' };
    }
}

export async function fetchUGCComments(accountId: string) {
    try {
        const result = await getComments({ accountIds: [accountId] });
        if (result.ok && result.comments) {
            return { success: true, comments: result.comments };
        } else {
            return { error: result.error || 'Failed to fetch comments' };
        }
    } catch (error) {
        return { error: 'Failed to fetch comments' };
    }
}

// New function to check status of posted comments before boosting
export async function checkAllPendingComments() {
    try {
        // Find videos with commentPosted=true but no commentUrl (or status not completed/failed)
        const videos = await prisma.scrapedVideo.findMany({
            where: {
                commentPosted: true,
                commentId: { not: null },
                commentStatus: { notIn: ['completed', 'failed'] } // Check pending or running
            }
        });

        if (videos.length === 0) {
            return { success: true, pendingCount: 0, completedCount: 0, results: [] };
        }

        let completedCount = 0;
        const results = [];

        for (const video of videos) {
            if (!video.commentId) continue;

            const statusRes = await getCommentStatus(video.commentId);
            let newStatus = video.commentStatus;
            let commentUrl = video.commentUrl;
            let errorMsg = null;

            if (statusRes.ok) {
                newStatus = statusRes.status || 'pending';
                if (newStatus === 'completed' && statusRes.commentUrl) {
                    commentUrl = statusRes.commentUrl;
                    completedCount++;
                } else if (newStatus === 'failed') {
                    errorMsg = statusRes.error;
                }

                // Update DB
                await prisma.scrapedVideo.update({
                    where: { id: video.id },
                    data: {
                        commentStatus: newStatus,
                        commentUrl: commentUrl
                    }
                });

                results.push({
                    id: video.id,
                    status: newStatus,
                    commentUrl: commentUrl,
                    error: errorMsg
                });
            } else {
                results.push({
                    id: video.id,
                    status: 'error_check',
                    error: statusRes.error
                });
            }
        }

        revalidatePath('/');
        return {
            success: true,
            pendingCount: videos.length - completedCount,
            completedCount,
            results
        };

    } catch (error) {
        console.error('Batch status check error:', error);
        return { error: 'Batch status check failed' };
    }
}
