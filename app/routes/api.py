from flask import Blueprint, jsonify, request, current_app
from app.db import get_db

api_bp = Blueprint('api', __name__)

def row_to_dict(row):
    return dict(row) if row else {}

def rows_to_list(rows):
    return [dict(r) for r in rows]

def success(data=None, message='OK'):
    return jsonify({'success': True, 'message': message, 'data': data})

@api_bp.route('/portfolio', methods=['GET'])
def get_portfolio():
    db = get_db(current_app.config['DB_PATH'])
    try:
        contact = row_to_dict(db.execute("SELECT * FROM contact_info LIMIT 1").fetchone())
        summary = row_to_dict(db.execute("SELECT * FROM summary LIMIT 1").fetchone())
        skills = rows_to_list(db.execute("SELECT * FROM skills ORDER BY order_index").fetchall())
        education = rows_to_list(db.execute("SELECT * FROM education ORDER BY order_index").fetchall())
        projects = rows_to_list(db.execute("SELECT * FROM projects ORDER BY order_index").fetchall())
        experience = rows_to_list(db.execute("SELECT * FROM experience ORDER BY order_index").fetchall())
        certifications = rows_to_list(db.execute("SELECT * FROM certifications ORDER BY order_index").fetchall())
        achievements = rows_to_list(db.execute("SELECT * FROM achievements ORDER BY order_index").fetchall())
        settings_rows = db.execute("SELECT key, value FROM site_settings").fetchall()
        settings = {r['key']: r['value'] for r in settings_rows}
    finally:
        db.close()

    return success({
        'contact': contact, 'summary': summary, 'skills': skills,
        'education': education, 'projects': projects, 'experience': experience,
        'certifications': certifications, 'achievements': achievements,
        'settings': settings,
    })

@api_bp.route('/settings', methods=['GET'])
def get_settings():
    db = get_db(current_app.config['DB_PATH'])
    rows = db.execute("SELECT key, value FROM site_settings").fetchall()
    db.close()
    return success({r['key']: r['value'] for r in rows})

# Generic CRUD for simple tables
TABLES = {
    'skills': ['name', 'category', 'proficiency', 'icon', 'order_index'],
    'education': ['institution', 'degree', 'field', 'start_year', 'end_year', 'gpa', 'description', 'order_index'],
    'projects': ['title', 'description', 'tech_stack', 'github_url', 'live_url', 'image_url', 'featured', 'order_index'],
    'experience': ['company', 'role', 'start_date', 'end_date', 'current', 'description', 'technologies', 'order_index'],
    'certifications': ['name', 'issuer', 'date_issued', 'expiry_date', 'credential_url', 'image_url', 'order_index'],
    'achievements': ['title', 'description', 'date', 'icon', 'order_index'],
}

def register_crud(table, fields):
    @api_bp.route(f'/{table}', methods=['GET'], endpoint=f'get_{table}')
    def get_all():
        db = get_db(current_app.config['DB_PATH'])
        rows = db.execute(f"SELECT * FROM {table} ORDER BY {'order_index' if 'order_index' in fields else 'id'}").fetchall()
        db.close()
        return success(rows_to_list(rows))

    @api_bp.route(f'/{table}/<int:item_id>', methods=['GET'], endpoint=f'get_{table}_one')
    def get_one(item_id):
        db = get_db(current_app.config['DB_PATH'])
        row = db.execute(f"SELECT * FROM {table} WHERE id=?", (item_id,)).fetchone()
        db.close()
        if not row: return jsonify({'success': False, 'message': 'Not found'}), 404
        return success(dict(row))

    @api_bp.route(f'/{table}', methods=['POST'], endpoint=f'post_{table}')
    def create():
        data = request.get_json() or {}
        valid = {k: data.get(k) for k in fields}
        cols = ', '.join(valid.keys())
        placeholders = ', '.join(['?' for _ in valid])
        db = get_db(current_app.config['DB_PATH'])
        cur = db.execute(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})", list(valid.values()))
        db.commit()
        row = db.execute(f"SELECT * FROM {table} WHERE id=?", (cur.lastrowid,)).fetchone()
        db.close()
        return success(dict(row), 'Created')

    @api_bp.route(f'/{table}/<int:item_id>', methods=['PUT'], endpoint=f'put_{table}')
    def update(item_id):
        data = request.get_json() or {}
        valid = {k: data[k] for k in fields if k in data}
        if not valid: return success(None, 'Nothing to update')
        set_clause = ', '.join([f"{k}=?" for k in valid])
        db = get_db(current_app.config['DB_PATH'])
        db.execute(f"UPDATE {table} SET {set_clause} WHERE id=?", list(valid.values()) + [item_id])
        db.commit()
        row = db.execute(f"SELECT * FROM {table} WHERE id=?", (item_id,)).fetchone()
        db.close()
        if not row: return jsonify({'success': False, 'message': 'Not found'}), 404
        return success(dict(row), 'Updated')

    @api_bp.route(f'/{table}/<int:item_id>', methods=['DELETE'], endpoint=f'delete_{table}')
    def delete(item_id):
        db = get_db(current_app.config['DB_PATH'])
        db.execute(f"DELETE FROM {table} WHERE id=?", (item_id,))
        db.commit()
        db.close()
        return success(None, 'Deleted')

for table, fields in TABLES.items():
    register_crud(table, fields)
