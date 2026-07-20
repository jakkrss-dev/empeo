import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const token = process.env.GIST_GITHUB_TOKEN;
        
        const headers: any = {
            'Accept': 'application/vnd.github.v3+json',
        };
        
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        
        // Fetch the latest workflow run for the repository_dispatch event
        const res = await fetch(`https://api.github.com/repos/jakkrss-dev/empeo/actions/runs?event=repository_dispatch&per_page=1`, { 
            headers,
            cache: 'no-store' 
        });
        
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch action status' }, { status: res.status });
        }
        
        const data = await res.json();
        if (data.workflow_runs && data.workflow_runs.length > 0) {
            const run = data.workflow_runs[0];
            return NextResponse.json({
                id: run.id,
                status: run.status,
                conclusion: run.conclusion,
                updated_at: run.updated_at
            });
        }
        
        return NextResponse.json({ status: 'unknown' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
