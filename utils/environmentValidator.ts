/**
 * Environment Validation Utility for Alfanumrik
 * Ensures all required environment variables are properly configured
 */

interface EnvConfig {
    VITE_GEMINI_API_KEY?: string;
    VITE_APP_NAME?: string;
    VITE_APP_VERSION?: string;
    VITE_DEFAULT_LANGUAGE?: string;
    VITE_THEME_MODE?: string;
    VITE_ENABLE_DEBUG?: string;
    VITE_ENABLE_PERFORMANCE_MONITOR?: string;
    VITE_ENABLE_API_CACHE?: string;
    VITE_PILOT_MODE?: string;
    NODE_ENV?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    config: EnvConfig;
}

/**
 * Validates environment configuration and provides helpful error messages
 */
export const validateEnvironment = (): ValidationResult => {
    const config: EnvConfig = {
        VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
        VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
        VITE_DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE,
        VITE_THEME_MODE: import.meta.env.VITE_THEME_MODE,
        VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
        VITE_ENABLE_PERFORMANCE_MONITOR: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITOR,
        VITE_ENABLE_API_CACHE: import.meta.env.VITE_ENABLE_API_CACHE,
        VITE_PILOT_MODE: import.meta.env.VITE_PILOT_MODE,
        NODE_ENV: import.meta.env.NODE_ENV || import.meta.env.MODE
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    // Critical validations
    if (!config.VITE_GEMINI_API_KEY) {
        errors.push(
            'VITE_GEMINI_API_KEY is missing. Get your API key from https://ai.studio/ and add it to .env.local'
        );
    } else if (!config.VITE_GEMINI_API_KEY.startsWith('AIzaSy')) {
        errors.push(
            'VITE_GEMINI_API_KEY appears to be invalid. Gemini API keys should start with "AIzaSy"'
        );
    }

    // App configuration validations
    if (!config.VITE_APP_NAME) {
        warnings.push('VITE_APP_NAME not set. Using default "Alfanumrik"');
    }

    if (!config.VITE_APP_VERSION) {
        warnings.push('VITE_APP_VERSION not set. Using default "0.0.0"');
    }

    // Language validation
    if (config.VITE_DEFAULT_LANGUAGE && !['en', 'hi'].includes(config.VITE_DEFAULT_LANGUAGE)) {
        warnings.push(
            `VITE_DEFAULT_LANGUAGE "${config.VITE_DEFAULT_LANGUAGE}" is not supported. Use "en" or "hi"`
        );
    }

    // Theme validation
    if (config.VITE_THEME_MODE && !['light', 'dark', 'auto'].includes(config.VITE_THEME_MODE)) {
        warnings.push(
            `VITE_THEME_MODE "${config.VITE_THEME_MODE}" is not supported. Use "light", "dark", or "auto"`
        );
    }

    // Development vs Production checks
    if (config.NODE_ENV === 'production') {
        if (config.VITE_ENABLE_DEBUG === 'true') {
            warnings.push('Debug mode is enabled in production. Consider disabling for better performance.');
        }
    }

    const isValid = errors.length === 0;

    return {
        isValid,
        errors,
        warnings,
        config
    };
};

/**
 * Gets environment configuration with defaults
 */
export const getEnvironmentConfig = () => {
    const validation = validateEnvironment();
    
    return {
        // API Configuration
        geminiApiKey: validation.config.VITE_GEMINI_API_KEY || '',
        
        // App Configuration
        appName: validation.config.VITE_APP_NAME || 'Alfanumrik',
        appVersion: validation.config.VITE_APP_VERSION || '0.1.0',
        
        // UI Configuration
        defaultLanguage: validation.config.VITE_DEFAULT_LANGUAGE || 'en',
        themeMode: validation.config.VITE_THEME_MODE || 'light',
        
        // Feature Flags
        enableDebug: validation.config.VITE_ENABLE_DEBUG === 'true',
        enablePerformanceMonitor: validation.config.VITE_ENABLE_PERFORMANCE_MONITOR === 'true',
        enableApiCache: validation.config.VITE_ENABLE_API_CACHE !== 'false', // Default true
        pilotMode: validation.config.VITE_PILOT_MODE === 'true',
        
        // Environment
        isDevelopment: validation.config.NODE_ENV === 'development',
        isProduction: validation.config.NODE_ENV === 'production',
        
        // Validation Results
        validation
    };
};

/**
 * React hook for environment configuration
 */
import { useState, useEffect } from 'react';

export const useEnvironmentConfig = () => {
    const [config, setConfig] = useState(getEnvironmentConfig());
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const envConfig = getEnvironmentConfig();
        setConfig(envConfig);
        setIsInitialized(true);

        // Log validation results in development
        if (envConfig.isDevelopment) {
            const { validation } = envConfig;
            
            if (validation.errors.length > 0) {
                console.group('🚨 Environment Configuration Errors');
                validation.errors.forEach(error => console.error(`❌ ${error}`));
                console.groupEnd();
            }
            
            if (validation.warnings.length > 0) {
                console.group('⚠️ Environment Configuration Warnings');
                validation.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
                console.groupEnd();
            }
            
            if (validation.isValid) {
                console.log('✅ Environment configuration is valid');
            }
        }
    }, []);

    return {
        config,
        isInitialized,
        isValid: config.validation.isValid,
        errors: config.validation.errors,
        warnings: config.validation.warnings
    };
};

/**
 * Environment configuration guard component
 * Shows error screen if critical environment issues are detected
 */
export const EnvironmentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isInitialized, isValid, errors, config } = useEnvironmentConfig();

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Initializing Alfanumrik...</p>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircleIcon className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Configuration Required
                        </h1>
                        <p className="text-gray-600">
                            Alfanumrik needs to be configured before it can run.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg text-red-800">
                            Required Actions:
                        </h2>
                        <ul className="space-y-2">
                            {errors.map((error, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                    <span className="text-red-500 mt-1 font-bold">•</span>
                                    <span className="text-red-700">{error}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-blue-800 mb-2">
                                📄 Quick Setup Steps:
                            </h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                                <li>Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in your project root</li>
                                <li>Add <code className="bg-blue-100 px-1 rounded">VITE_GEMINI_API_KEY=your_api_key_here</code></li>
                                <li>Get your API key from <a href="https://ai.studio/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                                <li>Restart your development server</li>
                            </ol>
                        </div>
                        
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Refresh After Configuration
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Configuration is valid, render the app
    return <>{children}</>;
};

// Utility function to check if running in a supported environment
export const isSupportedEnvironment = (): boolean => {
    if (typeof window === 'undefined') {
        return false; // Server-side rendering not supported
    }
    
    const requiredFeatures = {
        indexedDB: !!window.indexedDB,
        localStorage: !!window.localStorage,
        fetch: !!window.fetch,
        webWorkers: typeof Worker !== 'undefined',
        es6: typeof Promise !== 'undefined'
    };
    
    return Object.values(requiredFeatures).every(Boolean);
};

// Export configuration getter for use throughout the app
export const env = getEnvironmentConfig();

export default {
    validateEnvironment,
    getEnvironmentConfig,
    useEnvironmentConfig,
    EnvironmentGuard,
    isSupportedEnvironment,
    env
};