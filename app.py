from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, abort
from flask_socketio import SocketIO
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash
from DBinitialisation import init_db
from DBinitialisation.DataBases import (
    Department, Employee, ActivityLog, Asset, AssetCategory,
    Allocation, Booking, MaintenanceRequest
)
import os
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("API_KEY") or 'change-me'
db_file = Path(app.root_path) / 'assetflow.db'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f"sqlite:///{db_file.as_posix()}")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)
socketio = SocketIO(app, cors_allowed_origins='*')

from DBinitialisation import db

from functools import wraps

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def current_user():
    user_id = session.get('user_id')
    return Employee.query.get(user_id) if user_id else None


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if not session.get('user_id'):
            return redirect(url_for('login'))
        return view(*args, **kwargs)
    return wrapped_view


def role_required(*roles):
    """Restrict a route/endpoint to specific Employee.role values. Must sit
    inside @login_required so a session is guaranteed to exist first."""
    def decorator(view):
        @wraps(view)
        def wrapped_view(*args, **kwargs):
            current = current_user()
            if not current or (current.role or '') not in roles:
                return jsonify({'error': 'You do not have permission to do that.'}), 403
            return view(*args, **kwargs)
        return wrapped_view
    return decorator


# ---------------------------------------------------------------------------
# Navigation / template context helpers
# ---------------------------------------------------------------------------

ICONS = {
    'dashboard': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4v8H3v-8Zm7-9h4v17h-4V4Zm7 6h4v11h-4V10Z"/></svg>',
    'admin': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg>',
    'analytics': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 15l4-5 3 3 5-7"/></svg>',
    'all_assets': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    'reports': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.7 6.3 3 3L7 20H4v-3L14.7 6.3Zm0 0 2-2a2.1 2.1 0 0 1 3 3l-2 2"/></svg>',
    'register_allocate': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>',
    'approvals': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>',
    'dept': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m5-2.13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-2a4 4 0 1 0-3.5-6M6 8a4 4 0 1 0 3.5-6"/></svg>',
    'my_assets': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1ZM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    'booking': '<svg class="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>',
}

ROLE_DESCRIPTIONS = {
    'Admin': 'Organization-wide visibility across all assets, departments, and analytics.',
    'Asset Manager': 'Manage registration, allocation, and approval workflows for all assets.',
    'Department Head': 'Track and approve requests for assets within your department.',
    'Employee': 'View your assigned assets and manage your bookings & requests.'
}


def nav_item(key, name, endpoint=None, soon=False):
    return {
        'key': key,
        'name': name,
        'href': url_for(endpoint) if endpoint else '#',
        'icon': ICONS.get(key, ''),
        'soon': soon
    }


def get_nav_sections(role):
    dashboard_item = nav_item('dashboard', 'Dashboard', 'dashboard')

    if role == 'Admin':
        return [
            {'label': 'Overview', 'links': [dashboard_item]},
            {'label': 'Administration', 'links': [
                nav_item('admin', 'Admin Console', 'admin'),
                nav_item('analytics', 'Analytics', 'analytics'),
            ]},
            {'label': 'Assets', 'links': [
                nav_item('all_assets', 'All Assets', 'all_assets'),
                nav_item('reports', 'Report Issue', 'reports'),
            ]},
        ]
    if role == 'Asset Manager':
        return [
            {'label': 'Overview', 'links': [dashboard_item]},
            {'label': 'Asset Operations', 'links': [
                nav_item('all_assets', 'All Assets', 'all_assets'),
                nav_item('register_allocate', 'Register / Allocate Assets', soon=True),
                nav_item('approvals', 'Approval Workflows', soon=True),
            ]},
            {'label': 'Support', 'links': [nav_item('reports', 'Report Issue', 'reports')]},
        ]
    if role == 'Department Head':
        return [
            {'label': 'Overview', 'links': [dashboard_item]},
            {'label': 'Department', 'links': [
                nav_item('dept_assets', 'Department Assets', soon=True),
                nav_item('dept_approvals', 'Department Approvals', soon=True),
            ]},
            {'label': 'Insights', 'links': [
                nav_item('all_assets', 'All Assets', 'all_assets'),
                nav_item('analytics', 'Analytics', 'analytics'),
                nav_item('reports', 'Report Issue', 'reports'),
            ]},
        ]
    # Employee (default)
    return [
        {'label': 'My Workspace', 'links': [
            dashboard_item,
            nav_item('my_assets', 'My Assets', soon=True),
            nav_item('booking', 'Book Resource', soon=True),
        ]},
        {'label': 'Support', 'links': [nav_item('reports', 'Report Issue', 'reports')]},
    ]


def user_template_context(user):
    initials = ''.join([part[0] for part in (user.name or '').split()][:2]).upper() or 'U'
    return {
        'name': user.name,
        'employee_id': user.employee_id,
        'role': user.role or 'Employee',
        'initials': initials,
        'role_description': ROLE_DESCRIPTIONS.get(user.role, ROLE_DESCRIPTIONS['Employee']),
        'can_manage_assets': (user.role or '') in ('Admin', 'Asset Manager'),
    }


def render_app_page(template_name, active_nav, page_title, page_subtitle='', **extra):
    current = current_user()
    return render_template(
        template_name,
        active_nav=active_nav,
        page_title=page_title,
        page_subtitle=page_subtitle,
        current_user=user_template_context(current),
        nav_sections=get_nav_sections(current.role or 'Employee'),
        **extra
    )


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def department_to_dict(dept):
    return {
        'department_id': dept.department_id,
        'department_name': dept.department_name,
        'department_head_id': dept.department_head_id,
        'status': dept.status or 'Active'
    }


def category_to_dict(category):
    return {
        'category_id': category.category_id,
        'category_name': category.category_name,
        'warranty_period': category.warranty_period
    }


def user_to_dict(user):
    return {
        'employee_id': user.employee_id,
        'name': user.name,
        'email': user.email,
        'department_id': user.department_id,
        'department_name': user.department.department_name if getattr(user, 'department', None) else None,
        'role': user.role,
        'status': user.status
    }


def asset_to_dict(asset):
    return {
        'asset_id': asset.asset_id,
        'name': asset.name,
        'category_id': asset.category_id,
        'category_name': asset.category.category_name if getattr(asset, 'category', None) else None,
        'asset_tag': asset.asset_tag,
        'serial_number': asset.serial_number,
        'acquisition_date': asset.acquisition_date.isoformat() if asset.acquisition_date else None,
        'acquisition_cost': asset.acquisition_cost,
        'condition': asset.condition,
        'location': asset.location,
        'photo_url': asset.photo_url,
        'is_bookable': bool(asset.is_bookable),
        'status': asset.status
    }


def get_or_create_category(name):
    if not name:
        return None
    category = AssetCategory.query.filter_by(category_name=name).first()
    if category:
        return category
    category = AssetCategory(category_name=name)
    db.session.add(category)
    db.session.flush()
    return category


def get_or_create_department(name):
    if not name:
        return None
    department = Department.query.filter_by(department_name=name).first()
    if department:
        return department
    department = Department(department_name=name, status='Active')
    db.session.add(department)
    db.session.flush()
    return department


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if session.get('user_id'):
            return redirect(url_for('dashboard'))
        return render_template('login.html')

    employee_id = request.form.get('employee_id', '').strip()
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '').strip()

    user, error = authenticate_user(employee_id, email, password)
    if error:
        return render_template('login.html', error=error)

    session['user_id'] = user.employee_id
    session['username'] = user.name
    session['role'] = user.role

    db.session.add(ActivityLog(
        user_id=user.employee_id,
        action_taken='login',
        timestamp=datetime.utcnow(),
        details=f'User logged in; id={user.employee_id}, email={user.email}, role={user.role}'
    ))
    db.session.commit()

    if (user.role or '').lower() == 'admin':
        return redirect(url_for('admin'))
    return redirect(url_for('dashboard'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        if session.get('user_id'):
            return redirect(url_for('dashboard'))
        return render_template('register.html')

    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '').strip()
    department_name = request.form.get('department_name', '').strip()
    role = request.form.get('role', 'Employee').strip() or 'Employee'
    status = request.form.get('status', 'Active').strip() or 'Active'

    new_user, error = create_user(name, email, password, department_name, role, status)
    if error:
        return render_template('register.html', error=error)

    session['user_id'] = new_user.employee_id
    session['username'] = new_user.name
    session['role'] = new_user.role

    if (new_user.role or '').lower() == 'admin':
        return redirect(url_for('admin'))
    return redirect(url_for('dashboard'))


@app.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return redirect(url_for('login'))


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    return render_app_page('dashboard.html', 'dashboard', 'Dashboard', 'Live overview of your assets.')


@app.route('/admin', methods=['GET'])
@login_required
def admin():
    current = current_user()
    if not current or (current.role or '') != 'Admin':
        return redirect(url_for('dashboard'))
    return render_app_page('admin.html', 'admin', 'Admin Console', 'Manage departments, assets, users, and system state.')


@app.route('/all-assets', methods=['GET'])
@login_required
def all_assets():
    return render_app_page('all_assets.html', 'all_assets', 'All Assets', 'Browse every asset in the organization.')


@app.route('/analytics', methods=['GET'])
@login_required
def analytics():
    return render_app_page('analytics.html', 'analytics', 'Analytics', 'Organization-wide asset and workforce breakdowns.')


@app.route('/reports', methods=['GET'])
@login_required
def reports():
    return render_app_page('reports.html', 'reports', 'Report Issue', 'Report an issue related to an asset.')


# ---------------------------------------------------------------------------
# Department API
# ---------------------------------------------------------------------------

@app.route('/api/departments', methods=['GET'])
@login_required
def api_get_departments():
    departments = Department.query.order_by(Department.department_name).all()
    return jsonify([department_to_dict(d) for d in departments])


@app.route('/api/departments', methods=['POST'])
@login_required
@role_required('Admin')
def api_create_department():
    data = request.get_json() or {}
    name = data.get('department_name', '').strip()
    status = data.get('status', 'Active').strip() or 'Active'
    if not name:
        return jsonify({'error': 'Department name is required.'}), 400
    existing = Department.query.filter_by(department_name=name).first()
    if existing:
        return jsonify({'error': 'Department already exists.'}), 400
    dept = Department(department_name=name, status=status)
    db.session.add(dept)
    db.session.commit()
    return jsonify(department_to_dict(dept)), 201


@app.route('/api/departments/<int:department_id>', methods=['PUT'])
@login_required
@role_required('Admin')
def api_update_department(department_id):
    dept = Department.query.get_or_404(department_id)
    data = request.get_json() or {}
    if data.get('department_name'):
        dept.department_name = data.get('department_name').strip()
    if data.get('status'):
        dept.status = data.get('status').strip() or 'Active'
    db.session.commit()
    return jsonify(department_to_dict(dept))


@app.route('/api/departments/<int:department_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def api_delete_department(department_id):
    dept = Department.query.get_or_404(department_id)
    employees = Employee.query.filter_by(department_id=department_id).all()
    for emp in employees:
        emp.department_id = None
    db.session.delete(dept)
    db.session.commit()
    return jsonify({'success': True})


# ---------------------------------------------------------------------------
# User API
# ---------------------------------------------------------------------------

@app.route('/api/users', methods=['GET'])
@login_required
@role_required('Admin')
def api_get_users():
    users = Employee.query.order_by(Employee.name).all()
    return jsonify([user_to_dict(u) for u in users])


@app.route('/api/users', methods=['POST'])
@login_required
@role_required('Admin')
def api_create_user():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email is required.'}), 400
    existing = Employee.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'User already exists with this email.'}), 400
    department = None
    dept_name = data.get('department_name', '').strip()
    if dept_name:
        department = get_or_create_department(dept_name)
    user = Employee(
        name=data.get('name', '').strip() or 'New User',
        email=email,
        password_hash=generate_password_hash(data.get('password') or 'password'),
        department_id=department.department_id if department else None,
        role=data.get('role', 'Employee').strip() or 'Employee',
        status=data.get('status', 'Active').strip() or 'Active'
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user_to_dict(user)), 201


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
@role_required('Admin')
def api_update_user(user_id):
    user = Employee.query.get_or_404(user_id)
    data = request.get_json() or {}
    if data.get('name'):
        user.name = data.get('name').strip()
    if data.get('email'):
        user.email = data.get('email').strip()
    if data.get('password'):
        user.password_hash = generate_password_hash(data.get('password').strip())
    if data.get('role'):
        user.role = data.get('role').strip()
    if data.get('status'):
        user.status = data.get('status').strip()
    if data.get('department_name'):
        department = get_or_create_department(data.get('department_name').strip())
        user.department_id = department.department_id if department else None
    db.session.commit()
    return jsonify(user_to_dict(user))


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def api_delete_user(user_id):
    user = Employee.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True})


# ---------------------------------------------------------------------------
# Asset API
# ---------------------------------------------------------------------------

@app.route('/api/assets', methods=['GET'])
@login_required
def api_get_assets():
    items = Asset.query.order_by(Asset.asset_id).all()
    return jsonify([asset_to_dict(a) for a in items])


@app.route('/api/assets', methods=['POST'])
@login_required
@role_required('Admin')
def api_create_asset():
    data = request.get_json() or {}
    if not data.get('name') or not data.get('asset_tag'):
        return jsonify({'error': 'Asset name and tag are required.'}), 400
    category = get_or_create_category(data.get('category_name', '').strip())
    asset = Asset(
        name=data.get('name').strip(),
        category_id=category.category_id if category else None,
        asset_tag=data.get('asset_tag').strip(),
        serial_number=(data.get('serial_number') or '').strip(),
        acquisition_date=data.get('acquisition_date') or None,
        acquisition_cost=float(data.get('acquisition_cost') or 0),
        condition=(data.get('condition') or '').strip() or 'Good',
        location=(data.get('location') or '').strip(),
        photo_url=(data.get('photo_url') or '').strip(),
        is_bookable=bool(data.get('is_bookable', False)),
        status=data.get('status', 'Available').strip() or 'Available'
    )
    db.session.add(asset)
    db.session.commit()
    return jsonify(asset_to_dict(asset)), 201


@app.route('/api/assets/<int:asset_id>', methods=['PUT'])
@login_required
@role_required('Admin')
def api_update_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data = request.get_json() or {}
    if data.get('name'):
        asset.name = data.get('name').strip()
    if data.get('asset_tag'):
        asset.asset_tag = data.get('asset_tag').strip()
    if data.get('serial_number') is not None:
        asset.serial_number = data.get('serial_number').strip()
    if data.get('acquisition_date') is not None:
        asset.acquisition_date = data.get('acquisition_date') or None
    if data.get('acquisition_cost') is not None:
        asset.acquisition_cost = float(data.get('acquisition_cost') or 0)
    if data.get('condition') is not None:
        asset.condition = data.get('condition').strip()
    if data.get('location') is not None:
        asset.location = data.get('location').strip()
    if data.get('photo_url') is not None:
        asset.photo_url = data.get('photo_url').strip()
    if data.get('is_bookable') is not None:
        asset.is_bookable = bool(data.get('is_bookable'))
    if data.get('status'):
        asset.status = data.get('status').strip()
    if data.get('category_name'):
        category = get_or_create_category(data.get('category_name').strip())
        asset.category_id = category.category_id if category else None
    db.session.commit()
    return jsonify(asset_to_dict(asset))


@app.route('/api/assets/<int:asset_id>', methods=['DELETE'])
@login_required
@role_required('Admin')
def api_delete_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    db.session.delete(asset)
    db.session.commit()
    return jsonify({'success': True})


# ---------------------------------------------------------------------------
# Maintenance API (Report Issue page)
# ---------------------------------------------------------------------------

@app.route('/api/maintenance', methods=['POST'])
@login_required
def api_create_maintenance():
    data = request.get_json() or {}
    asset_id = data.get('asset_id')
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    category = (data.get('category') or '').strip()
    priority = (data.get('priority') or 'Medium').strip() or 'Medium'

    if not asset_id or not title or not description:
        return jsonify({'error': 'Asset, title, and description are required.'}), 400

    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({'error': 'Selected asset was not found.'}), 400

    combined_description = f'[{category or "Other"}] {title}: {description}' if category else f'{title}: {description}'

    maintenance = MaintenanceRequest(
        asset_id=asset.asset_id,
        issue_description=combined_description,
        priority=priority,
        status='Pending'
    )
    db.session.add(maintenance)

    current = current_user()
    db.session.add(ActivityLog(
        user_id=current.employee_id,
        action_taken='report_issue',
        timestamp=datetime.utcnow(),
        details=f'Issue reported for asset {asset.asset_tag}: {title}'
    ))
    db.session.commit()

    return jsonify({
        'maintenance_id': maintenance.maintenance_id,
        'asset_id': maintenance.asset_id,
        'priority': maintenance.priority,
        'status': maintenance.status
    }), 201


# ---------------------------------------------------------------------------
# Dashboard API
# ---------------------------------------------------------------------------

@app.route('/api/dashboard', methods=['GET'])
@login_required
def api_dashboard():
    current = current_user()
    now = datetime.utcnow()
    horizon = now + timedelta(days=14)

    kpis = {
        'available': Asset.query.filter_by(status='Available').count(),
        'allocated': Asset.query.filter_by(status='Allocated').count(),
        'maintenance_pending': MaintenanceRequest.query.filter_by(status='Pending').count(),
        'active_bookings': Booking.query.filter(Booking.status.in_(['Upcoming', 'Active'])).count(),
        'active_allocations': Allocation.query.count(),
    }

    allocation_query = Allocation.query
    role = current.role or 'Employee'
    if role == 'Employee':
        allocation_query = allocation_query.filter(Allocation.employee_id == current.employee_id)
    elif role == 'Department Head':
        dept_employee_ids = [e.employee_id for e in Employee.query.filter_by(department_id=current.department_id).all()]
        allocation_query = allocation_query.filter(Allocation.employee_id.in_(dept_employee_ids or [-1]))
    # Admin / Asset Manager see the org-wide picture, no extra filter.

    overdue = allocation_query.filter(
        Allocation.expected_return_date.isnot(None),
        Allocation.expected_return_date < now
    ).order_by(Allocation.expected_return_date).all()

    upcoming = allocation_query.filter(
        Allocation.expected_return_date.isnot(None),
        Allocation.expected_return_date >= now,
        Allocation.expected_return_date <= horizon
    ).order_by(Allocation.expected_return_date).all()

    def serialize(alloc, overdue_flag):
        asset = alloc.asset
        holder = alloc.employee
        entry = {
            'id': alloc.allocation_id,
            'asset': asset.name if asset else 'Unknown asset',
            'tag': asset.asset_tag if asset else '',
            'holder': holder.name if holder else 'Unknown',
            'due_date': alloc.expected_return_date.strftime('%b %d, %Y') if alloc.expected_return_date else '—',
        }
        if overdue_flag:
            entry['days_overdue'] = max((now - alloc.expected_return_date).days, 0)
        else:
            entry['days_left'] = max((alloc.expected_return_date - now).days, 0)
        return entry

    return jsonify({
        'kpis': kpis,
        'overdue_returns': [serialize(a, True) for a in overdue],
        'upcoming_returns': [serialize(a, False) for a in upcoming],
    })


# ---------------------------------------------------------------------------
# Analytics API
# ---------------------------------------------------------------------------

@app.route('/api/analytics', methods=['GET'])
@login_required
def api_analytics():
    assets_by_status = {}
    for status, count in db.session.query(Asset.status, db.func.count(Asset.asset_id)).group_by(Asset.status).all():
        assets_by_status[status or 'Unspecified'] = count

    assets_by_category = {}
    rows = db.session.query(AssetCategory.category_name, db.func.count(Asset.asset_id)) \
        .outerjoin(Asset, Asset.category_id == AssetCategory.category_id) \
        .group_by(AssetCategory.category_name).all()
    for category_name, count in rows:
        assets_by_category[category_name or 'Uncategorized'] = count
    uncategorized_count = Asset.query.filter(Asset.category_id.is_(None)).count()
    if uncategorized_count:
        assets_by_category['Uncategorized'] = assets_by_category.get('Uncategorized', 0) + uncategorized_count

    employees_by_department = {}
    rows = db.session.query(Department.department_name, db.func.count(Employee.employee_id)) \
        .outerjoin(Employee, Employee.department_id == Department.department_id) \
        .group_by(Department.department_name).all()
    for dept_name, count in rows:
        employees_by_department[dept_name or 'Unassigned'] = count

    maintenance_by_priority = {}
    for priority, count in db.session.query(MaintenanceRequest.priority, db.func.count(MaintenanceRequest.maintenance_id)).group_by(MaintenanceRequest.priority).all():
        maintenance_by_priority[priority or 'Unspecified'] = count

    return jsonify({
        'assets_by_status': assets_by_status,
        'assets_by_category': assets_by_category,
        'employees_by_department': employees_by_department,
        'maintenance_by_priority': maintenance_by_priority,
    })


# ---------------------------------------------------------------------------
# Auth business logic (shared by HTTP + Socket.IO handlers)
# ---------------------------------------------------------------------------

def authenticate_user(employee_id, email, password):
    if not employee_id and not email:
        return None, 'Enter your email or employee ID.'
    if not password:
        return None, 'Enter your password.'

    user = None
    if employee_id:
        try:
            user = Employee.query.filter_by(employee_id=int(employee_id)).first()
        except ValueError:
            user = None
    if not user and email:
        user = Employee.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return None, 'Invalid email / ID or password.'
    if (user.status or '').lower() != 'active':
        return None, 'Your account is not active.'
    return user, None


def create_user(name, email, password, department_name, role, status):
    if not name or not email or not password:
        return None, 'Name, email and password are required.'
    email = email.strip()
    if Employee.query.filter_by(email=email).first():
        return None, 'A user already exists with that email.'

    department = get_or_create_department(department_name.strip()) if department_name else None
    user = Employee(
        name=name.strip(),
        email=email,
        password_hash=generate_password_hash(password.strip()),
        department_id=department.department_id if department else None,
        role=(role or 'Employee').strip() or 'Employee',
        status=(status or 'Active').strip() or 'Active'
    )
    db.session.add(user)
    db.session.commit()
    return user, None


# ---------------------------------------------------------------------------
# Socket.IO handlers
# ---------------------------------------------------------------------------

@socketio.on('login')
def handle_socket_login(data):
    app.logger.info('Socket login request received: %s', data)
    employee_id = (data.get('employee_id') or '').strip()
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()

    with app.app_context():
        user, error = authenticate_user(employee_id, email, password)
        if error:
            socketio.emit('login_response', {'success': False, 'error': error}, room=request.sid)
            return

        session['user_id'] = user.employee_id
        session['username'] = user.name
        session['role'] = user.role

        db.session.add(ActivityLog(
            user_id=user.employee_id,
            action_taken='login',
            timestamp=datetime.utcnow(),
            details=f'User logged in via websocket; id={user.employee_id}, email={user.email}, role={user.role}'
        ))
        db.session.commit()

        redirect_url = url_for('admin') if (user.role or '').lower() == 'admin' else url_for('dashboard')
        socketio.emit('login_response', {'success': True, 'redirect': redirect_url}, room=request.sid)


@socketio.on('register')
def handle_socket_register(data):
    app.logger.info('Socket register request received: %s', data)
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()
    department_name = (data.get('department_name') or '').strip()
    role = (data.get('role') or 'Employee').strip()
    status = (data.get('status') or 'Active').strip()

    with app.app_context():
        user, error = create_user(name, email, password, department_name, role, status)
        if error:
            socketio.emit('register_response', {'success': False, 'error': error}, room=request.sid)
            return

        session['user_id'] = user.employee_id
        session['username'] = user.name
        session['role'] = user.role

        db.session.add(ActivityLog(
            user_id=user.employee_id,
            action_taken='register',
            timestamp=datetime.utcnow(),
            details=f'User registered via websocket; id={user.employee_id}, email={user.email}, role={user.role}'
        ))
        db.session.commit()

        redirect_url = url_for('admin') if (user.role or '').lower() == 'admin' else url_for('dashboard')
        socketio.emit('register_response', {'success': True, 'redirect': redirect_url}, room=request.sid)


if __name__ == '__main__':
    socketio.run(app, debug=True)
