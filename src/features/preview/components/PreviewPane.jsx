/*
 * PreviewPane renders the live React output alongside runtime and type errors
 * using react-live so users can see generated components in action instantly.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { LiveProvider, LivePreview } from 'react-live';
import ErrorDrawer from '../../errors/components/ErrorDrawer.jsx';
import PreviewModal from './PreviewModal.jsx';

// The preview expects code that ends with a JSX element, e.g. <Demo />
// The scope provides React so user code can call React.useState, etc.
function PreviewPane({ code, markers }) {
  const scope = useMemo(() => ({ React }), []);
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  return (
    <div className="preview-root">
      <button
        type="button"
        className="preview-expand-button"
        onClick={openModal}
        aria-label="Open preview in larger modal"
      >
        Expand
      </button>
      <LiveProvider code={code} scope={scope} noInline>
        <div className="preview-surface">
          <LivePreview />
        </div>
        <ErrorDrawer markers={markers} />
      </LiveProvider>
      <PreviewModal
        open={modalOpen}
        onClose={closeModal}
        code={code}
        markers={markers}
        scope={scope}
      />
    </div>
  );
}

export default React.memo(PreviewPane);
