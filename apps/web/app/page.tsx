import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { Problem } from "../components/landing/Problem";
import { Features } from "../components/landing/Features";
import { AIShowcase } from "../components/landing/AIShowcase";
import { Comparison } from "../components/landing/Comparison";
import { Pricing } from "../components/landing/Pricing";
import { Security } from "../components/landing/Security";
import { Platforms } from "../components/landing/Platforms";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <AIShowcase />
      <Comparison />
      <Pricing />
      <Security />
      <Platforms />
      <CTA />
      <Footer />
    </main>
  );
}
