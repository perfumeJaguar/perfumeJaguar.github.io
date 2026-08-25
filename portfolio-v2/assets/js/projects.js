window.PORTFOLIO = {
  site: {
    name: "Hoyeon Choi",
    intro: "Musician, media artist, photographer and filmmaker.",
    note: "Selected work across sound, image, performance and the web."
  },
  categories: [
    { id: "music", label: "Music", path: "music/", description: "Jazz guitar, performance, recordings and selected live video." },
    { id: "media-art", label: "Media Art", path: "media-art/", description: "Installation, audiovisual work, performance and interactive media." },
    { id: "photography", label: "Photography", path: "photography/", description: "Portrait, artist and commissioned photography." },
    { id: "film", label: "Film", path: "film/", description: "Moving-image work, documentation and commissioned video." },
    { id: "web", label: "Web", path: "web/", description: "Browser-based artworks, p5.js projects and experiments." }
  ],
  projects: [
    {
      id: "jazz-live",
      title: "Jazz Guitar — Selected Live Sessions",
      year: "2026",
      categories: ["music"],
      featured: true,
      status: "placeholder",
      summary: "Performance profile, selected live video and recording material.",
      medium: "Jazz guitar / performance / video",
      location: "Selected venues",
      aspect: "wide"
    },
    {
      id: "scenes",
      title: "Scenes",
      year: "2025",
      categories: ["media-art", "music", "film"],
      featured: true,
      status: "placeholder",
      summary: "Audiovisual performance and installation project combining sound, moving image and live performance.",
      medium: "Audiovisual / performance / installation",
      location: "Project documentation",
      aspect: "wide"
    },
    {
      id: "portrait-work",
      title: "Portrait Work",
      year: "2024–2026",
      categories: ["photography"],
      featured: true,
      status: "placeholder",
      summary: "Selected portrait and artist photography.",
      medium: "Photography",
      location: "Selected commissions",
      aspect: "portrait"
    },
    {
      id: "moving-image",
      title: "Moving Image — Selected Work",
      year: "2024–2026",
      categories: ["film"],
      featured: true,
      status: "placeholder",
      summary: "Selected cinematography, documentation and moving-image work.",
      medium: "Film / video",
      location: "Selected projects",
      aspect: "wide"
    },
    {
      id: "dodrei",
      title: "DODREI",
      year: "2026",
      categories: ["web", "media-art"],
      featured: true,
      status: "active",
      summary: "Browser-based interactive image work developed as an evolving web artwork.",
      medium: "p5.js / interactive web",
      location: "Web",
      aspect: "wide",
      launch: "/experiments/p5-media-lab/"
    }
  ]
};
