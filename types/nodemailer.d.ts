/**
 * @fileoverview Declaraciones ambientales de tipo para nodemailer.
 */

declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    [key: string]: unknown;
  }

  export interface SentMessageInfo {
    messageId?: string;
    envelope?: Record<string, unknown>;
    accepted?: string[];
    rejected?: string[];
    pending?: string[];
    response?: string;
    [key: string]: unknown;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
    verify?(): Promise<boolean>;
    close?(): void;
  }

  export interface SmtpOptions {
    service?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    [key: string]: unknown;
  }

  export function createTransport(
    transport?: SmtpOptions | Record<string, unknown>,
    defaults?: Record<string, unknown>,
  ): Transporter;
}
