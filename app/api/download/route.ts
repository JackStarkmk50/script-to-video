import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download?url=...
 * Proxies a video download with a datetime-based filename.
 */
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch video");
        const blob = await response.blob();

        // Generate datetime-based filename: 2026-06-15_153549.mp4
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.mp4`;

        return new NextResponse(blob, {
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "video/mp4",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error downloading video";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
