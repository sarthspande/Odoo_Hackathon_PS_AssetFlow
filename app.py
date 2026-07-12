from datetime import datetime
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from werkzeug.security import generate_password_hash
from DBinitialisation.DataBases import db, Department, Employee, ActivityLog
import os
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("API_KEY") or 'change-me'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///assetflow.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route('/login', methods=['GET','POST'])
def login():
    return render_template("login.html")

@socketio.on('login')
def handle_login(data):
    app.logger.info('Login payload received: %s', data)
    username = data.get('username')
    employee_id = data.get('employee_id')
    email = data.get('email')
    password = data.get('password')
    dept = data.get('dept')
    role = data.get('role')
    status = data.get('status')
    timestamp = data.get('timestamp')

    if employee_id is not None and employee_id != '':
        try:
            employee_id = int(employee_id)
        except ValueError:
            employee_id = None

    app.logger.info(
        'Parsed login fields: username=%s employee_id=%s email=%s dept=%s role=%s status=%s timestamp=%s',
        username, employee_id, email, dept, role, status, timestamp
    )

    with app.app_context():
        department = None
        if dept:
            department = Department.query.filter_by(department_name=dept).first()
            if not department:
                department = Department(department_name=dept, status='Active')
                db.session.add(department)
                db.session.flush()

        employee = None
        if employee_id:
            employee = Employee.query.filter_by(employee_id=employee_id).first()
        if not employee and email:
            employee = Employee.query.filter_by(email=email).first()

        if not employee:
            employee = Employee(
                employee_id=employee_id,
                name=username,
                email=email,
                password_hash=generate_password_hash(password) if password else None,
                department_id=department.department_id if department else None,
                role=role or 'Employee',
                status=status or 'Active'
            )
            db.session.add(employee)
        else:
            employee.name = username or employee.name
            employee.email = email or employee.email
            if password:
                employee.password_hash = generate_password_hash(password)
            employee.department_id = department.department_id if department else employee.department_id
            employee.role = role or employee.role
            employee.status = status or employee.status

        db.session.add(ActivityLog(
            user_id=employee.employee_id,
            action_taken='login',
            timestamp=datetime.utcnow(),
            details=f'User logged in via socket; role={role}, status={status}, dept={dept}'
        ))

        db.session.commit()

    socketio.emit('login_ack', {'status': 'received', 'username': username}, room=request.sid)



if __name__ == '__main__':
    socketio.run(app, debug=True)
