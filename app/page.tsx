import { getTargets, getScrapedVideos, getBrandSettings } from './actions';
import HomeClient from './components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const targets = await getTargets();
  const videos = await getScrapedVideos();
  const brandSettings = await getBrandSettings();

  return <HomeClient targets={targets} videos={videos} brandSettings={brandSettings} />;
}
