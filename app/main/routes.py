from flask import render_template, request, jsonify, flash, redirect, url_for
from app.main import main
from app import gemini_service, db
from app.models import User, Form, FormField, FormResponse, ResponseAnswer
from flask_login import current_user, login_user, logout_user, login_required
import string
import random

@main.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user is None or not user.check_password(password):
            flash('Invalid email or password', 'danger')
            return redirect(url_for('main.login'))
        login_user(user)
        return redirect(url_for('main.index'))
    return render_template('login.html')

@main.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@main.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not email or not password or not confirm_password:
            flash('Please fill out all fields.', 'danger')
            return redirect(url_for('main.signup'))

        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('main.signup'))

        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email address already in use.', 'danger')
            return redirect(url_for('main.signup'))

        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash('Account created successfully. Please log in.', 'success')
        return redirect(url_for('main.login'))

    return render_template('signup.html')


@main.route('/finalize_form', methods=['POST'])
@login_required
def finalize_form():
    data = request.get_json()
    fields = data.get('fields')
    theme = data.get('theme')
    title = data.get('title', 'My Form')

    if not fields:
        return jsonify({'success': False, 'error': 'No fields provided.'}), 400

    slug = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    while Form.query.filter_by(url_slug=slug).first() is not None:
        slug = ''.join(random.choices(string.ascii_letters + string.digits, k=8))

    new_form = Form(title=title, theme=theme, url_slug=slug, author=current_user)
    db.session.add(new_form)

    for field_data in fields:
        form_field = FormField(
            label=field_data.get('label'),
            field_type=field_data.get('dataType'),
            options=field_data.get('enumValues'),
            required='required' in field_data.get('validation', ''),
            form=new_form
        )
        db.session.add(form_field)

    db.session.commit()

    return jsonify({'success': True, 'url': url_for('main.view_form', slug=slug, _external=True)})


@main.route('/form/<slug>', methods=['GET', 'POST'])
def view_form(slug):
    form = Form.query.filter_by(url_slug=slug).first_or_404()
    if request.method == 'POST':
        new_response = FormResponse(form=form)
        db.session.add(new_response)

        for field in form.fields:
            value = request.form.get(f'field-{field.id}')
            answer = ResponseAnswer(
                field_id=field.id,
                value=value,
                response=new_response
            )
            db.session.add(answer)

        db.session.commit()
        return render_template('thank_you.html')
        
    return render_template('view_form.html', form=form)


@main.route('/dashboard')
@login_required
def dashboard():
    forms = current_user.forms.order_by(Form.timestamp.desc()).all()
    return render_template('dashboard.html', forms=forms)


@main.route('/form/<int:form_id>/responses')
@login_required
def view_responses(form_id):
    form = Form.query.get_or_404(form_id)
    if form.author != current_user:
        return redirect(url_for('main.dashboard'))
    return render_template('view_responses.html', form=form)


@main.route('/generate', methods=['POST'])
def generate_fields():
    """
    API endpoint to generate form fields
    
    Expected JSON payload:
    {
        "prompt": "user's form description (enhanced with context)"
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
        
        # Generate fields using Gemini service with enhanced prompt
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


@main.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api_configured': gemini_service is not None
    })
