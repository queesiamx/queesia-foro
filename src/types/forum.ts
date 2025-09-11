export type Thread = {
  id: string;
  title: string;
  author?: string;
  tags?: string[];
  repliesCount?: number;
  viewsCount?: number | string;
  upvotesCount?: number;
  status?: "draft" | "published" | "archived";
  createdAt?: any;   // Firebase Timestamp
  updatedAt?: any;   // Firebase Timestamp
  trendingScore?: number; // opcional
};
