import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for "Uncaught SyntaxError: "undefined" is not valid JSON"
// This error occurs when JSON.parse(undefined) or JSON.parse("undefined") is called.
(function() {
  const originalParse = JSON.parse;
  JSON.parse = function(text, reviver) {
    if (text === undefined || text === "undefined" || text === null) {
      return null;
    }
    try {
      return originalParse(text, reviver);
    } catch (e) {
      // If it's a string that looks like it might be undefined but isn't quite, return null
      if (typeof text === 'string' && (text.trim() === '' || text.trim() === 'undefined')) {
        return null;
      }
      throw e;
    }
  };
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
