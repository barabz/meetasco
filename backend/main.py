from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/auth/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(400, "Username already taken")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(400, "Email already registered")
    colors = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#db2777"]
    color = colors[db.query(models.User).count() % len(colors)]
    user = models.User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=auth.hash_password(user_in.password),
        avatar_color=color,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/api/auth/login", response_model=schemas.Token)
def login(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == creds.username).first()
    if not user or not auth.verify_password(creds.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/api/users", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).all()


# ── Boards ────────────────────────────────────────────────────────────────────
@app.get("/api/boards", response_model=List[schemas.BoardSummary])
def list_boards(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.Board).all()


@app.post("/api/boards", response_model=schemas.BoardOut)
def create_board(board_in: schemas.BoardCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    board = models.Board(**board_in.model_dump(), owner_id=current_user.id)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@app.get("/api/boards/{board_id}", response_model=schemas.BoardOut)
def get_board(board_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        raise HTTPException(404, "Board not found")
    return board


@app.put("/api/boards/{board_id}", response_model=schemas.BoardOut)
def update_board(board_id: int, board_in: schemas.BoardUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        raise HTTPException(404)
    if board.owner_id != current_user.id:
        raise HTTPException(403)
    for k, v in board_in.model_dump(exclude_none=True).items():
        setattr(board, k, v)
    db.commit()
    db.refresh(board)
    return board


@app.delete("/api/boards/{board_id}", status_code=204)
def delete_board(board_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        raise HTTPException(404)
    if board.owner_id != current_user.id:
        raise HTTPException(403)
    db.delete(board)
    db.commit()


# ── Labels (board-scoped) ──────────────────────────────────────────────────────
@app.get("/api/boards/{board_id}/labels", response_model=List[schemas.LabelOut])
def list_labels(board_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.Label).filter(models.Label.board_id == board_id).all()


@app.post("/api/boards/{board_id}/labels", response_model=schemas.LabelOut)
def create_label(board_id: int, label_in: schemas.LabelCreate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        raise HTTPException(404)
    label = models.Label(**label_in.model_dump(), board_id=board_id)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@app.put("/api/labels/{label_id}", response_model=schemas.LabelOut)
def update_label(label_id: int, label_in: schemas.LabelUpdate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    label = db.query(models.Label).filter(models.Label.id == label_id).first()
    if not label:
        raise HTTPException(404)
    for k, v in label_in.model_dump(exclude_none=True).items():
        setattr(label, k, v)
    db.commit()
    db.refresh(label)
    return label


@app.delete("/api/labels/{label_id}", status_code=204)
def delete_label(label_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    label = db.query(models.Label).filter(models.Label.id == label_id).first()
    if not label:
        raise HTTPException(404)
    db.delete(label)
    db.commit()


# ── Card-label toggle ─────────────────────────────────────────────────────────
@app.post("/api/cards/{card_id}/labels/{label_id}", status_code=204)
def add_card_label(card_id: int, label_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    label = db.query(models.Label).filter(models.Label.id == label_id).first()
    if not card or not label:
        raise HTTPException(404)
    if label not in card.labels:
        card.labels.append(label)
        db.commit()


@app.delete("/api/cards/{card_id}/labels/{label_id}", status_code=204)
def remove_card_label(card_id: int, label_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    label = db.query(models.Label).filter(models.Label.id == label_id).first()
    if not card or not label:
        raise HTTPException(404)
    if label in card.labels:
        card.labels.remove(label)
        db.commit()


# ── Card-member toggle ────────────────────────────────────────────────────────
@app.post("/api/cards/{card_id}/members/{user_id}", status_code=204)
def add_card_member(card_id: int, user_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not card or not user:
        raise HTTPException(404)
    if user not in card.members:
        card.members.append(user)
        db.commit()


@app.delete("/api/cards/{card_id}/members/{user_id}", status_code=204)
def remove_card_member(card_id: int, user_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not card or not user:
        raise HTTPException(404)
    if user in card.members:
        card.members.remove(user)
        db.commit()


# ── Lists ─────────────────────────────────────────────────────────────────────
@app.post("/api/boards/{board_id}/lists", response_model=schemas.ListOut)
def create_list(board_id: int, list_in: schemas.ListCreate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        raise HTTPException(404)
    max_pos = db.query(models.List).filter(models.List.board_id == board_id).count()
    lst = models.List(**list_in.model_dump(), board_id=board_id, position=max_pos)
    db.add(lst)
    db.commit()
    db.refresh(lst)
    return lst


@app.put("/api/lists/{list_id}", response_model=schemas.ListOut)
def update_list(list_id: int, list_in: schemas.ListUpdate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    lst = db.query(models.List).filter(models.List.id == list_id).first()
    if not lst:
        raise HTTPException(404)
    for k, v in list_in.model_dump(exclude_none=True).items():
        setattr(lst, k, v)
    db.commit()
    db.refresh(lst)
    return lst


@app.delete("/api/lists/{list_id}", status_code=204)
def delete_list(list_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    lst = db.query(models.List).filter(models.List.id == list_id).first()
    if not lst:
        raise HTTPException(404)
    db.delete(lst)
    db.commit()


@app.patch("/api/boards/{board_id}/lists/reorder", status_code=204)
def reorder_lists(board_id: int, body: schemas.ReorderLists, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    for pos, list_id in enumerate(body.list_ids):
        db.query(models.List).filter(models.List.id == list_id, models.List.board_id == board_id).update({"position": pos})
    db.commit()


# ── Cards ─────────────────────────────────────────────────────────────────────
@app.post("/api/lists/{list_id}/cards", response_model=schemas.CardOut)
def create_card(list_id: int, card_in: schemas.CardCreate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    lst = db.query(models.List).filter(models.List.id == list_id).first()
    if not lst:
        raise HTTPException(404)
    max_pos = db.query(models.Card).filter(models.Card.list_id == list_id).count()
    card = models.Card(**card_in.model_dump(), list_id=list_id, position=max_pos)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@app.get("/api/cards/{card_id}", response_model=schemas.CardOut)
def get_card(card_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(404)
    return card


@app.put("/api/cards/{card_id}", response_model=schemas.CardOut)
def update_card(card_id: int, card_in: schemas.CardUpdate, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(404)
    for k, v in card_in.model_dump(exclude_none=True).items():
        setattr(card, k, v)
    db.commit()
    db.refresh(card)
    return card


@app.delete("/api/cards/{card_id}", status_code=204)
def delete_card(card_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(404)
    db.delete(card)
    db.commit()


@app.patch("/api/lists/{list_id}/cards/reorder", status_code=204)
def reorder_cards(list_id: int, body: schemas.ReorderCards, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    for pos, card_id in enumerate(body.card_ids):
        db.query(models.Card).filter(models.Card.id == card_id).update({"position": pos, "list_id": list_id})
    db.commit()


# ── Comments ──────────────────────────────────────────────────────────────────
@app.get("/api/cards/{card_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(card_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.Comment).filter(models.Comment.card_id == card_id).order_by(models.Comment.created_at).all()


@app.post("/api/cards/{card_id}/comments", response_model=schemas.CommentOut)
def create_comment(card_id: int, body: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(404)
    comment = models.Comment(content=body.content, card_id=card_id, author_id=current_user.id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@app.put("/api/comments/{comment_id}", response_model=schemas.CommentOut)
def update_comment(comment_id: int, body: schemas.CommentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404)
    if comment.author_id != current_user.id:
        raise HTTPException(403)
    comment.content = body.content
    db.commit()
    db.refresh(comment)
    return comment


@app.delete("/api/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404)
    if comment.author_id != current_user.id:
        raise HTTPException(403)
    db.delete(comment)
    db.commit()
