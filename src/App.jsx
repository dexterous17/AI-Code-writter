/*
 * App wires together the Monaco editor, live preview, and AI assistant tabs
 * to provide a playground where prompts generate runnable React examples.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import EditorPane from './components/EditorPane.jsx';
import PreviewPane from './components/PreviewPane.jsx';
import ChatPane from './components/ChatPane.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import CodeDiffModal from './components/CodeDiffModal.jsx';
import { ToastProvider, useToast } from './components/ToastProvider.jsx';
import { generateCodeWithOpenAI } from './lib/ai.js';
import { summarizeCodeChange } from './lib/codeSummary.js';
import useChatManager from './hooks/useChatManager.js';

const initialCode = '';
const EMPTY_PREVIEW = 'render(null);';

function AppInner() {
  const [code, setCode] = useState(initialCode);
  const [previewCode, setPreviewCode] = useState(EMPTY_PREVIEW);
  const [prompt, setPrompt] = useState('create a primary button with counter');
  const [pendingImage, setPendingImage] = useState(null);
  const [dark, setDark] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY || '';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('preview');
  const {
    chatHistory,
    recordSuccess,
    recordError,
    chatStreamRef,
    diffEntry,
    openDiff,
    closeDiff,
  } = useChatManager();

  const [autoRun, setAutoRun] = useState(() => {
    const v = localStorage.getItem('auto_run');
    return v ? v === '1' : true;
  });
  const [markers, setMarkers] = useState([]);
  const [promptSnippets, setPromptSnippets] = useState([]);
  const promptInputRef = useRef(null);

  React.useEffect(() => { localStorage.setItem('auto_run', autoRun ? '1' : '0'); }, [autoRun]);

  const updatePreview = useCallback((nextCode) => {
    const output = nextCode.trim() ? nextCode : EMPTY_PREVIEW;
    setPreviewCode(output);
  }, []);

  React.useEffect(() => {
    if (!autoRun) return;
    const t = setTimeout(() => updatePreview(code), 300);
    return () => clearTimeout(t);
  }, [code, autoRun, updatePreview]);

  const toast = useToast();

  const handleAttachImage = useCallback(async (file) => {
    if (!file) {
      setPendingImage(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported right now');
      return;
    }
    const limitMb = 5;
    if (file.size > limitMb * 1024 * 1024) {
      toast.error(`Image must be smaller than ${limitMb}MB`);
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
    setPendingImage({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
    });
  }, [toast]);

  const clearPendingImage = useCallback(() => setPendingImage(null), []);

  const formatSnippetBlock = useCallback((text) => {
    const trimmed = text.trimEnd();
    if (!trimmed) return '';
    return trimmed
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n');
  }, []);

  const composePromptText = useCallback((message) => {
    const snippetBlocks = promptSnippets
      .map((snippet) => formatSnippetBlock(snippet.text))
      .filter(Boolean);
    const snippetsSection = snippetBlocks.join('\n\n');
    const trimmedMessage = message?.trim() ?? '';

    if (snippetsSection && trimmedMessage) {
      return `${snippetsSection}\n\n${trimmedMessage}`;
    }
    if (snippetsSection) return snippetsSection;
    return trimmedMessage;
  }, [formatSnippetBlock, promptSnippets]);

  const handleAIGenerate = async () => {
    const composedPrompt = composePromptText(prompt);
    if (!composedPrompt && !pendingImage) {
      toast.error('Describe the component you want or attach an image first');
      return;
    }
    const key = apiKey?.trim();
    if (!key) {
      toast.error('OpenAI API key not added');
      return;
    }
    const previousCode = code;
    const baseEntry = {
      id: Date.now(),
      prompt: composedPrompt,
      promptMessage: prompt,
      promptSnippets: promptSnippets.map((snippet) => ({ ...snippet })),
      timestamp: new Date().toISOString(),
      attachments: pendingImage ? [pendingImage] : [],
    };
    setAiLoading(true);
    try {
      const aiCode = await generateCodeWithOpenAI({ prompt: composedPrompt, apiKey: key, image: pendingImage });
      setCode(aiCode);
      if (autoRun) updatePreview(aiCode);
      setActivePreviewTab('preview');
      const summary = summarizeCodeChange(previousCode, aiCode);
      recordSuccess({
        ...baseEntry,
        responseCode: aiCode,
        previousCode,
        summary,
      });
      toast.success('AI code generated');
      setPrompt('');
      setPromptSnippets([]);
    } catch (err) {
      console.error(err);
      const msg = err?.message || 'AI generation failed';
      toast.error(msg);
      recordError({
        ...baseEntry,
        error: msg,
      });
    } finally {
      setAiLoading(false);
      clearPendingImage();
    }
  };

  const handleAddSelectionToPrompt = useCallback((selectionText) => {
    if (!selectionText) return;
    setActivePreviewTab('chat');
    const snippet = selectionText.trimEnd();
    if (!snippet) return;
    setPromptSnippets((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: snippet,
      },
    ]);
    requestAnimationFrame(() => {
      promptInputRef.current?.focus();
    });
    toast.success('Added selection to chat draft');
  }, [toast]);

  const handleRemoveSnippet = useCallback((snippetId) => {
    setPromptSnippets((prev) => prev.filter((snippet) => snippet.id !== snippetId));
  }, []);

  const appClass = useMemo(() => clsx('app', dark && 'dark'), [dark]);

  return (
    <div className={appClass}>
      <header className="topbar">
        <div className="brand">Monaco + Live Preview</div>
        <div className="actions">
          {!autoRun && (
            <button
              className="btn"
              onClick={() => updatePreview(code)}
              title="Run the code"
            >
              Run
            </button>
          )}
          <button className="btn" onClick={() => setSettingsOpen(true)}>Settings</button>
        </div>
      </header>

      <main className="main">
        <section className="pane pane-left">
          <div className="pane-header">Editor</div>
          <div className="pane-content">
            <EditorPane
              value={code}
              onChange={setCode}
              dark={dark}
              onMarkersChange={setMarkers}
              onAddSelectionToChat={handleAddSelectionToPrompt}
            />
          </div>
        </section>

        <section className="pane pane-right">
          <div className="pane-header">
            <div className="pane-tabs">
              <button
                type="button"
                className={clsx('pane-tab', activePreviewTab === 'preview' && 'active')}
                onClick={() => setActivePreviewTab('preview')}
              >
                Live Preview
              </button>
              <button
                type="button"
                className={clsx('pane-tab', activePreviewTab === 'chat' && 'active')}
                onClick={() => setActivePreviewTab('chat')}
              >
                AI Chat
              </button>
            </div>
          </div>
          <div className="pane-content">
            {activePreviewTab === 'preview' ? (
              <PreviewPane code={previewCode} markers={markers} />
            ) : (
              <ChatPane
                chatHistory={chatHistory}
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleAIGenerate}
                aiLoading={aiLoading}
                onOpenDiff={openDiff}
                chatStreamRef={chatStreamRef}
                pendingImage={pendingImage}
                onAttachImage={handleAttachImage}
                onRemoveImage={clearPendingImage}
                promptSnippets={promptSnippets}
                onRemoveSnippet={handleRemoveSnippet}
                inputRef={promptInputRef}
              />
            )}
          </div>
        </section>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        dark={dark}
        setDark={setDark}
        apiKey={apiKey}
        setApiKey={setApiKey}
        autoRun={autoRun}
        setAutoRun={setAutoRun}
      />
      <CodeDiffModal entry={diffEntry} onClose={closeDiff} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
