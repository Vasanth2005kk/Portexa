from flask import Blueprint, render_template, current_app
from app.db import get_db

portfolio_bp = Blueprint('portfolio', __name__)

@portfolio_bp.route('/')
def index():
    db = get_db(current_app.config['DB_PATH'])
    contact = db.execute("SELECT * FROM contact_info LIMIT 1").fetchone()
    settings_rows = db.execute("SELECT key, value FROM site_settings").fetchall()
    db.close()
    settings = {r['key']: r['value'] for r in settings_rows}
    return render_template('index.html', settings=settings, contact=contact)
