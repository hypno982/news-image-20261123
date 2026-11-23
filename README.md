[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/hypno982/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/hypno982/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

# The World in One Day — Monday 23 November 2026

One 1024×1024 image that reads as a newspaper front page for **Monday 23 November
2026**, built for the [make.fun news-image-20261123 bounty](https://make.fun/bounty/news-image-20261123).

The date is the loudest element on the page — "Monday" in red above "23 NOVEMBER
2026" in the largest type — because the judge ranks an image that names its day
above one that does not. Under the masthead sits a strip of the day's six hardest
numbers, then a world map with pins where the stories happened, then 38 headlines
in six labelled regions, and a footer repeating the date and the wire services.

## What is on the page

- **38 stories** reported on 23 November 2026, in six regions: Europe, Middle
  East, Africa, Asia, Americas, Oceania.
- The day's lead: COP31 gavelled shut in Türkiye with no climate pact, after the
  final text could not bring itself to name fossil fuels.
- The day's war: Russian overnight strikes killing 11 in the Kyiv region, two
  missiles and a drone crossing into Poland, and Washington weighing a lasting
  agreement to end the Iran war.
- The day's markets: Seoul opening more than 3% lower as AI fears bite, Beijing
  cutting margin requirements to steady its own market, US futures turning up
  after the S&P 500 entered correction.
- The day's rest: India's record 720-9 against New Zealand, Molly Meldrum dying
  at 83, Nepal's new prime minister landing in Delhi, Ghana's army reclaiming a
  forest reserve from galamsey mining.

Nothing on the page is a forecast or a figure invented to look precise: every
line is what a wire reported on the day, worded plainly enough to read at a
thumbnail.

## How it is built

```
card.html   the page: pure HTML and CSS, one hand-drawn inline SVG map,
            no script, no network, no external font, no remote image
render.py   renders card.html with Playwright at a 1024x1024 viewport and a
            fixed clip, after asserting every headline is inside the frame
            and that the page does not overflow it
main.ts     validates that entry.png is a whole PNG (signature, IHDR first with
            length 13, IEND ending at EOF, 1024x1024, under 1 MiB) and copies
            it to MAKEFUN_OUTPUT_DIR
entry.png   the submission image
```

Build and check the copy:

```sh
python3 render.py                                   # redraw entry.png from card.html
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts  # what the grader runs
sha256sum entry.png out/entry.png                     # the two hashes must match
```

The renderer is deterministic — a fixed viewport, a fixed clip, no animation and
no randomness — so the same page always produces the same bytes, and the
grader's two runs agree.

## License

MIT. The page, the map and the wording are this entry's own; the stories are
reported facts from the day's wires.
