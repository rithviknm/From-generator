from flask import Flask, render_template, request, jsonify
import os
from services.gemini_service import GeminiService

app = Flask(__name__)

# Configuration
API_KEY = "AIzaSyAH58t0IB4KHKnXaEguQA5wSRgvHQbOBIw"  # Put your Gemini API key here
gemini_service = None

if API_KEY:
    gemini_service = GeminiService(API_KEY)


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.route('/generate', methods=['POST'])
def generate_fields():
    """
    API endpoint to generate form fields
    
    Expected JSON payload:
    {
        "prompt": "user's form description"
    }
    
    Returns:
    JSON response with generated fields or error
    """
    if not gemini_service:
        return jsonify({
            'success': False,
            'error': 'API key not configured. Please set GEMINI_API_KEY environment variable.'
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing prompt in request'
            }), 400
        
        user_prompt = data['prompt']
        
        if not user_prompt.strip():
            return jsonify({
                'success': False,
                'error': 'Prompt cannot be empty'
            }), 400
        
        # Generate fields using Gemini service
        result = gemini_service.generate_form_fields(user_prompt)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api_configured': gemini_service is not None
    })


if __name__ == '__main__':
    print("="*80)
    print("FORM GENERATOR WEB APPLICATION")
    print("="*80)
    print(f"API Key configured: {bool(API_KEY)}")
    if not API_KEY:
        print("\nWARNING: No API key found!")
        print("Set the GEMINI_API_KEY environment variable or add it to app.py")
    print("\nStarting server on http://127.0.0.1:5000")
    print("="*80)
    
    app.run(debug=True, host='0.0.0.0', port=5000)