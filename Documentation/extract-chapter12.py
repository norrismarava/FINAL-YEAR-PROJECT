"""Recover editable Chapter 1 and Chapter 2 sources from the approved PDF draft."""

from pathlib import Path
import re

import fitz


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "pdfs" / "WaitLess Chapter 1+2 final.pdf"
CHAPTERS = ROOT / "chapters"


def clean_text(value: str) -> str:
    value = value.replace("\u00ad", "")
    value = re.sub(r"-\s*\n\s*(?=[a-z])", "-", value)
    return re.sub(r"\s+", " ", value).strip()


def split_inline_list(text: str) -> list[str]:
    if "•" in text:
        intro, *items = text.split("•")
        result = [intro.strip()] if intro.strip() else []
        result.extend(f"- {item.strip()}" for item in items if item.strip())
        return result

    numbered = re.split(r"\s+(?=\d+\.\s+[A-Z])", text)
    if len(numbered) > 1:
        return [item.strip() for item in numbered if item.strip()]

    return [text]


def heading_markup(text: str) -> str | None:
    if re.match(r"^CHAPTER\s+\d+", text, re.IGNORECASE):
        title = re.sub(r"^CHAPTER\s+(\d+)\s*:\s*", r"Chapter \1: ", text, flags=re.I)
        return f"# {title.title()}"

    match = re.match(r"^(\d+)\.(\d+)(?:\.(\d+))?\s+(.+)$", text)
    if not match:
        return None

    level = "###" if match.group(3) else "##"
    return f"{level} {text}"


def apply_editorial_corrections(text: str) -> str:
    replacements = {
        "which will alert patients": "which alerted patients",
        "This project proposes the development": "This project developed",
        "The system will digitise": "The system digitised",
        "It will also produce": "It also produced",
        "The system will be designed": "The system was designed",
        "The aim of this project is to design, develop, and evaluate": "The aim of this project was to design, develop, and evaluate",
        "The following objectives have been defined": "The following objectives were defined",
        "Mboya et al. (2024)": "Mwanswila, Mollel and Mushi (2024)",
        "reported by Mboya et al. (2024)": "reported by Mwanswila, Mollel and Mushi (2024)",
        "Egbunu et al. (2020)": "Cho et al. (2017)",
        "Egbunu et al.’s (2020)": "Cho et al.’s (2017)",
        "Wijeratne et al. (2019)": "Kanchanawanishkul et al. (2018)",
        "Gombe et al. (2019)": "Furusa and Coleman (2018)",
        "Gombe et al.’s": "Furusa and Coleman’s",
        "Meta’s (2024)": "Meta’s (2024)",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)

    text = re.sub(
        r"In South Africa, the Chris Hani Baragwanath Hospital implemented a hybrid digital-physical queue system in its outpatient pharmacy, reporting significant improvements in patient satisfaction scores \(Coetzee et al\., 2020\)\.\s*",
        "",
        text,
    )
    return text


def extract() -> tuple[str, str]:
    document = fitz.open(SOURCE)
    chapter_lines: dict[int, list[str]] = {1: [], 2: []}
    active_chapter = 1
    previous_text = ""

    for page_number in range(3, document.page_count):
        blocks = document[page_number].get_text("blocks", sort=True)
        for block in blocks:
            text = clean_text(block[4])
            if not text or text.isdigit():
                continue

            if text.upper().startswith("CHAPTER 2:"):
                active_chapter = 2
                previous_text = ""

            heading = heading_markup(text)
            if heading:
                chapter_lines[active_chapter].extend([heading, ""])
                previous_text = ""
                continue

            text = apply_editorial_corrections(text)
            fragments = split_inline_list(text)

            if (
                previous_text
                and fragments
                and not fragments[0].startswith(("- ", "1. ", "2. ", "3. "))
                and not re.search(r"[.!?:]$", previous_text)
            ):
                chapter_lines[active_chapter][-2] += " " + fragments.pop(0)

            if previous_text.endswith("Chapter") and fragments and fragments[0].startswith("3."):
                chapter_lines[active_chapter][-2] += " " + fragments.pop(0)

            for fragment in fragments:
                chapter_lines[active_chapter].extend([fragment, ""])
                previous_text = fragment

    outputs = []
    for chapter in (1, 2):
        content = "\n".join(chapter_lines[chapter]).strip() + "\n"
        outputs.append(content)
    return outputs[0], outputs[1]


if __name__ == "__main__":
    CHAPTERS.mkdir(parents=True, exist_ok=True)
    chapter_one, chapter_two = extract()
    (CHAPTERS / "chapter-1-introduction.md").write_text(chapter_one, encoding="utf-8")
    (CHAPTERS / "chapter-2-literature-review.md").write_text(chapter_two, encoding="utf-8")
    print("Recovered editable Chapter 1 and Chapter 2 sources.")
