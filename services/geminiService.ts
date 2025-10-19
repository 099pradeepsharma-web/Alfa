

import { GoogleGenAI, Type, Chat } from "@google/genai";
// FIX: Import missing types AptitudeQuestion and AdaptiveStory
import { LearningModule, QuizQuestion, Student, NextStepRecommendation, Concept, StudentQuestion, AIAnalysis, FittoResponse, AdaptiveAction, IQExercise, EQExercise, CurriculumOutlineChapter, Chapter, PracticeProblem, CareerGuidance, WrittenAnswerEvaluation, SATAnswerEvaluation, CognitiveProfile, BoardPaper, ChatMessage, AptitudeQuestion, AdaptiveStory } from '../types';

// --- CLIENT-SIDE ARCHITECTURE RESTORED ---
// This service now calls the Google AI SDK directly from the client.
// This is necessary because the backend proxy is not yet implemented.

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. This is required for the client-side Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- JSON Schemas for Gemini API responses ---

const quizQuestionSchema = {
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
};

const triggerSchema = {
    type: Type.OBJECT,
    properties: {
        triggerType: { type: Type.STRING, enum: ['paradoxicalQuestion', 'realWorldVideo', 'interdisciplinaryConnection'] },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        pushNotification: { type: Type.STRING }
    },
    required: ['triggerType', 'title', 'description', 'pushNotification']
};

const coreConceptLessonSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        videoPrompt: { type: Type.STRING, nullable: true },
        explanation: { type: Type.STRING },
        knowledgeCheck: { type: Type.ARRAY, items: quizQuestionSchema }
    },
    required: ['title', 'explanation', 'knowledgeCheck']
};

const practiceProblemSchema = {
    type: Type.OBJECT,
    properties: {
        level: { type: Type.STRING, enum: ['Level 1: NCERT Basics', 'Level 2: Reference Application', 'Level 3: Competitive Challenge'] },
        problemStatement: { type: Type.STRING },
        solution: { type: Type.STRING }
    },
    required: ['level', 'problemStatement', 'solution']
};

const rewardSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['xp', 'video'] },
        points: { type: Type.NUMBER, nullable: true },
        title: { type: Type.STRING, nullable: true },
        videoPrompt: { type: Type.STRING, nullable: true },
    },
    required: ['type']
};

const practiceArenaSchema = {
    type: Type.OBJECT,
    properties: {
        problems: { type: Type.ARRAY, items: practiceProblemSchema },
        reward: { ...rewardSchema, nullable: true }
    },
    required: ['problems']
};

const storyNodeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: { type: Type.STRING },
        choices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    nextNodeId: { type: Type.STRING },
                    feedback: { type: Type.STRING }
                },
                required: ['text', 'nextNodeId', 'feedback']
            }
        },
        isEnding: { type: Type.BOOLEAN }
    },
    required: ['id', 'text', 'choices', 'isEnding']
};

const practicalApplicationLabSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['simulation', 'virtualLab', 'adaptiveStory', 'interactiveExplainer', 'project'] },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        videoPrompt: { type: Type.STRING, nullable: true },
        variables: {
            type: Type.ARRAY,
            nullable: true,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['name', 'options']
            }
        },
        baseScenarioPrompt: { type: Type.STRING, nullable: true },
        outcomePromptTemplate: { type: Type.STRING, nullable: true },
        id: { type: Type.STRING, nullable: true },
        introduction: { type: Type.STRING, nullable: true },
        startNodeId: { type: Type.STRING, nullable: true },
        nodes: { type: Type.ARRAY, items: storyNodeSchema, nullable: true },
        videoPromptTemplate: { type: Type.STRING, nullable: true },
        labInstructions: { type: Type.STRING, nullable: true }
    },
    required: ['type', 'title', 'description']
};

const learningModuleSchema = {
    type: Type.OBJECT,
    properties: {
        chapterTitle: { type: Type.STRING },
        missionBriefing: { type: Type.ARRAY, items: triggerSchema },
        coreConceptTraining: { type: Type.ARRAY, items: coreConceptLessonSchema },
        practiceArena: practiceArenaSchema,
        practicalApplicationLab: practicalApplicationLabSchema,
        bossFight: { type: Type.ARRAY, items: quizQuestionSchema }
    },
    required: ['chapterTitle', 'missionBriefing', 'coreConceptTraining', 'practiceArena', 'practicalApplicationLab', 'bossFight']
};

// --- Service Function Implementations ---

// FIX: Added optional signal parameter.
const callGeminiWithSchema = async <T>(prompt: string, schema: object, signal?: AbortSignal): Promise<T> => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Error calling Gemini API with schema:", error);
        throw new Error("The AI model failed to generate a valid response. Please try again.");
    }
};

// FIX: Added optional signal parameter.
export const getChapterContent = async (gradeLevel: string, subject: string, chapter: Chapter, studentName: string, language: string, signal?: AbortSignal): Promise<LearningModule> => {
    const prompt = `Generate a comprehensive, engaging learning module for a ${gradeLevel} student named ${studentName}, studying the chapter "${chapter.title}" in the subject "${subject}". The entire response must be in ${language}. The module should be structured according to the provided JSON schema and include a diverse set of learning activities.`;
    return callGeminiWithSchema<LearningModule>(prompt, learningModuleSchema, signal);
};

// FIX: Added optional signal parameter.
export const generateQuiz = async (keyConcepts: (Concept | string)[], language: string, count: number = 5, signal?: AbortSignal): Promise<QuizQuestion[]> => {
    const conceptsString = keyConcepts.map(c => typeof c === 'string' ? c : c.conceptTitle).join(', ');
    const prompt = `Generate a ${count}-question quiz in ${language} for a high school student based on these key concepts: ${conceptsString}. Ensure questions test understanding, not just recall. Adhere to the JSON schema.`;
    return callGeminiWithSchema<QuizQuestion[]>(prompt, { type: Type.ARRAY, items: quizQuestionSchema }, signal);
};

export const generatePracticeExercises = async (concept: Concept, grade: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `Generate 3 diverse practice questions (MCQ format) in ${language} for a ${grade} student on the concept: "${concept.conceptTitle}". The provided explanation is: "${concept.explanation}". Questions should vary in difficulty. Adhere to the JSON schema.`;
    return callGeminiWithSchema<QuizQuestion[]>(prompt, { type: Type.ARRAY, items: quizQuestionSchema });
};

export const generateNextStepRecommendation = async (grade: string, subject: string, chapter: string, score: number, totalQuestions: number, subjectChapters: {title: string}[], language: string): Promise<NextStepRecommendation> => {
    const prompt = `A student in ${grade} scored ${score}/${totalQuestions} on a quiz for the chapter "${chapter}" in ${subject}. The chapters in this subject are: ${subjectChapters.map(c => c.title).join(', ')}. Provide a personalized next step recommendation in ${language}. The recommendation should be encouraging and actionable. Based on the score, decide the action: 'CONTINUE' for high scores (>80%), 'REVIEW' for medium scores (40-80%), or 'REVISE_PREREQUISITE' for low scores (<40%). If revising, suggest a relevant prerequisite chapter from the list. If continuing, suggest the next logical chapter. Adhere to the JSON schema.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            recommendationText: { type: Type.STRING },
            nextChapterTitle: { type: Type.STRING, nullable: true },
            action: { type: Type.STRING, enum: ['REVIEW', 'CONTINUE', 'REVISE_PREREQUISITE', 'START_CRITICAL_THINKING', 'START_WELLBEING'] },
            prerequisiteChapterTitle: { type: Type.STRING, nullable: true }
        },
        required: ['recommendationText', 'action']
    };
    return callGeminiWithSchema<NextStepRecommendation>(prompt, schema);
};

export const getFittoAnswer = async (question: StudentQuestion, student: Student, language: string): Promise<FittoResponse> => {
    const prompt = `A ${student.grade} student asked: "${question.questionText}" in the context of chapter "${question.chapter}", concept "${question.concept}". Act as Fitto, a friendly AI tutor. First, determine if the question is relevant to the concept. If not, gently guide them back. If it is relevant, provide a clear, encouraging, and easy-to-understand explanation in ${language}. Keep it concise.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            isRelevant: { type: Type.BOOLEAN },
            responseText: { type: Type.STRING }
        },
        required: ['isRelevant', 'responseText']
    };
    return callGeminiWithSchema<FittoResponse>(prompt, schema);
};

export const createTutorChat = (grade: string, subject: string, chapter: string, concepts: Concept[], student: Student, language: string): Chat => {
    const conceptTitles = concepts.map(c => c.conceptTitle).join(', ');
    const systemInstruction = `You are Fitto, a friendly and expert AI tutor for a ${grade} student named ${student.name}. Your current session is focused on the chapter "${chapter}" in ${subject}, specifically the concepts: ${conceptTitles}. Your goal is to provide clear, step-by-step explanations and encouragement. All your responses must be in ${language}. Start the conversation with a warm welcome and suggest a starting point.`;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
    });
};

export const createGeneralChatbot = (student: Student, language: string): Chat => {
    const systemInstruction = `You are Fitto, a friendly and helpful AI Doubt Solver for ${student.name}, a ${student.grade} student. Your purpose is to answer any conceptual question from their curriculum. Keep your answers clear, concise, and encouraging. All responses must be in ${language}. Start with a fun, engaging welcome message.`;
    
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
    });
};

export const createCareerCounselorChat = (student: Student, language: string): Chat => {
    const systemInstruction = `You are a warm, knowledgeable, and encouraging AI Career Counselor for ${student.name}, a ${student.grade} student in India. Your goal is to help them explore career options, understand different streams (Science, Commerce, Arts), and think about their future. Use their grade level to tailor your advice. All responses must be in ${language}. Start with a welcoming message inviting them to ask anything about their future path.`;
    
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
    });
};

// FIX: Add missing functions 'generateCurriculumOutline' and 'validateCurriculumOutline'.
export const generateCurriculumOutline = async (grade: string, subject: string, language: string): Promise<CurriculumOutlineChapter[]> => {
    const prompt = `Generate a standard CBSE curriculum outline of chapter titles and learning objectives for a ${grade} ${subject} class, in ${language}.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                chapterTitle: { type: Type.STRING },
                learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['chapterTitle', 'learningObjectives']
        }
    };
    return callGeminiWithSchema<CurriculumOutlineChapter[]>(prompt, schema);
};

export const validateCurriculumOutline = async (outline: CurriculumOutlineChapter[], grade: string, subject: string, language: string): Promise<string> => {
    const prompt = `Review the following curriculum outline for ${grade} ${subject}: ${JSON.stringify(outline)}. In ${language}, provide a brief quality assurance report. Check for logical flow, age-appropriateness, and coverage of key areas according to the CBSE syllabus. Format the report with "HEADING:" for titles.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
};

// --- Re-implementing other services that were broken ---

// FIX: Added optional signal parameter.
export const generateComprehensiveDiagnosticTest = async (grade: string, subject: string, chapter: string, language: string, signal?: AbortSignal): Promise<QuizQuestion[]> => {
    const prompt = `Generate a 10-question comprehensive diagnostic test for a ${grade} student starting the chapter "${chapter}" in ${subject}. The test must be in ${language}. Include 6 academic questions related to prerequisite concepts, 2 IQ/logical reasoning questions, and 2 EQ/self-awareness questions. Label each question's type ('ACADEMIC', 'IQ', 'EQ') in the JSON. Adhere to the provided schema.`;
    return callGeminiWithSchema<QuizQuestion[]>(prompt, { type: Type.ARRAY, items: quizQuestionSchema }, signal);
};

export const generateComprehensiveDiagnosticRecommendation = async (grade: string, subject: string, chapter: string, scores: { academic: number; iq: number; eq: number; }, language: string, subjectChapters: { title: string }[]): Promise<NextStepRecommendation> => {
    const prompt = `A ${grade} student completed a diagnostic test for the chapter "${chapter}" in ${subject} with scores: Academic=${scores.academic}%, IQ=${scores.iq}%, EQ=${scores.eq}%. The chapters are: ${subjectChapters.map(c => c.title).join(', ')}. In ${language}, provide a personalized recommendation. If academic score is low (<60), suggest revising a prerequisite ('REVISE_PREREQUISITE'). If IQ is low, suggest a 'START_CRITICAL_THINKING' exercise. If EQ is low, suggest a 'START_WELLBEING' module. Otherwise, suggest 'CONTINUE' to the next chapter. The text should be encouraging.`;
    const schema = {
        type: Type.OBJECT, properties: {
            recommendationText: { type: Type.STRING },
            nextChapterTitle: { type: Type.STRING, nullable: true },
            action: { type: Type.STRING, enum: ['REVIEW', 'CONTINUE', 'REVISE_PREREQUISITE', 'START_CRITICAL_THINKING', 'START_WELLBEING'] },
            prerequisiteChapterTitle: { type: Type.STRING, nullable: true }
        }, required: ['recommendationText', 'action']
    };
    return callGeminiWithSchema<NextStepRecommendation>(prompt, schema);
};

export const generateVideoFromPrompt = async (prompt: string): Promise<Blob> => {
    // This is a placeholder as client-side video generation is not directly supported by the SDK.
    // In a real client-side app, this would call a backend service.
    // For now, we simulate a failure to prevent the app from hanging.
    console.error("Client-side video generation is not supported. This function requires a backend proxy.");
    throw new Error("Video generation is a server-side feature and is currently unavailable.");
};

// Add other missing/broken functions here, re-implementing them with direct SDK calls.
// The pattern is: create a prompt, define a schema, call `callGeminiWithSchema`.

// The functions below were also broken by the proxy change and need to be restored.
// FIX: Added optional signal parameter.
export const getAdaptiveNextStep = async (student: Student, language: string, signal?: AbortSignal): Promise<AdaptiveAction> => {
    const prompt = `Analyze student ${student.name}'s performance data: ${JSON.stringify(student.performance)}. Recommend the next adaptive action in ${language} (ACADEMIC_REVIEW, ACADEMIC_PRACTICE, ACADEMIC_NEW, IQ_EXERCISE, or EQ_EXERCISE) with a clear reasoning.`;
    const schema = { type: Type.OBJECT, properties: { type: {type: Type.STRING}, details: { type: Type.OBJECT, properties: { subject: {type: Type.STRING, nullable: true}, chapter: {type: Type.STRING, nullable: true}, concept: {type: Type.STRING, nullable: true}, skill: {type: Type.STRING, nullable: true}, reasoning: {type: Type.STRING}, confidence: {type: Type.NUMBER, nullable: true} }, required: ['reasoning']} }, required: ['type', 'details'] };
    return callGeminiWithSchema<AdaptiveAction>(prompt, schema, signal);
}
// FIX: Added optional signal parameter.
export const generateIQExercises = async (grade: string, language: string, count: number = 5, signal?: AbortSignal): Promise<IQExercise[]> => {
    const prompt = `Generate ${count} IQ exercise questions in ${language} for a ${grade} student.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: {type: Type.STRING}, options: {type: Type.ARRAY, items: {type: Type.STRING}}, correctAnswer: {type: Type.STRING}, explanation: {type: Type.STRING}, skill: {type: Type.STRING} }, required: ['question', 'options', 'correctAnswer', 'explanation', 'skill'] }};
    return callGeminiWithSchema<IQExercise[]>(prompt, schema, signal);
}
// FIX: Added optional signal parameter.
export const generateEQExercises = async (grade: string, language: string, count: number = 5, signal?: AbortSignal): Promise<EQExercise[]> => {
    const prompt = `Generate ${count} EQ exercise questions (scenarios) in ${language} for a ${grade} student.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scenario: {type: Type.STRING}, question: {type: Type.STRING}, options: {type: Type.ARRAY, items: {type: Type.STRING}}, bestResponse: {type: Type.STRING}, explanation: {type: Type.STRING}, skill: {type: Type.STRING} }, required: ['scenario', 'question', 'options', 'bestResponse', 'explanation', 'skill'] }};
    return callGeminiWithSchema<EQExercise[]>(prompt, schema, signal);
}
export const generateTeacherReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `Generate a concise teacher's report in ${language} for student ${student.name} based on their performance data: ${JSON.stringify(student.performance)}.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
}
export const generateParentReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `Generate a simple, encouraging parent's report in ${language} for student ${student.name} based on performance: ${JSON.stringify(student.performance)}.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
}
export const analyzeStudentQuestionForTeacher = async (question: StudentQuestion, language: string): Promise<AIAnalysis> => {
    const prompt = `For a teacher, analyze this student question: "${question.questionText}". Provide a model answer and pedagogical notes in ${language}.`;
    const schema = { type: Type.OBJECT, properties: { modelAnswer: {type: Type.STRING}, pedagogicalNotes: {type: Type.STRING} }, required: ['modelAnswer', 'pedagogicalNotes'] };
    return callGeminiWithSchema<AIAnalysis>(prompt, schema);
}
export const generateAptitudeTest = async (grade: string, language: string): Promise<AptitudeQuestion[]> => {
    const prompt = `Generate a 10-question aptitude test in ${language} for a ${grade} student.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: {type: Type.STRING}, options: {type: Type.ARRAY, items: {type: Type.STRING}}, correctAnswer: {type: Type.STRING}, trait: {type: Type.STRING}, explanation: {type: Type.STRING} }, required: ['question', 'options', 'correctAnswer', 'trait', 'explanation'] }};
    return callGeminiWithSchema<AptitudeQuestion[]>(prompt, schema);
}
export const generateAptitudeTestSummary = async (results: any, language: string): Promise<string> => {
    const prompt = `Summarize these aptitude test results in an encouraging way in ${language}: ${JSON.stringify(results)}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
}
export const generateStreamGuidance = async (student: Student, aptitudeResults: any, language: string): Promise<CareerGuidance> => {
    const prompt = `Provide career stream guidance (Science, Commerce, Arts) in ${language} for ${student.name} based on these aptitude results: ${JSON.stringify(aptitudeResults)}.`;
    const schema = { type: Type.OBJECT, properties: { introduction: {type: Type.STRING}, streamRecommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { streamName: {type: Type.STRING}, recommendationReason: {type: Type.STRING}, suggestedCareers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { careerName: {type: Type.STRING}, description: {type: Type.STRING}, requiredSubjects: {type: Type.ARRAY, items: {type: Type.STRING}} } } } } } }, conclusion: {type: Type.STRING} }, required: ['introduction', 'streamRecommendations', 'conclusion'] };
    return callGeminiWithSchema<CareerGuidance>(prompt, schema);
};
export const generateAdaptiveStory = async (topic: string, grade: string, language: string): Promise<AdaptiveStory> => {
    const prompt = `Create a short, branching adaptive story in ${language} for a ${grade} student on the topic: "${topic}". It should have a start, at least 3 choice nodes, and 2 possible endings.`;
    const schema = { type: Type.OBJECT, properties: { id: {type: Type.STRING}, title: {type: Type.STRING}, description: {type: Type.STRING}, introduction: {type: Type.STRING}, startNodeId: {type: Type.STRING}, nodes: {type: Type.ARRAY, items: storyNodeSchema} }, required: ['id', 'title', 'introduction', 'startNodeId', 'nodes'] };
    return callGeminiWithSchema<AdaptiveStory>(prompt, schema);
}
export const generateEducationalTips = async (topic: string, language: string): Promise<string[]> => {
    const prompt = `Generate 5 short, interesting, educational tips or facts in ${language} related to the topic: "${topic}". Return as a JSON array of strings.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: {type: Type.ARRAY, items: {type: Type.STRING}} } });
    return JSON.parse(response.text);
}
export const generateStudyGoalSuggestions = async (student: Student, language: string): Promise<string[]> => {
    const prompt = `Based on this student's performance: ${JSON.stringify(student.performance)}, suggest 3 specific, actionable study goals in ${language}. Return as a JSON array of strings.`;
     const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: {type: Type.ARRAY, items: {type: Type.STRING}} } });
    return JSON.parse(response.text);
}
export const evaluateWrittenAnswer = async (question: string, studentAnswer: string, grade: string, subject: string, language: string): Promise<WrittenAnswerEvaluation> => {
    const prompt = `Evaluate a student's answer for a ${grade} ${subject} question in ${language}. Question: "${question}". Answer: "${studentAnswer}". Provide a model answer, a CBSE-style marking scheme, personalized feedback, and pro tips.`;
    const schema = { type: Type.OBJECT, properties: { modelAnswer: {type: Type.STRING}, markingScheme: {type: Type.STRING}, personalizedFeedback: {type: Type.STRING}, proTips: {type: Type.STRING} }, required: ['modelAnswer', 'markingScheme', 'personalizedFeedback', 'proTips'] };
    return callGeminiWithSchema<WrittenAnswerEvaluation>(prompt, schema);
}
export const generateSATPracticeTest = async (language: string): Promise<QuizQuestion[]> => {
    const prompt = `Generate 5 SAT-style math practice questions in ${language}. The questions should be multiple choice and cover topics like algebra and data analysis. Adhere to the quiz question JSON schema.`;
    return callGeminiWithSchema<QuizQuestion[]>(prompt, { type: Type.ARRAY, items: quizQuestionSchema });
}
export const evaluateSATAnswerApproach = async (question: string, studentApproach: string, language: string): Promise<SATAnswerEvaluation> => {
    const prompt = `A student is solving this SAT math question: "${question}". Their described approach is: "${studentApproach}". In ${language}, provide a model approach, personalized feedback on their method, identify the key concept, and give pro tips for the SAT.`;
    const schema = { type: Type.OBJECT, properties: { modelApproach: {type: Type.STRING}, personalizedFeedback: {type: Type.STRING}, keyConcept: {type: Type.STRING}, proTips: {type: Type.STRING} }, required: ['modelApproach', 'personalizedFeedback', 'keyConcept', 'proTips'] };
    return callGeminiWithSchema<SATAnswerEvaluation>(prompt, schema);
}
export const generateChapterInsights = async (chapterContent: string, task: 'summarize' | 'glossary' | 'questions' | 'custom', customPrompt: string | null, language: string): Promise<string> => {
    let prompt = `Analyze the following chapter content in ${language}:\n\n${chapterContent}\n\n`;
    if (task === 'custom') {
        prompt += `Now, answer this question: "${customPrompt}"`;
    } else if (task === 'summarize') {
        prompt += "Provide a concise summary of the key points.";
    } else if (task === 'glossary') {
        prompt += "Create a glossary of the most important terms and their definitions.";
    } else {
        prompt += "Generate 5 practice questions based on this content.";
    }
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text;
}
// FIX: Added optional signal parameter.
export const analyzeCognitiveProfile = async (student: Student, language: string, signal?: AbortSignal): Promise<CognitiveProfile> => {
    const prompt = `Analyze the performance data for student ${student.name} (${JSON.stringify(student.performance)}) and generate a cognitive profile in ${language}. Estimate their attention span, confidence, and resilience (0-100) with a brief analysis. Determine their primary learning style and analyze it. Identify the top 3 concepts with the lowest retention strength for the memory matrix.`;
    const schema = { type: Type.OBJECT, properties: { cognitiveTraits: { type: Type.OBJECT, properties: { attentionSpan: {type: Type.OBJECT, properties: {value: {type: Type.NUMBER}, analysis: {type: Type.STRING}}}, confidence: {type: Type.OBJECT, properties: {value: {type: Type.NUMBER}, analysis: {type: Type.STRING}}}, resilience: {type: Type.OBJECT, properties: {value: {type: Type.NUMBER}, analysis: {type: Type.STRING}}} } }, learningStyle: { type: Type.OBJECT, properties: { style: {type: Type.STRING}, analysis: {type: Type.STRING}} }, memoryMatrix: { type: Type.ARRAY, items: {type: Type.OBJECT, properties: { concept: {type: Type.STRING}, subject: {type: Type.STRING}, retentionStrength: {type: Type.NUMBER}, lastRevised: {type: Type.STRING}}} } } };
    return callGeminiWithSchema<CognitiveProfile>(prompt, schema, signal);
}
export const generateBoardPaper = async (year: number, grade: string, subject: string, language: string): Promise<BoardPaper> => {
    const prompt = `Generate a full, realistic CBSE board exam paper for ${grade} ${subject} from the year ${year} in ${language}. It must include all sections (A, B, C, D, E) with the correct number and type of questions, marks, and detailed solutions for each.`;
    const schema = { type: Type.OBJECT, properties: { year: {type: Type.NUMBER}, grade: {type: Type.STRING}, subject: {type: Type.STRING}, paperTitle: {type: Type.STRING}, totalMarks: {type: Type.NUMBER}, timeAllowed: {type: Type.NUMBER}, sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, description: {type: Type.STRING}, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { q_no: {type: Type.STRING}, text: {type: Type.STRING}, marks: {type: Type.NUMBER}, type: {type: Type.STRING}, options: {type: Type.ARRAY, items: {type: Type.STRING}, nullable: true}, solution: {type: Type.STRING}, diagramSvg: {type: Type.STRING, nullable: true} } } } } } } } };
    return callGeminiWithSchema<BoardPaper>(prompt, schema);
}
export const generateMorePracticeProblems = async (grade: string, subject: string, chapter: string, existingProblems: PracticeProblem[], language: string): Promise<PracticeProblem[]> => {
    const prompt = `Generate 3 new and distinct practice problems in ${language} for a ${grade} student in ${subject} chapter "${chapter}". Avoid repeating these existing problems: ${JSON.stringify(existingProblems)}.`;
    return callGeminiWithSchema<PracticeProblem[]>(prompt, { type: Type.ARRAY, items: practiceProblemSchema });
}

export const generateMathExplanation = async (question: string, student: Student, language: string): Promise<string> => {
    const prompt = `Act as a friendly math mentor. A ${student.grade} student is stuck on this problem: "${question}". Provide a clear, step-by-step explanation in ${language}, as if writing on a whiteboard. Use markdown for formatting.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-pro", contents: prompt });
    return response.text;
}