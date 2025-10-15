

import { Student, Teacher, Parent } from '../types';
import * as db from './databaseService';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_PARENTS } from '../data/mockData';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

type Role = 'student' | 'teacher' | 'parent';
type User = Student | Teacher | Parent;
type Session = { user: User; role: Role };

const SESSION_KEY = 'alfanumrik-session';

/**
 * Initializes the database by seeding it with mock users if it's empty.
 * This ensures the demo has users to log in with on the first run.
 */
export const initializeDatabase = async () => {
    try {
        const userCount = await db.countDocs('users');
        if (userCount === 0) {
            console.log("Seeding database with initial mock data...");
            // Clear all user-related stores to ensure a clean slate
            await Promise.all([
                db.clearStore('users'),
                db.clearStore('teachers'),
                db.clearStore('parents'),
            ]);

            // Seed users
            for (const student of MOCK_STUDENTS) {
                await db.addDocToCollection('users', student);
            }
            for (const teacher of MOCK_TEACHERS) {
                await db.addDocToCollection('teachers', teacher);
            }
            for (const parent of MOCK_PARENTS) {
                await db.addDocToCollection('parents', parent);
            }
            console.log("Database seeded successfully.");
        }
    } catch (error) {
        console.error("Error during database initialization:", error);
    }
};

/**
 * Logs in a user by checking credentials against the database.
 */
export const login = async (role: Role, email: string, password: string): Promise<Session> => {
    let user: any;
    
    if (role === 'student') {
        const allStudents = await db.getAllDocs<Student & { password?: string }>('users');
        user = allStudents.find(u => u.email === email);
    } else if (role === 'teacher') {
        const allTeachers = await db.getAllDocs<Teacher & { password?: string }>('teachers');
        user = allTeachers.find(u => u.email === email);
    } else if (role === 'parent') {
        const allParents = await db.getAllDocs<Parent & { password?: string }>('parents');
        user = allParents.find(u => u.email === email);
    }

    if (user && user.password === password) {
        const { password, ...userToReturn } = user;
        const session = { user: userToReturn, role };
        saveSession(session);
        return session;
    }

    throw new Error("Invalid email or password.");
};


/**
 * Signs up a new student and saves them to the database.
 */
export const signup = async (userData: { name: string, grade: string, email: string, password: string }): Promise<Session> => {
    const seed = userData.name.trim();
    const avatar = createAvatar(lorelei, { seed });
    const avatarUrl = await avatar.toDataUri();
    
    const newUser: Student & { password?: string } = {
        id: `user-${Date.now()}`,
        name: userData.name,
        grade: userData.grade,
        email: userData.email,
        password: userData.password,
        avatarUrl,
        avatarSeed: seed,
        performance: [],
        achievements: [],
        points: 0,
        studyGoals: [],
    };
    
    try {
        await db.addDocToCollection('users', newUser);
        const { password, ...userToReturn } = newUser;
        const session = { user: userToReturn, role: 'student' as Role };
        saveSession(session);
        return session;
    } catch (error) {
        // Handle unique constraint violation for email
        if (error instanceof DOMException && error.name === 'ConstraintError') {
            throw new Error('An account with this email already exists.');
        }
        throw new Error('Could not create account.');
    }
};

/**
 * Logs out the current user by clearing the session.
 */
export const logout = (): void => {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error("Could not clear session storage.", e);
    }
};

/**
 * Saves the current user session to session storage.
 */
export const saveSession = (session: Session): void => {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
        console.error("Could not save to session storage.", e);
    }
};

/**
 * Retrieves the current user session from session storage.
 */
export const getSession = (): Session | null => {
    try {
        const sessionStr = sessionStorage.getItem(SESSION_KEY);
        if (sessionStr) {
            return JSON.parse(sessionStr);
        }
        return null;
    } catch (e) {
        return null;
    }
};

/**
 * Updates a student's profile in the database.
 */
export const updateStudent = async (studentData: Student): Promise<Student> => {
    await db.updateDocInCollection('users', studentData.id, studentData);
    return studentData;
};

/**
 * Fetches all student users from the database.
 */
export const getAllStudents = async (): Promise<Student[]> => {
    // This is inefficient but acceptable for a demo with few users.
    // In a real app, this would be a paginated API call.
    return await db.getAllDocs<Student>('users');
};