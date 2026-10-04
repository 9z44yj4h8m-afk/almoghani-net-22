export type Channel = {
  id: string;
  name: string;
  category: "سعودية" | "رياضية" | "إسلامية" | "إخبارية" | "مسلسلات وأفلام";
  youtubeId: string;
  thumbnail: string;
  description: string;
};

export const channels: Channel[] = [
  {
    id: "aljazeera",
    name: "قناة الجزيرة",
    category: "إخبارية",
    youtubeId: "bNyUyrR0PHo",
    thumbnail: "https://i.ytimg.com/vi/bNyUyrR0PHo/hqdefault.jpg",
    description: "التغطية مستمرة على مدار الساعة",
  },
  {
    id: "alarabiya",
    name: "قناة العربية",
    category: "إخبارية",
    youtubeId: "n7eQejkXbnM",
    thumbnail: "https://i.ytimg.com/vi/n7eQejkXbnM/hqdefault.jpg",
    description: "آخر الأخبار والعواجل لحظة بلحظة",
  },
  {
    id: "saudi-quran",
    name: "قناة القرآن الكريم",
    category: "إسلامية",
    youtubeId: "eC4LfEVxvKg",
    thumbnail: "https://i.ytimg.com/vi/eC4LfEVxvKg/hqdefault.jpg",
    description: "بث مباشر من مكة المكرمة",
  },
  {
    id: "alhadath",
    name: "قناة الحدث",
    category: "إخبارية",
    youtubeId: "au8t81S0tag",
    thumbnail: "https://i.ytimg.com/vi/au8t81S0tag/hqdefault.jpg",
    description: "البث الإخباري المباشر لقناة الحدث",
  },
  {
    id: "saudi-news",
    name: "قناة الإخبارية",
    category: "سعودية",
    youtubeId: "iw0YDBYgaUU",
    thumbnail: "https://i.ytimg.com/vi/iw0YDBYgaUU/hqdefault.jpg",
    description: "البث المباشر لقناة الإخبارية السعودية",
  },
  {
    id: "alarabiya-business",
    name: "العربية Business",
    category: "إخبارية",
    youtubeId: "iHr7P4kZYrk",
    thumbnail: "https://i.ytimg.com/vi/iHr7P4kZYrk/hqdefault.jpg",
    description: "أخبار الاقتصاد والأسواق والأعمال مباشرة",
  },
  {
    id: "france24-arabic",
    name: "فرانس 24 عربي",
    category: "إخبارية",
    youtubeId: "93g513Uth98",
    thumbnail: "https://i.ytimg.com/vi/93g513Uth98/hqdefault.jpg",
    description: "الأخبار الدولية على مدار الساعة",
  },
  {
    id: "saudi-sports",
    name: "القناة الرياضية السعودية",
    category: "رياضية",
    youtubeId: "TK1XWtPXj6w",
    thumbnail: "https://i.ytimg.com/vi/TK1XWtPXj6w/hqdefault.jpg",
    description: "القناة الرياضية السعودية الأولى — بث مباشر",
  },
  {
    id: "bein-sports",
    name: "beIN SPORTS",
    category: "رياضية",
    youtubeId: "ekMxMIexsJ8",
    thumbnail: "https://i.ytimg.com/vi/ekMxMIexsJ8/hqdefault.jpg",
    description: "بث مباشر من بي إن سبورتس",
  },
  {
    id: "bein-news",
    name: "beIN SPORTS الإخبارية",
    category: "إخبارية",
    youtubeId: "2lJZPT6OljI",
    thumbnail: "https://i.ytimg.com/vi/2lJZPT6OljI/hqdefault.jpg",
    description: "قناة بي إن سبورتس الإخبارية — بث مباشر",
  },
  {
    id: "asharq-bloomberg",
    name: "تلفزيون الشرق بلومبرغ",
    category: "إخبارية",
    youtubeId: "f6VpkfV7m4Y",
    thumbnail: "https://i.ytimg.com/vi/f6VpkfV7m4Y/hqdefault.jpg",
    description: "أخبار الاقتصاد والأسواق مباشرة",
  },
  {
    id: "sky-news-arabia",
    name: "سكاي نيوز عربية",
    category: "إخبارية",
    youtubeId: "ppgTP8xQQsM",
    thumbnail: "https://i.ytimg.com/vi/ppgTP8xQQsM/hqdefault.jpg",
    description: "البث المباشر لقناة سكاي نيوز عربية",
  },
  {
    id: "shabab-albomb",
    name: "مسلسل شباب البومب",
    category: "مسلسلات وأفلام",
    youtubeId: "Pj6ks4vaVG0",
    thumbnail: "https://i.ytimg.com/vi/Pj6ks4vaVG0/hqdefault.jpg",
    description: "بث مباشر لمسلسل شباب البومب — هلا بالعيال",
  },
  {
    id: "sen-anlat-karadeniz",
    name: "مسلسل البحر الأسود",
    category: "مسلسلات وأفلام",
    youtubeId: "tW_78_pmCo4",
    thumbnail: "https://i.ytimg.com/vi/tW_78_pmCo4/hqdefault.jpg",
    description: "بث مباشر لمسلسل البحر الأسود — Sen Anlat Karadeniz",
  },
];
