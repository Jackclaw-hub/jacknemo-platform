"""
Web scraping example demonstrating how to extract data from websites.
Note: This is for educational purposes only. Always check a website's 
terms of service and robots.txt before scraping.
"""

import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_quotes_demo():
    """
    Demo function that shows how to scrape quotes from a test site.
    Uses httpbin.org/html which returns a simple HTML page for testing.
    """
    try:
        # Using a test endpoint that returns safe HTML
        url = "https://httpbin.org/html"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract information
        title = soup.find('h1')
        title_text = title.get_text() if title else "No title found"
        
        paragraphs = soup.find_all('p')
        paragraph_texts = [p.get_text().strip() for p in paragraphs if p.get_text().strip()]
        
        # Return structured data
        return {
            'url': url,
            'title': title_text,
            'paragraph_count': len(paragraphs),
            'paragraphs': paragraph_texts[:3],  # First 3 paragraphs
            'scraped_at': time.time()
        }
        
    except requests.RequestException as e:
        return {'error': f"Request failed: {str(e)}"}
    except Exception as e:
        return {'error': f"An error occurred: {str(e)}"}

def scrape_json_api_demo():
    """
    Demo showing how to scrape data from a JSON API.
    """
    try:
        # Using httpbin.org/json which returns sample JSON data
        url = "https://httpbin.org/json"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract some interesting fields
        slideshow = data.get('slideshow', {})
        return {
            'url': url,
            'slideshow_title': slideshow.get('title', 'No title'),
            'slideshow_date': slideshow.get('date', 'No date'),
            'slides_count': len(slideshow.get('slides', [])),
            'sample_slide': slideshow.get('slides', [{}])[0] if slideshow.get('slides') else {},
            'scraped_at': time.time()
        }
        
    except requests.RequestException as e:
        return {'error': f"Request failed: {str(e)}"}
    except Exception as e:
        return {'error': f"An error occurred: {str(e)}"}

if __name__ == "__main__":
    print("Web Scraping Demo")
    print("=" * 50)
    
    print("\n1. HTML Scraping Demo:")
    html_result = scrape_quotes_demo()
    if 'error' in html_result:
        print(f"Error: {html_result['error']}")
    else:
        print(f"Title: {html_result['title']}")
        print(f"Paragraphs found: {html_result['paragraph_count']}")
        print("First paragraph:", html_result['paragraphs'][0] if html_result['paragraphs'] else "None")
    
    print("\n2. JSON API Scraping Demo:")
    json_result = scrape_json_api_demo()
    if 'error' in json_result:
        print(f"Error: {json_result['error']}")
    else:
        print(f"Slideshow: {json_result['slideshow_title']}")
        print(f"Date: {json_result['slideshow_date']}")
        print(f"Number of slides: {json_result['slides_count']}")
        
    print("\nDemo completed!")