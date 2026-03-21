from flask import Flask
import os

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    app.config['DB_PATH'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'portfolio.db')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.dirname(app.config['DB_PATH']), exist_ok=True)

    from app.db import init_db
    init_db(app.config['DB_PATH'])

    from app.routes.portfolio import portfolio_bp
    from app.routes.admin import admin_bp
    from app.routes.api import api_bp

    app.register_blueprint(portfolio_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
