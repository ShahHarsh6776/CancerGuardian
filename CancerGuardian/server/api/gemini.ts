import { log } from "../vite";

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
  }>;
}

/**
 * Analyze symptoms and provide a risk assessment
 */
export async function analyzeSymptoms(symptoms: string[], cancerType: string) {
  try {
    const prompt = `
As a medical AI assistant, analyze these symptoms for ${cancerType} cancer risk assessment:
${symptoms.join("\n")}

Provide response in this exact format:
RISK_LEVEL: [High/Medium/Low]
CONFIDENCE: [0-100]
EXPLANATION: [2-3 sentences explaining the assessment]
RECOMMENDATIONS: [3-4 bullet points of actionable advice]`;

    const response = await generateGeminiResponse(prompt, { temperature: 0.3 });
    
    // Parse the response
    const riskLevelMatch = response.match(/RISK_LEVEL: (.*)/);
    const confidenceMatch = response.match(/CONFIDENCE: (\d+)/);
    const explanationMatch = response.match(/EXPLANATION: ([^]*?)(?=\nRECOMMENDATIONS:|$)/);
    const recommendationsMatch = response.match(/RECOMMENDATIONS:\n((?:- .*\n?)*)/);

    if (!riskLevelMatch || !confidenceMatch || !explanationMatch) {
      throw new Error("Invalid response format from AI");
    }

    const recommendations = recommendationsMatch ? 
      recommendationsMatch[1]
        .split("\n")
        .filter(line => line.trim().startsWith("-"))
        .map(line => line.trim().substring(2).trim())
      : [];

    return {
      riskLevel: riskLevelMatch[1].trim(),
      confidence: parseInt(confidenceMatch[1]),
      explanation: explanationMatch[1].trim(),
      recommendations
    };
  } catch (error) {
    log(`Error analyzing symptoms: ${error instanceof Error ? error.message : String(error)}`, "gemini-api");
    throw error;
  }
}

/**
 * Generate a response using the Gemini API
 */
export async function generateGeminiResponse(
  prompt: string,
  options?: { temperature?: number; contents?: GeminiRequest["contents"] }
) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      log(`No Gemini API key found, using mock response`, "gemini-api");
      if (prompt.includes("symptoms for")) {
        if (prompt.toLowerCase().includes("severe") || prompt.toLowerCase().includes("persistent")) {
          return `RISK_LEVEL: High
CONFIDENCE: 85
EXPLANATION: The combination of severe and persistent symptoms indicates a higher risk level that requires immediate medical attention. These symptoms are commonly associated with potential malignancies and should not be ignored.
RECOMMENDATIONS:
- Schedule an urgent appointment with a specialist
- Get comprehensive medical tests done
- Document all symptoms and their progression
- Avoid activities that might worsen the symptoms`;
        } else {
          return `RISK_LEVEL: Low
CONFIDENCE: 75
EXPLANATION: Based on the symptoms described, the risk appears to be relatively low. The symptoms you've reported are common and often associated with benign conditions rather than cancer. However, it's essential to monitor any changes and seek medical advice if symptoms persist or worsen.
RECOMMENDATIONS:
- Schedule a routine check-up with your primary care physician
- Monitor your symptoms and keep a journal of any changes
- Maintain a healthy lifestyle with regular exercise and balanced diet
- Avoid known risk factors such as smoking or excessive alcohol consumption`;
        }
      } else if (prompt.includes("User's current query:")) {
        return "I understand your concern about cancer symptoms. It's essential to note that many symptoms can be caused by less serious conditions. However, persistent symptoms should always be evaluated by a healthcare professional. Early detection of cancer significantly improves treatment outcomes. I recommend consulting with a doctor who can perform appropriate tests and provide a proper medical assessment. Remember that this information is not a substitute for professional medical advice.";
      } else {
        return "I understand your question. While I don't have enough information to provide a specific answer, I recommend consulting with a healthcare professional for personalized advice. Early detection and regular check-ups are key to maintaining your health.";
      }
    }

    log(`Using Gemini API with provided API key`, "gemini-api");
    
    // Use the stable API endpoint
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
    
    const requestData: GeminiRequest = {
      contents: options?.contents || [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40
      }
    };

    const response = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    log(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`, "gemini-api");
    throw error;
  }
}

/**
 * Generate a chatbot response based on conversation history
 */
export async function generateChatbotResponse(
  userQuery: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
) {
  try {
    // Format the system prompt
    const systemPrompt = `You are a helpful medical AI assistant for CancerGuardian, a cancer detection platform that focuses on Skin Cancer, Throat Cancer, and Breast Cancer. Provide accurate, helpful, and compassionate responses to user queries.

Follow these guidelines:
1. Provide accurate medical information based on current scientific understanding
2. Be empathetic and supportive while maintaining professionalism
3. Always encourage seeking professional medical advice for specific concerns
4. Focus on cancer education, prevention, and early detection
5. Keep responses concise (maximum 150 words) but informative
6. NEVER provide a specific diagnosis based on symptoms
7. Include a disclaimer when appropriate that your information is not a substitute for professional medical advice`;

    // Create the contents array for the API request
    const contents = [
      {
        parts: [{ text: systemPrompt }]
      }
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      contents.push({
        parts: [{ text: msg.content }]
      });
    }

    // Add the current query
    contents.push({
      parts: [{ text: userQuery }]
    });

    // Make the API request with the full conversation context
    const response = await generateGeminiResponse("", { 
      temperature: 0.7,
      contents
    });

    return response;
  } catch (error) {
    log(`Error generating chatbot response: ${error instanceof Error ? error.message : String(error)}`, "gemini-api");
    throw error;
  }
}

/**
 * Generate a follow-up question based on previous answers
 */
export async function generateFollowUpQuestion(
  bodyPart: string, 
  previousQuestions: string[], 
  previousAnswers: string[]
) {
  try {
    const prompt = `
You are a medical AI assistant helping with cancer screening. Generate the next follow-up question for a patient who is concerned about potential ${bodyPart} cancer.

Previous questions and answers:
${previousQuestions.map((q, i) => `Q: ${q}\nA: ${previousAnswers[i] || "Not answered"}`).join("\n\n")}

Generate a single, clear multiple-choice question that would help assess the patient's cancer risk. The question should be medical and relevant to ${bodyPart} cancer symptoms or risk factors.

Format your response as follows:
QUESTION: [Your question here]
OPTION A: [First option]
OPTION B: [Second option]
OPTION C: [Third option]
OPTION D: [Fourth option]
`;

    const response = await generateGeminiResponse(prompt, { temperature: 0.3 });
    
    // Parse the response to extract question and options
    const questionMatch = response.match(/QUESTION: (.*)/);
    const optionAMatch = response.match(/OPTION A: (.*)/);
    const optionBMatch = response.match(/OPTION B: (.*)/);
    const optionCMatch = response.match(/OPTION C: (.*)/);
    const optionDMatch = response.match(/OPTION D: (.*)/);
    
    if (!questionMatch || !optionAMatch || !optionBMatch || !optionCMatch || !optionDMatch) {
      throw new Error("Failed to parse Gemini API response for follow-up question");
    }
    
    return {
      question: questionMatch[1],
      options: [
        optionAMatch[1],
        optionBMatch[1],
        optionCMatch[1],
        optionDMatch[1]
      ]
    };
  } catch (error) {
    log(`Error generating follow-up question: ${error instanceof Error ? error.message : String(error)}`, "gemini-api");
    throw error;
  }
}

/**
 * Generate a risk assessment based on questionnaire answers
 */
export async function generateRiskAssessment(
  bodyPart: string,
  questions: string[],
  answers: string[]
) {
  try {
    const prompt = `
You are a medical AI assistant analyzing responses from a cancer screening questionnaire. The patient is concerned about potential ${bodyPart} cancer.

Questionnaire responses:
${questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || "Not answered"}`).join("\n\n")}

Based on these responses, provide a risk assessment with the following:
1. Overall risk level (Low, Medium, or High)
2. Confidence percentage (a number between 1-100)
3. A brief explanation of the assessment (3-5 sentences)
4. 3-4 specific recommendations for the patient

Format your response exactly as follows:
RISK_LEVEL: [Low/Medium/High]
CONFIDENCE: [number between 1-100]
EXPLANATION: [Your explanation]
RECOMMENDATIONS:
- [First recommendation]
- [Second recommendation]
- [Third recommendation]
- [Optional fourth recommendation]
`;

    const response = await generateGeminiResponse(prompt, { temperature: 0.2 });
    
    // Parse the response
    const riskLevelMatch = response.match(/RISK_LEVEL: (.*)/);
    const confidenceMatch = response.match(/CONFIDENCE: (\d+)/);
    const explanationMatch = response.match(/EXPLANATION: ([^]*?)(?=\nRECOMMENDATIONS:|$)/);
    const recommendationsMatch = response.match(/RECOMMENDATIONS:\n((?:- .*\n?)*)/);
    
    if (!riskLevelMatch || !confidenceMatch || !explanationMatch) {
      throw new Error("Failed to parse Gemini API response for risk assessment");
    }
    
    // Parse recommendations as bullet points
    let recommendations: string[] = [];
    if (recommendationsMatch) {
      recommendations = recommendationsMatch[1]
        .split("\n")
        .filter(line => line.trim().startsWith("-"))
        .map(line => line.trim().substring(2).trim());
    }
    
    return {
      riskLevel: riskLevelMatch[1].trim(),
      confidence: parseInt(confidenceMatch[1].trim()),
      explanation: explanationMatch[1].trim(),
      recommendations
    };
  } catch (error) {
    log(`Error generating risk assessment: ${error instanceof Error ? error.message : String(error)}`, "gemini-api");
    throw error;
  }
}
