import fitz  # PyMuPDF
from typing import List, Generator

class PDFService:
    @staticmethod
    def extract_text_from_pdf(pdf_content: bytes) -> str:
        """
        Extracts all text from a PDF file.
        """
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    @staticmethod
    def get_text_chunks(text: str, chunk_size: int = 1000) -> Generator[str, None, None]:
        """
        Splits text into chunks of specified size.
        """
        total_len = len(text)
        for i in range(0, total_len, chunk_size):
            start = int(i)
            end = int(i + chunk_size)
            yield text[start:end]

    @staticmethod
    def extract_text_chunks_from_pdf(pdf_content: bytes, chunk_size: int = 3) -> Generator[str, None, None]:
        """
        Extracts text from PDF in chunks of pages.
        Yields text from every `chunk_size` pages.
        """
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        for i in range(0, len(doc), chunk_size):
            chunk_text = ""
            # Take a slice of pages from i to i + chunk_size
            for page_idx in range(i, min(i + chunk_size, len(doc))):
                chunk_text += doc[page_idx].get_text()
            
            if chunk_text.strip():
                yield chunk_text
        doc.close()
