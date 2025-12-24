export type ScrapedVideoData = {
    tiktokId: string;
    description: string;
    coverUrl: string;
    author: string;
    diggCount: number;
    commentCount: number;
    playCount: number;
    shareCount: number;
    createdAt: number; // Unix timestamp
    playUrl: string;
};

const BASE_URL = 'https://api.scrapecreators.com';

/**
 * Validates the API key.
 */
function getApiKey() {
    const key = process.env.SCRAPE_CREATORS_API_KEY;
    if (!key) {
        throw new Error('SCRAPE_CREATORS_API_KEY is not defined');
    }
    return key;
}

/**
 * Scrapes videos from a TikTok profile.
 */
export async function scrapeProfileVideos(handle: string, limit: number = 10): Promise<ScrapedVideoData[]> {
    const apiKey = getApiKey();
    const url = `${BASE_URL}/v3/tiktok/profile/videos?handle=${handle}&sort_by=latest`;

    try {
        const response = await fetch(url, {
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch profile videos: ${response.statusText}`);
        }

        const data = await response.json();
        const videos = (data.aweme_list || []).map((video: any) => ({
            tiktokId: video.aweme_id,
            description: video.desc,
            coverUrl: video.video?.cover?.url_list?.[0] || '',
            author: video.author?.unique_id || handle,
            diggCount: video.statistics?.digg_count || 0,
            commentCount: video.statistics?.comment_count || 0,
            playCount: video.statistics?.play_count || 0,
            shareCount: video.statistics?.share_count || 0,
            createdAt: video.create_time,
            playUrl: video.video?.play_addr?.url_list?.[0] || '',
        }));

        return videos.slice(0, limit);
    } catch (error) {
        console.error('Error in scrapeProfileVideos:', error);
        return [];
    }
}

/**
 * Scrapes videos by hashtag.
 */
export async function scrapeHashtagVideos(hashtag: string, limit: number = 10): Promise<ScrapedVideoData[]> {
    const apiKey = getApiKey();
    const url = `${BASE_URL}/v1/tiktok/search/hashtag?hashtag=${hashtag}&region=US`;

    try {
        const response = await fetch(url, {
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch hashtag videos: ${response.statusText}`);
        }

        const data = await response.json();
        const videos = (data.aweme_list || []).map((video: any) => ({
            tiktokId: video.aweme_id,
            description: video.desc,
            coverUrl: video.video?.cover?.url_list?.[0] || '',
            author: video.author?.unique_id || 'unknown',
            diggCount: video.statistics?.digg_count || 0,
            commentCount: video.statistics?.comment_count || 0,
            playCount: video.statistics?.play_count || 0,
            shareCount: video.statistics?.share_count || 0,
            createdAt: video.create_time,
            playUrl: video.video?.play_addr?.url_list?.[0] || '',
        }));

        return videos.slice(0, limit);
    } catch (error) {
        console.error('Error in scrapeHashtagVideos:', error);
        return [];
    }
}
