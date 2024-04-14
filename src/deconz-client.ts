export interface DeconzClientOptions {
  key: string;
  host: string;
}

export class DeconzClient {
  constructor(public options: DeconzClientOptions) {}

  async getLights() {
    const url = new URL(`/api/${this.options.key}/lights`, this.options.host);
    const response = await fetch(url.toString());
    const body = await response.text();

    try {
      const result = JSON.parse(body);

      return Object.entries(result).map(([key,value]) => ({id: key, ...value }));
    } catch (error) {
      throw new Error(JSON.stringify({ body, error }));
    }
  }

  async setLight(id: string, on: boolean) {
    const url = new URL(`/api/${this.options.key}/lights/${id}/state`, this.options.host);

    await fetch(url.toString(), { method: "PUT", body: JSON.stringify({ on }) });
  }
}
