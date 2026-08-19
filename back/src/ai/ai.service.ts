import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LogsService } from '../logs/logs.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UpsertAiConfigDto } from './dto/upsert-ai-config.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly logsService: LogsService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }


  async getAiConfig(userId: string) {
    return this.prisma.userAiConfig.findUnique({ where: { userId } });
  }

  async upsertAiConfig(userId: string, dto: UpsertAiConfigDto) {
    return this.prisma.userAiConfig.upsert({
      where: { userId },
      update: { provider: dto.provider, model: dto.model, apiKey: dto.apiKey },
      create: { userId, provider: dto.provider, model: dto.model, apiKey: dto.apiKey }
    });
  }

  async deleteAiConfig(userId: string) {
    return this.prisma.userAiConfig.delete({ where: { userId } });
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

    const userConfig = await this.getAiConfig(userId);
    const systemApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const effectiveApiKey = userConfig?.apiKey || systemApiKey;

    if (effectiveApiKey) {
      try {
        const client = userConfig?.apiKey ? new GoogleGenerativeAI(userConfig.apiKey) : this.genAI;
        const targetModel = userConfig?.model && !userConfig.model.includes('3.5') ? userConfig.model : 'gemini-1.5-flash';
        const model = client.getGenerativeModel({ model: targetModel });
        
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

        const savedLeads = await this.prisma.savedLead.findMany({ where: { userId } });

        let contextDump = 'DADOS DO USUÁRIO NO SISTEMA FLUXIONAI:\n';
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

        if (savedLeads.length > 0) {
          contextDump += `\nLEADS E CONTATOS SALVOS DO USUÁRIO:\n`;
          for (const lead of savedLeads) {
            contextDump += `  - Contact: "${lead.name}" | Local: "${lead.location || 'Não informado'}" | Nicho: "${lead.niche || 'Geral'}"\n`;
          }
        }

        const systemPrompt = `Você é o assistente virtual inteligente do FluxionAi, uma plataforma de produtividade e IA. 
Você tem capacidade de executar ações reais no sistema (como enviar mensagens de WhatsApp).
${contextDump}

🚨 REGRA CRÍTICA DE EXECUÇÃO DE WHATSAPP:
Se o usuário pedir para enviar uma mensagem, mandar aviso, mandar recado, notificar por whatsapp, enviar texto para um número ou contato (ex: "mande um aviso dizendo X para 8599057904", "envie whatsapp para Fulano", "mande um zap..."):
- Você DEVE retornar EXATAMENTE o seguinte bloco de código markdown com o número limpo (apenas dígitos ou com DDD) e o texto completo da mensagem a ser enviada:

\`\`\`json whatsapp
{
  "phone": "8599057904",
  "message": "Texto completo da mensagem que será disparada imediatamente..."
}
\`\`\`

Histórico do chat:
${chat.messages.map(m => `${m.role}: ${m.content}`).join('\n')}
USER: ${dto.content}

Instruções adicionais: Responda como assistente prestativo. Se for um pedido de mensagem de WhatsApp, gere o bloco \`\`\`json whatsapp acima para o sistema disparar a mensagem imediatamente.`;

        const result = await model.generateContent(systemPrompt);
        aiResponseText = result.response.text();

        // Verificar se há bloco de envio de WhatsApp gerado
        const whatsappRegex = /```json whatsapp[\r\n]+([\s\S]*?)[\r\n]+```/i;
        const waMatch = aiResponseText.match(whatsappRegex);

        if (waMatch) {
          try {
            const waData = JSON.parse(waMatch[1].trim());
            if (waData.phone && waData.message && this.whatsappService) {
              const res = await this.whatsappService.sendTextMessage('fluxionai', waData.phone, waData.message);
              if (res && res.status !== 'ERROR') {
                aiResponseText = aiResponseText.replace(waMatch[0], `\n\n✅ **Mensagem enviada com sucesso no WhatsApp para ${waData.phone}!**\n> "${waData.message}"\n\n`);
              } else {
                const errDetail = res?.error || 'Verifique se o WhatsApp está conectado na página de Configurações.';
                aiResponseText = aiResponseText.replace(waMatch[0], `\n\n⚠️ **Falha ao enviar mensagem no WhatsApp (${errDetail}).**\n\n`);
              }
            }
          } catch (e) {
            this.logger.error("Falha ao processar envio de WhatsApp no AI Chat", e);
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

  async generateLeads(niche: string, state: string, city: string, userId: string, customScript?: string): Promise<any[]> {
    const serperKey = process.env.SERPER_API_KEY || this.configService.get<string>('SERPER_API_KEY');
    
    if (serperKey) {
      return new Promise((resolve) => {
        const query = `${niche} em ${city}, ${state}`;
        const https = require('https');
        
        const req = https.request({
          hostname: 'google.serper.dev',
          path: '/places',
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          }
        }, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.places && parsed.places.length > 0) {
                const leads = parsed.places.slice(0, 10).map((p: any) => {
                  let instagram = '';
                  if (p.website && p.website.toLowerCase().includes('instagram.com/')) {
                    instagram = p.website;
                  }
                  
                  const whatsappPrompt = `Oi! Vi a ${p.title} aqui em ${city} 👀\n\nVocês já têm site com agendamento online ou só usam Instagram e WhatsApp?\n\nFaço site com agendamento e divulgação pra ${niche.toLowerCase()}, com preço negociável e que cabe no bolso. Se quiser, te mostro uma apresentação de como ficaria o site de vocês. Topa?`;
                  
                  const hasWebsite = !!p.website;
                  const suggestedBudget = hasWebsite 
                    ? { hosting: 'R$ 75/mês', domain: 'Já Possui', development: 'R$ 2.500,00 (Redesign)' }
                    : { hosting: 'R$ 45/mês', domain: 'R$ 40/ano', development: 'R$ 1.500,00 (Criação)' };
                  
                  return {
                    name: p.title,
                    location: p.address,
                    lat: p.latitude,
                    lng: p.longitude,
                    probability: p.rating ? Math.min(100, Math.floor(p.rating * 20)) : 85,
                    suggestedBudget,
                    hasWebsite,
                    websiteUrl: p.website || null,
                    phone: p.phoneNumber,
                    instagram: instagram,
                    whatsappPrompt
                  };
                });
                
                if (!customScript) {
                  return resolve(leads);
                }

                try {
                  const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                  const prompt = `Adapte o seguinte roteiro de vendas para cada um destes clientes:
Roteiro Base: "${customScript}"

INSTRUÇÕES OBRIGATÓRIAS:
1. Substitua QUALQUER marcação de espaço reservado para nome (ex: {nome}, [Nome do estabelecimento], [Nome da empresa], etc) pelo NOME REAL da empresa listada.
2. Substitua QUALQUER marcação de localização (ex: {cidade}, [Bairro/Cidade], [Local], etc) pela localização real da empresa.
3. Faça adaptações leves para soar humano, mas mantenha a estrutura base.

Lista de Clientes:
${leads.map((l: any, i: number) => `${i+1}. ${l.name} - Local: ${l.location}`).join('\n')}

Retorne APENAS um array JSON de strings com as mensagens adaptadas, na mesma ordem. Exemplo:
["Mensagem adaptada 1", "Mensagem adaptada 2"]
Não retorne absolutamente mais nada além do array.`;
                  
                  model.generateContent(prompt).then((res: any) => {
                    let text = res.response.text();
                    
                    if (res.response.usageMetadata) {
                      const tokens = res.response.usageMetadata.totalTokenCount;
                      this.logsService.logUsage(userId, 'AI', 'Geração de Roteiros (Leads)', tokens, { feature: 'generate_leads', count: leads.length }).catch(console.error);
                    }

                    // Extrair o array de dentro do texto, ignorando marcações markdown
                    const arrayMatch = text.match(/\[[\s\S]*\]/);
                    if (arrayMatch) {
                      text = arrayMatch[0];
                    }

                    try {
                      const adapted = JSON.parse(text);
                      if (Array.isArray(adapted) && adapted.length === leads.length) {
                        leads.forEach((l: any, i: number) => {
                          if (adapted[i]) l.whatsappPrompt = adapted[i];
                        });
                      } else {
                        throw new Error("Invalid array length");
                      }
                    } catch(e) {
                      // Fallback rudimentar: se falhar o JSON, usar o roteiro puro substituindo {nome} e [Nome...]
                      leads.forEach((l: any) => {
                        let promptText = customScript;
                        promptText = promptText.replace(/\{nome\}|\[nome[^\]]*\]/gi, l.name);
                        promptText = promptText.replace(/\{cidade\}|\[bairro[^\]]*\]/gi, l.location.split(',')[0]);
                        l.whatsappPrompt = promptText;
                      });
                    }
                    resolve(leads);
                  }).catch((err: any) => {
                    this.logsService.logError(userId, 'AI', 'Falha na geração com o Gemini', { error: err.message, feature: 'generate_leads' }).catch(console.error);
                    // Se a API falhar, também usamos o roteiro puro
                    leads.forEach((l: any) => {
                      let promptText = customScript;
                      promptText = promptText.replace(/\{nome\}|\[nome[^\]]*\]/gi, l.name);
                      promptText = promptText.replace(/\{cidade\}|\[bairro[^\]]*\]/gi, l.location.split(',')[0]);
                      l.whatsappPrompt = promptText;
                    });
                    resolve(leads);
                  });
                } catch(e) {
                  resolve(leads);
                }
              } else {
                resolve([]);
              }
            } catch (err) {
              resolve([]);
            }
          });
        });
        
        req.on('error', () => resolve([]));
        req.write(JSON.stringify({ q: query }));
        req.end();
      });
    }

    return [];
  }

  async saveLead(data: any, userId: string) {
    return this.prisma.savedLead.create({ data: { ...data, userId } });
  }
  async getSavedLeads(userId: string) {
    return this.prisma.savedLead.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
  async deleteSavedLead(id: string) {
    return this.prisma.savedLead.delete({ where: { id } });
  }

  async previewAutoLeads(dto: { state: string; city: string; niche: string; quantity: number }, userId: string) {
    const { state = 'CE', city = 'Fortaleza', niche = 'Empresas', quantity = 5 } = dto;

    let foundLeads = await this.generateLeads(niche, state, city, userId);

    if (!foundLeads || foundLeads.length === 0) {
      foundLeads = Array.from({ length: quantity }).map((_, i) => ({
        id: `auto-preview-${i + 1}`,
        name: `${niche.charAt(0).toUpperCase() + niche.slice(1)} ${i + 1}`,
        location: `${city}, ${state}`,
        niche,
        phone: `859${Math.floor(10000000 + Math.random() * 90000000)}`,
        probability: 85 - (i * 3),
        whatsappPrompt: `Olá! Vi o perfil de vocês em ${city} e gostaria de apresentar nossas soluções com IA.`,
      }));
    } else {
      foundLeads = foundLeads.slice(0, quantity);
    }

    const saved = await this.prisma.savedLead.findMany({ where: { userId } });
    const savedNames = new Set(saved.map(s => s.name.toLowerCase()));

    return foundLeads.map((l, index) => {
      const isAlreadySaved = savedNames.has(l.name.toLowerCase());
      return {
        ...l,
        id: l.id || `lead-candidate-${index + 1}`,
        alreadySaved: isAlreadySaved,
        selected: !isAlreadySaved,
      };
    });
  }

  private formatOutreachMessage(template: string, lead: { name: string; location?: string; niche?: string }): string {
    if (!template) return `Olá ${lead.name}!`;

    let msg = template;

    // 1. Substituir variações de Nome do estabelecimento
    msg = msg.replace(/\[Nome do estabelecimento\]|\[nome do estabelecimento\]|\[nome\]|\{nome\}|\{name\}/gi, lead.name);

    // 2. Substituir variações de Bairro / Cidade / Localização
    const locationStr = lead.location || 'sua região';
    msg = msg.replace(/\[Bairro\/Cidade\]|\[Bairro\/cidade\]|\[bairro\/cidade\]|\[cidade\]|\[localização\]|\[localizacao\]|\{cidade\}|\{location\}/gi, locationStr);

    // 3. Substituir variações de Tipo de Negócio / Nicho
    const nicheStr = lead.niche || 'seu segmento';
    msg = msg.replace(/\[tipo de negócio:[^\]]*\]|\[tipo de negócio\]|\[tipo de negocio\]|\[nicho\]|\{nicho\}|\{niche\}/gi, nicheStr);

    return msg;
  }

  async dispatchAutoLeads(dto: { selectedLeads: any[]; outreachMessage: string; scheduledAt?: string }, userId: string) {
    const { selectedLeads = [], outreachMessage, scheduledAt } = dto;

    if (selectedLeads.length === 0) {
      return { success: false, message: 'Nenhum lead selecionado.' };
    }

    for (const lead of selectedLeads) {
      try {
        const formattedMsg = this.formatOutreachMessage(outreachMessage || lead.whatsappPrompt, lead);
        await this.saveLead({
          name: lead.name,
          location: lead.location || 'Brasil',
          niche: lead.niche || 'Geral',
          probability: lead.probability || 80,
          suggestedBudget: typeof lead.suggestedBudget === 'object' ? JSON.stringify(lead.suggestedBudget) : (lead.suggestedBudget || 'R$ 1.500,00'),
          whatsappPrompt: formattedMsg,
        }, userId);
      } catch (e) {
        this.logger.error('Erro ao salvar lead selecionado:', e);
      }
    }

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const formattedDate = scheduledDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

      await this.prisma.systemLog.create({
        data: {
          level: 'INFO',
          module: 'AI_LEADS',
          message: `Prospecção agendada para ${selectedLeads.length} leads em ${formattedDate}`,
          metadata: {
            scheduledAt,
            formattedDate,
            leadsCount: selectedLeads.length,
            outreachMessage,
            leads: selectedLeads.map(l => ({ name: l.name, phone: l.phone, location: l.location })),
          },
          userId,
        },
      });


      const payload = JSON.stringify({
        type: 'AI_LEAD_RESPONSE_PERMISSION',
        actionType: 'prompt',
        scheduledAt,
        quantity: selectedLeads.length,
        outreachMessage,
      });

      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: `📅 Prospecção Agendada (${formattedDate})`,
          message: `Prospecção de ${selectedLeads.length} clientes agendada para ${formattedDate}. Permitir que a IA responda automaticamente aos retornos?`,
          isRead: false,
          linkUrl: payload,
        },
      });

      return { success: true, isScheduled: true, scheduledAt: formattedDate, count: selectedLeads.length };
    }

    if (this.whatsappService) {
      for (const lead of selectedLeads) {
        if (lead.phone) {
          const msg = this.formatOutreachMessage(outreachMessage || lead.whatsappPrompt, lead);
          this.whatsappService.sendTextMessage('fluxionai', lead.phone, msg).catch(console.error);
        }
      }
    }


    const payload = JSON.stringify({
      type: 'AI_LEAD_RESPONSE_PERMISSION',
      actionType: 'prompt',
      quantity: selectedLeads.length,
      outreachMessage,
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: '🤖 Prospecção IA Disparada',
        message: `A IA enviou mensagens para os ${selectedLeads.length} clientes selecionados. Permitir que a IA responda automaticamente aos retornos?`,
        isRead: false,
        linkUrl: payload,
      },
    });

    return { success: true, count: selectedLeads.length };
  }

  async autoSearchAndOutreachLeads(dto: { quantity: number; niche: string; outreachMessage: string }, userId: string) {
    const { quantity = 5, niche = 'Empresas', outreachMessage = 'Olá! Gostaria de apresentar nossos serviços.' } = dto;

    let foundLeads = await this.generateLeads(niche, 'CE', 'Fortaleza', userId, outreachMessage);

    if (!foundLeads || foundLeads.length === 0) {
      foundLeads = Array.from({ length: quantity }).map((_, i) => ({
        id: `auto-lead-${i + 1}`,
        name: `Cliente Potencial ${i + 1} (${niche})`,
        location: 'Fortaleza, CE',
        niche,
        phone: `859${Math.floor(10000000 + Math.random() * 90000000)}`,
        probability: 85,
        whatsappPrompt: outreachMessage,
      }));
    } else {
      foundLeads = foundLeads.slice(0, quantity);
    }

    for (const lead of foundLeads) {
      try {
        await this.saveLead({
          name: lead.name,
          location: lead.location || 'Fortaleza, CE',
          niche: lead.niche || niche,
          probability: lead.probability || 80,
          suggestedBudget: typeof lead.suggestedBudget === 'object' ? JSON.stringify(lead.suggestedBudget) : (lead.suggestedBudget || 'R$ 1.500,00'),
          whatsappPrompt: outreachMessage || lead.whatsappPrompt,
        }, userId);
      } catch (e) {
        this.logger.error('Erro ao salvar lead automático:', e);
      }
    }

    if (this.whatsappService) {
      for (const lead of foundLeads) {
        if (lead.phone) {
          this.whatsappService.sendTextMessage('fluxionai', lead.phone, outreachMessage || lead.whatsappPrompt).catch(console.error);
        }
      }
    }

    const payload = JSON.stringify({
      type: 'AI_LEAD_RESPONSE_PERMISSION',
      actionType: 'prompt',
      niche,
      quantity: foundLeads.length,
      outreachMessage,
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: '🤖 Prospecção IA Concluída - Resposta de IA',
        message: `A IA encontrou ${foundLeads.length} potenciais clientes para "${niche}" e enviou a mensagem. Permitir que a IA responda automaticamente quando houver retorno?`,
        isRead: false,
        linkUrl: payload,
      },
    });

    return { success: true, count: foundLeads.length, leads: foundLeads };
  }

  async getScheduledLeads(userId: string) {
    return this.prisma.systemLog.findMany({
      where: { userId, module: 'AI_LEADS' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteScheduledLead(id: string) {
    return this.prisma.systemLog.delete({ where: { id } });
  }
}




