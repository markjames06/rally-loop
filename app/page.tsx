import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
} from "lucide-react";

export default function Home() {
  return (
    <main className="marketing-page" id="top">
      <header className="marketing-header">
        <Link aria-label="RallyLoop home" className="marketing-brand" href="/">
          <span className="marketing-brand-mark">
            <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </span>
          <span>RallyLoop</span>
        </Link>
        <nav aria-label="Main navigation" className="marketing-nav">
          <Link href="/sessions">Open sessions</Link>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="marketing-actions">
          <Link className="marketing-signin" href="/login">Sign in</Link>
          <Link className="marketing-button" href="/signup">
            Get started <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <h1>More play. Less wait.</h1>
          <p className="marketing-lede">
            RallyLoop gives players and clubs one clear place to find sessions,
            follow the queue, and keep courts moving.
          </p>
          <div className="marketing-hero-actions">
            <Link className="marketing-button marketing-button-large" href="/sessions">
              Browse open sessions <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link className="marketing-text-link" href="/login">I already have an account</Link>
          </div>
          <p className="marketing-sports">Pickleball / Badminton / Tennis</p>
        </div>

        <div className="court-illustration" role="img" aria-label="Court diagram with a ball and next-up queue position">
          <div className="court-caption">
            <span>One shared view</span>
            <span className="court-ready"><span aria-hidden="true" /> Courts in play</span>
          </div>
          <div className="court-board">
            <div aria-hidden="true" className="court-outline" />
            <div aria-hidden="true" className="court-center-line" />
            <div aria-hidden="true" className="court-service-line court-service-line-top" />
            <div aria-hidden="true" className="court-service-line court-service-line-bottom" />
            <div aria-hidden="true" className="court-net-line" />
            <div aria-hidden="true" className="court-ball"><span /></div>
            <div className="court-status-note">
              <span className="court-status-label">Your place in line</span>
              <strong>Up next</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-rhythm" id="how-it-works">
        <div className="marketing-section-heading">
          <h2>One clear view for every role.</h2>
          <p>Players see where they stand. Staff can see which court is ready and move the next group into play.</p>
        </div>
        <div className="product-previews">
          <article className="product-preview">
            <div className="preview-heading">
              <h3>Find a session</h3>
              <p>Example player view</p>
            </div>
            <div className="preview-session-card">
              <div className="preview-session-top">
                <span>Pickleball</span>
                <span className="preview-status is-open">Open</span>
              </div>
              <strong>Evening open play</strong>
              <p>Tonight / 6:00 pm</p>
              <div className="preview-session-footer">
                <span>4 players per match</span>
                <Link href="/sessions">View session <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
              </div>
            </div>
          </article>

          <article className="product-preview">
            <div className="preview-heading">
              <h3>See your place</h3>
              <p>Example queue view</p>
            </div>
            <div className="preview-queue-card">
              <div className="preview-queue-title">
                <strong>Waiting queue</strong>
                <span>First in, first out</span>
              </div>
              <div className="preview-queue-row"><span className="preview-position">1</span><span>You</span><span className="preview-status is-waiting">Waiting</span></div>
              <div className="preview-queue-row"><span className="preview-position">2</span><span>Next player</span><span className="preview-muted">Joined</span></div>
              <div className="preview-queue-note">Your position updates as the line moves.</div>
            </div>
          </article>

          <article className="product-preview product-preview-wide">
            <div className="preview-heading">
              <h3>Keep courts moving</h3>
              <p>Example staff view</p>
            </div>
            <div className="preview-court-card">
              <div className="preview-court-title"><strong>Session courts</strong><span>Live session</span></div>
              <div className="preview-court-row"><span className="preview-court-mark is-playing" /><span><strong>Court 1</strong><small>Match in progress</small></span><span className="preview-status is-playing-label">In play</span></div>
              <div className="preview-court-row"><span className="preview-court-mark is-ready" /><span><strong>Court 2</strong><small>Ready for the next match</small></span><span className="preview-status is-ready-label">Available</span></div>
            </div>
          </article>
        </div>
      </section>

      <section className="marketing-footer-cta">
        <div>
          <h2>Find your next session.</h2>
          <p>Browse open games and see the court details before you join.</p>
        </div>
        <Link className="marketing-button" href="/sessions">
          Browse sessions <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>

      <footer className="marketing-footer">
        <Link aria-label="RallyLoop home" className="marketing-brand" href="/">
          <span className="marketing-brand-mark"><CircleDot aria-hidden="true" className="size-4" /></span>
          <span>RallyLoop</span>
        </Link>
        <p>Every game. One queue.</p>
      </footer>
    </main>
  );
}
