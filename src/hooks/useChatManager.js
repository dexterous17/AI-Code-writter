/*
 * Hook responsible for managing chat history entries, diff modal state,
 * and automatic scrolling for the chat feed shared across the playground UI.
 */
import { useEffect, useRef, useState } from 'react';

export default function useChatManager() {
  const [chatHistory, setChatHistory] = useState([]);
  const [diffEntry, setDiffEntry] = useState(null);
  const chatStreamRef = useRef(null);

  useEffect(() => {
    const node = chatStreamRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chatHistory]);

  const recordSuccess = (entry) => {
    setChatHistory((history) => [...history, { ...entry, status: 'success' }]);
  };

  const recordError = (entry) => {
    setChatHistory((history) => [...history, { ...entry, status: 'error' }]);
  };

  const openDiff = (entry) => setDiffEntry(entry);
  const closeDiff = () => setDiffEntry(null);

  return {
    chatHistory,
    recordSuccess,
    recordError,
    chatStreamRef,
    diffEntry,
    openDiff,
    closeDiff,
  };
}
