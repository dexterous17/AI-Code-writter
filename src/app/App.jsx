/*
 * App wires together the Monaco editor, live preview, and AI assistant tabs
 * to provide a playground where prompts generate runnable React examples.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import EditorPane from '../features/editor/components/EditorPane.jsx';
import PreviewPane from '../features/preview/components/PreviewPane.jsx';
import ChatPane from '../features/chat/components/ChatPane.jsx';
import SettingsModal from '../features/settings/components/SettingsModal.jsx';
import CodeDiffModal from '../features/chat/components/CodeDiffModal.jsx';
import VersionTimeline from '../features/history/components/VersionTimeline.jsx';
import { ToastProvider, useToast } from '../shared/components/ToastProvider.jsx';
import { generateCodeWithOpenAI } from '../features/codeGeneration/lib/ai.js';
import { summarizeCodeChange } from '../features/codeGeneration/lib/codeSummary.js';
import useChatManager from '../features/chat/hooks/useChatManager.js';
import useVersionHistory from '../features/history/hooks/useVersionHistory.js';

const initialCode = '';
const EMPTY_PREVIEW = 'render(null);';

function AppInner() {
  const [code, setCode] = useState(initialCode);
  const [previewCode, setPreviewCode] = useState(EMPTY_PREVIEW);
  const [prompt, setPrompt] = useState('');
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
    recordNotice,
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
  const [hoveredSnippetRange, setHoveredSnippetRange] = useState(null);
  const promptInputRef = useRef(null);

  const {
    versions,
    currentVersionId,
    addSnapshotsForEntry,
    restoreVersion,
    getRecentSummaries,
  } = useVersionHistory();
  const [versionSortOrder, setVersionSortOrder] = useState('desc');

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
    const currentCode = code.trim();
    const goalPrompt = composedPrompt || (pendingImage ? 'Use the attached image as guidance to improve the component.' : '');

    const recentHistory = getRecentSummaries(3);
    const historyBlock = recentHistory.length
      ? recentHistory
        .map((version) => {
          const timeStamp = new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `- ${timeStamp}: ${version.summary || version.label || 'Snapshot'}`;
        })
        .join('\n')
      : '';

    const promptSections = [];
    if (currentCode) {
      promptSections.push([
        'Existing code (do not rewrite unrelated parts):',
        '```jsx',
        currentCode,
        '```',
      ].join('\n'));
    }
    if (historyBlock) {
      promptSections.push(`Recent changes:\n${historyBlock}`);
    }
    if (goalPrompt) {
      promptSections.push([
        'Please apply the following update while preserving existing structure where possible:',
        goalPrompt,
      ].join('\n'));
    }

    const finalPrompt = promptSections.filter(Boolean).join('\n\n');

    if (!finalPrompt) {
      toast.error('Nothing to send to the AI. Add a prompt or attach an image.');
      return;
    }

    const baseEntry = {
      id: Date.now(),
      prompt: finalPrompt,
      promptMessage: prompt,
      promptSnippets: promptSnippets.map((snippet) => ({ ...snippet })),
      timestamp: new Date().toISOString(),
      attachments: pendingImage ? [pendingImage] : [],
    };
    setAiLoading(true);
    try {
      const aiCode = await generateCodeWithOpenAI({ prompt: finalPrompt, apiKey: key, image: pendingImage });
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
      addSnapshotsForEntry({ entryId: baseEntry.id, previousCode, nextCode: aiCode, summary });
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

  const handleAddSelectionToPrompt = useCallback((selectionPayload) => {
    if (!selectionPayload) return;
    const { text: rawText, range } = typeof selectionPayload === 'string'
      ? { text: selectionPayload, range: null }
      : selectionPayload;
    const snippetText = (rawText ?? '').trimEnd();
    if (!snippetText) return;
    const normalizedRange = range
      ? {
        startLineNumber: range.startLineNumber,
        startColumn: range.startColumn,
        endLineNumber: range.endLineNumber,
        endColumn: range.endColumn,
      }
      : null;
    setActivePreviewTab('chat');
    setPromptSnippets((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: snippetText,
        range: normalizedRange,
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

  const handleSnippetHover = useCallback((snippet) => {
    if (!snippet) {
      setHoveredSnippetRange(null);
      return;
    }

    const normalizeText = (value) => (value ?? '').replace(/\r\n/g, '\n');
    const toNumber = (value) => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const normalizedSnippetText = normalizeText(snippet.text);
    if (!normalizedSnippetText) {
      setHoveredSnippetRange(null);
      return;
    }

    const source = normalizeText(code);

    const positionToIndex = (lineNumber, column) => {
      if (lineNumber == null || column == null || lineNumber < 1 || column < 1) return null;
      let currentLine = 1;
      let currentColumn = 1;
      for (let i = 0; i < source.length; i += 1) {
        if (currentLine === lineNumber && currentColumn === column) return i;
        const ch = source[i];
        if (ch === '\n') {
          currentLine += 1;
          currentColumn = 1;
        } else {
          currentColumn += 1;
        }
      }
      if (currentLine === lineNumber && currentColumn === column) return source.length;
      return null;
    };

    const indexToPosition = (index) => {
      if (index == null || index < 0 || index > source.length) return null;
      let lineNumber = 1;
      let column = 1;
      for (let i = 0; i < index; i += 1) {
        if (source[i] === '\n') {
          lineNumber += 1;
          column = 1;
        } else {
          column += 1;
        }
      }
      return { lineNumber, column };
    };

    const extractRangeText = (range) => {
      const startIndex = positionToIndex(range.startLineNumber, range.startColumn);
      const endIndex = positionToIndex(range.endLineNumber, range.endColumn);
      if (startIndex == null || endIndex == null || endIndex <= startIndex) {
        return null;
      }
      return source.slice(startIndex, endIndex);
    };

    const sanitizeRange = (rawRange) => {
      if (!rawRange) return null;
      const startLineNumber = toNumber(rawRange.startLineNumber);
      const startColumn = toNumber(rawRange.startColumn);
      const endLineNumber = toNumber(rawRange.endLineNumber);
      const endColumn = toNumber(rawRange.endColumn);
      if ([startLineNumber, startColumn, endLineNumber, endColumn].some((value) => !value)) {
        return null;
      }
      return { startLineNumber, startColumn, endLineNumber, endColumn };
    };

    let resolvedRange = null;
    const storedRange = sanitizeRange(snippet.range);
    if (storedRange) {
      const rangeText = extractRangeText(storedRange);
      if (rangeText && rangeText.trimEnd() === normalizedSnippetText) {
        resolvedRange = storedRange;
      }
    }

    const buildRangeFromIndex = (matchIndex) => {
      if (matchIndex === -1) return null;
      const startPosition = indexToPosition(matchIndex);
      const endPosition = indexToPosition(matchIndex + normalizedSnippetText.length);
      if (!startPosition || !endPosition) return null;
      return {
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column,
      };
    };

    if (!resolvedRange && storedRange) {
      const approxStartIndex = positionToIndex(storedRange.startLineNumber, storedRange.startColumn);
      if (approxStartIndex != null) {
        const lookBack = Math.max(0, approxStartIndex - 2000);
        const targetedIndex = source.indexOf(normalizedSnippetText, lookBack);
        if (targetedIndex !== -1) {
          const candidate = buildRangeFromIndex(targetedIndex);
          if (candidate) {
            resolvedRange = candidate;
          }
        }
      }
    }

    if (!resolvedRange) {
      const matchIndex = source.indexOf(normalizedSnippetText);
      const candidate = buildRangeFromIndex(matchIndex);
      if (candidate) {
        resolvedRange = candidate;
      }
    }

    setHoveredSnippetRange(resolvedRange || null);
  }, [code]);

  const handleRestoreVersion = useCallback((versionId) => {
    const version = restoreVersion(versionId);
    if (!version) return;
    setCode(version.code);
    updatePreview(version.code);
    recordNotice(`Restored editor to snapshot from ${new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }, [restoreVersion, updatePreview, recordNotice]);

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
              highlightRange={hoveredSnippetRange}
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
              <button
                type="button"
                className={clsx('pane-tab', activePreviewTab === 'versions' && 'active')}
                onClick={() => setActivePreviewTab('versions')}
              >
                Code Versions
              </button>
            </div>
          </div>
          <div className="pane-content">
            {activePreviewTab === 'preview' && (
              <PreviewPane code={previewCode} markers={markers} />
            )}
            {activePreviewTab === 'chat' && (
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
                onSnippetHover={handleSnippetHover}
              />
            )}
            {activePreviewTab === 'versions' && (
              <div className="versions-pane">
                <VersionTimeline
                  versions={versions}
                  currentVersionId={currentVersionId}
                  onRestore={handleRestoreVersion}
                  sortOrder={versionSortOrder}
                  onChangeSort={setVersionSortOrder}
                />
                {!versions.length && (
                  <p className="versions-empty">No versions captured yet. Generate code to start building history.</p>
                )}
              </div>
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
