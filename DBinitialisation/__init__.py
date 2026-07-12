from flask_sqlalchemy import SQLAlchemy
from pathlib import Path
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

db = SQLAlchemy()

# Import models so they are registered with SQLAlchemy before create_all()
from . import DataBases  # noqa: F401
from .DataBases import Department, Employee, AssetCategory, Asset, Allocation, Booking, MaintenanceRequest, AuditCycle, AuditDetail, ActivityLog


def init_db(app):
    db.init_app(app)
    create_db(app)


def create_db(app):
    uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    created = False
    if uri.startswith('sqlite:///'):
        db_path = uri.replace('sqlite:///', '', 1)
        db_file = Path(db_path)
        if not db_file.parent.exists():
            db_file.parent.mkdir(parents=True, exist_ok=True)
        if not db_file.exists():
            created = True

    with app.app_context():
        db.create_all()
        if created:
            seed_data(app)
        else:
            seed_data(app)
        print('Database created successfully.')


def seed_data(app):
    with app.app_context():
        if Employee.query.first():
            return

        it = Department(department_name='IT', status='Active')
        hr = Department(department_name='HR', status='Active')
        finance = Department(department_name='Finance', status='Active')
        db.session.add_all([it, hr, finance])
        db.session.flush()

        admin = Employee(
            name='Admin User',
            email='admin@example.com',
            password_hash=generate_password_hash('adminpass'),
            department_id=it.department_id,
            role='Admin',
            status='Active'
        )
        manager = Employee(
            name='Asset Manager',
            email='manager@example.com',
            password_hash=generate_password_hash('managerpass'),
            department_id=it.department_id,
            role='Asset Manager',
            status='Active'
        )
        employee = Employee(
            name='Jane Employee',
            email='jane@example.com',
            password_hash=generate_password_hash('janepass'),
            department_id=hr.department_id,
            role='Employee',
            status='Active'
        )
        finance_user = Employee(
            name='Bob Finance',
            email='bob@example.com',
            password_hash=generate_password_hash('bobpass'),
            department_id=finance.department_id,
            role='Employee',
            status='Active'
        )
        db.session.add_all([admin, manager, employee, finance_user])
        db.session.flush()

        laptop = AssetCategory(category_name='Laptop', warranty_period='24 months')
        phone = AssetCategory(category_name='Mobile', warranty_period='12 months')
        server = AssetCategory(category_name='Server', warranty_period='36 months')
        db.session.add_all([laptop, phone, server])
        db.session.flush()

        asset1 = Asset(
            name='Workstation Laptop',
            category_id=laptop.category_id,
            asset_tag='ASSET-1001',
            serial_number='SN-LAP-001',
            acquisition_date=datetime.utcnow().date(),
            acquisition_cost=1200.00,
            condition='Good',
            location='Office 1',
            is_bookable=True,
            status='Available'
        )
        asset2 = Asset(
            name='Mobile Phone',
            category_id=phone.category_id,
            asset_tag='ASSET-1002',
            serial_number='SN-PHN-002',
            acquisition_date=datetime.utcnow().date(),
            acquisition_cost=800.00,
            condition='Excellent',
            location='Office 2',
            is_bookable=True,
            status='Allocated'
        )
        asset3 = Asset(
            name='Server Rack',
            category_id=server.category_id,
            asset_tag='ASSET-1003',
            serial_number='SN-SRV-003',
            acquisition_date=datetime.utcnow().date(),
            acquisition_cost=5000.00,
            condition='Good',
            location='Data Center',
            is_bookable=False,
            status='Available'
        )
        db.session.add_all([asset1, asset2, asset3])
        db.session.flush()

        allocation = Allocation(
            asset_id=asset2.asset_id,
            employee_id=employee.employee_id,
            expected_return_date=datetime.utcnow() + timedelta(days=30)
        )
        booking = Booking(
            asset_id=asset1.asset_id,
            employee_id=manager.employee_id,
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(hours=4),
            status='Upcoming'
        )
        maintenance = MaintenanceRequest(
            asset_id=asset3.asset_id,
            issue_description='Routine inspection needed',
            priority='Medium',
            status='Pending'
        )
        audit = AuditCycle(
            scope='Annual inventory',
            start_date=datetime.utcnow().date(),
            end_date=(datetime.utcnow() + timedelta(days=7)).date(),
            status='Open'
        )
        db.session.add_all([allocation, booking, maintenance, audit])
        db.session.flush()

        audit_detail = AuditDetail(
            audit_id=audit.audit_id,
            asset_id=asset1.asset_id,
            auditor_id=manager.employee_id,
            verification_status='Pending'
        )
        activity = ActivityLog(
            user_id=admin.employee_id,
            action_taken='seed_data',
            timestamp=datetime.utcnow(),
            details='Initial database seeding completed.'
        )
        db.session.add_all([audit_detail, activity])
        db.session.commit()

