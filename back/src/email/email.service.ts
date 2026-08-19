import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn('SMTP_USER or SMTP_PASS is not set. Emails will be logged to console instead of sent.');
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify?token=${token}`;
    
    if (!this.transporter) {
      this.logger.debug(`[MOCK EMAIL] Verification link for ${email}: ${verificationUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: '"FluxionIA" <no-reply@fluxionia.com>',
        to: email,
        subject: 'Confirme seu endereço de e-mail',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Bem-vindo ao FluxionIA!</h2>
            <p style="color: #555; font-size: 16px;">
              Estamos muito felizes em ter você a bordo. Para ativar sua conta e começar a usar a plataforma, por favor confirme seu e-mail clicando no botão abaixo:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #e2a336; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Confirmar Meu E-mail
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">
              Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br/>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            <p style="color: #aaa; font-size: 12px; margin-top: 40px;">
              Se você não solicitou este e-mail, por favor ignore.
            </p>
          </div>
        `,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      this.logger.log(`[DEV FALLBACK LINK] Link de verificação para ${email}:\n${verificationUrl}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    
    if (!this.transporter) {
      this.logger.debug(`[MOCK EMAIL] Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: '"FluxionIA" <no-reply@fluxionia.com>',
        to: email,
        subject: 'Redefinição de Senha',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Redefinição de Senha</h2>
            <p style="color: #555; font-size: 16px;">
              Recebemos uma solicitação para redefinir a senha da sua conta no FluxionIA. Se foi você quem pediu, clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #e2a336; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="color: #777; font-size: 14px;">
              Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br/>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color: #aaa; font-size: 12px; margin-top: 40px;">
              Se você não solicitou essa redefinição, apenas ignore este e-mail. A sua senha não será alterada.
            </p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      this.logger.log(`[DEV FALLBACK LINK] Link de redefinição de senha para ${email}:\n${resetUrl}`);
    }
  }
}
