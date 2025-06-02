from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    text = data.get('server', '')
    
    # Simple mock AI logic (e.g., sentiment mock)
    sentiment = "positive" if "good" in text.lower() else "negative"
    
    return jsonify({"sentiment": sentiment})

if __name__ == '__main__':
    app.run(port=3001)