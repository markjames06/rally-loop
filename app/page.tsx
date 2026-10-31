"use client";

import Link from "next/link";
import { ArrowRight, CircleDot, Activity, Users, Clock, Trophy, Zap, Circle, Bike } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <main className="landing-page" id="top">
      {/* Hero Section */}
      <motion.section
        className="landing-hero"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="hero-background">
          <div className="hero-pattern" />
          <div className="hero-gradient" />
          <div className="hero-grid" />
          <div className="hero-shapes">
            <div className="hero-shape hero-shape-1" />
            <div className="hero-shape hero-shape-2" />
            <div className="hero-shape hero-shape-3" />
          </div>
        </div>

        <header className="landing-header">
          <Link aria-label="RallyLoop home" className="landing-brand" href="/">
            <span className="landing-brand-mark">
              <CircleDot aria-hidden="true" className="size-6" strokeWidth={2.5} />
            </span>
            <span className="landing-brand-text">RallyLoop</span>
          </Link>
          <nav aria-label="Main navigation" className="landing-nav">
            <Link href="/sessions">Open sessions</Link>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="landing-actions">
            <Link className="landing-signin" href="/login">Sign in</Link>
            <motion.div
              whileHover={{ scale: 0.95 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link className="landing-cta" href="/signup">
                Join RallyLoop
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </motion.div>
          </div>
        </header>

        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="hero-headline"
          >
            <h1>Every Game. One Queue.</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="hero-subheadline"
          >
            <p>
              Find sessions, track your position, and play when assigned.
              No more paper lists. No more waiting around.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="hero-cta-container"
          >
            <motion.div
              whileHover={{ scale: 0.95 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link className="landing-cta landing-cta-large" href="/signup">
                Join RallyLoop
                <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="hero-badges"
            >
              <span>Free for players</span>
              <span>Live queue tracking</span>
              <span>Real-time court updates</span>
            </motion.div>
          </motion.div>
        </div>

        <div className="hero-visual">
          <div className="court-illustration athletic">
            <div className="court-surface" />
            <div className="court-lines">
              <div className="court-outline" />
              <div className="court-center-line" />
              <div className="court-service-line top" />
              <div className="court-service-line bottom" />
              <div className="court-net" />
            </div>
            <motion.div
              className="ball-animation"
              animate={{
                y: [0, -60, 0],
                x: [0, 30, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="ball" />
            </motion.div>
            <div className="hero-status-overlay">
              <div className="status-item">
                <Activity className="size-4" />
                <span>Live queue</span>
              </div>
              <div className="status-item">
                <Users className="size-4" />
                <span>Players tracked</span>
              </div>
              <div className="status-item">
                <Clock className="size-4" />
                <span>Real-time updates</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        className="landing-section"
        id="how-it-works"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="section-header">
          <motion.h2 variants={itemVariants}>How it works</motion.h2>
          <motion.p variants={itemVariants}>
            Three simple steps to get on the court and start playing.
          </motion.p>
        </div>

        <div className="steps-grid">
          <motion.div className="step-card" variants={itemVariants}>
            <div className="step-number">01</div>
            <div className="step-icon">
              <Activity className="size-8" />
            </div>
            <h3>Find a session</h3>
            <p>Browse open sessions at your facility. See sport, time, and available spots at a glance.</p>
          </motion.div>

          <motion.div className="step-card" variants={itemVariants}>
            <div className="step-number">02</div>
            <div className="step-icon">
              <Users className="size-8" />
            </div>
            <h3>Join the queue</h3>
            <p>Add yourself to the waiting list. Your position updates in real-time as players finish matches.</p>
          </motion.div>

          <motion.div className="step-card" variants={itemVariants}>
            <div className="step-number">03</div>
            <div className="step-icon">
              <Trophy className="size-8" />
            </div>
            <h3>Play when assigned</h3>
            <p>Staff assign eligible players to courts. Get notified when your court is ready.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* For Facilities Section */}
      <motion.section
        className="landing-section landing-section-alt"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="section-header">
          <motion.h2 variants={itemVariants}>For facilities</motion.h2>
          <motion.p variants={itemVariants}>
            Give your staff the tools to run sessions efficiently and keep players happy.
          </motion.p>
        </div>

        <motion.div className="facility-preview" variants={itemVariants}>
          <div className="preview-grid">
            <div className="preview-item">
              <div className="preview-icon">
                <Activity className="size-6" />
              </div>
              <h4>Live session management</h4>
              <p>See all active sessions, queue status, and court availability in one view.</p>
            </div>
            <div className="preview-item">
              <div className="preview-icon">
                <Users className="size-6" />
              </div>
              <h4>Queue control</h4>
              <p>Assign players to courts, manage skips, and rotate players automatically.</p>
            </div>
            <div className="preview-item">
              <div className="preview-icon">
                <Clock className="size-6" />
              </div>
              <h4>Real-time updates</h4>
              <p>Players see their position change instantly as matches complete.</p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link className="landing-cta landing-cta-secondary" href="/login">
              Request access for your facility
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Sports Section */}
      <motion.section
        className="landing-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="section-header">
          <motion.h2 variants={itemVariants}>Sports we support</motion.h2>
          <motion.p variants={itemVariants}>
            Pickleball, badminton, tennis, and any court-based sport with configurable rules.
          </motion.p>
        </div>

        <motion.div className="sports-grid" variants={itemVariants}>
          <div className="sport-card">
            <div className="sport-icon">
              <Circle className="size-10" />
            </div>
            <h4>Pickleball</h4>
          </div>
          <div className="sport-card">
            <div className="sport-icon">
              <Bike className="size-10" />
            </div>
            <h4>Badminton</h4>
          </div>
          <div className="sport-card">
            <div className="sport-icon">
              <Zap className="size-10" />
            </div>
            <h4>Tennis</h4>
          </div>
          <div className="sport-card">
            <div className="sport-icon">
              <Trophy className="size-10" />
            </div>
            <h4>More sports</h4>
          </div>
        </motion.div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        className="landing-cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <motion.div className="cta-content" variants={itemVariants}>
          <h2>Your next game is waiting.</h2>
          <p>Join RallyLoop today and never miss your turn on the court.</p>
          <motion.div
            whileHover={{ scale: 0.95 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link className="landing-cta landing-cta-large" href="/signup">
              Join RallyLoop
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="landing-footer">
        <Link aria-label="RallyLoop home" className="landing-brand" href="/">
          <span className="landing-brand-mark">
            <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </span>
          <span className="landing-brand-text">RallyLoop</span>
        </Link>
        <p>Every game. One queue.</p>
      </footer>
    </main>
  );
}
