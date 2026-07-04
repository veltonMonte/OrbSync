import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationEngineService } from '../automations/automations.engine';

const execAsync = promisify(exec);

@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);
  
  // Mantém o estado da pasta atual na memória do servidor
  private currentCwd = os.homedir();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AutomationEngineService)) private readonly engine: AutomationEngineService,
  ) {}

  getInfo() {
    return {
      username: os.userInfo().username,
      hostname: os.hostname(),
      cwd: this.currentCwd
    };
  }

  async executeCommand(command: string, userId?: string) {
    const cmdTrimmed = command.trim();
    
    try {
      if (cmdTrimmed.includes('rm -rf /') || cmdTrimmed.includes(':(){ :|:& };:')) {
        throw new Error('Comando perigoso bloqueado.');
      }
      
      // Intercepta o comando 'cd' puro para mudar de diretório no estado do backend
      if (cmdTrimmed.startsWith('cd ') || cmdTrimmed === 'cd') {
        let targetDir = cmdTrimmed.substring(3).trim();
        if (!targetDir || targetDir === '~') {
          targetDir = os.homedir();
        }
        
        let newPath = targetDir;
        if (targetDir.startsWith('~')) {
          newPath = path.join(os.homedir(), targetDir.slice(1));
        } else if (!path.isAbsolute(newPath)) {
          newPath = path.resolve(this.currentCwd, newPath);
        }
        
        if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
          this.currentCwd = newPath;
          return { stdout: '', stderr: '', cwd: this.currentCwd };
        } else {
          return { stdout: '', stderr: `cd: ${targetDir}: Arquivo ou diretório inexistente\n`, cwd: this.currentCwd };
        }
      }

      const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', DEBIAN_FRONTEND: 'noninteractive' };

      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.currentCwd,
        timeout: 30000,
        env
      });

      // Se o userId for fornecido (não foi um comando agendado pelo próprio backend)
      if (userId) {
        // Encontra o workspace do usuário
        const user = await this.prisma.user.findUnique({ 
          where: { id: userId }, 
          include: { workspaceMemberships: true } 
        });
        if (user && user.workspaceMemberships.length > 0) {
          const workspaceId = user.workspaceMemberships[0].workspaceId;
          this.engine.handleTerminalCommand(cmdTrimmed, workspaceId, userId).catch(err => {
            this.logger.error("Erro ao engatilhar automação via terminal", err);
          });
        }
      }

      return { stdout, stderr, cwd: this.currentCwd };
    } catch (e: any) {
      this.logger.error(`Error executing command: ${command}`, e);
      let errorMsg = e.message;
      
      if (e.killed && e.signal === 'SIGTERM') {
        errorMsg = 'Tempo limite excedido. O comando demorou mais de 30 segundos ou travou aguardando interação (ex: pedindo senha).';
        return { stdout: '', stderr: e.stderr || '', error: errorMsg, cwd: this.currentCwd };
      }

      // Em um terminal real, falhar com código != 0 apenas exibe stdout e stderr, sem jogar uma exceção visual enorme
      if (e.code !== undefined && e.code !== 0) {
        // Se a mensagem for "Command failed...", omitimos ela e enviamos apenas o stdout/stderr real
        return { stdout: e.stdout || '', stderr: e.stderr || '', cwd: this.currentCwd };
      }

      return { stdout: '', stderr: e.stderr || '', error: errorMsg, cwd: this.currentCwd };
    }
  }
}
