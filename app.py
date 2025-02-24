from datetime import timedelta

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import bcrypt
import pyotp
import random
import os
from database_operations import db_execute, db_query
from flask_jwt_extended import JWTManager, create_access_token, decode_token, get_jwt_identity
from flask_jwt_extended.exceptions import JWTDecodeError
from utils.email_init import flask_mail_init, send_email
import boto3
from werkzeug.utils import secure_filename
import uuid


app = Flask(__name__)
app.secret_key = "RTYUJNBGFR%^&*"
app.config["JWT_SECRET_KEY"] = "FGHJUI^TRFgbn3223&^%R"  # JWT 秘钥
app.config["ENV"] = os.getenv("FLASK_ENV", "development")
jwt = JWTManager(app)
totp = pyotp.TOTP('MRHWLR7C4FNJISRWFHQBFP67VOCHDALM')
flask_mail_init()

R2_ENDPOINT = "https://3b13f2964989c14420fc56a4cbe6f063.r2.cloudflarestorage.com"  # 替换 <your-account-id>
R2_ACCESS_KEY = "5eddb8b6a1ca03fb0e89e2de4ed57a26"
R2_SECRET_KEY = "3b8aa89a2b60c20fb3fb947617a5ed9b69d11e60969f2482ef8d48ba5e2b5fe1"
R2_BUCKET_NAME = "hanvos-auth-image"

s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
)

if app.config["ENV"] == "production":
    app.static_folder = "static_prod"
else:
    app.static_folder = "static"


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(hashed_password, password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def verify_jwt(token):
    try:
        decoded_token = decode_token(token)
        return decoded_token
    except JWTDecodeError as e:
        return None


@app.route('/')
def index():
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    redirect_url = request.args.get('redirect')

    if request.method == 'POST':
        if 'user_id' in session:
            access_token = create_access_token(
                identity=str(session['user_id']),  # 这里必须是字符串或整数
                expires_delta=timedelta(seconds=60),
                additional_claims={'username': session['username'], 'email': session['email'], 'avatar': session['avatar']}
            )
            response = {'code': 200, 'msg': 'Success', 'token': access_token, 'redirect': redirect_url + f'?token={access_token}'}
            return jsonify(response)

        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not redirect_url:
            redirect_url = url_for('profile')

        user = db_query("SELECT * FROM users WHERE email = ?", (email, ))

        if user:
            user = user[0]
            if check_password(user["password"], password):
                if user["is_active"]:
                    session['user_id'] = user['id']
                    session['username'] = user['username']
                    session['email'] = user['email']
                    session['avatar'] = user['avatar']
                    access_token = create_access_token(
                        identity=str(session['user_id']),  # 这里必须是字符串或整数
                        expires_delta=timedelta(seconds=60),
                        additional_claims={'username': session['username'], 'email': session['email'], 'avatar': session['avatar']}
                    )
                    response = {'code': 200, 'msg': 'Success', 'token': access_token, 'redirect': redirect_url}
                    return jsonify(response)
                return jsonify({'code': 401, 'msg': 'Account is blocked!'})
        return jsonify({'code': 401, 'msg': 'Incorrect email or password!'})

    if 'user_id' in session:
        if not redirect_url:
            return redirect(url_for('profile'))
        return render_template('grant_access.html')

    return render_template('login.html')


@app.route('/token/verify', methods=['GET'])
def token_verify():
    token = request.args.get('token')
    if not token:
        return jsonify({'code': 400, 'msg': 'Token is missing!'})
    decoded_token = verify_jwt(token)
    if decoded_token:
        return jsonify({'code': 200, 'msg': 'Success', 'token_data': decoded_token})
    return jsonify({'code': 401, 'msg': 'Invalid token!'})


@app.route('/user/get')
def get_user():
    otp = request.args.get('otp')
    email = request.args.get('email')
    if totp.verify(otp):
        info = db_query("SELECT * FROM users WHERE email = ?", (email, ))
        if info:
            return jsonify({'code': 200, 'msg': 'Success', 'data': info[0]})
        return jsonify({'code': 401, 'msg': 'Incorrect info!'})
    return jsonify({'code': 401, 'msg': 'Incorrect token!'})


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        srt = session['otp']
        code = srt.split('$')[0]
        email = srt.split('$')[1].lower()
        username = data['username']
        password = data['password']
        user_code = data['user_code']
        user = db_query("SELECT * FROM users WHERE email = ?", (email, ))
        if not email.endswith('@hanvos-kent.com') and not email.endswith('@faculty.kleducation.org'):
            return jsonify({'code': 201, 'msg': 'You must register with email address ending with @hanvos-kent.com! or @faculty.kleducation.org'})
        if code != user_code:
            return jsonify({'code': 201, 'msg': 'Incorrect OTP code!'})
        if user:
            return jsonify({'code': 201, 'msg': 'Email already exists!'})
        user = db_query("SELECT * FROM users WHERE username = ?", (username,))
        if user:
            return jsonify({'code': 201, 'msg': 'Username already exists!'})
        db_execute("INSERT INTO Users(username, email, password, is_active, otp) VALUES(?, ?, ?, ?, ?)", (
            username, email, hash_password(password), 1, pyotp.random_base32()
        ))
        return jsonify({'code': 200, 'msg': 'Registered successfully!'})
    return render_template('register.html')


@app.route('/password/reset', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        email = request.get_json()['email']
        user = db_query("SELECT * FROM users WHERE email = ?", (email,))
        if user:
            password = "".join(random.choices("0123456789", k=8))
            db_execute("UPDATE users SET password = ? WHERE email = ?", (hash_password(password), email))
            send_email('forget_password.html', 'Your New All-Hanvos Password', email, password=password)
        return jsonify({'code': 200, 'msg': 'Password reset successfully!'})
    return render_template('forget_password.html')


@app.route('/get_verification_code', methods=['POST'])
def get_verification_code():
    data = request.get_json()
    email = data.get('email').lower()
    code = "".join(random.choices("0123456789", k=6))
    send_email('otp_code.html', "Your OTP Code for All-Hanvos", email, code=code)
    session['otp'] = code + '$' + email
    return jsonify({'code': 200, 'msg': 'Success'})


@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('profile.html')


@app.route('/profile/info/get')
def get_profile_info():
    if 'user_id' not in session:
        return jsonify({'code': 401, 'msg': 'Invalid Credentials!'})
    user_id = session['user_id']
    data = db_query("SELECT id, username, email, avatar FROM users WHERE id = ?", (user_id, ))
    return jsonify(data[0])




@app.route('/avatar/upload', methods=['POST'])
def change_avatar():
    if 'user_id' not in session:
        return jsonify({'code': 401, 'msg': 'Invalid Credentials!'})

    if "avatar" not in request.files:
        return jsonify({'code': 400, 'msg': 'No file uploaded'}), 400

    MAX_FILE_SIZE = 5 * 1024 * 1024

    user_id = session['user_id']
    file = request.files["avatar"]

    if file.filename == "":
        return jsonify({'code': 400, 'msg': 'No selected file'}), 400

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({'code': 400, 'msg': 'File size exceeds 5MB limit'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower()
    filename = f"avatars/{uuid.uuid4().hex}.{ext}"

    past_url = db_query('SELECT avatar FROM Users WHERE id = ?', (user_id, ))[0]['avatar']
    if past_url:
        path = "/".join(past_url.split("/")[3:])  # 提取 R2 里的路径
        s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=path)

    try:
        s3_client.upload_fileobj(file, R2_BUCKET_NAME, filename, ExtraArgs={"ACL": "public-read"})
        avatar_url = f"https://assets.allhanvos.com/{filename}"
        db_execute('UPDATE Users SET avatar = ? WHERE id = ?', (avatar_url, user_id, ))

        return jsonify({'code': 200, 'msg': 'Success', 'avatarUrl': avatar_url})

    except Exception as e:
        print(f"Error uploading to R2: {e}")
        return jsonify({'code': 500, 'msg': 'Upload failed'}), 500


@app.route('/update_profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'code': 401, 'msg': 'Invalid Credentials!'})
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    res = db_query('SELECT * FROM Users WHERE username = ?', (username, ))
    if res and res[0]['id'] != session['user_id']:
        return jsonify({'code': 201, 'msg': 'Username is already occupied!'})
    if password == 'no change':
        db_execute("Update Users SET username=? WHERE email=?", (username, session['email'], ))
    else:
        db_execute("Update Users SET username=?, password=? WHERE email=?", (username, hash_password(password), session['email'], ))
        session.clear()
    return jsonify({'code': 200, 'msg': 'Success'})


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True, port=5139)
