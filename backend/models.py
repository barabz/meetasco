from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
from database import Base

card_labels = Table(
    'card_labels', Base.metadata,
    Column('card_id', Integer, ForeignKey('cards.id', ondelete='CASCADE'), primary_key=True),
    Column('label_id', Integer, ForeignKey('labels.id', ondelete='CASCADE'), primary_key=True),
)

card_members = Table(
    'card_members', Base.metadata,
    Column('card_id', Integer, ForeignKey('cards.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_color = Column(String(20), default="#7c3aed")
    created_at = Column(DateTime, default=datetime.utcnow)
    boards = relationship("Board", back_populates="owner")


class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, default="")
    color = Column(String(20), default="#7c3aed")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="boards")
    lists = relationship("List", back_populates="board", order_by="List.position", cascade="all, delete-orphan")
    labels = relationship("Label", back_populates="board", cascade="all, delete-orphan")


class List(Base):
    __tablename__ = "lists"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    position = Column(Integer, default=0)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", order_by="Card.position", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    deadline = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    position = Column(Integer, default=0)
    list_id = Column(Integer, ForeignKey("lists.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    list = relationship("List", back_populates="cards")
    labels = relationship("Label", secondary=card_labels, back_populates="cards", lazy="selectin")
    members = relationship("User", secondary=card_members, lazy="selectin")
    comments = relationship("Comment", back_populates="card", order_by="Comment.created_at", cascade="all, delete-orphan")


class Label(Base):
    __tablename__ = "labels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), default="")
    color = Column(String(20), nullable=False)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    board = relationship("Board", back_populates="labels")
    cards = relationship("Card", secondary=card_labels, back_populates="labels")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    card = relationship("Card", back_populates="comments")
    author = relationship("User")
