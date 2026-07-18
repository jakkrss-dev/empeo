import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const githubToken = process.env.GIST_GITHUB_TOKEN;
    
    if (!githubToken) {
      return NextResponse.json({ error: 'ไม่พบ GIST_GITHUB_TOKEN ในระบบ Vercel' }, { status: 500 });
    }
    
    // สั่งปลุกบอทบน GitHub Actions
    const res = await fetch("https://api.github.com/repos/jakkrss-dev/empeo/dispatches", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event_type: "trigger-sync" })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub API Error: ${res.status} ${errorText}`);
    }
    
    return NextResponse.json({ success: true, message: 'สั่งรันบอทบน Cloud สำเร็จ! บอทกำลังทำงาน...' });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการสั่งรันบอท' }, { status: 500 });
  }
}
