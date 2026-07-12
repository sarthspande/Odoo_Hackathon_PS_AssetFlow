from flask_sqlalchemy import SQLAlchemy
from pathlib import Path

db = SQLAlchemy()

# Import models so they are registered with SQLAlchemy before create_all()
from . import DataBases  # noqa: F401


def init_db(app):
    db.init_app(app)
    create_db(app)


def create_db(app):
    uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if uri.startswith('sqlite:///'):
        db_path = uri.replace('sqlite:///', '', 1)
        db_file = Path(db_path)
        if db_file.exists():
            print(f'Database already exists: {db_file}')
            return
        if db_file.parent and not db_file.parent.exists():
            db_file.parent.mkdir(parents=True, exist_ok=True)

    with app.app_context():
        db.create_all()
        print('Database created successfully.')

