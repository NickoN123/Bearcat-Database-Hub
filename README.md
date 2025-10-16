<!-- README.md -->
# Bearcat Ideas Hub

A static GitHub Pages site that transforms Instagram HTML exports into a browsable, searchable library with an AI-powered idea generator for the Bearcat mascot team.

## 🚀 Quick Start

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/bearcat-ideas-hub.git
   cd bearcat-ideas-hub
```

2. **Run locally** 
   Simply open `index.html` in your browser - no server needed!
```bash
   open index.html  # Mac
   start index.html # Windows
```

3. **Enable GitHub Pages**
   - Go to Settings → Pages in your GitHub repo
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Click Save
   - Your site will be live at: `https://yourusername.github.io/bearcat-ideas-hub/`

## 📥 Importing Instagram Data

1. Export your Instagram data as HTML files
2. Click the **Import Data** panel or drag files directly onto the drop zone
3. The importer will parse and extract:
   - Posts, captions, hashtags
   - Media URLs and thumbnails
   - Engagement metrics
   - Timestamps and metadata
4. Click **Download Updated Dataset** to save the new `posts.json`
5. Commit and push to update the live site

## 🔍 Search & Filters

- **Fuzzy Search**: Type anything to search captions, hashtags, and tags
- **Media Type Filters**: Images, Videos, Reels, Carousels
- **Year Filter**: Filter by year dropdown
- **Event Filter**: Filter by event type
- **URL Sharing**: All filters update the URL so you can share specific views

## 💡 Idea Generator

The idea generator creates fresh content ideas while respecting the 4-year no-repeat rule:

1. Select **Event Type** (Football, Basketball, etc.)
2. Select **Location** (Indoor/Outdoor) 
3. Optionally add a **Theme** (retro, rivalry, kids, etc.)
4. Click **Generate Ideas**

Each idea includes:
- Title and summary
- Props and costume notes
- Crowd interaction callouts
- Risk assessments
- Delivery plan
- Freshness status (Fresh/Blocked/Revival)

### The Four-Year Rule

- Ideas similar to anything used in the last 4 years are marked as **BLOCKED**
- The system suggests alternatives that change core mechanics
- Near-match detection uses Jaccard similarity (threshold: 0.45)
- Compares titles, summaries, props, and themes

## 🏗️ Project Structure
```
bearcat-ideas-hub/
├── index.html              # Main application
├── assets/
│   ├── styles.css         # Responsive styles with dark mode
│   ├── app.js             # Main controller
│   ├── search.js          # Fuse.js search implementation
│   ├── importer.js        # Instagram HTML parser
│   ├── generator.js       # Idea generator with 4-year rule
│   ├── db.js              # IndexedDB wrapper
│   └── vendor/
│       └── fuse.min.js    # Fuzzy search library
├── data/
│   ├── posts.json         # Post database
│   ├── schema.json        # Data schemas
│   └── lookups.json       # Enum values
├── tests.html             # Test runner
└── .github/
    └── workflows/
        └── pages.yml      # GitHub Pages deployment
```

## 🎨 Features

- **Responsive Design**: Works on all devices
- **Dark Mode**: Toggle with 🌓 button
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Offline First**: Uses IndexedDB for local storage
- **Fast Search**: Fuzzy matching with weighted results
- **Lazy Loading**: Images load as you scroll
- **No Build Tools**: Pure HTML/CSS/JS - works anywhere

## 🧪 Running Tests

Open `tests.html` in your browser to run the test suite.

## 📝 Data Schemas

### Post Schema
- `post_id`: Unique identifier
- `shortcode`: Instagram shortcode  
- `permalink`: Full Instagram URL
- `timestamp_iso`: ISO 8601 timestamp
- `media_type`: Image/Video/Reel/Carousel
- `caption_raw/clean`: Original and cleaned captions
- `hashtags`: Array of tags
- `likes/comments/views`: Engagement metrics

### Idea Schema
- `id`: Format AA-001
- `idea_title`: Descriptive title
- `event_type`: Football/Basketball/etc.
- `indoor_outdoor`: Location constraints
- `last_used_date`: For 4-year rule
- `props_list`: Required materials
- `delivery_plan`: Step-by-step execution

## 🚢 Deployment

The site automatically deploys to GitHub Pages when you push to main branch.

**Manual deployment:**
1. Push your changes to GitHub
2. GitHub Actions will build and deploy
3. Check Actions tab for deployment status
4. Site updates in ~2 minutes

## 🔒 Security & Privacy

- No external API calls
- All data stored locally in browser
- No tracking or analytics
- Instagram data never leaves your browser
- Deterministic idea generation (no AI APIs)

## 📜 License

MIT License - See LICENSE file

## 🐻 Go Bearcats!

Built with ❤️ for the UC Bearcat Spirit Squad
```
```
<!-- LICENSE -->
MIT License

Copyright (c) 2025 Bearcat Ideas Hub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
