export interface AmberElectricClientOptions {
  apiKey: string;
}

export class AmberElectricClient {
  public apiKey: string;

  static yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  constructor({ apiKey }: AmberElectricClientOptions) {
    this.apiKey = apiKey;
  }

  async getAllSites() {
    const url = new URL("sites", "https://api.amber.com.au/v1/");
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const result = await response.json();
    return result;
  }

  async getCurrentPriceForSite(siteId: string) {
    const url = new URL(
      `sites/${siteId}/prices/current`,
      "https://api.amber.com.au/v1/",
    );
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const result = await response.json();
    return result;
  }

  async getUsageForSite(siteId: string, startDate: string, endDate?: string) {
    const url = new URL(
      `sites/${siteId}/usage`,
      "https://api.amber.com.au/v1/",
    );
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate || startDate);
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const result = await response.json();
    return result;
  }
}
