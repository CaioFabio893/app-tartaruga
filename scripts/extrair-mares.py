"""Reproduz extração da tábua CHM Recife 2026; não calcula previsões."""
import calendar
from collections import Counter
import hashlib
import json
import re
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parents[1]
source = root / 'docs/references/mares/recife-2026.pdf'
days = {}
source_events = Counter()
with pdfplumber.open(source) as pdf:
    assert len(pdf.pages) == 3
    for page_index, page in enumerate(pdf.pages):
        assert 'PORTO DO RECIFE' in page.extract_text() and '2026' in page.extract_text()
        assert 'UTC -03.0' in page.extract_text()
        source_events.update(re.findall(r'(\d{4})\s+(-?\d+\.\d{2})', page.extract_text()))
        starts = [w['x0'] - 19 for w in page.extract_words() if w['text'] == 'HORA']
        assert len(starts) == 8
        for column, start in enumerate(starts):
            month = page_index * 4 + column // 2 + 1
            end = starts[column + 1] if column < 7 else page.width - 25
            text = page.crop((start, 112, end, page.height - 35)).extract_text()
            current = None
            for line in text.splitlines():
                header = re.match(r'^(\d{2})\s', line)
                if header:
                    day = int(header[1])
                    current = f'2026-{month:02}-{day:02}'
                    assert current not in days
                    days[current] = []
                for time, height in re.findall(r'(\d{4})\s+(-?\d+\.\d{2})', line):
                    assert current is not None
                    assert int(time[:2]) < 24 and int(time[2:]) < 60
                    days[current].append({'hora': time[:2] + ':' + time[2:], 'altura': float(height)})

expected = {f'2026-{month:02}-{day:02}' for month in range(1, 13)
            for day in range(1, calendar.monthrange(2026, month)[1] + 1)}
assert set(days) == expected, sorted(expected - set(days))
for date, events in days.items():
    assert len(events) in (3, 4), (date, events)
    assert [e['hora'] for e in events] == sorted({e['hora'] for e in events}), date
assert source_events == Counter((e['hora'].replace(':', ''), f'{e["altura"]:.2f}') for events in days.values() for e in events)

result = {'estacao': 'Porto do Recife', 'ano': 2026, 'fuso': 'UTC−03:00',
          'fonte': 'Centro de Hidrografia da Marinha · DG6-63 · páginas 82–84',
          'url': 'https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/dados_de_mare/24%20-%20PORTO%20DO%20RECIFE%20-%2082%20-%2084.pdf',
          'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'dias': dict(sorted(days.items()))}
target = root / 'src/features/mares/recife-2026.json'
target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'{len(days)} dias, {sum(map(len, days.values()))} eventos; SHA256 {result["sha256"]}')
