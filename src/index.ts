import { compile } from 'handlebars';
import { Decimal } from 'decimal.js';

import { AmberElectricClient } from "./amber-electric-client";
import { amberDateYesterday } from "./util";

const amberElectricClient = new AmberElectricClient({ apiKey: process.env.AMBER_ELECTRIC_API_KEY });
const nmiTemplate = compile("<h1>NMI {{nmi}}</h1><strong>Current Spot Price</strong> ${{currentPrice}}/kWh<br/><strong>Yesterday: <strong>{{yesterdayKwh}}kWh / ${{yesterdayCost}}</strong>");

const homepage = `
<html><head><title>Kye API Dashboard</title><head><body>
  <div hx-get="/amber-electric?type=html" hx-trigger="load, every 30s" ><div class="htmx-indicator">Loading...</div></div>
<script src="https://unpkg.com/htmx.org@1.9.10"></script>
	</body></html>

`;

const fetch = async (request) => {

	const url = new URL(request.url);
	const type = url.searchParams.get("type") ?? "html";

	switch(url.pathname) {
		case '/amber-electric': 

const sites = await amberElectricClient.getAllSites();

const result = [];

for(const site of sites) {
	const price = await amberElectricClient.getCurrentPriceForSite(site.id);
	const usage = await amberElectricClient.getUsageForSite(site.id, amberDateYesterday());
	const yesterdayKwh = usage.reduce((total, next) => total.add(next.kwh) , new Decimal(0));
	const yesterdayCost = usage.reduce((total, next) => total.add(next.cost) , new Decimal(0));
 	result.push( { nmi: site.nmi, network: site.network, currentPrice: new Decimal(price?.[0]?.perKwh ?? 0).div(100).toFixed(2), yesterdayKwh: yesterdayKwh.toFixed(2), yesterdayCost: yesterdayCost.div(100).toFixed(2) });
}

switch(type) {
	case "html":
return new Response(result.map((r) => nmiTemplate(r)).join("<br />"), { headers: { 'Content-Type': 'text/html' }});
	case "json":
return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json'  }});
}

	break;
	default:
		return new Response(homepage, { headers: { "Content-Type": "text/html" } });
	}



}

Bun.serve({fetch});
