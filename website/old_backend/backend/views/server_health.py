from backend import app

@app.route('/')  # NOTE: This route is needed for health check
def home():
    return "ok"

@app.route('/api/health')
def health():
    return "ok"