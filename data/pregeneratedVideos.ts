// In a production environment, this would be a database lookup against a cloud storage bucket.
// For this simulation, we're using a static map with a sample video URL.
// This URL is a placeholder and should point to a real, short MP4 video.
// Using a Creative Commons video for demonstration.
export const PREGENERATED_VIDEOS: { [key: string]: string } = {
    'grade-11-science-physics-motion-in-a-straight-line': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
};

// Helper function to create a consistent key for looking up videos.
export const createVideoCacheKey = (grade: string, subject: string, concept: string): string => {
    return `${grade}-${subject}-${concept}`
        .toLowerCase()
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // remove special characters
};
