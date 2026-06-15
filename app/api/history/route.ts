import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const comfyUrl = req.nextUrl.searchParams.get("comfyUrl");
        if (!comfyUrl) {
            return NextResponse.json({ error: "comfyUrl parameter is required" }, { status: 400 });
        }

        const serverUrl = comfyUrl.replace(/\/$/, "");
        const historyRes = await fetch(`${serverUrl}/history`, {
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
        const items = [];

        for (const taskId of Object.keys(history)) {
            const entry = history[taskId];
            const outputs = entry.outputs || {};
            let videoUrl = "";
            let filename = "";

            // Find any output file
            for (const nodeId of Object.keys(outputs)) {
                const nodeOutput = outputs[nodeId];
                const filesList =
                    nodeOutput.gifs || nodeOutput.videos || nodeOutput.images || [];
                if (filesList.length > 0) {
                    const file = filesList[0];
                    filename = file.filename;
                    videoUrl = `${serverUrl}/view?filename=${encodeURIComponent(
                        file.filename
                    )}&subfolder=${encodeURIComponent(
                        file.subfolder || ""
                    )}&type=${file.type || "output"}`;
                    break;
                }
            }

            if (videoUrl) {
                let promptText = "";
                const promptData = entry.prompt;
                if (Array.isArray(promptData)) {
                    const nodes = promptData[2];
                    if (nodes && nodes["92:3"]?.inputs?.text) {
                        promptText = nodes["92:3"].inputs.text;
                    }
                } else if (promptData && promptData["92:3"]?.inputs?.text) {
                    promptText = promptData["92:3"].inputs.text;
                }

                // Try to get timestamp or execution time from status
                let timestamp = Date.now();
                if (entry.status?.completed_time) {
                    // completed_time is usually epoch time or ISO, let's parse safely
                    timestamp = Number(entry.status.completed_time) || Date.now();
                }

                items.push({
                    taskId,
                    prompt: promptText,
                    videoUrl,
                    filename,
                    timestamp,
                });
            }
        }

        // Sort items by timestamp descending (newest first)
        items.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json({ items });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[API /history]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
