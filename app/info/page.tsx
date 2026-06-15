export default function InfoPage() {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <h1 className="text-sm font-semibold tracking-tight">TTV</h1>
                    <span className="text-xs text-muted ml-1">Script to Video</span>
                </div>
                <nav className="flex items-center gap-1 bg-background/50 p-0.5 rounded-lg border border-border">
                    <a href="/" className="px-3 py-1.5 text-xs font-medium text-muted rounded-md hover:text-foreground hover:bg-foreground/5">
                        Generator
                    </a>
                    <a href="/?tab=recents" className="px-3 py-1.5 text-xs font-medium text-muted rounded-md hover:text-foreground hover:bg-foreground/5">
                        Recents
                    </a>
                    <a href="/info" className="px-3 py-1.5 text-xs font-medium text-foreground bg-foreground/5 rounded-md">
                        Info
                    </a>
                </nav>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-10">
                    {/* Title */}
                    <div className="mb-10">
                        <h2 className="text-lg font-semibold mb-1">Project Synopsis</h2>
                        <p className="text-sm text-muted">
                            AI-Driven Script-to-Video Synthesis — Technical Overview
                        </p>
                    </div>

                    {/* Tech Stack */}
                    <section className="mb-10">
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Tech Stack</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <StackCard name="Python" desc="Primary language for AI development" tag="Language" />
                            <StackCard name="Next.js" desc="React framework for the web interface" tag="Frontend" />
                            <StackCard name="TensorFlow / PyTorch" desc="Deep learning frameworks for AI model training & inference" tag="ML Framework" />
                            <StackCard name="NLTK / spaCy" desc="NLP libraries for text processing, tokenization, POS tagging" tag="NLP" />
                            <StackCard name="OpenCV" desc="Real-time computer vision & frame manipulation" tag="Vision" />
                            <StackCard name="MoviePy" desc="Python video editing — cut, concat, overlay text" tag="Video" />
                            <StackCard name="FFmpeg" desc="Multimedia encoding, decoding & transcoding engine" tag="Video" />
                            <StackCard name="gTTS" desc="Google Text-to-Speech for voice narration" tag="TTS" />
                            <StackCard name="Tailwind CSS" desc="Utility-first CSS framework for styling" tag="Frontend" />
                        </div>
                    </section>

                    {/* Models & APIs */}
                    <section className="mb-10">
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Models & APIs</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <ModelCard
                                name="LLM (Large Language Model)"
                                desc="Performs tokenization, POS tagging, scene chunking, and prompt engineering for visual generation"
                                type="Text Processing"
                            />
                            <ModelCard
                                name="GAN-based Video Models"
                                desc="Generative Adversarial Networks used for AI-driven video frame synthesis"
                                type="Video Generation"
                            />
                            <ModelCard
                                name="Google TTS (gTTS)"
                                desc="Converts script text into natural-sounding voice narration via Google Translate API"
                                type="Text-to-Speech"
                            />
                            <ModelCard
                                name="Pexels / Unsplash APIs"
                                desc="Stock media platforms for fetching royalty-free images and video clips matching the script"
                                type="Media Retrieval"
                            />
                            <ModelCard
                                name="Replicate API"
                                desc="Cloud inference for video generation models like minimax/video-01-live, hunyuan-video"
                                type="Inference"
                            />
                            <ModelCard
                                name="NER (Named Entity Recognition)"
                                desc="Detects names, locations, organizations in script for accurate scene imagery"
                                type="NLP"
                            />
                        </div>
                    </section>

                    {/* System Pipeline */}
                    <section className="mb-10">
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">System Pipeline</h3>
                        <div className="border border-border rounded-lg overflow-hidden">
                            {pipelineSteps.map((step, i) => (
                                <div key={i} className={`flex items-start gap-4 px-5 py-4 ${i !== pipelineSteps.length - 1 ? 'border-b border-border' : ''}`}>
                                    <span className="text-xs font-mono text-muted mt-0.5 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                    <div>
                                        <p className="text-sm font-medium">{step.title}</p>
                                        <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Applications */}
                    <section className="mb-10">
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Applications</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {applications.map((app, i) => (
                                <div key={i} className="border border-border rounded-lg px-4 py-3">
                                    <p className="text-xs font-medium">{app.area}</p>
                                    <p className="text-xs text-muted mt-1">{app.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Advantages & Limitations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                        <section>
                            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Advantages</h3>
                            <ul className="space-y-2">
                                {['Saves time and cost', 'Easy to use', 'Fully automated pipeline', 'Scalable architecture'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span className="w-1 h-1 rounded-full bg-foreground shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Limitations</h3>
                            <ul className="space-y-2">
                                {['Limited creative control', 'Depends on dataset quality', 'Internet dependency for APIs', 'Model inference latency'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span className="w-1 h-1 rounded-full bg-muted shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Future Enhancements */}
                    <section className="mb-10">
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Future Enhancements</h3>
                        <div className="flex flex-wrap gap-2">
                            {['AI Avatars', 'Multilingual Support', 'Real-time Video Generation', 'Emotion-based Voice', 'Custom Character Design'].map((item, i) => (
                                <span key={i} className="px-3 py-1.5 text-xs font-medium border border-border rounded-full">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

/* ---- Sub-components ---- */

function StackCard({ name, desc, tag }: { name: string; desc: string; tag: string }) {
    return (
        <div className="border border-border rounded-lg px-4 py-3.5">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium">{name}</p>
                <span className="text-[10px] font-mono text-muted bg-background px-1.5 py-0.5 rounded">{tag}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{desc}</p>
        </div>
    );
}

function ModelCard({ name, desc, type }: { name: string; desc: string; type: string }) {
    return (
        <div className="border border-border rounded-lg px-4 py-3.5">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium">{name}</p>
                <span className="text-[10px] font-mono text-muted bg-background px-1.5 py-0.5 rounded">{type}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{desc}</p>
        </div>
    );
}

/* ---- Data ---- */

const pipelineSteps = [
    { title: "Input Module", desc: "Accepts text script from the user" },
    { title: "Text Processing (NLP)", desc: "Tokenization, POS tagging, Named Entity Recognition via LLM" },
    { title: "Keyword Extraction", desc: "Identifies key visual terms and entities from the script" },
    { title: "Scene Generator", desc: "Divides script into logical scene chunks with storyboard prompts" },
    { title: "Media Retrieval", desc: "Fetches matching images/videos from Pexels & Unsplash APIs" },
    { title: "Text-to-Speech", desc: "Generates voice narration using gTTS (Google Text-to-Speech)" },
    { title: "Subtitle Generator", desc: "Creates time-synchronized captions for the narration" },
    { title: "Video Assembly", desc: "Combines all elements via MoviePy & FFmpeg into the final video" },
];

const applications = [
    { area: "Education", desc: "Convert lecture notes into video lessons" },
    { area: "Marketing", desc: "Create promotional videos" },
    { area: "Social Media", desc: "Generate reels and short videos" },
    { area: "News Industry", desc: "Convert articles into video summaries" },
    { area: "E-learning", desc: "Automate content creation at scale" },
    { area: "Content Creation", desc: "Script-first video production workflow" },
];
