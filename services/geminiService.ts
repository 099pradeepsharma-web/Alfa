


import { GoogleGenAI, Type, Chat } from "@google/genai";
// FIX: Corrected import path for types to resolve circular dependency issues.
import { LearningModule, QuizQuestion, Student, NextStepRecommendation, Concept, StudentQuestion, AIAnalysis, FittoResponse, AdaptiveAction, IQExercise, EQExercise, CurriculumOutlineChapter, Chapter, Trigger, CoreConceptLesson, PracticeArena, PracticalApplicationLab, AptitudeQuestion, CareerGuidance, XpReward, VideoReward, StudyGoal, PracticeProblem, WrittenAnswerEvaluation, SATAnswerEvaluation, PerformanceRecord, AdaptiveStory, BoardPaper, BoardPaperSection, BoardPaperQuestion, CognitiveProfile } from '../types';
import { CURRICULUM } from '../data/curriculum';
import { getLearningStreak } from './pineconeService';

// The API key is sourced from the `process.env.API_KEY` environment variable.
// To use a new key (e.g., from Vertex AI Studio), set this variable in your deployment environment.
// For security reasons, do not hard-code the key directly in the code.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// A centralized error handler for Gemini API calls to provide more specific user feedback.
const handleGeminiError = (error: any, context: string): Error => {
    console.error(`Error in ${context}:`, error);
    let message = `Failed to ${context}. Please check your internet connection and try again.`;
    
    // Check for specific error messages from the Gemini SDK
    if (error && typeof error.message === 'string') {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('api key not valid')) {
            // This is a server-side configuration issue, so the user can't fix it.
            message = 'There is a configuration issue with the AI service. Please contact support.';
        } else if (lowerCaseMessage.includes('quota')) {
            message = `The daily usage limit for this AI feature has been reached. Please try again tomorrow. We apologize for the inconvenience.`;
        } else if (lowerCaseMessage.includes('rate limit')) {
            message = 'The AI service is currently experiencing high traffic. Please wait a moment and try again.';
        } else if (lowerCaseMessage.includes('candidate was blocked')) {
             message = 'The request was blocked due to safety settings. Please try rephrasing your request.';
        } else if (lowerCaseMessage.includes('400 bad request')) {
            message = 'The request sent to the AI service was invalid. This might be a temporary issue. Please try again.';
        } else if (lowerCaseMessage.includes('500 internal server error') || lowerCaseMessage.includes('503 service unavailable')) {
            message = 'The AI service is temporarily unavailable. Please try again later.';
        }
    }
    
    return new Error(message);
};

/**
 * Creates a concise summary of a student's performance for AI personalization.
 * This is an internal helper function.
 */
const summarizeStudentPerformance = (student: Student): string => {
    if (student.performance.length === 0) {
        return "The student is new and has no performance history yet. Be extra encouraging.";
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recentPerformance = student.performance.slice(0, 10); // Look at last 10 activities

    const performanceByChapter: { [key: string]: { scores: number[], count: number } } = {};

    recentPerformance.forEach(p => {
        const key = `${p.subject} - ${p.chapter}`;
        if (!performanceByChapter[key]) {
            performanceByChapter[key] = { scores: [], count: 0 };
        }
        performanceByChapter[key].scores.push(p.score);
        performanceByChapter[key].count++;
    });

    for (const key in performanceByChapter) {
        const avgScore = performanceByChapter[key].scores.reduce((a, b) => a + b, 0) / performanceByChapter[key].count;
        if (avgScore >= 90) {
            strengths.push(key);
        } else if (avgScore < 70) {
            weaknesses.push(key);
        }
    }

    let summary = "### Student's Recent Learning Patterns:\n";
    if (weaknesses.length > 0) {
        summary += `- **Areas for improvement (simplify explanations here):** ${weaknesses.join(', ')}\n`;
    } else {
        summary += "- No significant weak areas recently. The student is performing well.\n";
    }

    if (strengths.length > 0) {
        summary += `- **Strengths (can handle more challenging concepts here):** ${strengths.join(', ')}\n`;
    }

    return summary;
};


// --- Schemas for the new "Gamified, HOOK-Driven" Learning Module ---

const triggerSchema = {
    type: Type.OBJECT,
    properties: {
        triggerType: { type: Type.STRING, enum: ['paradoxicalQuestion', 'realWorldVideo', 'interdisciplinaryConnection'] },
        title: { type: Type.STRING, description: "The main hook or question, e.g., 'Why does a straw look bent in water?'" },
        description: { type: Type.STRING, description: "A short elaboration or context. For 'realWorldVideo', this should be a detailed prompt for a 45-second video." },
        pushNotification: { type: Type.STRING, description: "A short, punchy text for a push notification to spark curiosity, e.g., 'A simple glass of water can bend reality. Find out how.'" }
    },
    required: ['triggerType', 'title', 'description', 'pushNotification']
};

const knowledgeCheckSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING },
        conceptTitle: { type: Type.STRING }
    },
    required: ['question', 'options', 'correctAnswer', 'explanation', 'conceptTitle']
};

const coreConceptLessonSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        videoPrompt: { type: Type.STRING, description: "For highly visual concepts ONLY, provide a detailed prompt for a 1-2 minute animated explainer video. Otherwise, leave null.", nullable: true },
        explanation: { type: Type.STRING, description: "A concise, 5-7 minute micro-lesson explanation." },
        knowledgeCheck: { type: Type.ARRAY, items: knowledgeCheckSchema, minItems: 2, maxItems: 2 }
    },
    required: ['title', 'explanation', 'knowledgeCheck']
};

const practiceProblemSchema = {
    type: Type.OBJECT,
    properties: {
        level: { type: Type.STRING, enum: ['Level 1: NCERT Basics', 'Level 2: Reference Application', 'Level 3: Competitive Challenge'] },
        problemStatement: { type: Type.STRING },
        solution: { type: Type.STRING, description: "A clear, step-by-step solution." }
    },
    required: ['level', 'problemStatement', 'solution']
};

const xpRewardSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['xp'] },
        points: { type: Type.NUMBER }
    },
    required: ['type', 'points']
};

const videoRewardSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['video'] },
        title: { type: Type.STRING },
        videoPrompt: { type: Type.STRING }
    },
    required: ['type', 'title', 'videoPrompt']
};

const practiceArenaSchema = {
    type: Type.OBJECT,
    properties: {
        problems: { type: Type.ARRAY, items: practiceProblemSchema },
        reward: {
            oneOf: [xpRewardSchema, videoRewardSchema],
            nullable: true
        }
    },
    required: ['problems']
};

const practicalApplicationLabSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['virtualLab', 'simulation', 'project'] },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        labInstructions: { type: Type.STRING, description: "Instructions for the student to complete the investment step, formatted as a markdown list.", nullable: true }
    },
    required: ['type', 'title', 'description']
};

export const getChapterContent = async (gradeLevel: string, subject: string, chapter: Chapter, studentName: string, language: string): Promise<LearningModule> => {
    
    const prompt = `
        **SYSTEM ROLE:**
        You are an expert Curriculum Architect for the Indian CBSE board, creating a visually rich and engaging digital learning module for a ${gradeLevel} student. The chapter is "${chapter.title}" in ${subject}. The entire response must be in ${language}.

        **FRAMEWORK PRINCIPLES (MANDATORY):**
        1.  **Narrative & Gamification:** Frame the chapter as a "Mission".
        2.  **HOOK Model:** Follow the Trigger -> Action -> Reward -> Investment loop.
        3.  **Content Synthesis & Depth:** Base content on NCERT but deeply integrate concepts from standard reference books (e.g., H.C. Verma, R.D. Sharma).
        4.  **Competitive Focus:** Include elements relevant to NTSE, Olympiads, and JEE/NEET foundation.

        **AESTHETIC & FORMATTING RULES (NON-NEGOTIABLE):**
        Your goal is to make the content look like a beautifully designed, modern digital textbook. The clarity of presentation is PARAMOUNT.

        1.  **Headings:** Use markdown headings for structure. '##' for main sub-headings and '###' for deeper concepts.
            - Example: \`## The Laws of Reflection\`

        2.  **Emphasis:** For important keywords, formulas, and concepts, you MUST underline them by wrapping them ONLY in <u>...</u> tags. Example: <u>Snell's Law</u>. Do NOT use markdown asterisks for bolding.

        3.  **Lists:** For point-wise explanations, you MUST use markdown lists (e.g., starting a line with a hyphen and a space: "- Point 1").

        4.  **Callout Boxes:** For important notes, definitions, or fun facts, you MUST use blockquote callouts.
            - For notes or tips: \`> [!NOTE] Your insightful note here.\`
            - For key term definitions: \`> [!KEY] Refractive Index: The measure of how much light bends.\`
            - For examples: \`> [!EXAMPLE] A straw in a glass of water appears bent due to refraction.\`

        5.  **Tables:** When comparing concepts (e.g., Concave vs. Convex mirrors), you MUST use markdown tables for clarity.

        6.  **Diagrams are CRITICAL:** For any concept that can be explained visually (e.g., ray diagrams, biological systems, geometric shapes, scientific processes), you MUST insert a diagram placeholder IMMEDIATELY after its introductory explanation. Do not group diagrams at the end. They must be integrated with the text. The diagram prompt must be detailed enough for an artist to create a clear, simple, and labeled educational graphic.
            - Format: \`[DIAGRAM: A detailed, clear prompt for a simple 2D educational diagram explaining the concept.]\`
            - Example: \`[DIAGRAM: A simple ray diagram showing the formation of a real, inverted image by a concave mirror when the object is placed beyond C.]\`

        7.  **Step-by-Step Vertical Explanations:** This is non-negotiable for clarity.
            - **Formula Derivations:** Each step of a derivation MUST be on a new line.
            - **Solved Numerical Examples:** Present the solution vertically. Start with 'Given:', then 'Formula:', then 'Calculation:', with each calculation step on a new line.
            - **Practice Arena Solutions:** The 'solution' for every problem in the 'practiceArena' MUST also follow this clear, step-by-step vertical format.
        
        8.  **Clarity and Structure:** Every explanation must be broken down. Use short paragraphs. Use bullet points for lists of properties or features. The goal is maximum readability for a student. Avoid long walls of text.

        **REQUIRED OUTPUT STRUCTURE:**
        -   **chapterTitle**: Must be exactly "${chapter.title}".
        -   **missionBriefing (The Trigger):** An array of 2-3 varied 'Trigger' objects.
        -   **coreConceptTraining (Action):** Break the chapter into 3-5 micro-lessons. For each, provide a comprehensive explanation that STRICTLY follows all aesthetic and formatting rules. Explanations MUST be clear, use short paragraphs, bullet points, and be visually integrated with diagram placeholders where appropriate. ALL solved examples must be formatted vertically step-by-step.
        -   **practiceArena (Variable Reward):** A robust set of 8 practice problems (3 NCERT, 3 Reference, 2 Competitive). The 'solution' for EACH problem MUST be a complete, step-by-step, vertically formatted explanation.
        -   **practicalApplicationLab (Investment):** A mandatory activity. The \`labInstructions\` field MUST be a multi-line string formatted as a markdown list.
        -   **bossFight (Final Challenge):** A 10-question chapter-end test mixing MCQs, numericals, etc.
    `;

    const learningModuleSchema = {
        type: Type.OBJECT,
        properties: {
            chapterTitle: { type: Type.STRING },
            missionBriefing: { type: Type.ARRAY, items: triggerSchema, minItems: 2, maxItems: 3 },
            coreConceptTraining: { type: Type.ARRAY, items: coreConceptLessonSchema },
            practiceArena: practiceArenaSchema,
            practicalApplicationLab: practicalApplicationLabSchema,
            bossFight: { type: Type.ARRAY, items: knowledgeCheckSchema, minItems: 10, maxItems: 10 },
        },
        required: [
            'chapterTitle', 
            'missionBriefing', 
            'coreConceptTraining', 
            'practiceArena', 
            'practicalApplicationLab', 
            'bossFight',
        ]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: learningModuleSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as LearningModule;
    } catch (error) {
        throw handleGeminiError(error, 'generate learning content');
    }
};

const quizSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            conceptTitle: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['ACADEMIC', 'IQ', 'EQ'], nullable: true },
            skill: { type: Type.STRING, nullable: true },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'], nullable: true },
        },
        required: ['question', 'options', 'correctAnswer', 'explanation', 'conceptTitle']
    }
};

export const generateQuiz = async (keyConcepts: Concept[] | string[], language: string, count: number = 5): Promise<QuizQuestion[]> => {
    const conceptTitles = (typeof keyConcepts[0] === 'string') ? keyConcepts as string[] : (keyConcepts as Concept[]).map(c => c.conceptTitle);
    const conceptsContext = (typeof keyConcepts[0] === 'string') ? (keyConcepts as string[]).join('\n- ') : (keyConcepts as Concept[]).map(c => `Title: ${c.conceptTitle}\nExplanation: ${c.explanation}`).join('\n\n');

    const prompt = `
        You are an expert question setter for Indian competitive exams (like Olympiads, NTSE, JEE/NEET foundation).
        Based on the following key concepts for a student, create a high-quality, ${count}-question multiple-choice quiz.
        The entire response must be in the ${language} language.

        **CRITICAL INSTRUCTIONS for question quality:**
        1.  **Test Application, Not Just Recall:** Questions must require conceptual understanding and application, not just rote memorization.
        2.  **Use Scenarios:** Where possible, frame questions around real-world scenarios or application-based problems.
        3.  **Plausible Distractors:** The incorrect options (distractors) must be plausible and based on common misconceptions.
        4.  **Vary Difficulty:** Include a mix of medium to hard questions that challenge the student's thinking.

        For each question:
        - Provide a clear, unambiguous question.
        - Provide four distinct options.
        - Indicate the correct answer.
        - Provide a thorough explanation for why the correct answer is right and the others are wrong.
        - **Crucially, associate each question with one of the provided concept titles using the 'conceptTitle' field.**

        Key Concepts:
        ---
        - ${conceptsContext}
        ---

        Valid Concept Titles for the 'conceptTitle' field: ${conceptTitles.join(', ')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
                temperature: 0.8,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as QuizQuestion[];

    } catch (error) {
        throw handleGeminiError(error, 'generate quiz');
    }
};

export const generatePracticeExercises = async (concept: Concept, grade: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        You are an expert question setter for Indian students for grade ${grade}.
        Generate 3 high-quality multiple-choice questions to practice the specific concept of "${concept.conceptTitle}".
        The entire response must be in the ${language} language.

        **CRITICAL INSTRUCTIONS for question quality:**
        1.  **Test Application:** Questions must require application of the concept, not just recall. Use scenarios or simple problems.
        2.  **Plausible Options:** Incorrect options should be based on common mistakes students make.
        3.  **Exam-Oriented:** The style should be suitable for reinforcing understanding for school and foundational competitive exams.
        4.  **Clarity:** Ensure the question and explanation are clear and helpful.
        5.  **Concept Title:** For the 'conceptTitle' field, you MUST use the exact title provided: "${concept.conceptTitle}".

        Concept Details for context:
        Explanation: ${concept.explanation}
        Real-World Example: ${concept.realWorldExample}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema, // Reusing quiz schema
                temperature: 0.7,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as QuizQuestion[];

    } catch (error) {
        throw handleGeminiError(error, 'generate practice exercises');
    }
};

const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        recommendationText: { type: Type.STRING },
        nextChapterTitle: { type: Type.STRING, nullable: true },
        action: { type: Type.STRING, enum: ['REVIEW', 'CONTINUE', 'REVISE_PREREQUISITE', 'START_CRITICAL_THINKING', 'START_WELLBEING'] },
        prerequisiteChapterTitle: { type: Type.STRING, nullable: true },
    },
    required: ['recommendationText', 'action']
};

export const generateNextStepRecommendation = async (grade: string, subject: string, chapter: string, score: number, totalQuestions: number, subjectChapters: {title: string}[], language: string): Promise<NextStepRecommendation> => {
    const percentage = Math.round((score / totalQuestions) * 100);
    const chapterTitles = subjectChapters.map(c => c.title).join('", "');
    const currentChapterIndex = subjectChapters.findIndex(c => c.title === chapter);
    const nextChapter = currentChapterIndex !== -1 && currentChapterIndex < subjectChapters.length - 1 ? subjectChapters[currentChapterIndex + 1] : null;

    const prompt = `
        Act as an expert, encouraging learning coach for a ${grade} student studying ${subject}.
        The student has just completed a quiz on the chapter "${chapter}" and scored ${score} out of ${totalQuestions} (${percentage}%).
        The available chapters in this subject are: ["${chapterTitles}"].
        The entire response must be in the ${language} language.

        Based on this performance, provide a personalized recommendation for their next step. Your response must be in a specific JSON format.
        
        1.  **If the score is below 60% (${percentage}%):**
            - The student is struggling. Your tone should be very encouraging and normalize the struggle.
            - **Analysis:** Analyze the chapter title "${chapter}". Does it sound like an advanced topic that might depend on earlier concepts? For example, "Polynomials" depends on "Real Numbers". "Trigonometry" depends on "Triangles". "Calculus" depends on "Functions".
            - **If it seems to have a prerequisite:**
                - **action**: "REVISE_PREREQUISITE"
                - **prerequisiteChapterTitle**: Identify the most likely prerequisite chapter from the available chapter list. For example, if the current chapter is "Polynomials", you should identify "Real Numbers".
                - **recommendationText**: Explain that this topic builds on earlier ideas and suggest they strengthen their foundation by reviewing the prerequisite chapter you identified.
            - **If it seems foundational or you can't determine a prerequisite:**
                - **action**: "REVIEW"
                - **recommendationText**: Explain that it's perfectly normal and suggest they review the key concepts of the current chapter ("${chapter}") to build a stronger foundation.
                - **prerequisiteChapterTitle**: null
        
        2.  **If the score is between 60% and 85% (inclusive of ${percentage}%):**
            - The student has a decent grasp. Congratulate them on their effort.
            - **action**: "CONTINUE"
            - **recommendationText**: Suggest they have a good understanding and are ready for the next challenge. Mention the next chapter by name.
            - **nextChapterTitle**: "${nextChapter ? nextChapter.title : null}"
            - **prerequisiteChapterTitle**: null

        3.  **If the score is above 85% (${percentage}%):**
            - The student has mastered the material. Be very positive and praise their excellent work.
            - **action**: "CONTINUE"
            - **recommendationText**: Tell them they did an amazing job and are clearly ready to move on. Name the next chapter.
            - **nextChapterTitle**: "${nextChapter ? nextChapter.title : null}"
            - **prerequisiteChapterTitle**: null
        
        If there is no next chapter available, set nextChapterTitle to null and adjust the text to say they've completed the subject.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recommendationSchema,
                temperature: 0.6,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as NextStepRecommendation;
    } catch (error) {
        throw handleGeminiError(error, 'generate recommendation');
    }
}

export const generateComprehensiveDiagnosticRecommendation = async (
    grade: string, 
    subject: string, 
    chapter: string, 
    scores: { academic: number; iq: number; eq: number; },
    language: string,
    subjectChapters: { title: string }[]
): Promise<NextStepRecommendation> => {
    
    const chapterTitles = subjectChapters.map(c => c.title).join('", "');
    const prompt = `
        Act as an expert educational psychologist for a ${grade} student. The student has just completed a comprehensive diagnostic test for the chapter "${chapter}" in ${subject}.
        Their performance is as follows:
        - Academic Prerequisite Score: ${scores.academic}%
        - IQ (Cognitive Skills) Score: ${scores.iq}%
        - EQ (Emotional Intelligence) Score: ${scores.eq}%
        
        Your task is to provide a single, most impactful recommendation for the student's next step. The entire response must be in ${language} and in the specified JSON format.
        The available chapters for this subject are: ["${chapterTitles}"].

        Follow these rules in strict priority order:

        1.  **If Academic score is below 50%:** The student is not ready.
            - **action**: "REVISE_PREREQUISITE"
            - **recommendationText**: Gently explain that a strong foundation is crucial. Strongly recommend reviewing the most likely prerequisite chapter first to make learning "${chapter}" much easier and more successful.
            - **prerequisiteChapterTitle**: [Identify the most likely prerequisite chapter title before "${chapter}" from the provided list of available chapters. For example, if the current chapter is 'Polynomials', you might choose 'Real Numbers' from the list.]
            - **nextChapterTitle**: "${chapter}"
        
        2.  **If IQ score is below 60% (and Academic score is >= 50%):** The student may struggle with problem-solving.
            - **action**: "START_CRITICAL_THINKING"
            - **recommendationText**: Praise their academic readiness but suggest a fun 'brain workout' in the Critical Thinking Gym to sharpen their logical reasoning skills before starting the new chapter.
            - **nextChapterTitle**: "${chapter}"
            - **prerequisiteChapterTitle**: null

        3.  **If EQ score is below 60% (and Academic >= 50% and IQ >= 60%):** The student may need help with learning mindset.
            - **action**: "START_WELLBEING"
            - **recommendationText**: Acknowledge their strong skills but suggest exploring the Personal Growth & Well-being module to build resilience and a positive mindset for tackling new academic challenges.
            - **nextChapterTitle**: "${chapter}"
            - **prerequisiteChapterTitle**: null

        4.  **If all scores are good (Academic >= 50%, IQ >= 60%, EQ >= 60%):** The student is fully prepared.
            - **action**: "CONTINUE"
            - **recommendationText**: Congratulate them on their excellent all-around preparation and state that they are fully ready to begin the new chapter, "${chapter}".
            - **nextChapterTitle**: "${chapter}"
            - **prerequisiteChapterTitle**: null
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recommendationSchema,
                temperature: 0.6,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as NextStepRecommendation;
    } catch (error) {
        throw handleGeminiError(error, 'generate comprehensive diagnostic recommendation');
    }
};


export const createTutorChat = (grade: string, subject: string, chapter: string, language: string, keyConcepts: Concept[], student: Student): Chat => {
    const conceptsContext = keyConcepts.map(c => `- '${c.conceptTitle}': ${c.explanation.substring(0, 150)}...`).join('\n');
    const performanceSummary = summarizeStudentPerformance(student);
    
    const systemInstruction = `You are Fitto, an expert, friendly, and encouraging AI Tutor for a ${grade} student studying ${subject} in the ${language} language. Your current topic is "${chapter}". 
    
    **STUDENT PROFILE:**
    This section contains insights into the student's recent performance. Use this to dynamically adapt your teaching style.
    ${performanceSummary}

    **Your Core Directives:**
    1.  **ADAPTIVE TEACHING (CRITICAL):**
        - If the student asks about a concept from their "areas for improvement," YOU MUST simplify your explanation. Use more analogies and break it down into smaller steps.
        - If the student seems stuck on a weak concept, proactively offer a simple practice problem to test their understanding.
        - If the student is discussing a "strength" area, feel free to introduce a slightly more advanced or related fun fact to keep them engaged and challenged.
    2.  **Stay Focused:** Your primary goal is to help the student deeply understand the concepts of this chapter. You MUST strictly adhere to the provided key concepts. Do not discuss unrelated topics.
    3.  **Guide, Don't Give:** Do not just give answers. Guide the student to discover the answers themselves using the Socratic method. Ask leading questions.
    4.  **Simplify:** Break down complex answers into smaller, numbered steps or bullet points. Use simple language and analogies appropriate for a ${grade} student.
    5.  **Be Proactive:** If a student seems confused, proactively offer to explain a related key concept from the list below or provide a simple analogy.
    6.  **Format for Clarity:** Enclose key terms in single quotes for emphasis (e.g., 'photosynthesis'). Use markdown-style lists ('- ' or '1. ') for clarity.
    
    **Key Concepts for this Chapter:**
    ${conceptsContext}

    **Conversation Start:**
    Start the conversation by greeting the student warmly and mentioning the chapter topic ("${chapter}"). Then, on new lines, provide 2-3 specific questions a student might ask, each prefixed with "SUGGESTION:". For example:
    SUGGESTION: Can you explain 'photosynthesis' in a simple way?
    SUGGESTION: What is the formula for calculating area?`;

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
        },
    });
    return chat;
};

export const createGeneralChatbot = (student: Student, language: string): Chat => {
    const performanceSummary = summarizeStudentPerformance(student);

    const systemInstruction = `You are Fitto, an expert, friendly, and encouraging AI Tutor available 24/7 for a ${student.grade} student named ${student.name}. Your entire communication must be in the ${language} language.

    **STUDENT PROFILE:**
    This section contains insights into the student's recent performance. Use this to dynamically adapt your teaching style across all subjects.
    ${performanceSummary}

    **Your Core Directives:**
    1.  **ADAPTIVE TEACHING (CRITICAL):**
        - If the student asks about a concept from their "areas for improvement," YOU MUST simplify your explanation. Use more analogies and break it down into smaller steps.
        - If the student seems stuck on a weak concept, proactively offer a simple practice problem to test their understanding.
        - If the student is discussing a "strength" area, feel free to introduce a slightly more advanced or related fun fact to keep them engaged and challenged.
    2.  **Be a Conceptual Expert:** Your primary goal is to answer conceptual questions across any subject in the student's curriculum (Maths, Science, History, etc.).
    3.  **Provide Step-by-Step Explanations:** When a concept is complex, break it down into simple, logical, numbered steps or bullet points.
    4.  **Use Examples and Analogies:** Make learning easier by providing clear examples and relatable analogies suitable for a ${student.grade} student.
    5.  **Guide, Don't Just Answer:** If a student asks for a direct answer to a homework problem, gently guide them through the steps to solve it themselves instead of giving the answer away.
    6.  **Stay On Topic:** Politely decline to answer questions that are not related to academic subjects. Gently guide the student back to learning.
    7.  **Personalize:** Acknowledge the student's grade level in your explanations, keeping the complexity appropriate.
    8.  **Format for Clarity:** Enclose key terms in single quotes (e.g., 'photosynthesis'). Use markdown-style lists ('- ' or '1. ') for clarity.`;

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
        },
    });
    return chat;
};

// --- START: NEWLY IMPLEMENTED FUNCTIONS TO FIX ERRORS ---

const adaptiveActionSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['ACADEMIC_REVIEW', 'ACADEMIC_PRACTICE', 'ACADEMIC_NEW', 'IQ_EXERCISE', 'EQ_EXERCISE'] },
        details: {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING, nullable: true },
                chapter: { type: Type.STRING, nullable: true },
                concept: { type: Type.STRING, nullable: true },
                skill: { type: Type.STRING, nullable: true },
                reasoning: { type: Type.STRING },
                confidence: { type: Type.NUMBER, nullable: true }
            },
            required: ['reasoning']
        }
    },
    required: ['type', 'details']
};

const findWeakestAcademicArea = (performance: PerformanceRecord[], studentGrade: string): { subject: string, chapter: string } => {
    const academicRecords = performance.filter(p => p.type === 'quiz' || p.type === 'exercise');
    if (academicRecords.length > 0) {
        academicRecords.sort((a, b) => a.score - b.score);
        return { subject: academicRecords[0].subject, chapter: academicRecords[0].chapter };
    }
    const gradeData = CURRICULUM.find(g => g.level === studentGrade);
    if (gradeData && gradeData.subjects.length > 0 && gradeData.subjects[0].chapters.length > 0) {
        return { subject: gradeData.subjects[0].name, chapter: gradeData.subjects[0].chapters[0].title };
    }
    return { subject: 'Mathematics', chapter: 'Real Numbers' };
};

export const getAdaptiveNextStep = async (student: Student, language: string): Promise<AdaptiveAction> => {
    const streak = await getLearningStreak(student.id);
    const learningStreak = streak?.count || 0;

    const performanceSummary = student.performance.length > 0
        ? student.performance.slice(0, 10).map(p => `- Scored ${p.score}% in '${p.chapter}' (${p.subject}) on ${new Date(p.completedDate).toLocaleDateString()}`).join('\n')
        : "No performance data available yet.";
    
    let curriculumContext = '';
    if (student.performance.length > 0) {
        const lastActivity = student.performance[0]; // Assumes performance is sorted date-descending
        const gradeData = CURRICULUM.find(g => g.level === student.grade);
        const subjectData = gradeData?.subjects.find(s => s.name === lastActivity.subject);
        if (subjectData) {
            const chapterTitles = subjectData.chapters.map(c => `'${c.title}'`).join(', ');
            curriculumContext = `
                **CURRICULUM CONTEXT for '${lastActivity.subject}':**
                - The chapters are in this order: ${chapterTitles}.
                - If you need to suggest a new chapter, find the last completed chapter in the student's history for that subject and suggest the one that comes after it in this list.
            `;
        }
    }

    const prompt = `
        **SYSTEM ROLE:**
        You are "Fitto", an AI Learning Strategist. Your goal is to implement an adaptive learning loop using a hybrid decision policy for the student described below. Your response must be in ${language} and strictly follow the provided JSON schema.

        **HYBRID DECISION POLICY:**
        1.  **Safety & SEL Rules (Hard Constraints):** Prioritize student well-being. Inject social-emotional learning (SEL) activities or reviews when frustration or disengagement is detected.
        2.  **Spaced Repetition Tuning (Mastery Rule):** For mastered skills (high scores), reduce practice frequency and introduce new or exploratory challenges to prevent boredom. For weak skills, increase practice frequency.
        3.  **Contextual Bandit (Exploration Policy):** When unsure, or when a student is performing well, balance exploitation (choosing the highest-utility action, like reviewing a weak topic) with exploration (trying a different type of activity, like an IQ challenge, to see what engages the student).

        **STUDENT MODEL:**
        - Name: ${student.name}
        - Grade: ${student.grade}
        - Learning Streak: ${learningStreak} days. (A streak of 0 or 1 indicates low engagement).
        - Recent Performance History (sorted by most recent first):
        ${performanceSummary}

        ${curriculumContext}

        **STEP-BY-STEP ALGORITHM (Follow in strict priority order):**

        **STEP 1: DETECT AFFECTIVE STATE (Safety & SEL Rules)**
        *   **FRUSTRATION CHECK:** Analyze the last 5 activities. Has the student scored below 60% on the **exact same chapter** twice or more?
        *   **IF YES (Frustrated):** The student needs an SEL intervention. Your *only* allowed actions are:
            a) \`ACADEMIC_REVIEW\` of a clear prerequisite chapter to build foundational skills.
            b) \`EQ_EXERCISE\` with the skill 'Resilience' to build a positive mindset.
        *   Choose one of the above, provide your reasoning about rebuilding confidence, and **STOP**.

        *   **ENGAGEMENT CHECK:** Is the learning streak less than 2 days?
        *   **IF YES (Disengaged):** The student needs a motivation boost. There is a 50% chance you should recommend a non-academic, re-engaging task.
        *   If this triggers, randomly choose between \`IQ_EXERCISE\` (any skill) or \`EQ_EXERCISE\` (any skill). The reasoning should be fun and low-pressure, like "Let's try a fun brain-teaser to warm up!" and **STOP**.

        **STEP 2: APPLY SPACED REPETITION & MASTERY RULES**
        *   **MASTERY CHECK (High-Performers):** Are all of the last 5 scores above 85%?
        *   **IF YES (Mastery Achieved):** The student is excelling. Reduce practice frequency of old topics. There is a 60% chance you should choose an **exploration** action to prevent boredom:
            a) \`ACADEMIC_NEW\`: The next logical chapter in their strongest subject.
            b) \`IQ_EXERCISE\`: To sharpen adjacent cognitive skills.
        *   If this rule applies, choose one and provide reasoning about "tackling a new challenge," then **STOP**.

        *   **WEAKNESS CHECK (Increase Practice):** Find the performance record with the lowest score in recent history.
        *   **IF the lowest score is below 80%:** This is the highest priority for learning gain.
        *   The action is \`ACADEMIC_REVIEW\` for that specific subject and chapter.
        *   Reasoning must be encouraging, framing it as an opportunity to "master a key concept." **CHOOSE THIS AND STOP**.

        **STEP 3: DEFAULT (Contextual Bandit - Standard Progress)**
        *   If none of the above rules have triggered a stop, it means the student is progressing steadily.
        *   Default Action (Exploitation): \`ACADEMIC_NEW\`. Find the next logical chapter after their most recently completed one.
        *   Exploration Chance (20%): As a bandit, you should sometimes explore. There's a 20% chance you can suggest an \`IQ_EXERCISE\` instead, with reasoning about "trying something different to keep learning fresh."

        **YOUR TASK:**
        - Execute the algorithm above.
        - Select ONE action type: 'ACADEMIC_REVIEW', 'ACADEMIC_PRACTICE', 'ACADEMIC_NEW', 'IQ_EXERCISE', 'EQ_EXERCISE'.
        - For academic actions, you MUST specify 'subject' and 'chapter'.
        - For IQ/EQ, specify a 'skill'.
        - Write a compelling, personalized, and encouraging 'reasoning' string that explains *why* this mission was chosen, referencing the student's state.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: adaptiveActionSchema, temperature: 0.9 },
        });
        const action = JSON.parse(response.text.trim()) as AdaptiveAction;
        
        // Fallback logic in case the model fails to provide subject/chapter
        if (action.type.startsWith('ACADEMIC') && (!action.details.subject || !action.details.chapter)) {
            const weakArea = findWeakestAcademicArea(student.performance, student.grade);
            action.details.subject = action.details.subject || weakArea.subject;
            action.details.chapter = action.details.chapter || weakArea.chapter;
        }
        return action;
    } catch (error) {
        throw handleGeminiError(error, 'get adaptive next step');
    }
};

const iqExerciseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            skill: { type: Type.STRING, enum: ['Pattern Recognition', 'Logic Puzzle', 'Spatial Reasoning', 'Analogical Reasoning'] }
        },
        required: ['question', 'options', 'correctAnswer', 'explanation', 'skill']
    }
};

export const generateIQExercises = async (grade: string, language: string, count: number = 5): Promise<IQExercise[]> => {
    const prompt = `Generate ${count} multiple-choice IQ exercises for a ${grade} student in ${language}. Distribute questions across skills: 'Pattern Recognition', 'Logic Puzzle', 'Spatial Reasoning', 'Analogical Reasoning'.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: iqExerciseSchema } });
        return JSON.parse(response.text.trim()) as IQExercise[];
    } catch (error) {
        throw handleGeminiError(error, 'generate IQ exercises');
    }
};

const eqExerciseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            scenario: { type: Type.STRING }, question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
            bestResponse: { type: Type.STRING }, explanation: { type: Type.STRING },
            skill: { type: Type.STRING, enum: ['Empathy', 'Self-awareness', 'Resilience', 'Social Skills'] }
        },
        required: ['scenario', 'question', 'options', 'bestResponse', 'explanation', 'skill']
    }
};

export const generateEQExercises = async (grade: string, language: string, count: number = 5): Promise<EQExercise[]> => {
    const prompt = `Generate ${count} scenario-based multiple-choice EQ exercises for a ${grade} student in ${language}. Distribute questions across skills: 'Empathy', 'Self-awareness', 'Resilience', 'Social Skills'.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: eqExerciseSchema } });
        return JSON.parse(response.text.trim()) as EQExercise[];
    } catch (error) {
        throw handleGeminiError(error, 'generate EQ exercises');
    }
};

export const generateComprehensiveDiagnosticTest = async (grade: string, subject: string, chapter: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `Generate a 10-question diagnostic test for a ${grade} student starting "${chapter}" in ${subject}, in ${language}. Mix 5 ACADEMIC prerequisite questions, 3 IQ puzzles, and 2 EQ scenarios. Use the 'type' field ('ACADEMIC', 'IQ', 'EQ') for each.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: quizSchema } });
        return JSON.parse(response.text.trim()) as QuizQuestion[];
    } catch (error) { throw handleGeminiError(error, 'generate comprehensive diagnostic test'); }
};

const fittoResponseSchema = { type: Type.OBJECT, properties: { isRelevant: { type: Type.BOOLEAN }, responseText: { type: Type.STRING } }, required: ['isRelevant', 'responseText'] };
export const getFittoAnswer = async (question: StudentQuestion, student: Student, language: string): Promise<FittoResponse> => {
    const performanceSummary = summarizeStudentPerformance(student);
    const prompt = `As Fitto, an AI Tutor, answer this student's question about "${question.concept}".
    Question: "${question.questionText}".
    
    **STUDENT PROFILE (for personalization):**
    ${performanceSummary}

    **YOUR TASK:**
    1.  First, determine if the question is relevant to the concept.
    2.  Then, craft a simple, Socratic explanation in ${language}.
    3.  **ADAPTIVE RULE:** If the question is about an "area for improvement" from the student's profile, YOU MUST make your explanation extra simple and use a clear analogy.

    Provide your response in the specified JSON format.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: fittoResponseSchema } });
        return JSON.parse(response.text.trim()) as FittoResponse;
    } catch (error) { throw handleGeminiError(error, 'get Fitto answer'); }
};

export const generateTeacherReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `Generate a teacher report for ${student.name} (${student.grade}) based on performance data. Format with 'HEADING: ' for titles. Analyze strengths, weaknesses, and suggest pedagogical strategies in ${language}. Data: ${JSON.stringify(student.performance.slice(0, 10))}`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) { throw handleGeminiError(error, 'generate teacher report'); }
};

export const generateParentReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `Generate a simple, encouraging parent report for ${student.name} (${student.grade}). Format with 'HEADING: '. Highlight strengths, areas for growth, and suggest supportive home activities in ${language}. Data: ${JSON.stringify(student.performance.slice(0, 10))}`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) { throw handleGeminiError(error, 'generate parent report'); }
};

const aiAnalysisSchema = { type: Type.OBJECT, properties: { modelAnswer: { type: Type.STRING }, pedagogicalNotes: { type: Type.STRING } }, required: ['modelAnswer', 'pedagogicalNotes'] };
export const analyzeStudentQuestionForTeacher = async (question: StudentQuestion, language: string): Promise<AIAnalysis> => {
    const prompt = `For a teacher, analyze this student question: "${question.questionText}" about "${question.concept}". Provide a model answer and pedagogical notes on the student's potential confusion in ${language}.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: aiAnalysisSchema } });
        return JSON.parse(response.text.trim()) as AIAnalysis;
    } catch (error) { throw handleGeminiError(error, 'analyze student question'); }
};

const aptitudeTestSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, trait: { type: Type.STRING, enum: ['Logical Reasoning', 'Verbal Ability', 'Numerical Aptitude', 'Spatial Awareness'] }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'correctAnswer', 'trait', 'explanation'] } };
export const generateAptitudeTest = async (grade: string, language: string): Promise<AptitudeQuestion[]> => {
    const prompt = `Generate a 10-question aptitude test for a ${grade} student in ${language}, covering 'Logical Reasoning', 'Verbal Ability', 'Numerical Aptitude', 'Spatial Awareness'.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: aptitudeTestSchema } });
        return JSON.parse(response.text.trim()) as AptitudeQuestion[];
    } catch (error) { throw handleGeminiError(error, 'generate aptitude test'); }
};

export const generateAptitudeTestSummary = async (results: any, language: string): Promise<string> => {
    const prompt = `Summarize these aptitude test results in an encouraging tone for a student in ${language}. Identify the strongest trait. Results: ${JSON.stringify(results)}`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) { throw handleGeminiError(error, 'generate aptitude summary'); }
};

const careerGuidanceSchema = { type: Type.OBJECT, properties: { introduction: { type: Type.STRING }, streamRecommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { streamName: { type: Type.STRING, enum: ['Science', 'Commerce', 'Humanities/Arts'] }, recommendationReason: { type: Type.STRING }, suggestedCareers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { careerName: { type: Type.STRING }, description: { type: Type.STRING }, requiredSubjects: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['careerName', 'description', 'requiredSubjects'] } } }, required: ['streamName', 'recommendationReason', 'suggestedCareers'] } }, conclusion: { type: Type.STRING } }, required: ['introduction', 'streamRecommendations', 'conclusion'] };
export const generateStreamGuidance = async (student: Student, aptitudeResults: any, language: string): Promise<CareerGuidance> => {
    const prompt = `Generate stream and career guidance for ${student.name} (${student.grade}) in ${language} based on their aptitude results: ${JSON.stringify(aptitudeResults)}.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: careerGuidanceSchema } });
        return JSON.parse(response.text.trim()) as CareerGuidance;
    } catch (error) { throw handleGeminiError(error, 'generate stream guidance'); }
};

// FIX: Added function and schemas for generating adaptive stories.
const storyNodeChoiceSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: 'The text for the choice the user can make.' },
        nextNodeId: { type: Type.STRING, description: 'The ID of the node this choice leads to.' },
        feedback: { type: Type.STRING, description: 'Brief feedback shown to the user after making this choice.' },
    },
    required: ['text', 'nextNodeId', 'feedback'],
};

const storyNodeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: 'A unique identifier for this node (e.g., "node-1", "intro").' },
        text: { type: Type.STRING, description: 'The narrative text of this part of the story.' },
        choices: {
            type: Type.ARRAY,
            items: storyNodeChoiceSchema,
            description: 'The choices available to the user at this node. Should be empty if isEnding is true.',
        },
        isEnding: { type: Type.BOOLEAN, description: 'Set to true if this is an ending node of the story.' },
    },
    required: ['id', 'text', 'choices', 'isEnding'],
};

const adaptiveStorySchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['adaptiveStory'] },
        id: { type: Type.STRING, description: 'A unique ID for the entire story.' },
        title: { type: Type.STRING, description: 'The title of the adaptive story.' },
        introduction: { type: Type.STRING, description: 'A brief introduction to set the scene for the story.' },
        startNodeId: { type: Type.STRING, description: 'The ID of the first node to start the story.' },
        nodes: {
            type: Type.ARRAY,
            items: storyNodeSchema,
            description: 'An array of all the nodes that make up the story.',
            minItems: 3,
        },
    },
    required: ['type', 'id', 'title', 'introduction', 'startNodeId', 'nodes'],
};

export const generateAdaptiveStory = async (topic: string, grade: string, language: string): Promise<AdaptiveStory> => {
    const prompt = `
        You are an expert educational storyteller. Create an interactive, adaptive story for a ${grade} student.
        The story should be about: "${topic}".
        The story must be engaging, age-appropriate, and educational.
        It should have a clear beginning, multiple branching paths, and at least two different endings.
        The entire response must be in the ${language} language and strictly follow the provided JSON schema.

        **CRITICAL INSTRUCTIONS:**
        1.  Create a story with at least 3 nodes.
        2.  The 'startNodeId' must match the 'id' of one of the nodes.
        3.  Each choice's 'nextNodeId' must correspond to another node's 'id'.
        4.  Ending nodes must have 'isEnding' set to true and an empty 'choices' array.
        5.  Provide brief, encouraging, or informative feedback for each choice.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: adaptiveStorySchema,
                temperature: 0.8,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AdaptiveStory;
    } catch (error) {
        throw handleGeminiError(error, 'generate adaptive story');
    }
};

export const createCareerCounselorChat = (student: Student, language: string): Chat => {
    const systemInstruction = `You are an AI Career Counselor for ${student.name} (${student.grade}) in ${language}. Be encouraging, ask about interests, and provide information on careers, required subjects, and educational paths.`;
    return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
};

export const generateVideoFromPrompt = async (prompt: string): Promise<Blob> => {
    try {
        let operation = await ai.models.generateVideos({ model: 'veo-2.0-generate-001', prompt: prompt });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video URI not found in operation response.");
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
        return await response.blob();
    } catch (error) {
        throw handleGeminiError(error, 'generate video from prompt');
    }
};

export const generateEducationalTips = async (topic: string, language: string): Promise<string[]> => {
    const prompt = `Generate 5 short, engaging, and little-known facts or tips about "${topic}" for a student. The response must be in ${language}. Output as a simple JSON array of strings.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } } });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Could not fetch educational tips:", error);
        return [`Learning more about ${topic} can be very rewarding!`, "Did you know this topic has many real-world applications?"];
    }
};

const curriculumOutlineSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { chapterTitle: { type: Type.STRING }, learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['chapterTitle', 'learningObjectives'] } };
export const generateCurriculumOutline = async (grade: string, subject: string, language: string): Promise<CurriculumOutlineChapter[]> => {
    const prompt = `Generate a standard CBSE curriculum chapter outline for ${subject}, ${grade} in ${language}. Include chapter titles and 3-4 key learning objectives for each.`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: curriculumOutlineSchema } });
        return JSON.parse(response.text.trim()) as CurriculumOutlineChapter[];
    } catch(error) { throw handleGeminiError(error, 'generate curriculum outline'); }
};

export const validateCurriculumOutline = async (outline: CurriculumOutlineChapter[], grade: string, subject: string, language: string): Promise<string> => {
    const prompt = `As a CBSE curriculum expert, review this generated outline for ${subject}, ${grade}. Is it complete and logical? Are any key topics missing? Provide a concise report in ${language} with 'HEADING: ' for titles. Outline: ${JSON.stringify(outline)}`;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) { throw handleGeminiError(error, 'validate curriculum'); }
};

const goalSuggestionsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    maxItems: 3,
};

export const generateStudyGoalSuggestions = async (student: Student, language: string): Promise<string[]> => {
    const performanceSummary = student.performance.length > 0
        ? student.performance
            .sort((a, b) => a.score - b.score) // Sort by lowest score first
            .slice(0, 3) // Take the 3 worst performances
            .map(p => `- Scored ${p.score}% in ${p.chapter} (${p.subject})`)
            .join('\n')
        : "No performance data available yet. Suggest general goals like 'Complete one mission today' or 'Practice a math chapter for 20 minutes'.";

    const prompt = `
        You are an encouraging AI learning coach named Fitto.
        Based on this ${student.grade} student's recent performance, suggest exactly 3 short, actionable, and specific study goals.
        The entire response must be in the ${language} language.
        Focus on the areas with the lowest scores. Frame the goals positively.
        For example, instead of "You are bad at Electricity", suggest "Review key concepts in 'Electricity'".

        Student's recent performance (weakest areas):
        ${performanceSummary}

        Respond with a JSON array of 3 distinct string suggestions.
        Example suggestions:
        - "Practice 5 numerical problems from the 'Light' chapter."
        - "Create a mind map for the key dates in 'The Rise of Nationalism in Europe'."
        - "Spend 20 minutes reviewing the 'Polynomials' chapter."
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: goalSuggestionsSchema,
                temperature: 0.8,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as string[];
    } catch (error) {
        throw handleGeminiError(error, 'generate study goal suggestions');
    }
};

// --- START: NEW PRACTICE AND EVALUATION FUNCTIONS ---

const morePracticeProblemsSchema = {
    type: Type.ARRAY,
    items: practiceProblemSchema,
    maxItems: 3,
};

export const generateMorePracticeProblems = async (
    grade: string,
    subject: string,
    chapter: string,
    existingProblems: PracticeProblem[],
    language: string
): Promise<PracticeProblem[]> => {
    const existingProblemStatements = existingProblems.map(p => p.problemStatement).join('\n - ');
    const prompt = `
        You are an expert question setter for Indian competitive exams (JEE/NEET/Olympiads).
        For a ${grade} student studying "${chapter}" in ${subject}, generate 3 new, unique, and challenging practice problems.
        The problems should be different from the ones provided below. The entire response must be in ${language}.

        **Existing Problems (do NOT repeat these):**
        - ${existingProblemStatements}

        **Instructions:**
        1.  Create 3 problems with a mix of 'Level 2: Reference Application' and 'Level 3: Competitive Challenge'.
        2.  Each problem must have a detailed, step-by-step solution.
        3.  The questions should test deep conceptual understanding and application skills.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: morePracticeProblemsSchema,
                temperature: 0.9,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PracticeProblem[];
    } catch (error) {
        throw handleGeminiError(error, 'generate more practice problems');
    }
};

const writtenAnswerEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        modelAnswer: { type: Type.STRING },
        markingScheme: { type: Type.STRING, description: "Detailed, point-wise marking scheme for the model answer." },
        personalizedFeedback: { type: Type.STRING, description: "Constructive feedback on the student's answer, highlighting strengths and areas for improvement." },
        proTips: { type: Type.STRING, description: "Actionable tips for improving answer writing for board exams, like using keywords or diagrams." }
    },
    required: ['modelAnswer', 'markingScheme', 'personalizedFeedback', 'proTips']
};

export const evaluateWrittenAnswer = async (
    question: string,
    studentAnswer: string,
    grade: string,
    subject: string,
    language: string
): Promise<WrittenAnswerEvaluation> => {
    const prompt = `
        You are an expert CBSE board examiner for ${subject}, grade ${grade}.
        Your task is to evaluate a student's written answer. The entire response must be in ${language}.

        **Question:**
        ${question}

        **Student's Answer:**
        ${studentAnswer}

        **Instructions:**
        1.  **Model Answer:** First, provide a perfect, ideal model answer for the question, as expected in a board exam.
        2.  **Marking Scheme:** Create a detailed, point-wise marking scheme based on the model answer. (e.g., "1 mark for correct definition, 1 mark for diagram...").
        3.  **Personalized Feedback:** Analyze the student's answer against the model answer. Provide constructive, encouraging feedback. Mention what they did well and what they missed. Be specific.
        4.  **Pro Tips:** Give 2-3 actionable tips for improving their answer-writing skills for this type of question in board exams (e.g., "Underline keywords," "Always draw a labeled diagram," "Structure your answer in points.").

        Provide your response in the specified JSON format.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: writtenAnswerEvaluationSchema,
                temperature: 0.6,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as WrittenAnswerEvaluation;
    } catch (error) {
        throw handleGeminiError(error, 'evaluate written answer');
    }
};

export const generateSATPracticeTest = async (language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        You are an expert SAT test creator. Generate 5 high-quality, SAT-style multiple-choice questions.
        The questions should cover a mix of Reading Comprehension, Writing and Language, and Math (No Calculator & Calculator) sections.
        The entire response must be in ${language}.

        **CRITICAL INSTRUCTIONS:**
        1.  **Authentic Style:** Questions should mimic the style, complexity, and wording of the actual SAT exam.
        2.  **Reading:** Include at least one question based on a short passage (provide the passage in the 'question' field, followed by the question itself).
        3.  **Math:** Include a mix of problem-solving and data analysis questions.
        4.  **Plausible Distractors:** Incorrect options must be plausible and based on common errors.
        5.  **Detailed Explanations:** Provide a clear, step-by-step explanation for each question, detailing why the correct answer is right.
        6.  **Concept Title:** For the 'conceptTitle' field, use one of: 'Reading Comprehension', 'Writing and Language', 'Math (No Calculator)', 'Math (Calculator)'.
    `;
    try {
        // Using a more powerful model for complex SAT questions
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
                temperature: 0.7,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as QuizQuestion[];
    } catch (error) {
        throw handleGeminiError(error, 'generate SAT practice test');
    }
};

const satAnswerEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        modelApproach: { type: Type.STRING, description: "The most efficient, expert-level approach to solving the problem." },
        personalizedFeedback: { type: Type.STRING, description: "Constructive feedback on the student's described approach. Is it correct? Is it efficient? What are the potential pitfalls?" },
        keyConcept: { type: Type.STRING, description: "The core mathematical or logical concept being tested by this question." },
        proTips: { type: Type.STRING, description: "Actionable tips for tackling similar SAT questions, focusing on strategy (e.g., 'back-solving', 'plugging in numbers')." }
    },
    required: ['modelApproach', 'personalizedFeedback', 'keyConcept', 'proTips']
};

export const evaluateSATAnswerApproach = async (
    question: string,
    studentApproach: string,
    language: string
): Promise<SATAnswerEvaluation> => {
    const prompt = `
        You are an expert SAT tutor. A student has described their approach to solving a practice question. Your task is to evaluate their thinking process. The entire response must be in ${language}.

        **SAT Question:**
        ${question}

        **Student's Described Approach:**
        ${studentApproach}

        **Instructions:**
        1.  **Model Approach:** Briefly describe the most efficient, expert way to solve this problem.
        2.  **Personalized Feedback:** Analyze the student's approach. Is their logic sound? Is there a faster way? Point out any potential misconceptions or errors in their thinking. Be encouraging.
        3.  **Key Concept:** Identify the primary concept or skill this question is testing (e.g., "Linear equations," "Quadratic functions," "Interpreting data").
        4.  **Pro Tips:** Provide a strategic tip for similar SAT questions (e.g., "For questions like this, try plugging in the answer choices to see which one works," or "Look for shortcuts instead of doing full calculations.").

        Provide your response in the specified JSON format.
    `;
    try {
        // Use pro for better reasoning
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: satAnswerEvaluationSchema,
                temperature: 0.5,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SATAnswerEvaluation;
    } catch (error) {
        throw handleGeminiError(error, 'evaluate SAT answer approach');
    }
};

// --- END: NEW PRACTICE AND EVALUATION FUNCTIONS ---


// --- START: NEW AI STUDY NOTEBOOK FUNCTION ---
// FIX: Completed the truncated `generateChapterInsights` function.
export const generateChapterInsights = async (
    chapterContent: string,
    task: 'summarize' | 'glossary' | 'questions' | 'custom',
    customPrompt: string | null,
    language: string
): Promise<string> => {
    let instruction = '';
    switch(task) {
        case 'summarize':
            instruction = 'Summarize the following chapter content into key bullet points. Focus on the main ideas and concepts.';
            break;
        case 'glossary':
            instruction = 'Create a glossary of key terms from the following chapter content. For each term, provide a simple, clear definition.';
            break;
        case 'questions':
            instruction = 'Generate 5 multiple-choice practice questions based on the following chapter content. Include the correct answer and a brief explanation for each.';
            break;
        case 'custom':
            instruction = customPrompt || 'Analyze the following chapter content based on the user query.';
            break;
    }

    const prompt = `
        You are an AI study assistant named Fitto. Your task is to help a student understand their chapter content better by performing a specific task.
        The entire response must be in the ${language} language and use clear, simple markdown for formatting (e.g., headings, lists).

        **Your Task:** ${instruction}

        **Chapter Content Provided:**
        ---
        ${chapterContent}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, 'generate chapter insights');
    }
};
// --- END: NEW AI STUDY NOTEBOOK FUNCTION ---

// --- START: NEW COGNITIVE TWIN FUNCTION ---
const cognitiveProfileSchema = {
    type: Type.OBJECT,
    properties: {
        cognitiveTraits: {
            type: Type.OBJECT,
            properties: {
                attentionSpan: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['value', 'analysis'] },
                confidence: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['value', 'analysis'] },
                resilience: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, analysis: { type: Type.STRING } }, required: ['value', 'analysis'] },
            },
            required: ['attentionSpan', 'confidence', 'resilience']
        },
        learningStyle: {
            type: Type.OBJECT,
            properties: {
                style: { type: Type.STRING, enum: ['Visual', 'Textual', 'Practical', 'Theoretical', 'Balanced'] },
                analysis: { type: Type.STRING },
            },
            required: ['style', 'analysis']
        },
        memoryMatrix: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    retentionStrength: { type: Type.NUMBER },
                    lastRevised: { type: Type.STRING },
                },
                required: ['concept', 'subject', 'retentionStrength', 'lastRevised']
            },
            maxItems: 5,
        }
    },
    required: ['cognitiveTraits', 'learningStyle', 'memoryMatrix']
};

export const analyzeCognitiveProfile = async (student: Student, language: string): Promise<CognitiveProfile> => {
     const performanceSummary = student.performance.length > 0 
        ? JSON.stringify(student.performance.slice(0, 15).map(p => ({ chapter: p.chapter, subject: p.subject, score: p.score, date: p.completedDate })), null, 2)
        : "No performance data available. Please provide a general analysis for a new student.";

    const prompt = `
        You are an expert educational psychologist creating a "Cognitive Twin" profile for a student. Analyze the provided performance data to generate a detailed cognitive profile in JSON format. The entire response must be in the ${language} language.

        **STUDENT DATA:**
        - Grade: ${student.grade}
        - Recent Performance Records: ${performanceSummary}
        
        **ANALYSIS INSTRUCTIONS (Provide estimations):**
        1.  **Cognitive Traits (Value from 0 to 100):**
            -   **attentionSpan:** High variance in scores (e.g., 95 then 60) suggests lower attention. Consistent scores suggest higher attention. Estimate a value.
            -   **confidence:** High scores, especially in traditionally difficult subjects like Math/Physics, suggest higher confidence. Persistently low scores suggest lower confidence. Estimate a value.
            -   **resilience:** Look for score improvements after a low score in the same subject. If a student scores 50 and then 80 in the next chapter of the same subject, resilience is high. If scores stay low, it's lower. Estimate a value.
            -   For each trait, provide a numeric \`value\` and a short, encouraging \`analysis\` string explaining your reasoning.

        2.  **Learning Style:**
            -   Based on the limited data, infer a likely learning style. If the student does well in application-based topics (e.g., Physics numericals), suggest 'Practical'. If they do well in theoretical topics (History), suggest 'Textual'. If performance is balanced, suggest 'Balanced'.
            -   Choose one style: 'Visual', 'Textual', 'Practical', 'Theoretical', 'Balanced'.
            -   Provide a short \`analysis\` string explaining your choice.

        3.  **Memory Matrix (3 to 5 concepts):**
            -   Identify 3-5 concepts from the performance records that need reinforcement. Prioritize topics with the lowest scores. If all scores are high, pick the ones with the oldest 'lastRevised' dates.
            -   For each, estimate a \`retentionStrength\` (0-100). A score of 60% might equate to a retention of 60.
            -   Provide the \`concept\` (use chapter name), \`subject\`, and \`lastRevised\` date from the records.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: cognitiveProfileSchema,
                temperature: 0.5,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CognitiveProfile;
    } catch (error) {
        throw handleGeminiError(error, 'analyze cognitive profile');
    }
};
// --- END: NEW COGNITIVE TWIN FUNCTION ---


// --- START: NEW BOARD EXAM PREP FUNCTIONS ---
const boardPaperQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        q_no: { type: Type.STRING },
        text: { type: Type.STRING },
        marks: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['MCQ', 'ASSERTION_REASON', 'VSA', 'SA', 'LA', 'CASE_BASED'] },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        solution: { type: Type.STRING, description: "A comprehensive, step-by-step model solution. For MCQs, start with 'The correct option is (x) ...'"}
    },
    required: ['q_no', 'text', 'marks', 'type', 'solution']
};

const boardPaperSectionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        questions: { type: Type.ARRAY, items: boardPaperQuestionSchema }
    },
    required: ['name', 'description', 'questions']
};

const boardPaperSchema = {
    type: Type.OBJECT,
    properties: {
        year: { type: Type.NUMBER },
        grade: { type: Type.STRING },
        subject: { type: Type.STRING },
        paperTitle: { type: Type.STRING },
        totalMarks: { type: Type.NUMBER },
        timeAllowed: { type: Type.NUMBER },
        sections: { type: Type.ARRAY, items: boardPaperSectionSchema },
    },
    required: ['year', 'grade', 'subject', 'paperTitle', 'totalMarks', 'timeAllowed', 'sections']
};

export const generateBoardPaper = async (year: number, grade: string, subject: string, language: string): Promise<BoardPaper> => {
    const prompt = `
        **SYSTEM ROLE:** You are an expert CBSE examiner and question paper creator. Your task is to generate a full, authentic-looking CBSE board exam paper.

        **REQUEST:**
        - **Year:** ${year}
        - **Grade:** ${grade}
        - **Subject:** ${subject}
        - **Language:** ${language}

        **CRITICAL INSTRUCTIONS:**
        1.  **Authenticity:** The paper's structure (number of sections, question types per section, marks per question, and total marks) MUST precisely match the official CBSE pattern for the specified **${year}**. Research and adhere to this pattern. For example, the 2023 Grade 10 Science paper had 5 sections (A-E) with a specific mix of MCQs, Assertion-Reason, VSA, SA, LA, and Case-Based questions.
        2.  **Syllabus-Correctness:** All questions must be strictly based on the CBSE syllabus that was applicable for the **${year}** academic session.
        3.  **Realistic Questions:** Questions should be of a standard and style found in actual board papers for that year, covering a wide range of topics from the syllabus.
        4.  **Complete Solutions:** Every single question MUST have a detailed, accurate, and well-explained model solution. For MCQs, the solution must start with "The correct option is (x)..." followed by the explanation.
        5.  **Output Format:** Your entire response must be a single JSON object that perfectly matches the provided schema.

        Generate the complete paper now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: boardPaperSchema,
                temperature: 0.6,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as BoardPaper;
    } catch (error) {
        throw handleGeminiError(error, `generate board paper for ${year}`);
    }
}