/*
 * Hook responsible for managing chat history entries, diff modal state,
 * and automatic scrolling for the chat feed shared across the playground UI.
 */
import { useEffect, useRef, useState } from 'react';

export default function useChatManager() {
  const [chatHistory, setChatHistory] = useState([]);
  const [diffEntry, setDiffEntry] = useState(null);
  const chatStreamRef = useRef(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const node = chatStreamRef.current;
    if (!node) return undefined;

    const updateStickiness = () => {
      const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 56;
    };

    node.addEventListener('scroll', updateStickiness, { passive: true });

    return () => {
      node.removeEventListener('scroll', updateStickiness);
    };
  }, []);

  useEffect(() => {
    const node = chatStreamRef.current;
    if (!node) return;

    if (stickToBottomRef.current) {
      node.scrollTop = node.scrollHeight;
      stickToBottomRef.current = true;
    }
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
