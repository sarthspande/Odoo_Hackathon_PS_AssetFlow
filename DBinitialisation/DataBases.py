from . import db
from datetime import datetime


class Department(db.Model):
    __tablename__ = 'departments'
    department_id = db.Column(db.Integer, primary_key=True)
    department_name = db.Column(db.String(100), nullable=False)
    department_head_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    parent_department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'))
    status = db.Column(db.String(20), default='Active')

    head = db.relationship('Employee', foreign_keys=[department_head_id])


class Employee(db.Model):
    __tablename__ = 'employees'
    employee_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'))
    role = db.Column(db.String(50), default='Employee')
    status = db.Column(db.String(20), default='Active')

    department = db.relationship('Department', foreign_keys=[department_id], backref='employees')


class AssetCategory(db.Model):
    __tablename__ = 'asset_categories'
    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), nullable=False)
    warranty_period = db.Column(db.String(50))


class Asset(db.Model):
    __tablename__ = 'assets'
    asset_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('asset_categories.category_id'))
    asset_tag = db.Column(db.String(50), unique=True)
    serial_number = db.Column(db.String(100))
    acquisition_date = db.Column(db.Date)
    acquisition_cost = db.Column(db.Float)
    condition = db.Column(db.String(50))
    location = db.Column(db.String(100))
    photo_url = db.Column(db.String(255))
    is_bookable = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50), default='Available')

    category = db.relationship('AssetCategory', backref='assets')


class Allocation(db.Model):
    __tablename__ = 'allocations'
    allocation_id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.asset_id'))
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    allocation_date = db.Column(db.DateTime, default=datetime.utcnow)
    expected_return_date = db.Column(db.DateTime)

    asset = db.relationship('Asset', backref='allocations')
    employee = db.relationship('Employee', backref='allocations')


class Booking(db.Model):
    __tablename__ = 'bookings'
    booking_id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.asset_id'))
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='Upcoming')

    asset = db.relationship('Asset', backref='bookings')
    employee = db.relationship('Employee', backref='bookings')


class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    maintenance_id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.asset_id'))
    issue_description = db.Column(db.Text)
    priority = db.Column(db.String(20))
    photo_url = db.Column(db.String(255))
    status = db.Column(db.String(50), default='Pending')

    asset = db.relationship('Asset', backref='maintenance_requests')


class AuditCycle(db.Model):
    __tablename__ = 'audit_cycles'
    audit_id = db.Column(db.Integer, primary_key=True)
    scope = db.Column(db.String(100))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='Open')


class AuditDetail(db.Model):
    __tablename__ = 'audit_details'
    audit_detail_id = db.Column(db.Integer, primary_key=True)
    audit_id = db.Column(db.Integer, db.ForeignKey('audit_cycles.audit_id'))
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.asset_id'))
    auditor_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    verification_status = db.Column(db.String(50))

    audit = db.relationship('AuditCycle', backref='details')
    asset = db.relationship('Asset', backref='audit_details')
    auditor = db.relationship('Employee', backref='audit_details')


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    action_taken = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)
