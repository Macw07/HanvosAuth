from flask_mail import Mail, Message
import threading
from flask import Flask

mail_allhanvos = Mail()
app = Flask(__name__)

def flask_mail_init():
    global mail_allhanvos
    app.config["MAIL_SERVER"] = "smtp.zoho.com"  # 设置为您的邮件服务器地址
    app.config["MAIL_PORT"] = 465  # 设置端口号
    app.config["MAIL_USE_SSL"] = True  # 启用安全传输层
    app.config["MAIL_USE_TLS"] = False  # 启用安全传输层
    app.config["MAIL_USERNAME"] = "pusupaul@zohomail.com"  # 设置发送邮件的邮箱账号
    app.config["MAIL_PASSWORD"] = "j@C/A23ds@_5E?z"  # 设置邮箱账号的密码
    app.config['MAIL_DEFAULT_SENDER'] = ('All Hanvos Dev.', 'pusupaul@zohomail.com')
    mail_allhanvos.init_app(app)


def send_async_email(app, mail_instance, template, subject, recipients, **kwargs):
    with app.app_context():
        with open(f"./utils/mail_templates/{template}", 'r') as file:
            html_content = file.read()
            for key, value in kwargs.items():
                html_content = html_content.replace(f'{{{{ {key} }}}}', value)
            msg = Message(subject, [recipients])
            msg.html = html_content
            mail_instance.send(msg)
    return "Email sent!"


def send_email(template, subject, recipients, **kwargs):
    app_instance = app
    mail_instance = mail_allhanvos
    thread = threading.Thread(
        target=lambda: send_async_email(app_instance, mail_instance, template, subject, recipients, **kwargs))
    thread.start()
