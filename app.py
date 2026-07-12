from flask import Flask
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("API_KEY")
socketio = SocketIO(app)

@app.route('/')
def index():
    return "Hello, Flask!"


if __name__ == '__main__':
    app.run(debug=True)
