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
        <footer className="bg-surface border-t border-border-color mt-16 py-8">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Logo size={40} />
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">{t('appTitle')}</h3>
                            <p className="text-xs text-text-secondary -mt-1">{t('appSubtitle')}</p>
                        </div>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {footerLinks.map(link => (
                            <button key={link.label} onClick={link.action} className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                                {link.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-8 pt-6 border-t border-border-color text-center text-sm text-text-secondary">
                    <p>{t('copyright')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
