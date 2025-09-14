import { User } from '../types';
import * as db from './databaseService';

export const signup = async (name: string, email: string, password: string, grade: string): Promise<User> => {
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
        throw new Error("An account with this email already exists.");
    }

    const newUser: User = {
        id: Date.now(), // Simple unique ID for simulation
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_plaintext: password,
        grade: grade,
        avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(email.trim())}`
    };

    await db.addUser(newUser);
    return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
    const user = await db.findUserByEmail(email);
    if (!user) {
        throw new Error("Invalid email or password.");
    }

    // In a real app, you would compare a hashed password.
    // e.g., const isMatch = await bcrypt.compare(password, user.password_hash);
    const isMatch = user.password_plaintext === password;

    if (!isMatch) {
        throw new Error("Invalid email or password.");
    }

    return user;
};