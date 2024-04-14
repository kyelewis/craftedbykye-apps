import { ImapFlow } from "imapflow";

export interface EmailClientOptions {
  username: string;
  password: string;
}

export class EmailClient {
  client: ImapFlow;

  constructor(options: EmailClientOptions) {
    this.client = new ImapFlow({
      host: "imap.mail.me.com",
      port: 993,
      secure: true,
      auth: {
        user: options.username,
        pass: options.password,
      },
    });
  }

  async getInboxSummary() {
    await this.client.connect();
    const lock = await this.client.getMailboxLock("INBOX");
    const mappedMessages = [];
    const fiveDaysAgo = new Date(new Date() - 5 * 24 * 60 * 60 * 1000);
    try {
      for await (let message of this.client.fetch(
        { since: fiveDaysAgo },
        { envelope: true },
      )) {
        mappedMessages.push({ subject: message.envelope.subject });
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      lock.release();
    }
    await this.client.logout();
    return mappedMessages;
  }
}
