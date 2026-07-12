from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, abort
from flask_socketio import SocketIO
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash
from DBinitialisation import init_db
from DBinitialisation.DataBases import Department, Employee, ActivityLog, Asset, AssetCategory
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


@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        active_tab = request.args.get('tab', 'login')
        return render_template('login.html', active_tab=active_tab)

    employee_id = request.form.get('employee_id', '').strip()
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '').strip()

    if not employee_id and not email:
        return render_template('login.html', error='Enter your email or employee ID.')
    if not password:
        return render_template('login.html', error='Enter your password.')

    user = None
    if employee_id:
        try:
            user = Employee.query.filter_by(employee_id=int(employee_id)).first()
        except ValueError:
            user = None
    if not user and email:
        user = Employee.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return render_template('login.html', error='Invalid email / ID or password.', active_tab='login')

    if user.status.lower() != 'active':
        return render_template('login.html', error='Your account is not active.', active_tab='login')

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
        return render_template('login.html', active_tab='register')

    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '').strip()
    department_name = request.form.get('department_name', '').strip()
    role = request.form.get('role', 'Employee').strip() or 'Employee'
    status = request.form.get('status', 'Active').strip() or 'Active'

    if not name or not email or not password:
        return render_template('login.html', error='Name, email and password are required.', active_tab='register')

    existing_user = Employee.query.filter_by(email=email).first()
    if existing_user:
        return render_template('login.html', error='A user already exists with that email.', active_tab='register')

    department = get_or_create_department(department_name) if department_name else None
    new_user = Employee(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        department_id=department.department_id if department else None,
        role=role,
        status=status
    )
    db.session.add(new_user)
    db.session.add(ActivityLog(
        user_id=None,
        action_taken='register',
        timestamp=datetime.utcnow(),
        details=f'New user registered: {email}, role={role}, dept={department_name}'
    ))
    db.session.commit()

    session['user_id'] = new_user.employee_id
    session['username'] = new_user.name
    session['role'] = new_user.role

    if (new_user.role or '').lower() == 'admin':
        return redirect(url_for('admin'))
    return redirect(url_for('dashboard'))


@app.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    return render_template('dashboard.html')


@app.route('/admin', methods=['GET'])
@login_required
def admin():
    current = current_user()
    if not current or (current.role or '').lower() != 'admin':
        return redirect(url_for('dashboard'))
    return render_template('admin.html')


@app.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/api/departments', methods=['GET'])
@login_required
def api_get_departments():
    departments = Department.query.order_by(Department.department_name).all()
    return jsonify([department_to_dict(d) for d in departments])


@app.route('/api/departments', methods=['POST'])
@login_required
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
def api_delete_department(department_id):
    dept = Department.query.get_or_404(department_id)
    employees = Employee.query.filter_by(department_id=department_id).all()
    for emp in employees:
        emp.department_id = None
    db.session.delete(dept)
    db.session.commit()
    return jsonify({'success': True})


@app.route('/api/users', methods=['GET'])
@login_required
def api_get_users():
    users = Employee.query.order_by(Employee.name).all()
    return jsonify([user_to_dict(u) for u in users])


@app.route('/api/users', methods=['POST'])
@login_required
def api_create_user():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email is required.'}), 400
    existing = Employee.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'User already exists with this email.'}), 400
    if data.get('employee_id'):
        try:
            employee_id = int(data.get('employee_id'))
        except ValueError:
            employee_id = None
    else:
        employee_id = None
    department = None
    dept_name = data.get('department_name', '').strip()
    if dept_name:
        department = Department.query.filter_by(department_name=dept_name).first()
        if not department:
            department = Department(department_name=dept_name, status='Active')
            db.session.add(department)
            db.session.flush()
    user = Employee(
        employee_id=employee_id,
        name=data.get('name', '').strip() or 'New User',
        email=email,
        password_hash=generate_password_hash(data.get('password', 'password')),
        department_id=department.department_id if department else None,
        role=data.get('role', 'Employee').strip() or 'Employee',
        status=data.get('status', 'Active').strip() or 'Active'
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user_to_dict(user)), 201


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
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
        department = Department.query.filter_by(department_name=data.get('department_name').strip()).first()
        if not department:
            department = Department(department_name=data.get('department_name').strip(), status='Active')
            db.session.add(department)
            db.session.flush()
        user.department_id = department.department_id
    db.session.commit()
    return jsonify(user_to_dict(user))


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
def api_delete_user(user_id):
    user = Employee.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True})


@app.route('/api/assets', methods=['GET'])
@login_required
def api_get_assets():
    items = Asset.query.order_by(Asset.asset_id).all()
    return jsonify([asset_to_dict(a) for a in items])


@app.route('/api/assets', methods=['POST'])
@login_required
def api_create_asset():
    data = request.get_json() or {}
    if not data.get('name') or not data.get('asset_tag'):
        return jsonify({'error': 'Asset name and tag are required.'}), 400
    category = get_or_create_category(data.get('category_name', '').strip())
    asset = Asset(
        name=data.get('name').strip(),
        category_id=category.category_id if category else None,
        asset_tag=data.get('asset_tag').strip(),
        serial_number=data.get('serial_number', '').strip(),
        acquisition_date=data.get('acquisition_date') or None,
        acquisition_cost=float(data.get('acquisition_cost') or 0),
        condition=data.get('condition', '').strip() or 'Good',
        location=data.get('location', '').strip(),
        photo_url=data.get('photo_url', '').strip(),
        is_bookable=bool(data.get('is_bookable', False)),
        status=data.get('status', 'Available').strip() or 'Available'
    )
    db.session.add(asset)
    db.session.commit()
    return jsonify(asset_to_dict(asset)), 201


@app.route('/api/assets/<int:asset_id>', methods=['PUT'])
@login_required
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
def api_delete_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    db.session.delete(asset)
    db.session.commit()
    return jsonify({'success': True})


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
    if user.status.lower() != 'active':
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


@socketio.on('login')
def handle_socket_login(data):
    app.logger.info('Socket login request received: %s', data)
    employee_id = data.get('employee_id', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

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
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    department_name = data.get('department_name', '').strip()
    role = data.get('role', 'Employee').strip()
    status = data.get('status', 'Active').strip()

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
