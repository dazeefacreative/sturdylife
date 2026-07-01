import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import editorialShoot from "@/imports/editorialShoot.jpg";

const values = [
  { title: "Construction first", body: "Reinforced seams, heavyweight cotton, full-grain leather - every piece is built to be worn for a decade, not a season." },
  { title: "Sustainably sourced", body: "Certified organic and recycled materials wherever the construction allows it, without compromising on durability." },
  { title: "Small batches", body: "We produce in limited runs. Less waste, fewer mistakes, more attention on every garment that ships." },
];

const timeline = [
  { year: "2019", body: "Sturdy Life starts as a single hoodie pattern, cut and sewn in a one-room workshop in Lagos." },
  { year: "2021", body: "First retail drop sells out in 48 hours. We outgrow the workshop and bring on our first full-time pattern cutter." },
  { year: "2023", body: "Beanie caps and shirting join the line. Sturdy Life ships nationwide for the first time." },
  { year: "2025", body: "Summer 2025 collection - our most structured line yet, built around merino, leather, and heavyweight cotton." },
];

const ctaButtonVariants = {
  rest: { backgroundColor: "#0a0a0a", color: "#ffffff" },
  hover: { backgroundColor: "rgba(10,10,10,0.8)", color: "#ffffff" },
};

export default function AboutPage() {
  useDocumentTitle("About", "Menswear built for the long haul. Learn what Sturdy Life stands for.");
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-black" style={{ height: "60vh", minHeight: 420 }}>
        <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1800&h=1000&fit=crop&auto=format"
          alt="Sturdy Life workshop"
          className="absolute inset-0 w-full h-full object-cover opacity-90 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-20 pb-16 md:pb-20">
          <p className="text-white/60 text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
          <h1 className="text-white text-5xl md:text-7xl leading-[0.95] font-black max-w-2xl"
            style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
            Built<br /><em className="font-light italic">on purpose</em>.
          </h1>
        </div>
      </section>

      {/* Mission statement */}
      <Reveal>
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 md:gap-20">
            <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Menswear<br /><em className="font-light italic">for the long haul.</em>
            </h2>
            <div className="space-y-5">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                Sturdy Life was founded on a simple frustration: most clothing is built to be replaced. We set out to make the opposite - pieces constructed with intent, cut to outlast the trends they were bought for.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                Every hoodie, beanie, and shirt that leaves our workshop is reinforced at the seams that fail first, cut from fabric chosen for how it wears in, not just how it photographs on day one.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Editorial image band */}
      <section className="grid md:grid-cols-2 min-h-[460px]">
        <Reveal className="bg-foreground text-primary-foreground flex flex-col justify-center px-10 md:px-16 py-16 md:py-24 order-2 md:order-1">
          <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-6">What we stand for</p>
          <div className="space-y-8">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {v.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-sm font-light">{v.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <div className="relative overflow-hidden bg-muted min-h-[300px] md:min-h-0 order-1 md:order-2">
          <img src={editorialShoot}
            alt="Sturdy Life craftsmanship detail"
            className="absolute inset-0 w-full h-full object-cover grayscale" />
        </div>
      </section>

      {/* Timeline */}
      <Reveal>
        <section className="border-t border-border py-16 md:py-24">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12">
            <div className="mb-12">
              <p className="text-muted-foreground text-xs tracking-widest uppercase mb-2">Since 2019</p>
              <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                How we <em className="font-light italic">got here</em>
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {timeline.map((t) => (
                <div key={t.year} className="border-l border-border pl-5">
                  <p className="text-2xl font-black mb-2" style={{ fontFamily: "'Fraunces', serif" }}>{t.year}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="border-t border-border bg-secondary py-20">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <h2 className="text-3xl md:text-4xl font-black leading-tight max-w-md" style={{ fontFamily: "'Fraunces', serif" }}>
              See the <em className="font-light italic">current collection.</em>
            </h2>
            <MotionLink to="/shop"
              initial="rest" whileHover="hover" whileTap={tapScale}
              variants={ctaButtonVariants}
              className="inline-flex items-center gap-3 px-10 py-4 text-xs tracking-widest uppercase font-semibold shrink-0">
              Shop Collection <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
            </MotionLink>
          </div>
        </section>
      </Reveal>

      <SiteFooter />
    </div>
  );
}
