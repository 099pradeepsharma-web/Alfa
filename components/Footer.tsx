import React from 'react';
import { useLanguage } from '../contexts/Language-context';
import Logo from './Logo';

interface FooterProps {
    onShowAbout: () => void;
    onShowPrivacyPolicy: () => void;
    onShowTerms: () => void;
    onShowFaq: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShowAbout, onShowPrivacyPolicy, onShowTerms, onShowFaq }) => {
    const { t } = useLanguage();

    const footerLinks = [
        { label: t('aboutUs'), action: onShowAbout },
        { label: t('viewPrivacyPolicy'), action: onShowPrivacyPolicy },
        { label: t('termsOfService'), action: onShowTerms },
        { label: t('faqAndHelp'), action: onShowFaq },
    ];

    return (
        <footer className="bg-surface py-6">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Logo size={24} />
                            <p className="font-bold text-text-primary">{t('appTitle')}</p>
                        </div>
                        <p className="text-xs text-text-secondary/80 mt-1">{t('copyright')}</p>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {footerLinks.map(link => (
                            <button key={link.label} onClick={link.action} className="footer-link text-sm">
                                {link.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer;