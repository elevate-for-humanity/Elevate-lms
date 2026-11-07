"""Render owner-supplied content into an actual Office/PDF file. No code evaluation."""
import csv, io, json, sys
from pathlib import Path
from xml.sax.saxutils import escape

def render(kind, title, content, destination):
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    if kind == 'docx':
        from docx import Document
        document = Document()
        document.add_heading(title, 0)
        for paragraph in paragraphs: document.add_paragraph(paragraph)
        document.save(destination)
    elif kind == 'pdf':
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        styles = getSampleStyleSheet()
        story = [Paragraph(escape(title), styles['Title']), Spacer(1, 16)]
        for paragraph in paragraphs:
            story.extend([Paragraph(escape(paragraph).replace('\n', '<br/>'), styles['BodyText']), Spacer(1, 10)])
        SimpleDocTemplate(str(destination), title=title).build(story)
    elif kind == 'pptx':
        from pptx import Presentation
        from pptx.util import Inches, Pt
        presentation = Presentation()
        presentation.slide_width, presentation.slide_height = Inches(13.333), Inches(7.5)
        slide = presentation.slides.add_slide(presentation.slide_layouts[0])
        slide.shapes.title.text = title
        for block in paragraphs:
            lines = block.splitlines()
            # Keep slides readable: long sections continue onto another slide.
            chunks = [lines[1:][i:i+6] for i in range(0, len(lines[1:]), 6)] or [[]]
            for index, chunk in enumerate(chunks):
                slide = presentation.slides.add_slide(presentation.slide_layouts[1])
                slide.shapes.title.text = lines[0][:150] + (' (continued)' if index else '')
                frame = slide.placeholders[1].text_frame
                frame.clear()
                for number, line in enumerate(chunk):
                    paragraph = frame.paragraphs[0] if number == 0 else frame.add_paragraph()
                    paragraph.text, paragraph.font.size = line, Pt(24)
        presentation.save(destination)
    elif kind == 'xlsx':
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill
        from openpyxl.utils import get_column_letter
        workbook = Workbook(); sheet = workbook.active; sheet.title = 'Data'
        for row_index, row in enumerate(csv.reader(io.StringIO(content)), 1):
            if row_index > 10000 or len(row) > 100: raise ValueError('Spreadsheet exceeds supported size')
            for column, value in enumerate(row, 1):
                cell = sheet.cell(row_index, column, value)
                # CSV content is data, not permission to execute spreadsheet formulas.
                cell.data_type = 's'
                if row_index == 1:
                    cell.font = Font(bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor='174E7A')
        for column in sheet.columns:
            width = min(60, max(12, max(len(str(cell.value or '')) for cell in column) + 2))
            sheet.column_dimensions[get_column_letter(column[0].column)].width = width
        sheet.freeze_panes = 'A2'; sheet.auto_filter.ref = sheet.dimensions
        workbook.save(destination)
    else: raise ValueError('Unsupported artifact format')

def verify(kind, destination):
    if kind == 'docx':
        from docx import Document
        assert len(Document(destination).paragraphs) > 0
    elif kind == 'pdf':
        from pypdf import PdfReader
        assert len(PdfReader(destination).pages) > 0
    elif kind == 'pptx':
        from pptx import Presentation
        assert len(Presentation(destination).slides) > 0
    elif kind == 'xlsx':
        from openpyxl import load_workbook
        book = load_workbook(destination, read_only=True)
        assert book.active.max_row > 0
        book.close()

if __name__ == '__main__' and sys.argv[1:] == ['--self-test']:
    import tempfile
    with tempfile.TemporaryDirectory() as directory:
        for kind in ['docx', 'pdf', 'pptx', 'xlsx']:
            target = Path(directory) / ('test.' + kind)
            render(kind, 'Studio validation', 'Heading\nVerified content\n\nNext section\nSecond item', target)
            verify(kind, target)
    print('Verified DOCX, PDF, PPTX and XLSX creation and readback')
elif __name__ == '__main__':
    spec = json.load(sys.stdin)
    render(spec['format'], spec['title'], spec['content'], Path(sys.argv[1]))
    verify(spec['format'], Path(sys.argv[1]))
