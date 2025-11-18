import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'OPENAI_API_KEY is not set in environment variables',
          message: 'Please add OPENAI_API_KEY to your .env.local file and restart the server.'
        },
        { status: 500 }
      );
    }

    // Parse the request body
    const workerHealthData = await request.json();

    // Prepare the prompt for OpenAI
    const prompt = `You are a health advisor AI analyzing worker safety data. Provide a concise, actionable health assessment based on the following data:

Worker Information:
- Name: ${workerHealthData.name || 'Unknown'}
- Age: ${workerHealthData.age || 'N/A'}
- Worker ID: ${workerHealthData.workerId || 'N/A'}

Vitals:
- Heart Rate: ${workerHealthData.vitals?.heartRate || 'N/A'} bpm
- Body Temperature: ${workerHealthData.vitals?.bodyTemperature || 'N/A'} °C
- Blood Pressure: ${workerHealthData.vitals?.bloodPressure || 'N/A'}

Environment:
- Zone: ${workerHealthData.environment?.zone || 'Unknown'}
- Temperature: ${workerHealthData.environment?.temperature || 'N/A'} °C
- Humidity: ${workerHealthData.environment?.humidity || 'N/A'}%

Risk Score: ${workerHealthData.riskScore || 0}%
Recent Incidents: ${workerHealthData.recentIncidents?.join(', ') || 'None'}

Please provide:
1. A brief health status assessment
2. Any immediate concerns or recommendations
3. Suggested actions if risk is elevated
Keep the response under 200 words and be practical and actionable.`;

    // Call OpenAI API
    const openaiUrl = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional health advisor AI specializing in worker safety and health assessments. Provide clear, actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      console.error('OpenAI API Error:', errorText);
      
      // Check for quota/rate limit errors
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const errorMessage = errorData?.error?.message || '';
        
        // Check if it's a rate limit or quota issue
        if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
          return NextResponse.json(
            { 
              error: 'Quota Exceeded',
              message: 'You have exceeded your OpenAI API quota. This usually means: 1) You\'ve used all your free credits, 2) Your billing limit has been reached, or 3) You need to add payment method. Please check your OpenAI account at https://platform.openai.com/account/billing and add credits or upgrade your plan.',
              retryAfter: retryAfter ? parseInt(retryAfter) : null
            },
            { status: 429 }
          );
        } else {
          // Rate limit - too many requests per minute
          return NextResponse.json(
            { 
              error: 'Rate Limit Exceeded',
              message: `You're making requests too quickly. Please wait ${retryAfter || '1-2'} minutes before trying again. To avoid this: 1) Don't click the button multiple times quickly, 2) Wait between requests, 3) Consider implementing request throttling.`,
              retryAfter: retryAfter ? parseInt(retryAfter) : null
            },
            { status: 429 }
          );
        }
      }
      
      // Check for specific error types
      if (response.status === 400) {
        return NextResponse.json(
          { 
            error: 'Invalid API request to OpenAI',
            message: errorData?.error?.message || 'The request to OpenAI API was malformed. Please check the request format.'
          },
          { status: 400 }
        );
      } else if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Invalid or unauthorized API key',
            message: 'The OPENAI_API_KEY is invalid or has expired. Please generate a new API key from https://platform.openai.com/api-keys and update your .env.local file.'
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'OpenAI API request failed',
          message: errorData?.error?.message || `OpenAI API returned status ${response.status}. Please check your API key and try again.`
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the generated text from OpenAI's response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { 
          error: 'Invalid response from OpenAI',
          message: 'OpenAI API returned an unexpected response format.'
        },
        { status: 500 }
      );
    }

    const report = data.choices[0].message.content;

    return NextResponse.json({ report });

  } catch (error: any) {
    console.error('Error in OpenAI API route:', error);
    
    // Handle network errors
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Network error',
          message: 'Failed to connect to OpenAI API. Please check your internet connection.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred while processing your request.'
      },
      { status: 500 }
    );
  }
}

