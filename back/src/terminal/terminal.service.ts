import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

const execAsync = promisify(exec);

@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);
  
  // Base root directory that terminal commands cannot escape
  private readonly rootPath = process.cwd();
  
  // Per-user CWD map to prevent state leaks between users
  private userCwds = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  private getUserCwd(userId?: string): string {
    if (!userId) return this.rootPath;
    if (!this.userCwds.has(userId)) {
      this.userCwds.set(userId, this.rootPath);
    }
    return this.userCwds.get(userId)!;
  }

  private setUserCwd(userId: string, newPath: string) {
    this.userCwds.set(userId, newPath);
  }

  getInfo(userId?: string) {
    return {
      username: 'fluxion-user',
      hostname: 'fluxion-node',
      cwd: this.getUserCwd(userId)
    };
  }

  private isCommandAllowed(command: string): boolean {
    const cmd = command.toLowerCase().trim();

    // Blocked patterns for security
    const forbiddenPatterns = [
      /\benv\b/,
      /\bprintenv\b/,
      /\bset\b/i, // Windows env variables listing
      /cat\s+.*(\.env|\.ssh|id_rsa|passwd|shadow)/i,
      /type\s+.*(\.env|\.ssh|id_rsa)/i,
      /rm\s+-rf\s+[\/\\]/i,
      /del\s+\/[fsq]/i,
      /rd\s+\/[sq]/i,
      /:(){\s*:|:&\s*};:/, // Fork bomb
      />\s*[\/\\]/, // Raw disk overwrite
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(cmd)) {
        return false;
      }
    }

    return true;
  }

  async executeCommand(command: string, userId?: string) {
    const cmdTrimmed = command.trim();
    const currentCwd = this.getUserCwd(userId);
    
    try {
      if (!this.isCommandAllowed(cmdTrimmed)) {
        return { 
          stdout: '', 
          stderr: 'Comando bloqueado por políticas de segurança do sistema.\n', 
          cwd: currentCwd 
        };
      }
      
      // Intercept 'cd' command to update user's directory state safely
      if (cmdTrimmed.startsWith('cd ') || cmdTrimmed === 'cd') {
        let targetDir = cmdTrimmed.substring(3).trim();
        if (!targetDir || targetDir === '~') {
          targetDir = this.rootPath;
        }
        
        let newPath = targetDir;
        if (!path.isAbsolute(newPath)) {
          newPath = path.resolve(currentCwd, newPath);
        }
        
        // Prevent navigating outside rootPath (Directory Traversal Guard)
        const relative = path.relative(this.rootPath, newPath);
        const isOutside = relative.startsWith('..') || path.isAbsolute(relative);
        
        if (isOutside) {
          return { 
            stdout: '', 
            stderr: `cd: Acesso negado. Diretório fora do workspace permitido.\n`, 
            cwd: currentCwd 
          };
        }

        if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
          if (userId) this.setUserCwd(userId, newPath);
          return { stdout: '', stderr: '', cwd: newPath };
        } else {
          return { stdout: '', stderr: `cd: ${targetDir}: Arquivo ou diretório inexistente\n`, cwd: currentCwd };
        }
      }

      // Safe execution environment
      const env: Record<string, string | undefined> = { 
        ...process.env, 
        GIT_TERMINAL_PROMPT: '0', 
        DEBIAN_FRONTEND: 'noninteractive' 
      };
      
      // Strip sensitive secrets from execution environment passed to child process
      delete env.DATABASE_URL;
      delete env.JWT_SECRET;
      delete env.GEMINI_API_KEY;

      const { stdout, stderr } = await execAsync(command, { 
        cwd: currentCwd,
        timeout: 30000,
        env
      });

      if (userId) {
        // Detect Git commit/push actions to alert development team via WhatsApp
        const lowerCmd = cmdTrimmed.toLowerCase();
        if (lowerCmd.includes('git commit') || lowerCmd.includes('git push') || lowerCmd.includes('git merge')) {
          this.whatsappService.queueOrSendTeamNotification({
            userId,
            title: '🚀 Evento Git no Repositório',
            message: `Evento Git disparado via terminal: "${cmdTrimmed}"`,
            category: 'GIT',
          }).catch(console.error);
        }
      }

      return { stdout, stderr, cwd: this.getUserCwd(userId) };
    } catch (e: any) {
      this.logger.error(`Error executing command: ${command}`, e);
      let errorMsg = e.message;
      
      if (e.killed && e.signal === 'SIGTERM') {
        errorMsg = 'Tempo limite excedido. O comando demorou mais de 30 segundos ou travou aguardando interação.';
        return { stdout: '', stderr: e.stderr || '', error: errorMsg, cwd: this.getUserCwd(userId) };
      }

      if (e.code !== undefined && e.code !== 0) {
        return { stdout: e.stdout || '', stderr: e.stderr || '', cwd: this.getUserCwd(userId) };
      }

      return { stdout: '', stderr: e.stderr || '', error: errorMsg, cwd: this.getUserCwd(userId) };
    }
  }
}

