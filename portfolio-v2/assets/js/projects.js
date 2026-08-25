window.PORTFOLIO = {
  site: {
    name: "Hoyeon Choi",
    intro: "Sound, image, performance, code.",
    note: "음악, 이미지, 퍼포먼스와 코드를 오가며 작업합니다."
  },
  categories: [
    { id: "music", label: "Performance", path: "music/", description: "Jazz guitar, improvisation and live performance." },
    { id: "media-art", label: "Installation", path: "media-art/", description: "Audiovisual, spatial and interactive work." },
    { id: "photography", label: "Image", path: "photography/", description: "Portrait and photographic work." },
    { id: "film", label: "Moving Image", path: "film/", description: "Film, performance documentation and moving image." },
    { id: "web", label: "Web", path: "web/", description: "Browser-based and generative work." }
  ],
  projects: [
    {
      id: "jazz-live",
      title: "Selected Live Sessions",
      year: "2026",
      categories: ["music"],
      featured: true,
      status: "placeholder",
      summary: "Selected live performances and recordings centered on jazz guitar, improvisation and ensemble interaction.",
      medium: "Performance / sound",
      location: "Selected venues",
      aspect: "portrait",
      media: "https://www.esm.rochester.edu/uploads/Guitar-student-Jazz-Ensemble.jpg",
      mediaCredit: "Temporary reference image — Eastman School of Music"
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
      aspect: "wide",
      media: "https://medias.mutek.org/montreal/LeoLuna_AVISIONS-1_-5.jpg",
      mediaCredit: "Temporary reference image — MUTEK Montréal"
    },
    {
      id: "portrait-work",
      title: "Portrait Work",
      year: "2024–2026",
      categories: ["photography"],
      featured: true,
      status: "placeholder",
      summary: "Selected portraits, artist profiles and commissioned photography.",
      medium: "Photography",
      location: "Selected commissions",
      aspect: "portrait",
      media: "https://images.squarespace-cdn.com/content/v1/553e18a4e4b0e6185162fe59/3116a479-9b15-4c1a-8a72-6b10a26a1c4a/LuXu%281%29.jpg",
      mediaCredit: "Temporary reference image — Raine Magazine"
    },
    {
      id: "moving-image",
      title: "Moving Image",
      year: "2024–2026",
      categories: ["film"],
      featured: true,
      status: "placeholder",
      summary: "Selected cinematography, performance documentation and independently produced moving-image work.",
      medium: "Film / video",
      location: "Selected projects",
      aspect: "wide",
      media: "https://assets.st-note.com/production/uploads/images/27849442/rectangle_large_type_2_95920e8b07a79bd0be87e05b9f6837b3.jpg?width=1280",
      mediaCredit: "Temporary reference image"
    },
    {
      id: "dodrei",
      title: "DODREI",
      year: "2026",
      categories: ["web", "media-art"],
      featured: true,
      status: "active",
      summary: "An evolving browser-based image work built with p5.js.",
      medium: "p5.js / interactive web",
      location: "Web",
      aspect: "wide",
      media: "https://miro.medium.com/v2/resize%3Afit%3A2000/1%2A8fYmkdzRaT04ouzxk9lLFQ.png",
      mediaCredit: "Temporary p5.js reference image — Processing Foundation",
      launch: "/experiments/p5-media-lab/"
    }
  ]
};