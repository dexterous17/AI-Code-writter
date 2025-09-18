# Monaco + Live Preview Playground

A minimal React + Vite codebase featuring:

- Monaco editor via `@monaco-editor/react`
- Live React preview via `react-live`
- A simple prompt-to-code generator for quick component scaffolding
 - Optional: AI generation via OpenAI (client-side)

## Quick start

1. Install dependencies

   npm install

2. Start the dev server

   npm run dev

3. Open the app (Vite prints the local URL, typically http://localhost:5173)

## How it works

- Editor: Monaco provides the coding surface with JSX/JS support.
- Preview: `react-live` evaluates the code with `noInline` mode; define components and finish by calling `render(<MyComponent />);`.
- Generator: Type a plain-English prompt (e.g., "make a card" or "build a modal"). The built-in heuristic returns a ready-to-edit component.
- AI Generator (optional): Enter your OpenAI API key in the top bar or set `VITE_OPENAI_API_KEY` in a `.env.local` file. Click "AI Generate" to ask the model to produce code that obeys the playground constraints.
 - Run control: Configure Auto-run in Settings. When Auto-run is off, use the Run button in the top bar.

## Notes

- The generator is intentionally simple and keyword-driven (button, card, list, form, modal, table). Extend `src/lib/generator.js` to handle more cases.
- AI generation runs from the browser via `fetch` to OpenAI's API. Your key is stored locally in `localStorage` only. In production, route calls through your own server instead.
- Avoid using `import` statements inside the editor. `react-live` evaluates code directly with `React` in scope. Define functions/components in place and finish with `render(<YourComponent />);`.
- Toggle light/dark theme in Settings. Preview runs independent of theme.

## Where to look

- `src/App.jsx`: App shell and layout.
- `src/components/EditorPane.jsx`: Monaco configuration.
- `src/components/PreviewPane.jsx`: `react-live` preview and error surface.
- `src/components/PromptBar.jsx`: Prompt input and generate button.
- `src/lib/generator.js`: Prompt-to-code templates.
- `src/lib/ai.js`: OpenAI client used by the AI generator.
