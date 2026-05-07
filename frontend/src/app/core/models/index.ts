export type UserRole = 'reader' | 'writer';

export type Genre =
  | 'Romance' | 'Fantasy' | 'Sci-Fi' | 'Drama' | 'Horror'
  | 'Thriller' | 'Mystery' | 'Technical' | 'Adventure' | 'Historical';

export type Category =
  | 'platform-originals' | 'translations' | 'manga'
  | 'manhwa' | 'ai-generated' | 'technical' | 'nsfw';

export type BookStatus = 'draft' | 'published' | 'completed';
export type LibraryStatus = 'reading' | 'completed' | 'want_to_read';

export interface ReadingStats {
  books_read: number;
  reading_time_min: number;
  reading_streak: number;
  followers: number;
  last_read_date: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  coins: number;
  preferred_genres: Genre[];
  reading_stats: ReadingStats | null;
  created_at: string;
}

export interface AuthorSummary {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Book {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  author: AuthorSummary;
  genre: Genre;
  category: Category;
  age_restriction: '18+' | null;
  status: BookStatus;
  is_monetized: boolean;
  views_count: number;
  rating_avg: number;
  rating_count: number;
  tags: string[];
  chapters_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_locked: boolean;
  price_coins: number | null;
  views_count: number;
  likes_count: number;
  published_at: string | null;
  created_at: string;
}

export interface ChapterSummary {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  is_locked: boolean;
  price_coins: number | null;
  views_count: number;
  likes_count: number;
  published_at: string | null;
}

export interface Comment {
  id: string;
  chapter_id: string;
  author: AuthorSummary & { avatar_url: string | null };
  parent_id: string | null;
  text: string;
  created_at: string;
  replies: Comment[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  order_index: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  book_id: string;
  chapter_id: string | null;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizSummary {
  id: string;
  book_id: string;
  chapter_id: string | null;
  title: string;
  description: string | null;
  question_count: number;
  created_at: string;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  completed_at: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
}

export interface Subscription {
  id: string;
  name: string;
  price_monthly: number;
  coins_per_month: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_date: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LibraryItem {
  book: Book;
  status: LibraryStatus;
  added_at: string;
}

export interface BookAnalytics {
  book_id: string;
  title: string;
  status: BookStatus;
  rating_avg: number;
  rating_count: number;
  total_views: number;
  total_chapter_views: number;
  total_likes: number;
  unique_readers: number;
  chapters_count: number;
  chapters: {
    id: string;
    number: number;
    title: string;
    views: number;
    likes: number;
    is_locked: boolean;
  }[];
}
