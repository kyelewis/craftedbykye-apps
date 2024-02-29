import { Linked } from "linkedjs";
import { Decimal } from "decimal.js";
import { AmberElectricClient } from "./amber-electric-client";
import { amberDateYesterday } from "./util";
import { createYoga, createSchema } from "graphql-yoga";

const linked = new Linked({
  context: {
    amberClientOptions: { apiKey: process.env.AMBER_API_KEY },
  },
  logging: true,
});

linked.add({
  queries: {
    amberSites: (_, linked) => linked.connection("amber").getAllSites(),
    amberSitePrices: async ({ siteId }, linked) =>
      linked.connection("amber").getCurrentPriceForSite(siteId),
  },
  links: {
    "amberSites.prices": (amberSite, linked) =>
      linked
        .call("amberSitePrices", { siteId: amberSite.id })
        .then((prices) => prices?.[0]),
  },
  connections: {
    amber: ({ amberClientOptions }) =>
      new AmberElectricClient(amberClientOptions),
  },
});

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      amberSite: AmberSite!
    }

    type AmberSite {
      network: String
      prices: AmberSitePrices
    }

    type AmberSitePrices {
      perKwh: Float
      renewables: Float
      spotPerKwh: Float
    }
  `,
  resolvers: {
    Query: {
      amberSite: () =>
        linked
          .call("amberSites")
          .then((sites) => sites.find((site) => site.status === "active")),
    },
  },
});

const yoga = createYoga({ schema });

const fetch = async (request) => {
  const url = new URL(request.url);

  switch (url.pathname) {
    case "/graphql":
      return await yoga.fetch(request);
  }

  return new Response("Hi There");
};

Bun.serve({ fetch });
