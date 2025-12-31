export async function postComment(
    accountId: string,
    postUrl: string,
    commentText: string
): Promise<{ ok: boolean; commentId?: string; error?: string }> {
    const apiKey = process.env.UGC_API_KEY;

    if (!apiKey) {
        return { ok: false, error: 'UGC_API_KEY not configured' };
    }

    try {
        console.log('Posting comment with:', { accountId, postUrl, commentText: commentText.substring(0, 50) });

        const response = await fetch('https://api.ugc.inc/comment/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountId,
                postUrl,
                commentText
            })
        });

        console.log('Response status:', response.status, response.statusText);

        // Check if response has content before parsing
        const text = await response.text();

        console.log('UGC Post Comment API Response:', text.substring(0, 300)); // Debug log

        if (!text || text.trim() === '') {
            // Check if it's a 500 error
            if (response.status === 500) {
                return {
                    ok: false,
                    error: 'UGC API server error (500). The account may not have permission to comment on this video, or the video may be restricted.'
                };
            }

            return {
                ok: false,
                error: 'UGC API returned empty response. Check your API key and account ID.'
            };
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse UGC API response:', text);
            return {
                ok: false,
                error: `Invalid API response. Make sure your UGC Account ID is correct (not placeholder).`
            };
        }

        // UGC API returns { code: 200, data: {...} } instead of { ok: true, data: {...} }
        if (data.code === 200 && data.data?.commentId) {
            return { ok: true, commentId: data.data.commentId };
        } else {
            return { ok: false, error: data.message || 'Failed to post comment' };
        }
    } catch (error) {
        console.error('UGC API error:', error);
        return { ok: false, error: (error as Error).message };
    }
}

export async function getCommentStatus(commentId: string): Promise<{
    ok: boolean;
    status?: string;
    commentUrl?: string;
    error?: string;
    message?: string;
}> {
    const result = await getComments({ commentIds: [commentId] });

    if (result.ok && result.comments && result.comments.length > 0) {
        const comment = result.comments[0];
        return {
            ok: true,
            status: comment.status,
            commentUrl: comment.commentUrl || undefined,
            error: comment.error || undefined
        };
    } else {
        return {
            ok: false,
            error: result.error || 'Comment not found or failed to fetch status'
        };
    }
}

export type UGCAccount = {
    id: string;
    type: string;
    username: string | null;
    nick_name: string | null;
    status: string;
};

export async function getAccounts(): Promise<{
    ok: boolean;
    accounts?: UGCAccount[];
    error?: string;
}> {
    const apiKey = process.env.UGC_API_KEY;

    if (!apiKey) {
        return { ok: false, error: 'UGC_API_KEY not configured' };
    }

    try {
        const response = await fetch('https://api.ugc.inc/accounts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'setup'
            })
        });

        const text = await response.text();

        console.log('UGC Accounts API Response:', text.substring(0, 200)); // Debug log

        if (!text || text.trim() === '') {
            return { ok: false, error: 'UGC API returned empty response' };
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            return { ok: false, error: 'Invalid API response' };
        }

        // UGC API returns { code: 200, data: [...] } instead of { ok: true, data: [...] }
        if (data.code === 200 && Array.isArray(data.data)) {
            return { ok: true, accounts: data.data };
        } else {
            return { ok: false, error: data.message || 'Failed to fetch accounts' };
        }
    } catch (error) {
        console.error('UGC API error:', error);
        return { ok: false, error: (error as Error).message };
    }
}
export type UGCComment = {
    id: string;
    accountId: string;
    postUrl: string;
    commentText: string;
    status: string;
    commentUrl: string | null;
    error: string | null;
    createdAt: string;
    completedAt: string | null;
};

export async function getComments(params: {
    commentIds?: string[];
    accountIds?: string[];
    tag?: string;
}): Promise<{ ok: boolean; comments?: UGCComment[]; error?: string }> {
    const apiKey = process.env.UGC_API_KEY;

    if (!apiKey) {
        return { ok: false, error: 'UGC_API_KEY not configured' };
    }

    try {
        const response = await fetch('https://api.ugc.inc/comment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const text = await response.text();

        if (!text || text.trim() === '') {
            return { ok: false, error: 'UGC API returned empty response' };
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return { ok: false, error: 'Invalid API response json' };
        }

        if (data.code === 200 && Array.isArray(data.data)) {
            return { ok: true, comments: data.data };
        } else {
            return { ok: false, error: data.message || 'Failed to fetch comments' };
        }
    } catch (error) {
        console.error('UGC API error:', error);
        return { ok: false, error: (error as Error).message };
    }
}
