// Owner-supplied channel card artwork (cropped from uploaded sheets).
import a0 from "@/assets/channel-art/alarabiya.jpg.asset.json";
import a1 from "@/assets/channel-art/alhadath.jpg.asset.json";
import a2 from "@/assets/channel-art/aljazeera.jpg.asset.json";
import a3 from "@/assets/channel-art/ar-mbc-bollywood.jpg.asset.json";
import a4 from "@/assets/channel-art/ar-rotana-cinema-masr.jpg.asset.json";
import a5 from "@/assets/channel-art/ar-rotana-classic.jpg.asset.json";
import a6 from "@/assets/channel-art/ar-rotana-comedy.jpg.asset.json";
import a7 from "@/assets/channel-art/ar-rotana-drama.jpg.asset.json";
import a8 from "@/assets/channel-art/asharq-bloomberg.jpg.asset.json";
import a9 from "@/assets/channel-art/cnbc-arabiya.jpg.asset.json";
import a10 from "@/assets/channel-art/france24-arabic.jpg.asset.json";
import a11 from "@/assets/channel-art/ktv-1.jpg.asset.json";
import a12 from "@/assets/channel-art/ktv-2.jpg.asset.json";
import a13 from "@/assets/channel-art/ktv-arabe.jpg.asset.json";
import a14 from "@/assets/channel-art/mbc-1.jpg.asset.json";
import a15 from "@/assets/channel-art/mbc-4.jpg.asset.json";
import a16 from "@/assets/channel-art/mbc-5.jpg.asset.json";
import a17 from "@/assets/channel-art/mbc-drama.jpg.asset.json";
import a18 from "@/assets/channel-art/mbc-iraq.jpg.asset.json";
import a19 from "@/assets/channel-art/mbc-masr-2.jpg.asset.json";
import a20 from "@/assets/channel-art/mbc-masr.jpg.asset.json";
import a21 from "@/assets/channel-art/mbc-plus-drama.jpg.asset.json";
import a22 from "@/assets/channel-art/new-qatar-television.jpg.asset.json";
import a23 from "@/assets/channel-art/saudi-news.jpg.asset.json";
import a24 from "@/assets/channel-art/saudi-sports.jpg.asset.json";
import a25 from "@/assets/channel-art/saudi-tv.jpg.asset.json";
import a26 from "@/assets/channel-art/sbc-tv.jpg.asset.json";
import a27 from "@/assets/channel-art/sharjah-tv.jpg.asset.json";
import a28 from "@/assets/channel-art/sky-news-arabia.jpg.asset.json";
import a29 from "@/assets/channel-art/yt-hart-29y2iq.jpg.asset.json";
import b0 from "@/assets/channel-art2/ar-rotana-cinema.jpg.asset.json";
import b1 from "@/assets/channel-art2/ar-rotana-cinema-masr.jpg.asset.json";
import b2 from "@/assets/channel-art2/ar-rotana-classic.jpg.asset.json";
import b3 from "@/assets/channel-art2/ar-rotana-comedy.jpg.asset.json";
import b4 from "@/assets/channel-art2/ar-rotana-drama.jpg.asset.json";
import b5 from "@/assets/channel-art2/bahrain-quran.jpg.asset.json";
import b6 from "@/assets/channel-art2/bahrain-tv.jpg.asset.json";
import b7 from "@/assets/channel-art2/extra-rotana-clip.jpg.asset.json";
import b8 from "@/assets/channel-art2/extra-rotana-khalijia.jpg.asset.json";
import b9 from "@/assets/channel-art2/extra-rotana-music.jpg.asset.json";
import b10 from "@/assets/channel-art2/ktv-1.jpg.asset.json";
import b11 from "@/assets/channel-art2/mbc-1.jpg.asset.json";
import b12 from "@/assets/channel-art2/mbc-4.jpg.asset.json";
import b13 from "@/assets/channel-art2/mbc-5.jpg.asset.json";
import b14 from "@/assets/channel-art2/new-oman-tv.jpg.asset.json";
import b15 from "@/assets/channel-art2/qatar-tv.jpg.asset.json";
import b16 from "@/assets/channel-art2/saudi-quran.jpg.asset.json";
import b17 from "@/assets/channel-art2/saudi-tv.jpg.asset.json";
import b18 from "@/assets/channel-art2/sbc-tv.jpg.asset.json";
import b19 from "@/assets/channel-art2/yt-hart-29y2iq.jpg.asset.json";

import officialLogos from "@/lib/official-logos.json";

export const channelArt: Record<string, string> = {
  ...(officialLogos as Record<string, string>),
  "alarabiya": a0.url,
  "alhadath": a1.url,
  "aljazeera": a2.url,
  "ar-mbc-bollywood": a3.url,
  "asharq-bloomberg": a8.url,
  "cnbc-arabiya": a9.url,
  "france24-arabic": a10.url,
  "ktv-2": a12.url,
  "ktv-arabe": a13.url,
  "mbc-drama": a17.url,
  "mbc-iraq": a18.url,
  "mbc-masr-2": a19.url,
  "mbc-masr": a20.url,
  "mbc-plus-drama": a21.url,
  "new-qatar-television": a22.url,
  "saudi-news": a23.url,
  "saudi-sports": a24.url,
  "sharjah-tv": a27.url,
  "sky-news-arabia": a28.url,
  "ar-rotana-cinema": b0.url,
  "ar-rotana-cinema-masr": b1.url,
  "ar-rotana-classic": b2.url,
  "ar-rotana-comedy": b3.url,
  "ar-rotana-drama": b4.url,
  "bahrain-quran": b5.url,
  "bahrain-tv": b6.url,
  "extra-rotana-clip": b7.url,
  "extra-rotana-khalijia": b8.url,
  "extra-rotana-music": b9.url,
  "ktv-1": b10.url,
  "mbc-1": b11.url,
  "mbc-4": b12.url,
  "mbc-5": b13.url,
  "new-oman-tv": b14.url,
  "qatar-tv": b15.url,
  "saudi-quran": b16.url,
  "saudi-tv": b17.url,
  "sbc-tv": b18.url,
  "yt-hart-29y2iq": b19.url,
};
