import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/video?url=...
 * Proxies a video stream for in-browser playback (no Content-Disposition attachment).
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

        return new NextResponse(blob, {
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "video/mp4",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error streaming video";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
