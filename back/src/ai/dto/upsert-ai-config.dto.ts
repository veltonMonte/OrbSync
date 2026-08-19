export type AiProvider = 'gemini' | 'openai' | 'anthropic';

export class UpsertAiConfigDto {
  provider: AiProvider;
  model: string;
  apiKey: string;
}
