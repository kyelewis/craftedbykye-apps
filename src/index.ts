import { Linked } from "linkedjs";
import { Decimal } from "decimal.js";
import { AmberElectricClient } from "./amber-electric-client";
import { GithubClient } from "./github-client";
import { amberDateYesterday } from "./util";
import { createYoga, createSchema } from "graphql-yoga";

const linked = new Linked({
  context: {
    amberOptions: { apiKey: process.env.AMBER_API_KEY },
    githubOptions: { apiKey: process.env.GITHUB_API_KEY },
  },
  logging: true,
});

const mapGithubUser = (user) => ({
  login: user.login,
  location: user.location,
  avatar: user.avatar_url,
  url: user.html_url,
});

const mapGithubStarred = (starred) => ({
  name: starred.full_name,
  avatar: starred.owner.avatar_url,
  url: starred.html_url,
});

linked.add({
  queries: {
    amberSites: (_, linked) => linked.connection("amber").getAllSites(),
    amberSitePrices: async ({ siteId }, linked) =>
      linked.connection("amber").getCurrentPriceForSite(siteId),
    githubUser: (_, linked) =>
      linked.connection("github").getUser().then(mapGithubUser),
    githubStarred: (_, linked) =>
      linked
        .connection("github")
        .getStarred()
        .then((starreds) => starreds.map(mapGithubStarred)),
  },
  links: {
    "activeAmberSite.prices": (amberSite, linked) =>
      linked
        .call("amberSitePrices", { siteId: amberSite.id })
        .then((prices) => prices?.[0]),
    "githubUser.starred": (githubUser, linked) => linked.call("githubStarred"),
    "githubUser.following": (githubUser, linked) =>
      linked.call("githubFollowing"),
  },
  connections: {
    amber: ({ amberOptions }) => new AmberElectricClient(amberOptions),
    github: ({ githubOptions }) => new GithubClient(githubOptions),
  },
});

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      activeAmberSite: AmberSite!
      githubUser: GithubUser!
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

    type GithubUser {
      url: String
      login: String
      avatar: String
      location: String
      starred: [GithubStarred!]
    }

    type GithubStarred {
      name: String!
      avatar: String!
      url: String!
    }
  `,
  resolvers: {
    Query: {
      activeAmberSite: () =>
        linked
          .call("amberSites")
          .then((sites) => sites.find((site) => site.status === "active")),
      githubUser: () => linked.call("githubUser"),
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
