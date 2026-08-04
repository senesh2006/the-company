from unittest.mock import patch, Mock

from app.services.web_search import search_web, _extract_results_duckduckgo


class TestWebSearch:
    def test_extract_results_from_duckduckgo_html(self):
        html = """
        <div class="result">
            <a class="result__a" href="https://example.com/1">Corporate tax rate 2026</a>
            <a class="result__snippet">The U.S. corporate tax rate remains 21%.</a>
        </div>
        <div class="result">
            <a class="result__a" href="https://example.com/2">GAAP accounting standards</a>
        </div>
        """
        results = _extract_results_duckduckgo(html, limit=5)
        assert len(results) >= 2
        assert "Corporate tax rate 2026" in results

    def test_search_web_returns_formatted_results(self):
        mock_html = """
        <a class="result__a">Result one</a>
        <a class="result__a">Result two</a>
        """
        with patch("app.services.web_search._fetch_html", return_value=mock_html):
            result = search_web("test query", limit=3)

        assert "Search results for 'test query'" in result
        assert "Result one" in result
        assert "Result two" in result

    def test_search_web_returns_failure_message(self):
        with patch("app.services.web_search._fetch_html", side_effect=Exception("network error")):
            result = search_web("test query")

        assert "failed" in result.lower()
