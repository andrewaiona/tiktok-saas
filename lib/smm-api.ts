// AmazingSMM API Client for TikTok Comment Likes

export async function boostCommentLikes(
    videoUrl: string,
    username: string,
    quantity: number
): Promise<{ ok: boolean; orderId?: number; error?: string }> {
    const apiKey = process.env.SMM_API_KEY;
    const serviceId = process.env.SMM_SERVICE_ID;

    if (!apiKey || !serviceId) {
        return { ok: false, error: 'SMM API not configured' };
    }

    try {
        const response = await fetch('https://amazingsmm.com/api/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                key: apiKey,
                action: 'add',
                service: serviceId,
                link: videoUrl,
                quantity: quantity.toString(),
                username: username
            })
        });

        const data = await response.json();

        if (data.order) {
            return { ok: true, orderId: data.order };
        } else if (data.error) {
            return { ok: false, error: data.error };
        } else {
            return { ok: false, error: 'Unknown error from SMM API' };
        }
    } catch (error) {
        console.error('SMM API error:', error);
        return { ok: false, error: (error as Error).message };
    }
}

export async function getBoostOrderStatus(orderId: number): Promise<{
    ok: boolean;
    status?: string;
    charge?: string;
    remains?: string;
    error?: string;
}> {
    const apiKey = process.env.SMM_API_KEY;

    if (!apiKey) {
        return { ok: false, error: 'SMM API not configured' };
    }

    try {
        const response = await fetch('https://amazingsmm.com/api/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                key: apiKey,
                action: 'status',
                order: orderId.toString()
            })
        });

        const data = await response.json();

        if (data.status) {
            return {
                ok: true,
                status: data.status,
                charge: data.charge,
                remains: data.remains
            };
        } else if (data.error) {
            return { ok: false, error: data.error };
        } else {
            return { ok: false, error: 'Unknown error from SMM API' };
        }
    } catch (error) {
        console.error('SMM API error:', error);
        return { ok: false, error: (error as Error).message };
    }
}
