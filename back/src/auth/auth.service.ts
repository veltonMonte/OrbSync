import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private async checkEmailRateLimit(user: any) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let newCount = user.emailRequestsCount;
    if (!user.lastEmailRequestAt || user.lastEmailRequestAt < twentyFourHoursAgo) {
      newCount = 0;
    }

    if (newCount >= 2) {
      throw new ConflictException('Você atingiu o limite de envios de e-mail. Tente novamente após 24 horas.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailRequestsCount: newCount + 1,
        lastEmailRequestAt: now,
      },
    });
  }

  async register(dto: RegisterDto) {
    if (dto.acceptedTerms !== true) {
      throw new BadRequestException('Você precisa aceitar os Termos de Serviço e Política de Privacidade para se cadastrar.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já está em uso');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      },
    });

    await this.checkEmailRateLimit(user);

    const vToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.verificationToken.create({
      data: {
        token: vToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await this.emailService.sendVerificationEmail(user.email, vToken);

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        avatarUrl: user.avatarUrl,
        termsAcceptedAt: user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : null,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Esta conta foi criada usando o Google. Por favor, faça login com o Google.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('E-mail não verificado. Por favor, confirme seu e-mail para fazer login.');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        avatarUrl: user.avatarUrl,
        termsAcceptedAt: user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : null,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
    );

    return {
      user: {
        id: stored.user.id,
        name: stored.user.name,
        email: stored.user.email,
        avatarUrl: stored.user.avatarUrl,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new UnauthorizedException('Token de verificação inválido ou não encontrado.');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      throw new UnauthorizedException('O token de verificação expirou. Por favor, solicite um novo.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isVerified: true },
      }),
      this.prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return { message: 'E-mail verificado com sucesso.' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');
    if (user.isVerified) throw new ConflictException('O e-mail já foi verificado.');

    await this.checkEmailRateLimit(user);

    // Delete existing tokens
    await this.prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    const vToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.verificationToken.create({
      data: {
        token: vToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(user.email, vToken);
    return { message: 'E-mail de verificação reenviado.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' }; // Security: generic message

    await this.checkEmailRateLimit(user);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    
    return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Token inválido ou não encontrado.');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new UnauthorizedException('O token expirou. Solicite a redefinição novamente.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso. Você já pode fazer login.' };
  }

  async validateGoogleUser(profile: any) {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          isVerified: true,
        },
      });
    } else if (!user.isVerified || (avatarUrl && !user.avatarUrl)) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          isVerified: true, 
          avatarUrl: user.avatarUrl || avatarUrl 
        },
      });
    }

    return user;
  }

  async googleLogin(user: any) {
    if (!user) {
      throw new UnauthorizedException('No user from google');
    }
    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        avatarUrl: user.avatarUrl, 
        termsAcceptedAt: user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : null 
      },
      ...tokens,
    };
  }

  async acceptTerms(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      },
    });
    return { success: true, termsAcceptedAt: user.termsAcceptedAt };
  }
}
