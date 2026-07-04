import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async createChat(dto: CreateChatDto, userId: string) {
    return this.prisma.aIChat.create({
      data: { ...dto, userId },
      include: { messages: true },
    });
  }

  async findAllChats(userId: string) {
    return this.prisma.aIChat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findOneChat(id: string) {
    const chat = await this.prisma.aIChat.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!chat) {
      throw new NotFoundException(`Chat com ID ${id} não encontrado`);
    }
    return chat;
  }

  async sendMessage(chatId: string, dto: SendMessageDto, userId: string) {
    const chat = await this.findOneChat(chatId);

    // Save user message
    const userMessage = await this.prisma.aIMessage.create({
      data: {
        chatId,
        role: 'USER',
        content: dto.content,
      },
    });

    let aiResponseText = '';

    if (this.configService.get<string>('GEMINI_API_KEY')) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        
        // Build Context
        const workspaces = await this.prisma.workspace.findMany({
          where: { members: { some: { userId } } },
          include: { 
            projects: { 
              include: { 
                boards: { 
                  include: { 
                    columns: { 
                      include: { 
                        cards: true 
                      } 
                    } 
                  } 
                } 
              } 
            } 
          }
        });

        let contextDump = 'DADOS DO USUÁRIO NO SISTEMA ORBSYNC:\n';
        for (const ws of workspaces) {
          contextDump += `Workspace: ${ws.name}\n`;
          for (const proj of ws.projects) {
            contextDump += `  Projeto: ${proj.name}\n`;
            for (const board of proj.boards) {
              contextDump += `    Quadro: ${board.name}\n`;
              for (const col of board.columns) {
                contextDump += `      Coluna: ${col.name}\n`;
                for (const card of col.cards) {
                  contextDump += `        Tarefa: ${card.title} (Status: ${card.status}, Prioridade: ${card.priority})\n`;
                }
              }
            }
          }
        }

        const systemPrompt = `Você é o assistente virtual do OrbSync, uma plataforma de produtividade. 
Você tem acesso aos dados do usuário. Seja direto e ajude-o com as informações abaixo.
${contextDump}

Se o usuário pedir para você CRIAR UMA AUTOMAÇÃO ou WORKFLOW (ex: "crie um fluxo de enviar email"), você DEVE retornar a configuração JSON, DENTRO do seguinte bloco de código markdown exato:
\`\`\`json workflow
{
  "name": "Nome da Automação",
  "trigger": "CARD_MOVED", // ou TERMINAL_COMMAND, DUE_DATE_REACHED
  "actionRules": {
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Gatilho", "icon": "zap", "targetColumn": "DONE" }
      },
      {
        "id": "action-1",
        "type": "action",
        "position": { "x": 400, "y": 100 },
        "data": { "label": "Ação", "icon": "mail", "mailTo": "equipe@empresa.com" }
      }
    ],
    "edges": [
      { "id": "edge-1", "source": "trigger-1", "target": "action-1", "sourceHandle": "a", "targetHandle": "a" }
    ]
  }
}
\`\`\`
Nota: os ícones possíveis para trigger são zap, clock, terminal. Para action são mail, terminal, doc, ai. Você pode encadear múltiplas ações.

Histórico do chat:
${chat.messages.map(m => `${m.role}: ${m.content}`).join('\n')}
USER: ${dto.content}

Instruções adicionais: Responda apenas como o assistente (ASSISTANT), não repita o prefixo "ASSISTANT: ". Formate bem sua resposta com Markdown.`;

        const result = await model.generateContent(systemPrompt);
        aiResponseText = result.response.text();
        
        // Verificar se há bloco de workflow gerado
        const workflowRegex = /```json workflow\n([\s\S]*?)\n```/;
        const match = aiResponseText.match(workflowRegex);
        if (match) {
          try {
            const workflowJson = JSON.parse(match[1]);
            const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { workspaceMemberships: true } });
            if (user && user.workspaceMemberships.length > 0) {
              const workspaceId = user.workspaceMemberships[0].workspaceId;
              
              await this.prisma.automation.create({
                data: {
                  name: workflowJson.name || 'Automação IA',
                  trigger: workflowJson.trigger || 'CARD_MOVED',
                  actionRules: workflowJson.actionRules,
                  workspaceId: workspaceId,
                }
              });
              
              // Remove o JSON verboso da resposta final pro usuario
              aiResponseText = aiResponseText.replace(match[0], `\n\n🎉 **O fluxo "${workflowJson.name || 'Automação IA'}" foi gerado e salvo com sucesso na sua página de Automações!**\n\n`);
            }
          } catch(e) {
            this.logger.error("Falha ao parsear JSON de workflow", e);
          }
        }
      } catch (e) {
        this.logger.error('Erro ao chamar Gemini API', e);
        aiResponseText = 'Desculpe, ocorreu um erro ao comunicar com a inteligência artificial.';
      }
    } else {
      aiResponseText = `[Modo Mock - Chave GEMINI_API_KEY não configurada no backend]\n\nRecebi sua mensagem: "${dto.content}".\nPara que eu funcione de verdade, você precisa adicionar a variável GEMINI_API_KEY no arquivo .env do backend.`;
    }

    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        chatId,
        role: 'ASSISTANT',
        content: aiResponseText,
      },
    });

    return { userMessage, assistantMessage };
  }

  async deleteChat(id: string) {
    await this.findOneChat(id);
    await this.prisma.aIChat.delete({ where: { id } });
  }

  async generateDoc(prompt: string, userId: string) {
    if (!this.configService.get<string>('GEMINI_API_KEY')) {
      return { html: `<h1>[Mock] Documento Gerado</h1><p>Você pediu: ${prompt}</p><p>Configure a GEMINI_API_KEY no backend para gerar conteúdo real.</p>` };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      
      const systemPrompt = `Você é um assistente de produtividade especializado em gerar documentos estruturados (contratos, relatórios, atas, rascunhos, etc.).
O usuário pedirá um tipo de documento.
Sua única função é retornar o conteúdo no formato HTML limpo (usando <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>, etc.).
NÃO retorne formatação markdown (como \`\`\`html). Retorne APENAS o código HTML puro que será renderizado dentro de um editor.
Não inclua <html>, <head> ou <body>, apenas o conteúdo interno.

PEDIDO DO USUÁRIO: ${prompt}`;

      const result = await model.generateContent(systemPrompt);
      let html = result.response.text();
      // Remove possible markdown formatting if the model disobeys
      html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      
      return { html };
    } catch (e) {
      this.logger.error('Erro ao gerar documento com IA', e);
      return { html: '<p>Ocorreu um erro ao gerar o documento com a inteligência artificial.</p>' };
    }
  }

  async generateTerminalCommand(prompt: string, userId: string) {
    if (!this.configService.get<string>('GEMINI_API_KEY')) {
      return { command: `# [Mock] Configure a GEMINI_API_KEY no backend para gerar o comando: ${prompt}` };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      
      const systemPrompt = `Você é um engenheiro DevOps especialista em Linux e Bash.
O usuário pedirá para você criar um comando no terminal.
Você deve retornar APENAS o comando puro, em uma única linha (ou múltiplas, se for um script bash, mas foque na simplicidade).
NÃO retorne blocos de código markdown (como \`\`\`bash).
NÃO forneça NENHUMA explicação.
Se o pedido for impossível ou destrutivo de forma grave (ex: rm -rf /), retorne 'echo "Comando perigoso ou inválido bloqueado"'.

PEDIDO DO USUÁRIO: ${prompt}`;

      const result = await model.generateContent(systemPrompt);
      let command = result.response.text();
      // Limpa possíveis markdowns se o modelo desobedecer
      command = command.replace(/^```(bash|sh|shell)?\n?/, '').replace(/\n?```$/, '').trim();
      
      return { command };
    } catch (e) {
      this.logger.error('Erro ao gerar comando de terminal com IA', e);
      return { command: 'echo "Erro ao comunicar com a inteligência artificial"' };
    }
  }

  async analyzeEmailForTasks(emailContent: string, userId: string): Promise<{ hasTask: boolean, suggestedActionMessage?: string, actionPayload?: any }> {
    if (!this.configService.get<string>('GEMINI_API_KEY')) {
      this.logger.debug('Modo Mock ativado para IA (analyzeEmailForTasks).');
      return { 
        hasTask: true, 
        suggestedActionMessage: 'Mock: O cliente pediu um orçamento. Quer criar um Card?',
        actionPayload: {
          type: 'CREATE_CARD',
          data: { title: 'Orçamento Cliente (Mock)', description: 'Gerado via Mock' }
        }
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const prompt = `Você é um assistente de produtividade IA lendo a caixa de e-mails do usuário.
Analise o e-mail abaixo e decida se ele exige uma AÇÃO CLARA do usuário na plataforma (ex: criar um projeto, responder com documento, rodar comando no terminal).
Se NÃO exigir ação (ex: newsletter, aviso inútil), retorne exatamente: {"hasTask": false}
Se EXIGIR ação, retorne um JSON válido com o seguinte formato exato:
{
  "hasTask": true,
  "suggestedActionMessage": "Mensagem curta para o usuário. Ex: 'O cliente pediu um orçamento. Quer criar um Card na coluna TODO?'",
  "actionPayload": {
    "type": "CREATE_CARD", // ou RUN_TERMINAL_COMMAND, CREATE_DOC
    "data": { "title": "Orçamento Cliente", "description": "Detalhes..." }
  }
}
NÃO inclua markdown \`\`\`json, apenas retorne o JSON puro e válido.

CONTEÚDO DO E-MAIL:
${emailContent}`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      // Remove possible markdown formatting
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      this.logger.error('Erro ao analisar e-mail com IA', e);
      return { hasTask: false };
    }
  }
}
