from datetime import timedelta

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import bcrypt
import pyotp
import random
from database_operations import db_execute, db_query
from flask_jwt_extended import JWTManager, create_access_token, decode_token, get_jwt_identity
from flask_jwt_extended.exceptions import JWTDecodeError


app = Flask(__name__)
app.secret_key = "RTYUJNBGFR%^&*"
app.config["JWT_SECRET_KEY"] = "FGHJUI^TRFgbn3223&^%R"  # JWT 秘钥
jwt = JWTManager(app)
totp = pyotp.TOTP('MRHWLR7C4FNJISRWFHQBFP67VOCHDALM')

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(hashed_password, password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def verify_jwt(token):
    try:
        decoded_token = decode_token(token)
        return decoded_token
    except JWTDecodeError:
        return None


@app.route('/login', methods=['GET', 'POST'])
def login():
    redirect_url = request.args.get('redirect')

    if request.method == 'POST':
        if 'user_id' in session:
            access_token = create_access_token(
                identity={'id': session['user_id'], 'username': session['username'], 'email': session['email']},
                expires_delta=timedelta(seconds=60))
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
                    access_token = create_access_token(identity={'id': user['id'], 'username': user['username'], 'email': user['email']}, expires_delta=timedelta(seconds=60))
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
    if verify_jwt(token):
        decoded = decode_token(token).get('sub')
        return jsonify({'code': 200, 'msg': 'Success', 'identity': decoded})
    return jsonify({'code': 401, 'msg': 'Incorrect token!'})


@app.route('/user/get')
def get_user():
    otp = request.args.get('otp')
    email = request.args.get('email')
    if totp.verify(otp):
        info = db_query("SELECT * FROM users WHERE email = ?", (email, ))
        return jsonify({'code': 200, 'msg': 'Success', 'data': info})
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
        if user:
            return jsonify({'code': 201, 'msg': 'User(email) already exists!'})
        if code != user_code:
            return jsonify({'code': 201, 'msg': 'Incorrect OTP code!'})
        db_execute("INSERT INTO Users(username, email, password, is_active, otp) VALUES(?, ?, ?, ?, ?)", (
            username, email, hash_password(password), 1, pyotp.random_base32()
        ))
        return jsonify({'code': 200, 'msg': 'Registered successfully!'})
    return render_template('register.html')


@app.route('/get_verification_code', methods=['POST'])
def get_verification_code():
    data = request.get_json()
    email = data.get('email').lower()
    code = "".join(random.choices("0123456789", k=6))
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


@app.route('/update_profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'code': 401, 'msg': 'Invalid Credentials!'})
    data = request.get_json()
    avatar = data.get('avatar')
    username = data.get('username')
    password = data.get('password')
    if password == 'no change':
        db_execute("Update Users SET username=?, avatar=? WHERE email=?", (username, avatar, session['email'], ))
    else:
        db_execute("Update Users SET username=?, avatar=?, password=? WHERE email=?", (username, avatar, hash_password(password), session['email'], ))
        session.clear()
    return jsonify({'code': 200, 'msg': 'Success'})


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, port=5139)
