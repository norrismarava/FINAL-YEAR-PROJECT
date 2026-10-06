import json
import os
import sys

import fitz


def load_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path, value):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def locate_marker(document, marker):
    for page_index, page in enumerate(document):
        if marker in page.get_text("text"):
            return page_index
    raise RuntimeError(f"Could not locate PDF marker: {marker}")


def inspect(manifest_path, output_path):
    manifest = load_json(manifest_path)
    documents = {}
    section_offsets = {}
    running_page = 0

    for section in manifest["sections"]:
        document = fitz.open(section["pdfPath"])
        documents[section["key"]] = document
        section_offsets[section["key"]] = running_page
        running_page += len(document)

    def enrich(entries):
        enriched = []
        for entry in entries:
            section = entry["section"]
            local_page = locate_marker(documents[section], entry["marker"])
            enriched.append(
                {
                    **entry,
                    "localPage": local_page,
                    "logicalPage": section_offsets[section] + local_page + 1,
                }
            )
        return enriched

    result = {
        "totalBodyPages": running_page,
        "sectionOffsets": section_offsets,
        "headings": enrich(manifest["headings"]),
        "figures": enrich(manifest["figures"]),
        "tables": enrich(manifest["tables"]),
    }
    save_json(output_path, result)

    for document in documents.values():
        document.close()


def roman(number):
    values = (
        (1000, "m"),
        (900, "cm"),
        (500, "d"),
        (400, "cd"),
        (100, "c"),
        (90, "xc"),
        (50, "l"),
        (40, "xl"),
        (10, "x"),
        (9, "ix"),
        (5, "v"),
        (4, "iv"),
        (1, "i"),
    )
    result = []
    remaining = number
    for value, symbol in values:
        while remaining >= value:
            result.append(symbol)
            remaining -= value
    return "".join(result)


def add_footer(page, label, body=False):
    width = page.rect.width
    height = page.rect.height
    footer_box = fitz.Rect(38, height - 24, width - 38, height - 8)
    page.draw_rect(footer_box, color=None, fill=(1, 1, 1), overlay=True)
    page.insert_textbox(
        footer_box,
        label,
        fontsize=8,
        fontname="helv",
        color=(0.33, 0.43, 0.48),
        align=fitz.TEXT_ALIGN_CENTER,
        overlay=True,
    )
    if body:
        page.insert_text(
            fitz.Point(42, 17),
            "WaitLess Digital Queue Management System",
            fontsize=7.3,
            fontname="helv",
            color=(0.46, 0.56, 0.61),
            overlay=True,
        )


def merge(manifest_path):
    manifest = load_json(manifest_path)
    output_path = manifest["outputPath"]
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    final = fitz.open()
    front = fitz.open(manifest["frontPath"])
    final.insert_pdf(front)
    front_pages = len(front)
    front.close()

    body_starts = {}
    body_counts = {}
    for section in manifest["bodySections"]:
        source = fitz.open(section["pdfPath"])
        body_starts[section["key"]] = len(final)
        body_counts[section["key"]] = len(source)
        final.insert_pdf(source)
        source.close()

    manual_starts = []
    for manual in manifest["manuals"]:
        source = fitz.open(manual["path"])
        manual_starts.append((manual["title"], len(final), len(source)))
        final.insert_pdf(source)
        source.close()

    for index, page in enumerate(final):
        if index == 0:
            continue
        if index < front_pages:
            add_footer(page, roman(index + 1))
        else:
            add_footer(page, str(index - front_pages + 1), body=True)

    toc = [[1, "WaitLess Project Documentation", 1]]
    front_titles = [
        "Acknowledgements",
        "Dedication",
        "Declaration and Release Form",
        "Approval Form",
        "Originality and Antiplagiarism Statement",
        "Abstract",
        "Table of Contents",
        "List of Figures",
        "List of Tables",
        "List of Abbreviations",
    ]
    for title in front_titles:
        page_number = None
        for page_index in range(front_pages):
            text = final[page_index].get_text("text")
            if title in text:
                page_number = page_index + 1
                break
        if page_number is not None:
            toc.append([1, title, page_number])

    section_offsets = manifest["indexData"]["sectionOffsets"]
    for entry in manifest["indexData"]["headings"]:
        physical_page = front_pages + entry["logicalPage"]
        toc.append([entry["level"], entry["title"], physical_page])

    for title, start, _count in manual_starts:
        toc.append([1, title, start + 1])

    final.set_toc(toc, collapse=2)
    metadata = final.metadata
    metadata.update(
        {
            "title": "WaitLess: A Digital Queue Management System for Zimbabwean Public Hospitals",
            "author": "Shadreck Mapuranga; Norris Marava; Kelvin Ncube",
            "subject": "Final-year project documentation submitted to Chinhoyi University of Technology",
            "keywords": "WaitLess, digital queue management, hospital, triage, Zimbabwe, patient flow",
            "creator": "WaitLess documentation build",
            "producer": "Chromium and PyMuPDF",
        }
    )
    final.set_metadata(metadata)
    final.save(output_path, garbage=4, deflate=True, clean=True)
    page_count = len(final)
    final.close()

    print(
        json.dumps(
            {
                "output": output_path,
                "pages": page_count,
                "frontMatterPages": front_pages,
                "bodyPagesBeforeManuals": sum(body_counts.values()),
                "manualPages": sum(item[2] for item in manual_starts),
                "bookmarks": len(toc),
            },
            ensure_ascii=False,
        )
    )


def main():
    if len(sys.argv) < 3:
        raise SystemExit(
            "Usage: finalize-documentation.py inspect <manifest> <output> | merge <manifest>"
        )
    command = sys.argv[1]
    if command == "inspect" and len(sys.argv) == 4:
        inspect(sys.argv[2], sys.argv[3])
        return
    if command == "merge" and len(sys.argv) == 3:
        merge(sys.argv[2])
        return
    raise SystemExit("Invalid arguments")


if __name__ == "__main__":
    main()
