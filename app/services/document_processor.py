import io
import csv
import json
import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """
    Multi-format document ingestion engine for Company OS Shared Memory & Knowledge Base.
    Supports PDF, CSV, Notion / Markdown, Google Docs / Plain Text, and JSON.
    """

    @classmethod
    def process_file(
        cls,
        filename: str,
        file_bytes: bytes,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parses the raw file bytes according to file extension, generates extracted text,
        chunks, metadata, and auto-detects or assigns the category.
        """
        ext = filename.lower().split(".")[-1] if "." in filename else "txt"
        file_size = len(file_bytes)
        
        extracted_text = ""
        metadata: Dict[str, Any] = {
            "original_filename": filename,
            "file_type": ext,
            "file_size_bytes": file_size,
        }

        # Route by extension
        if ext == "pdf":
            extracted_text, pdf_meta = cls._parse_pdf(file_bytes)
            metadata.update(pdf_meta)
        elif ext in ["csv", "tsv"]:
            delimiter = "\t" if ext == "tsv" else ","
            extracted_text, csv_meta = cls._parse_csv(file_bytes, delimiter=delimiter)
            metadata.update(csv_meta)
        elif ext in ["md", "markdown"]:
            extracted_text, md_meta = cls._parse_markdown(file_bytes)
            metadata.update(md_meta)
        elif ext == "json":
            extracted_text, json_meta = cls._parse_json(file_bytes)
            metadata.update(json_meta)
        else: # txt, doc, docx text, or unknown
            extracted_text = file_bytes.decode("utf-8", errors="replace")
            metadata["word_count"] = len(extracted_text.split())

        # Auto-detect category if none provided
        final_category = category or cls._detect_category(filename, extracted_text)

        # Generate summary
        summary = cls._generate_summary(filename, final_category, extracted_text, metadata)

        # Generate chunks for retrieval
        chunks = cls._chunk_text(extracted_text, chunk_size=1500, overlap=200)

        return {
            "filename": filename,
            "file_type": ext,
            "file_size_bytes": file_size,
            "category": final_category,
            "summary": summary,
            "content": extracted_text,
            "chunks": chunks,
            "metadata": metadata
        }

    @classmethod
    def _parse_pdf(cls, file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """Parses PDF bytes using pypdf with fallback."""
        text_parts = []
        metadata: Dict[str, Any] = {"pages": 0}
        
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            metadata["pages"] = len(reader.pages)
            
            # Extract document info if present
            if reader.metadata:
                if reader.metadata.title:
                    metadata["title"] = str(reader.metadata.title)
                if reader.metadata.author:
                    metadata["author"] = str(reader.metadata.author)

            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(f"--- [Page {i+1}] ---\n{page_text.strip()}")
            
            full_text = "\n\n".join(text_parts)
            metadata["word_count"] = len(full_text.split())
            return full_text, metadata
        except Exception as e:
            logger.warning(f"Error parsing PDF with pypdf: {e}. Falling back to plain text extraction.")
            # Fallback plain text decoding
            fallback_text = file_bytes.decode("utf-8", errors="ignore")
            return fallback_text, {"pages": 1, "parse_warning": str(e)}

    @classmethod
    def _parse_csv(cls, file_bytes: bytes, delimiter: str = ",") -> Tuple[str, Dict[str, Any]]:
        """Parses CSV/TSV bytes, extracting columns, row count, and formatted text."""
        decoded = file_bytes.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(decoded), delimiter=delimiter)
        
        rows = list(reader)
        if not rows:
            return "", {"columns": [], "row_count": 0}

        headers = rows[0]
        data_rows = rows[1:]
        
        # Build structured preview text
        lines = [
            f"Table Structure: {len(headers)} columns, {len(data_rows)} data rows",
            f"Columns: {', '.join(headers)}",
            "\nData Records Preview:"
        ]
        
        # Show first 100 rows in Markdown table format for LLM readability
        header_row = "| " + " | ".join(headers) + " |"
        sep_row = "| " + " | ".join(["---"] * len(headers)) + " |"
        lines.extend([header_row, sep_row])
        
        for row in data_rows[:100]:
            # pad or truncate row to header length
            clean_row = [cell.replace("\n", " ").strip() for cell in row]
            if len(clean_row) < len(headers):
                clean_row.extend([""] * (len(headers) - len(clean_row)))
            lines.append("| " + " | ".join(clean_row[:len(headers)]) + " |")

        if len(data_rows) > 100:
            lines.append(f"\n... [{len(data_rows) - 100} more rows omitted for brevity]")

        full_text = "\n".join(lines)
        metadata = {
            "columns": headers,
            "row_count": len(data_rows),
            "word_count": len(full_text.split())
        }
        return full_text, metadata

    @classmethod
    def _parse_markdown(cls, file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """Parses Markdown / Notion export text, extracting section headers."""
        text = file_bytes.decode("utf-8", errors="replace")
        lines = text.split("\n")
        
        headers = []
        for line in lines:
            if line.strip().startswith("#"):
                headers.append(line.strip().lstrip("#").strip())

        metadata = {
            "headers": headers[:15],
            "header_count": len(headers),
            "word_count": len(text.split())
        }
        return text, metadata

    @classmethod
    def _parse_json(cls, file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """Parses JSON content and formats cleanly."""
        decoded = file_bytes.decode("utf-8", errors="replace")
        try:
            obj = json.loads(decoded)
            formatted = json.dumps(obj, indent=2)
            keys = list(obj.keys()) if isinstance(obj, dict) else [f"Array[{len(obj)}]"]
            metadata = {
                "top_level_keys": keys,
                "is_array": isinstance(obj, list),
                "word_count": len(formatted.split())
            }
            return formatted, metadata
        except Exception:
            return decoded, {"word_count": len(decoded.split())}

    @classmethod
    def _detect_category(cls, filename: str, content: str) -> str:
        """Heuristically infers the domain category from file name and text keywords."""
        name_lower = filename.lower()
        content_sample = content[:3000].lower()

        scores = {
            "Customer Personas": 0,
            "Brand Guidelines": 0,
            "Financial Reports": 0,
            "Product Documentation": 0,
            "General Knowledge": 0
        }

        # Customer Personas
        persona_keywords = ["persona", "icp", "ideal customer", "pain points", "user journey", "customer profile", "buyer", "target customer", "demographic", "objection"]
        for k in persona_keywords:
            if k in name_lower:
                scores["Customer Personas"] += 5
            if k in content_sample:
                scores["Customer Personas"] += 2

        # Brand Guidelines
        brand_keywords = ["brand", "guideline", "styleguide", "color palette", "typography", "logo", "tone of voice", "visual identity"]
        for k in brand_keywords:
            if k in name_lower:
                scores["Brand Guidelines"] += 5
            if k in content_sample:
                scores["Brand Guidelines"] += 2

        # Financial Reports
        fin_keywords = ["financial", "finance", "p&l", "revenue", "balance sheet", "expense", "budget", "mrr", "arr", "cash flow", "ebitda", "invoice", "spent", "net profit"]
        for k in fin_keywords:
            if k in name_lower:
                scores["Financial Reports"] += 5
            if k in content_sample:
                scores["Financial Reports"] += 2

        # Product Documentation
        prod_keywords = ["product spec", "architecture", "api docs", "roadmap", "system design", "technical spec", "endpoints", "schema design"]
        for k in prod_keywords:
            if k in name_lower:
                scores["Product Documentation"] += 5
            if k in content_sample:
                scores["Product Documentation"] += 2

        best_category = max(scores, key=scores.get)
        if scores[best_category] > 0:
            return best_category

        return "General Knowledge"

    @classmethod
    def _generate_summary(cls, filename: str, category: str, content: str, metadata: Dict[str, Any]) -> str:
        """Produces a high-signal concise summary for AI worker awareness."""
        words = content.split()
        total_words = len(words)
        preview = " ".join(words[:45]) + ("..." if total_words > 45 else "")

        summary_parts = [
            f"[{category}] {filename} ({total_words} words)."
        ]
        
        if "pages" in metadata and metadata["pages"] > 0:
            summary_parts.append(f"{metadata['pages']} pages.")
        if "row_count" in metadata:
            summary_parts.append(f"{metadata['row_count']} rows across {len(metadata.get('columns', []))} columns.")
            
        summary_parts.append(f"Preview: {preview}")
        return " ".join(summary_parts)

    @classmethod
    def _chunk_text(cls, text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
        """Splits long text into overlapping chunks for indexing."""
        if not text:
            return []
        
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            if end == text_len:
                break
            start += (chunk_size - overlap)

        return chunks
