import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateReportRequest, ReportData, ScheduleEntry } from '../types';
import { logger } from '../utils/logger';
import { TIME_SLOTS, LUNCH_SLOT, PROVIDERS } from '../constants';

export class AIService {
  private readonly provider: string;
  private readonly apiKey?: string;
  private readonly modelName?: string;

  constructor(provider: string, apiKey?: string, modelName?: string) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async generateSchedule(request: GenerateReportRequest): Promise<ReportData> {
    const { tasks, employee_name, position, report_date } = request;
    
    const nonLunchSlots = TIME_SLOTS.filter(s => s !== LUNCH_SLOT);
    const slotList = nonLunchSlots.map(s => `- ${s}`).join('\n');
    
    const prompt = `You are an assistant that fills an End of Day work report.

The report has these hourly slots (lunch break is fixed at ${LUNCH_SLOT}, do NOT include it):
${slotList}

Given the user's daily task summary, distribute the work intelligently across these 7 slots. Each slot **must** have both a concise "activity" and a brief "description" (1-2 sentences).

Return **only** a valid JSON object with:
- "employee_name"
- "position"  
- "date"
- "schedule": an array of objects with keys "slot", "activity", "description". Include exactly the above 7 slots.

Use double quotes for all keys and string values. No trailing commas. Do not include any text outside the JSON.

User's tasks: ${tasks}
Employee: ${employee_name}
Position: ${position}
Date: ${report_date}`;

    let rawResponse: string;
    const providerConfig = PROVIDERS[this.provider as keyof typeof PROVIDERS];
    const timeoutMs = providerConfig?.timeout || 30000;

    try {
      switch (this.provider) {
        case 'Groq (Fastest)':
          rawResponse = await this.callGroq(prompt, timeoutMs);
          break;
        case 'OpenAI (ChatGPT)':
          rawResponse = await this.callOpenAI(prompt, timeoutMs);
          break;
        case 'Google Gemini':
          rawResponse = await this.callGemini(prompt, timeoutMs);
          break;
        case 'Ollama (local)':
          rawResponse = await this.callOllama(prompt, timeoutMs);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      logger.error('AI service error:', error);
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const parsedData = this.parseAIResponse(rawResponse, employee_name, position, report_date);
    return this.formatSchedule(parsedData, employee_name, position, report_date);
  }

  private async callGroq(prompt: string, timeout: number): Promise<string> {
    if (!this.apiKey) throw new Error('Groq API key is required');
    const client = new Groq({ apiKey: this.apiKey });
    const model = this.modelName || 'llama-3.1-8b-instant';
    
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 400,
      timeout
    });
    
    return response.choices[0]?.message?.content || '';
  }

  private async callOpenAI(prompt: string, timeout: number): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API key is required');
    const client = new OpenAI({ apiKey: this.apiKey });
    const model = this.modelName || 'gpt-4o-mini';
    
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 400,
      timeout
    });
    
    return response.choices[0]?.message?.content || '';
  }

  private async callGemini(prompt: string, timeout: number): Promise<string> {
    if (!this.apiKey) throw new Error('Gemini API key is required');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ 
      model: this.modelName || 'gemini-1.5-flash' 
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: 400,
      },
    });
    
    return result.response.text();
  }

  private async callOllama(prompt: string, timeout: number): Promise<string> {
    const client = new OpenAI({
      baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
      apiKey: 'dummy'
    });
    const model = this.modelName || 'phi3';
    
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 400,
      timeout
    });
    
    return response.choices[0]?.message?.content || '';
  }

  private parseAIResponse(raw: string, defaultName: string, defaultPos: string, defaultDate: string): any {
    try {
      let cleaned = raw.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '');
      
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }
      
      let jsonStr = cleaned.substring(start, end + 1);
      
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        jsonStr = jsonStr.replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(jsonStr);
      }
    } catch (error) {
      logger.error('JSON parsing failed:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private formatSchedule(data: any, defaultName: string, defaultPos: string, defaultDate: string): ReportData {
    const schedule = data.schedule || [];
    const scheduleMap = new Map();
    
    schedule.forEach((entry: any) => {
      if (entry.slot) {
        scheduleMap.set(entry.slot.trim().toLowerCase(), entry);
      }
    });

    const completeSchedule: ScheduleEntry[] = TIME_SLOTS.map(slot => {
      if (slot === LUNCH_SLOT) {
        return {
          slot,
          activity: 'Lunch Break',
          description: 'Lunch Break'
        };
      }
      
      const existing = scheduleMap.get(slot.toLowerCase());
      if (existing) {
        return {
          slot,
          activity: existing.activity || 'No specific task',
          description: existing.description || 'No description provided.'
        };
      }
      
      return {
        slot,
        activity: 'No specific task',
        description: 'No description provided.'
      };
    });

    return {
      employee_name: data.employee_name || defaultName,
      position: data.position || defaultPos,
      date: data.date || defaultDate,
      schedule: completeSchedule
    };
  }
}