import DemoVideo from './components/DemoVideo'
import Reveal from './components/Reveal'

function Divider() {
  return <div className="border-t border-hairline mx-6 md:mx-12" />
}

export default function Home() {
  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col px-6 py-8 md:px-12 md:py-10">

        {/* Wordmark */}
        <header className="hero-wordmark flex-none">
          <span className="font-display italic text-terracotta text-[1.125rem] tracking-tight select-none">
            holdup
          </span>
        </header>

        {/* Video + tagline */}
        <div className="flex-1 flex flex-col items-center justify-center gap-7 py-8">

          {/* Video container — 9:16 by default; swap aspect-[9/16] → aspect-video for 16:9 */}
          <div
            className="hero-video relative overflow-hidden shadow-warm ring-1 ring-hairline bg-hairline"
            style={{ height: 'min(72vh, 560px)', aspectRatio: '9/16' }}
          >
            <DemoVideo />
          </div>

          {/* Tagline */}
          <div className="hero-tagline text-center space-y-2 max-w-sm px-2">
            <p className="text-[1rem] md:text-[1.0625rem] text-ink leading-snug">
              Hold up a QR. Start an auction. Sell it before the timer ends.
            </p>
            <p className="text-sm text-muted">
              A weekend experiment. Not a product yet.
            </p>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-hint flex-none flex justify-center pb-1">
          <div className="w-px h-10 bg-hairline" />
        </div>
      </section>

      <Divider />

      {/* ── Section 01 — What it does ── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="max-w-[680px] mx-auto">

          <Reveal>
            <div className="mb-10">
              <p className="font-display text-[0.6875rem] uppercase tracking-[0.22em] text-terracotta mb-3">
                01
              </p>
              <h2 className="font-display text-[2rem] md:text-[2.5rem] text-ink leading-tight">
                What it does
              </h2>
            </div>
          </Reveal>

          <div className="space-y-7 text-[1rem] leading-[1.75] text-ink">
            <Reveal delay={80}>
              <p>
                You&rsquo;re streaming. You&rsquo;re in Lisbon, or in your kitchen, or at a flea
                market in Berlin. You pick up something and you want to sell it — not to your whole
                audience later, to whoever&rsquo;s watching right now. There&rsquo;s no clean way to
                do this on Twitch, YouTube Live, TikTok Live, or Instagram. You DM. You say
                &ldquo;link in bio.&rdquo; You lose the moment.
              </p>
            </Reveal>

            <Reveal delay={140}>
              <p>
                Holdup is a printed QR code you hold up to the camera. The system sees it. An
                auction overlay slides onto your stream. Your viewers bid from their phones. Sixty
                seconds later, someone wins, and you have their email and their shipping address.
                You go back to streaming.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <p>
                It&rsquo;s not for big creators. It&rsquo;s for the streamer with 800 viewers who
                just bought a strange thing in a market and wants to flip it. It&rsquo;s for the
                musician who wants to sell a setlist signed in the moment. It&rsquo;s for the food
                blogger who has three copies of her cookbook and wants to find them homes tonight.
              </p>
            </Reveal>
          </div>

        </div>
      </section>

      <Divider />

      {/* ── Section 02 — How the demo works ── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="max-w-[680px] mx-auto">

          <Reveal>
            <div className="mb-10">
              <p className="font-display text-[0.6875rem] uppercase tracking-[0.22em] text-terracotta mb-3">
                02
              </p>
              <h2 className="font-display text-[2rem] md:text-[2.5rem] text-ink leading-tight">
                How the demo above works
              </h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-[1rem] leading-[1.75] text-ink">
              The video above is AI-generated. The product doesn&rsquo;t exist yet. I built this
              landing in one weekend to see if the idea is worth building, and to find out if
              streamers would actually want this. If you would, my email is below.
            </p>
          </Reveal>

        </div>
      </section>

      <Divider />

      {/* ── Section 03 — Why I think this works ── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="max-w-[680px] mx-auto">

          <Reveal>
            <div className="mb-10">
              <p className="font-display text-[0.6875rem] uppercase tracking-[0.22em] text-terracotta mb-3">
                03
              </p>
              <h2 className="font-display text-[2rem] md:text-[2.5rem] text-ink leading-tight">
                Why I think this works
              </h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <ul className="bullet-list space-y-5 text-[1rem] leading-[1.75] text-ink">
              <li>
                Auctions are short. Streams are short. The moment is short. They fit.
              </li>
              <li>
                Streamers already monetize through Twitch bits, Patreon, merch. None of those work
                for one specific object you&rsquo;re holding right now.
              </li>
              <li>
                QR-as-trigger removes the worst part: the streamer doesn&rsquo;t have to type,
                click, or break the flow.
              </li>
              <li>
                It&rsquo;s not a marketplace. It&rsquo;s not a platform. It&rsquo;s a 60-second
                overlay that happens once and disappears.
              </li>
              <li>
                I&rsquo;m not sure the unit economics work. I&rsquo;m not sure streamers want this.
                That&rsquo;s why this page exists.
              </li>
            </ul>
          </Reveal>

        </div>
      </section>

      <Divider />

      {/* ── Section 04 — What I'm looking for ── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="max-w-[680px] mx-auto">

          <Reveal>
            <div className="mb-10">
              <p className="font-display text-[0.6875rem] uppercase tracking-[0.22em] text-terracotta mb-3">
                04
              </p>
              <h2 className="font-display text-[2rem] md:text-[2.5rem] text-ink leading-tight">
                What I&rsquo;m looking for
              </h2>
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal delay={80}>
              <p className="text-[1rem] leading-[1.75] text-ink">
                If you stream and this would be useful — I want to talk to you. If you
                don&rsquo;t and this is a bad idea — I want to know that too.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <a
                href="mailto:yahorpunko@gmail.com"
                className="inline-block font-display italic text-[1.625rem] md:text-[2rem] text-terracotta
                           hover:opacity-60 transition-opacity duration-200 leading-tight"
              >
                yahorpunko@gmail.com
              </a>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline px-6 py-8 md:px-12">
        <div className="max-w-[680px] mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Holdup &mdash; a concept by Yahor Punko, Braga, May 2026
          </p>
          <nav className="flex gap-5 text-sm">
            <a
              href="https://www.linkedin.com/in/yahorpunko/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-terracotta transition-colors duration-200"
            >
              LinkedIn
            </a>
            {/* Replace href once Reddit thread is live */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-terracotta transition-colors duration-200"
            >
              Reddit thread
            </a>
          </nav>
        </div>
      </footer>

    </main>
  )
}
