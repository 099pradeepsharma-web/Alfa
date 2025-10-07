
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { LearningModule, QuizQuestion, Student, NextStepRecommendation, Concept, StudentQuestion, AIAnalysis, FittoResponse, AdaptiveAction, IQExercise, EQExercise, CurriculumOutlineChapter, Chapter, Trigger, CoreConceptLesson, PracticeArena, PracticalApplicationLab, AptitudeQuestion, CareerGuidance, XpReward, VideoReward, StudyGoal, PracticeProblem, WrittenAnswerEvaluation, SATAnswerEvaluation } from '../types';
import { CURRICULUM } from '../data/curriculum';

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
        labInstructions: { type: Type.STRING, description: "Mandatory instructions for the student to complete the investment step.", nullable: true }
    },
    required: ['type', 'title', 'description']
};

export const getChapterContent = async (gradeLevel: string, subject: string, chapter: Chapter, studentName: string, language: string): Promise<LearningModule> => {
    
    const prompt = `
        **SYSTEM ROLE:**
        You are an expert Curriculum Architect and syllabus master for the Indian CBSE board. Your task is to design a complete, robust, and engaging learning module for a ${gradeLevel} student on the chapter "${chapter.title}" in ${subject}, following the "Alfanumrik Integrated Learning Framework". The entire response must be in the ${language} language.

        **FRAMEWORK PRINCIPLES (MANDATORY):**
        1.  **Narrative & Gamification:** Frame the chapter as a "Mission". Integrate leveling and challenges.
        2.  **HOOK Model:** Follow the Trigger -> Action -> Reward -> Investment loop.
        3.  **Content Synthesis & Depth:** Base content on NCERT but deeply integrate concepts, numericals, and analytical questions from standard reference books (e.g., H.C. Verma for Physics, R.D. Sharma for Maths, S. Chand, Oswal question banks).
        4.  **Competitive Focus:** Include elements relevant to NTSE, Olympiads, and JEE/NEET foundation.
        5.  **Clarity and Presentation:** All text must be clear, spacious, and well-structured for easy reading.

        **FORMATTING RULES (NON-NEGOTIABLE):**
        -   **Underlining is CRITICAL:** You MUST underline important keywords, formulas, and concepts relevant for board and competitive exams by wrapping them ONLY in <u>...</u> tags. Example: <u>Snell's Law</u>.
        -   **ABSOLUTELY NO BOLD MARKDOWN:** Do NOT use markdown asterisks (**) for bolding anywhere in the response. The renderer does not support it. Use underlines for emphasis.
        -   **Point-wise Explanations:** For any point-wise explanations, you MUST use markdown lists (e.g., starting a line with a hyphen and a space: "- Point 1").
        -   **Strict Vertical Formatting:** ALL formula derivations and solved numerical examples MUST be presented vertically. Each step MUST be on a new line. You can use '=>' at the start of a line to show progression.
        -   **Lab Instructions Formatting:** The \`labInstructions\` field MUST be a multi-line string. Start with a heading like "Instructions:", followed by a newline, and then a numbered or bulleted list using markdown. Each step must be on a new line.

        **REQUIRED OUTPUT STRUCTURE:**
        -   **chapterTitle**: Must be exactly "${chapter.title}".
        -   **missionBriefing (The Trigger):** An array of 2-3 varied 'Trigger' objects to spark curiosity.
        -   **coreConceptTraining (Action):** Break the chapter into 3-5 micro-lessons. For each, provide:
            -   A title.
            -   A **comprehensive, in-depth explanation** following all formatting rules.
            -   Where applicable (especially in Physics/Maths), include **step-by-step formula derivations**.
            -   Include at least one **solved numerical example**, presented vertically.
            -   Provide **analytical insights** (e.g., special cases, graphical analysis, 'what if' scenarios).
            -   For highly visual concepts, you MAY include a 'videoPrompt'.
            -   Exactly two "Knowledge Check" multiple-choice questions with explanations.
        -   **practiceArena (Variable Reward):** Provide a robust set of 8 practice problems: 3 'NCERT Basics', 3 'Reference Application' (inspired by H.C. Verma/R.D. Sharma), and 2 'Competitive Challenge' (Olympiad/JEE/NEET pattern). All solutions must follow the vertical step-by-step format.
        -   **practicalApplicationLab (Investment):** A mandatory activity (virtual lab, simulation, project).
        -   **bossFight (Final Challenge):** A 10-question chapter-end test mixing MCQs, numericals, and assertion-reasoning questions.
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
        Based on the following key concepts, create a ${count}-question multiple-choice quiz. The questions
        should test conceptual understanding and application of knowledge, not just rote memorization. The entire response, including all
        questions, options, answers, explanations, and concept titles, must be in the ${language} language.

        For each question:
        1.  Provide a clear, high-quality question that requires some thought.
        2.  Provide four distinct and plausible options, with one being the correct answer.
        3.  Indicate the correct answer.
        4.  Provide a thorough explanation for why the correct answer is right and the others are wrong.
        5.  **Crucially, you must associate each question with one of the provided concept titles.** Use the 'conceptTitle' field for this.

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
        Generate 3 multiple-choice questions for a ${grade} student to practice and drill the specific concept of "${concept.conceptTitle}".
        The entire response, including all questions, options, answers, explanations, and concept titles, must be in the ${language} language.

        The questions should be focused on reinforcing the core skill of the concept with high-quality, clear examples. They should be direct and clear.
        For example, if the concept is 'Simple Addition', questions should be direct calculations like '5 + 7 = ?'.
        If the concept is 'Identifying Nouns', questions should be like 'Which word in the following sentence is a noun?'.

        For each question:
        1. Provide a clear question.
        2. Provide four distinct options, with one being the correct answer.
        3. Indicate the correct answer.
        4. Provide a helpful, brief explanation for the answer.
        5. **Crucially, for the 'conceptTitle' field, you must use the exact title provided: "${concept.conceptTitle}"**.

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


export const createTutorChat = (grade: string, subject: string, chapter: string, language: string, keyConcepts: Concept[]): Chat => {
    const conceptsContext = keyConcepts.map(c => `- '${c.conceptTitle}': ${c.explanation.substring(0, 150)}...`).join('\n');
    
    const systemInstruction = `You are Fitto, an expert, friendly, and encouraging AI Tutor for a ${grade} student studying ${subject} in the ${language} language. Your current topic is "${chapter}". 
    
    **Your Core Directives:**
    1.  **Stay Focused:** Your primary goal is to help the student deeply understand the concepts of this chapter. You MUST strictly adhere to the provided key concepts. Do not discuss unrelated topics.
    2.  **Guide, Don't Give:** Do not just give answers. Guide the student to discover the answers themselves using the Socratic method. Ask leading questions.
    3.  **Simplify:** Break down complex answers into smaller, numbered steps or bullet points. Use simple language and analogies appropriate for a ${grade} student.
    4.  **Be Proactive:** If a student seems confused, proactively offer to explain a related key concept from the list below or provide a simple analogy.
    5.  **Format for Clarity:** Enclose key terms in single quotes for emphasis (e.g., 'photosynthesis'). Use markdown-style lists ('- ' or '1. ') for clarity.
    
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
    const systemInstruction = `You are Fitto, an expert, friendly, and encouraging AI Tutor available 24/7 for a ${student.grade} student named ${student.name}. Your entire communication must be in the ${language} language.

    **Your Core Directives:**
    1.  **Be a Conceptual Expert:** Your primary goal is to answer conceptual questions across any subject in the student's curriculum (Maths, Science, History, etc.).
    2.  **Provide Step-by-Step Explanations:** When a concept is complex, break it down into simple, logical, numbered steps or bullet points.
    3.  **Use Examples and Analogies:** Make learning easier by providing clear examples and relatable analogies suitable for a ${student.grade} student.
    4.  **Guide, Don't Just Answer:** If a student asks for a direct answer to a homework problem, gently guide them through the steps to solve it themselves instead of giving the answer away.
    5.  **Stay On Topic:** Politely decline to answer questions that are not related to academic subjects. Gently guide the student back to learning.
    6.  **Personalize:** Acknowledge the student's grade level in your explanations, keeping the complexity appropriate.
    7.  **Format for Clarity:** Enclose key terms in single quotes (e.g., 'photosynthesis'). Use markdown-style lists ('- ' or '1. ') for clarity.`;

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

export const getAdaptiveNextStep = async (student: Student, language: string): Promise<AdaptiveAction> => {
    const performanceSummary = student.performance.length > 0
        ? student.performance.slice(0, 5).map(p => `- Scored ${p.score}% in ${p.chapter} (${p.subject})`).join('\n')
        : "No performance data available yet.";
    
    let weakSubject = null;
    let weakChapter = null;
    if (student.performance.length > 0) {
        const sortedPerf = [...student.performance].sort((a,b) => a.score - b.score);
        weakSubject = sortedPerf[0].subject;
        weakChapter = sortedPerf[0].chapter;
    }

    const prompt = `
        You are an expert, encouraging AI learning coach named Fitto. Your goal is to decide the single best next learning mission for a ${student.grade} student named ${student.name}.
        The entire response must be in the ${language} language and strictly follow the provided JSON schema.

        STUDENT CONTEXT:
        - Grade: ${student.grade}
        - Recent Performance:
        ${performanceSummary}

        RULES FOR DECIDING THE NEXT MISSION (in order of priority):
        1. If it's been more than 4 academic missions since the last 'IQ_EXERCISE' or 'EQ_EXERCISE', there is a 50% chance you should recommend one of them to ensure holistic development. Choose one randomly and provide a fun reason.
        2. If the student has performance data and their lowest score is below 65%, recommend 'ACADEMIC_REVIEW' for that specific chapter. The reasoning should be very encouraging, framing it as "strengthening the foundation".
        3. If all recent scores are good (>= 65%), recommend 'ACADEMIC_NEW'. Identify the next logical chapter for the student to start.
        4. If you can't determine the next chapter or there's no performance data, default to 'ACADEMIC_PRACTICE' on their most recently studied chapter to build confidence.
        
        YOUR TASK:
        - Analyze the context and apply the rules to choose an 'AdaptiveActionType'.
        - For academic actions, you MUST specify the 'subject' and 'chapter'. Use "${weakSubject || 'Mathematics'}" and "${weakChapter || 'Real Numbers'}" as your primary targets if needed.
        - For IQ/EQ actions, specify a 'skill'.
        - Write a compelling, personalized, and encouraging 'reasoning' string explaining *why* this is the perfect next mission for ${student.name}.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: adaptiveActionSchema, temperature: 0.9 },
        });
        const action = JSON.parse(response.text.trim()) as AdaptiveAction;
        
        if (action.type.startsWith('ACADEMIC') && (!action.details.subject || !action.details.chapter)) {
            const gradeData = CURRICULUM.find(g => g.level === student.grade);
            if (weakSubject && weakChapter) {
                action.details.subject = weakSubject;
                action.details.chapter = weakChapter;
            } else if (gradeData && gradeData.subjects[0] && gradeData.subjects[0].chapters[0]) {
                action.details.subject = gradeData.subjects[0].name;
                action.details.chapter = gradeData.subjects[0].chapters[0].title;
            }
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
export const getFittoAnswer = async (question: StudentQuestion, language: string): Promise<FittoResponse> => {
    const prompt = `As Fitto, an AI Tutor, answer this student's question about "${question.concept}". Question: "${question.questionText}". Is the question relevant? Then, provide a simple, Socratic explanation in ${language}.`;
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

// --- START: NEW MASTERY ZONE FUNCTIONS ---

const morePracticeProblemsSchema = {
    type: Type.ARRAY,
    items: practiceProblemSchema,
    minItems: 3,
    maxItems: 5
};

export const generateMorePracticeProblems = async (grade: string, subject: string, chapter: string, existingProblems: PracticeProblem[], language: string): Promise<PracticeProblem[]> => {
    const existingProblemStatements = existingProblems.map(p => p.problemStatement).join('\n - ');
    const prompt = `
        You are an expert question setter for competitive exams in India (like Olympiads, NTSE, JEE/NEET foundation).
        Generate 3-5 new, challenging practice problems for a ${grade} student on the chapter "${chapter}" in ${subject}.
        The entire response must be in the ${language} language.

        **CRITICAL INSTRUCTIONS:**
        1.  **DO NOT REPEAT:** The generated questions must be completely different from the following existing problems:
            - ${existingProblemStatements}
        2.  **FOCUS:** Generate a mix of 'Level 2: Reference Application' and 'Level 3: Competitive Challenge' questions.
        3.  **AUTHENTICITY:** The questions should be relevant and of a high standard, suitable for preparing for competitive exams.
        4.  **SOLUTIONS:** Provide clear, step-by-step solutions for each problem.

        Your response must be a JSON array of PracticeProblem objects.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: morePracticeProblemsSchema
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PracticeProblem[];
    } catch (error) {
        throw handleGeminiError(error, 'generate more practice problems');
    }
};


export const getWritingChallengeQuestion = async (grade: string, subject: string, chapter: string, language: string): Promise<string> => {
    const prompt = `
        Create one high-quality, thought-provoking 'Short Answer' or 'Long Answer' type question for a ${grade} student on the chapter "${chapter}" in ${subject}.
        The question should be in the style of a CBSE board exam and require analytical thinking, not just recall.
        The entire response must be in the ${language} language.
        Respond with only the question text as a single string.
    `;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, 'get writing challenge question');
    }
};

const writtenAnswerEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        modelAnswer: { type: Type.STRING, description: "An ideal, well-structured answer as per CBSE guidelines. Use numbered markdown lists for steps/points." },
        markingScheme: { type: Type.STRING, description: "A point-wise breakdown of how marks are awarded. Use bulleted markdown lists." },
        personalizedFeedback: { type: Type.STRING, description: "Constructive, encouraging, and actionable feedback on the student's specific answer." },
        proTips: { type: Type.STRING, description: "Highly specific, exam-oriented tips and tricks for improving answers for this type of question." }
    },
    required: ['modelAnswer', 'markingScheme', 'personalizedFeedback', 'proTips']
};

export const evaluateWrittenAnswer = async (question: string, studentAnswer: string, grade: string, subject: string, language: string): Promise<WrittenAnswerEvaluation> => {
    const prompt = `
        **SYSTEM ROLE:**
        You are a strict but fair and helpful virtual examiner for the Indian CBSE board.
        Your task is to evaluate a ${grade} student's written answer for a question in ${subject}.
        The entire response must be in the ${language} language and adhere to the specified JSON schema.

        **CONTEXT:**
        - **Question:** "${question}"
        - **Student's Answer:** "${studentAnswer}"

        **EVALUATION INSTRUCTIONS (MANDATORY FORMATTING):**
        1.  **modelAnswer:** Create an ideal, comprehensive model answer. If the answer involves steps or points, you MUST format it as a numbered markdown list (e.g., "1. First point...\\n2. Second point...").
        2.  **markingScheme:** Create a detailed, point-wise marking scheme. You MUST format this as a bulleted markdown list (e.g., "- 1 mark for correct formula...\\n- 2 marks for correct substitution and calculation...").
        3.  **personalizedFeedback:** Provide constructive, encouraging, and actionable feedback. Compare the student's answer to the model answer. Start with a positive point if possible. Be specific about what was missed or could be improved.
        4.  **proTips:** Give 2-3 highly specific, actionable tips for improving exam performance on this type of question. For example, "Pro Tip: Always underline the final answer in numerical problems to make it stand out for the examiner." or "Pro Tip: Start long answers with a brief introduction defining the key term."

        Your response must be a single JSON object with clean, well-formatted markdown text in the fields.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: writtenAnswerEvaluationSchema
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as WrittenAnswerEvaluation;
    } catch (error) {
        throw handleGeminiError(error, 'evaluate written answer');
    }
};
// --- END: NEW MASTERY ZONE FUNCTIONS ---

// --- START: NEW GLOBAL PREP ZONE FUNCTIONS ---

export const generateSATPracticeTest = async (language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        Act as an expert SAT test creator specializing in the Digital SAT Math section.
        Generate 10 new and unique multiple-choice SAT Math practice questions.
        The entire response must be in the ${language} language.

        **CRITICAL INSTRUCTIONS:**
        1.  **Authenticity & Diversity:** The questions MUST mirror the style and difficulty of the real Digital SAT. You MUST generate a diverse set of questions covering all four major domains:
            - Algebra (e.g., linear equations, systems of equations)
            - Advanced Math (e.g., quadratic equations, manipulation of polynomials, complex numbers, advanced functions like exponential equations, and function notation)
            - Problem-Solving and Data Analysis (e.g., ratios, percentages, probability, interpreting graphs)
            - Geometry and Trigonometry (e.g., area, volume, circles, triangles, trig functions)
        2.  **Uniqueness:** The questions must be original and not simple variations of common textbook problems.
        3.  **Format:** All questions must be multiple-choice with exactly four options.
        4.  **Explanations:** Provide a detailed, step-by-step explanation for each question, explaining the correct logic.
        5.  **Metadata:** For each question, set 'type' to 'ACADEMIC' and 'conceptTitle' to the relevant SAT math domain (e.g., 'Algebra', 'Advanced Math', 'Data Analysis', 'Geometry').

        Your response must be a JSON array of 10 QuizQuestion objects.
    `;

    const satQuizSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                conceptTitle: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['ACADEMIC', 'IQ', 'EQ'], nullable: true },
                skill: { type: Type.STRING, nullable: true },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'], nullable: true },
            },
            required: ['question', 'options', 'correctAnswer', 'explanation', 'conceptTitle']
        },
        minItems: 10,
        maxItems: 10
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: satQuizSchema,
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
        modelApproach: { type: Type.STRING, description: "An ideal, step-by-step method to solve the problem." },
        personalizedFeedback: { type: Type.STRING, description: "Actionable, encouraging feedback on the student's specific approach, highlighting correct steps and errors." },
        keyConcept: { type: Type.STRING, description: "The primary mathematical concept or skill being tested by the question." },
        proTips: { type: Type.STRING, description: "Specific, actionable tips for tackling similar problems on the SAT." }
    },
    required: ['modelApproach', 'personalizedFeedback', 'keyConcept', 'proTips']
};

export const evaluateSATAnswerApproach = async (question: string, studentApproach: string, language: string): Promise<SATAnswerEvaluation> => {
    const prompt = `
        **SYSTEM ROLE:**
        You are an expert SAT Math tutor. Your goal is to provide encouraging and insightful feedback on a student's problem-solving approach.
        The entire response must be in the ${language} language and adhere to the specified JSON schema.

        **CONTEXT:**
        - **SAT Question:** "${question}"
        - **Student's Written Approach:** "${studentApproach}"

        **EVALUATION INSTRUCTIONS:**
        1.  **modelApproach:** Provide an ideal, clear, step-by-step model solution to the problem.
        2.  **personalizedFeedback:** Analyze the student's approach. Be constructive and encouraging. Point out what they did correctly. If there are errors, gently explain the mistake and how to correct it. If their approach is valid but inefficient, suggest a more direct method.
        3.  **keyConcept:** Identify and name the single most important mathematical concept being tested (e.g., "Solving Systems of Linear Equations", "Quadratic Formula", "Interpreting Scatterplots").
        4.  **proTips:** Give 1-2 highly specific, actionable tips for this type of SAT question. For example, "Pro Tip: For geometry questions, always draw and label a diagram if one isn't provided. It helps visualize the problem." or "Pro Tip: When you see a quadratic, check if it can be factored easily before jumping to the quadratic formula."

        Your response must be a single JSON object.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: satAnswerEvaluationSchema
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SATAnswerEvaluation;
    } catch (error) {
        throw handleGeminiError(error, 'evaluate SAT answer approach');
    }
};

// --- END: NEW GLOBAL PREP ZONE FUNCTIONS ---
