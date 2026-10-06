# Build a Chapter-3-only docx restyled to match the Chapter 1+2 submission style
# (Times New Roman, black headings, CHAPTER n: TITLE caps, no running headers/footers)
import re, shutil, os, sys

SRC = r'C:\Users\norri\Videos\DIGITAL QUE SYSTEM\Documentation\_docx_extract'
PKG = r'C:\Users\norri\Videos\DIGITAL QUE SYSTEM\Documentation\_ch3_pkg'

CH3_START = 611637   # placeholder; recomputed below from TOC bookmark
CH3_END   = 898724   # placeholder; recomputed below from TOC bookmark

FONTS = ['Calibri', 'Segoe UI', 'Cambria', 'Arial', 'Georgia', 'Verdana',
         'Tahoma', 'Century Gothic', 'Book Antiqua', 'Consolas']
KEEP_FONTS = ['Symbol', 'Wingdings', 'MS Mincho', 'Times New Roman']

# half-point size remap for inline run sizes >= 13 (factor ~1.09, even result)
def remap_sz(n):
    n = int(n)
    if n < 13:
        return str(n)
    v = int(round(n * 1.09))
    if v % 2:
        v += 1
    return str(max(v, 26 if n >= 21 else 20))

def scale_run_sizes(block):
    # scale <w:sz> and <w:szCs> inside real run properties  <w:r><w:rPr>...</w:rPr>
    def fix_rpr(m):
        inner = m.group(2)
        inner = re.sub(r'<w:(sz|szCs) w:val="(\d+)"/>',
                       lambda s: '<w:%s w:val="%s"/>' % (s.group(1), remap_sz(s.group(2))), inner)
        return m.group(1) + inner
    return re.sub(r'(<w:r(?:\s[^>]*)?><w:rPr>)(.*?)(?=</w:rPr>)', fix_rpr, block, flags=re.S)

def fix_fonts(block):
    def rep(m):
        face = m.group(2)
        if face in KEEP_FONTS:
            return m.group(0)
        return m.group(1) + '="Times New Roman"'
    return re.sub(r'(w:(?:ascii|hAnsi|cs|eastAsia))="([^"]+)"', rep, block)

def fix_colors(block):
    def rep(m):
        c = m.group(1).upper()
        return m.group(0) if c in ('FFFFFF', 'AUTO') else '<w:color w:val="000000"/>'
    return re.sub(r'<w:color w:val="([0-9A-Fa-f]+)"/>', rep, block)

xml = open(os.path.join(SRC, 'word', 'document.xml'), encoding='utf8').read()

# precise bounds: <w:p> paragraphs containing the chapter TOC bookmarks
bm3 = xml.find('<w:bookmarkStart w:name="_TOC_250064"')
CH3_START = xml.rfind('<w:p><w:pPr>', 0, bm3)
bm4 = xml.find('<w:bookmarkStart w:name="_TOC_250047"')
CH3_END = xml.rfind('<w:p><w:pPr>', 0, bm4)
assert 0 < CH3_START < CH3_END
print('CH3_START:', CH3_START, repr(xml[CH3_START:CH3_START + 60]))
print('CH3_END:', CH3_END, repr(xml[CH3_END:CH3_END + 60]))

# sanity check of section breaks inside ch3
ch3 = xml[CH3_START:CH3_END]
for m in re.finditer(r'<w:sectPr[^>]*(?:/>|>.*?</w:sectPr>)', ch3, re.S):
    s = m.group(0)
    pg = re.search(r'<w:pgSz[^/]*/>', s)
    print('sectPr @%d  %s  hdr/ftr:%d' % (m.start(), pg.group(0) if pg else '-',
          len(re.findall(r'headerReference|footerReference', s))))

# split ch3 into pict / non-pict regions
parts, last = [], 0
for m in re.finditer(r'<w:pict>.*?</w:pict>', ch3, re.S):
    parts.append(('norm', ch3[last:m.start()]))
    parts.append(('pict', m.group(0)))
    last = m.end()
parts.append(('norm', ch3[last:]))

def is_rule_pict(seg):
    return (len(seg) < 1000 and 'textbox' not in seg and 'imagedata' not in seg
            and 'v:rect' in seg)

out = []
for kind, seg in parts:
    if kind == 'pict' and is_rule_pict(seg):
        continue  # teal heading rule - drop to match ch1+2 plain headings
    seg = fix_fonts(seg)
    seg = fix_colors(seg)
    if kind == 'norm':
        seg = scale_run_sizes(seg)
        seg = re.sub(r'<w:pBdr>.*?</w:pBdr>', '', seg, flags=re.S)
    out.append(seg)
ch3_new = ''.join(out)

# flush BodyText paragraphs: remove left/right paragraph indents (not list items)
def flush_para(m):
    p = m.group(0)
    head = p[:p.find('</w:pPr>')]
    if 'w:val="BodyText"' in head and 'numPr' not in head and '<w:pict' not in p:
        p = re.sub(r'<w:ind [^/]*/>',
                   lambda i: re.sub(r' w:(left|right|firstLine|hanging)="\d+"', '', i.group(0)), p)
    elif 'w:val="Heading' in head and '<w:pict' not in p:
        p = re.sub(r'<w:ind [^/]*/>', '', p)
    text = re.sub(r'<[^>]+>', '', p)
    if re.match(r'\s*(Figure|Table)\s*\d', text) and '<w:pict' not in p:
        p = re.sub(r'<w:ind [^/]*/>', '', p)
        p = re.sub(r'<w:jc [^/]*/>', '', p)
        p = p.replace('</w:pPr>', '<w:jc w:val="center"/></w:pPr>', 1)
    return p
ch3_new = re.sub(r'<w:p>(?:(?!</w:p>).)*?</w:p>', flush_para, ch3_new, flags=re.S)

# rebuild the chapter title paragraph: runs -> single bold 18pt run, ALL CAPS
p_end = ch3_new.index('</w:p>') + 6
title_para = ch3_new[:p_end]
m = re.search(r'<w:pPr>.*?</w:pPr>', title_para, re.S)
ppr = m.group(0) if m else ''
# drop any numbering and colour from pPr, keep spacing/jc
ppr = re.sub(r'<w:numPr>.*?</w:numPr>', '', ppr, flags=re.S)
ppr = re.sub(r'<w:ind [^/]*/>', '', ppr)
title_para = ('<w:p>' + ppr +
              '<w:r><w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>'
              '<w:t>CHAPTER 3: METHODOLOGY</w:t></w:r></w:p>')
ch3_new = title_para + ch3_new[p_end:]

# strip header/footer refs inside ch3 sectPr and enforce 1in margins
def fix_sectpr(s):
    s = re.sub(r'<w:(header|footer)Reference[^/]*/>', '', s)
    s = re.sub(r'<w:pgMar[^/]*/>',
               '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" '
               'w:header="720" w:footer="720" w:gutter="0"/>', s)
    return s
ch3_new = re.sub(r'<w:sectPr[^>]*(?:/>|>.*?</w:sectPr>)',
                 lambda m: fix_sectpr(m.group(0)), ch3_new, flags=re.S)

# fresh package copy
if os.path.exists(PKG):
    shutil.rmtree(PKG)
shutil.copytree(SRC, PKG)

# ---- replace the three VML figures with high-res crops from the original PDF ----
import fitz
ORIG_PDF = r'C:\Users\norri\Videos\DIGITAL QUE SYSTEM\Documentation\CHAPTERS-SUBMITTED\WaitLess-Final-Project-Documentation.pdf'
FIGS = {'3.1': 31, '3.2': 33, '3.3': 35}   # caption -> page index in original pdf
opdf = fitz.open(ORIG_PDF)
rels_path = os.path.join(PKG, 'word', '_rels', 'document.xml.rels')
rels = open(rels_path, encoding='utf8').read()
next_rid = max(int(i) for i in re.findall(r'Id="rId(\d+)"', rels)) + 1
CONTENT_W = 9026 * 635  # 6.27in text width in EMU
# split ch3 body into top-level blocks (paragraphs / tables), depth-aware so that
# paragraphs nested in textboxes or table cells stay inside their parent block
def split_blocks(s):
    blocks, depth, start = [], 0, 0
    for m in re.finditer(r'<w:(p|tbl)(?=[ >])|</w:(p|tbl)>', s):
        if m.group(1):          # opening tag
            if depth == 0:
                if m.start() > start:
                    blocks.append(s[start:m.start()])
                start = m.start()
            depth += 1
        else:                   # closing tag
            depth -= 1
            if depth == 0:
                blocks.append(s[start:m.end()])
                start = m.end()
    if start < len(s):
        blocks.append(s[start:])
    return blocks
blocks = split_blocks(ch3_new)
assert ''.join(blocks) == ch3_new, 'block split mismatch'

def plain(b):
    return re.sub(r'<[^>]+>', '', re.sub(r'<w:pict>.*?</w:pict>', '', b, flags=re.S)).strip()

for num, pidx in FIGS.items():
    pg = opdf[pidx]
    bbox = pg.get_image_bbox(pg.get_images(full=True)[0])
    pix = pg.get_pixmap(dpi=300, clip=bbox)
    fname = 'fig%s.png' % num.replace('.', '')
    pix.save(os.path.join(PKG, 'word', 'media', fname))
    rid = 'rId%d' % next_rid; next_rid += 1
    rels = rels.replace('</Relationships>',
        '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/%s"/></Relationships>' % (rid, fname))
    cy = int(CONTENT_W * pix.height / pix.width)
    img_para = ('<w:p><w:pPr><w:spacing w:before="120" w:after="60"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>'
        '<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="%d" cy="%d"/>'
        '<wp:docPr id="%d" name="Figure %s"/>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:nvPicPr><pic:cNvPr id="0" name="%s"/><pic:cNvPicPr/></pic:nvPicPr>'
        '<pic:blipFill><a:blip r:embed="%s"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>'
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
        % (CONTENT_W, cy, 1000 + next_rid, num, fname, rid, CONTENT_W, cy))
    # locate caption block
    cap_i = next(i for i, b in enumerate(blocks) if re.search(r'Figure\s*</w:t>.*?%s' % re.escape(num), b, re.S) or plain(b).startswith('Figure %s' % num))
    # walk back to last block with real body text that isn't figure content
    j = cap_i - 1
    while j >= 0:
        b = blocks[j]
        if b.startswith('<w:tbl>') or '<w:pict>' in b or not plain(b):
            j -= 1; continue
        break
    start = j + 1
    print('fig %s: replacing blocks %d..%d (%d blocks) with %dx%d image' % (num, start, cap_i - 1, cap_i - start, pix.width, pix.height))
    blocks[start:cap_i] = [img_para]
    # keep caption on same page as image
    blocks[start] = blocks[start].replace('<w:pPr>', '<w:pPr><w:keepNext/>', 1)
ch3_new = ''.join(blocks)
open(rels_path, 'w', encoding='utf8').write(rels)

body_start = xml.index('<w:body>') + len('<w:body>')
head = xml[:body_start]
tail = xml[xml.rindex('<w:sectPr'):]
tail = fix_sectpr(tail)

new_xml = head + ch3_new + tail
open(os.path.join(PKG, 'word', 'document.xml'), 'w', encoding='utf8').write(new_xml)

# ---- styles.xml: fonts -> Times New Roman, heading sizes/colours ----
st_path = os.path.join(PKG, 'word', 'styles.xml')
st = open(st_path, encoding='utf8').read()
st = fix_fonts(st)
# all non-white style colours -> black (headings/captions render black like ch1+2)
st = fix_colors(st)
# docDefaults + default fonts
st = re.sub(r'(w:asciiTheme|w:hAnsiTheme|w:eastAsiaTheme|w:cstheme)="[^"]*"', r'\1="minorHAnsi"', st)

# bump style sizes: chapter (Heading3) 36, sections (Heading6) 32, subs (Heading4/5) 28
for sid, sz in [('Heading3', '36'), ('Heading4', '28'), ('Heading5', '28'),
                ('Heading6', '32'), ('Heading2', '36'), ('Heading1', '36')]:
    pat = r'(<w:style [^>]*w:styleId="%s".*?</w:style>)' % sid
    m = re.search(pat, st, re.S)
    if m:
        blk = m.group(1)
        blk = re.sub(r'<w:(sz|szCs) w:val="\d+"/>',
                     lambda s: '<w:%s w:val="%s"/>' % (s.group(1), sz), blk)
        blk = re.sub(r'<w:color[^/]*/>', '<w:color w:val="000000"/>', blk)
        blk = re.sub(r'<w:pBdr>.*?</w:pBdr>', '', blk, flags=re.S)
        blk = re.sub(r'<w:ind [^/]*/>', '', blk)
        if '<w:b/>' not in blk:
            blk = re.sub(r'(</w:rFonts>|<w:rPr>)', r'\1<w:b/>', blk, count=1)
        st = st[:m.start(1)] + blk + st[m.end(1):]
        print('style %s -> sz %s' % (sid, sz))

# Normal + BodyText base size -> 12pt (runs may still override)
for sid in ['Normal', 'BodyText']:
    pat = r'(<w:style [^>]*w:styleId="%s".*?</w:style>)' % sid
    m = re.search(pat, st, re.S)
    if m:
        blk = m.group(1)
        blk = re.sub(r'<w:(sz|szCs) w:val="\d+"/>',
                     lambda s: '<w:%s w:val="24"/>' % s.group(1), blk)
        st = st[:m.start(1)] + blk + st[m.end(1):]
        print('style %s -> 24' % sid)

open(st_path, 'w', encoding='utf8').write(st)

# ---- numbering + fontTable fonts -> Times New Roman ----
for extra in ['numbering.xml', 'fontTable.xml']:
    p = os.path.join(PKG, 'word', extra)
    if os.path.exists(p):
        data = fix_fonts(open(p, encoding='utf8').read())
        if extra == 'numbering.xml':
            # flush list indents -> match ch1+2 flush headings/items
            data = re.sub(r'<w:ind [^/]*/>', '', data)
            data = fix_colors(data)
        open(p, 'w', encoding='utf8').write(data)

# ---- theme fonts -> Times New Roman ----
th = os.path.join(PKG, 'word', 'theme', 'theme1.xml')
if os.path.exists(th):
    t = open(th, encoding='utf8').read()
    t = re.sub(r'typeface="[^"]*"', lambda m: 'typeface="Times New Roman"'
               if not any(k in m.group(0) for k in ('Symbol', 'Wingdings')) else m.group(0), t)
    open(th, 'w', encoding='utf8').write(t)

print('done. ch3 xml len:', len(ch3_new))
