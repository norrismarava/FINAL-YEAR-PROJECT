import fitz, re

BASE = r'C:\Users\norri\Videos\DIGITAL QUE SYSTEM\Documentation\CHAPTERS-SUBMITTED\WaitLess Chapter 1+2 final.pdf'
CH3  = r'C:\Users\norri\Videos\DIGITAL QUE SYSTEM\Documentation\_chapter3_times.pdf'
OUT  = r'C:\Users\norri\Videos\DIGITAL QUE SYSTEM\Documentation\CHAPTERS-SUBMITTED\WaitLess Chapters 1+2+3 final.pdf'

d12 = fitz.open(BASE)
d3  = fitz.open(CH3)
out = fitz.open()
out.insert_pdf(d12)
start_idx = out.page_count           # 18
out.insert_pdf(d3)

GRAY = (0.55, 0.55, 0.55)
LINE_Y = 805.9
LX0, LX1 = 80.53, 515.02
BRACE_L, BRACE_R = 283.0, 312.0      # brace x positions
NUM_CX = 298.0                        # number centre x
BASE_Y = 812.0                        # baseline

for i in range(start_idx, out.page_count):
    pg = out[i]
    num = str(i - start_idx + 19)
    pg.draw_line(fitz.Point(LX0, LINE_Y), fitz.Point(BRACE_L - 8, LINE_Y),
                 color=GRAY, width=0.7)
    pg.draw_line(fitz.Point(BRACE_R + 8, LINE_Y), fitz.Point(LX1, LINE_Y),
                 color=GRAY, width=0.7)
    pg.insert_text(fitz.Point(BRACE_L, BASE_Y), '{', fontname='Times-Roman',
                   fontsize=14, color=GRAY)
    pg.insert_text(fitz.Point(BRACE_R, BASE_Y), '}', fontname='Times-Roman',
                   fontsize=14, color=GRAY)
    w = fitz.get_text_length(num, fontname='Times-Roman', fontsize=12)
    pg.insert_text(fitz.Point(NUM_CX - w / 2, BASE_Y), num,
                   fontname='Times-Roman', fontsize=12, color=(0, 0, 0))

# ---------- TOC: append chapter 2 & 3 entries on the TOC page (index 2) ----------
toc = out[2]
words = toc.get_text('words')
# existing entry geometry
left0 = min(w[0] for w in words if w[4].startswith('CHAPTER'))      # chapter x
left1 = [w[0] for w in words if w[4] == '1.0'][0]                   # section x
left2 = [w[0] for w in words if w[4] == '1.2.1'][0]                 # subsection x
num_x = max(w[2] for w in words if w[4].isdigit() and w[0] > 400 and w[3] < 700)   # right edge of numbers
last_y = max(w[3] for w in words if w[4].strip('.') and w[3] < 700)                # bottom of last TOC line
FS = 10.5
LH = 13.2
DOTX = num_x - 8

def toc_line(pg, y, x, text, page, bold=False):
    fn = 'Times-Bold' if bold else 'Times-Roman'
    pg.insert_text(fitz.Point(x, y), text, fontname=fn, fontsize=FS, color=(0, 0, 0))
    tw = fitz.get_text_length(text, fontname=fn, fontsize=FS)
    dots = '.' * max(1, int((DOTX - x - tw) / fitz.get_text_length('.', fontsize=FS)))
    pg.insert_text(fitz.Point(x + tw + 2, y), dots, fontname='Times-Roman',
                   fontsize=FS, color=(0, 0, 0))
    nw = fitz.get_text_length(str(page), fontname=fn, fontsize=FS)
    pg.insert_text(fitz.Point(num_x - nw, y), str(page), fontname=fn,
                   fontsize=FS, color=(0, 0, 0))

# collect chapter 2 headings (physical idx -> printed = idx+1)
ch2 = []
for i in range(11, 18):
    for b in d12[i].get_text('dict')['blocks']:
        for l in b.get('lines', []):
            txt = ''.join(s['text'] for s in l['spans']).strip()
            if re.match(r'^2\.\d+\s+[A-Z]', txt) and not txt.startswith('2.9 Conclusion'):
                if not any(txt.startswith(h[0]) for h in ch2):
                    ch2.append((txt.split(' ', 1)[0], txt, i + 1))
            elif txt.startswith('2.9 Conclusion'):
                ch2.append(('2.9', txt, i + 1))
# collect chapter 3 headings: numbers render as separate lines (x~72),
# title text follows on the next line (x~112)
ch3 = []
for i in range(d3.page_count):
    lines = []
    for b in d3[i].get_text('dict')['blocks']:
        for l in b.get('lines', []):
            lines.append((''.join(s['text'] for s in l['spans']).strip(), l['bbox'][0]))
    for j, (txt, x0) in enumerate(lines):
        if re.match(r'^3\.\d+$', txt) and x0 < 100:
            for k in range(j + 1, len(lines)):
                t2 = lines[k][0]
                if t2:
                    if not any(h[1] == txt + ' ' + t2 for h in ch3):
                        ch3.append((txt, txt + ' ' + t2, i + 19))
                    break

print('ch2:', [(h[0], h[2]) for h in ch2])
print('ch3:', [(h[0], h[2]) for h in ch3])

y = last_y + LH + 6
pg = toc
def emit(title, page, x, bold):
    global y
    toc_line(pg, y, x, title, page, bold)
    y += LH

emit('CHAPTER 2: LITERATURE REVIEW', ch2[0][2] if ch2 else 12, left0, True)
for sec, full, page in ch2:
    emit(full, page, left1, False)
emit('CHAPTER 3: METHODOLOGY', 19, left0, True)
for sec, full, page in ch3:
    emit(full, page, left1, False)

# drop trailing near-blank page(s) from the ch3 export
while out.page_count > start_idx and len(out[-1].get_text().strip()) < 12:
    out.delete_page(-1)
    print('dropped trailing blank page')

out.save(OUT, garbage=3, deflate=True)
print('saved', OUT, 'pages:', out.page_count)
