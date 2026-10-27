import { ArrowDown, ArrowUpRight, CircleDot, Clock3, UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: CircleDot,
    title: "Find your session",
    description:
      "See what is happening at your club and choose the game that fits your day.",
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Get in the rotation",
    description:
      "A clear, shared line keeps everyone on the same page and ready to play.",
  },
  {
    number: "03",
    icon: Clock3,
    title: "Play more together",
    description:
      "Know when a court is ready, so less time is spent wondering what is next.",
  },
];

export default function Home() {
  return (
    <main>
      <header
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12"
        id="top"
      >
        <Link aria-label="RallyLoop home" className="flex items-center gap-3" href="/">
          <span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-slate-950">
            <CircleDot aria-hidden="true" className="size-6" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Rally<span className="text-lime-300">Loop</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium text-slate-300 sm:flex">
          <a className="transition hover:text-white" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-white" href="#built-for-play">
            Built for play
          </a>
        </nav>

        <Button
          asChild
          className="h-10 rounded-full bg-lime-300 px-5 font-bold text-slate-950 hover:bg-lime-200"
        >
          <a href="#how-it-works">
            Discover RallyLoop
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
      </header>

      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-28 lg:pt-14">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-200">
              <span className="size-2 rounded-full bg-lime-300" />
              Your next game starts here
            </div>
            <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Every game.
              <br />
              <span className="text-lime-300">One queue.</span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl">
              Less waiting around. More time on court. RallyLoop brings
              players, sessions, and court rotations together in one simple
              place.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-lime-300 px-6 text-base font-bold text-slate-950 hover:bg-lime-200"
              >
                <a href="#how-it-works">
                  See how it works
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
              <a
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
                href="#built-for-play"
              >
                Made for your club
              </a>
            </div>
            <p className="mt-5 text-xs font-medium tracking-wide text-slate-500">
              PICKLEBALL <span className="px-2 text-lime-300">/</span> BADMINTON{" "}
              <span className="px-2 text-lime-300">/</span> TENNIS
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[540px]">
            <div
              aria-hidden="true"
              className="absolute -left-7 top-16 size-20 rounded-full border border-lime-300/25 sm:-left-10 sm:size-28"
            />
            <div
              aria-hidden="true"
              className="absolute -right-4 bottom-12 size-14 rounded-full bg-sky-300/10 blur-xl sm:-right-8 sm:size-24"
            />
            <div className="court-card relative aspect-[1.02] overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-2xl shadow-black/30 sm:p-6">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <span>Game on</span>
                <span className="flex items-center gap-2 text-lime-300">
                  <span className="size-2 animate-pulse rounded-full bg-lime-300" />
                  Ready to play
                </span>
              </div>
              <div
                aria-label="Illustration of a green court with a ball"
                className="court-art relative mt-4 flex h-[calc(100%-2.5rem)] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/15"
                role="img"
              >
                <div aria-hidden="true" className="court-line court-outline" />
                <div aria-hidden="true" className="court-line court-center-line" />
                <div aria-hidden="true" className="court-line court-service-top" />
                <div aria-hidden="true" className="court-line court-service-bottom" />
                <div aria-hidden="true" className="court-net" />
                <div aria-hidden="true" className="ball-shadow" />
                <div aria-hidden="true" className="court-ball">
                  <span />
                </div>
                <div className="absolute bottom-5 left-5 rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-3 backdrop-blur-md sm:bottom-7 sm:left-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    The best part?
                  </p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-base">
                    You&apos;re up next.
                  </p>
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-lime-300 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 sm:right-6 sm:top-6">
                  Your club, in sync
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-y border-white/[0.08] bg-white/[0.025]"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
                The RallyLoop rhythm
              </p>
              <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                From “who&apos;s next?” to game on.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              A clearer way to keep recreational play moving—built around the
              people who show up to play.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <article
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-7"
                key={number}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-600">
                    {number}
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:px-12 lg:py-20"
        id="built-for-play"
      >
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
            More rally. Less wait.
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Make every court day a little smoother.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Made for the clubs and communities that bring people together
            through play.
          </p>
        </div>
        <a
          className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-lime-300 transition hover:text-lime-200"
          href="#top"
        >
          Back to top
          <ArrowDown aria-hidden="true" className="size-4 rotate-180" />
        </a>
      </section>

      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p className="font-bold text-slate-300">
            Rally<span className="text-lime-300">Loop</span>
            <span className="px-2 text-slate-700">/</span>
            Every Game. One Queue.
          </p>
          <p>Made for good games and good company.</p>
        </div>
      </footer>
    </main>
  );
}
