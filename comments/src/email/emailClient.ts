import { Resend } from "resend";
import { type Result, ok, err } from "../result.js";

export interface EmailError {
  message: string;
}

export interface EmailClient {
  sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<Result<{ id: string }, EmailError>>;
}

/**
 * Development email client: prints the email to stdout (with extracted links)
 * instead of delivering it. Used when no Resend API key is configured.
 */
export class ConsoleEmailClient implements EmailClient {
  private counter = 0;

  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<Result<{ id: string }, EmailError>> {
    this.counter++;
    console.log("\n========== [DEV EMAIL] ==========");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`---`);
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    if (links.length > 0) {
      console.log(`Links:`);
      links.forEach((l) => console.log(`  - ${l}`));
    }
    console.log("=================================\n");
    return ok({ id: `dev-${this.counter}` });
  }
}

/**
 * Production email client: delivers via the Resend API.
 */
export class ResendEmailClient implements EmailClient {
  private readonly resend: Resend;

  constructor(apiKey: string, private readonly fromEmail: string) {
    this.resend = new Resend(apiKey);
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<Result<{ id: string }, EmailError>> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
      if (error) return err({ message: error.message });
      return ok({ id: data!.id });
    } catch (e) {
      return err({
        message: e instanceof Error ? e.message : "Unknown email error",
      });
    }
  }
}
