export interface Story {
  id: string;
  title: string;
  selftext: string;
  excerpt: string;
  author: string;
  score: number;
  comments: number;
  subreddit: string;
  createdAt: string;
  url: string;
  redditUrl: string;
  permalink: string;
  slug: string;
  over18: boolean;
  isSelf: boolean;
}

export interface StoryComment {
  id: string;
  author: string;
  body: string;
  score: number;
  createdAt: string;
  depth: number;
  replies: StoryComment[];
}

export interface StoryDetail {
  story: Story;
  comments: StoryComment[];
}

export interface RedditListing {
  kind: string;
  data: {
    children: RedditListingChild[];
    after: string | null;
    before: string | null;
  };
}

export interface RedditListingChild {
  kind: string;
  data: RedditPost;
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  selftext_html: string | null;
  author: string;
  score: number;
  num_comments: number;
  subreddit: string;
  created_utc: number;
  permalink: string;
  url: string;
  over_18: boolean;
  is_self: boolean;
  stickied: boolean;
  removed_by_category: string | null;
  spoiler: boolean;
  link_flair_text: string | null;
}

export interface RedditCommentChild {
  kind: string;
  data: {
    id: string;
    author: string;
    body: string;
    score: number;
    created_utc: number;
    depth: number;
    replies?: RedditCommentReply | string | null;
  };
}

export interface RedditCommentReply {
  kind: "Listing";
  data: {
    children: RedditCommentChild[];
  };
}

export type ScraperErrorCode =
  | "not_found"
  | "rate_limited"
  | "blocked"
  | "network"
  | "parse";

export class ScraperError extends Error {
  code: ScraperErrorCode;
  constructor(code: ScraperErrorCode, message: string) {
    super(message);
    this.name = "ScraperError";
    this.code = code;
  }
}
