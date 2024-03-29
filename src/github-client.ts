export interface GithubClientOptions {
  apiKey: string;
}

export class GithubClient {
  constructor(public options: GithubClientOptions) {}

  async get(path: Array<string>) {
    const url = new URL(path.join("/"), "https://api.github.com/");
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.options.apiKey}` },
    });
    return await response.json();
  }

  getStarred() {
    return this.get(["user", "starred"]);
  }

  getUser() {
    return this.get(["user"]);
  }

  getFollowing() {
    return this.get(["following"]);
  }
}
