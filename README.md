# AI Slides - AI-Powered Presentation Generator

An AI-powered chat application that generates and edits PowerPoint presentations using Google's Gemini AI model.

## Live Demo & Important Note

> **Note:** A live deployment of this project may not be fully functional due to the API quota limits of the shared Gemini API key. For the best experience, please clone the repository and use your own Gemini API key by following the setup instructions below.

## Features

- 🤖 **AI-Powered Content Generation**: Uses the `gemini-2.5-pro-preview-05-06` model to generate structured presentation content from a simple prompt.
- 💬 **Interactive UI**: A chat-like interface to enter prompts and generate presentations.
- 🎨 **Templates**: Use pre-defined templates to kickstart presentation creation.
- 📊 **Real-time Slide Preview**: Instantly preview generated slides with navigation and direct content editing capabilities.
- 🔄 **Prompt-Based Editing**: Dynamically edit the entire presentation by providing new prompts to the AI.
- 📥 **Multi-Format Download**: Download presentations as `.pptx` for PowerPoint or as a `.pdf` document.
- ⏳ **Generation Progress**: A visual indicator shows the progress of slide generation.

## Tech Stack

- **Framework**: Next.js, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI, Lucide React
- **AI Integration**: Google Gemini AI (`gemini-2.5-pro-preview-05-06`) via `@google/generative-ai`
- **PowerPoint Generation**: `pptxgenjs`
- **PDF Generation**: `puppeteer`
- **Package Manager**: pnpm

## Prerequisites

- Node.js (v18 or newer)
- pnpm (or npm/yarn)
- A Google Gemini API key

## Setup and Installation

### 1. Clone the Repository

```bash
git clone <https://github.com/karankr2003/ai-slides-generator.git>
cd ai-slides
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project and add your Google Gemini API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"
```

> **Note:** You can get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### 4. Run the Development Server

```bash
pnpm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

## How to Use

### 1. Generate a Presentation

- **Use the Input Bar**: Type a topic for your presentation (e.g., "The Future of Artificial Intelligence") and press Enter or click the send button.
- **Use a Template**: Click on one of the predefined templates to populate the input with a sample prompt, then generate.

### 2. Preview and Navigate

- Once generated, the presentation preview will appear.
- Use the **Previous** and **Next** buttons or the thumbnail strip at the bottom to navigate between slides.
- You can **directly edit** the title and content of each slide by clicking on the text fields in the preview.

### 3. Edit with AI

- Use the **edit prompt** input box below the slide preview to request changes.
- For example, you can ask the AI to: "Make the tone more professional," "add a slide about the ethics of AI," or "simplify the content on slide 4."
- The AI will regenerate the presentation based on your feedback.

### 4. Download

- Click the **PPTX** or **PDF** buttons at the top of the preview to download the presentation in your desired format.

## Project Structure

```
ai-slides/
├── app/
│   ├── (dashboard)/       # Main application routes
│   │   └── ai-slide/      # The AI presentation generator page
│   └── api/
│       └── generate-ppt/  # API route for PPTX and PDF generation
├── components/
│   ├── views/             # Main view components (e.g., ai-slide)
│   ├── ui/                # Reusable UI elements from shadcn/ui
│   └── slide-preview.tsx  # Component for previewing and editing slides
├── lib/
│   ├── gemini-service.ts  # Handles all communication with the Gemini AI
│   └── ppt-service.ts     # Client-side service to trigger presentation generation
└── ...
```

## Assumptions Made

- The primary goal was to build a functional prototype demonstrating the core requirements.
- The UI is designed to be simple and intuitive, inspired by modern AI applications.
- The AI prompts are structured to ensure a consistent JSON output for slide generation.
- Direct text editing in the preview is handled locally, while prompt-based edits make a new call to the AI.
- PDF generation is handled by converting the slide content to HTML and then using Puppeteer to create a PDF.

## License

This project is licensed under the MIT License.

