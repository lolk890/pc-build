from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "pcbuild.db"

app = FastAPI(title="PC Build API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_product(row):
    """Приводит строку БД к формату, который ожидает фронтенд."""
    data = dict(row)
    data["shortDesc"] = data.pop("short_desc")
    data["specs"] = json.loads(data["specs"])
    return data


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class OrderCreate(BaseModel):
    user_id: int
    items: list


class ForgotPasswordRequest(BaseModel):
    email: str


@app.get("/api/products")
def get_products():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY id")
    products = [row_to_product(row) for row in cursor.fetchall()]
    conn.close()
    return products


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    conn.close()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return row_to_product(product)


@app.post("/api/register")
def register(user: UserCreate):
    # === ВАЛИДАЦИЯ НА СЕРВЕРЕ ===
    if len(user.username) < 2 or len(user.username) > 12:
        raise HTTPException(status_code=400, detail="Имя должно быть от 2 до 12 символов")
    if not all(c.isalnum() or c == '_' for c in user.username):
        raise HTTPException(status_code=400, detail="Имя может содержать только буквы, цифры и _")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не короче 6 символов")
    if "@" not in user.email or "." not in user.email:
        raise HTTPException(status_code=400, detail="Некорректный email")
    # ============================
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (user.username, user.email)
    )
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute(
        "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
        (user.username, user.email, hashed_password)
    )
    conn.commit()
    conn.close()
    return {"message": "Пользователь зарегистрирован", "username": user.username}


@app.post("/api/login")
def login(user: UserLogin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, hashed_password FROM users WHERE username = ?",
        (user.username,)
    )
    db_user = cursor.fetchone()
    conn.close()
    if not db_user:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["hashed_password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    return {
        "message": "Вход выполнен успешно",
        "user_id": db_user["id"],
        "username": db_user["username"]
    }


@app.post("/api/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()
    conn.close()
    return {
        "message": "Если этот email зарегистрирован, код восстановления отправлен."
    }


@app.post("/api/orders")
def create_order(order: OrderCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE id = ?", (order.user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=401, detail="Пользователь не авторизован или не существует")
    
    order_id = None
    for item in order.items:
        cursor.execute(
            "INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)",
            (order.user_id, item.get("product_id"), item.get("quantity", 1))
        )
        order_id = cursor.lastrowid
        
    conn.commit()
    conn.close()
    return {"message": "Заказ оформлен", "order_id": order_id}


@app.get("/api/orders")
def get_orders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
    orders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return orders


@app.get("/api/my-orders")
def get_my_orders(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    
    cursor.execute("""
        SELECT o.id as order_id, o.created_at, o.quantity, o.product_id, p.name as product_name, p.price
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    """, (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    orders_dict = {}
    for row in rows:
        oid = row["order_id"]
        if oid not in orders_dict:
            orders_dict[oid] = {
                "order_id": oid,
                "created_at": row["created_at"],
                "items": [],
                "total": 0
            }
        
        item_total = row["price"] * row["quantity"]
        orders_dict[oid]["items"].append({
            "product_id": row["product_id"],
            "name": row["product_name"],
            "quantity": row["quantity"],
            "price": row["price"],
            "total": item_total
        })
        orders_dict[oid]["total"] += item_total
    
    return list(orders_dict.values())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
