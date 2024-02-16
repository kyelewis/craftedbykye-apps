export interface AmberElectricClientOptions {
	apiKey: string
}

export class AmberElectricClient {

	public apiKey: string;

	constructor({ apiKey }: AmberElectricClientOptions) {
		this.apiKey = apiKey;
	}

	async getAllSites() {
		const url = new URL("sites", "https://api.amber.com.au/v1/");
		const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${this.apiKey}` }});
		const result = await response.json();
		return result;
	}

	async getCurrentPriceForSite(siteId: string) {
		const url = new URL(`sites/${siteId}/prices/current`, "https://api.amber.com.au/v1/");
		const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${this.apiKey}` }});
		const result = await response.json();
		return result;
	}

	async getUsageForSite(siteId: string, startDate: string, endDate?: string) {
		const url = new URL(`sites/${siteId}/usage`, "https://api.amber.com.au/v1/");
		url.searchParams.set("startDate", startDate);
		url.searchParams.set("endDate", endDate || startDate);
		const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${this.apiKey}` }});
		const result = await response.json();
		return result;
	}

}
