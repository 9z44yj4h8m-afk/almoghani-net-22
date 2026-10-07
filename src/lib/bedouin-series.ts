import art0 from "@/assets/bedouin-drama/JiFBbINrPVU.jpg.asset.json";
import art1 from "@/assets/bedouin-drama/Vi9b1vICSKc.jpg.asset.json";
import art2 from "@/assets/bedouin-drama/Our8cMYbabU.jpg.asset.json";
import art3 from "@/assets/bedouin-drama/hovJQahDKYc.jpg.asset.json";
import art4 from "@/assets/bedouin-drama/4T49jwNODaY.jpg.asset.json";
import art5 from "@/assets/bedouin-drama/t73vq7kH7r8.jpg.asset.json";
import art6 from "@/assets/bedouin-drama/n0LkfGSzYs4.jpg.asset.json";
import art7 from "@/assets/bedouin-drama/ttt3F5XcE78.jpg.asset.json";
import art8 from "@/assets/bedouin-drama/_fZZvOwy-XA.jpg.asset.json";
import art9 from "@/assets/bedouin-drama/PuVtWhhdfdw.jpg.asset.json";
import art10 from "@/assets/bedouin-drama/27HWjqDmAKs.jpg.asset.json";
import art11 from "@/assets/bedouin-drama/4NxyeTBliQU.jpg.asset.json";

export const bedouinSeries = [{
  id: "dawas-al-layl",
  title: "دواس الليل",
  playlistId: "PLdLJSN32o2ZFvnChN9Gij09pDTaM_K2JN",
  missingEpisodes: [6, 7],
  episodes: [
  { youtubeId: "JiFBbINrPVU", title: "المسلسل البدوي دواس الليل ـ الحلقة 14 الرابعة عشر كاملة HD", number: 14, image: art0.url },
  { youtubeId: "Vi9b1vICSKc", title: "المسلسل البدوي دواس الليل ـ الحلقة 13 الثالثة عشر كاملة HD", number: 13, image: art1.url },
  { youtubeId: "Our8cMYbabU", title: "المسلسل البدوي دواس الليل ـ الحلقة 12 الثانية عشر كاملة HD", number: 12, image: art2.url },
  { youtubeId: "hovJQahDKYc", title: "المسلسل البدوي دواس الليل ـ الحلقة 11 الحاديه عشر كاملة HD", number: 11, image: art3.url },
  { youtubeId: "4T49jwNODaY", title: "المسلسل البدوي دواس الليل ـ الحلقة  10العاشرة كاملة HD", number: 10, image: art4.url },
  { youtubeId: "t73vq7kH7r8", title: "المسلسل البدوي دواس الليل ـ الحلقة 9 التاسعة كاملة HD", number: 9, image: art5.url },
  { youtubeId: "n0LkfGSzYs4", title: "المسلسل البدوي دواس الليل ـ الحلقة 8 السابع كاملة HD", number: 8, image: art6.url },
  { youtubeId: "ttt3F5XcE78", title: "المسلسل البدوي دواس الليل ـ الحلقة 5 الخامسة كاملة HD", number: 5, image: art7.url },
  { youtubeId: "_fZZvOwy-XA", title: "المسلسل البدوي دواس الليل ـ الحلقة 4 الرابعة كاملة HD", number: 4, image: art8.url },
  { youtubeId: "PuVtWhhdfdw", title: "المسلسل البدوي دواس الليل ـ الحلقة 3 الثالثة كاملة HD", number: 3, image: art9.url },
  { youtubeId: "27HWjqDmAKs", title: "المسلسل البدوي دواس الليل ـ الحلقة 2 الثانية كاملة HD", number: 2, image: art10.url },
  { youtubeId: "4NxyeTBliQU", title: "المسلسل البدوي دواس الليل ـ الحلقة 1 الأولى كاملة HD", number: 1, image: art11.url }
  ],
}];
export type BedouinEpisode = (typeof bedouinSeries)[number]["episodes"][number];
