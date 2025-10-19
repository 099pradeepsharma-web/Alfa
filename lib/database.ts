// Typed helper exports for Database tables and rows
import type { Database } from '../types/database.types';

export type Tables = Database['public']['Tables'];

export type Row<T extends keyof Tables> = Tables[T]['Row'];
export type Insert<T extends keyof Tables> = Tables[T]['Insert'];
export type Update<T extends keyof Tables> = Tables[T]['Update'];

export default {
  Row,
  Insert,
  Update,
};
