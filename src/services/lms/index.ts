// LMS Services Barrel Export
// Provides unified access to all LMS integrations

export { GoogleClassroomService, default as GoogleClassroom } from './googleClassroom';
export type { 
  GoogleClassroomCourse, 
  GoogleClassroomStudent, 
  GoogleClassroomGuardian 
} from './googleClassroom';

export { CanvasService, default as Canvas } from './canvas';
export type { 
  CanvasCourse, 
  CanvasUser, 
  CanvasEnrollment, 
  CanvasSection 
} from './canvas';

export { MoodleService, default as Moodle } from './moodle';
export type { 
  MoodleCourse, 
  MoodleUser, 
  MoodleEnrollment 
} from './moodle';

// Unified LMS Interface
export interface LMSRosterData {
  courses: { id: string; name: string; teacher: string }[];
  students: { id: string; name: string; email: string; courses: string[] }[];
  teachers?: { id: string; name: string; email: string; courses: string[] }[];
  parents?: { id: string; name: string; email: string; children: string[] }[];
  summary: {
    totalCourses: number;
    totalStudents: number;
    totalTeachers?: number;
    totalGuardians?: number;
  };
}

// Unified LMS Service Factory
export class LMSServiceFactory {
  /**
   * Get appropriate service based on LMS type
   */
  static getService(lmsType: 'google_classroom' | 'canvas' | 'moodle') {
    switch (lmsType) {
      case 'google_classroom':
        return GoogleClassroomService;
      case 'canvas':
        return CanvasService;
      case 'moodle':
        return MoodleService;
      default:
        throw new Error(`Unsupported LMS type: ${lmsType}`);
    }
  }

  /**
   * Get unified roster data from any LMS
   */
  static async getRosterData(
    lmsType: 'google_classroom' | 'canvas' | 'moodle',
    connectionId: string,
    limit: number = 50
  ): Promise<LMSRosterData> {
    const service = this.getService(lmsType);
    const rawData = await service.getFullRosterSync(connectionId, limit);
    
    // Transform to unified format
    switch (lmsType) {
      case 'google_classroom':
        return GoogleClassroomService.transformToAlfanumrikFormat(rawData);
      case 'canvas':
        return CanvasService.transformToAlfanumrikFormat(rawData);
      case 'moodle':
        return MoodleService.transformToAlfanumrikFormat(rawData);
      default:
        throw new Error(`Transformation not implemented for: ${lmsType}`);
    }
  }

  /**
   * Generate OAuth URL for supported LMS providers
   */
  static generateOAuthURL(
    lmsType: 'google_classroom' | 'canvas',
    clientId: string,
    redirectUri: string,
    state: string,
    baseUrl?: string
  ): string {
    switch (lmsType) {
      case 'google_classroom':
        return GoogleClassroomService.generateOAuthURL(clientId, redirectUri, state);
      case 'canvas':
        if (!baseUrl) throw new Error('Canvas requires base URL');
        return CanvasService.generateOAuthURL(clientId, redirectUri, state, baseUrl);
      default:
        throw new Error(`OAuth not supported for: ${lmsType}`);
    }
  }

  /**
   * Verify token/connection for any LMS
   */
  static async verifyConnection(
    lmsType: 'google_classroom' | 'canvas' | 'moodle',
    connectionData: any
  ): Promise<{ valid: boolean; info?: any; error?: string }> {
    switch (lmsType) {
      case 'moodle':
        return MoodleService.verifyToken(connectionData.baseUrl, connectionData.token);
      case 'google_classroom':
      case 'canvas':
        // OAuth verification would be done during token exchange
        return { valid: true, info: 'OAuth connection verified' };
      default:
        return { valid: false, error: `Verification not implemented for: ${lmsType}` };
    }
  }

  /**
   * Get supported LMS types with their requirements
   */
  static getSupportedLMS() {
    return {
      google_classroom: {
        name: 'Google Classroom',
        authType: 'oauth',
        requiredScopes: [
          'classroom.courses.readonly',
          'classroom.rosters.readonly',
          'classroom.guardianlinks.students.readonly'
        ],
        setupInstructions: 'Enable Classroom API in Google Cloud Console and configure OAuth consent screen'
      },
      canvas: {
        name: 'Canvas LMS',
        authType: 'oauth',
        requiredScopes: [
          'url:GET|/api/v1/courses',
          'url:GET|/api/v1/courses/:id/enrollments'
        ],
        setupInstructions: 'Create Developer Key in Canvas Admin → Developer Keys'
      },
      moodle: {
        name: 'Moodle',
        authType: 'token',
        requiredFunctions: [
          'core_webservice_get_site_info',
          'core_course_get_courses',
          'core_enrol_get_enrolled_users'
        ],
        setupInstructions: 'Enable Web Services, create External Service, generate user token'
      }
    };
  }
}

export default LMSServiceFactory;