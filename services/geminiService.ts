import { GoogleGenAI, Type, Chat } from "@google/genai";
import { LearningModule, QuizQuestion, Student, NextStepRecommendation, Concept, StudentQuestion, AIAnalysis, FittoResponse, AdaptiveAction, IQExercise, EQExercise, CurriculumOutlineChapter, AdaptiveStory, InteractiveExplainer, PrintableResource, CulturalContext, MoralScienceCorner, AptitudeQuestion, CareerGuidance, QuestionBankItem, CategorizedProblems, Chapter } from '../types';
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


// --- Schemas for Learning Module ---

const conceptSchema = {
    type: Type.OBJECT,
    properties: {
        conceptTitle: { type: Type.STRING },
        explanation: { type: Type.STRING },
        realWorldExample: { type: Type.STRING },
        diagramDescription: { type: Type.STRING },
    },
    required: ['conceptTitle', 'explanation', 'realWorldExample', 'diagramDescription']
};

const theoremSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        proof: { type: Type.STRING }
    },
    required: ['name', 'proof']
};

const formulaDerivationSchema = {
    type: Type.OBJECT,
    properties: {
        formula: { type: Type.STRING },
        derivation: { type: Type.STRING }
    },
    required: ['formula', 'derivation']
};

const solvedNumericalProblemSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        solution: { type: Type.STRING }
    },
    required: ['question', 'solution']
};

const keyLawOrPrincipleSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        explanation: { type: Type.STRING }
    },
    required: ['name', 'explanation']
};

const hotQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        hint: { type: Type.STRING }
    },
    required: ['question', 'hint']
};

const formulaSchema = {
    type: Type.OBJECT,
    properties: {
        formula: { type: Type.STRING },
        description: { type: Type.STRING }
    },
    required: ['formula', 'description']
};

const problemSolvingTemplateSchema = {
    type: Type.OBJECT,
    properties: {
        problemType: { type: Type.STRING },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['problemType', 'steps']
};

const questionBankItemSchema = {
    type: Type.OBJECT,
    properties: {
        questionText: { type: Type.STRING },
        questionType: { type: Type.STRING, enum: ['MCQ', 'Short Answer', 'Long Answer'] },
        difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
        bloomTaxonomy: { type: Type.STRING, enum: ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'] },
        isCompetencyBased: { type: Type.BOOLEAN },
        isPreviousYearQuestion: { type: Type.BOOLEAN },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        correctAnswer: { type: Type.STRING, nullable: true },
        explanation: { type: Type.STRING, nullable: true },
        markingScheme: { type: Type.STRING, nullable: true },
        modelAnswer: { type: Type.STRING, nullable: true },
        answerWritingGuidance: { type: Type.STRING, nullable: true, description: "Crucial for Short/Long answers. Provides CBSE-aligned tips on structuring the answer, keywords, and common mistakes." },
    },
    required: ['questionText', 'questionType', 'difficulty', 'bloomTaxonomy', 'isCompetencyBased', 'isPreviousYearQuestion']
};

const categorizedProblemsSchema = {
    type: Type.OBJECT,
    properties: {
        conceptual: { type: Type.ARRAY, items: questionBankItemSchema },
        application: { type: Type.ARRAY, items: questionBankItemSchema },
        higherOrderThinking: { type: Type.ARRAY, items: questionBankItemSchema }
    },
    required: ['conceptual', 'application', 'higherOrderThinking']
};

const commonMistakeSchema = {
    type: Type.OBJECT,
    properties: {
        mistake: { type: Type.STRING },
        correction: { type: Type.STRING }
    },
    required: ['mistake', 'correction']
};

const experimentSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        materials: { type: Type.ARRAY, items: { type: Type.STRING } },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyGuidelines: { type: Type.STRING }
    },
    required: ['title', 'description', 'materials', 'steps', 'safetyGuidelines']
};

const timelineEventSchema = {
    type: Type.OBJECT,
    properties: {
        year: { type: Type.STRING },
        event: { type: Type.STRING },
        significance: { type: Type.STRING }
    },
    required: ['year', 'event', 'significance']
};

const keyFigureSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        contribution: { type: Type.STRING }
    },
    required: ['name', 'contribution']
};

const primarySourceSnippetSchema = {
    type: Type.OBJECT,
    properties: {
        sourceTitle: { type: Type.STRING },
        snippet: { type: Type.STRING },
        analysis: { type: Type.STRING }
    },
    required: ['sourceTitle', 'snippet', 'analysis']
};

const caseStudySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        background: { type: Type.STRING },
        analysis: { type: Type.STRING },
        conclusion: { type: Type.STRING }
    },
    required: ['title', 'background', 'analysis', 'conclusion']
};

const grammarRuleSchema = {
    type: Type.OBJECT,
    properties: {
        ruleName: { type: Type.STRING },
        explanation: { type: Type.STRING },
        examples: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['ruleName', 'explanation', 'examples']
};

const literaryDeviceSchema = {
    type: Type.OBJECT,
    properties: {
        deviceName: { type: Type.STRING },
        explanation: { type: Type.STRING },
        example: { type: Type.STRING }
    },
    required: ['deviceName', 'explanation', 'example']
};

const vocabularyDeepDiveSchema = {
    type: Type.OBJECT,
    properties: {
        term: { type: Type.STRING },
        definition: { type: Type.STRING },
        usageInSentence: { type: Type.STRING },
        etymology: { type: Type.STRING, nullable: true }
    },
    required: ['term', 'definition', 'usageInSentence']
};

const interactiveVideoSimulationSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING, description: "Explains what the simulation will show and why it's useful." },
        videoPrompt: { type: Type.STRING, description: "The detailed prompt for the VEO model." },
    },
    required: ['title', 'description', 'videoPrompt']
};

const interactiveVariableSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['name', 'options']
};

const virtualLabSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        baseScenarioPrompt: { type: Type.STRING },
        variables: { type: Type.ARRAY, items: interactiveVariableSchema },
        outcomePromptTemplate: { type: Type.STRING }
    },
    required: ['title', 'description', 'baseScenarioPrompt', 'variables', 'outcomePromptTemplate']
};

const interactiveExplainerSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        variables: { type: Type.ARRAY, items: interactiveVariableSchema },
        videoPromptTemplate: { type: Type.STRING, description: "A template for the VEO prompt. Must use placeholders matching variable names, e.g., 'An animated video explaining {{variable_name}}.'" },
    },
    required: ['title', 'description', 'variables', 'videoPromptTemplate'],
    nullable: true,
};

// --- New Schemas for Adaptive Story ---
const storyNodeChoiceSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING },
        nextNodeId: { type: Type.STRING },
        feedback: { type: Type.STRING, description: "Feedback to the student for making this choice." }
    },
    required: ['text', 'nextNodeId', 'feedback']
};

const storyNodeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: { type: Type.STRING },
        choices: { type: Type.ARRAY, items: storyNodeChoiceSchema },
        isEnding: { type: Type.BOOLEAN, description: "Is this a concluding node?" }
    },
    required: ['id', 'text', 'choices', 'isEnding']
};

const adaptiveStorySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        introduction: { type: Type.STRING },
        startNodeId: { type: Type.STRING },
        nodes: { type: Type.ARRAY, items: storyNodeSchema }
    },
    required: ['title', 'introduction', 'startNodeId', 'nodes'],
    nullable: true
};

const culturalContextSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING }
    },
    required: ['title', 'content'],
};

const moralScienceCornerSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        story: { type: Type.STRING },
        moral: { type: Type.STRING }
    },
    required: ['title', 'story', 'moral'],
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

const aiAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        modelAnswer: { type: Type.STRING, description: "A well-explained, grade-appropriate model answer for the student." },
        pedagogicalNotes: { type: Type.STRING, description: "Private, actionable advice for the teacher on how to explain the concept, including common misconceptions and key points to emphasize in line with CBSE standards." },
    },
    required: ['modelAnswer', 'pedagogicalNotes'],
};

const fittoResponseSchema = {
    type: Type.OBJECT,
    properties: {
        isRelevant: { type: Type.BOOLEAN, description: "A boolean flag indicating if the question is relevant to the academic concept and grade level." },
        responseText: { type: Type.STRING, description: "The answer to the student's question, or a polite redirection if the question is not relevant." },
    },
    required: ['isRelevant', 'responseText'],
};

const iqExerciseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            skill: { type: Type.STRING, enum: ['Pattern Recognition', 'Logic Puzzle', 'Spatial Reasoning', 'Analogical Reasoning'] }
        },
        required: ['question', 'options', 'correctAnswer', 'explanation', 'skill']
    }
};

const eqExerciseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            scenario: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            bestResponse: { type: Type.STRING },
            explanation: { type: Type.STRING },
            skill: { type: Type.STRING, enum: ['Empathy', 'Self-awareness', 'Resilience', 'Social Skills'] }
        },
        required: ['scenario', 'question', 'options', 'bestResponse', 'explanation', 'skill']
    }
};

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
                confidence: { type: Type.NUMBER, description: 'A confidence score from 0.0 to 1.0 for the recommendation.' }
            },
            required: ['reasoning', 'confidence']
        }
    },
    required: ['type', 'details']
};


const curriculumOutlineChapterSchema = {
    type: Type.OBJECT,
    properties: {
        chapterTitle: { type: Type.STRING },
        learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['chapterTitle', 'learningObjectives'],
};

const curriculumOutlineSchema = {
    type: Type.ARRAY,
    items: curriculumOutlineChapterSchema,
};


export const getChapterContent = async (gradeLevel: string, subject: string, chapter: Chapter, studentName: string, language: string): Promise<LearningModule> => {
    
    let competitiveExamFocus = '';
    if (chapter.tags && chapter.tags.length > 0) {
        competitiveExamFocus = `
        **COMPETITIVE EXAM FOCUS (MANDATORY):**
        This chapter is critically important for competitive exams like **${chapter.tags.join(', ')}**. Therefore, the generated content, especially within 'keyConcepts', must reflect this with higher depth and rigor.
        - **Depth & Nuance:** Explanations must go beyond standard textbook definitions. They MUST include 'inter-concept linkages', 'common student misconceptions', 'exam-level shortcuts or techniques', and 'nuanced edge cases'.
        - **Problem-Solving Integration:** Directly integrate problem-solving techniques and shortcuts relevant to these exams into the concept explanations. For example, when explaining a Physics concept, demonstrate its application in a typical JEE/NEET-style numerical problem.
        - **Terminology & Rigor:** Use precise, competitive-exam level terminology. The overall tone must be authoritative and geared towards enabling top performance.
        - **Examples:** All examples provided MUST be non-trivial and reflect the complexity and multi-concept nature of questions found in these competitive exams.
        `;
    }

    const prompt = `
        **SYSTEM ROLE:**
        You are a 'Chief Subject Matter Expert' for a top-tier Indian competitive exam coaching institute (e.g., FIITJEE, Aakash). Your expertise lies in distilling complex CBSE topics into highly detailed, insightful content tailored for students aiming for top ranks in JEE, NEET, and UPSC foundation. Your entire response must be in the ${language} language.

        **CONTENT MISSION:**
        Create an exhaustive and deeply analytical learning module for a ${gradeLevel} student named ${studentName} on the chapter "${chapter.title}" in ${subject}. The content must be deeply insightful, not merely introductory.
        ${competitiveExamFocus}

        **QUALITY STANDARDS (MANDATORY):**
        1.  **Pedagogical Excellence & CBSE Alignment:** Align with the latest CBSE syllabus (2024-25) and NCERT textbooks, but elevate the content for competitive exams.
        2.  **Accuracy:** All information must be factually correct and precise.
        3.  **Clarity and Structure:** All theoretical text (introductions, explanations, summaries, etc.) MUST be structured for maximum readability. Use markdown-style bullet points (e.g., "- Point 1\\n- Point 2") for lists and double newlines ("\\n\\n") to separate paragraphs. The explanations MUST be extremely comprehensive and detailed, providing in-depth knowledge suitable for a primary learning resource. Do not provide brief summaries; aim for substantial paragraphs.
        4.  **Cultural Sensitivity:** Use Indian contexts and examples where appropriate.
        5.  **Emphasis**: Do not use markdown for bolding (e.g., **text**). To emphasize a key term, enclose it in single quotes.

        **CONTENT GENERATION GUIDE (Generate ONLY these core sections):**
        -   **chapterTitle**: Must be "${chapter.title}".
        -   **introduction**: Start with a hook. Structure the content into short, digestible points or paragraphs using markdown-style lists ('- ') where appropriate. Provide a deep, insightful introduction.
        -   **learningObjectives**: List the specific, measurable learning outcomes based on the CBSE syllabus, expanded for competitive depth.
        -   **prerequisitesCheck**: A list of concepts the student must have mastered before starting this chapter.
        -   **keyConcepts**: This is the most critical part. For each concept, provide:
            -   \`conceptTitle\`: A clear title.
            -   \`explanation\`: A step-by-step, deeply analytical breakdown. This must be very detailed and go beyond simple definitions.
            -   \`realWorldExample\`: A complex, relatable application that mirrors competitive exam problem-solving, preferably in an Indian context.
            -   \`diagramDescription\`: A detailed description for a visual aid.
        -   **formulaSheet**: For subjects like Mathematics, Physics, or Chemistry, generate a concise list of all relevant formulas. Each formula should have a brief, clear description of its variables and use case. If the chapter has no formulas, this field can be null.
        -   **summary**: A concise summary of the key takeaways. MUST be formatted as a list of bullet points using markdown ('- ').
        -   **conceptMap**: For complex chapters, generate a Mermaid.js graph definition (using 'graph TD' for Top-Down). This graph should visually connect the key concepts. Labels must be concise and in the ${language} language. The entire output for this field must be ONLY the Mermaid code string (e.g., "graph TD; A[Start] --> B(Process);"). For simple chapters or when a visual map is not relevant, this field must be null.
        -   **interactiveVideoSimulation**: You MUST generate this section for every chapter. For one key concept that is highly visual or hard to explain with text, generate an engaging video simulation section. The \`videoPrompt\` must be a detailed, rich prompt for a model like Google VEO to create a short, engaging, visually-rich animated video (around 30-60 seconds) that explains this key concept from the chapter.
        -   **virtualLab**: For Science or Math chapters with a hands-on experiment (e.g., Physics, Chemistry), generate a virtual lab. The variables should allow students to explore cause-and-effect. If not applicable, this field MUST be null.
        -   **adaptiveStory**: For History, Social Studies, or chapters with ethical/decision-making components (like in Political Science or Biology), generate a short, branching narrative. The story should place the student in a scenario related to the chapter and let them make choices. If not applicable, this field MUST be null.
        -   **culturalContext**: Where relevant (especially for Science, Social Studies, History, and languages), generate a section that connects the chapter's concepts to Indian culture, festivals, historical events, or daily life. For example, connect 'Light and Reflection' in Physics to Diwali, or 'Geometry' to Rangoli patterns. If no strong connection exists, this field MUST be null.
        -   **moralScienceCorner**: Where appropriate, generate a short, simple story with a clear moral that relates to the chapter's core theme (e.g., perseverance for a tough math chapter, curiosity for a science chapter, honesty for a history chapter). The story should be engaging for the student's grade level. If a story is not relevant, this field MUST be null.
        -   **interactiveExplainer**: For a different key concept that involves cause-and-effect relationships or changing variables, generate an interactive explainer. The \`videoPromptTemplate\` MUST use placeholders that match the 'name' of your variables, e.g., 'An animated video explaining {{variable_name}}'. If no concept is suitable for this, this field MUST be null.


        **DO NOT GENERATE THE FOLLOWING SECTIONS IN THIS REQUEST:**
        - Do not generate \`categorizedProblems\`, \`experiments\`, \`commonMistakes\`, or any other deep pedagogical sections. These will be generated on-demand later.

        **FINAL INSTRUCTION:**
        Your entire output MUST be a JSON object that strictly follows the 'LearningModule' schema, but only containing the core fields listed above. Ensure all text fields are complete. No markdown headers (like ##), just paragraphs and bullet points.
    `;

    const initialLearningModuleSchema = {
        type: Type.OBJECT,
        properties: {
            chapterTitle: { type: Type.STRING },
            introduction: { type: Type.STRING },
            learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            prerequisitesCheck: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            keyConcepts: { type: Type.ARRAY, items: conceptSchema },
            summary: { type: Type.STRING },
            conceptMap: { type: Type.STRING, nullable: true },
            interactiveVideoSimulation: { ...interactiveVideoSimulationSchema },
            virtualLab: { ...virtualLabSchema, nullable: true },
            adaptiveStory: { ...adaptiveStorySchema, nullable: true },
            interactiveExplainer: { ...interactiveExplainerSchema, nullable: true },
            culturalContext: { ...culturalContextSchema, nullable: true },
            moralScienceCorner: { ...moralScienceCornerSchema, nullable: true },
            formulaSheet: { type: Type.ARRAY, items: formulaSchema, nullable: true },
        },
        required: ['chapterTitle', 'introduction', 'learningObjectives', 'keyConcepts', 'summary', 'interactiveVideoSimulation']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: initialLearningModuleSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as LearningModule;
    } catch (error) {
        throw handleGeminiError(error, 'generate learning content');
    }
};

const sectionSchemaMap: { [key: string]: any } = {
    keyTheoremsAndProofs: { type: Type.ARRAY, items: theoremSchema },
    formulaDerivations: { type: Type.ARRAY, items: formulaDerivationSchema },
    formulaSheet: { type: Type.ARRAY, items: formulaSchema },
    problemSolvingTemplates: { type: Type.ARRAY, items: problemSolvingTemplateSchema },
    categorizedProblems: categorizedProblemsSchema,
    commonMistakes: { type: Type.ARRAY, items: commonMistakeSchema },
    keyLawsAndPrinciples: { type: Type.ARRAY, items: keyLawOrPrincipleSchema },
    solvedNumericalProblems: { type: Type.ARRAY, items: solvedNumericalProblemSchema },
    experiments: { type: Type.ARRAY, items: experimentSchema },
    timelineOfEvents: { type: Type.ARRAY, items: timelineEventSchema },
    keyFigures: { type: Type.ARRAY, items: keyFigureSchema },
    primarySourceAnalysis: { type: Type.ARRAY, items: primarySourceSnippetSchema },
    inDepthCaseStudies: { type: Type.ARRAY, items: caseStudySchema },
    grammarSpotlight: { type: Type.ARRAY, items: grammarRuleSchema },
    literaryDeviceAnalysis: { type: Type.ARRAY, items: literaryDeviceSchema },
    vocabularyDeepDive: { type: Type.ARRAY, items: vocabularyDeepDiveSchema },
    higherOrderThinkingQuestions: { type: Type.ARRAY, items: hotQuestionSchema },
    learningTricksAndMnemonics: { type: Type.ARRAY, items: { type: Type.STRING } },
    scientificMethodApplications: { type: Type.STRING },
    currentDiscoveries: { type: Type.STRING },
    environmentalAwareness: { type: Type.STRING },
    interdisciplinaryConnections: { type: Type.STRING },
    selfAssessmentChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
    extensionActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
    remedialActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
    careerConnections: { type: Type.STRING },
    technologyIntegration: { type: Type.STRING },
    competitiveExamMapping: { type: Type.STRING },
    culturalContext: culturalContextSchema,
    moralScienceCorner: moralScienceCornerSchema
};

export const generateSectionContent = async (
    gradeLevel: string, 
    subject: string, 
    chapter: Chapter, 
    language: string, 
    sectionKey: keyof LearningModule,
    chapterContext: string
): Promise<Partial<LearningModule>> => {

    const schemaForSection = sectionSchemaMap[sectionKey];
    if (!schemaForSection) {
        throw new Error(`No schema defined for section: ${sectionKey}`);
    }

    let competitiveExamInstructions = '';
    if (sectionKey === 'categorizedProblems' && chapter.tags && chapter.tags.length > 0) {
        competitiveExamInstructions = `
        **COMPETITIVE EXAM QUESTION STYLE (CRITICAL):**
        This chapter is crucial for **${chapter.tags.join(', ')}**. The generated questions MUST reflect the style, difficulty, and patterns of these exams.
        - **Difficulty & Bloom's Taxonomy:** Generate a higher proportion of 'Hard' and 'Medium' questions. At least 50% should be 'Hard'. Focus on 'Applying', 'Analyzing', and 'Evaluating' levels of Bloom's Taxonomy. Ensure questions often require integrating multiple concepts.
        - **Question Formats:**
          - If the tags include 'JEE', include some MCQs formatted for multi-correct answers (e.g., question text says "one or more options may be correct"). The 'explanation' must clarify all correct options.
          - If the tags include 'NEET', include several "Assertion-Reason" style questions. Format these as 'MCQ' type: The 'questionText' MUST contain both the Assertion (A) and the Reason (R). The 'options' MUST be the four standard choices (e.g., "Both A and R are true and R is the correct explanation of A.").
          - If the tags include 'Civil Services' or 'NDA', ensure 'Short Answer' and 'Long Answer' questions are analytical and require structured, comprehensive answers.
        - **Previous Year Questions (PYQs):** A significant number of questions should have \`isPreviousYearQuestion: true\` and be modeled closely on actual questions from past papers of these exams.
        - **Answer Writing Guidance (UPSC Focus):** For 'Long Answer' questions relevant to 'Civil Services', the 'answerWritingGuidance' MUST be exceptionally detailed. Provide guidance on structuring an answer for mains exams, including introduction, body with subheadings, conclusion, and use of keywords.
        `;
    }

    const prompt = `
        **SYSTEM ROLE:**
        You are a 'Chief Subject Matter Expert' for a top-tier Indian competitive exam coaching institute. Your task is to generate a specific, deeply detailed pedagogical section for an existing learning module. Your entire response must be in the ${language} language.

        **MISSION CONTEXT:**
        -   **Grade:** ${gradeLevel}
        -   **Subject:** ${subject}
        -   **Chapter:** "${chapter.title}"
        -   **Chapter Core Content:** ${chapterContext}

        **TASK:**
        Generate the content ONLY for the section named "${sectionKey}". Your output must be comprehensive, deeply insightful, and aligned with the latest CBSE standards (2024-25) but elevated for competitive exam preparation. For all theoretical content, use markdown-style bullet points ('- ') for clarity. Ensure the generated content is substantial and provides a deep understanding.
        ${competitiveExamInstructions}
        **Emphasis**: Do not use markdown for bolding (e.g., **text**). To emphasize a key term, enclose it in single quotes.

        **HORIZONTAL STEP-BY-STEP FORMATTING (CRITICAL):**
        For any content that involves a sequence of steps (e.g., numerical problem solutions in 'solvedNumericalProblems' or 'modelAnswer', formula derivations in 'formulaDerivations', proofs in 'keyTheoremsAndProofs'), you MUST format it as a single, continuous string. Each logical step MUST be separated by the '=>' symbol. This creates a clear, horizontal flow for students to follow. Do NOT use numbered lists or newlines for steps.
        
        Example Format:
        Given: Solve for x in the equation 3x + 5 = 17 => Step 1: Subtract 5 from both sides => 3x = 17 - 5 => Step 2: Simplify the right side => 3x = 12 => Step 3: Divide by 3 => x = 12 / 3 => Answer: x = 4

        **SPECIAL INSTRUCTIONS:**
        -   **For 'categorizedProblems':** 
            -   **CRITICAL:** The mix of question types MUST be diverse. Ensure a healthy mix, with AT LEAST 40% of the questions being MCQs. For every 10 questions, aim for approximately 4 MCQs, 4 Short Answer, and 2 Long Answer questions. The questions should be complex and often require multiple concepts to solve.
            -   Generate a SUFFICIENT and comprehensive set of practice questions. The quantity MUST BE LARGER for students in Grade 6 and above.
            -   Grades 6-8: Generate 25-30 questions.
            -   Grades 9-10: Generate 35-40 questions.
            -   Grades 11-12: Generate 45-50+ questions based on the last 10 years of CBSE exam patterns and competitive exam styles.
            -   **For ALL Short and Long Answer questions, the 'answerWritingGuidance' field is MANDATORY and MUST be detailed and helpful.** It must give students actionable, step-by-step tips on how to structure their answer to get full marks in CBSE exams, which keywords to include, and common mistakes to avoid for that specific question. Also provide a detailed 'modelAnswer' and 'markingScheme'.
        -   **For 'competitiveExamMapping':** Provide a detailed mapping of the chapter's concepts to the syllabus of major competitive exams like JEE (Main & Advanced), NEET, CUET, and relevant Olympiads. The structure should be:
            -   A brief introduction about the chapter's importance for these exams.
            -   A markdown list where each item maps a specific 'concept' from the chapter to the 'exam(s)' it's relevant for.
            -   A sub-section titled 'Previous Years Questions (Sample)' that includes 2-3 examples of previous years' questions (PYQs) from these exams. Provide the question and the year/exam it appeared in.
        -   **For 'culturalContext'**: Generate a section that connects the chapter's concepts to Indian culture, festivals, historical events, or daily life. For example, connect 'Light and Reflection' in Physics to Diwali, or 'Geometry' to Rangoli patterns. It should be an insightful and engaging connection.
        -   **For 'moralScienceCorner'**: Generate a short, simple story with a clear moral that relates to the chapter's core theme (e.g., perseverance for a tough math chapter, curiosity for a science chapter, honesty for a history chapter). The story should be engaging for the student's grade level.

        For all other sections, provide rich, detailed, and accurate content appropriate for the grade level.

        **FINAL INSTRUCTION:**
        Your entire output MUST be a JSON object containing a single key: "${sectionKey}". The value of this key must strictly follow the provided schema for that section. Do not include any other keys or markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        [sectionKey]: schemaForSection,
                    },
                    required: [sectionKey],
                },
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Partial<LearningModule>;

    } catch (error) {
        throw handleGeminiError(error, `generate the "${sectionKey}" section`);
    }
};

export const generateQuiz = async (keyConcepts: Concept[], language: string, count: number = 5): Promise<QuizQuestion[]> => {
    const conceptTitles = keyConcepts.map(c => c.conceptTitle);
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
        ${keyConcepts.map(c => `Title: ${c.conceptTitle}\nExplanation: ${c.explanation}`).join('\n\n')}
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

export const generateDiagnosticTest = async (grade: string, subject: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        Create a 5-question diagnostic multiple-choice quiz for a ${grade} student in the subject of ${subject}.
        The entire response, including all questions, options, answers, and explanations, must be in the ${language} language.

        The goal is to assess their foundational knowledge and identify their current skill level.
        The quiz should include:
        - 1-2 questions covering prerequisite concepts from the previous grade.
        - 2-3 questions on core, fundamental topics for the current ${grade} syllabus.
        - 1 question that is slightly more challenging to gauge advanced understanding.

        For each question, provide a clear question, four distinct options, the correct answer, a brief explanation,
        and for the 'conceptTitle' field, use a generic title like 'Foundational Knowledge' or the specific topic being tested.
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
        throw handleGeminiError(error, 'generate diagnostic test');
    }
}

export const generateChapterDiagnosticTest = async (grade: string, subject: string, chapter: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        Create a 5-question multiple-choice diagnostic quiz for a ${grade} student about to start the chapter "${chapter}" in the subject "${subject}".
        The quiz must test the essential prerequisite knowledge required to understand this chapter. DO NOT ask questions about the content of the chapter "${chapter}" itself. Focus only on foundational concepts from previous chapters or grades.
        For the 'conceptTitle' field in the JSON response, specify the prerequisite concept being tested (e.g., 'Linear Equations', 'Atomic Structure').
        The entire response, including all text, must be in the ${language} language.
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
        throw handleGeminiError(error, 'generate chapter diagnostic test');
    }
}

export const generateComprehensiveDiagnosticTest = async (grade: string, subject: string, chapter: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        As an expert educational psychologist, create a 10-question comprehensive diagnostic test for a ${grade} student preparing to study the chapter "${chapter}" in ${subject}. The entire response must be in ${language}.

        The test MUST include a mix of the following three types of questions:
        1.  **ACADEMIC (5 questions):** Test essential prerequisite knowledge for the chapter "${chapter}". These should be 'Easy' or 'Medium' difficulty.
        2.  **IQ (3 questions):** Test cognitive skills relevant to the subject. For ${subject}, focus on skills like logical reasoning, pattern recognition, or spatial awareness. These can be 'Medium' or 'Hard'.
        3.  **EQ (2 questions):** Test emotional intelligence through relatable scenarios. For example, a scenario about feeling stuck on a tough problem or dealing with exam stress. These are typically 'Easy' or 'Medium'.

        For EACH question, you MUST provide all fields specified in the schema, including:
        - \`type\`: 'ACADEMIC', 'IQ', or 'EQ'.
        - \`conceptTitle\`: For ACADEMIC, name the prerequisite concept. For IQ/EQ, name the specific skill tested (e.g., 'Logical Reasoning', 'Resilience').
        - \`skill\`: For IQ/EQ, repeat the skill name.
        - \`difficulty\`: 'Easy', 'Medium', or 'Hard'.
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
        throw handleGeminiError(error, 'generate comprehensive diagnostic test');
    }
};


export const generateEducationalTips = async (topic: string, language: string): Promise<string[]> => {
    const fallbackTips = language === 'hi'
        ? [
            "क्या आप जानते हैं? प्रकाश की गति लगभग 299,792 किलोमीटर प्रति सेकंड है!",
            "एकल बिजली के बोल्ट में 100,000 ब्रेड के स्लाइस को टोस्ट करने के लिए पर्याप्त ऊर्जा होती है।",
            "मानव मस्तिष्क में लगभग 86 बिलियन न्यूरॉन्स होते हैं।"
          ]
        : [
            "Did you know? The speed of light is about 299,792 kilometers per second!",
            "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
            "The human brain contains approximately 86 billion neurons."
        ];

    const prompt = `
        Generate 5 short, interesting, and educational facts or tips related to the following topic: "${topic}".
        The tips should be engaging for a K-12 student. Keep each tip to a single, concise sentence.
        The entire response must be in the ${language} language.
        Your output MUST be a JSON array of strings. For example: ["fact 1", "fact 2", "fact 3"]
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                temperature: 0.8,
            },
        });
        const jsonText = response.text.trim();
        const tips = JSON.parse(jsonText) as string[];
        return tips.length > 0 ? tips : fallbackTips;
    } catch (error) {
        console.error(`Failed to generate educational tips for topic "${topic}":`, error);
        return fallbackTips; // Return fallback on any error
    }
};


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateDiagram = async (description: string, subject: string): Promise<string> => {
    
    let styleCue = `friendly, simple, engaging cartoonish style.`;
    const lowerCaseSubject = subject.toLowerCase();

    if (['computer science', 'robotics', 'ai and machine learning'].some(s => lowerCaseSubject.includes(s))) {
        styleCue = `clean, modern, digital illustration style with simple icons, abstract shapes, or flowcharts. Futuristic but easy to understand.`;
    } else if (['science', 'physics', 'chemistry', 'biology', 'evs'].some(s => lowerCaseSubject.includes(s))) {
        styleCue = `clean, "science textbook" illustration style with clear outlines and vibrant colors. For biological diagrams, parts must be distinct and simple. For chemical diagrams, molecules and bonds must be clear.`;
    } else if (lowerCaseSubject.includes('mathematics')) {
        styleCue = `precise geometric shapes, clean lines, and clearly marked angles or points. Modern math textbook style.`;
    } else if (['history', 'social studies', 'geography', 'political science', 'economics'].some(s => lowerCaseSubject.includes(s))) {
        styleCue = `simple infographic, a stylized map, or a timeline with friendly icons.`;
    }

    const prompt = `Generate a minimalist, 2D educational diagram for a K-12 student. The diagram should illustrate: "${description}".
**Positive Requirements:**
-   **Text-free:** Absolutely no words, letters, or numbers.
-   **Clarity:** Clean lines, simple shapes, and a plain white background.
-   **Style:** ${styleCue}.
-   **Conceptually Accurate:** The visual representation must be correct and easy to understand.
**Negative Requirements (AVOID):**
-   Overly complex scenes or backgrounds.
-   3D rendering, shadows, or photorealism.
-   Text labels or annotations.
-   Confusing or abstract metaphors.`;
    
    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '4:3',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            } else {
                throw new Error("No image was generated by the AI.");
            }
        } catch (error: any) {
            lastError = error;
            const errorMessage = (error.message || '').toLowerCase();
            
            if (errorMessage.includes('quota')) {
                throw handleGeminiError(error, 'generate diagram');
            }

            if ((errorMessage.includes('rate limit') || (error.status === 'RESOURCE_EXHAUSTED')) && i < MAX_RETRIES - 1) {
                const delayTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.warn(`Rate limit hit. Retrying in ${Math.round(delayTime / 1000)}s...`);
                await delay(delayTime);
                continue; 
            }
            break;
        }
    }
    
    throw handleGeminiError(lastError, 'generate diagram');
};

export const generateVideoFromPrompt = async (prompt: string): Promise<Blob> => {
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        });

        while (!operation.done) {
            // Wait for 10 seconds before polling again.
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        return videoBlob;

    } catch (error: any) {
        throw handleGeminiError(error, 'generate video');
    }
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
    language: string
): Promise<NextStepRecommendation> => {
    
    const prompt = `
        Act as an expert educational psychologist for a ${grade} student. The student has just completed a comprehensive diagnostic test for the chapter "${chapter}" in ${subject}.
        Their performance is as follows:
        - Academic Prerequisite Score: ${scores.academic}%
        - IQ (Cognitive Skills) Score: ${scores.iq}%
        - EQ (Emotional Intelligence) Score: ${scores.eq}%
        
        Your task is to provide a single, most impactful recommendation for the student's next step. The entire response must be in ${language} and in the specified JSON format.
        Follow these rules in strict priority order:

        1.  **If Academic score is below 50%:** The student is not ready.
            - **action**: "REVISE_PREREQUISITE"
            - **recommendationText**: Gently explain that a strong foundation is crucial. Strongly recommend reviewing the most likely prerequisite chapter first to make learning "${chapter}" much easier and more successful.
            - **prerequisiteChapterTitle**: [Identify the most likely prerequisite chapter title before "${chapter}" from a typical curriculum for ${subject}].
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


export const generateDiagnosticRecommendation = async (grade: string, subject: string, chapter: string, score: number, totalQuestions: number, subjectChapters: {title: string}[], language: string): Promise<NextStepRecommendation> => {
    const percentage = Math.round((score / totalQuestions) * 100);
    const chapterTitles = subjectChapters.map(c => c.title).join('", "');

    const prompt = `
        Act as an expert, encouraging learning coach for a ${grade} student studying ${subject}.
        The student has just completed a 5-question PREREQUISITE knowledge quiz for the chapter "${chapter}" and scored ${score} out of ${totalQuestions} (${percentage}%).
        The available chapters in this subject are: ["${chapterTitles}"].
        The entire response must be in the ${language} language.

        Based on this performance on prerequisite knowledge, provide a personalized recommendation for their next step. Your response must be in a specific JSON format.
        
        1.  **If the score is 80% or higher (${percentage}%):**
            - The student is well-prepared.
            - **action**: "CONTINUE"
            - **recommendationText**: Praise them for their strong foundation and state that they are ready to start the chapter "${chapter}".
            - **nextChapterTitle**: "${chapter}"
            - **prerequisiteChapterTitle**: null
        
        2.  **If the score is between 40% and 79% (inclusive of ${percentage}%):**
            - The student has some gaps in their prerequisite knowledge.
            - **action**: "REVISE_PREREQUISITE"
            - **recommendationText**: Gently point out that there might be a few gaps and suggest a quick review of the most likely prerequisite chapter before diving into "${chapter}". This will make the new chapter easier to understand.
            - **prerequisiteChapterTitle**: Identify the most likely single prerequisite chapter from the available chapter list. For example, if the current chapter is "Trigonometry", you should identify "Triangles".
            - **nextChapterTitle**: "${chapter}"
        
        3.  **If the score is below 40% (${percentage}%):**
            - The student has significant gaps and is likely not ready.
            - **action**: "REVISE_PREREQUISITE"
            - **recommendationText**: In a supportive tone, strongly recommend that they build a stronger foundation by thoroughly reviewing the prerequisite chapter first. Explain that this will prevent frustration and make learning "${chapter}" much more successful.
            - **prerequisiteChapterTitle**: Identify the most likely single prerequisite chapter from the available chapter list.
            - **nextChapterTitle**: "${chapter}"
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
        const result = JSON.parse(jsonText) as NextStepRecommendation;

        if (result.action === 'REVISE_PREREQUISITE' && result.prerequisiteChapterTitle) {
            const prereqExists = subjectChapters.some(c => c.title === result.prerequisiteChapterTitle);
            if (!prereqExists) {
                console.warn(`AI recommended non-existent prerequisite: ${result.prerequisiteChapterTitle}. Falling back.`);
                const currentChapterIndex = subjectChapters.findIndex(c => c.title === chapter);
                if (currentChapterIndex > 0) {
                    result.prerequisiteChapterTitle = subjectChapters[currentChapterIndex - 1].title;
                } else {
                    result.action = 'CONTINUE'; 
                    result.recommendationText = `You're almost ready! It would be a good idea to quickly review the previous topics in ${subject} before starting '${chapter}'.`;
                }
            }
        }
        
        return result;
    } catch (error) {
        throw handleGeminiError(error, 'generate diagnostic recommendation');
    }
}


// --- New Functions for Teacher/Parent Reports ---

export const generateTeacherReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `
        Act as an experienced educator and data analyst. Based on the following comprehensive performance data for a student named ${student.name} (${student.grade}), 
        generate a detailed academic performance analysis report. The entire report must be in the ${language} language.

        **VERY IMPORTANT FORMATTING RULES:**
        - Each section heading MUST be on a new line, prefixed with "HEADING: ", and end with a colon. For example: "HEADING: Overall Summary:".
        - Under each heading, use bullet points for lists. Each bullet point MUST start with a hyphen (-).

        The report MUST be structured with the following sections:
        1.  HEADING: Overall Summary: A brief, holistic overview of the student's performance.
        2.  HEADING: Identified Strengths: A bulleted list of subjects or chapters where the student has excelled (scores > 85%). Be specific.
        3.  HEADING: Areas for Improvement: A bulleted list of subjects or chapters where the student is struggling (scores < 70%). Frame this constructively.
        4.  HEADING: Study Patterns & Trends: A detailed analysis using bullet points for specific observations. Analyze:
            - **Quiz vs. Practice Frequency:** Does the student test themselves with quizzes or prefer practice exercises?
            - **Response to Difficulty:** After a low quiz score on a chapter, does the student follow up with practice exercises on that same chapter?
            - **Pacing and Consistency:** Based on the 'completedDate' timestamps, is the student studying consistently (e.g., daily) or in irregular bursts?
            - **Topic Preference:** Are there subjects or chapters the student revisits often, or avoids?
        5.  HEADING: Actionable Recommendations: A bulleted list of concrete, pedagogical suggestions for the teacher.

        Student Performance Data (includes quizzes and practice exercises):
        ---
        ${JSON.stringify(student.performance, null, 2)}
        ---
        
        Keep the tone professional, insightful, and focused on student growth.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, 'generate teacher report');
    }
};

export const generateParentReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `
        Act as a friendly and encouraging school counselor. Based on the following performance data for a student named ${student.name} (${student.grade}), 
        write a progress report for their parents. The entire report must be in the ${language} language.

        **VERY IMPORTANT FORMATTING RULES:**
        - Section headings should be friendly, on a new line, prefixed with "HEADING: ", and end with a colon. For example: "HEADING: Where ${student.name} is Shining:".
        - Use bullet points for lists. Each bullet point MUST start with a hyphen (-).

        The report should be easy to understand, positive, and supportive. Structure it with the following sections:
        1.  HEADING: A Quick Note on ${student.name}'s Progress: A warm opening celebrating their effort.
        2.  HEADING: Where ${student.name} is Shining: A bulleted list of subjects where they are doing well.
        3.  HEADING: Opportunities for Growth: A bulleted list of areas to focus on, framed positively.
        4.  HEADING: How ${student.name} is Learning: Simple, encouraging observations about their study habits in a bulleted list (e.g., consistency, resilience).
        5.  HEADING: Tips for Home Support: A bulleted list of simple, actionable tips for parents.

        Student Performance Data (includes quizzes and practice exercises):
        ---
        ${JSON.stringify(student.performance, null, 2)}
        ---
        
        The tone should be empathetic and collaborative, making parents feel like partners in their child's education.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, 'generate parent report');
    }
};

export const analyzeStudentQuestionForTeacher = async (question: StudentQuestion, language: string): Promise<AIAnalysis> => {
    const prompt = `
      Act as an expert teacher and instructional coach, adhering to CBSE standards.
      A ${question.grade} student, ${question.studentName}, has asked a question about the concept "${question.concept}" 
      from the chapter "${question.chapter}" in ${question.subject}.
      
      The student's question is: "${question.questionText}"

      Your task is to provide a detailed analysis for the teacher. The entire response must be in the ${language} language and in the specified JSON format.

      Your response should contain two parts:
      1.  **modelAnswer**: A clear, concise, and grade-appropriate model answer to the student's question. This answer should be factually correct, easy to understand, and directly address what the student asked.
      2.  **pedagogicalNotes**: Private notes for the teacher. This section is crucial. It should provide actionable advice, including:
          - The likely root of the student's confusion.
          - Common misconceptions related to this concept for students at this grade level.
          - Key vocabulary or concepts to emphasize when explaining the answer.
          - A suggestion for a follow-up question or a simple activity to check for understanding.

      **HORIZONTAL STEP-BY-STEP FORMATTING (CRITICAL):**
      If the 'modelAnswer' involves a sequence of steps (e.g., a mathematical calculation), you MUST format it as a single, continuous string where each step is separated by the '=>' symbol.
      Example: Given: 3x + 5 = 17 => Step 1: Subtract 5 from both sides => 3x = 17 - 5 => Step 2: Simplify => 3x = 12 => Answer: x = 4
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: aiAnalysisSchema,
          temperature: 0.6,
        },
      });
  
      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as AIAnalysis;
    } catch (error) {
        throw handleGeminiError(error, 'get AI analysis for the question');
    }
};

export const getFittoAnswer = async (question: StudentQuestion, language: string): Promise<FittoResponse> => {
    const prompt = `
      You are Fitto, a friendly, encouraging, and knowledgeable AI Mentor for K-12 students.
      Your primary goal is to help students understand concepts without giving away answers to homework or tests.
      You must communicate in a simple, clear, and supportive tone.
      The entire response must be in the ${language} language and in the specified JSON format.

      A student in ${question.grade} studying ${question.subject} has asked a question about the concept "${question.concept}".
      The student's question is: "${question.questionText}"

      First, you must determine if the question is relevant to the academic concept. 
      - **Relevant questions** are about understanding the concept, asking for clarification, or for a simpler explanation.
      - **Irrelevant questions** include personal questions, requests to do homework, questions about unrelated topics (like video games, social media), or anything inappropriate.

      Your task is to generate a JSON response with two fields:
      1.  **isRelevant**: A boolean. Set to \`true\` if the question is relevant, otherwise \`false\`.
      2.  **responseText**: 
          - If \`isRelevant\` is \`true\`, provide a helpful, easy-to-understand explanation that guides the student toward understanding. Use analogies and simple examples. Do NOT just give the answer; explain the 'why' and 'how'.
          - If \`isRelevant\` is \`false\`, provide a polite, gentle, and firm response that redirects the student back to their studies. For example: "That's an interesting question! My job is to help you with ${question.subject}, though. Let's focus on understanding ${question.concept}. Do you have a question about that?"

      Keep your answers concise and focused.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: fittoResponseSchema,
                temperature: 0.7,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FittoResponse;
    } catch (error) {
        throw handleGeminiError(error, "getting Fitto's answer");
    }
};

// --- New Functions for Adaptive Learning Engine ---

export const getAdaptiveNextStep = async (student: Student, language: string): Promise<AdaptiveAction> => {
    
    const studentGradeCurriculum = CURRICULUM.find(g => g.level === student.grade);
    let curriculumContext = '';
    if (studentGradeCurriculum) {
        curriculumContext = `
        **Available Curriculum for ${student.grade}:**
        Here is the complete list of available subjects and chapters for this student. When choosing an 'ACADEMIC_NEW' action, you MUST pick the next uncompleted chapter from this list. Do not invent chapter titles.
        ${studentGradeCurriculum.subjects.map(subject => `
        - Subject: "${subject.name}"
          Chapters: ["${subject.chapters.map(c => c.title).join('", "')}"]
        `).join('')}
        `;
    }

    const prompt = `
        Act as an expert adaptive learning AI specializing in personalized K-12 education for the Indian CBSE curriculum. Your goal is to determine the single most impactful next action for a student based on their complete performance history, which includes academic quizzes, practice exercises, IQ challenges, and EQ exercises. The entire response must be in the ${language} language and adhere to the specified JSON schema.

        Student Profile:
        - Name: ${student.name}
        - Grade: ${student.grade}

        Performance History (a JSON array of records with type, subject, chapter, score, etc.):
        ---
        ${JSON.stringify(student.performance, null, 2)}
        ---
        
        ${curriculumContext}

        Your decision-making process MUST follow these rules in strict order of priority to generate a balanced and effective 10-question mixed assessment for the student's daily mission.

        **Priority 1: Critical Academic Intervention**
        - Scan the performance history for any ACADEMIC chapter (type 'quiz' or 'exercise') with a score BELOW 60%.
        - If found, select the one with the LOWEST score.
        - Your action type MUST be 'ACADEMIC_REVIEW'.
        - **Reasoning:** Explain that mastering this foundational topic is crucial. Example: "Building a strong foundation in 'Chapter X' is key to success. Let's review it together to make sure we've got it!"
        - **Confidence Score:** This is a high-priority, data-driven intervention. Set confidence between 0.95 and 1.0.

        **Priority 2: Cognitive Skill Development**
        - If there are no academic scores below 60%, scan for IQ or EQ exercise scores BELOW 70%.
        - If found, select the one with the LOWEST score.
        - If the lowest is an IQ score, your action type MUST be 'IQ_EXERCISE'.
        - If the lowest is an EQ score, your action type MUST be 'EQ_EXERCISE'.
        - **Reasoning:** Explain the importance of this cognitive skill. Example: "Problem-solving is a superpower! Let's do some fun brain teasers to sharpen your logical skills." or "Understanding emotions helps us connect better. Let's explore a scenario together."
        - **Confidence Score:** This is a targeted, data-driven intervention. Set confidence between 0.85 and 0.95.

        **Priority 3: Focused Academic Practice**
        - If priorities 1 and 2 are not met, scan for any ACADEMIC chapter with a score between 60% and 75% (inclusive).
        - If found, select the one with the LOWEST score.
        - Your action type MUST be 'ACADEMIC_PRACTICE'.
        - **Reasoning:** Frame this as an opportunity to turn good understanding into great mastery. Example: "You're doing well in 'Chapter X'! A little more practice will make you an expert."
        - **Confidence Score:** This is a data-driven recommendation for improvement. Set confidence between 0.8 and 0.9.
        
        **Priority 4: Spaced Repetition to Combat the Forgetting Curve**
        - If priorities 1-3 are not met, analyze the timestamps ('completedDate') of ACADEMIC chapters that have been mastered (score > 85%).
        - Identify a mastered chapter that has not been practiced for the longest time (e.g., more than 14 days ago).
        - If such a chapter is found, your action type MUST be 'ACADEMIC_PRACTICE'.
        - **Reasoning:** Explain the importance of spaced repetition. Example: "You've already mastered 'Chapter X'! Revisiting it briefly will help lock it into your long-term memory and fight the 'forgetting curve'."
        - **Confidence Score:** This is a key pedagogical strategy. Set confidence between 0.85 and 0.9.

        **Priority 5: Strategic Advancement**
        - If all prior conditions are not met (meaning all recent work is good and spaced repetition is not needed), the student is ready to advance.
        - Identify the academic subject where the student has the highest average score.
        - Your action type MUST be 'ACADEMIC_NEW'. You must recommend the next logical, uncompleted chapter in that subject. **CRITICAL: You MUST select the chapter title from the 'Available Curriculum' provided above.**
        - **Reasoning:** Praise their hard work and encourage them to tackle the next challenge. Example: "You're doing brilliantly in 'Subject Y'! Let's keep the momentum going with the next chapter."
        - **Confidence Score:** This is a logical progression based on strong performance. Set confidence between 0.75 and 0.85.

        **Priority 6: Holistic Enrichment (Default/Fallback)**
        - If none of the above conditions are met (e.g., student is new with no data, or has mastered everything), your action MUST be to foster holistic skills.
        - Your action type MUST be 'IQ_EXERCISE'.
        - **Reasoning:** Provide a light, engaging reason. Example: "Let's start with a fun brain workout to get warmed up!"
        - **Confidence Score:** This is a general recommendation. Set confidence between 0.7 and 0.8.

        **MANDATORY FINAL INSTRUCTION:**
        Your output must be a single JSON object. The 'reasoning' field is critical and must be a user-facing string. The 'confidence' field is also mandatory and must be a number following the rules above. For academic actions, you MUST provide the subject and chapter in the 'details' object. For IQ/EQ actions, provide the skill if available in the data, otherwise it can be null.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: adaptiveActionSchema,
                temperature: 0.8,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AdaptiveAction;
    } catch (error) {
        throw handleGeminiError(error, 'generate a personalized path');
    }
};

export const generateIQExercises = async (grade: string, language: string, count: number = 3): Promise<IQExercise[]> => {
    const prompt = `
        Generate ${count} multiple-choice IQ test questions suitable for a ${grade} student. The questions should be fun and engaging.
        The entire response, including all fields, must be in the ${language} language and in the specified JSON format.

        For each question, provide:
        1.  **question**: The puzzle or question text.
        2.  **options**: An array of four strings representing the possible answers.
        3.  **correctAnswer**: The correct option from the array.
        4.  **explanation**: A clear, simple explanation of the logic behind the correct answer.
        5.  **skill**: The type of cognitive skill being tested. Choose one from: 'Pattern Recognition', 'Logic Puzzle', 'Spatial Reasoning', 'Analogical Reasoning'.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: iqExerciseSchema,
                temperature: 0.9,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as IQExercise[];
    } catch (error) {
        throw handleGeminiError(error, 'generate IQ exercises');
    }
};

export const generateEQExercises = async (grade: string, language: string, count: number = 3): Promise<EQExercise[]> => {
    const prompt = `
        Generate ${count} multiple-choice Emotional Intelligence (EQ) scenario questions suitable for a ${grade} student.
        The scenarios should be relatable to a student's life (school, friends, family).
        The entire response, including all fields, must be in the ${language} language and in the specified JSON format.

        For each question, provide:
        1.  **scenario**: A short, relatable scenario.
        2.  **question**: A question asking what the best course of action is.
        3.  **options**: An array of four strings representing possible responses or actions.
        4.  **bestResponse**: The option that demonstrates the most emotional intelligence.
        5.  **explanation**: A clear, simple explanation of why that response is the most constructive or empathetic.
        6.  **skill**: The type of EQ skill being tested. Choose one from: 'Empathy', 'Self-awareness', 'Resilience', 'Social Skills'.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: eqExerciseSchema,
                temperature: 0.9,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as EQExercise[];
    } catch (error) {
        throw handleGeminiError(error, 'generate EQ exercises');
    }
};


export const generateCurriculumOutline = async (grade: string, subject: string, language: string): Promise<CurriculumOutlineChapter[]> => {
    // This prompt is inspired by the user's suggestion to generate curriculum in chunks, starting with an outline.
    const prompt = `
        Act as an expert curriculum designer for the Indian CBSE school system.
        Your task is to generate a comprehensive chapter outline for the subject "${subject}" for a ${grade} student.
        The entire response, including all chapter titles and learning objectives, must be in the ${language} language.

        Please provide a list of 10 to 15 relevant chapter titles that cover the core syllabus for this grade and subject.
        For each chapter, list 3 to 5 primary learning objectives that a student should achieve upon completion.

        The output must be a JSON array of objects, where each object contains:
        1. "chapterTitle": The name of the chapter.
        2. "learningObjectives": An array of strings, with each string being a key learning objective.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: curriculumOutlineSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CurriculumOutlineChapter[];
    } catch (error) {
        throw handleGeminiError(error, 'generate curriculum outline');
    }
};

export const validateCurriculumOutline = async (
    outline: CurriculumOutlineChapter[], 
    grade: string, 
    subject: string, 
    language: string
): Promise<string> => {
    const curriculumText = outline.map(chapter => 
        `Chapter: ${chapter.chapterTitle}\nObjectives:\n${chapter.learningObjectives.map(obj => `- ${obj}`).join('\n')}`
    ).join('\n\n');

    const prompt = `
        Act as an expert educational consultant and curriculum auditor for the Indian K-12 education system.
        Your task is to review and validate the following generated curriculum outline for a ${grade} ${subject} class.
        The entire report and analysis must be in the ${language} language.

        **Curriculum Outline to Review:**
        ---
        ${curriculumText}
        ---

        Please provide a detailed quality report that validates the curriculum against the following six critical standards. For each standard, provide a brief analysis and identify any potential gaps or necessary improvements.

        **Validation Criteria:**
        1.  Latest CBSE Syllabus (2024-25) Alignment: Is the chapter structure and scope aligned with the most recent CBSE guidelines?
        2.  NCERT Textbook Alignment: Do the chapters and learning objectives correspond to the content in the standard NCERT textbooks for this grade?
        3.  NEP 2020 Compliance: Does the curriculum promote multidisciplinary learning, critical thinking, and conceptual understanding as mandated by the National Education Policy 2020?
        4.  Age-Appropriate Content Standards: Is the complexity and depth of the topics suitable for the cognitive level of a ${grade} student?
        5.  Learning Outcome Achievements: Are the learning objectives clear, measurable, and sufficient to ensure students achieve the required competencies for this subject at this level?
        6.  Assessment Criteria Alignment: Does the outline provide a solid foundation for creating fair and comprehensive assessments (including formative and summative)?

        **Output Format:**
        Your response MUST be a well-structured report. Use headings for each section. Do not use any markdown formatting like asterisks.
        - Start with a main heading: HEADING: Quality Report:
        - Create a sub-heading for each of the 6 validation criteria (e.g., "HEADING: 1. CBSE Syllabus Alignment:").
        - Conclude with a final section: HEADING: Overall Summary & Recommendations: where you summarize the findings and list actionable suggestions using bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, 'get validation report');
    }
};

// --- New Function for AI Tutor Chat ---
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

// --- New Function for Printable Resources ---
export const generatePrintableResource = async (
    type: 'worksheet' | 'study-notes', 
    gradeLevel: string, 
    subject: string, 
    chapter: string, 
    chapterContext: string,
    language: string
): Promise<string> => {
    const resourceType = type === 'worksheet' 
        ? (language === 'hi' ? 'वर्कशीट' : 'Worksheet') 
        : (language === 'hi' ? 'अध्ययन नोट्स' : 'Study Notes');
    
    const prompt = type === 'worksheet'
    ? `As an expert educator, create a printer-friendly HTML document for a worksheet. The worksheet is for a ${gradeLevel} student studying "${chapter}" in ${subject}. The content must be in ${language}. The worksheet should be based on these key concepts: ${chapterContext}. The HTML should include:
- A main title (<h1>) for the worksheet.
- At least 3 sections with subtitles (<h2>), each focusing on different concepts.
- A mix of 10-15 questions in total: Multiple Choice (with non-functional radio button placeholders), Fill-in-the-blanks (using underlined spaces like '__________'), and Short Answer questions (with ample space for writing).
- Do not include any JavaScript or complex CSS. Use basic HTML tags.
- At the very end of the document, include a detailed answer key inside a <details> tag so it is hidden by default. The <summary> tag should contain "${language === 'hi' ? 'उत्तर कुंजी' : 'Answer Key'}".
- The entire output should be ONLY the HTML content for the body, starting from the <h1>.`
    : `As an expert educator, create a printer-friendly HTML document of study notes. The notes are for a ${gradeLevel} student studying "${chapter}" in ${subject}. The content must be in ${language}. The notes should be a concise but comprehensive summary of these key concepts: ${chapterContext}. The HTML should include:
- A main title (<h1>).
- Clear sections for each key concept using <h2> or <h3> tags.
- Key points must be in bulleted lists (<ul> and <li>).
- Important terms should be bolded using <strong> tags.
- Do not include any JavaScript or complex CSS. Use basic HTML tags.
- The entire output should be ONLY the HTML content for the body, starting from the <h1>.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let htmlContent = response.text.replace(/```html/g, '').replace(/```/g, '').trim();

        return `
            <!DOCTYPE html>
            <html lang="${language}">
            <head>
                <meta charset="UTF-8">
                <title>${chapter} - ${resourceType}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 2rem; color: #333; }
                    h1, h2, h3 { color: #111; }
                    h1 { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                    .section { margin-bottom: 2rem; }
                    .question { margin-bottom: 1.5rem; }
                    .question-text { font-weight: bold; }
                    .options { list-style-type: lower-alpha; padding-left: 25px; }
                    details { background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-top: 2rem; }
                    summary { font-weight: bold; cursor: pointer; }
                    @media print {
                        .print-button { display: none; }
                        body { margin: 1in; font-size: 12pt; }
                        details { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <button class="print-button" onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px; border: 1px solid #ccc; background: #f0f0f0; position: fixed; top: 10px; right: 10px;">Print / Save as PDF</button>
                ${htmlContent}
            </body>
            </html>
        `;

    } catch (error) {
        throw handleGeminiError(error, `generate the ${resourceType}`);
    }
};

// --- New Functions for Career Guidance ---

const aptitudeQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING },
        trait: { type: Type.STRING, enum: ['Logical Reasoning', 'Verbal Ability', 'Numerical Aptitude', 'Spatial Awareness'] },
        explanation: { type: Type.STRING },
    },
    required: ['question', 'options', 'correctAnswer', 'trait', 'explanation']
};

const aptitudeTestSchema = {
    type: Type.ARRAY,
    items: aptitudeQuestionSchema,
};

export const generateAptitudeTest = async (grade: string, language: string): Promise<AptitudeQuestion[]> => {
    const prompt = `
        Generate a 10-question multiple-choice aptitude test suitable for a ${grade} student in India.
        The test must cover a balanced mix of the following traits: 'Logical Reasoning', 'Verbal Ability', 'Numerical Aptitude', and 'Spatial Awareness'.
        The entire response, including all fields, must be in the ${language} language and in the specified JSON format.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: aptitudeTestSchema,
                temperature: 0.8,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AptitudeQuestion[];
    } catch (error) {
        throw handleGeminiError(error, 'generate aptitude test');
    }
};

export const generateAptitudeTestSummary = async (results: Record<string, { correct: number, total: number }>, language: string): Promise<string> => {
    const prompt = `
        A student took an aptitude test. Here are their results, showing correct answers out of total questions for each trait: ${JSON.stringify(results)}.
        Based on these results, write a brief, encouraging, one-paragraph summary of their strengths and potential areas for improvement. The response must be in ${language}.
        Keep the summary concise and positive.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        throw handleGeminiError(error, 'generate test summary');
    }
};

const careerSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        careerName: { type: Type.STRING },
        description: { type: Type.STRING },
        requiredSubjects: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['careerName', 'description', 'requiredSubjects'],
};

const streamRecommendationSchema = {
    type: Type.OBJECT,
    properties: {
        streamName: { type: Type.STRING, enum: ['Science', 'Commerce', 'Humanities/Arts'] },
        recommendationReason: { type: Type.STRING },
        suggestedCareers: { type: Type.ARRAY, items: careerSuggestionSchema },
    },
    required: ['streamName', 'recommendationReason', 'suggestedCareers'],
};

const careerGuidanceSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING },
        streamRecommendations: { type: Type.ARRAY, items: streamRecommendationSchema },
        conclusion: { type: Type.STRING },
    },
    required: ['introduction', 'streamRecommendations', 'conclusion'],
};

export const generateStreamGuidance = async (student: Student, aptitudeResults: any, language: string): Promise<CareerGuidance> => {
    const prompt = `
        Act as an expert career counselor for an Indian student.
        Student Profile: ${student.name}, ${student.grade}.
        Aptitude Test Results Summary: "${aptitudeResults.summary}".
        Based on this profile and aptitude summary, generate a comprehensive career guidance report.
        The report should recommend a suitable academic stream (Science, Commerce, or Humanities/Arts) and suggest at least 3 potential career paths for each recommended stream.
        The entire response must be in the ${language} language and strictly follow the specified JSON schema.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: careerGuidanceSchema,
                temperature: 0.7,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CareerGuidance;
    } catch (error) {
        throw handleGeminiError(error, 'generate career guidance');
    }
};

export const createCareerCounselorChat = (student: Student, language: string): Chat => {
    const systemInstruction = `You are Fitto, a friendly and experienced career counselor. You are talking to ${student.name}, a ${student.grade} student. Your goal is to help them explore career options, understand their strengths, and make informed decisions about their future. Be encouraging, ask clarifying questions, and provide helpful information. You must communicate in ${language}.`;

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
};