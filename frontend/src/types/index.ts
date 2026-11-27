export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_color: string;
  created_at: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  board_id: number;
}

export interface Comment {
  id: number;
  content: string;
  card_id: number;
  author_id: number;
  author: User;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  is_completed: boolean;
  position: number;
  list_id: number;
  labels: Label[];
  members: User[];
  created_at: string;
  updated_at: string;
}

export interface List {
  id: number;
  title: string;
  position: number;
  board_id: number;
  cards: Card[];
  created_at: string;
}

export interface Board {
  id: number;
  title: string;
  description: string;
  color: string;
  owner_id: number;
  owner: User;
  lists: List[];
  labels: Label[];
  created_at: string;
}

export interface BoardSummary {
  id: number;
  title: string;
  description: string;
  color: string;
  owner_id: number;
  created_at: string;
}
