import React from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

interface ContactScreenProps {
  onBack: () => void;
}

const ContactScreen: React.FC<ContactScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would handle form submission to a backend.
    alert("Thank you for your message! We will get back to you shortly.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('backToHome')}
      </button>

      <div className="dashboard-highlight-card p-8 md:p-12">
        <header className="text-center border-b border-border-color pb-8 mb-8">
            <Mail className="h-12 w-12 mx-auto text-primary"/>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mt-3">Contact Us</h1>
            <p className="text-lg text-text-secondary mt-2 max-w-2xl mx-auto">We'd love to hear from you. Reach out with any questions or feedback.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <Phone className="h-6 w-6 text-primary" />
                        Get in Touch
                    </h2>
                    <p className="mt-3 text-text-secondary text-lg"><strong>Email:</strong> <a href="mailto:support@alfanumrik.com" className="text-primary hover:underline">support@alfanumrik.com</a></p>
                    <p className="mt-1 text-text-secondary text-lg"><strong>Phone:</strong> <a href="tel:+919876543210" className="text-primary hover:underline">+91-9876543210</a></p>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-primary" />
                        Our Office
                    </h2>
                    <p className="mt-3 text-text-secondary text-lg">
                        123 Learning Lane,<br/>
                        Knowledge City, New Delhi - 110001,<br/>
                        India
                    </p>
                </div>
            </div>

            {/* Contact Form */}
            <div>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="contact-name" className="block text-sm font-bold text-text-secondary mb-1">Your Name</label>
                        <input id="contact-name" type="text" name="name" className="w-full" required />
                    </div>
                     <div>
                        <label htmlFor="contact-email" className="block text-sm font-bold text-text-secondary mb-1">Your Email</label>
                        <input id="contact-email" type="email" name="email" className="w-full" required />
                    </div>
                     <div>
                        <label htmlFor="contact-message" className="block text-sm font-bold text-text-secondary mb-1">Message</label>
                        <textarea id="contact-message" name="message" className="w-full" rows={4} required></textarea>
                    </div>
                    <button type="submit" className="w-full btn-accent">
                        Send Message
                    </button>
                 </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContactScreen;