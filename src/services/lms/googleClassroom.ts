import { supabase } from '../supabase';

// Google Classroom API Service Adapter
// Requires OAuth 2.0 with classroom.courses, classroom.rosters, classroom.guardians scopes

export interface GoogleClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink: string;
}

export interface GoogleClassroomStudent {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
}

export interface GoogleClassroomGuardian {
  studentId: string;
  guardianId: string;
  guardianProfile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
  };
  invitedEmailAddress: string;
}

export class GoogleClassroomService {
  private static readonly BASE_URL = 'https://classroom.googleapis.com/v1';

  /**
   * Get authenticated request headers
   */
  private static async getHeaders(accessToken: string): Promise<HeadersInit> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get decrypted access token for a connection
   */
  private static async getAccessToken(connectionId: string): Promise<string | null> {
    try {
      // Set KMS key (should be done globally in app startup)
      await supabase.rpc('set_config', { 
        setting_name: 'app.kms_key', 
        new_value: process.env.KMS_KEY || '' 
      });

      const { data, error } = await supabase.rpc('decrypt_text', {
        encrypted_value: connectionId // This would be the encrypted token from DB
      });

      if (error) {
        console.error('Token decryption error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Access token retrieval error:', error);
      return null;
    }
  }

  /**
   * List all courses for the authenticated teacher
   */
  static async listCourses(connectionId: string): Promise<GoogleClassroomCourse[]> {
    try {
      const accessToken = await this.getAccessToken(connectionId);
      if (!accessToken) throw new Error('No access token available');

      const headers = await this.getHeaders(accessToken);
      const response = await fetch(`${this.BASE_URL}/courses?courseStates=ACTIVE&pageSize=100`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Classroom API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.courses || [];
    } catch (error) {
      console.error('Google Classroom courses error:', error);
      return [];
    }
  }

  /**
   * List students for a specific course
   */
  static async listStudents(connectionId: string, courseId: string): Promise<GoogleClassroomStudent[]> {
    try {
      const accessToken = await this.getAccessToken(connectionId);
      if (!accessToken) throw new Error('No access token available');

      const headers = await this.getHeaders(accessToken);
      const response = await fetch(`${this.BASE_URL}/courses/${courseId}/students?pageSize=100`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Classroom API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.students || [];
    } catch (error) {
      console.error('Google Classroom students error:', error);
      return [];
    }
  }

  /**
   * List guardians for a specific student
   */
  static async listGuardians(connectionId: string, studentId: string): Promise<GoogleClassroomGuardian[]> {
    try {
      const accessToken = await this.getAccessToken(connectionId);
      if (!accessToken) throw new Error('No access token available');

      const headers = await this.getHeaders(accessToken);
      const response = await fetch(`${this.BASE_URL}/userProfiles/${studentId}/guardians?pageSize=100`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Classroom API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.guardians || [];
    } catch (error) {
      console.error('Google Classroom guardians error:', error);
      return [];
    }
  }

  /**
   * Get full roster sync data (courses + students + guardians)
   */
  static async getFullRosterSync(connectionId: string, limit: number = 50): Promise<{
    courses: GoogleClassroomCourse[];
    students: GoogleClassroomStudent[];
    guardians: GoogleClassroomGuardian[];
    summary: {
      totalCourses: number;
      totalStudents: number;
      totalGuardians: number;
    };
  }> {
    try {
      const courses = await this.listCourses(connectionId);
      const limitedCourses = courses.slice(0, Math.min(limit, courses.length));
      
      let allStudents: GoogleClassroomStudent[] = [];
      let allGuardians: GoogleClassroomGuardian[] = [];

      // Get students for each course
      for (const course of limitedCourses) {
        const courseStudents = await this.listStudents(connectionId, course.id);
        allStudents = [...allStudents, ...courseStudents];

        // Get guardians for each student (sample first 5 to avoid API limits)
        const sampleStudents = courseStudents.slice(0, 5);
        for (const student of sampleStudents) {
          const guardians = await this.listGuardians(connectionId, student.userId);
          allGuardians = [...allGuardians, ...guardians];
        }
      }

      return {
        courses: limitedCourses,
        students: allStudents,
        guardians: allGuardians,
        summary: {
          totalCourses: courses.length,
          totalStudents: allStudents.length,
          totalGuardians: allGuardians.length
        }
      };
    } catch (error) {
      console.error('Google Classroom full roster sync error:', error);
      return {
        courses: [],
        students: [],
        guardians: [],
        summary: { totalCourses: 0, totalStudents: 0, totalGuardians: 0 }
      };
    }
  }

  /**
   * Generate OAuth URL for Google Classroom
   */
  static generateOAuthURL(clientId: string, redirectUri: string, state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.rosters.readonly',
      'https://www.googleapis.com/auth/classroom.guardianlinks.students.readonly',
      'https://www.googleapis.com/auth/classroom.profile.emails'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Transform Google Classroom data to Alfanumrik format
   */
  static transformToAlfanumrikFormat(rosterData: any): {
    courses: { id: string; name: string; teacher: string }[];
    students: { id: string; name: string; email: string; courses: string[] }[];
    parents: { id: string; name: string; email: string; children: string[] }[];
  } {
    const { courses, students, guardians } = rosterData;

    // Transform courses
    const transformedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      teacher: course.ownerId
    }));

    // Transform students (group by user across courses)
    const studentMap = new Map();
    students.forEach(student => {
      const userId = student.userId;
      if (!studentMap.has(userId)) {
        studentMap.set(userId, {
          id: userId,
          name: student.profile.name.fullName,
          email: student.profile.emailAddress,
          courses: []
        });
      }
      studentMap.get(userId).courses.push(student.courseId);
    });

    // Transform guardians (group by guardian across students)
    const guardianMap = new Map();
    guardians.forEach(guardian => {
      const guardianId = guardian.guardianId;
      if (!guardianMap.has(guardianId)) {
        guardianMap.set(guardianId, {
          id: guardianId,
          name: guardian.guardianProfile.name.fullName,
          email: guardian.guardianProfile.emailAddress,
          children: []
        });
      }
      guardianMap.get(guardianId).children.push(guardian.studentId);
    });

    return {
      courses: transformedCourses,
      students: Array.from(studentMap.values()),
      parents: Array.from(guardianMap.values())
    };
  }
}

export default GoogleClassroomService;