import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

/**
 * POST /api/generate
 * 
 * Proxies requests to Replicate using the official SDK.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { apiKey, script, model, poll, taskId } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API key is required." }, { status: 400 });
        }

        const replicate = new Replicate({
            auth: apiKey,
        });

        // --- Polling/Retrieval mode ---
        if (poll && taskId) {
            const prediction = await replicate.predictions.get(taskId);

            if (prediction.status === "succeeded") {
                return NextResponse.json({
                    videoUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
                    status: "completed"
                });
            }

            if (prediction.status === "failed" || prediction.status === "canceled") {
                return NextResponse.json({
                    error: prediction.error || "Prediction failed.",
                    status: "failed",
                });
            }

            return NextResponse.json({
                status: prediction.status,
                taskId: prediction.id,
            });
        }

        // --- Create prediction mode ---
        if (!script) {
            return NextResponse.json({ error: "Script is required." }, { status: 400 });
        }

        const targetModel = model || "pixverse/pixverse-v6";

        // Start prediction
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

        if (prediction.error) {
            return NextResponse.json({ error: prediction.error }, { status: 500 });
        }

        // Return task ID for polling
        return NextResponse.json({
            taskId: prediction.id,
            status: prediction.status,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[API /generate]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
