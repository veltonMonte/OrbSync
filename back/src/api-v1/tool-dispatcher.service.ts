import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Agent, Action } from '@prisma/client';
import { OpenAI } from 'openai';

@Injectable()
export class ToolDispatcherService {
  private readonly logger = new Logger(ToolDispatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main entry point to process an incoming message from a customer
   * through an Agent's AI and execute any necessary tools/actions.
   */
  async processMessageAndExecuteActions(
    agent: Agent,
    customerMessage: string,
    history: any[] = []
  ) {
    this.logger.log(`Processing message for agent: ${agent.name}`);
    
    // 1. Get Agent's available Actions
    const actions = await this.prisma.action.findMany({
      where: { agentId: agent.id },
    });

    // 2. Convert Actions to OpenAI Tools format
    const tools = actions.map((action: Action) => ({
      type: 'function' as const,
      function: {
        name: action.name,
        description: action.description,
        parameters: action.schemaJson ? (action.schemaJson as any) : { type: 'object', properties: {} },
      },
    }));

    // 3. Setup AI Client (BYOK vs PRO routing)
    const openai = this.getAiClientForAgent(agent);

    // 4. Build Messages Payload
    const messages: any[] = [
      { role: 'system', content: agent.systemPrompt || 'You are a helpful assistant.' },
      ...history,
      { role: 'user', content: customerMessage }
    ];

    // 5. Initial AI Call
    let response = await openai.chat.completions.create({
      model: agent.planType === 'PRO' ? 'gpt-4o-mini' : 'gpt-4o', // Defaulting to OpenAI for this MVP example
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    let responseMessage = response.choices[0].message;

    // 6. Handle Tool Calls Loop
    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage); // append assistant tool call message to history

      for (const toolCall of responseMessage.tool_calls) {
        const actionName = (toolCall as any).function.name;
        const actionArgs = JSON.parse((toolCall as any).function.arguments);
        
        // Find the action in DB
        const action = actions.find((a: Action) => a.name === actionName);
        let actionResult = '';

        if (action) {
          // Execute HTTP Webhook to the client's API
          actionResult = await this.executeHttpAction(action, actionArgs);
        } else {
          actionResult = JSON.stringify({ error: 'Action not found' });
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: actionName,
          content: actionResult,
        });
      }

      // 7. Call AI again with the tool results
      response = await openai.chat.completions.create({
        model: agent.planType === 'PRO' ? 'gpt-4o-mini' : 'gpt-4o',
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });
      responseMessage = response.choices[0].message;
    }

    // 8. Return final AI response
    return responseMessage.content;
  }

  private getAiClientForAgent(agent: Agent): OpenAI {
    if (agent.planType === 'BASIC') {
      const perms = (agent.permissions as any) || {};
      if (!perms.customApiKey) {
        throw new Error('BASIC plan requires a custom API Key on the Agent.');
      }
      return new OpenAI({ apiKey: perms.customApiKey });
    }
    
    // For PRO, we use the system's global internal API key
    // In production, this comes from process.env.OPENAI_API_KEY
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private async executeHttpAction(action: Action, args: any): Promise<string> {
    this.logger.log(`Executing Action [${action.method}] ${action.endpointUrl}`);
    
    try {
      // Very basic URL templating for GET params (e.g. /orders/{id})
      let url = action.endpointUrl;
      for (const key of Object.keys(args)) {
        if (url.includes(`{${key}}`)) {
          url = url.replace(`{${key}}`, encodeURIComponent(args[key]));
          delete args[key]; // remove from body since it's in URL
        }
      }

      const options: RequestInit = {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...(action.headers as Record<string, string> || {}),
        }
      };

      if (action.method !== 'GET' && action.method !== 'HEAD') {
        options.body = JSON.stringify(args);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const text = await response.text();
      const endTime = Date.now();

      // Log the action execution
      await this.prisma.actionLog.create({
        data: {
          actionId: action.id,
          actionName: action.name,
          status: response.status,
          payload: args,
          response: text.substring(0, 2000), // truncate just in case
        }
      });

      return text;
    } catch (error) {
      this.logger.error(`Failed to execute action ${action.name}: ${error.message}`);
      return JSON.stringify({ error: error.message });
    }
  }
}
