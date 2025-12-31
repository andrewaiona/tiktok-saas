
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.UGC_API_KEY;
const commentId = '716ccdf3-3b83-4941-be16-4c8f0ca6a067'; // ID from recent logs

async function test() {
    console.log('Testing UGC API Status for ID:', commentId);
    console.log('API Key configured:', !!apiKey);

    try {
        const response = await fetch('https://api.ugc.inc/comment/status', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ commentId })
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
