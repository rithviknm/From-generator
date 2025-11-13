# FormEasy - AI-Powered Form Generator

## Overview
FormEasy is a Flask web application that uses Google's Gemini AI to automatically generate custom forms. Users can describe what kind of form they need, and the AI will generate appropriate form fields with proper validation and field types.

## Project Structure
- **Flask Application**: Full-featured web app with user authentication
- **Database**: PostgreSQL (via Replit's built-in database)
- **AI Integration**: Google Gemini API for intelligent form generation
- **Authentication**: Flask-Login with user signup/login functionality

## Key Features
- AI-powered form field generation using natural language descriptions
- User authentication (signup/login)
- Form builder with multiple field types
- Form sharing via unique URLs
- Response collection and viewing
- Database-backed form and user storage

## Configuration
- **Python**: 3.11
- **Framework**: Flask 3.0.0
- **Database**: PostgreSQL (Replit managed)
- **AI Service**: Google Gemini API
- **Required Secrets**: `GOOGLE_API_KEY` (Google Gemini API key)

## Entry Points
- **Development**: `run.py` - Flask development server on port 5000
- **Production**: Gunicorn with autoscale deployment

## Recent Setup (Nov 13, 2025)
- Imported from GitHub repository
- Installed Python 3.11 and all dependencies
- Configured PostgreSQL database with Flask-Migrate
- Created initial database migrations
- Removed hardcoded API key for security
- Updated code to use `GOOGLE_API_KEY` environment variable
- Configured workflow for development server
- Set up deployment configuration for production

## Dependencies
See `requirements.txt` for full list. Key packages:
- Flask 3.0.0
- google-generativeai 0.3.2
- Flask-SQLAlchemy 3.1.1
- Flask-Login 0.6.3
- gunicorn 21.2.0
- psycopg2-binary (added for PostgreSQL)

## How It Works
1. User creates an account and logs in
2. User describes the form they need in natural language
3. Gemini AI generates appropriate form fields
4. User can customize and finalize the form
5. Form is saved with a unique URL
6. Others can fill out the form via the shared URL
7. Form owner can view all responses

## User Preferences
- None specified yet
