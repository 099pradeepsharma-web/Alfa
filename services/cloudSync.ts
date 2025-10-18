/**
 * Cloud Sync Service for Alfanumrik
 * Synchronizes data between IndexedDB (local) and Supabase (cloud)
 * Provides offline-first experience with cloud backup and multi-device sync
 */

import { supabase, DataService, ProfileService, Profile } from './supabase';
import * as localDB from './databaseService';
import { Student, PerformanceRecord, StudyGoal, Achievement, StudentQuestion } from '../types';

interface SyncStatus {
    lastSync: string | null;
    syncing: boolean;
    error: string | null;
    pendingUploads: number;
    pendingDownloads: number;
}

class CloudSyncService {
    private syncStatus: SyncStatus = {
        lastSync: null,
        syncing: false,
        error: null,
        pendingUploads: 0,
        pendingDownloads: 0
    };
    
    private syncIntervalId: NodeJS.Timeout | null = null;
    private isOnline = navigator.onLine;
    
    constructor() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.startAutoSync();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.stopAutoSync();
        });
    }

    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus {
        return { ...this.syncStatus };
    }

    /**
     * Start automatic syncing every 60 seconds when online
     */
    startAutoSync(intervalMs = 60000): void {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
        }
        
        if (this.isOnline) {
            this.syncIntervalId = setInterval(() => {
                this.syncToCloud().catch(error => {
                    console.warn('Auto-sync failed:', error);
                });
            }, intervalMs);
            
            console.log('🔄 Auto-sync started (every 60s)');
        }
    }

    /**
     * Stop automatic syncing
     */
    stopAutoSync(): void {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
            console.log('⏸️ Auto-sync stopped');
        }
    }

    /**
     * Manual sync trigger - syncs all data for current user
     */
    async syncToCloud(userId?: string): Promise<{ success: boolean; error?: string }> {
        if (!this.isOnline) {
            return { success: false, error: 'No internet connection' };
        }
        
        if (this.syncStatus.syncing) {
            return { success: false, error: 'Sync already in progress' };
        }
        
        // Get current user if not provided
        if (!userId) {
            const { user } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }
            userId = user.id;
        }
        
        this.syncStatus.syncing = true;
        this.syncStatus.error = null;
        
        try {
            console.log('🔄 Starting cloud sync...');
            
            // Sync each data type
            await this.syncPerformanceRecords(userId);
            await this.syncStudyGoals(userId);
            await this.syncAchievements(userId);
            await this.syncQuestions(userId);
            
            this.syncStatus.lastSync = new Date().toISOString();
            this.syncStatus.syncing = false;
            
            console.log('✅ Cloud sync completed successfully');
            return { success: true };
            
        } catch (error) {
            this.syncStatus.syncing = false;
            this.syncStatus.error = error instanceof Error ? error.message : 'Unknown sync error';
            
            console.error('❌ Cloud sync failed:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Sync failed' 
            };
        }
    }

    /**
     * Sync performance records between local and cloud
     */
    private async syncPerformanceRecords(userId: string): Promise<void> {
        console.log('📊 Syncing performance records...');
        
        // Get local performance records
        const localRecords = await localDB.queryCollectionByIndex<PerformanceRecord & { studentId: string }>(
            'performance', 
            'studentId', 
            userId
        );
        
        // Get cloud performance records
        const cloudRecords = await DataService.getPerformance(userId);
        
        // Find records to upload (exist locally but not in cloud)
        const cloudIds = new Set(cloudRecords.map(r => this.generatePerformanceId(r)));
        const toUpload = localRecords.filter(r => 
            !cloudIds.has(this.generatePerformanceId({
                subject: r.subject,
                chapter: r.chapter, 
                score: r.score,
                completed_date: r.completedDate
            }))
        );
        
        // Upload missing records
        for (const record of toUpload) {
            const cloudRecord = {
                id: crypto.randomUUID(),
                student_id: userId,
                subject: record.subject,
                chapter: record.chapter,
                score: record.score,
                total_questions: 10, // Default, can be enhanced
                type: record.type || 'quiz',
                difficulty: record.difficulty || 'Medium',
                completed_date: record.completedDate,
                created_at: new Date().toISOString()
            };
            
            await DataService.savePerformance(cloudRecord);
        }
        
        // Download missing records to local (server-wins conflict resolution)
        const localIds = new Set(localRecords.map(r => this.generatePerformanceId({
            subject: r.subject,
            chapter: r.chapter,
            score: r.score, 
            completed_date: r.completedDate
        })));
        
        const toDownload = cloudRecords.filter(r => 
            !localIds.has(this.generatePerformanceId(r))
        );
        
        for (const record of toDownload) {
            const localRecord = {
                ...record,
                studentId: userId,
                completedDate: record.completed_date
            };
            
            await localDB.addDocToCollection('performance', localRecord);
        }
        
        console.log(`📊 Performance sync: ${toUpload.length} uploaded, ${toDownload.length} downloaded`);
    }

    /**
     * Sync study goals between local and cloud
     */
    private async syncStudyGoals(userId: string): Promise<void> {
        console.log('🎯 Syncing study goals...');
        
        // Get local goals
        const localGoals = await localDB.queryCollectionByIndex<StudyGoal & { studentId: string }>(
            'studyGoals', 
            'studentId', 
            userId
        );
        
        // Get cloud goals
        const cloudGoals = await DataService.getStudyGoals(userId);
        
        // Upload new local goals
        const cloudIds = new Set(cloudGoals.map(g => g.id));
        const toUpload = localGoals.filter(g => !cloudIds.has(g.id));
        
        for (const goal of toUpload) {
            const cloudGoal = {
                id: goal.id,
                student_id: userId,
                text: goal.text,
                is_completed: goal.isCompleted,
                due_date: goal.dueDate || null,
                created_at: goal.createdAt,
                completed_at: goal.isCompleted ? new Date().toISOString() : null
            };
            
            await DataService.saveStudyGoal(cloudGoal);
        }
        
        // Download new cloud goals
        const localIds = new Set(localGoals.map(g => g.id));
        const toDownload = cloudGoals.filter(g => !localIds.has(g.id));
        
        for (const goal of toDownload) {
            const localGoal = {
                id: goal.id,
                studentId: userId,
                text: goal.text,
                isCompleted: goal.is_completed,
                dueDate: goal.due_date,
                createdAt: goal.created_at
            };
            
            await localDB.addDocToCollection('studyGoals', localGoal);
        }
        
        // Sync completion status updates (server wins)
        const toUpdate = localGoals.filter(local => {
            const cloud = cloudGoals.find(c => c.id === local.id);
            return cloud && local.isCompleted !== cloud.is_completed;
        });
        
        for (const goal of toUpdate) {
            const cloudGoal = cloudGoals.find(c => c.id === goal.id)!;
            
            // Update local to match cloud (server wins)
            const updatedLocal = {
                ...goal,
                isCompleted: cloudGoal.is_completed
            };
            
            await localDB.updateDocInCollection('studyGoals', goal.id, updatedLocal);
        }
        
        console.log(`🎯 Goals sync: ${toUpload.length} uploaded, ${toDownload.length} downloaded, ${toUpdate.length} updated`);
    }

    /**
     * Sync achievements between local and cloud
     */
    private async syncAchievements(userId: string): Promise<void> {
        console.log('🏆 Syncing achievements...');
        
        // Get local achievements
        const localAchievements = await localDB.queryCollectionByIndex<Achievement & { studentId: string }>(
            'achievements',
            'studentId', 
            userId
        );
        
        // Get cloud achievements
        const cloudAchievements = await DataService.getAchievements(userId);
        
        // Upload new local achievements
        const cloudTitles = new Set(cloudAchievements.map(a => `${a.title}_${a.created_at.split('T')[0]}`));
        const toUpload = localAchievements.filter(a => 
            !cloudTitles.has(`${a.title}_${a.timestamp.split('T')[0]}`)
        );
        
        for (const achievement of toUpload) {
            const cloudAchievement = {
                id: crypto.randomUUID(),
                student_id: userId,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                points: achievement.points || 0,
                category: this.mapAchievementCategory(achievement.title),
                created_at: achievement.timestamp
            };
            
            await DataService.saveAchievement(cloudAchievement);
        }
        
        // Download new cloud achievements
        const localTitles = new Set(localAchievements.map(a => `${a.title}_${a.timestamp.split('T')[0]}`));
        const toDownload = cloudAchievements.filter(a => 
            !localTitles.has(`${a.title}_${a.created_at.split('T')[0]}`)
        );
        
        for (const achievement of toDownload) {
            const localAchievement = {
                studentId: userId,
                title: achievement.title,
                description: achievement.description || '',
                icon: achievement.icon,
                points: achievement.points,
                timestamp: achievement.created_at
            };
            
            await localDB.addDocToCollection('achievements', localAchievement);
        }
        
        console.log(`🏆 Achievements sync: ${toUpload.length} uploaded, ${toDownload.length} downloaded`);
    }

    /**
     * Sync student questions between local and cloud
     */
    private async syncQuestions(userId: string): Promise<void> {
        console.log('❓ Syncing student questions...');
        
        // Get local questions
        const localQuestions = await localDB.queryCollectionByIndex<StudentQuestion>(
            'questions',
            'studentId',
            userId
        );
        
        // Get cloud questions
        const cloudQuestions = await DataService.getQuestions(userId);
        
        // Upload new local questions
        const cloudIds = new Set(cloudQuestions.map(q => q.id));
        const toUpload = localQuestions.filter(q => !cloudIds.has(q.id));
        
        for (const question of toUpload) {
            const cloudQuestion = {
                id: question.id,
                student_id: userId,
                subject: question.subject,
                chapter: question.chapter,
                concept: question.concept,
                question_text: question.questionText,
                ai_response: question.fittoResponse || null,
                is_resolved: !!question.fittoResponse,
                created_at: question.timestamp
            };
            
            await DataService.saveQuestion(cloudQuestion);
        }
        
        // Download new cloud questions
        const localIds = new Set(localQuestions.map(q => q.id));
        const toDownload = cloudQuestions.filter(q => !localIds.has(q.id));
        
        for (const question of toDownload) {
            const localQuestion: StudentQuestion = {
                id: question.id,
                studentId: userId,
                subject: question.subject,
                chapter: question.chapter,
                concept: question.concept,
                questionText: question.question_text,
                fittoResponse: question.ai_response,
                timestamp: question.created_at
            };
            
            await localDB.addDocToCollection('questions', localQuestion);
        }
        
        console.log(`❓ Questions sync: ${toUpload.length} uploaded, ${toDownload.length} downloaded`);
    }

    /**
     * Initialize sync for a newly authenticated user
     */
    async initializeUserSync(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('🚀 Initializing user sync...');
            
            // Check if user has cloud profile
            let profile = await ProfileService.getProfile(userId);
            
            if (!profile) {
                // Create new profile from any existing local data
                const localUsers = await localDB.getAllDocs<Student>('users');
                const localUser = localUsers.find(u => u.email) || null;
                
                profile = await ProfileService.upsertProfile(userId, {
                    role: 'student',
                    full_name: localUser?.name || null,
                    grade: localUser?.grade || null,
                    school_name: localUser?.school || null
                });
            }
            
            // Perform initial bi-directional sync
            await this.syncToCloud(userId);
            
            // Start auto-sync
            this.startAutoSync();
            
            return { success: true };
            
        } catch (error) {
            console.error('User sync initialization failed:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Initialization failed' 
            };
        }
    }

    /**
     * Get student data from cloud (for teacher dashboard)
     */
    async getStudentCloudData(studentId: string): Promise<{
        profile: Profile | null;
        performance: PerformanceRecord[];
        goals: StudyGoal[];
        achievements: Achievement[];
    }> {
        const [profile, performanceDB, goalsDB, achievementsDB] = await Promise.all([
            ProfileService.getProfile(studentId),
            DataService.getPerformance(studentId, 20),
            DataService.getStudyGoals(studentId),
            DataService.getAchievements(studentId)
        ]);
        
        // Convert cloud data to app types
        const performance: PerformanceRecord[] = performanceDB.map(p => ({
            subject: p.subject,
            chapter: p.chapter,
            score: p.score,
            completedDate: p.completed_date,
            type: p.type,
            difficulty: p.difficulty || 'Medium',
            context: ''
        }));
        
        const goals: StudyGoal[] = goalsDB.map(g => ({
            id: g.id,
            text: g.text,
            isCompleted: g.is_completed,
            dueDate: g.due_date,
            createdAt: g.created_at
        }));
        
        const achievements: Achievement[] = achievementsDB.map(a => ({
            title: a.title,
            description: a.description || '',
            icon: a.icon,
            points: a.points,
            timestamp: a.created_at
        }));
        
        return { profile, performance, goals, achievements };
    }

    /**
     * Force sync from cloud (download-only, server wins)
     */
    async pullFromCloud(userId: string): Promise<{ success: boolean; error?: string }> {
        if (!this.isOnline) {
            return { success: false, error: 'No internet connection' };
        }
        
        try {
            console.log('⬇️ Pulling data from cloud...');
            
            const cloudData = await this.getStudentCloudData(userId);
            
            // Clear and replace local data with cloud data (server wins)
            await localDB.clearStore('performance');
            await localDB.clearStore('studyGoals');
            await localDB.clearStore('achievements');
            
            // Repopulate with cloud data
            for (const perf of cloudData.performance) {
                await localDB.addDocToCollection('performance', { ...perf, studentId: userId });
            }
            
            for (const goal of cloudData.goals) {
                await localDB.addDocToCollection('studyGoals', { ...goal, studentId: userId });
            }
            
            for (const achievement of cloudData.achievements) {
                await localDB.addDocToCollection('achievements', { ...achievement, studentId: userId });
            }
            
            console.log('✅ Cloud data pulled successfully');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Pull from cloud failed:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Pull failed' 
            };
        }
    }

    /**
     * Helper: Generate unique ID for performance records to detect duplicates
     */
    private generatePerformanceId(record: { subject: string; chapter: string; score: number; completed_date: string }): string {
        const date = record.completed_date.split('T')[0]; // YYYY-MM-DD
        return `${record.subject}_${record.chapter}_${record.score}_${date}`;
    }

    /**
     * Helper: Map achievement titles to categories
     */
    private mapAchievementCategory(title: string): 'academic' | 'streak' | 'improvement' | 'milestone' {
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('streak') || lowerTitle.includes('day')) {
            return 'streak';
        } else if (lowerTitle.includes('score') || lowerTitle.includes('improvement')) {
            return 'improvement';
        } else if (lowerTitle.includes('chapter') || lowerTitle.includes('complete')) {
            return 'milestone';
        } else {
            return 'academic';
        }
    }

    /**
     * Clear all sync data (for logout or reset)
     */
    async clearSyncData(): Promise<void> {
        this.stopAutoSync();
        this.syncStatus = {
            lastSync: null,
            syncing: false,
            error: null,
            pendingUploads: 0,
            pendingDownloads: 0
        };
        
        console.log('🗑️ Sync data cleared');
    }

    /**
     * Get sync statistics for diagnostics
     */
    async getSyncStats(userId: string): Promise<{
        local: { performance: number; goals: number; achievements: number; questions: number };
        cloud: { performance: number; goals: number; achievements: number; questions: number };
        lastSync: string | null;
    }> {
        const [localPerf, localGoals, localAch, localQ, cloudPerf, cloudGoals, cloudAch, cloudQ] = await Promise.all([
            localDB.queryCollectionByIndex('performance', 'studentId', userId),
            localDB.queryCollectionByIndex('studyGoals', 'studentId', userId),
            localDB.queryCollectionByIndex('achievements', 'studentId', userId),
            localDB.queryCollectionByIndex('questions', 'studentId', userId),
            DataService.getPerformance(userId),
            DataService.getStudyGoals(userId),
            DataService.getAchievements(userId),
            DataService.getQuestions(userId)
        ]);
        
        return {
            local: {
                performance: localPerf.length,
                goals: localGoals.length,
                achievements: localAch.length,
                questions: localQ.length
            },
            cloud: {
                performance: cloudPerf.length,
                goals: cloudGoals.length,
                achievements: cloudAch.length,
                questions: cloudQ.length
            },
            lastSync: this.syncStatus.lastSync
        };
    }
}

// Export singleton instance
export const cloudSync = new CloudSyncService();

// React hooks for sync status
import { useState, useEffect } from 'react';

/**
 * Hook to monitor sync status in React components
 */
export const useSyncStatus = () => {
    const [status, setStatus] = useState(cloudSync.getSyncStatus());
    
    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(cloudSync.getSyncStatus());
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);
    
    return status;
};

/**
 * Hook to trigger manual sync with loading state
 */
export const useManualSync = () => {
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const triggerSync = async (userId?: string) => {
        setSyncing(true);
        setError(null);
        
        const result = await cloudSync.syncToCloud(userId);
        
        if (!result.success) {
            setError(result.error || 'Sync failed');
        }
        
        setSyncing(false);
        return result;
    };
    
    return { triggerSync, syncing, error };
};

export default cloudSync;