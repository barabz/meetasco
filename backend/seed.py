import os
import sys
from datetime import datetime, timedelta

# Delete existing DB so schema is fresh
db_path = os.path.join(os.path.dirname(__file__), "taskboard.db")
if os.path.exists(db_path):
    os.remove(db_path)
    print("Removed existing taskboard.db")

from database import engine, SessionLocal
import models
from auth import hash_password

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # Users
    admin = models.User(username="admin", email="admin@taskboard.dev", full_name="Admin User", hashed_password=hash_password("admin123"), avatar_color="#7c3aed")
    john  = models.User(username="john",  email="john@taskboard.dev",  full_name="John Smith",  hashed_password=hash_password("john123"),  avatar_color="#2563eb")
    jane  = models.User(username="jane",  email="jane@taskboard.dev",  full_name="Jane Doe",    hashed_password=hash_password("jane123"),  avatar_color="#059669")
    db.add_all([admin, john, jane])
    db.commit()
    print("Users seeded")

    now = datetime.utcnow()

    # Board 1
    b1 = models.Board(title="Product Development Q4 2025", description="Core product features and infrastructure improvements", color="#7c3aed", owner_id=admin.id)
    db.add(b1)
    db.commit()

    # Labels for Board 1
    b1_labels = [
        models.Label(name="Bug",      color="#ef4444", board_id=b1.id),
        models.Label(name="Feature",  color="#3b82f6", board_id=b1.id),
        models.Label(name="Design",   color="#a855f7", board_id=b1.id),
        models.Label(name="Backend",  color="#f97316", board_id=b1.id),
        models.Label(name="Frontend", color="#06b6d4", board_id=b1.id),
        models.Label(name="Urgent",   color="#dc2626", board_id=b1.id),
        models.Label(name="Research", color="#84cc16", board_id=b1.id),
    ]
    db.add_all(b1_labels)
    db.commit()
    b1_bug, b1_feat, b1_design, b1_back, b1_front, b1_urgent, b1_research = b1_labels

    # Lists for Board 1
    l1_backlog = models.List(title="Backlog",     position=0, board_id=b1.id)
    l1_todo    = models.List(title="To Do",       position=1, board_id=b1.id)
    l1_doing   = models.List(title="In Progress", position=2, board_id=b1.id)
    l1_done    = models.List(title="Done",        position=3, board_id=b1.id)
    db.add_all([l1_backlog, l1_todo, l1_doing, l1_done])
    db.commit()

    # Cards Board 1
    cards_b1 = [
        models.Card(title="Redesign onboarding flow",           description="Improve new user experience with guided setup",             deadline=now+timedelta(days=14), position=0, list_id=l1_backlog.id),
        models.Card(title="API rate limiting",                   description="Implement token-bucket rate limiting on all public routes", deadline=now+timedelta(days=7),  position=1, list_id=l1_backlog.id),
        models.Card(title="Dark mode support",                   description="Add full dark-mode theme with system preference detection", deadline=now+timedelta(days=21), position=2, list_id=l1_backlog.id),
        models.Card(title="Set up CI/CD pipeline",               description="Configure GitHub Actions for automated testing and deployment", deadline=now+timedelta(days=3), position=0, list_id=l1_todo.id),
        models.Card(title="Write API documentation",             description="Document all endpoints using OpenAPI spec",                deadline=now+timedelta(days=5),  position=1, list_id=l1_todo.id),
        models.Card(title="Implement search functionality",      description="Full-text search across boards and cards",                deadline=now-timedelta(days=1),  position=2, list_id=l1_todo.id),
        models.Card(title="Database performance optimization",   description="Add indexes and optimize slow queries",                   deadline=now+timedelta(days=2),  position=0, list_id=l1_doing.id),
        models.Card(title="User authentication refactor",        description="Migrate to OAuth2 with refresh token support",           deadline=now+timedelta(days=4),  position=1, list_id=l1_doing.id),
        models.Card(title="Mobile responsive layout",            description="Ensure all pages work well on mobile devices",           deadline=now-timedelta(days=2),  position=2, list_id=l1_doing.id),
        models.Card(title="Initial project setup",               description="Scaffolded React + FastAPI project structure",           deadline=now-timedelta(days=10), position=0, list_id=l1_done.id, is_completed=True),
        models.Card(title="Database schema design",              description="Designed ERD and created initial migrations",            deadline=now-timedelta(days=8),  position=1, list_id=l1_done.id, is_completed=True),
        models.Card(title="Authentication system",               description="JWT-based login and registration implemented",           deadline=now-timedelta(days=5),  position=2, list_id=l1_done.id, is_completed=True),
    ]
    db.add_all(cards_b1)
    db.commit()

    # Assign labels + members to cards
    cards_b1[0].labels = [b1_design, b1_front];  cards_b1[0].members = [jane, john]
    cards_b1[1].labels = [b1_back, b1_urgent];   cards_b1[1].members = [admin]
    cards_b1[2].labels = [b1_design, b1_front];  cards_b1[2].members = [jane]
    cards_b1[3].labels = [b1_back];               cards_b1[3].members = [admin, john]
    cards_b1[4].labels = [b1_back, b1_research];  cards_b1[4].members = [john]
    cards_b1[5].labels = [b1_feat, b1_back, b1_front]; cards_b1[5].members = [john, jane]
    cards_b1[6].labels = [b1_back, b1_urgent];   cards_b1[6].members = [admin]
    cards_b1[7].labels = [b1_back, b1_feat];     cards_b1[7].members = [admin, john]
    cards_b1[8].labels = [b1_front, b1_design];  cards_b1[8].members = [jane]
    cards_b1[9].labels  = [b1_back, b1_front];   cards_b1[9].members  = [admin]
    cards_b1[10].labels = [b1_back];              cards_b1[10].members = [admin]
    cards_b1[11].labels = [b1_back, b1_feat];    cards_b1[11].members = [admin, john]
    db.commit()

    # Comments on some Board 1 cards
    comments_b1 = [
        models.Comment(content="I'll start on the wireframes tomorrow.",            card_id=cards_b1[0].id, author_id=jane.id,  created_at=now-timedelta(hours=5)),
        models.Comment(content="Check Figma for the latest mockups I uploaded.",    card_id=cards_b1[0].id, author_id=admin.id, created_at=now-timedelta(hours=3)),
        models.Comment(content="Token bucket is better than leaky bucket for bursts.", card_id=cards_b1[1].id, author_id=john.id, created_at=now-timedelta(hours=8)),
        models.Comment(content="Agreed. I'll use slowapi library for this.",        card_id=cards_b1[1].id, author_id=admin.id, created_at=now-timedelta(hours=6)),
        models.Comment(content="Deadline passed. Need to prioritize this ASAP.",    card_id=cards_b1[5].id, author_id=admin.id, created_at=now-timedelta(hours=2)),
        models.Comment(content="I can pair with you on the Elasticsearch setup.",   card_id=cards_b1[5].id, author_id=john.id,  created_at=now-timedelta(hours=1)),
        models.Comment(content="Found 3 missing indexes on the cards table.",       card_id=cards_b1[6].id, author_id=admin.id, created_at=now-timedelta(hours=12)),
        models.Comment(content="Performance improved 40% after the index changes.", card_id=cards_b1[6].id, author_id=john.id,  created_at=now-timedelta(hours=4)),
    ]
    db.add_all(comments_b1)
    db.commit()
    print("Board 1 seeded")

    # Board 2
    b2 = models.Board(title="Marketing Campaign - Launch", description="Q4 product launch marketing initiatives", color="#2563eb", owner_id=john.id)
    db.add(b2)
    db.commit()

    # Labels for Board 2
    b2_labels = [
        models.Label(name="Copy",    color="#f59e0b", board_id=b2.id),
        models.Label(name="Visual",  color="#ec4899", board_id=b2.id),
        models.Label(name="Social",  color="#8b5cf6", board_id=b2.id),
        models.Label(name="Email",   color="#14b8a6", board_id=b2.id),
        models.Label(name="Paid Ads",color="#f97316", board_id=b2.id),
        models.Label(name="SEO",     color="#22c55e", board_id=b2.id),
        models.Label(name="Review",  color="#ef4444", board_id=b2.id),
    ]
    db.add_all(b2_labels)
    db.commit()
    b2_copy, b2_visual, b2_social, b2_email, b2_paid, b2_seo, b2_review = b2_labels

    # Lists for Board 2
    l2_ideas   = models.List(title="Ideas",       position=0, board_id=b2.id)
    l2_planned = models.List(title="Planned",     position=1, board_id=b2.id)
    l2_active  = models.List(title="Active",      position=2, board_id=b2.id)
    l2_done    = models.List(title="Completed",   position=3, board_id=b2.id)
    db.add_all([l2_ideas, l2_planned, l2_active, l2_done])
    db.commit()

    # Cards Board 2
    cards_b2 = [
        models.Card(title="Influencer outreach campaign",    description="Identify and contact 20 micro-influencers in our niche",          deadline=now+timedelta(days=10), position=0, list_id=l2_ideas.id),
        models.Card(title="Viral social media challenge",    description="Design a hashtag challenge to drive user-generated content",      deadline=now+timedelta(days=15), position=1, list_id=l2_ideas.id),
        models.Card(title="Press release draft",             description="Announce the Q4 product launch to major tech publications",       deadline=now+timedelta(days=5),  position=0, list_id=l2_planned.id),
        models.Card(title="Email newsletter sequence",       description="6-part email sequence building up to launch day",                deadline=now+timedelta(days=8),  position=1, list_id=l2_planned.id),
        models.Card(title="Google Ads campaign setup",       description="Create and configure Google Ads targeting product keywords",      deadline=now-timedelta(days=1),  position=2, list_id=l2_planned.id),
        models.Card(title="Landing page optimization",       description="A/B test hero section and CTA copy",                             deadline=now+timedelta(days=3),  position=0, list_id=l2_active.id),
        models.Card(title="Social media content calendar",   description="Plan 30 days of posts across Instagram, Twitter, LinkedIn",      deadline=now+timedelta(days=2),  position=1, list_id=l2_active.id),
        models.Card(title="SEO keyword research",            description="Research and document target keywords for the launch",           deadline=now-timedelta(days=3),  position=2, list_id=l2_active.id),
        models.Card(title="Brand guidelines document",       description="Created comprehensive visual and tone-of-voice guidelines",      deadline=now-timedelta(days=15), position=0, list_id=l2_done.id, is_completed=True),
        models.Card(title="Competitor analysis",             description="Analyzed top 5 competitors' marketing strategies",              deadline=now-timedelta(days=12), position=1, list_id=l2_done.id, is_completed=True),
        models.Card(title="Target audience personas",        description="Developed 4 detailed buyer personas",                           deadline=now-timedelta(days=9),  position=2, list_id=l2_done.id, is_completed=True),
        models.Card(title="Marketing budget allocation",     description="Q4 budget approved and allocated across channels",              deadline=now-timedelta(days=6),  position=3, list_id=l2_done.id, is_completed=True),
    ]
    db.add_all(cards_b2)
    db.commit()

    # Assign labels + members to Board 2 cards
    cards_b2[0].labels = [b2_social];           cards_b2[0].members = [jane]
    cards_b2[1].labels = [b2_social, b2_visual]; cards_b2[1].members = [jane, john]
    cards_b2[2].labels = [b2_copy];             cards_b2[2].members = [john]
    cards_b2[3].labels = [b2_email, b2_copy];   cards_b2[3].members = [john, jane]
    cards_b2[4].labels = [b2_paid];             cards_b2[4].members = [admin]
    cards_b2[5].labels = [b2_visual, b2_copy, b2_review]; cards_b2[5].members = [jane]
    cards_b2[6].labels = [b2_social, b2_visual]; cards_b2[6].members = [jane, john]
    cards_b2[7].labels = [b2_seo];              cards_b2[7].members = [john]
    cards_b2[8].labels  = [b2_visual];          cards_b2[8].members  = [jane]
    cards_b2[9].labels  = [b2_copy];            cards_b2[9].members  = [admin, john]
    cards_b2[10].labels = [b2_copy, b2_visual]; cards_b2[10].members = [jane]
    cards_b2[11].labels = [b2_paid, b2_email];  cards_b2[11].members = [admin]
    db.commit()

    # Comments on Board 2 cards
    comments_b2 = [
        models.Comment(content="I have contacts at 5 influencers already. Shall I reach out?", card_id=cards_b2[0].id, author_id=jane.id,  created_at=now-timedelta(hours=6)),
        models.Comment(content="Yes please! Focus on micro-influencers with 10k-50k followers.", card_id=cards_b2[0].id, author_id=john.id, created_at=now-timedelta(hours=5)),
        models.Comment(content="First draft of the press release is ready for review.",          card_id=cards_b2[2].id, author_id=john.id,  created_at=now-timedelta(hours=10)),
        models.Comment(content="Need to revise the opening paragraph - too technical.",          card_id=cards_b2[2].id, author_id=admin.id, created_at=now-timedelta(hours=7)),
        models.Comment(content="Google Ads deadline passed! We need to expedite this.",          card_id=cards_b2[4].id, author_id=admin.id, created_at=now-timedelta(hours=3)),
        models.Comment(content="Campaign is now live. Tracking conversions in Analytics.",       card_id=cards_b2[5].id, author_id=jane.id,  created_at=now-timedelta(hours=2)),
        models.Comment(content="SEO audit shows we're missing long-tail keywords.",              card_id=cards_b2[7].id, author_id=john.id,  created_at=now-timedelta(hours=8)),
        models.Comment(content="Added 50 more keywords. Check the shared spreadsheet.",         card_id=cards_b2[7].id, author_id=jane.id,  created_at=now-timedelta(hours=4)),
    ]
    db.add_all(comments_b2)
    db.commit()
    print("Board 2 seeded")

    print("Seeding complete! Login: admin/admin123, john/john123, jane/jane123")

except Exception as e:
    db.rollback()
    print(f"Error: {e}")
    sys.exit(1)
finally:
    db.close()
