from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app import models
from app.routers import auth, products, cart
from app.routers import auth, products, cart, profile
from app.routers import auth, products, cart, profile, orders
from app.routers import auth, products, cart, profile, orders, reviews, configurator, chat, wishlist, retururi, service, vouchers, team, support, contact
import os
os.makedirs("uploads/products", exist_ok=True)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PC Shop API",
    description="API pentru magazin online componente PC",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(profile.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(configurator.router)
app.include_router(chat.router)
app.include_router(wishlist.router)
app.include_router(retururi.router)
app.include_router(service.router)
app.include_router(vouchers.router)
app.include_router(team.router)
app.include_router(support.router)
app.include_router(contact.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "PC Shop API functioneaza!"}

@app.get("/health")
def health():
    return {"status": "ok"}