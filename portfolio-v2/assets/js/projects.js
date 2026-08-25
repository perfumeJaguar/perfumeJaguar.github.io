window.PORTFOLIO = {
  site: {
    name: "Hoyeon Choi",
    intro: "Jazz guitarist, media artist, photographer and filmmaker working across sound, image, performance and interactive media.",
    note: "재즈 기타 연주를 기반으로 사진, 영상, 설치, 인터랙티브 웹 작업까지 매체를 확장해 왔습니다."
  },
  categories: [
    { id: "music", label: "Music", path: "music/", description: "Jazz guitar performance, live sessions, recordings and collaborative projects. 재즈 기타 연주와 공연, 녹음 및 협업 프로젝트." },
    { id: "media-art", label: "Media Art", path: "media-art/", description: "Audiovisual installation, performance and interactive work connecting moving image, sound and space. 영상, 사운드, 공간을 연결하는 설치 및 퍼포먼스 작업." },
    { id: "photography", label: "Photography", path: "photography/", description: "Portrait, artist and commissioned photography with an emphasis on people, atmosphere and restrained visual direction. 인물과 분위기를 중심으로 한 프로필 및 아티스트 사진 작업." },
    { id: "film", label: "Film", path: "film/", description: "Cinematography, artist documentation, performance video and independently produced moving-image work. 공연 및 작업 기록, 촬영, 독립 영상 작업." },
    { id: "web", label: "Web", path: "web/", description: "Browser-based artworks, p5.js projects and experimental interactive systems developed as an extension of audiovisual practice. p5.js를 비롯한 브라우저 기반 인터랙티브 작업." }
  ],
  projects: [
    {
      id: "jazz-live",
      title: "Jazz Guitar — Selected Live Sessions",
      year: "2026",
      categories: ["music"],
      featured: true,
      status: "placeholder",
      summary: "Selected live performances and recordings centered on jazz guitar, improvisation and ensemble interaction.",
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
      summary: "An audiovisual performance project developed with prepared piano, moving image, sound and stage design as one integrated system.",
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
      summary: "Selected portraits, artist profiles and commissioned photography focused on natural presence rather than heavily staged direction.",
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
      summary: "Selected cinematography, performance documentation and independently produced moving-image work.",
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
      summary: "An evolving browser-based image work built with p5.js, using rapid image replacement, cropping, feedback and interaction as compositional material.",
      medium: "p5.js / interactive web",
      location: "Web",
      aspect: "wide",
      launch: "/experiments/p5-media-lab/"
    }
  ]
};
