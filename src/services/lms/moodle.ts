import { supabase } from '../supabase';

// Moodle Web Services API Adapter
// Uses token-based authentication with wstoken parameter

export interface MoodleCourse {
  id: number;
  shortname: string;
  fullname: string;
  displayname: string;
  enrolledusercount: number;
  idnumber: string;
  visible: number;
  summary: string;
  summaryformat: number;
  format: string;
  showgrades: number;
  lang: string;
  enablecompletion: number;
  completionhascriteria: number;
  completionusertracked: number;
  category: number;
  progress?: number;
  completed?: number;
  startdate: number;
  enddate: number;
}

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  department: string;
  institution: string;
  idnumber: string;
  phone1: string;
  phone2: string;
  address: string;
  firstaccess: number;
  lastaccess: number;
  auth: string;
  suspended: number;
  confirmed: number;
  lang: string;
  theme: string;
  timezone: string;
  mailformat: number;
  description: string;
  descriptionformat: number;
  city: string;
  country: string;
  profileimageurlsmall: string;
  profileimageurl: string;
}

export interface MoodleEnrollment {
  courseid: number;
  userid: number;
  timestart: number;
  timeend: number;
  modificationtime: number;
  status: number;
  enrolmethod: string;
  roleid: number;
  rolename: string;
  roleshortname: string;
}

export class MoodleService {
  private static baseUrl: string = '';
  private static token: string = '';

  /**
   * Set base URL and token for Moodle instance
   */
  static configure(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.token = token;
  }

  /**
   * Get decrypted token for a connection
   */
  private static async getToken(connectionId: string): Promise<{ baseUrl: string; token: string } | null> {
    try {
      // In production, fetch connection and decrypt token
      const { data: connection, error } = await supabase
        .from('lms_connections')
        .select('base_url, access_token')
        .eq('id', connectionId)
        .eq('lms_type', 'moodle')
        .single();

      if (error || !connection) {
        console.error('Moodle connection not found:', error);
        return null;
      }

      // Set KMS key for decryption
      await supabase.rpc('set_config', { 
        setting_name: 'app.kms_key', 
        new_value: process.env.KMS_KEY || '' 
      });

      const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_text', {
        encrypted_value: connection.access_token
      });

      if (decryptError) {
        console.error('Token decryption error:', decryptError);
        return null;
      }

      return {
        baseUrl: connection.base_url,
        token: decryptedToken
      };
    } catch (error) {
      console.error('Moodle token retrieval error:', error);
      return null;
    }
  }

  /**
   * Make authenticated request to Moodle Web Services
   */
  private static async makeRequest(connectionId: string, wsfunction: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const config = await this.getToken(connectionId);
      if (!config) throw new Error('No token configuration available');

      const searchParams = new URLSearchParams({
        wstoken: config.token,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params
      });

      const response = await fetch(`${config.baseUrl}/webservice/rest/server.php?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Moodle API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for Moodle error response format
      if (data.exception || data.errorcode) {
        throw new Error(`Moodle error: ${data.message || data.errorcode}`);
      }

      return data;
    } catch (error) {
      console.error('Moodle request error:', error);
      throw error;
    }
  }

  /**
   * Get site information (useful for connection testing)
   */
  static async getSiteInfo(connectionId: string): Promise<any> {
    return this.makeRequest(connectionId, 'core_webservice_get_site_info');
  }

  /**
   * List all courses
   */
  static async listCourses(connectionId: string): Promise<MoodleCourse[]> {
    try {
      const data = await this.makeRequest(connectionId, 'core_course_get_courses');
      return data || [];
    } catch (error) {
      console.error('Moodle courses error:', error);
      return [];
    }
  }

  /**
   * Get enrolled users for a specific course
   */
  static async getEnrolledUsers(connectionId: string, courseId: number): Promise<MoodleUser[]> {
    try {
      const data = await this.makeRequest(connectionId, 'core_enrol_get_enrolled_users', {
        courseid: courseId.toString()
      });
      return data || [];
    } catch (error) {
      console.error('Moodle enrolled users error:', error);
      return [];
    }
  }

  /**
   * Get user enrolments
   */
  static async getUserEnrolments(connectionId: string, userId: number): Promise<MoodleEnrollment[]> {
    try {
      const data = await this.makeRequest(connectionId, 'core_enrol_get_users_courses', {
        userid: userId.toString()
      });
      return data || [];
    } catch (error) {
      console.error('Moodle user enrolments error:', error);
      return [];
    }
  }

  /**
   * Get full roster sync data
   */
  static async getFullRosterSync(connectionId: string, limit: number = 50): Promise<{
    courses: MoodleCourse[];
    users: MoodleUser[];
    enrollments: MoodleEnrollment[];
    summary: {
      totalCourses: number;
      totalUsers: number;
      totalEnrollments: number;
    };
  }> {
    try {
      const courses = await this.listCourses(connectionId);
      const limitedCourses = courses.slice(0, Math.min(limit, courses.length));
      
      let allUsers: MoodleUser[] = [];
      let allEnrollments: MoodleEnrollment[] = [];
      const userMap = new Map();

      for (const course of limitedCourses) {
        const users = await this.getEnrolledUsers(connectionId, course.id);
        
        // Deduplicate users across courses
        users.forEach(user => {
          if (!userMap.has(user.id)) {
            userMap.set(user.id, user);
            allUsers.push(user);
          }
        });

        // Create enrollment records
        users.forEach(user => {
          allEnrollments.push({
            courseid: course.id,
            userid: user.id,
            timestart: 0, // Moodle API doesn't always provide this
            timeend: 0,
            modificationtime: 0,
            status: 0, // Active
            enrolmethod: 'unknown',
            roleid: 5, // Default student role in Moodle
            rolename: 'Student',
            roleshortname: 'student'
          });
        });
      }

      return {
        courses: limitedCourses,
        users: allUsers,
        enrollments: allEnrollments,
        summary: {
          totalCourses: courses.length,
          totalUsers: allUsers.length,
          totalEnrollments: allEnrollments.length
        }
      };
    } catch (error) {
      console.error('Moodle full roster sync error:', error);
      return {
        courses: [],
        users: [],
        enrollments: [],
        summary: { totalCourses: 0, totalUsers: 0, totalEnrollments: 0 }
      };
    }
  }

  /**
   * Verify token by getting site info
   */
  static async verifyToken(baseUrl: string, token: string): Promise<{ valid: boolean; siteInfo?: any; error?: string }> {
    try {
      const searchParams = new URLSearchParams({
        wstoken: token,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      });

      const response = await fetch(`${baseUrl}/webservice/rest/server.php?${searchParams.toString()}`);

      if (!response.ok) {
        return { valid: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.exception || data.errorcode) {
        return { valid: false, error: data.message || data.errorcode };
      }

      return { valid: true, siteInfo: data };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  /**
   * Transform Moodle data to Alfanumrik format
   */
  static transformToAlfanumrikFormat(rosterData: any): {
    courses: { id: string; name: string; teacher: string }[];
    students: { id: string; name: string; email: string; courses: string[] }[];
    teachers: { id: string; name: string; email: string; courses: string[] }[];
  } {
    const { courses, users, enrollments } = rosterData;

    // Transform courses
    const transformedCourses = courses.map(course => ({
      id: course.id.toString(),
      name: course.fullname,
      teacher: 'Unknown' // Moodle doesn't easily expose course owner in basic calls
    }));

    // Separate students and teachers based on role
    const studentMap = new Map();
    const teacherMap = new Map();
    
    enrollments.forEach(enrollment => {
      const user = users.find(u => u.id === enrollment.userid);
      if (!user) return;
      
      const userId = user.id.toString();
      const courseId = enrollment.courseid.toString();
      
      // Moodle role IDs: 5 = Student, 3 = Teacher, 4 = Non-editing teacher
      if ([5].includes(enrollment.roleid)) {
        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            id: userId,
            name: user.fullname,
            email: user.email,
            courses: []
          });
        }
        studentMap.get(userId).courses.push(courseId);
      } else if ([3, 4].includes(enrollment.roleid)) {
        if (!teacherMap.has(userId)) {
          teacherMap.set(userId, {
            id: userId,
            name: user.fullname,
            email: user.email,
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

export default MoodleService;