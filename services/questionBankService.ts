import { GoogleGenAI, Type } from "@google/genai";
import { QuestionBankItem } from '../types';

// The API key is sourced from the `process.env.API_KEY` environment variable.
// To use a new key (e.g., from Vertex AI Studio), set this variable in your deployment environment.
// For security reasons, do not hard-code the key directly in the code.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const questionBankItemSchema = {
    type: Type.OBJECT,
    properties: {
        questionText: { type: Type.STRING },
        questionType: { type: Type.STRING, enum: ['MCQ', 'Short Answer', 'Long Answer'] },
        difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
        bloomTaxonomy: { type: Type.STRING, enum: ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'] },
        isCompetencyBased: { type: Type.BOOLEAN },
        isPreviousYearQuestion: { type: Type.BOOLEAN },
        // MCQ specific
        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        correctAnswer: { type: Type.STRING, nullable: true },
        explanation: { type: Type.STRING, nullable: true },
        // Short/Long Answer specific
        markingScheme: { type: Type.STRING, nullable: true },
        modelAnswer: { type: Type.STRING, nullable: true },
    },
    required: [
        'questionText', 
        'questionType', 
        'difficulty', 
        'bloomTaxonomy', 
        'isCompetencyBased', 
        'isPreviousYearQuestion'
    ]
};

const questionBankSchema = {
    type: Type.ARRAY,
    items: questionBankItemSchema
};


export const generateQuestionBankQuestions = async (grade: string, subject: string, chapter: string, language: string): Promise<QuestionBankItem[]> => {
    const prompt = `
        Act as an expert question paper setter for the Indian CBSE curriculum. Your task is to generate a comprehensive and diverse sample of 10-15 questions for a question bank.
        The questions must be for a ${grade} student, studying the chapter "${chapter}" in the subject "${subject}".
        The entire response, including all text, explanations, and answers, must be in the ${language} language and adhere to the specified JSON schema.

        For each question, you MUST provide the following metadata:
        1.  **questionText**: The full text of the question.
        2.  **questionType**: Must be one of 'MCQ', 'Short Answer', or 'Long Answer'. Generate a mix of these types.
        3.  **difficulty**: Must be one of 'Easy', 'Medium', or 'Hard'.
        4.  **bloomTaxonomy**: Assign a level from Bloom's Taxonomy ('Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating').
        5.  **isCompetencyBased**: A boolean. Set to true if the question requires application of knowledge or skills in a new situation, rather than just rote recall.
        6.  **isPreviousYearQuestion**: A boolean. Set to true if the question is in the style of, or directly from, a previous year's CBSE board question.

        Based on the 'questionType', provide these additional details:
        -   **For 'MCQ'**:
            -   \`options\`: An array of four distinct strings.
            -   \`correctAnswer\`: The correct string from the options.
            -   \`explanation\`: A detailed explanation of why the correct answer is right.
        -   **For 'Short Answer' and 'Long Answer'**:
            -   \`markingScheme\`: A detailed breakdown of how marks would be awarded (e.g., "1 mark for definition, 2 marks for example").
            -   \`modelAnswer\`: A comprehensive and well-structured model answer.

        Ensure the generated questions cover a range of difficulties and cognitive skills as per Bloom's Taxonomy. The total number of questions in the final array should be between 10 and 15.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionBankSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as QuestionBankItem[];
    } catch (error) {
        console.error("Error generating question bank questions:", error);
        throw new Error("Failed to generate questions from AI. Please try again.");
    }
};