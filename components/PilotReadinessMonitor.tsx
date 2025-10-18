import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { getDatabaseHealth } from '../services/optimizedDatabaseService';
import { getPerformanceMetrics } from '../services/geminiService';

interface HealthCheck {
    name: string;
    status: 'healthy' | 'warning' | 'error' | 'checking';
    message: string;
    details?: any;
    critical: boolean;
}

interface PilotReadinessProps {
    onClose?: () => void;
    showDetails?: boolean;
}

/**
 * Pilot Readiness Monitor Component
 * Checks critical systems and provides health status for pilot deployment
 */
export const PilotReadinessMonitor: React.FC<PilotReadinessProps> = ({ 
    onClose, 
    showDetails = false 
}) => {
    const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
    const [overallStatus, setOverallStatus] = useState<'healthy' | 'warning' | 'error' | 'checking'>('checking');
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const runHealthChecks = async () => {
        setOverallStatus('checking');
        const checks: HealthCheck[] = [];

        // 1. Environment Configuration Check
        try {
            const hasApiKey = !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY);
            checks.push({
                name: 'Gemini API Configuration',
                status: hasApiKey ? 'healthy' : 'error',
                message: hasApiKey ? 'API key configured' : 'Missing Gemini API key',
                critical: true
            });
        } catch (error) {
            checks.push({
                name: 'Environment Configuration',
                status: 'error',
                message: 'Failed to read environment variables',
                critical: true
            });
        }

        // 2. Database Health Check
        try {
            const dbHealth = await getDatabaseHealth();
            checks.push({
                name: 'IndexedDB Database',
                status: dbHealth.isConnected ? 'healthy' : 'error',
                message: dbHealth.isConnected 
                    ? `Connected (${dbHealth.totalRecords} records, ${dbHealth.stores.length} stores)` 
                    : 'Database connection failed',
                details: dbHealth,
                critical: true
            });
        } catch (error) {
            checks.push({
                name: 'Database Connection',
                status: 'error',
                message: 'Could not check database health',
                critical: true
            });
        }

        // 3. AI Service Performance Check
        try {
            const metrics = getPerformanceMetrics();
            const avgResponseTime = metrics.averageResponseTime;
            let status: HealthCheck['status'] = 'healthy';
            let message = 'AI services running optimally';
            
            if (avgResponseTime > 5000) {
                status = 'error';
                message = 'AI responses very slow (>5s avg)';
            } else if (avgResponseTime > 2000) {
                status = 'warning';
                message = `AI responses slow (${avgResponseTime.toFixed(0)}ms avg)`;
            } else if (avgResponseTime > 0) {
                message = `AI responses fast (${avgResponseTime.toFixed(0)}ms avg)`;
            }
            
            checks.push({
                name: 'AI Service Performance',
                status,
                message,
                details: metrics,
                critical: false
            });
        } catch (error) {
            checks.push({
                name: 'AI Service Performance',
                status: 'warning',
                message: 'Could not measure AI performance',
                critical: false
            });
        }

        // 4. Browser Compatibility Check
        const browserFeatures = {
            indexedDB: !!window.indexedDB,
            localStorage: !!window.localStorage,
            fetch: !!window.fetch,
            es6: typeof Promise !== 'undefined',
            webWorkers: typeof Worker !== 'undefined'
        };
        
        const unsupportedFeatures = Object.entries(browserFeatures)
            .filter(([_, supported]) => !supported)
            .map(([feature]) => feature);
        
        checks.push({
            name: 'Browser Compatibility',
            status: unsupportedFeatures.length === 0 ? 'healthy' : 'warning',
            message: unsupportedFeatures.length === 0 
                ? 'All features supported' 
                : `Unsupported: ${unsupportedFeatures.join(', ')}`,
            details: browserFeatures,
            critical: false
        });

        // 5. Memory Usage Check
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
            
            let status: HealthCheck['status'] = 'healthy';
            let message = `Memory usage: ${memoryUsageMB.toFixed(1)}MB`;
            
            if (memoryUsageMB > 100) {
                status = 'warning';
                message = `High memory usage: ${memoryUsageMB.toFixed(1)}MB`;
            }
            
            checks.push({
                name: 'Memory Usage',
                status,
                message,
                details: memory,
                critical: false
            });
        }

        // 6. Network Connectivity Check
        try {
            const start = performance.now();
            await fetch('https://www.google.com/favicon.ico', { 
                method: 'HEAD',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000)
            });
            const networkLatency = performance.now() - start;
            
            checks.push({
                name: 'Network Connectivity',
                status: networkLatency < 1000 ? 'healthy' : 'warning',
                message: `Network latency: ${networkLatency.toFixed(0)}ms`,
                critical: false
            });
        } catch (error) {
            checks.push({
                name: 'Network Connectivity',
                status: 'warning',
                message: 'Network check failed or slow',
                critical: false
            });
        }

        setHealthChecks(checks);
        setLastChecked(new Date());
        
        // Determine overall status
        const hasError = checks.some(c => c.status === 'error' && c.critical);
        const hasWarning = checks.some(c => c.status === 'warning');
        
        if (hasError) {
            setOverallStatus('error');
        } else if (hasWarning) {
            setOverallStatus('warning');
        } else {
            setOverallStatus('healthy');
        }
    };

    useEffect(() => {
        runHealthChecks();
        
        // Auto-refresh every 30 seconds if component stays mounted
        const interval = setInterval(runHealthChecks, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: HealthCheck['status']) => {
        switch (status) {
            case 'healthy': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
            case 'error': return <XCircleIcon className="w-5 h-5 text-red-500" />;
            case 'checking': return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
        }
    };

    const getOverallMessage = () => {
        switch (overallStatus) {
            case 'healthy': return '✅ System ready for pilot deployment';
            case 'warning': return '⚠️ System functional with minor issues';
            case 'error': return '❌ Critical issues detected - fix before pilot';
            case 'checking': return '🔍 Running health checks...';
        }
    };

    const criticalIssues = healthChecks.filter(c => c.status === 'error' && c.critical);
    const isPilotReady = criticalIssues.length === 0;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    🎧 Pilot Readiness Monitor
                </h2>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Overall Status */}
            <div className={`p-4 rounded-lg mb-6 ${
                overallStatus === 'healthy' ? 'bg-green-50 border border-green-200' :
                overallStatus === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                overallStatus === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
            }`}>
                <div className="flex items-center space-x-3">
                    {getStatusIcon(overallStatus)}
                    <div>
                        <h3 className="font-semibold text-lg">{getOverallMessage()}</h3>
                        {lastChecked && (
                            <p className="text-sm text-gray-600">
                                Last checked: {lastChecked.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
                
                {isPilotReady ? (
                    <div className="mt-3 p-3 bg-green-100 rounded">
                        <p className="font-medium text-green-800">
                            🚀 Your Alfanumrik app is ready for pilot deployment!
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            All critical systems are operational. You can proceed with school pilot testing.
                        </p>
                    </div>
                ) : (
                    <div className="mt-3 p-3 bg-red-100 rounded">
                        <p className="font-medium text-red-800">
                            🚫 Critical issues must be resolved before pilot
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                            Fix the issues marked as "Critical" below.
                        </p>
                    </div>
                )}
            </div>

            {/* Individual Health Checks */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Health Checks</h3>
                {healthChecks.map((check, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(check.status)}
                                <div>
                                    <h4 className="font-medium">
                                        {check.name}
                                        {check.critical && (
                                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                                Critical
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-gray-600">{check.message}</p>
                                </div>
                            </div>
                            
                            {showDetails && check.details && (
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-blue-600">Details</summary>
                                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                                        {JSON.stringify(check.details, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Items */}
            {criticalIssues.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">
                        🚨 Action Required Before Pilot
                    </h3>
                    <ul className="space-y-2">
                        {criticalIssues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <span className="text-red-500 mt-1">•</span>
                                <div>
                                    <span className="font-medium">{issue.name}:</span>
                                    <span className="ml-1">{issue.message}</span>
                                    {issue.name === 'Gemini API Configuration' && (
                                        <div className="mt-1 text-sm text-red-700">
                                            Fix: Add VITE_GEMINI_API_KEY to your .env.local file
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Pilot Readiness Score */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Pilot Readiness Score</h3>
                <div className="space-y-2">
                    {(() => {
                        const totalChecks = healthChecks.length;
                        const healthyCount = healthChecks.filter(c => c.status === 'healthy').length;
                        const score = totalChecks > 0 ? Math.round((healthyCount / totalChecks) * 100) : 0;
                        
                        return (
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Readiness Score</span>
                                        <span className="font-medium">{score}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                score >= 90 ? 'bg-green-500' :
                                                score >= 70 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                            style={{ width: `${score}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="text-2xl">
                                    {score >= 90 ? '🎆' : score >= 70 ? '🟡' : '🔴'}
                                </div>
                            </div>
                        );
                    })()
                    }
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <button
                    onClick={runHealthChecks}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={overallStatus === 'checking'}
                >
                    {overallStatus === 'checking' ? 'Checking...' : 'Refresh Checks'}
                </button>
                
                {isPilotReady && (
                    <div className="flex space-x-3">
                        <a 
                            href="https://vercel.com/new" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Deploy to Production
                        </a>
                        <button 
                            onClick={() => navigator.clipboard?.writeText(window.location.origin)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Copy Pilot URL
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Mini health status indicator for header/footer
 */
export const HealthStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState<'healthy' | 'warning' | 'error' | 'checking'>('checking');
    const [showMonitor, setShowMonitor] = useState(false);

    useEffect(() => {
        const quickHealthCheck = async () => {
            try {
                const hasApiKey = !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY);
                const dbHealth = await getDatabaseHealth();
                
                if (!hasApiKey || !dbHealth.isConnected) {
                    setStatus('error');
                } else {
                    setStatus('healthy');
                }
            } catch {
                setStatus('error');
            }
        };

        quickHealthCheck();
        const interval = setInterval(quickHealthCheck, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            case 'checking': return 'bg-blue-500 animate-pulse';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'healthy': return 'System Healthy';
            case 'warning': return 'Minor Issues';
            case 'error': return 'Critical Issues';
            case 'checking': return 'Checking...';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMonitor(true)}
                className="flex items-center space-x-2 px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                title={getStatusText()}
            >
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm text-gray-600">Health</span>
            </button>
            
            {showMonitor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="max-w-4xl max-h-[90vh] overflow-auto">
                        <PilotReadinessMonitor 
                            onClose={() => setShowMonitor(false)}
                            showDetails={process.env.NODE_ENV === 'development'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PilotReadinessMonitor;