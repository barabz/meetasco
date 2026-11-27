from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    avatar_color: str
    created_at: datetime
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Label ─────────────────────────────────────────────────────────────────────
class LabelCreate(BaseModel):
    name: Optional[str] = ""
    color: str


class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class LabelOut(BaseModel):
    id: int
    name: str
    color: str
    board_id: int
    model_config = {"from_attributes": True}


# ── Comment ───────────────────────────────────────────────────────────────────
class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    content: str
    card_id: int
    author_id: int
    author: UserOut
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Card ──────────────────────────────────────────────────────────────────────
class CardCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    deadline: Optional[datetime] = None


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    is_completed: Optional[bool] = None
    list_id: Optional[int] = None
    position: Optional[int] = None


class CardOut(BaseModel):
    id: int
    title: str
    description: str
    deadline: Optional[datetime]
    is_completed: bool
    position: int
    list_id: int
    labels: List[LabelOut] = []
    members: List[UserOut] = []
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── List ──────────────────────────────────────────────────────────────────────
class ListCreate(BaseModel):
    title: str


class ListUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None


class ListOut(BaseModel):
    id: int
    title: str
    position: int
    board_id: int
    cards: List[CardOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Board ─────────────────────────────────────────────────────────────────────
class BoardCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    color: Optional[str] = "#7c3aed"


class BoardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class BoardOut(BaseModel):
    id: int
    title: str
    description: str
    color: str
    owner_id: int
    owner: UserOut
    lists: List[ListOut] = []
    labels: List[LabelOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}


class BoardSummary(BaseModel):
    id: int
    title: str
    description: str
    color: str
    owner_id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Reorder ───────────────────────────────────────────────────────────────────
class ReorderLists(BaseModel):
    list_ids: List[int]


class ReorderCards(BaseModel):
    card_ids: List[int]
