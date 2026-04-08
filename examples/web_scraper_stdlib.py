"""
Web scraping example using only Python's standard library.
Demonstrates how to fetch and parse web content without external dependencies.
"""

import urllib.request
import urllib.parse
import html
import json
from html.parser import HTMLParser
from datetime import datetime

class SimpleHTMLParser(HTMLParser):
    """A simple HTML parser to extract text content."""
    def __init__(self):
        super().__init__()
        self.text_content = []
        self.current_tag = None
        self.ignore_tags = {'script', 'style', 'head', 'meta', 'link'}
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        
    def handle_endtag(self, tag):
        self.current_tag = None
        
    def handle_data(self, data):
        if self.current_tag not in self.ignore_tags and data.strip():
            self.text_content.append(data.strip())

def fetch_url(url, timeout=10):
    """Fetch content from a URL with error handling."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return f"Error fetching {url}: {str(e)}"

def scrape_html_demo():
    """Demo scraping HTML content from a test endpoint."""
    print("Fetching HTML content from httpbin.org/html...")
    html_content = fetch_url("https://httpbin.org/html")
    
    if html_content.startswith("Error"):
        return {"error": html_content}
    
    # Parse HTML
    parser = SimpleHTMLParser()
    parser.feed(html_content)
    
    # Extract title (simplified)
    title = "No title found"
    if '<h1>' in html_content:
        start = html_content.find('<h1>') + 4
        end = html_content.find('</h1>', start)
        if start > 3 and end > start:
            title = html_content[start:end]
    
    return {
        "url": "https://httpbin.org/html",
        "title": title,
        "text_blocks_found": len(parser.text_content),
        "sample_text": parser.text_content[:3] if parser.text_content else [],
        "fetched_at": datetime.now().isoformat()
    }

def scrape_json_demo():
    """Demo scraping JSON content from a test endpoint."""
    print("Fetching JSON content from httpbin.org/json...")
    json_content = fetch_url("https://httpbin.org/json")
    
    if json_content.startswith("Error"):
        return {"error": json_content}
    
    try:
        data = json.loads(json_content)
        slideshow = data.get('slideshow', {})
        
        return {
            "url": "https://httpbin.org/json",
            "slideshow_title": slideshow.get('title', 'No title'),
            "slideshow_date": slideshow.get('date', 'No date'),
            "slide_count": len(slideshow.get('slides', [])),
            "first_slide": slideshow.get('slides', [{}])[0] if slideshow.get('slides') else {},
            "fetched_at": datetime.now().isoformat()
        }
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse JSON: {str(e)}"}

def demonstrate_url_encoding():
    """Demonstrate URL encoding/decoding."""
    print("\nURL Encoding Demo:")
    original = "Hello World! & Special Chars: áéíóú"
    encoded = urllib.parse.quote(original)
    decoded = urllib.parse.unquote(encoded)
    
    return {
        "original": original,
        "encoded": encoded,
        "decoded": decoded,
        "match": original == decoded
    }

if __name__ == "__main__":
    print("Web Scraping Demo (Standard Library Only)")
    print("=" * 50)
    
    # HTML scraping demo
    print("\n1. HTML Scraping Demo:")
    html_result = scrape_html_demo()
    if 'error' in html_result:
        print(f"Error: {html_result['error']}")
    else:
        print(f"URL: {html_result['url']}")
        print(f"Title: {html_result['title']}")
        print(f"Text blocks found: {html_result['text_blocks_found']}")
        if html_result['sample_text']:
            print(f"Sample text: {html_result['sample_text'][0][:100]}...")
    
    # JSON scraping demo
    print("\n2. JSON API Scraping Demo:")
    json_result = scrape_json_demo()
    if 'error' in json_result:
        print(f"Error: {json_result['error']}")
    else:
        print(f"URL: {json_result['url']}")
        print(f"Slideshow title: {json_result['slideshow_title']}")
        print(f"Date: {json_result['slideshow_date']}")
        print(f"Number of slides: {json_result['slide_count']}")
        if json_result['first_slide']:
            print(f"First slide title: {json_result['first_slide'].get('title', 'No title')}")
    
    # URL encoding demo
    print("\n3. URL Encoding Demo:")
    encoding_result = demonstrate_url_encoding()
    print(f"Original: {encoding_result['original']}")
    print(f"Encoded: {encoding_result['encoded']}")
    print(f"Decoded: {encoding_result['decoded']}")
    print(f"Match: {encoding_result['match']}")
    
    print("\nDemo completed successfully using only Python standard library!")