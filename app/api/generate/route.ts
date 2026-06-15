import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import MagicHour from "magic-hour";

/**
 * POST /api/generate
 * 
 * Proxies requests to either Replicate or Magic Hour based on user selection.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { apiKey, script, model, platform, poll, taskId } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API key is required." }, { status: 400 });
        }

        // --- MAGIC HOUR PLATFORM ---
        if (platform === "magic-hour") {
            const client = new MagicHour({ token: apiKey });

            if (poll && taskId) {
                const prediction = await client.v1.textToVideo.get(taskId);
                if (prediction.status === "completed" && prediction.videoUrl) {
                    return NextResponse.json({ videoUrl: prediction.videoUrl, status: "completed" });
                }
                if (prediction.status === "failed") {
                    return NextResponse.json({ error: "Magic Hour generation failed.", status: "failed" });
                }
                return NextResponse.json({ status: prediction.status, taskId: prediction.id });
            }

            // Create
            const res = await client.v1.textToVideo.generate({
                style: { prompt: script },
                endSeconds: 15,
            });
            return NextResponse.json({ taskId: res.id, status: res.status });
        }

        // --- REPLICATE PLATFORM (Default) ---
        const replicate = new Replicate({ auth: apiKey });

        if (poll && taskId) {
            const prediction = await replicate.predictions.get(taskId);
            if (prediction.status === "succeeded") {
                return NextResponse.json({
                    videoUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
                    status: "completed"
                });
            }
            if (prediction.status === "failed" || prediction.status === "canceled") {
                return NextResponse.json({ error: prediction.error || "Replicate failed.", status: "failed" });
            }
            return NextResponse.json({ status: prediction.status, taskId: prediction.id });
        }

        // Create
        const targetModel = model || "pixverse/pixverse-v6";
        const prediction = await replicate.predictions.create({
            model: targetModel,
            input: {
                prompt: script,
                quality: "1080p",
                duration: 15,
                generate_audio_switch: true,
                generate_multi_clip_switch: true
            },
        });

        if (prediction.error) return NextResponse.json({ error: prediction.error }, { status: 500 });
        return NextResponse.json({ taskId: prediction.id, status: prediction.status });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[API /generate]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
