import { Navbar } from '../../components/Navbar/Navbar';
import { Hero } from '../../components/Hero/Hero';
import { ValueStrip } from '../../components/ValueStrip/ValueStrip';
import { PlatformPreview } from '../../components/PlatformPreview/PlatformPreview';
import { MapSection } from '../../components/MapSection/MapSection';
import { AnalyticsPreview } from '../../components/AnalyticsPreview/AnalyticsPreview';
import { HowItWorks } from '../../components/HowItWorks/HowItWorks';
import { DataCommandCenter } from '../../components/DataCommandCenter/DataCommandCenter';
import { FeatureCards } from '../../components/FeatureCards/FeatureCards';
import { CTA } from '../../components/CTA/CTA';
import { Footer } from '../../components/Footer/Footer';

/**
 * Darukaa.Earth marketing landing page.
 * Section order mirrors the Stitch-generated design:
 * Hero -> Value Strip -> Platform Preview -> Map Precision -> Analytics ->
 * How It Works -> Data Command Center -> Feature Cards -> CTA -> Footer.
 * (Technology/infrastructure section intentionally omitted.)
 */
export function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="w-full pt-20 bg-surface">
        <div className="flex flex-col w-full">
          <Hero />
          <ValueStrip />
          <PlatformPreview />
          <MapSection />
          <AnalyticsPreview />
          <HowItWorks />
          <DataCommandCenter />
          <FeatureCards />
          <CTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
