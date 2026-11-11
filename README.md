# LILLE: artist site

A work-in-progress artist site for LILLE (New York; hard dance and speed
garage), laid out after
[young-multi-strona.netlify.app](https://young-multi-strona.netlify.app/): the
name in tall black letters behind a cut-out figure, a dark screen for the new
single that slides up over the landing, a sideways wipe into a tilted pile of
record cards on grid paper, a black circle that opens onto a line-drawn
portrait with a speech bubble, a wipe to a white screen of three cards, and a
dark dome that rises into the contact screen with a moving line of type behind
the address.

Live: https://lille-music.com/ (Cloudflare; publish with
`tools/publish_cloudflare.sh`, or `tools/publish_cloudflare.sh round-2` for a
preview address that leaves the domain as it was). A push to `main` does not
update the domain. It only updates the GitHub Pages copy at
https://samsegan.github.io/lille-site/.

The `noindex` tag and the "Preview build, not yet official" line came off on
2026-11-11. A preview address made by the publish script still gets `noindex`.

## Colours and type

Taken from LILLE's own pictures and cover art, not from the reference:

| Colour | Where it comes from |
|---|---|
| Wall `#bccbca`, paper `#eef3f1` | the pale wall of the press portrait |
| Ink `#07090b` | the dark denim and the night pictures |
| Ringer red `#c8102e` | the red trim of the tee in the portrait |
| Print pink `#e38896` | the print on the same tee |
| Streak orange `#ff5a36`, teal `#1d4e55` | the light streaks of the WITH ME cover |

Each record card takes its two colours from its own cover. Type: Antonio
(tall) and Anybody at its widest and heaviest (wide), both open-licence
Google Fonts, kept in `fonts/`.

## What is on the page

1. **Landing**: the press portrait; LILLE cut out of it so the name sits behind.
2. **New single**: WITH ME (with K.ONE, IN / ROTATION), play button, four
   streaming links.
3. **Discography**: one card per release, oldest first, the newest on top:
   Lille Vault (2019–20 remixes), When It Comes To Love, Everlong (Lille
   Remix), Thats My Bby, With Me, and the unreleased songs heard in the
   Elsewhere set. On a computer the songs play in the page through
   SoundCloud's own player; on phones Play opens SoundCloud.
4. **About**: four facts and a drawn portrait. Its speech bubble shows LILLE's
   own lines, each quoted word for word from a public post, with its source.
   Pulling a curl (or scrolling) moves to the next one.
5. **Selected nights**: brought out by Tiësto in Brooklyn, Elsewhere, and the
   b2b with K.ONE in Orlando.
6. **Contact**: the public address (copies on click on a computer), promos by
   SoundCloud DM, and the profiles.

With reduced motion switched on in the system (or without JavaScript) the same
sections simply stack and read top to bottom.

## Files

Plain HTML, CSS and JavaScript. No framework, no build step for the page.

| File | What it holds |
|---|---|
| `index.html` | Every section and all the wording |
| `css/styles.css` | The look; the `html.go` rules are the pinned, scroll-driven mode |
| `js/app.js` | Scroll motion, menu, the drawn portrait, the player |
| `js/data.js` | The tracks the page can play (SoundCloud links, lengths) |
| `art/`, `img/`, `fonts/` | Cover art, photos, the two typefaces |
| `tools/build.py` | Crops and compresses the pictures from the originals |
| `tools/cutout.swift` | Cuts a person out of a photo (Apple Vision), for the landing |
| `tools/avatar.py` | Draws the line portrait and writes it into `index.html` |

## Changing things

**Wording, links, nights, the quoted lines:** straight in `index.html`.

**A new record:** copy one `<article class="card">` block in `index.html`
(the last block is the top of the pile), give it its two colours
(`--c1`, `--c2`, and `--fg` for the text colour), put the cover in `art/`,
and add the track to `js/data.js`. Add `"embed": false` to a track when
SoundCloud will not play it inside other sites (a label setting): Play then
opens SoundCloud instead of the page's own player. All six tracks here were
tested and play.

**Pictures:** the originals are not kept in this repo.

    uv run --with pillow tools/build.py --src <folder with the originals>

**The timing of the scroll:** the numbers at the top of `js/app.js` (in screen
heights); `RUN_LEN` and `END_LEN` must stay one less than the two heights in
the `html.go .run` and `html.go .end` rules of the stylesheet.

## Where the facts come from

- Records, dates, lengths: LILLE's SoundCloud and Spotify pages. A label is
  shown only where Spotify and Beatport name one (WITH ME).
- "New York", the contact address, "send me promos @ sc dm": the SoundCloud
  profile and link page.
- "Hard dance" and "speed garage": the genre set on the SoundCloud uploads and
  the Everlong remix's own cover.
- Brooklyn with Tiësto, Elsewhere, the unreleased songs: public Instagram posts
  (linked from the cards). Orlando: the event's own listing.
- Photos: LILLE's profile pictures and posts. They need LILLE's OK (and the
  photographers') before the site is made official.

## Preview locally

    python3 -m http.server 8813

then open http://127.0.0.1:8813/.
