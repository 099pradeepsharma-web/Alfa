import React, { useState, useEffect, useRef } from 'react';
import { 
    GraduationCap, PieChart, Cpu, Users, ArrowRight, Star, 
    CheckCircle, PlayCircle, Rocket, BookOpen, ArrowLeft, Phone, Languages 
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToContact: () => void;
  onNavigateToAbout: () => void;
}

interface AnimateOnScrollOptions extends IntersectionObserverInit {
    triggerOnce?: boolean;
}

const useAnimateOnScroll = (options: AnimateOnScrollOptions = { threshold: 0.1, triggerOnce: true }) => {
    const ref = useRef<any>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const { triggerOnce, ...observerOptions } = options;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                element.classList.add('is-visible');
                if (triggerOnce) {
                    observer.unobserve(element);
                }
            }
        }, observerOptions);

        observer.observe(element);
        return () => { if (element) observer.unobserve(element); };
    }, [options]);

    return ref;
};


const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth, onNavigateToContact, onNavigateToAbout }) => {
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [isFloatingCtaVisible, setIsFloatingCtaVisible] = useState(false);

    
    // Refs for scrolling
    const whyRef = useRef<HTMLElement>(null);
    const programsRef = useRef<HTMLElement>(null);
    const howRef = useRef<HTMLElement>(null);
    const storiesRef = useRef<HTMLElement>(null);
    const pricingRef = useRef<HTMLElement>(null);
    const faqRef = useRef<HTMLElement>(null);

    // Refs for animations
    const heroContentRef = useAnimateOnScroll({ threshold: 0.5 });
    const valuePropsRef = useAnimateOnScroll();
    const audienceRef = useAnimateOnScroll();
    const howItWorksRef = useAnimateOnScroll();
    const testimonialsRef = useAnimateOnScroll();
    const pricingRefAnim = useAnimateOnScroll();
    const faqRefAnim = useAnimateOnScroll();
    const finalCtaRef = useAnimateOnScroll();
    const testimonialCarouselRef = useRef<HTMLDivElement>(null);


    const scrollTo = (ref: React.RefObject<HTMLElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (testimonialCarouselRef.current) {
            const scrollAmount = testimonialCarouselRef.current.offsetWidth * 0.8;
            testimonialCarouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 10;
            const showFloatingCta = window.scrollY > 600; // Show after hero
            setIsHeaderScrolled(scrolled);
            setIsFloatingCtaVisible(showFloatingCta);
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: "Why AlfaNumrik", action: () => scrollTo(whyRef) },
        { name: "Programs", action: () => scrollTo(programsRef) },
        { name: "How It Works", action: () => scrollTo(howRef) },
        { name: "Success Stories", action: () => scrollTo(storiesRef) },
        { name: "Pricing", action: () => scrollTo(pricingRef) },
        { name: "FAQs", action: () => scrollTo(faqRef) },
        { name: "Contact", action: onNavigateToContact },
    ];

    const faqs = [
        { q: "How does the adaptive path work?", a: "Our AI analyzes your performance on an initial assessment and subsequent quizzes to build a personalized learning journey that focuses on your weak areas while reinforcing your strengths." },
        { q: "How many live classes per week?", a: "The number of live classes depends on your chosen plan. Our 'Pro' plan typically includes 3-4 live classes per week per subject, focusing on doubt clearing and advanced topics." },
        { q: "What is the refund policy?", a: "We offer a 7-day free trial. After enrollment, we have a 'no questions asked' refund policy within the first 15 days of the program starting." },
        { q: "Can I skip topics I already know?", a: "Yes! Our platform is designed for flexibility. You can take a 'mastery challenge' for any topic, and if you score above 85%, you can move to the next concept." },
    ];

    const [activeAudienceTab, setActiveAudienceTab] = useState('high-school');

    return (
        <div className="landing-page bg-bg-primary text-text-primary">
            {/* 1. Header */}
            <div className={`landing-header-container ${isHeaderScrolled ? 'scrolled' : ''}`}>
                <nav className="main-nav h-20">
                    <div className="container mx-auto px-6 h-full flex justify-between items-center">
                        <span className="font-bold text-2xl"><span style={{ color: '#F97316' }}>Alfa</span><span style={{color: '#4FC3F7'}}>Numrik</span></span>
                        <div className="hidden lg:flex items-center gap-8">
                            {navLinks.map(link => (
                                <button key={link.name} onClick={link.action} className="nav-link">{link.name}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={onNavigateToAuth} className="btn-primary">Get Started</button>
                        </div>
                    </div>
                </nav>
            </div>
            
            <main>
                {/* Hero Section */}
                <section className="hero-section">
                    <div ref={heroContentRef} className="container mx-auto px-6 pt-16 pb-24 text-center stagger-children">
                        <h1 className="text-4xl md:text-6xl font-extrabold !leading-tight text-white">
                            Empower Your Academic Journey with AlfaNumrik
                        </h1>
                        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
                            Personalized learning, expert guidance, and goal-driven progress — for students who aim to excel.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            <button onClick={onNavigateToAuth} className="btn-primary text-lg px-8 py-3">Start Free Trial</button>
                            <button className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
                                <PlayCircle className="h-6 w-6" /> Watch Demo
                            </button>
                        </div>
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                           <div className="hero-benefit-card"><p className="font-semibold text-sm text-text-secondary flex items-center gap-2"><Cpu className="h-5 w-5 text-primary"/> Adaptive Learning</p></div>
                           <div className="hero-benefit-card"><p className="font-semibold text-sm text-text-secondary flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> 1-on-1 Mentorship</p></div>
                           <div className="hero-benefit-card"><p className="font-semibold text-sm text-text-secondary flex items-center gap-2"><PieChart className="h-5 w-5 text-primary"/> Progress Tracking</p></div>
                           <div className="hero-benefit-card"><p className="font-semibold text-sm text-text-secondary flex items-center gap-2"><Star className="h-5 w-5 text-primary"/> Verified Results</p></div>
                        </div>
                    </div>
                </section>

                {/* Why Alfanumrik */}
                <section ref={whyRef} className="bg-surface">
                    <div className="container mx-auto px-6">
                        <h2 className="section-title">Why Students & Parents Trust AlfaNumrik</h2>
                        <div ref={valuePropsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
                            <div className="value-prop-card"><GraduationCap className="h-12 w-12 mx-auto text-accent"/><h3 className="mt-4 text-xl font-bold">Personalized Learning Paths</h3><p className="mt-2 text-sm text-text-secondary">Tailored content and pacing based on your strengths & weaknesses.</p></div>
                            <div className="value-prop-card"><Users className="h-12 w-12 mx-auto text-accent"/><h3 className="mt-4 text-xl font-bold">Expert Mentors & Live Sessions</h3><p className="mt-2 text-sm text-text-secondary">Connect with qualified tutors anytime you’re stuck.</p></div>
                            <div className="value-prop-card"><PieChart className="h-12 w-12 mx-auto text-accent"/><h3 className="mt-4 text-xl font-bold">Progress Analytics & Goals</h3><p className="mt-2 text-sm text-text-secondary">Track your weekly performance & target weak areas.</p></div>
                            <div className="value-prop-card"><Star className="h-12 w-12 mx-auto text-accent"/><h3 className="mt-4 text-xl font-bold">Proven Results & Testimonials</h3><p className="mt-2 text-sm text-text-secondary">Thousands of students improved by 20–50% in grades.</p></div>
                        </div>
                    </div>
                </section>
                
                {/* Audience / Programs */}
                <section ref={programsRef} className="bg-bg-primary">
                    <div ref={audienceRef} className="container mx-auto px-6 stagger-children">
                        <h2 className="section-title">Programs for Every Goal</h2>
                        <div className="flex justify-center flex-wrap gap-4 mb-8">
                            <button onClick={() => setActiveAudienceTab('middle-school')} className={`audience-tab ${activeAudienceTab === 'middle-school' ? 'active' : ''}`}>Middle School (6-8)</button>
                            <button onClick={() => setActiveAudienceTab('high-school')} className={`audience-tab ${activeAudienceTab === 'high-school' ? 'active' : ''}`}>High School (9-12)</button>
                            <button onClick={() => setActiveAudienceTab('competitive')} className={`audience-tab ${activeAudienceTab === 'competitive' ? 'active' : ''}`}>Competitive Exams</button>
                        </div>
                        <div className="bg-surface p-8 rounded-2xl">
                            <div className={`audience-tab-content ${activeAudienceTab === 'middle-school' ? 'active animate-fade-in' : ''}`}>
                                 <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <img src="https://images.unsplash.com/photo-1594409855543-7f2b18600d1a?q=80&w=2070&auto=format&fit=crop" alt="Two young female students studying together with a laptop" className="rounded-xl w-full h-full object-cover" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-text-primary">Middle School (6–8)</h3>
                                        <p className="text-text-secondary mt-2">Build strong fundamentals and spark a love for learning with our interactive, concept-driven approach.</p>
                                        <ul className="mt-4 space-y-2">
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Gamified modules to make learning fun.</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Focus on core concepts in Math & Science.</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Live doubt-clearing sessions.</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Preparation for Olympiads and NTSE foundation.</li>
                                        </ul>
                                        <button onClick={onNavigateToAuth} className="btn-primary mt-6">Explore Middle School Programs</button>
                                    </div>
                                </div>
                            </div>
                            <div className={`audience-tab-content ${activeAudienceTab === 'high-school' ? 'active animate-fade-in' : ''}`}>
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <img src="https://images.unsplash.com/photo-1628191010210-a54de435944d?q=80&w=2070&auto=format&fit=crop" alt="A classroom of high school students listening to a lecture" className="rounded-xl w-full h-full object-cover" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-text-primary">High School (9-12)</h3>
                                        <p className="text-text-secondary mt-2">Build a rock-solid foundation, ace your board exams, and get a head start on competitive exam preparation.</p>
                                        <ul className="mt-4 space-y-2">
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Live classes 4x per week</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> AI-powered personalized quizzes</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Monthly mentor check-ins</li>
                                        </ul>
                                        <button onClick={onNavigateToAuth} className="btn-primary mt-6">Explore High School Programs</button>
                                    </div>
                                </div>
                            </div>
                            <div className={`audience-tab-content ${activeAudienceTab === 'competitive' ? 'active animate-fade-in' : ''}`}>
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop" alt="A student in a library looking at a bookshelf, representing focused study" className="rounded-xl w-full h-full object-cover" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-text-primary">Competitive Exam Prep (JEE, NEET)</h3>
                                        <p className="text-text-secondary mt-2">Achieve top ranks with our structured curriculum, rigorous mock tests, and expert faculty from top institutes.</p>
                                        <ul className="mt-4 space-y-2">
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> In-depth coverage of JEE/NEET syllabus.</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> All-India test series with performance analysis.</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> 24/7 AI-powered doubt resolution.</li>
                                            <li className="flex items-center gap-2 text-text-secondary"><CheckCircle className="h-5 w-5 text-success"/> Strategy sessions with top rankers.</li>
                                        </ul>
                                        <button onClick={onNavigateToAuth} className="btn-primary mt-6">Explore Competitive Programs</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* How It Works */}
                <section ref={howRef} className="bg-surface">
                    <div ref={howItWorksRef} className="container mx-auto px-6 stagger-children">
                        <h2 className="section-title">Your Journey to Success</h2>
                        <div className="how-it-works-steps">
                            <div className="how-it-works-step"><div className="step-icon"><Rocket className="h-6 w-6 text-accent"/></div><h4 className="mt-4 font-bold text-center">1. Sign Up & Onboarding</h4><p className="text-xs text-center text-text-secondary">Take a quick assessment to find your baseline.</p></div>
                            <div className="how-it-works-step"><div className="step-icon"><Cpu className="h-6 w-6 text-accent"/></div><h4 className="mt-4 font-bold text-center">2. AI Path Generation</h4><p className="text-xs text-center text-text-secondary">Our AI crafts your personalized curriculum.</p></div>
                            <div className="how-it-works-step"><div className="step-icon"><BookOpen className="h-6 w-6 text-accent"/></div><h4 className="mt-4 font-bold text-center">3. Interactive Learning</h4><p className="text-xs text-center text-text-secondary">Attend live classes, solve quizzes, chat with AI.</p></div>
                            <div className="how-it-works-step"><div className="step-icon"><Users className="h-6 w-6 text-accent"/></div><h4 className="mt-4 font-bold text-center">4. Mentor Sessions</h4><p className="text-xs text-center text-text-secondary">Book 1:1 sessions to clarify weak topics.</p></div>
                            <div className="how-it-works-step"><div className="step-icon"><PieChart className="h-6 w-6 text-accent"/></div><h4 className="mt-4 font-bold text-center">5. Progress Reviews</h4><p className="text-xs text-center text-text-secondary">Get weekly stats and parent reports.</p></div>
                        </div>
                    </div>
                </section>
                
                {/* Testimonials */}
                <section ref={storiesRef} className="bg-bg-primary">
                    <div ref={testimonialsRef} className="container mx-auto px-6 stagger-children">
                        <h2 className="section-title">Join Thousands of Successful Students</h2>
                        <div className="testimonial-carousel">
                            <div ref={testimonialCarouselRef} className="testimonial-container">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="testimonial-card-wrapper">
                                        <div className="bg-surface p-6 rounded-xl h-full flex flex-col justify-between">
                                            <blockquote className="italic text-text-secondary">"AlfaNumrik helped me boost my Math score from 65% to 92% in just 4 months. The AI tutor is amazing!"</blockquote>
                                            <div className="flex items-center gap-4 mt-4">
                                                <img src={`https://i.pravatar.cc/150?u=student${i}`} alt="Student" className="w-12 h-12 rounded-full"/>
                                                <div><p className="font-bold">Riya S.</p><p className="text-sm text-text-secondary">Class 10</p></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-center gap-4">
                                <button onClick={() => scrollCarousel('left')} className="p-2 bg-surface rounded-full"><ArrowLeft className="h-5 w-5" /></button>
                                <button onClick={() => scrollCarousel('right')} className="p-2 bg-surface rounded-full"><ArrowRight className="h-5 w-5" /></button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section ref={pricingRef} className="bg-surface">
                    <div ref={pricingRefAnim} className="container mx-auto px-6 stagger-children">
                        <h2 className="section-title">Transparent & Simple Pricing</h2>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="pricing-card p-8"><h3 className="text-2xl font-bold">Basic</h3><p className="text-4xl font-bold my-4">₹999<span className="text-base font-normal text-text-secondary">/mo</span></p><ul className="space-y-2 text-text-secondary"><li>✅ Self-paced modules</li><li>✅ 24/7 AI Doubt Solver</li></ul><button onClick={onNavigateToAuth} className="btn-secondary w-full mt-6">Enroll Now</button></div>
                            <div className="pricing-card highlighted p-8"><h3 className="text-2xl font-bold">Pro</h3><p className="text-4xl font-bold my-4">₹1999<span className="text-base font-normal text-text-secondary">/mo</span></p><ul className="space-y-2 text-text-secondary"><li>✅ All Basic features</li><li>✅ Live Classes (4/week)</li><li>✅ 1-on-1 Mentor Sessions</li><li>✅ Parent Progress Dashboard</li></ul><button onClick={onNavigateToAuth} className="btn-primary w-full mt-6">Start Free Trial</button></div>
                            <div className="pricing-card p-8"><h3 className="text-2xl font-bold">Premium</h3><p className="text-4xl font-bold my-4">₹2999<span className="text-base font-normal text-text-secondary">/mo</span></p><ul className="space-y-2 text-text-secondary"><li>✅ All Pro features</li><li>✅ Performance Guarantee</li></ul><button onClick={onNavigateToAuth} className="btn-secondary w-full mt-6">Enroll Now</button></div>
                        </div>
                    </div>
                </section>
                
                {/* FAQ Section */}
                <section ref={faqRef} className="bg-bg-primary">
                     <div ref={faqRefAnim} className="container mx-auto px-6 max-w-4xl stagger-children">
                         <h2 className="section-title">Common Questions Answered</h2>
                         <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <details key={i} className="faq-item p-4 bg-surface rounded-lg">
                                    <summary className="font-semibold text-lg flex justify-between items-center list-none">{faq.q}<ArrowRight className="h-5 w-5 transform transition-transform" /></summary>
                                    <p className="faq-content mt-2 text-text-secondary">{faq.a}</p>
                                </details>
                            ))}
                         </div>
                     </div>
                </section>
                
                {/* Final CTA */}
                <section className="final-cta-section">
                     <div ref={finalCtaRef} className="container mx-auto px-6 text-center stagger-children">
                        <h2 className="text-4xl font-bold text-text-primary">Ready to Transform Your Learning?</h2>
                        <p className="text-lg text-text-secondary mt-2">Join thousands of students achieving their goals with AlfaNumrik.</p>
                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            <button onClick={onNavigateToAuth} className="btn-primary text-lg px-8 py-3">Start Free Trial</button>
                            <button onClick={onNavigateToContact} className="btn-secondary text-lg px-8 py-3">Contact Us</button>
                        </div>
                        <p className="text-sm text-text-secondary mt-4">No credit card required for trial.</p>
                     </div>
                </section>
            </main>
            
            {/* 11. Footer */}
            <footer className="main-footer py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="col-span-2 md:col-span-1"><p className="font-bold text-lg"><span style={{ color: '#F97316' }}>Alfa</span><span style={{color: '#4FC3F7'}}>Numrik</span></p><p className="text-xs text-text-secondary mt-2">© 2025 AlfaNumrik EdTech Pvt Ltd.</p></div>
                        <div><h4 className="font-bold text-text-primary">About</h4><ul className="mt-2 space-y-2 text-sm"><li><button onClick={onNavigateToAbout} className="footer-link text-left">About Us</button></li><li><a href="#" className="footer-link">Team</a></li><li><a href="#" className="footer-link">Careers</a></li></ul></div>
                        <div><h4 className="font-bold text-text-primary">Courses</h4><ul className="mt-2 space-y-2 text-sm"><li><a href="#" className="footer-link">Math</a></li><li><a href="#" className="footer-link">Science</a></li><li><a href="#" className="footer-link">Competitive Prep</a></li></ul></div>
                        <div><h4 className="font-bold text-text-primary">Connect</h4><ul className="mt-2 space-y-2 text-sm"><li><button onClick={onNavigateToContact} className="footer-link text-left">Contact Us</button></li><li><a href="#" className="footer-link">LinkedIn</a></li><li><a href="#" className="footer-link">Twitter</a></li></ul></div>
                        <div><h4 className="font-bold text-text-primary">Legal</h4><ul className="mt-2 space-y-2 text-sm"><li><a href="#" className="footer-link">Terms of Use</a></li><li><a href="#" className="footer-link">Privacy Policy</a></li></ul></div>
                    </div>
                </div>
            </footer>

            {/* Floating CTA Button */}
            <button
                onClick={onNavigateToAuth}
                className={`floating-cta btn-primary flex items-center gap-2 ${isFloatingCtaVisible ? 'visible' : ''}`}
                aria-label="Start Free Trial"
            >
                <Rocket className="h-5 w-5" />
                <span>Start Free Trial</span>
            </button>
        </div>
    );
};

export default LandingPage;