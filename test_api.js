const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function test() {
    const instituteId = '699098a96efcaf26224df245';
    const userId = '699843d1faf9634cc57ca1a3';
    const url = `http://localhost:3000/api/assignments?instituteId=${instituteId}&role=GUARDIAN&userId=${userId}`;

    console.log('Testing URL:', url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
