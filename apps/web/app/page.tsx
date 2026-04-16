/**
 * AlecRae — Coming Soon Landing Page
 *
 * Apple-minimal. Ivory background. Handwritten signature wordmark.
 * One signature, one hairline rule, one tagline. Nothing else above
 * the fold. Legal footer is rendered below the viewport so it's there
 * for regulators and curious visitors, but doesn't break the brand feel.
 */

import { LegalFooter } from "../components/LegalFooter";

export default function ComingSoonPage() {
  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#f5f4ef] text-neutral-900 px-6 relative">
        {/* Signature wordmark — handwritten script */}
        <div className="flex flex-col items-center text-center">
          <h1
            className="text-[6rem] sm:text-[9rem] md:text-[13rem] lg:text-[15rem] leading-[0.85] text-neutral-900 select-none"
            style={{
              fontFamily: "var(--font-italianno), 'Snell Roundhand', 'Apple Chancery', cursive",
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            AlecRae
          </h1>

          {/* Hairline flourish */}
          <div className="mt-2 mb-10 w-48 md:w-64 h-px bg-neutral-400/50" aria-hidden="true" />

          {/* Tagline — clean sans */}
          <p
            className="text-sm md:text-base text-neutral-600 font-light tracking-[0.2em]"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            Email, considered.
          </p>
        </div>
      </main>
      <LegalFooter />
    </>
  );
}
