from flask import Flask, render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_db_flask.db'  # Changed to SQLite
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Optional, to disable warnings

db = SQLAlchemy(app)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Integer, default=0)
    deadline = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return '<Task %r>' % self.id

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        task_content = request.form['content']
        task_deadline_str = request.form['deadline']
        try:
            task_deadline = datetime.strptime(task_deadline_str, '%Y-%m-%dT%H:%M')  # Adjusted format for datetime-local input
            new_task = Todo(content=task_content, deadline=task_deadline)

            db.session.add(new_task)
            db.session.commit()
            return redirect('/')
        except Exception as e:
            return f'There was an issue adding your task: {str(e)}'

    else:
        tasks = Todo.query.order_by(Todo.deadline).all()
        return render_template('index.html', tasks=tasks, datetime=datetime)

@app.route('/delete/<int:id>', methods=['POST'])
def delete(id):
    task_to_delete = Todo.query.get_or_404(id)

    try:
        db.session.delete(task_to_delete)
        db.session.commit()
        return redirect('/')
    except Exception as e:
        return f'There was a problem deleting that task: {str(e)}'

@app.route('/update/<int:id>', methods=['GET', 'POST'])
def update(id):
    task = Todo.query.get_or_404(id)

    if request.method == 'POST':
        task.content = request.form['content']
        task_deadline_str = request.form['deadline']
        try:
            task.deadline = datetime.strptime(task_deadline_str, '%Y-%m-%dT%H:%M')  # Adjusted format for datetime-local input
            db.session.commit()
            return redirect('/')
        except Exception as e:
            return f'There was an issue updating your task: {str(e)}'

    else:
        return render_template('update.html', task=task)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Tables created in the SQLite database.")
    app.run(debug=True, host='0.0.0.0', port=5111)

