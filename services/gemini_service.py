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
            
            return {
                'success': True,
                'fields': response.text,
                'raw_response': response.text
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'fields': None
            }
    
    def _build_prompt(self, user_prompt: str) -> str:
        """
        Build the complete prompt with constraints
        
        Args:
            user_prompt: User's input prompt
            
        Returns:
            Complete formatted prompt for Gemini
        """
        return f"""{user_prompt}

IMPORTANT: Provide ONLY 8-12 essential and moderately important fields. Focus on the most critical information needed.

Provide the fields as a numbered list in a <comma separated> format as follows:
"field label, field description, field data type, field data input validation rules, list of enumerated input values if appropriate in comma separated array format enclosed by [ ]"

Provide only the list of fields in a parseable format. Keep the list concise and user-friendly."""
    
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
            if line and line[0].isdigit():
                # Remove numbering
                parts = line.split('.', 1)
                if len(parts) > 1:
                    field_data = parts[1].strip()
                    fields.append({'raw': field_data})
        
        return fields