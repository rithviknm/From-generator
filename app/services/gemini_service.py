import google.generativeai as genai
from typing import Optional, Dict, List


class GeminiService:
    """Service class to handle Gemini API interactions"""
    
    def __init__(self, api_key: str):
        """
        Initialize the Gemini service with API key
        
        Args:
            api_key: Google Gemini API key
        """
        self.api_key = api_key
        self.model = None
        self._configure()
    
    def _configure(self):
        """Configure the Gemini API with the provided key"""
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("models/gemini-2.5-flash")
    
    def generate_form_fields(self, user_prompt: str) -> Dict[str, any]:
        """
        Generate form fields based on user prompt
        
        Args:
            user_prompt: User's description of the form needed
            
        Returns:
            Dictionary containing success status and generated fields or error message
        """
        try:
            full_prompt = self._build_prompt(user_prompt)
            response = self.model.generate_content(full_prompt)
            
            parsed_fields = self.parse_fields(response.text)

            return {
                'success': True,
                'fields': parsed_fields,
                'raw_response': response.text
            }
        except Exception as e:
            error_message = str(e)
            
            # Provide user-friendly error messages
            if '503' in error_message or 'overloaded' in error_message.lower():
                user_friendly_message = 'The AI service is currently overloaded. Please wait a moment and try again.'
            elif 'timeout' in error_message.lower() or 'exceeded' in error_message.lower():
                user_friendly_message = 'Request timed out. The AI service is busy. Please try again in a few seconds.'
            elif 'quota' in error_message.lower() or 'rate limit' in error_message.lower():
                user_friendly_message = 'API quota exceeded. Please try again later or check your API key limits.'
            elif 'api key' in error_message.lower():
                user_friendly_message = 'Invalid API key. Please check your Google API key configuration.'
            else:
                user_friendly_message = f'AI service error: {error_message}'
            
            return {
                'success': False,
                'error': user_friendly_message,
                'fields': None
            }
    
    def _build_prompt(self, user_prompt: str) -> str:
        """
        Build the complete prompt with constraints
        
        Args:
            user_prompt: User's input prompt (may include title, purpose, audience)
            
        Returns:
            Complete formatted prompt for Gemini
        """
        return f"""{user_prompt}

Based on the above information, generate a comprehensive form with appropriate fields.

IMPORTANT INSTRUCTIONS:
- Provide 8-12 essential and important fields
- Focus on the most critical information needed for this form
- Consider the target audience and purpose when selecting fields
- Use appropriate data types for each field

Format each field as a numbered list in comma-separated format:
"field label, field description, field data type, validation rules, [enumerated values if dropdown/select]"

Example format:
1. Full Name, Enter your complete name, text, required min:2 max:50
2. Email Address, Your contact email, email, required
3. Country, Select your country, select, required, [USA, Canada, UK, India, Other]

Provide ONLY the numbered list of fields. Keep it concise and user-friendly."""
    
    def parse_fields(self, response_text: str) -> List[Dict[str, str]]:
        """
        Parse the response text into structured field data
        
        Args:
            response_text: Raw text response from Gemini
            
        Returns:
            List of dictionaries containing parsed field information
        """
        fields = []
        lines = response_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or not line[0].isdigit():
                continue

            # Remove numbering
            parts = line.split('.', 1)
            if len(parts) < 2:
                continue
            
            field_data_str = parts[1].strip()
            field_parts = [p.strip() for p in field_data_str.split(',')]

            if len(field_parts) < 3:
                continue

            field = {
                'label': field_parts[0],
                'description': field_parts[1],
                'type': field_parts[2],
                'validation': field_parts[3] if len(field_parts) > 3 else '',
                'options': field_parts[4] if len(field_parts) > 4 else []
            }

            # Parse options if they exist
            if isinstance(field['options'], str) and field['options'].startswith('[') and field['options'].endswith(']'):
                field['options'] = [opt.strip() for opt in field['options'][1:-1].split(',')]

            fields.append(field)
        
        return fields