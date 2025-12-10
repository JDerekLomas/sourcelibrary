import math
import json
import os
from typing import Dict, Any, List, AsyncGenerator

from astrology.models.divination_models import ProphecyAndTranslationResponse
from ai.services.openai_client import OpenAIClient

class CabalisticDivination:
    """
    An implementation of the DivinationService that preserves the core
    cabalistic algorithm. It uses the ai_service to first parse a natural
    language query and then to translate the final symbolic prophecy,
    using prompts and logic from the original tested scripts.
    """

    CABALISTIC_ALPHABET = {
        'b': 10, 'p': 10, 'w': 10, 'c': 15, 'k': 15, 'q': 15, 'd': 20, 't': 20,
        'f': 25, 'v': 25, 'g': 30, 'h': 30, 'ch': 30, 'l': 35, 'm': 40, 'n': 45,
        'r': 50, 's': 55, 'z': 55, 'x': 60, 'chs': 60, 'y': 65, 'z_end': 65,
    }
    REVERSE_ALPHABET = sorted([(v, k) for k, v in CABALISTIC_ALPHABET.items() if k != 'z_end'], key=lambda item: item[0])
    SQUARE_ROOT_TABLE = {
        1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3,
        16: 4, 17: 4, 18: 4, 19: 4, 20: 4, 21: 4, 22: 4, 23: 4, 24: 4, 25: 5, 26: 5, 27: 5, 28: 5, 29: 5,
        30: 5, 31: 5, 32: 5, 33: 5, 34: 5, 35: 5, 36: 6, 37: 6, 38: 6, 39: 6, 40: 6, 41: 6, 42: 6, 43: 6,
        44: 6, 45: 6, 46: 6, 47: 6, 48: 6, 49: 7, 50: 7, 51: 7, 52: 7, 53: 7, 54: 7, 55: 7, 56: 7, 57: 7,
        58: 7, 59: 7, 60: 7, 61: 7, 62: 7, 63: 7, 64: 8, 65: 8, 66: 8, 67: 8, 68: 8, 69: 8, 70: 8, 71: 8,
        72: 8, 73: 8, 74: 8, 75: 8, 76: 8, 77: 8, 78: 8, 79: 8, 80: 8, 81: 9, 82: 9, 83: 9, 84: 9, 85: 9,
        86: 9, 87: 9, 88: 9, 89: 9, 90: 9, 91: 9, 92: 9, 93: 9, 94: 9, 95: 9, 96: 9, 97: 9, 98: 9, 99: 9
    }
    HOUSE_TRIGONS = {
        1: [1, 5, 9, 2, 6, 10, 3, 7, 11, 4, 8, 12], 2: [2, 6, 10, 3, 7, 11, 4, 8, 12, 1, 5, 9],
        3: [3, 7, 11, 4, 8, 12, 1, 5, 9, 2, 6, 10], 4: [4, 8, 12, 1, 5, 9, 2, 6, 10, 3, 7, 11],
        5: [5, 9, 1, 6, 10, 2, 7, 11, 3, 8, 12, 4], 6: [6, 10, 2, 7, 11, 3, 8, 12, 4, 1, 5, 9],
        7: [7, 11, 3, 8, 12, 4, 1, 5, 9, 2, 6, 10], 8: [8, 12, 4, 1, 5, 9, 2, 6, 10, 3, 7, 11],
        9: [9, 1, 5, 10, 2, 6, 11, 3, 7, 12, 4, 8], 10: [10, 2, 6, 11, 3, 7, 12, 4, 8, 1, 5, 9],
        11: [11, 3, 7, 12, 4, 8, 1, 5, 9, 2, 6, 10], 12: [12, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]
    }
    HOUSE_MEANINGS = {
        1: "Self, identity, personality, appearance", 2: "Possessions, money, values, material goods",
        3: "Communication, siblings, short trips, learning", 4: "Home and Family, roots, home life, parents",
        5: "Pleasure, romance, creativity, children, fun", 6: "Health, work, daily routines, service",
        7: "Partnerships, marriage, relationships, contracts", 8: "Transformation, sex, death, inheritance, shared resources",
        9: "Philosophy, travel, higher education, beliefs", 10: "Career, public life, reputation, ambition",
        11: "Friendships, hopes, wishes, social groups", 12: "Secrets, unconscious, spirituality, karma"
    }
        
    def __init__(self):
        """Initializes the service. State is managed per-request."""
        self.openai_client = OpenAIClient()
        self.subject = ""
        self.object_word = ""
        self.verb = ""
        self.house = 0
        self.grid = [[0] * 4 for _ in range(4)]
        self.steps: Dict[str, Any] = {}

    async def _parse_query_with_ai(self, query: str) -> Dict[str, Any] | None:
        """
        Uses the AI service to parse a natural language query into divination components,
        ensuring the output is in German as required by the original algorithm.
        """
        prompt = f"""
        You are a highly specialized linguistic assistant. Your task is to translate the user query into German used during the year 1789, analyze it and break it down for a cabalistic divination.
        1.  Identify the Subject (main person/thing), Object (concept being acted upon), and Verb (the action). These MUST be in GERMAN.
        2.  Determine the most relevant Astrological House (an integer from 1-12) for the query's theme. The available houses are: {self.HOUSE_MEANINGS}.
        
        Return the result ONLY in a single, minified JSON object with no other text, markdown, or explanation.
        The JSON object must have keys: "subject", "object", "verb", and "house".

        Example for "Will India's economy grow?":
        {{"subject":"Indien","object":"Wirtschaft","verb":"wachsen","house":2}}

        Analyze the following query: "{query}"
        """
        try:
            response = await self.openai_client.client.chat.completions.create(
                model=self.openai_client.model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            clean_response = response.choices[0].message.content
            if not clean_response:
                return None
            
            parsed_data = json.loads(clean_response)

            required_keys = ["subject", "object", "verb", "house"]
            if not all(key in parsed_data for key in required_keys):
                raise ValueError("AI response was missing required keys.")
            
            return {
                "subject": parsed_data["subject"],
                "object_word": parsed_data["object"],
                "verb": parsed_data["verb"],
                "house": int(parsed_data["house"])
            }
        except (json.JSONDecodeError, TypeError, KeyError, ValueError) as e:
            raise ValueError(f"Failed to parse query with AI. Error: {e}")

    def _load_book_context(self) -> str:
        """Loads the full text of the cabalistic book from a file."""
        script_dir = os.path.dirname(__file__)
        book_path = os.path.join(script_dir, 'cabalistic_book.txt')
        try:
            with open(book_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            raise ValueError("Cabalistic book context file not found.")

    async def get_prophecy(self, query: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Interface method to run the full divination process, yielding results at each step."""        
        parsed_input = await self._parse_query_with_ai(query)
        
        if not parsed_input:
            raise ValueError("Failed to parse the query into divination components.")
        
        self.subject = parsed_input["subject"]
        self.object_word = parsed_input["object_word"]
        self.verb = parsed_input["verb"]
        self.house = parsed_input["house"]
        self.steps = {"ai_query_parsing": parsed_input}

        if not (1 <= self.house <= 12):
            raise ValueError(f"Invalid house number '{self.house}' received. Must be between 1 and 12.")

        self._populate_grid()
        yield {
            "step": "grid_calculated",
            "data": {"final_grid": self.grid}
        }

        sorted_numbers = self._extract_and_sort_numbers()
        consonants = self._numbers_to_consonants(sorted_numbers)
        yield {
            "step": "consonants_derived",
            "data": {"consonants": consonants}
        }
        
        consonants_string = " ".join(consonants)
        book_context = self._load_book_context()
        house_meaning = self.HOUSE_MEANINGS.get(self.house, "an unknown domain")
        
        interpretation_prompt = f"""
        You are an expert cabalist and master interpreter of the system described in the following ancient text. Your entire worldview and style must be based on this document.
        ANCIENT TEXT CONTEXT:
        --- START OF BOOK ---
        {book_context}
        --- END OF BOOK ---

        A querent has posed a question: '{query}'.
        This question falls under the Astrological House {self.house}, which governs '{house_meaning}'.
        
        My calculations, following the sacred algorithms of the text, have revealed the following German consonants:
        [{consonants_string}]

        Your sacred duty is to perform the final interpretation based on the knowledge from the ancient text.
        1.  Use the provided consonants as the foundation for your interpretation.
        2.  Deeply consider the meaning of the House and the nature of the query.
        3.  Creatively and wisely arrange the given consonants and add vowels to form a short, profound, and prophetic sentence in GERMAN that answers the question.
        4.  Provide a clear, flowing ENGLISH translation of your German prophecy.

        Return your response as a single JSON object with the keys "german_prophecy" and "english_prophecy".
        """

        try:
            response = await self.openai_client.client.chat.completions.create(
                model=self.openai_client.model_name,
                messages=[{"role": "user", "content": interpretation_prompt}],
                response_format={"type": "json_object"}
            )
            clean_response = response.choices[0].message.content
            if not clean_response:
                raise ValueError("Failed to return any prophecy at this moment.")
            
            parsed_response_data = json.loads(clean_response)
            parsedResponse = ProphecyAndTranslationResponse(**parsed_response_data)

            final_prophecy = {
                "prophecy": parsedResponse.german_prophecy.strip(),
                "prophecy_en": parsedResponse.english_prophecy.strip(),
            }            
            yield {
                "step": "prophecy_generated",
                "data": final_prophecy
            }

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise ValueError(f"Failed to interpret prophecy with AI. Error: {e}")

    def _get_consonant_groups(self, word: str) -> List[str]:
        word, consonants, i = word.lower(), [], 0
        while i < len(word):
            if i + 2 < len(word) and word[i:i+3] in ['chs']: consonants.append(word[i:i+3]); i += 3
            elif i + 1 < len(word) and word[i:i+2] in ['ch']: consonants.append(word[i:i+2]); i += 2
            elif word[i] in 'bpcwkdtfvgshlmnrsxyz': consonants.append(word[i]); i += 1
            else: i += 1
        return consonants

    def _normalize_and_sum(self, text: str) -> int:
        words, total_sum = text.split(), 0
        for word in words:
            consonant_groups = self._get_consonant_groups(word)
            for i, cons in enumerate(consonant_groups):
                if cons == 'z' and i == len(consonant_groups) - 1: total_sum += self.CABALISTIC_ALPHABET['z_end']
                elif cons in self.CABALISTIC_ALPHABET: total_sum += self.CABALISTIC_ALPHABET[cons]
        return total_sum

    def _get_square_root(self, number: int) -> int:
        s_num = str(number)
        if len(s_num) > 2:
            num_to_lookup = int(s_num[:2])
        else:
            num_to_lookup = number
        return self.SQUARE_ROOT_TABLE.get(num_to_lookup, 1)

    def _populate_grid(self):
        subject_sum = self._normalize_and_sum(self.subject)
        object_sum = self._normalize_and_sum(self.object_word)
        verb_sum = self._normalize_and_sum(self.verb)
        main_sum = subject_sum + object_sum + verb_sum
        self.steps['sums'] = {'subject': subject_sum, 'object': object_sum, 'verb': verb_sum, 'main': main_sum}

        s_main_sum = str(main_sum)
        base_digits = [int(d) for d in s_main_sum[::-1]]
        for i in range(4): self.grid[3][3-i] = base_digits[i] if i < len(base_digits) else 0
        if main_sum < 1000:
            hundreds_digit = int(s_main_sum[0]) if s_main_sum else 0
            self.grid[3][0] = math.floor(hundreds_digit / 2) if hundreds_digit > 0 and hundreds_digit % 2 == 0 else 1

        self.grid[0][0] = self._get_square_root(subject_sum)   # A
        self.grid[0][3] = self._get_square_root(object_sum)    # B
        self.grid[2][0] = self._get_square_root(verb_sum)      # C
        self.grid[2][3] = self._get_square_root(subject_sum)   # D
        
        def reduce_to_single_digit(n):
            while n > 9: n = sum(int(digit) for digit in str(n))
            return n

        e_sum = self.grid[0][0] + self.grid[2][0] # E = A + C
        self.grid[1][0] = reduce_to_single_digit(e_sum)

        f_sum = self.grid[0][3] + self.grid[2][3] # F = B + D
        self.grid[1][3] = reduce_to_single_digit(f_sum)

        def fill_from_multiplication(r, c1, c2, val1, val2):
            product_str = str(val1 * val2).zfill(2)
            self.grid[r][c1] = int(product_str[0])
            self.grid[r][c2] = int(product_str[1])

        fill_from_multiplication(0, 1, 2, self.grid[0][0], self.grid[0][3])
        fill_from_multiplication(2, 1, 2, self.grid[2][0], self.grid[2][3])
        fill_from_multiplication(1, 1, 2, self.grid[1][0], self.grid[1][3])

        for r in range(4):
            for c in range(4):
                if self.grid[r][c] == 0: self.grid[r][c] = 1
                    
    def _extract_and_sort_numbers(self) -> List[int]:
        extracted_numbers = [int(str(self.grid[r][c]) + str(self.grid[r][c+1])) for r in range(4) for c in range(3)]
        self.steps['extracted_numbers'] = extracted_numbers
        trigon_order_indices = [i-1 for i in self.HOUSE_TRIGONS[self.house]]
        sorted_numbers = [extracted_numbers[i] for i in trigon_order_indices]
        self.steps['sorted_numbers'] = sorted_numbers
        return sorted_numbers

    def _numbers_to_consonants(self, numbers: List[int]) -> List[str]:
        consonants = []
        for num in numbers:
            best_match = ('', 0)
            for val, key in self.REVERSE_ALPHABET:
                if val <= num: best_match = (key, val)
                else: break
            consonants.append(best_match[0])
        return consonants