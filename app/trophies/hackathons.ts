// Weekends that ended with something on the table. Newest first.
export type Win = {
  event: string;
  when: string;
  location: string;
  // What was actually won. One weekend can produce more than one.
  awards: string[];
  // Omitted where the project never got a name of its own.
  project?: string;
  note: string;
  links: { label: string; href: string }[];
};

export const wins: Win[] = [
  {
    event: "DAHacks 4.0",
    when: "Nov 2025",
    location: "Cupertino, CA",
    awards: ["Director's Choice"],
    project: "ShieldOS",
    note: "Autonomous security platform. Real-time attack detection (DDoS, SQL injection) off Scapy packet sniffing, threat analysis by an LLM on Groq, and remediation that arrives as a GitHub pull request.",
    links: [
      { label: "devpost", href: "https://devpost.com/software/shieldos-0oylw6" },
      { label: "source", href: "https://github.com/n8thantran/dahacks25" },
    ],
  },
  {
    event: "CalHacks 12",
    when: "Oct 2025",
    location: "San Francisco, CA",
    awards: ["Best Use of JanitorAI"],
    project: "Clean Getaway",
    note: "A game about escaping a city by social engineering the AI agents running its NPCs.",
    links: [
      { label: "source", href: "https://github.com/iOliver678/calhacks12" },
      { label: "trailer", href: "https://youtu.be/JKwvzp-RNJs" },
    ],
  },
  {
    event: "Agent Foundry",
    when: "Aug 2025",
    location: "San Francisco, CA",
    awards: ["3rd place"],
    project: "OpsPilot",
    note: "Zero-configuration DevOps platform. Discovers repositories, wires up their deployment pipelines, and reports live infrastructure state across AWS and Terraform.",
    links: [
      {
        label: "source",
        href: "https://github.com/n8thantran/afore-ai-agents-hackathon",
      },
    ],
  },
  {
    event: "NVIDIA World's Shortest Hackathon",
    when: "Jul 2025",
    location: "San Francisco, CA",
    awards: ["Top 5 finalist"],
    project: "Juri",
    note: "Legal assistant for founders. Natural language Q&A, document processing, and generated filings, running on NVIDIA's Nemotron.",
    links: [
      { label: "source", href: "https://github.com/n8thantran/nvidia-agenthack-2025" },
    ],
  },
  {
    event: "Humane Tech Hackathon",
    when: "Jun 2025",
    location: "San Francisco, CA",
    awards: ["First Grand Prize"],
    note: "Live call transcription on VAPI webhooks: real-time audio processing, transcript management, and a dashboard to read the whole call back.",
    links: [
      { label: "source", href: "https://github.com/n8thantran/humane-tech-hackathon" },
    ],
  },
  {
    event: "SFHacks",
    when: "Apr 2025",
    location: "San Francisco, CA",
    awards: ["Best BioTech Hack", "People of Color Empowerment"],
    project: "fillosophy",
    note: "Agentic document workflows for first-gen immigrants facing medical paperwork. Upload a video explaining the situation and a RAG agent parses and fills the forms.",
    links: [
      { label: "devpost", href: "https://devpost.com/software/form-force" },
      { label: "source", href: "https://github.com/jask1m/fillosophy" },
    ],
  },
  {
    event: "HackHayward 2025",
    when: "Feb 2025",
    location: "Hayward, CA",
    awards: ["Best Multimodal Use of Groq"],
    project: "AVA",
    note: "Browser agent that navigates sites and finishes tasks from voice commands. Groq reads the DOM; PyGame renders the assistant's 3D model.",
    links: [
      { label: "devpost", href: "https://devpost.com/software/ava-zamdu0" },
      { label: "source", href: "https://github.com/n8thantran/HackHayward2025" },
    ],
  },
  {
    event: "Immerse the Bay 2024",
    when: "Nov 2024",
    location: "Stanford, CA",
    awards: [
      "Best Use of Amazon AWS",
      "Best Integration of AI",
      "Runner-up for Meta",
    ],
    project: "DreamScapes",
    note: "VR sandbox for voice-commanded 3D model generation. FLUX.1-schnell and TripoSR turn text into meshes in about 30 seconds, with Redis vector search caching assets and S3 serving them.",
    links: [
      { label: "devpost", href: "https://devpost.com/software/stellar-horizons" },
      { label: "source", href: "https://github.com/banyar-shin/DreamScapes" },
    ],
  },
];

export const awardCount = wins.reduce((total, win) => total + win.awards.length, 0);
