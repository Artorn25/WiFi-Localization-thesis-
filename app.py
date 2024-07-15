from flask import Flask, send_from_directory, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')  # สมมติว่าไฟล์ HTML ชื่อ index.html

@app.route('/<path:filename>')
def send_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(debug=True)
