import React, { useState, useEffect } from 'react';
// Placeholder LMS service - replace with real API hooks
const lmsApi = {
  listConnections: async () => [],
  createConnection: async (payload) => null,
  startOAuth: async (opts) => null,
  runDrySync: async (connectionId) => ({ sample: { courses: [], users: [] }, counts: {} }),
};

export const LMSConnections = () => {
  const [connections, setConnections] = useState([]);
  const [connectingLMS, setConnectingLMS] = useState('');
  const [dryRunResult, setDryRunResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    lmsApi.listConnections().then(setConnections);
  }, []);

  // Start the OAuth or token process for an LMS
  const handleStartConnect = async (type) => {
    setConnectingLMS(type);
    setStatus('authing');
    // Placeholder – real implementation would redirect, etc.
    const resp = await lmsApi.startOAuth({ lms_type: type });
    if (resp && resp.url) window.location.href = resp.url;
    setStatus('idle');
  };

  const handleDryRun = async (connectionId) => {
    setDryRunResult(null);
    setStatus('syncing');
    try {
      const result = await lmsApi.runDrySync(connectionId);
      setDryRunResult(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">LMS Integrations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button onClick={() => handleStartConnect('google_classroom')} className="p-4 border rounded-lg bg-blue-50 text-blue-800 font-medium">Connect Google Classroom</button>
        <button onClick={() => handleStartConnect('canvas')} className="p-4 border rounded-lg bg-green-50 text-green-800 font-medium">Connect Canvas</button>
        <button onClick={() => handleStartConnect('moodle')} className="p-4 border rounded-lg bg-yellow-50 text-yellow-800 font-medium">Connect Moodle</button>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Existing Connections</h3>
        {connections.length === 0 && <p className="text-gray-500">No LMS connections found.</p>}
        {connections.map(conn => (
          <div key={conn.id} className="flex gap-2 items-center mb-2 border-b pb-2">
            <span className="font-semibold">{conn.lms_type}</span>
            <span className={`rounded px-2 py-1 text-xs bg-gray-100 border border-gray-200 ml-2 ${conn.status === 'connected' ? 'text-green-600 border-green-200' : 'text-yellow-700'}`}>{conn.status}</span>
            <button onClick={() => handleDryRun(conn.id)} className="ml-auto px-4 py-1 rounded bg-gray-100">Dry-Run Sync</button>
          </div>
        ))}
      </div>
      {dryRunResult && (
        <div className="mt-6 bg-gray-50 border p-4 rounded-lg">
          <div className="font-bold mb-2">Dry-Run Results:</div>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(dryRunResult, null, 2)}
          </pre>
        </div>
      )}
      {status !== 'idle' && <div className="p-3 text-yellow-600">{status}...</div>}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
};

export default LMSConnections;
