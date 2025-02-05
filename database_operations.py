import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", 'database.db')

def db_query(statement, params=()):
	with sqlite3.connect(DB_PATH) as conn:
		conn.row_factory = sqlite3.Row
		cursor = conn.cursor()
		cursor.execute(statement, params)
		rows = cursor.fetchall()
		result = [dict(row) for row in rows]
		return result


def db_execute(statement, params=()):
	with sqlite3.connect(DB_PATH) as conn:
		cursor = conn.cursor()
		conn.execute("PRAGMA foreign_keys = ON;")
		cursor.execute(statement, params)
		conn.commit()
		return cursor.lastrowid


# db_execute("""
# CREATE TABLE users (
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     username TEXT UNIQUE NOT NULL,
#     email TEXT UNIQUE NOT NULL,
#     password TEXT NOT NULL,
#     is_active BOOLEAN DEFAULT 1,
#     otp TEXT,
#     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );
# """)

# db_execute("INSERT INTO Users (username, email, password, is_active, otp) VALUES (?, ?, ?, ?, ?)",
#            ("Macw07", "marco.shengqi@gmail.com", "$2a$12$2GhwJj3k0cUNep/DDUhlhumM9zX0wJUnMNeKXG9rhkGEeJ5wpx/3e", 1, "JBSWY3DPEHPK3PXP"))
