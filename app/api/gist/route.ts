import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const gistId = process.env.NEXT_PUBLIC_GIST_ID || "f401dd8cadb19f27a486bf4615aa1677";
        const token = process.env.GIST_GITHUB_TOKEN;
        
        const headers: any = {
            'Accept': 'application/vnd.github.v3+json',
        };
        
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        
        const res = await fetch(`https://api.github.com/gists/${gistId}`, { 
            headers,
            cache: 'no-store' 
        });
        
        if (!res.ok) {
            const errData = await res.text();
            console.error("Gist fetch error:", res.status, errData);
            return NextResponse.json({ error: 'Failed to fetch Gist' }, { status: res.status });
        }
        
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
