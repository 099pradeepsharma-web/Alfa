

import { GoogleGenAI, Type } from "@google/genai";
import { LearningModule, QuizQuestion, Student, NextStepRecommendation, Concept, StudentQuestion, AIAnalysis, FittoResponse, AdaptiveAction, IQExercise, EQExercise, CurriculumOutlineChapter } from '../types';

// The API key is sourced from the `process.env.API_KEY` environment variable.
// To use a new key (e.g., from Vertex AI Studio), set this variable in your deployment environment.
// For security reasons, do not hard-code the key directly in the code.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

const categorizedProblemSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        solution: { type: Type.STRING }
    },
    required: ['question', 'solution']
};

const categorizedProblemsSchema = {
    type: Type.OBJECT,
    properties: {
        conceptual: { type: Type.ARRAY, items: categorizedProblemSchema },
        application: { type: Type.ARRAY, items: categorizedProblemSchema },
        higherOrderThinking: { type: Type.ARRAY, items: categorizedProblemSchema }
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


const learningModuleSchema = {
    type: Type.OBJECT,
    properties: {
        chapterTitle: { type: Type.STRING },
        introduction: { type: Type.STRING },
        learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyConcepts: { type: Type.ARRAY, items: conceptSchema },
        summary: { type: Type.STRING },
        conceptMap: { type: Type.STRING, nullable: true },
        learningTricksAndMnemonics: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        higherOrderThinkingQuestions: { type: Type.ARRAY, items: hotQuestionSchema, nullable: true },
        competitiveExamMapping: { type: Type.STRING, nullable: true },

        // New fields
        prerequisitesCheck: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        selfAssessmentChecklist: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        extensionActivities: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        remedialActivities: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        careerConnections: { type: Type.STRING, nullable: true },
        technologyIntegration: { type: Type.STRING, nullable: true },

        // Math
        keyTheoremsAndProofs: { type: Type.ARRAY, items: theoremSchema, nullable: true },
        formulaDerivations: { type: Type.ARRAY, items: formulaDerivationSchema, nullable: true },
        formulaSheet: { type: Type.ARRAY, items: formulaSchema, nullable: true },
        problemSolvingTemplates: { type: Type.ARRAY, items: problemSolvingTemplateSchema, nullable: true },
        categorizedProblems: { ...categorizedProblemsSchema, nullable: true },
        commonMistakes: { type: Type.ARRAY, items: commonMistakeSchema, nullable: true },
        
        // Science
        keyLawsAndPrinciples: { type: Type.ARRAY, items: keyLawOrPrincipleSchema, nullable: true },
        solvedNumericalProblems: { type: Type.ARRAY, items: solvedNumericalProblemSchema, nullable: true },
        experiments: { type: Type.ARRAY, items: experimentSchema, nullable: true },
        scientificMethodApplications: { type: Type.STRING, nullable: true },
        currentDiscoveries: { type: Type.STRING, nullable: true },
        environmentalAwareness: { type: Type.STRING, nullable: true },
        interdisciplinaryConnections: { type: Type.STRING, nullable: true },
        
        // Social Science, Commerce, Humanities
        timelineOfEvents: { type: Type.ARRAY, items: timelineEventSchema, nullable: true },
        keyFigures: { type: Type.ARRAY, items: keyFigureSchema, nullable: true },
        primarySourceAnalysis: { type: Type.ARRAY, items: primarySourceSnippetSchema, nullable: true },
        inDepthCaseStudies: { type: Type.ARRAY, items: caseStudySchema, nullable: true },
        
        // Language Arts
        grammarSpotlight: { type: Type.ARRAY, items: grammarRuleSchema, nullable: true },
        literaryDeviceAnalysis: { type: Type.ARRAY, items: literaryDeviceSchema, nullable: true },
        
        // Shared
        vocabularyDeepDive: { type: Type.ARRAY, items: vocabularyDeepDiveSchema, nullable: true },
    },
    required: ['chapterTitle', 'introduction', 'learningObjectives', 'keyConcepts', 'summary']
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
        },
        required: ['question', 'options', 'correctAnswer', 'explanation', 'conceptTitle']
    }
};

const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        recommendationText: { type: Type.STRING },
        nextChapterTitle: { type: Type.STRING, nullable: true },
        action: { type: Type.STRING, enum: ['REVIEW', 'CONTINUE', 'REVISE_PREREQUISITE'] },
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


export const getChapterContent = async (gradeLevel: string, subject: string, chapter: string, studentName: string, language: string): Promise<LearningModule> => {
    
    let subjectSpecificInstructions = '';
    const lowerCaseSubject = subject.toLowerCase();

    if (lowerCaseSubject.includes('mathematics')) {
        subjectSpecificInstructions = `
        **MATHEMATICS MASTERY FRAMEWORK (Apply these specific instructions for Mathematics content ONLY):**
        -   **Content Structure**: Ensure the response includes fields like \`keyTheoremsAndProofs\`, \`formulaDerivations\`, etc., where relevant.
        -   **Real-World Connection First**: Begin EVERY key concept explanation with a "Why is this important?" section, connecting it to a tangible, real-world Indian application (e.g., GST calculations for Percentages, rocket trajectories for Conic Sections).
        -   **Multiple Solution Methods**: For \`problemSolvingTemplates\` and \`categorizedProblems\`, provide at least three distinct methods for solving each major problem type where applicable. Label them clearly (e.g., "Method 1: Traditional," "Method 2: Logical Reasoning," "Method 3: Shortcut").
        -   **Vedic Mathematics Integration**: Within the \`learningTricksAndMnemonics\` section, include specific mental calculation shortcuts inspired by Vedic Mathematics relevant to the chapter.
        -   **Pattern Recognition & Logic**: Include a subsection in \`categorizedProblems\` or as an \`extensionActivity\` specifically designed for pattern recognition or logical reasoning related to the mathematical concepts.
        -   **Career & Heritage Connection**: Ensure the \`careerConnections\` section is robust, linking the chapter's concepts to modern Indian STEM careers (ISRO, data science, etc.). Also, explicitly mention contributions of Indian mathematicians like Aryabhata, Ramanujan, etc., in the relevant \`introduction\` or concept explanations.
        -   **Financial Literacy**: Where relevant (e.g., Percentages, Simple/Compound Interest, Linear Equations), add examples in the \`realWorldExample\` field that relate to an Indian financial contexts like banking (loans, interest rates), or taxes.
        `;
    } else if (['science', 'physics', 'chemistry', 'biology', 'evs'].some(s => lowerCaseSubject.includes(s))) {
        subjectSpecificInstructions = `
        **SCIENCE EXCELLENCE PROTOCOL (Apply these specific instructions for Science/Physics/Chemistry/Biology content ONLY):**
        -   **Content Structure**: Ensure the response includes fields like \`experiments\`, \`keyLawsAndPrinciples\`, \`scientificMethodApplications\`, \`currentDiscoveries\`, and \`environmentalAwareness\`.
        -   **Start with Observation**: Begin EVERY key concept explanation with an "Observe at Home" section, posing a simple question that an Indian student can explore using everyday materials (e.g., "Why does a steel spoon get hot when left in a cup of chai?").
        -   **Safety First**: For every experiment in the \`experiments\` section, the \`safetyGuidelines\` field MUST be detailed and practical, mentioning the need for adult supervision where necessary.
        -   **Connect to Indian Research**: Within the \`explanation\` of relevant concepts, explicitly reference achievements from Indian scientific bodies like ISRO (e.g., Chandrayaan, Mangalyaan), DRDO, or research from IITs.
        -   **Ecological Relevance**: The \`environmentalAwareness\` section MUST connect the chapter's topic to a specific Indian ecological challenge (e.g., water conservation in arid regions, air pollution in cities, Himalayan ecosystem preservation).
        -   **Public Health Connection**: Include a "Health Connection" within the \`realWorldExample\` field where applicable, linking the scientific concept to a public health issue in India (e.g., nutrition, vaccination, water-borne diseases).
        `;
    } else {
        // Fallback for other subjects.
        subjectSpecificInstructions = `
        -   **For Social Science, Commerce, Humanities**: Include \`timelineOfEvents\` and \`keyFigures\`. Connect to the Indian Constitution and current events.
        -   **For Language Arts**: Include \`grammarSpotlight\` and \`literaryDeviceAnalysis\` with examples from Indian literature.
        `;
    }
    
    // New logic for dynamic question generation instructions based on grade level and CBSE patterns
    const gradeNumber = parseInt(gradeLevel.replace(/[^0-9]/g, ''), 10) || 0;
    let questionGenerationInstructions = '';

    if (gradeNumber >= 11) {
        questionGenerationInstructions = `
        -   **categorizedProblems**: This is "PART 3 - PRACTICE & APPLICATION". Generate a comprehensive bank of at least 40 practice questions to ensure exhaustive coverage, making Alfanumrik the only resource a student needs. The questions must be meticulously designed based on the last 10 years of CBSE exam patterns for senior secondary classes. Distribute the questions across \`conceptual\`, \`application\`, and \`higherOrderThinking\` categories. Ensure a diverse mix of question types, including:
            -   Multiple Choice Questions (MCQs)
            -   Short Answer (SA-I, SA-II)
            -   Long Answer (LA)
            -   Case-Based/Source-Based Questions
            -   Assertion-Reasoning Questions
        A significant portion should be inspired by previous year board questions.
        `;
    } else if (gradeNumber >= 9) {
        questionGenerationInstructions = `
        -   **categorizedProblems**: This is "PART 3 - PRACTICE & APPLICATION". Generate a comprehensive bank of at least 35 practice questions to ensure students are fully prepared. The questions must be meticulously designed based on the last 10 years of CBSE exam patterns for high school. Distribute the questions across \`conceptual\`, \`application\`, and \`higherOrderThinking\` categories. Ensure a diverse mix of question types, including:
            -   Multiple Choice Questions (MCQs)
            -   Very Short Answer (VSA)
            -   Short Answer (SA)
            -   Long Answer (LA)
            -   Case-Based Questions
        Include variations of previous year CBSE board questions.
        `;
    } else if (gradeNumber >= 6) {
        questionGenerationInstructions = `
        -   **categorizedProblems**: This is "PART 3 - PRACTICE & APPLICATION". Generate a solid bank of at least 25 practice questions based on middle school examination patterns. Distribute the questions across \`conceptual\`, \`application\`, and \`higherOrderThinking\` categories. Ensure a mix of question types, including MCQs, Very Short Answer, and Short Answer questions.
        `;
    } else {
        // For grades below 6, keep it simpler.
        questionGenerationInstructions = `
        -   **categorizedProblems**: This is "PART 3 - PRACTICE & APPLICATION". Generate a set of 15 practice questions. Distribute them evenly with 5 for \`conceptual\`, 5 for \`application\`, and 5 for \`higherOrderThinking\`. The questions should be simple, direct, and focused on reinforcing the core concepts.
        `;
    }

    const prompt = `
        **SYSTEM ROLE:**
        You are an expert educational content creator specializing in the Indian K-12 CBSE curriculum. You have extensive experience in curriculum design, child psychology, and creating AI-powered learning materials. Your goal is to produce content that is NCERT-aligned, pedagogically sound, and engaging for students. Your entire response must be in the ${language} language.

        **CONTENT MISSION:**
        Create a world-class K-12 CBSE learning module for a ${gradeLevel} student on the chapter "${chapter}" in ${subject}. The content must exceed international standards while being perfectly aligned with Indian educational contexts and NEP 2020 guidelines. You are talking to the student, ${studentName}, but your content should be structured for a learning platform. The tone should be authoritative yet encouraging, like an expert mentor.

        **QUALITY STANDARDS (MANDATORY):**
        1.  **Pedagogical Excellence:** Follow Bloom's Taxonomy progression. Use scaffolded learning.
        2.  **CBSE Alignment:** Align with the latest CBSE syllabus (2024-25), NCERT textbooks, and NEP 2020 competency-based questions.
        3.  **Content Depth & Accuracy:** Provide multi-level explanations, real-world Indian examples, and address common misconceptions.
        4.  **Cultural Sensitivity:** Use Indian contexts, names, and examples.
        5.  **Factual Accuracy:** All information, especially scientific laws, historical dates, and mathematical formulas, must be factually correct and verifiable.

        **SAFETY & GROUNDING INSTRUCTIONS (CRUCIAL):**
        - If a topic is highly specialized, controversial, or not typically covered in the standard NCERT textbook for this grade, you MUST state that and provide a foundational, age-appropriate overview rather than inventing complex details.
        - Prioritize accuracy and pedagogical soundness above all else. Do not fabricate content to fill a field if the information is not readily available or suitable for the student's level.

        **CONTENT GENERATION GUIDE (Applying Principles to the JSON Schema):**
        -   **chapterTitle**: Must be "${chapter}".
        -   **introduction**: This is your "CONCEPT FOUNDATION". Start with a hook, introduce the concept with a familiar Indian scenario.
        -   **learningObjectives**: These are the CBSE Learning Outcomes. Be specific and measurable.
        -   **prerequisitesCheck**: A list of concepts the student MUST know before starting this chapter.
        -   **keyConcepts**: This is your "DETAILED EXPLANATION". Each concept should have:
            -   \`conceptTitle\`: A clear title for the concept.
            -   \`explanation\`: A step-by-step breakdown.
            -   \`realWorldExample\`: An application in an Indian context (e.g., technology, culture, economy).
            -   \`diagramDescription\`: A detailed description for a visual aid.
        ${questionGenerationInstructions}
        -   **commonMistakes**: This is for "ASSESSMENT & REMEDIATION". List common errors students make and their corrections.
        -   **selfAssessmentChecklist**: A list of "I can..." statements for students to check their understanding.
        -   **extensionActivities**: For advanced learners. Suggest projects or further reading.
        -   **remedialActivities**: For struggling students. Suggest simpler problems or foundational concept reviews.
        -   **interdisciplinaryConnections**: This is "PART 5". Explain how this chapter connects to other subjects.
        -   **careerConnections**: List potential career paths related to this topic.
        -   **technologyIntegration**: Suggest how technology (apps, simulations) can be used to learn this topic.
        -   **summary**: A concise summary of the key takeaways from the chapter.
        
        ${subjectSpecificInstructions}

        **FINAL INSTRUCTION:**
        Your entire output MUST be a JSON object that strictly follows the 'LearningModule' schema. Ensure all text fields embody the expert, culturally-relevant, and pedagogically sound principles outlined above. No markdown, just plain text with newline characters (\\n) for breaks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: learningModuleSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as LearningModule;
    } catch (error) {
        console.error("Error generating chapter content:", error);
        throw new Error("Failed to generate learning content from AI. Please try again.");
    }
};

export const generateQuiz = async (keyConcepts: Concept[], language: string, count: number = 5): Promise<QuizQuestion[]> => {
    const conceptTitles = keyConcepts.map(c => c.conceptTitle);
    const prompt = `
        Based on the following key concepts, create a ${count}-question multiple-choice quiz. The questions
        should test conceptual understanding and application of knowledge. The entire response, including all
        questions, options, answers, explanations, and concept titles, must be in the ${language} language.

        For each question:
        1.  Provide a clear question.
        2.  Provide four distinct options, with one being the correct answer.
        3.  Indicate the correct answer.
        4.  Provide a brief explanation for why the correct answer is right.
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
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz from AI. Please try again.");
    }
};

export const generatePracticeExercises = async (concept: Concept, grade: string, language: string): Promise<QuizQuestion[]> => {
    const prompt = `
        Generate 3 multiple-choice questions for a ${grade} student to practice and drill the specific concept of "${concept.conceptTitle}".
        The entire response, including all questions, options, answers, explanations, and concept titles, must be in the ${language} language.

        The questions should be focused on reinforcing the core skill of the concept, not on broad, complex problem-solving. They should be direct and clear.
        For example, if the concept is 'Simple Addition', questions should be direct calculations like '5 + 7 = ?'.
        If the concept is 'Identifying Nouns', questions should be like 'Which word in the following sentence is a noun?'.

        For each question:
        1. Provide a clear question.
        2. Provide four distinct options, with one being the correct answer.
        3. Indicate the correct answer.
        4. Provide a brief explanation for the answer.
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
        console.error("Error generating practice exercises:", error);
        throw new Error("Failed to generate practice exercises from AI. Please try again.");
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
        console.error("Error generating diagnostic test:", error);
        throw new Error("Failed to generate diagnostic test from AI.");
    }
}

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
    let lastError: Error | null = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: '16:9',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/png;base64,${base64ImageBytes}`;
            } else {
                throw new Error("No image was generated by the AI.");
            }
        } catch (error: any) {
            lastError = error;
            const errorMessage = (error.message || '').toLowerCase();
            
            // Production-ready fix: Identify quota errors and fail fast.
            if (errorMessage.includes('quota')) {
                console.error("Gemini API daily quota exceeded for image generation.");
                throw new Error("QUOTA_EXCEEDED"); // Custom error identifier for the UI to catch.
            }

            if (errorMessage.includes('rate limit') || (error.status === 'RESOURCE_EXHAUSTED')) {
                if (i < MAX_RETRIES - 1) {
                    const delayTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    console.warn(`Rate limit hit. Retrying in ${Math.round(delayTime / 1000)}s...`);
                    await delay(delayTime);
                    continue; 
                }
            }
            // For other, non-retriable errors, break the loop.
            break;
        }
    }
    
    console.error("Error generating diagram after multiple retries:", lastError);
    throw new Error("Failed to generate diagram from AI after multiple attempts.");
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
        console.error("Error generating recommendation:", error);
        throw new Error("Failed to generate recommendation from AI.");
    }
}

// --- New Functions for Teacher/Parent Reports ---

export const generateTeacherReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `
        Act as an experienced educator and data analyst. Based on the following comprehensive performance data for a student named ${student.name} (${student.grade}), 
        generate a detailed academic performance analysis report. The entire report must be in the ${language} language.

        **VERY IMPORTANT FORMATTING RULES:**
        - Each section heading MUST be enclosed in double asterisks and end with a colon. For example: **Overall Summary:**
        - Under each heading, use bullet points for lists. Each bullet point MUST start with a hyphen (-).

        The report MUST be structured with the following sections:
        1.  **Overall Summary:** A brief, holistic overview of the student's performance.
        2.  **Identified Strengths:** A bulleted list of subjects or chapters where the student has excelled (scores > 85%). Be specific.
        3.  **Areas for Improvement:** A bulleted list of subjects or chapters where the student is struggling (scores < 70%). Frame this constructively.
        4.  **Study Patterns & Trends:** A detailed analysis using bullet points for specific observations. Analyze:
            - Quiz vs. Practice Frequency.
            - Response to Difficulty (e.g., using exercises after a low quiz score).
            - Pacing and Consistency from timestamps.
        5.  **Actionable Recommendations:** A bulleted list of concrete, pedagogical suggestions for the teacher.

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
        console.error("Error generating teacher report:", error);
        throw new Error("Failed to generate teacher report from AI.");
    }
};

export const generateParentReport = async (student: Student, language: string): Promise<string> => {
    const prompt = `
        Act as a friendly and encouraging school counselor. Based on the following performance data for a student named ${student.name} (${student.grade}), 
        write a progress report for their parents. The entire report must be in the ${language} language.

        **VERY IMPORTANT FORMATTING RULES:**
        - Section headings should be friendly and enclosed in double asterisks, ending with a colon. For example: **Where ${student.name} is Shining:**
        - Use bullet points for lists. Each bullet point MUST start with a hyphen (-).

        The report should be easy to understand, positive, and supportive. Structure it with the following sections:
        1.  **A Quick Note on ${student.name}'s Progress:** A warm opening celebrating their effort.
        2.  **Where ${student.name} is Shining:** A bulleted list of subjects where they are doing well.
        3.  **Opportunities for Growth:** A bulleted list of areas to focus on, framed positively.
        4.  **How ${student.name} is Learning:** Simple, encouraging observations about their study habits in a bulleted list (e.g., consistency, resilience).
        5.  **Tips for Home Support:** A bulleted list of simple, actionable tips for parents.

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
        console.error("Error generating parent report:", error);
        throw new Error("Failed to generate parent report from AI.");
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
      console.error("Error analyzing student question:", error);
      throw new Error("Failed to get AI analysis for the question.");
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
        console.error("Error getting Fitto's answer:", error);
        throw new Error("Fitto is having trouble thinking right now. Please try again in a moment.");
    }
};

// --- New Functions for Adaptive Learning Engine ---

export const getAdaptiveNextStep = async (student: Student, language: string): Promise<AdaptiveAction> => {
    const prompt = `
        Act as an expert adaptive learning AI specializing in personalized K-12 education. Your goal is to determine the single most impactful next action for a student based on their complete performance history. The entire response must be in the ${language} language and adhere to the specified JSON schema.

        Student Profile:
        - Name: ${student.name}
        - Grade: ${student.grade}

        Performance History (includes quizzes, practice exercises, and potentially cognitive tests):
        ---
        ${JSON.stringify(student.performance, null, 2)}
        ---

        Your decision-making process MUST follow these rules in strict order of priority:

        **Priority 1: Address Foundational Weaknesses (Highest Priority)**
        - First, you MUST scan the entire performance history for any academic chapter (type 'quiz' or 'exercise') with a score below 70%.
        - IF you find one or more such chapters, you MUST select the one with the lowest score as your target.
        - IF the score for that chapter is below 60%, your action type MUST be 'ACADEMIC_REVIEW'.
        - IF the score is between 60% and 70% (inclusive), your action type MUST be 'ACADEMIC_PRACTICE'.
        - **Reasoning Requirement:** The 'reasoning' field MUST be an encouraging, user-facing sentence explicitly mentioning the chapter and why reviewing or practicing it is the most important step right now. Example for a low score: "Building a strong foundation in 'Chapter X' is key to success. Let's review it together to make sure we've got it!"
        - **Confidence Score:** Because this is based on clear data, set the 'confidence' score high, between 0.9 and 1.0.

        **Priority 2: Build on Strengths and Advance**
        - You will ONLY consider this priority IF there are NO academic scores below 70% in the performance history.
        - Identify the academic subject where the student has the highest average score.
        - Your action type MUST be 'ACADEMIC_NEW'. You should recommend the next uncompleted chapter in that subject.
        - **Reasoning Requirement:** The 'reasoning' field MUST be a positive, user-facing sentence praising their strength in the subject and encouraging them to tackle the next challenge. Example: "You're doing brilliantly in 'Subject Y'! Let's keep the momentum going with the next chapter."
        - **Confidence Score:** Since this is a logical progression, set the 'confidence' score between 0.8 and 0.9.

        **Priority 3: Foster Holistic Skills (Balanced Development)**
        - You will ONLY consider this priority IF the student has no scores below 70% AND has completed all chapters in their strongest subject, or if academic progress is generally very strong across the board.
        - Your action type MUST be either 'IQ_EXERCISE' or 'EQ_EXERCISE'. Alternate between them for variety if possible (check the history for the last cognitive exercise type).
        - **Reasoning Requirement:** The 'reasoning' field MUST be a light, engaging, user-facing sentence that explains the benefit of the cognitive exercise. Example: "Time for a fun brain teaser to sharpen your problem-solving skills!" or "Let's explore a scenario to boost our emotional intelligence."
        - **Confidence Score:** As this is a more general recommendation, set the 'confidence' score between 0.7 and 0.8.


        **MANDATORY FINAL INSTRUCTION:**
        The 'reasoning' and 'confidence' fields in the output JSON are the most critical parts of this task. They are NOT optional. The 'reasoning' must be a clear, user-facing string. The 'confidence' MUST be a number between 0.0 and 1.0 based on the rules above.

        Generate the JSON output now.
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
        console.error("Error getting adaptive next step:", error);
        throw new Error("Failed to generate a personalized path. Please try again.");
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
        console.error("Error generating IQ exercises:", error);
        throw new Error("Failed to generate IQ exercises.");
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
        console.error("Error generating EQ exercises:", error);
        throw new Error("Failed to generate EQ exercises.");
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
        console.error("Error generating curriculum outline:", error);
        throw new Error("Failed to generate curriculum outline from AI. Please try again.");
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
        1.  **Latest CBSE Syllabus (2024-25) Alignment:** Is the chapter structure and scope aligned with the most recent CBSE guidelines?
        2.  **NCERT Textbook Alignment:** Do the chapters and learning objectives correspond to the content in the standard NCERT textbooks for this grade?
        3.  **NEP 2020 Compliance:** Does the curriculum promote multidisciplinary learning, critical thinking, and conceptual understanding as mandated by the National Education Policy 2020?
        4.  **Age-Appropriate Content Standards:** Is the complexity and depth of the topics suitable for the cognitive level of a ${grade} student?
        5.  **Learning Outcome Achievements:** Are the learning objectives clear, measurable, and sufficient to ensure students achieve the required competencies for this subject at this level?
        6.  **Assessment Criteria Alignment:** Does the outline provide a solid foundation for creating fair and comprehensive assessments (including formative and summative)?

        **Output Format:**
        Your response MUST be a well-structured report. Use markdown-style headings for each section.
        - Start with a main heading: **Quality Report:**
        - Create a sub-heading for each of the 6 validation criteria (e.g., **1. CBSE Syllabus Alignment:**).
        - Under each sub-heading, provide a concise analysis.
        - Conclude with a final section: **Overall Summary & Recommendations:** where you summarize the findings and list actionable suggestions for improvement using bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error validating curriculum outline:", error);
        throw new Error("Failed to get validation report from AI. Please try again.");
    }
};