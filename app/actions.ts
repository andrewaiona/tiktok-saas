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

export async function runScrape() {
    try {
        const targets = await prisma.monitoringTarget.findMany();
        let newVideosCount = 0;

        for (const target of targets) {
            let videos: ScrapedVideoData[] = [];
            if (target.type === 'HASHTAG') {
                videos = await scrapeHashtagVideos(target.value);
            } else if (target.type === 'USERNAME') {
                videos = await scrapeProfileVideos(target.value);
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
import { getComments } from '@/lib/ugc-api';

export async function boostComment(videoId: number) {
    try {
        const video = await prisma.scrapedVideo.findUnique({ where: { id: videoId } });
        if (!video) return { error: 'Video not found' };
        if (!video.commentId) return { error: 'No comment ID found. Has the comment been posted?' };

        // 1. Get Comment Details from UGC API to find the URL and Account ID
        const commentResponse = await getComments({ commentIds: [video.commentId] });
        if (!commentResponse.ok || !commentResponse.comments || commentResponse.comments.length === 0) {
            return { error: 'Failed to fetch comment details from UGC API' };
        }

        const ugcComment = commentResponse.comments[0];

        if (!ugcComment.commentUrl) {
            return { error: 'Comment URL not yet available. Please wait a moment until the comment is fully processed on TikTok.' };
        }

        // 2. Get Account Details to find the Username
        const accountsResponse = await getAccounts();
        if (!accountsResponse.ok || !accountsResponse.accounts) {
            return { error: 'Failed to fetch account details' };
        }

        const account = accountsResponse.accounts.find(a => a.id === ugcComment.accountId);
        if (!account || !account.username) {
            return { error: 'Could not find username for the account that posted the comment' };
        }

        // 3. Boost with SMM API
        const boostResponse = await boostCommentLikes(ugcComment.commentUrl, account.username, 100);

        if (!boostResponse.ok) {
            return { error: `Boosting failed: ${boostResponse.error}` };
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
        return { success: true };

    } catch (error) {
        console.error('Boost action error:', error);
        return { error: 'Internal server error during boosting' };
    }
}
