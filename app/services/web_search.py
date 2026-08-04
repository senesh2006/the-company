"""
Free web search utility using DuckDuckGo HTML search.

No API key or credit card required.  DuckDuckGo may rate-limit aggressive
scraping, so this is best for low-volume agent queries.  For production
high-volume use, consider a paid provider or a self-hosted SearxNG instance.
"""

import html
import logging
import re
import urllib.parse
import urllib.request
from typing import List, Optional

logger = logging.getLogger(__name__)


def _fetch_html(url: str, timeout: float = 10.0) -> str:
    """Fetch raw HTML from a URL with a browser-like User-Agent."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def _extract_results_duckduckgo(html_text: str, limit: int = 5) -> List[str]:
    """
    Extract search result snippets from DuckDuckGo HTML.

    DuckDuckGo's HTML layout changes occasionally; we try a few common patterns.
    """
    results: List[str] = []

    # Pattern 1: result__a links with their parent result__snippet
    for match in re.finditer(
        r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*>(.*?)</a>',
        html_text,
        re.IGNORECASE | re.DOTALL,
    ):
        title = re.sub(r"<[^>]+>", "", match.group(1)).strip()
        if title and title not in results:
            results.append(html.unescape(title))
        if len(results) >= limit:
            break

    # Pattern 2: snippet blocks
    if not results:
        for match in re.finditer(
            r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>',
            html_text,
            re.IGNORECASE | re.DOTALL,
        ):
            snippet = re.sub(r"<[^>]+>", "", match.group(1)).strip()
            if snippet and snippet not in results:
                results.append(html.unescape(snippet))
            if len(results) >= limit:
                break

    # Pattern 3: generic web-result links (fallback)
    if not results:
        for match in re.finditer(
            r'<a[^>]*href="https?://[^"]+"[^>]*>(.*?)</a>',
            html_text,
            re.IGNORECASE | re.DOTALL,
        ):
            text = re.sub(r"<[^>]+>", "", match.group(1)).strip()
            if text and len(text) > 15 and text not in results:
                results.append(html.unescape(text))
            if len(results) >= limit:
                break

    return results


def search_web(query: str, limit: int = 5, timeout: float = 10.0) -> Optional[str]:
    """
    Perform a free web search for `query` and return a summary string.

    Returns None if the search fails entirely.
    """
    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
        html_text = _fetch_html(url, timeout=timeout)
        results = _extract_results_duckduckgo(html_text, limit=limit)

        if not results:
            return f"Free web search for '{query}' returned no parseable results."

        lines = [f"Search results for '{query}':"]
        for i, result in enumerate(results, start=1):
            lines.append(f"{i}. {result}")
        return "\n".join(lines)

    except Exception as e:
        logger.warning(f"Free web search failed for query '{query}': {e}")
        return f"Free web search for '{query}' failed: {str(e)}"
