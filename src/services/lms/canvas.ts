import { supabase } from '../supabase';

// Canvas LMS API Service Adapter
// Requires OAuth 2.0 with url:GET|/api/v1/courses scopes

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  workflow_state: 'unpublished' | 'available' | 'completed' | 'deleted';
  account_id: number;
  start_at?: string;
  end_at?: string;
  enrollments?: CanvasEnrollment[];
}

export interface CanvasUser {
  id: number;
  name: string;
  sortable_name: string;
  short_name: string;
  sis_user_id?: string;
  integration_id?: string;
  login_id: string;
  email?: string;
  avatar_url?: string;
}

export interface CanvasEnrollment {
  id: number;
  course_id: number;
  course_section_id: number;
  user_id: number;
  type: 'StudentEnrollment' | 'TeacherEnrollment' | 'TaEnrollment' | 'DesignerEnrollment' | 'ObserverEnrollment';
  role: string;
  enrollment_state: 'active' | 'invited' | 'inactive' | 'deleted';
  user: CanvasUser;
}

export interface CanvasSection {
  id: number;
  name: string;
  course_id: number;
  nonxlist_course_id?: number;
  sis_section_id?: string;
  integration_id?: string;
  start_at?: string;
  end_at?: string;
}

export class CanvasService {
  private static baseUrl: string = '';

  /**
   * Set base URL for Canvas instance
   */
  static setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

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
      // Set KMS key for decryption
      await supabase.rpc('set_config', { 
        setting_name: 'app.kms_key', 
        new_value: process.env.KMS_KEY || '' 
      });

      const { data, error } = await supabase.rpc('decrypt_text', {
        encrypted_value: connectionId // This would be the encrypted token from DB
      });

      if (error) {
        console.error('Canvas token decryption error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Canvas access token retrieval error:', error);
      return null;
    }
  }

  /**
   * List all courses for the authenticated user
   */
  static async listCourses(connectionId: string, enrollmentType?: string): Promise<CanvasCourse[]> {
    try {
      const accessToken = await this.getAccessToken(connectionId);
      if (!accessToken) throw new Error('No access token available');

      const headers = await this.getHeaders(accessToken);
      let url = `${this.baseUrl}/api/v1/courses?enrollment_state=active&per_page=100`;
      
      if (enrollmentType) {
        url += `&enrollment_type=${enrollmentType}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Canvas courses error:', error);
      return [];
    }
  }

  /**
   * List users enrolled in a specific course
   */
  static async listEnrollments(connectionId: string, courseId: number): Promise<CanvasEnrollment[]> {
    try {
      const accessToken = await this.getAccessToken(connectionId);
      if (!accessToken) throw new Error('No access token available');

      const headers = await this.getHeaders(accessToken);
      const response = await fetch(
        `${this.baseUrl}/api/v1/courses/${courseId}/enrollments?include[]=user&state[]=active&per_page=100`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Canvas enrollments error:', error);
      return [];
    }
  }

  /**
   * List sections for a specific course
   */
  static async listSections(connectionId: string, courseId: number): Promise<CanvasSection[]> {
    try {
      const accessToken = await this.getAccessToken(connectionId);
      if (!accessToken) throw new Error('No access token available');

      const headers = await this.getHeaders(accessToken);
      const response = await fetch(
        `${this.baseUrl}/api/v1/courses/${courseId}/sections?per_page=100`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Canvas sections error:', error);
      return [];
    }
  }

  /**
   * Get full roster sync data
   */
  static async getFullRosterSync(connectionId: string, limit: number = 50): Promise<{
    courses: CanvasCourse[];
    enrollments: CanvasEnrollment[];
    sections: CanvasSection[];
    summary: {
      totalCourses: number;
      totalStudents: number;
      totalTeachers: number;
    };
  }> {
    try {
      const courses = await this.listCourses(connectionId);
      const limitedCourses = courses.slice(0, Math.min(limit, courses.length));
      
      let allEnrollments: CanvasEnrollment[] = [];
      let allSections: CanvasSection[] = [];

      for (const course of limitedCourses) {
        const enrollments = await this.listEnrollments(connectionId, course.id);
        const sections = await this.listSections(connectionId, course.id);
        
        allEnrollments = [...allEnrollments, ...enrollments];
        allSections = [...allSections, ...sections];
      }

      const students = allEnrollments.filter(e => e.type === 'StudentEnrollment');
      const teachers = allEnrollments.filter(e => e.type === 'TeacherEnrollment');

      return {
        courses: limitedCourses,
        enrollments: allEnrollments,
        sections: allSections,
        summary: {
          totalCourses: courses.length,
          totalStudents: students.length,
          totalTeachers: teachers.length
        }
      };
    } catch (error) {
      console.error('Canvas full roster sync error:', error);
      return {
        courses: [],
        enrollments: [],
        sections: [],
        summary: { totalCourses: 0, totalStudents: 0, totalTeachers: 0 }
      };
    }
  }

  /**
   * Generate OAuth URL for Canvas
   */
  static generateOAuthURL(clientId: string, redirectUri: string, state: string, canvasBaseUrl: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state,
      scope: 'url:GET|/api/v1/courses url:GET|/api/v1/courses/:id/enrollments url:GET|/api/v1/courses/:id/sections'
    });

    return `${canvasBaseUrl}/login/oauth2/auth?${params.toString()}`;
  }

  /**
   * Transform Canvas data to Alfanumrik format
   */
  static transformToAlfanumrikFormat(rosterData: any): {
    courses: { id: string; name: string; teacher: string }[];
    students: { id: string; name: string; email: string; courses: string[] }[];
    teachers: { id: string; name: string; email: string; courses: string[] }[];
  } {
    const { courses, enrollments } = rosterData;

    // Transform courses
    const transformedCourses = courses.map(course => {
      const teacherEnrollment = enrollments.find(e => 
        e.course_id === course.id && e.type === 'TeacherEnrollment'
      );
      return {
        id: course.id.toString(),
        name: course.name,
        teacher: teacherEnrollment?.user?.name || 'Unknown'
      };
    });

    // Group students by user
    const studentMap = new Map();
    const teacherMap = new Map();
    
    enrollments.forEach(enrollment => {
      if (enrollment.enrollment_state !== 'active') return;
      
      const userId = enrollment.user_id.toString();
      const courseId = enrollment.course_id.toString();
      
      if (enrollment.type === 'StudentEnrollment') {
        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            id: userId,
            name: enrollment.user.name,
            email: enrollment.user.email || '',
            courses: []
          });
        }
        studentMap.get(userId).courses.push(courseId);
      } else if (enrollment.type === 'TeacherEnrollment') {
        if (!teacherMap.has(userId)) {
          teacherMap.set(userId, {
            id: userId,
            name: enrollment.user.name,
            email: enrollment.user.email || '',
            courses: []
          });
        }
        teacherMap.get(userId).courses.push(courseId);
      }
    });

    return {
      courses: transformedCourses,
      students: Array.from(studentMap.values()),
      teachers: Array.from(teacherMap.values())
    };
  }
}

export default CanvasService;