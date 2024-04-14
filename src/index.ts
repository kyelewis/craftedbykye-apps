import { Linked } from "linkedjs";
import { Decimal } from "decimal.js";
import { AmberElectricClient } from "./amber-electric-client";
import { GithubClient } from "./github-client";
import { EmailClient } from "./email-client";
import { DeconzClient } from "./deconz-client";
import { amberDateYesterday } from "./util";
import { createYoga, createSchema } from "graphql-yoga";

const linked = new Linked({
  context: {
    amberOptions: { apiKey: process.env.AMBER_API_KEY },
    githubOptions: { apiKey: process.env.GITHUB_API_KEY },
    emailOptions: {
      username: process.env.EMAIL_USERNAME,
      password: process.env.EMAIL_PASSWORD,
    },
    deconzOptions: {
      key: process.env.DECONZ_USERNAME,
      host: process.env.DECONZ_HOST,
    },
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
    amberSite: (_, linked) => linked.connection("amber").getAllSites(),
    amberSitePrices: async ({ siteId }, linked) =>
      linked.connection("amber").getCurrentPriceForSite(siteId),
    githubUser: (_, linked) =>
      linked.connection("github").getUser().then(mapGithubUser),
    githubStarred: (_, linked) =>
      linked
        .connection("github")
        .getStarred()
        .then((starreds) => starreds.map(mapGithubStarred)),
    inboxSummary: (_, linked) => linked.connection("email").getInboxSummary(),
    deconzLights: (_, linked) => linked.connection("deconz").getLights(),
  },
  links: {
    "amberSite.prices": (amberSite, linked) =>
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
    email: ({ emailOptions }) => new EmailClient(emailOptions),
    deconz: ({ deconzOptions }) => new DeconzClient(deconzOptions),
  },
});

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      activeAmberSite: AmberSite!
      githubUser: GithubUser!
      inboxSummary: [InboxItem]!
      lights: [DeconzLight]!
    }

    type Mutation {
      setLight(id: String, on: Boolean): Boolean
    }

    type DeconzLight {
      id: String
      address: String
      brightness: Float
      on: Boolean
      name: String
    }

    type InboxItem {
      subject: String
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
          .call("amberSite")
          .then((sites) =>
            sites.find((site) => site.network === "United Energy"),
          ),
      githubUser: () => linked.call("githubUser"),
      inboxSummary: async (_, _args, context) => {
        if (!context.secret) throw new Error("No Auth");
        return await linked.call("inboxSummary");
      },
      lights: async (_, _args, context) => {
        if (!context.secret) throw new Error("No Auth");
        const result = await linked.call("deconzLights");
        return result.map((light) => ({
          id: light.id,
          address: light.uniqueid,
          name: light.name,
          on: light.state.on,
          brightness: light.state.bri,
        }));
      },
    },
    Mutation: {
      setLight: async (_, args, context) => {
        if (!context.secret) throw new Error("No Auth");
        await linked.connection("deconz").setLight(args.id, args.on);
        return true;
      }
},
  },
});

const yoga = createYoga({ schema });

const fetch = async (request) => {
  const url = new URL(request.url);
  const secret = Boolean(url.searchParams.get("secret") === process.env.SECRET);

  switch (url.pathname) {
    case "/graphql":
      return await yoga.fetch(request, { secret });
  }

  return new Response("Hi There");
};

console.log("Serving...");
Bun.serve({ fetch });
