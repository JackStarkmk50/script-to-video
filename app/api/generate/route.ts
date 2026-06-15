import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Load the workflow JSON once at startup
const WORKFLOW_PATH = join(process.cwd(), "app", "api", "generate", "workflow.json");
const BASE_WORKFLOW = JSON.parse(readFileSync(WORKFLOW_PATH, "utf-8"));

// The positive prompt node ID in the LTX-2 workflow
const POSITIVE_PROMPT_NODE = "92:3";
const FRAMES_NODE = "92:62";

/**
 * POST /api/generate
 *
 * Submits a prompt to Server or polls for completion.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { script, comfyUrl, poll, taskId, frames, aspectRatio } = body;

        const serverUrl = (comfyUrl || "http://127.0.0.1:8188").replace(/\/$/, "");
        const RESOLUTION_NODE = "92:89";

        // --- POLLING ---
        if (poll && taskId) {
            // Check history first (means it finished)
            const historyRes = await fetch(`${serverUrl}/history/${taskId}`, {
                method: "GET",
                cache: "no-store",
            });
            if (!historyRes.ok) {
                return NextResponse.json(
                    { error: `Server history request failed (${historyRes.status})` },
                    { status: historyRes.status }
                );
            }
            const history = await historyRes.json();

            if (history && history[taskId]) {
                const outputs = history[taskId].outputs || {};

                // Search every node output for video/gif/image files
                for (const nodeId of Object.keys(outputs)) {
                    const nodeOutput = outputs[nodeId];
                    const filesList =
                        nodeOutput.gifs || nodeOutput.videos || nodeOutput.images || [];
                    if (filesList.length > 0) {
                        const file = filesList[0];
                        const videoUrl = `${serverUrl}/view?filename=${encodeURIComponent(
                            file.filename
                        )}&subfolder=${encodeURIComponent(
                            file.subfolder || ""
                        )}&type=${file.type || "output"}`;
                        return NextResponse.json({ videoUrl, status: "completed" });
                    }
                }

                return NextResponse.json({
                    error: "Workflow finished but no output video was found in history.",
                    status: "failed",
                });
            }

            // Not in history yet – check the queue
            const queueRes = await fetch(`${serverUrl}/queue`, {
                method: "GET",
                cache: "no-store",
            });
            if (queueRes.ok) {
                const queue = await queueRes.json();
                const inRunning = (queue.queue_running || []).some(
                    (item: any) => item[1] === taskId
                );
                const inPending = (queue.queue_pending || []).some(
                    (item: any) => item[1] === taskId
                );
                if (inRunning) {
                    return NextResponse.json({ status: "running", taskId });
                }
                if (inPending) {
                    return NextResponse.json({ status: "queued", taskId });
                }
            }

            // Not found anywhere yet; tell the client to keep waiting
            return NextResponse.json({ status: "queued", taskId });
        }

        // --- SUBMIT WORKFLOW ---
        if (!script || !script.trim()) {
            return NextResponse.json({ error: "Script / prompt is required." }, { status: 400 });
        }

        // Deep-clone the base workflow and inject the user's prompt + frames + resolution
        const workflow = JSON.parse(JSON.stringify(BASE_WORKFLOW));
        if (workflow[POSITIVE_PROMPT_NODE]?.inputs) {
            workflow[POSITIVE_PROMPT_NODE].inputs.text = script.trim();
        }
        if (workflow[FRAMES_NODE]?.inputs && frames) {
            workflow[FRAMES_NODE].inputs.value = Number(frames);
        }
        if (workflow[RESOLUTION_NODE]?.inputs) {
            if (aspectRatio === "portrait") {
                workflow[RESOLUTION_NODE].inputs.width = 720;
                workflow[RESOLUTION_NODE].inputs.height = 1280;
            } else {
                workflow[RESOLUTION_NODE].inputs.width = 1280;
                workflow[RESOLUTION_NODE].inputs.height = 720;
            }
        }

        const promptRes = await fetch(`${serverUrl}/prompt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: workflow }),
            cache: "no-store",
        });

        if (!promptRes.ok) {
            const errText = await promptRes.text();
            return NextResponse.json(
                { error: `Server error: ${errText}` },
                { status: promptRes.status }
            );
        }

        const promptData = await promptRes.json();
        const promptId = promptData.prompt_id;

        if (!promptId) {
            return NextResponse.json(
                { error: "Server did not return a prompt_id." },
                { status: 500 }
            );
        }

        return NextResponse.json({ taskId: promptId, status: "queued" });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[API /generate]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
