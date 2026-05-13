import { AppCategory } from '../models';

/**
 * Known bundle ID → category mappings.
 * Used by the Android native module and as a fallback on iOS.
 */
export const BUNDLE_ID_CATEGORIES: Record<string, AppCategory> = {
  // Social
  'com.instagram.ios': 'social',
  'com.tiktok.TikTok': 'social',
  'com.twitter.ios': 'social',
  'com.facebook.Facebook': 'social',
  'com.snapchat.snapchat': 'social',
  'com.linkedin.LinkedIn': 'social',
  'com.pinterest.ios': 'social',
  'com.reddit.Reddit': 'social',

  // Entertainment
  'com.google.ios.youtube': 'entertainment',
  'com.netflix.Netflix': 'entertainment',
  'com.spotify.client': 'entertainment',
  'com.twitch.stream': 'entertainment',
  'com.hulu.HuluPlus': 'entertainment',
  'com.amazon.PrimeVideo': 'entertainment',
  'com.disney.disneyplus': 'entertainment',
  'com.apple.tv': 'entertainment',
  'com.apple.Music': 'entertainment',

  // Productivity
  'com.apple.mobilenotes': 'productivity',
  'com.apple.mobilesafari': 'productivity',
  'com.google.chrome': 'productivity',
  'com.notion.id': 'productivity',
  'com.readdle.smartmailFree': 'productivity',
  'com.culturedcode.ThingsiPhone': 'productivity',
  'com.todoist.iphone': 'productivity',
  'com.microsoft.Office.Outlook': 'productivity',

  // Communication
  'com.apple.MobileSMS': 'communication',
  'com.apple.facetime': 'communication',
  'com.facebook.Messenger': 'communication',
  'com.whatsapp.WhatsApp': 'communication',
  'net.whatsapp.WhatsApp': 'communication',
  'ph.telegra.Telegraph': 'communication',
  'com.tinyspeck.chatlyio': 'communication', // Slack
  'com.microsoft.teams': 'communication',
  'com.hammerandchisel.discord': 'communication',

  // Health
  'com.apple.Health': 'health',
  'com.apple.Fitness': 'health',
  'com.nike.omega': 'health', // Nike Run Club
  'com.headspace.headspace': 'health',
  'com.calm.ios': 'health',
  'com.peloton.ios': 'health',
  'com.strava.iphone': 'health',
  'com.myfitnesspal.iFitness': 'health',

  // Education
  'com.duolingo.duolingo': 'education',
  'com.khanacademy.ios': 'education',
  'com.memrise.memrise': 'education',
  'com.audible.iphone': 'education',
  'com.amazon.kindle': 'education',
  'com.apple.iBooks': 'education',

  // News
  'com.apple.news': 'news',
  'com.reddit.Reddit-news': 'news',
  'com.nytimes.news': 'news',
  'com.bbc.bbc-news': 'news',
  'com.google.GoogleNews': 'news',

  // Games
  'com.supercell.clashofclans': 'games',
  'com.king.candycrushsaga': 'games',
  'com.miHoYo.GenshinImpact': 'games',
  'com.innersloth.amongus': 'games',
};

export function getCategoryForBundleId(bundleId: string): AppCategory {
  return BUNDLE_ID_CATEGORIES[bundleId] ?? 'other';
}
