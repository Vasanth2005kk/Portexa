from flask import (Blueprint, render_template, request, redirect,
                   url_for, flash, session, current_app)
from functools import wraps
from werkzeug.utils import secure_filename
from app.db import get_db, hash_password
import os, uuid

admin_bp = Blueprint('admin', __name__, template_folder='../templates/admin')
ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'}

@admin_bp.context_processor
def inject_settings():
    try:
        db = get_db(current_app.config['DB_PATH'])
        settings = {r['key']: r['value'] for r in db.execute("SELECT key,value FROM site_settings").fetchall()}
        db.close()
        return dict(settings=settings)
    except:
        return dict(settings={})

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated

def save_upload(file_obj):
    if file_obj and allowed_file(file_obj.filename):
        ext = file_obj.filename.rsplit('.', 1)[1].lower()
        fname = str(uuid.uuid4()) + '.' + ext
        file_obj.save(os.path.join(current_app.config['UPLOAD_FOLDER'], fname))
        return '/static/uploads/' + fname
    return None

# ── Auth ──────────────────────────────────────────────────
@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin.dashboard'))
    if request.method == 'POST':
        db = get_db(current_app.config['DB_PATH'])
        user = db.execute("SELECT * FROM admin WHERE username=? AND password_hash=?",
                          (request.form.get('username'), hash_password(request.form.get('password', '')))).fetchone()
        db.close()
        if user:
            session['admin_logged_in'] = True
            session['admin_user'] = user['username']
            return redirect(url_for('admin.dashboard'))
        flash('Invalid credentials', 'error')
    return render_template('admin/login.html')

@admin_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('admin.login'))

# ── Dashboard ─────────────────────────────────────────────
@admin_bp.route('/')
@login_required
def dashboard():
    db = get_db(current_app.config['DB_PATH'])
    stats = {
        'skills': db.execute("SELECT COUNT(*) FROM skills").fetchone()[0],
        'projects': db.execute("SELECT COUNT(*) FROM projects").fetchone()[0],
        'experience': db.execute("SELECT COUNT(*) FROM experience").fetchone()[0],
        'certifications': db.execute("SELECT COUNT(*) FROM certifications").fetchone()[0],
    }
    settings = {r['key']: r['value'] for r in db.execute("SELECT key,value FROM site_settings").fetchall()}
    db.close()
    return render_template('admin/dashboard.html', stats=stats, settings=settings)

# ── Contact ───────────────────────────────────────────────
@admin_bp.route('/contact', methods=['GET', 'POST'])
@login_required
def contact():
    db = get_db(current_app.config['DB_PATH'])
    item = db.execute("SELECT * FROM contact_info LIMIT 1").fetchone()
    if request.method == 'POST':
        f = request.form
        avatar_url = item['avatar_url'] if item else ''
        upload = save_upload(request.files.get('avatar'))
        if upload: avatar_url = upload
        if item:
            db.execute("""UPDATE contact_info SET name=?,title=?,email=?,phone=?,location=?,
                          linkedin=?,github=?,website=?,avatar_url=? WHERE id=?""",
                       (f.get('name'),f.get('title'),f.get('email'),f.get('phone'),f.get('location'),
                        f.get('linkedin'),f.get('github'),f.get('website'),avatar_url,item['id']))
        else:
            db.execute("""INSERT INTO contact_info (name,title,email,phone,location,linkedin,github,website,avatar_url)
                          VALUES (?,?,?,?,?,?,?,?,?)""",
                       (f.get('name'),f.get('title'),f.get('email'),f.get('phone'),f.get('location'),
                        f.get('linkedin'),f.get('github'),f.get('website'),avatar_url))
        db.commit()
        item = db.execute("SELECT * FROM contact_info LIMIT 1").fetchone()
        flash('Contact info updated!', 'success')
    db.close()
    return render_template('admin/contact.html', item=item or {})

# ── Summary ───────────────────────────────────────────────
@admin_bp.route('/summary', methods=['GET', 'POST'])
@login_required
def summary():
    db = get_db(current_app.config['DB_PATH'])
    item = db.execute("SELECT * FROM summary LIMIT 1").fetchone()
    if request.method == 'POST':
        content = request.form.get('content', '')
        tagline = request.form.get('tagline', '')
        if item:
            db.execute("UPDATE summary SET content=?, tagline=? WHERE id=?", (content, tagline, item['id']))
        else:
            db.execute("INSERT INTO summary (content, tagline) VALUES (?, ?)", (content, tagline))
        db.commit()
        item = db.execute("SELECT * FROM summary LIMIT 1").fetchone()
        flash('Summary updated!', 'success')
    db.close()
    return render_template('admin/summary.html', item=item or {})

# ── Skills ────────────────────────────────────────────────
@admin_bp.route('/skills')
@login_required
def skills():
    db = get_db(current_app.config['DB_PATH'])
    items = db.execute("SELECT * FROM skills ORDER BY order_index").fetchall()
    db.close()
    return render_template('admin/skills.html', items=[dict(i) for i in items])

@admin_bp.route('/skills/save', methods=['POST'])
@login_required
def skills_save():
    f = request.form
    item_id = f.get('id')
    db = get_db(current_app.config['DB_PATH'])
    
    icon = f.get('icon', '')
    
    # Handle file upload for icon
    upload = save_upload(request.files.get('icon_file'))
    if upload:
        icon = upload
    elif item_id and not icon:
        # If editing and no new icon provided, keep the old one
        existing = db.execute("SELECT icon FROM skills WHERE id=?", (item_id,)).fetchone()
        if existing:
            icon = existing['icon']
            
    if item_id:
        db.execute("UPDATE skills SET name=?,category=?,proficiency=?,icon=?,order_index=? WHERE id=?",
                   (f.get('name'), f.get('category'), int(f.get('proficiency', 80)),
                    icon, int(f.get('order_index', 0)), item_id))
    else:
        db.execute("INSERT INTO skills (name,category,proficiency,icon,order_index) VALUES (?,?,?,?,?)",
                   (f.get('name'), f.get('category'), int(f.get('proficiency', 80)),
                    icon, int(f.get('order_index', 0))))
                    
    db.commit(); db.close()
    flash('Skill card updated successfully!', 'success')
    return redirect(url_for('admin.skills'))

@admin_bp.route('/skills/delete/<int:item_id>', methods=['POST'])
@login_required
def skills_delete(item_id):
    db = get_db(current_app.config['DB_PATH'])
    db.execute("DELETE FROM skills WHERE id=?", (item_id,))
    db.commit(); db.close()
    flash('Skill deleted.', 'success')
    return redirect(url_for('admin.skills'))

# ── Projects ──────────────────────────────────────────────
@admin_bp.route('/projects')
@login_required
def projects():
    db = get_db(current_app.config['DB_PATH'])
    items = db.execute("SELECT * FROM projects ORDER BY order_index").fetchall()
    db.close()
    return render_template('admin/projects.html', items=[dict(i) for i in items])

@admin_bp.route('/projects/save', methods=['POST'])
@login_required
def projects_save():
    f = request.form
    item_id = f.get('id')
    db = get_db(current_app.config['DB_PATH'])
    image_url = ''
    if item_id:
        existing = db.execute("SELECT image_url FROM projects WHERE id=?", (item_id,)).fetchone()
        if existing: image_url = existing['image_url'] or ''
    upload = save_upload(request.files.get('image'))
    if upload: image_url = upload
    featured = 1 if f.get('featured') else 0
    if item_id:
        db.execute("""UPDATE projects SET title=?,description=?,tech_stack=?,github_url=?,
                      live_url=?,image_url=?,featured=?,order_index=? WHERE id=?""",
                   (f.get('title'),f.get('description'),f.get('tech_stack'),f.get('github_url'),
                    f.get('live_url'),image_url,featured,int(f.get('order_index',0)),item_id))
    else:
        db.execute("""INSERT INTO projects (title,description,tech_stack,github_url,live_url,image_url,featured,order_index)
                      VALUES (?,?,?,?,?,?,?,?)""",
                   (f.get('title'),f.get('description'),f.get('tech_stack'),f.get('github_url'),
                    f.get('live_url'),image_url,featured,int(f.get('order_index',0))))
    db.commit(); db.close()
    flash('Project saved!', 'success')
    return redirect(url_for('admin.projects'))

@admin_bp.route('/projects/delete/<int:item_id>', methods=['POST'])
@login_required
def projects_delete(item_id):
    db = get_db(current_app.config['DB_PATH'])
    db.execute("DELETE FROM projects WHERE id=?", (item_id,))
    db.commit(); db.close()
    flash('Project deleted.', 'success')
    return redirect(url_for('admin.projects'))

# ── Experience ────────────────────────────────────────────
@admin_bp.route('/experience')
@login_required
def experience():
    db = get_db(current_app.config['DB_PATH'])
    items = db.execute("SELECT * FROM experience ORDER BY order_index").fetchall()
    db.close()
    return render_template('admin/experience.html', items=[dict(i) for i in items])

@admin_bp.route('/experience/save', methods=['POST'])
@login_required
def experience_save():
    f = request.form
    item_id = f.get('id')
    current = 1 if f.get('current') else 0
    db = get_db(current_app.config['DB_PATH'])
    if item_id:
        db.execute("""UPDATE experience SET company=?,role=?,start_date=?,end_date=?,current=?,
                      description=?,technologies=?,order_index=? WHERE id=?""",
                   (f.get('company'),f.get('role'),f.get('start_date'),f.get('end_date'),current,
                    f.get('description'),f.get('technologies'),int(f.get('order_index',0)),item_id))
    else:
        db.execute("""INSERT INTO experience (company,role,start_date,end_date,current,description,technologies,order_index)
                      VALUES (?,?,?,?,?,?,?,?)""",
                   (f.get('company'),f.get('role'),f.get('start_date'),f.get('end_date'),current,
                    f.get('description'),f.get('technologies'),int(f.get('order_index',0))))
    db.commit(); db.close()
    flash('Experience saved!', 'success')
    return redirect(url_for('admin.experience'))

@admin_bp.route('/experience/delete/<int:item_id>', methods=['POST'])
@login_required
def experience_delete(item_id):
    db = get_db(current_app.config['DB_PATH'])
    db.execute("DELETE FROM experience WHERE id=?", (item_id,))
    db.commit(); db.close()
    flash('Experience deleted.', 'success')
    return redirect(url_for('admin.experience'))

# ── Education ─────────────────────────────────────────────
@admin_bp.route('/education')
@login_required
def education():
    db = get_db(current_app.config['DB_PATH'])
    items = db.execute("SELECT * FROM education ORDER BY order_index").fetchall()
    db.close()
    return render_template('admin/education.html', items=[dict(i) for i in items])

@admin_bp.route('/education/save', methods=['POST'])
@login_required
def education_save():
    f = request.form
    item_id = f.get('id')
    db = get_db(current_app.config['DB_PATH'])
    if item_id:
        db.execute("""UPDATE education SET institution=?,degree=?,field=?,start_year=?,end_year=?,
                      gpa=?,description=?,order_index=? WHERE id=?""",
                   (f.get('institution'),f.get('degree'),f.get('field'),f.get('start_year'),
                    f.get('end_year'),f.get('gpa'),f.get('description'),int(f.get('order_index',0)),item_id))
    else:
        db.execute("""INSERT INTO education (institution,degree,field,start_year,end_year,gpa,description,order_index)
                      VALUES (?,?,?,?,?,?,?,?)""",
                   (f.get('institution'),f.get('degree'),f.get('field'),f.get('start_year'),
                    f.get('end_year'),f.get('gpa'),f.get('description'),int(f.get('order_index',0))))
    db.commit(); db.close()
    flash('Education saved!', 'success')
    return redirect(url_for('admin.education'))

@admin_bp.route('/education/delete/<int:item_id>', methods=['POST'])
@login_required
def education_delete(item_id):
    db = get_db(current_app.config['DB_PATH'])
    db.execute("DELETE FROM education WHERE id=?", (item_id,))
    db.commit(); db.close()
    flash('Education deleted.', 'success')
    return redirect(url_for('admin.education'))

# ── Certifications ────────────────────────────────────────
@admin_bp.route('/certifications')
@login_required
def certifications():
    db = get_db(current_app.config['DB_PATH'])
    items = db.execute("SELECT * FROM certifications ORDER BY order_index").fetchall()
    db.close()
    return render_template('admin/certifications.html', items=[dict(i) for i in items])

@admin_bp.route('/certifications/save', methods=['POST'])
@login_required
def certifications_save():
    f = request.form
    item_id = f.get('id')
    db = get_db(current_app.config['DB_PATH'])
    if item_id:
        db.execute("""UPDATE certifications SET name=?,issuer=?,date_issued=?,expiry_date=?,
                      credential_url=?,order_index=? WHERE id=?""",
                   (f.get('name'),f.get('issuer'),f.get('date_issued'),f.get('expiry_date'),
                    f.get('credential_url'),int(f.get('order_index',0)),item_id))
    else:
        db.execute("""INSERT INTO certifications (name,issuer,date_issued,expiry_date,credential_url,order_index)
                      VALUES (?,?,?,?,?,?)""",
                   (f.get('name'),f.get('issuer'),f.get('date_issued'),f.get('expiry_date'),
                    f.get('credential_url'),int(f.get('order_index',0))))
    db.commit(); db.close()
    flash('Certification saved!', 'success')
    return redirect(url_for('admin.certifications'))

@admin_bp.route('/certifications/delete/<int:item_id>', methods=['POST'])
@login_required
def certifications_delete(item_id):
    db = get_db(current_app.config['DB_PATH'])
    db.execute("DELETE FROM certifications WHERE id=?", (item_id,))
    db.commit(); db.close()
    flash('Certification deleted.', 'success')
    return redirect(url_for('admin.certifications'))

# ── Achievements ──────────────────────────────────────────
@admin_bp.route('/achievements')
@login_required
def achievements():
    db = get_db(current_app.config['DB_PATH'])
    items = db.execute("SELECT * FROM achievements ORDER BY order_index").fetchall()
    db.close()
    return render_template('admin/achievements.html', items=[dict(i) for i in items])

@admin_bp.route('/achievements/save', methods=['POST'])
@login_required
def achievements_save():
    f = request.form
    item_id = f.get('id')
    db = get_db(current_app.config['DB_PATH'])
    if item_id:
        db.execute("UPDATE achievements SET title=?,description=?,date=?,icon=?,order_index=? WHERE id=?",
                   (f.get('title'),f.get('description'),f.get('date'),f.get('icon'),int(f.get('order_index',0)),item_id))
    else:
        db.execute("INSERT INTO achievements (title,description,date,icon,order_index) VALUES (?,?,?,?,?)",
                   (f.get('title'),f.get('description'),f.get('date'),f.get('icon'),int(f.get('order_index',0))))
    db.commit(); db.close()
    flash('Achievement saved!', 'success')
    return redirect(url_for('admin.achievements'))

@admin_bp.route('/achievements/delete/<int:item_id>', methods=['POST'])
@login_required
def achievements_delete(item_id):
    db = get_db(current_app.config['DB_PATH'])
    db.execute("DELETE FROM achievements WHERE id=?", (item_id,))
    db.commit(); db.close()
    flash('Achievement deleted.', 'success')
    return redirect(url_for('admin.achievements'))

# ── Settings ──────────────────────────────────────────────
@admin_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    db = get_db(current_app.config['DB_PATH'])
    if request.method == 'POST':
        keys = ['accent_color', 'secondary_color', 'bg_color', 'animation_speed',
                'animation_enabled', 'particle_count', 'site_title',
                'floater_count', 'icon_mappings', 'font_family', 'aos_enabled']
        for key in keys:
            val = request.form.get(key)
            if val is not None:
                exists = db.execute("SELECT id FROM site_settings WHERE key=?", (key,)).fetchone()
                if exists:
                    db.execute("UPDATE site_settings SET value=? WHERE key=?", (val, key))
                else:
                    db.execute("INSERT INTO site_settings (key,value) VALUES (?,?)", (key, val))
        
        # Handle Site Favicon Upload
        icon_upload = save_upload(request.files.get('site_favicon'))
        if icon_upload:
            exists = db.execute("SELECT id FROM site_settings WHERE key='site_favicon'").fetchone()
            if exists:
                db.execute("UPDATE site_settings SET value=? WHERE key='site_favicon'", (icon_upload,))
            else:
                db.execute("INSERT INTO site_settings (key,value) VALUES (?,?)", ('site_favicon', icon_upload))

        db.commit()
        flash('Settings saved!', 'success')
    settings = {r['key']: r['value'] for r in db.execute("SELECT key,value FROM site_settings").fetchall()}
    db.close()
    return render_template('admin/settings.html', settings=settings)

@admin_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    db = get_db(current_app.config['DB_PATH'])
    user = db.execute("SELECT * FROM admin WHERE username=? AND password_hash=?",
                      (session.get('admin_user'), hash_password(request.form.get('current_password','')))).fetchone()
    if user:
        db.execute("UPDATE admin SET password_hash=? WHERE id=?",
                   (hash_password(request.form.get('new_password','')), user['id']))
        db.commit()
        flash('Password changed!', 'success')
    else:
        flash('Current password incorrect.', 'error')
    db.close()
    return redirect(url_for('admin.settings'))
