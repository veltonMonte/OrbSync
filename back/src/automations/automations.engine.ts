import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerminalService } from '../terminal/terminal.service';

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TerminalService)) private readonly terminalService: TerminalService,
  ) {}

  async handleCardMoved(cardId: string, workspaceId: string, newColumnId: string) {
    this.logger.log(`Event: CARD_MOVED | Card ${cardId} moved to Column ${newColumnId}`);

    const automations = await this.prisma.automation.findMany({
      where: {
        workspaceId,
        isActive: true,
        trigger: 'CARD_MOVED',
      },
    });

    if (automations.length === 0) return;

    const column = await this.prisma.column.findUnique({ where: { id: newColumnId } });
    const rawColName = column ? column.name.toUpperCase() : '';
    
    let colName = rawColName.replace(' ', '_');
    if (rawColName.includes('TODO') || rawColName.includes('A FAZER')) colName = 'TODO';
    if (rawColName.includes('PROGRESS') || rawColName.includes('FAZENDO')) colName = 'IN_PROGRESS';
    if (rawColName.includes('DONE') || rawColName.includes('CONCLUÍDO') || rawColName.includes('FEITO')) colName = 'DONE';

    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { creator: true, assignee: true, column: true }
    });

    for (const auto of automations) {
      try {
        await this.executeWorkflow(auto, { card, newColumnId, colName });
      } catch (err) {
        this.logger.error(`Error executing automation ${auto.name}: ${err.message}`);
      }
    }
  }

  private async executeWorkflow(automation: any, context: any) {
    const rules = typeof automation.actionRules === 'string' 
      ? JSON.parse(automation.actionRules) 
      : automation.actionRules;
      
    if (!rules || !rules.nodes) return;

    const { nodes, edges } = rules;
    const triggerNodes = nodes.filter((n: any) => n.type === 'trigger');
    
    for (const tNode of triggerNodes) {
      if (tNode.data?.icon === 'zap') {
        const targetConfig = tNode.data?.targetColumn; // "TODO", "IN_PROGRESS", "DONE"
        if (targetConfig && targetConfig !== context.colName) {
          continue;
        }

        this.logger.log(`Workflow [${automation.name}] Trigger matched (CARD_MOVED)! Starting execution...`);
        await this.runNextNodes(tNode.id, nodes, edges, context);
      }

      if (tNode.data?.icon === 'terminal') {
        const targetCommand = tNode.data?.targetCommand || '';
        if (targetCommand && !context.command.includes(targetCommand)) {
          continue; // Comando diferente do esperado
        }
        
        this.logger.log(`Workflow [${automation.name}] Trigger matched (TERMINAL)! Starting execution...`);
        await this.runNextNodes(tNode.id, nodes, edges, context);
      }
    }
  }

  private async runNextNodes(currentNodeId: string, nodes: any[], edges: any[], context: any) {
    const outgoingEdges = edges.filter((e: any) => e.source === currentNodeId);
    
    for (const edge of outgoingEdges) {
      const targetNode = nodes.find((n: any) => n.id === edge.target);
      if (targetNode) {
        await this.executeAction(targetNode, context);
        await this.runNextNodes(targetNode.id, nodes, edges, context);
      }
    }
  }

  private async executeAction(node: any, context: any) {
    const { icon, mailTo, aiPrompt } = node.data || {};
    const { card } = context;

    if (icon === 'mail') {
      const dest = mailTo || 'nobody@example.com';
      this.logger.log(`\n\n=========================================\n📧 [EMAIL SIMULADO] ENVIANDO EMAIL PARA: ${dest}\nASSUNTO: Alerta Automático do Card ${card.title}\n=========================================\n`);
    }

    if (icon === 'ai') {
      const prompt = aiPrompt || 'Resuma o card';
      const aiResponse = `**[Agente IA OrbSync]**\nRecebi o prompt: *"${prompt}"*\n\nO card "${card.title}" foi processado via IA DevOps. A complexidade desta tarefa foi categorizada como moderada.\n\n*Nota: Esta é uma execução real acionada por um Workflow Node-Based!*`;
      
      this.logger.log(`🧠 [IA SIMULADA] Processando prompt para o card ${card.title}...`);
      
      await this.prisma.comment.create({
        data: {
          content: aiResponse,
          cardId: card.id,
          authorId: card.creatorId,
        }
      });
      
      this.logger.log(`🧠 [IA SIMULADA] Comentário injetado no card!`);
    }

    if (icon === 'doc') {
      this.logger.log(`📄 [DOCUMENTO] Gerando documento baseado no card ${card?.title || 'Terminal Event'}...`);
      
      const docTitle = `Relatório Automático: ${card?.title || 'Terminal'}`;
      const docContent = `# Relatório Automático\n\nEste documento foi gerado automaticamente pela engine de workflows.\n\n**Tarefa:** ${card?.title || 'N/A'}\n**Descrição:** ${card?.description || 'N/A'}\n**Autor:** ${card?.creator?.name || 'Sistema'}\n\n*Documento gerado em: ${new Date().toLocaleString('pt-BR')}*`;
      
      await this.prisma.document.create({
        data: {
          title: docTitle,
          content: docContent,
          authorId: card?.creatorId || context.userId,
        }
      });
      
      this.logger.log(`📄 [DOCUMENTO] Documento "${docTitle}" gerado com sucesso!`);
    }

    if (icon === 'terminal') {
      const script = node.data?.terminalCommand || 'echo "Sem comando"';
      this.logger.log(`💻 [TERMINAL ACTION] Rodando comando real em background: ${script}`);
      try {
        const result = await this.terminalService.executeCommand(script);
        this.logger.log(`💻 [TERMINAL ACTION] Sucesso! Output:\n${result.stdout}`);
      } catch (err) {
        this.logger.error(`💻 [TERMINAL ACTION] Falhou: ${err.message}`);
      }
    }
  }

  async handleTerminalCommand(command: string, workspaceId: string, userId: string) {
    this.logger.log(`Event: TERMINAL_COMMAND | Executed: ${command}`);

    const automations = await this.prisma.automation.findMany({
      where: {
        workspaceId,
        isActive: true,
        trigger: 'TERMINAL_COMMAND',
      },
    });

    if (automations.length === 0) return;

    for (const auto of automations) {
      try {
        await this.executeWorkflow(auto, { command, userId });
      } catch (err) {
        this.logger.error(`Error executing automation ${auto.name}: ${err.message}`);
      }
    }
  }
}
