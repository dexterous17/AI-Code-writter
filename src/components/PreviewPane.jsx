/*
 * PreviewPane renders the live React output alongside runtime and type errors
 * using react-live so users can see generated components in action instantly.
 */
import React, { useMemo } from 'react';
import { LiveProvider, LivePreview } from 'react-live';
import ErrorDrawer from './ErrorDrawer.jsx';

// The preview expects code that ends with a JSX element, e.g. <Demo />
// The scope provides React so user code can call React.useState, etc.
function PreviewPane({ code, markers }) {
  const scope = useMemo(() => ({ React }), []);
  return (
    <div className="preview-root">
      <LiveProvider code={code} scope={scope} noInline>
        <div className="preview-surface">
          <LivePreview />
        </div>
        <ErrorDrawer markers={markers} />
      </LiveProvider>
    </div>
  );
}

export default React.memo(PreviewPane);
