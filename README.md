# TTV: Script-to-Video Synthesis Interface

TTV is a sleek, AI-driven Next.js web interface designed to streamline video generation using a local or remote **ComfyUI** backend running **LTX-2** models. With this interface, you can write script-based prompts, customize aspect ratios and frame lengths, watch renders live, and access history in a modern web app.

---

## 🚀 Key Features

* **Interactive Generator**: Write prompts and scene descriptions with optional custom `[SOUND]` markers.
* **Aspect Ratio Selection**: Toggle between **Landscape (16:9 - 1280x720)** and **Portrait (9:16 - 720x1280)** output.
* **Custom Frame Length**: Dynamically adjust frame generation count (e.g. `108 frames ≈ 4.5s`, `240 frames ≈ 10s` at 24fps).
* **CORS-Free Video Streaming**: Built-in backend video streaming proxy (`/api/video`) resolves ngrok CORS policies for smooth inline browser playback.
* **Datetime-Based Downloads**: Auto-names downloads with user-friendly timestamps (e.g., `2026-06-15_155349.mp4`).
* **Recent Generations Tab**: A dedicated history feed fetched directly from the ComfyUI Server history, showing cards with prompts, generation times, and direct download links.
* **Native Full Screen**: Expand both landscape and portrait outputs to full-screen mode directly from the player.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (React, Tailwind CSS, Client Hooks)
* **Backend API**: Next.js API Routes (Route Handlers for proxying video streaming, downloads, history, and workflow submission)
* **AI Engine backend**: ComfyUI (running LTX-2 workflow)

---

## 📦 Getting Started

### Prerequisites

1. A running **ComfyUI** instance (local or exposed via `ngrok`).
2. Make sure the LTX-2 workflow dependencies are installed on the ComfyUI instance.

### Installation

1. Clone or copy the repository files.
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Routes Overview

* **`POST /api/generate`**: Submits a prompt, frame length, and aspect ratio configuration to the ComfyUI server. Also acts as the polling endpoint to track progress.
* **`GET /api/video?url=<comfyui_view_url>`**: Streams the output video directly through the Next.js server to bypass CORS problems in the browser player.
* **`GET /api/download?url=<comfyui_view_url>`**: Proxies the file download, setting the `Content-Disposition` header to output formatted datetime filenames.
* **`GET /api/history?comfyUrl=<server_url>`**: Fetches all execution logs from the ComfyUI server history, parses prompts from node `92:3`, and returns them sorted by generation time.
