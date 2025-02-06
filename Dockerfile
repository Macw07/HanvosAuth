# 使用官方 Python 作为基础镜像（可以修改为你需要的 Python 版本）
FROM python:3.13-slim

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . /app

# 安装依赖（使用 pip 缓存优化）
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 确保 Flask 入口文件正确
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# 允许从外部访问
EXPOSE 5139

# 使用 Gunicorn 运行 Flask
CMD ["gunicorn", "--bind", "0.0.0.0:5139", "app:app", "--log-level=debug", "--access-logfile=-", "--error-logfile=-"]
