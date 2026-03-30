import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Klogo from '../assets/KLOGO.png';
import Footer from '../components/Footer';

const WEBSITE_URL = 'https://kgamify-job.onrender.com/';

export default function HomeInfo({ isDarkMode }) {
  const [activeFaq, setActiveFaq] = useState(0);
  const [statsStarted, setStatsStarted] = useState(false);
  const [stats, setStats] = useState({
    speed: 0,
    accuracy: 0,
    matched: 0,
    companies: 0,
  });

  useEffect(() => {
    const sections = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return undefined;

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsStarted(true);
          }
        });
      },
      { threshold: 0.35 }
    );

    statsObserver.observe(statsSection);
    return () => statsObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!statsStarted) return undefined;

    const durationMs = 1400;
    const tickMs = 28;
    const target = {
      speed: 10,
      accuracy: 95,
      matched: 50000,
      companies: 100,
    };

    const steps = Math.max(1, Math.floor(durationMs / tickMs));
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(1, currentStep / steps);

      setStats({
        speed: Math.round(target.speed * progress),
        accuracy: Math.round(target.accuracy * progress),
        matched: Math.round(target.matched * progress),
        companies: Math.round(target.companies * progress),
      });

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [statsStarted]);

  const features = [
    {
      title: 'Structured Job Postings',
      text: 'Create consistent templates with responsibilities, skills, and scoring weights for precise candidate matching.',
    },
    {
      title: 'AI Description Validation',
      text: 'AI checks clarity, bias, completeness, and recommends improvements before publishing.',
    },
    {
      title: 'Automated Resume Matching',
      text: 'Candidates are ranked against requirements so recruiters can focus on top-fit profiles first.',
    },
    {
      title: 'Candidate Evaluation Suite',
      text: 'Collaborate with interview notes, assessments, and shortlisting workflows in one place.',
    },
    {
      title: 'Domain-Specific Templates',
      text: 'Use optimized templates for technology, healthcare, finance, and other domains.',
    },
    {
      title: 'Analytics and Reporting',
      text: 'Track pipeline health, match quality, and time-to-hire with actionable insights.',
    },
  ];

  const faqs = [
    {
      q: 'How does AI resume matching work?',
      a: 'The system compares job requirements and resume signals to score candidate fit and rank applications.',
    },
    {
      q: 'Can job templates be customized?',
      a: 'Yes. All templates are editable so teams can adapt fields, priorities, and expectations.',
    },
    {
      q: 'Is candidate data secure?',
      a: 'Data is protected with secure transport, role-based access, and production-grade storage practices.',
    },
    {
      q: 'Do you support integrations?',
      a: 'Yes. The platform supports external workflows and can be extended for enterprise integration needs.',
    },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-[#fff8ef]'}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'linear-gradient(120deg, #fff7e6 0%, #ffecd2 40%, #ffe3b3 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, #ffb34733 0%, transparent 60%), radial-gradient(circle at 20% 80%, #ff820033 0%, transparent 60%)',
            opacity: 0.7,
          }}
        />
        <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#ff8200]/20 blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-[#ffb347]/20 blur-3xl animate-float-reverse" />
      </div>

      <style>
        {`
          .reveal-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 700ms ease, transform 700ms ease;
          }
          .reveal-on-scroll.revealed {
            opacity: 1;
            transform: translateY(0);
          }
          @keyframes floatSlow {
            0% { transform: translateY(0px); }
            50% { transform: translateY(14px); }
            100% { transform: translateY(0px); }
          }
          @keyframes floatReverse {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
            100% { transform: translateY(0px); }
          }
          .animate-float-slow { animation: floatSlow 7s ease-in-out infinite; }
          .animate-float-reverse { animation: floatReverse 8s ease-in-out infinite; }
          .feature-card-stagger {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
            transition: opacity 520ms ease, transform 520ms ease;
          }
          .reveal-on-scroll.revealed .feature-card-stagger {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          .faq-content {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transform: translateY(-4px);
            transition: max-height 350ms ease, opacity 300ms ease, transform 300ms ease;
          }
          .faq-content.open {
            max-height: 220px;
            opacity: 1;
            transform: translateY(0);
          }
        `}
      </style>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-12 reveal-on-scroll revealed">
          <img
            src={Klogo}
            alt="kGamify Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 object-contain drop-shadow-lg"
          />
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent">
            Intelligent Recruitment, Simplified
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-800 max-w-3xl mx-auto leading-relaxed">
            kGamify helps your team create better jobs, match candidates faster, and run a modern hiring pipeline with AI-assisted workflows.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center min-w-[180px] px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff8200] to-[#ffb347] hover:from-[#e57400] hover:to-[#ffb347] shadow-lg"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center min-w-[180px] px-6 py-3 rounded-xl font-bold border-2 border-[#ff8200] text-[#ff8200] hover:bg-orange-50"
            >
              Register
            </Link>
            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center min-w-[180px] px-6 py-3 rounded-xl font-bold border-2 border-gray-800 text-gray-800 hover:bg-gray-100"
            >
              Visit Website
            </a>
          </div>
        </div>

        <section className="reveal-on-scroll max-w-6xl mx-auto rounded-3xl border border-orange-200 bg-white p-6 sm:p-8 shadow-xl mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Why Recruitment Needs AI</h2>
              <p className="mt-3 text-gray-700 leading-relaxed">
                Hiring teams often spend too much time on repetitive screening and unclear job descriptions. kGamify reduces manual effort and improves decision quality.
              </p>
              <div className="mt-5 space-y-2 text-sm text-gray-700">
                <p>- Manual resume screening consumes recruiter bandwidth</p>
                <p>- Inconsistent job copy attracts poor-fit applicants</p>
                <p>- Limited visibility into hiring pipeline efficiency</p>
                <p>- Administrative overhead delays final decisions</p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#ff8200] to-[#ffb347] text-white p-6 shadow-lg">
              <h3 className="font-bold text-xl">The kGamify Advantage</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>- Validate and improve JD quality instantly</li>
                <li>- Prioritize candidates using AI-assisted matching</li>
                <li>- Monitor recruitment metrics in real time</li>
                <li>- Move from posting to shortlisting much faster</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="stats-section" className="reveal-on-scroll max-w-6xl mx-auto rounded-3xl border border-orange-200 bg-white p-6 sm:p-8 shadow-xl mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Impact by Numbers</h2>
            <p className="text-gray-700 mt-2">Real outcomes from teams using kGamify.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#ff8200]">{stats.speed}x</p>
              <p className="text-sm text-gray-700 mt-1">Faster Hiring</p>
            </div>
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#ff8200]">{stats.accuracy}%</p>
              <p className="text-sm text-gray-700 mt-1">Match Accuracy</p>
            </div>
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#ff8200]">{Math.floor(stats.matched / 1000)}k+</p>
              <p className="text-sm text-gray-700 mt-1">Candidates Matched</p>
            </div>
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#ff8200]">{stats.companies}+</p>
              <p className="text-sm text-gray-700 mt-1">Companies Trust Us</p>
            </div>
          </div>
        </section>

        <section className="reveal-on-scroll max-w-6xl mx-auto mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Powerful Features</h2>
            <p className="text-gray-700 mt-2">Everything you need from job creation to candidate evaluation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {features.map((item, index) => (
              <article
                key={item.title}
                className="feature-card-stagger rounded-2xl border border-orange-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ff8200] font-bold flex items-center justify-center mb-3">
                  {index + 1}
                </div>
                <h3 className="font-bold text-[#ff8200] text-lg">{item.title}</h3>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll max-w-6xl mx-auto rounded-3xl border border-orange-200 bg-white p-6 sm:p-8 shadow-xl mb-10">
          <div className="text-center mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">How It Works</h2>
            <p className="text-gray-700 mt-2">Four steps to a better recruitment workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Post a Job', text: 'Create or choose a structured role template.' },
              { title: 'AI Validation', text: 'Improve job quality and clarity before publishing.' },
              { title: 'Get Matches', text: 'AI ranks candidates against role expectations.' },
              { title: 'Evaluate and Hire', text: 'Shortlist, interview, and close faster.' },
            ].map((step, idx) => (
              <div key={step.title} className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#ff8200] text-white font-bold mb-3">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-700 mt-2">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll max-w-6xl mx-auto mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Simple Pricing</h2>
            <p className="text-gray-700 mt-2">Start free, scale when your team grows.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-xl text-gray-900">Starter</h3>
              <p className="text-2xl font-extrabold text-[#ff8200] mt-2">Free</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>- 1 active job posting</li>
                <li>- Basic AI matching</li>
                <li>- Email support</li>
              </ul>
              <Link to="/register" className="inline-block mt-5 px-4 py-2 rounded-lg border border-[#ff8200] text-[#ff8200] font-semibold hover:bg-orange-50">Get Started</Link>
            </div>
            <div className="rounded-2xl border-2 border-[#ff8200] bg-white p-6 shadow-lg relative">
              <span className="absolute -top-3 left-5 bg-[#ff8200] text-white text-xs px-3 py-1 rounded-full font-semibold">Most Popular</span>
              <h3 className="font-bold text-xl text-gray-900">Professional</h3>
              <p className="text-2xl font-extrabold text-[#ff8200] mt-2">$99/month</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>- Unlimited job postings</li>
                <li>- Advanced AI matching</li>
                <li>- Analytics and priority support</li>
              </ul>
              <Link to="/register" className="inline-block mt-5 px-4 py-2 rounded-lg bg-[#ff8200] text-white font-semibold hover:bg-[#e57400]">Start Free Trial</Link>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-xl text-gray-900">Enterprise</h3>
              <p className="text-2xl font-extrabold text-[#ff8200] mt-2">Custom</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>- Custom integrations</li>
                <li>- Dedicated account support</li>
                <li>- Security and SLA options</li>
              </ul>
              <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="inline-block mt-5 px-4 py-2 rounded-lg border border-[#ff8200] text-[#ff8200] font-semibold hover:bg-orange-50">Contact Sales</a>
            </div>
          </div>
        </section>

        <section className="reveal-on-scroll max-w-6xl mx-auto rounded-3xl border border-orange-200 bg-white p-6 sm:p-8 shadow-xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">Frequently Asked Questions</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((item, index) => (
              <div key={item.q} className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <button
                  type="button"
                  onClick={() => setActiveFaq((current) => (current === index ? -1 : index))}
                  className="w-full flex items-center justify-between gap-3 text-left"
                  aria-expanded={activeFaq === index}
                >
                  <h3 className="font-bold text-gray-900">{item.q}</h3>
                  <span className={`text-[#ff8200] text-2xl leading-none transition-transform duration-300 ${activeFaq === index ? 'rotate-45' : 'rotate-0'}`}>
                    +
                  </span>
                </button>
                <div className={`faq-content ${activeFaq === index ? 'open mt-2' : ''}`}>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white p-7 sm:p-10 text-center shadow-xl mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to transform your recruitment?</h2>
          <p className="mt-3 text-sm sm:text-base opacity-95 max-w-2xl mx-auto">
            Join teams using kGamify to hire smarter, faster, and with confidence.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center justify-center min-w-[220px] px-6 py-3 rounded-xl font-bold bg-white text-[#ff8200] hover:bg-orange-50">Start Your Free Trial</Link>
            <Link to="/login" className="inline-flex items-center justify-center min-w-[220px] px-6 py-3 rounded-xl font-bold border-2 border-white text-white hover:bg-white/10">Sign In</Link>
          </div>
        </section>
      </div>

      <div className="relative z-20">
        <Footer isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

HomeInfo.propTypes = {
  isDarkMode: PropTypes.bool,
};
