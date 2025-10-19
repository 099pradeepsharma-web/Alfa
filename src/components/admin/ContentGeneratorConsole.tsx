import React, { useState } from 'react';

// Placeholder API, replace with real content pipeline
const aiApi = {
  queueRequest: async (req) => ({ id: Math.random().toString(36).substring(2) }),
  getQueue: async () => [],
  getCache: async () => [],
};

export const ContentGeneratorConsole = () => {
  const [form, setForm] = useState({ grade: '', subject: '', skill: '', difficulty: 'Medium', type: 'mcq', language: 'en' });
  const [status, setStatus] = useState('idle');
  const [queue, setQueue] = useState([]);
  const [cache, setCache] = useState([]);
  const [lastId, setLastId] = useState('');

  const handleUpdate = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    setStatus('queueing...');
    const resp = await aiApi.queueRequest(form);
    setLastId(resp.id);
    setStatus('queued');
    // Optionally refresh queue/cache
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">AI Content Generator Console</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <label className="flex flex-col gap-1">Grade<input value={form.grade} onChange={e => handleUpdate('grade', e.target.value)} className="border rounded p-2" /></label>
        <label className="flex flex-col gap-1">Subject<input value={form.subject} onChange={e => handleUpdate('subject', e.target.value)} className="border rounded p-2" /></label>
        <label className="flex flex-col gap-1">Skill<input value={form.skill} onChange={e => handleUpdate('skill', e.target.value)} className="border rounded p-2" /></label>
        <label className="flex flex-col gap-1">Difficulty
          <select value={form.difficulty} onChange={e => handleUpdate('difficulty', e.target.value)} className="border rounded p-2">
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">Type
          <select value={form.type} onChange={e => handleUpdate('type', e.target.value)} className="border rounded p-2">
            <option value="mcq">MCQ</option>
            <option value="explanation">Explanation</option>
            <option value="worksheet">Worksheet</option>
            <option value="lesson_plan">Lesson Plan</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">Language<input value={form.language} onChange={e => handleUpdate('language', e.target.value)} className="border rounded p-2" /></label>
      </div>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium" onClick={handleSubmit} disabled={status === 'queueing...'}>Queue Generate</button>
      {lastId && <div className="mt-2 text-green-700">Queued job {lastId}</div>}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Queue</h3>
        <pre className="bg-gray-100 rounded p-2 text-xs">{JSON.stringify(queue, null, 2)}</pre>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Cache</h3>
        <pre className="bg-gray-100 rounded p-2 text-xs">{JSON.stringify(cache, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ContentGeneratorConsole;
