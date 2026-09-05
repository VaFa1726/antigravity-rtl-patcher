(function() {
  console.log('🚀 AGY RTL Engine Initialized');

  // Regex to detect RTL characters (Arabic, Persian, Hebrew)
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

  function isRTL(text) {
    // Basic heuristic: check if any RTL char exists
    return rtlRegex.test(text);
  }

  function applyRTL(element) {
    // Only process text nodes or direct containers
    const textContent = element.textContent || element.innerText || '';
    
    if (isRTL(textContent)) {
      element.setAttribute('data-agy-rtl', 'true');
      element.style.direction = 'rtl';
      element.style.textAlign = 'start';
      
      // Crucial for mixed English/Farsi content (like code snippets in Farsi text)
      element.style.unicodeBidi = 'plaintext'; 
      
      // Mark as processed
      element.classList.add('agy-rtl-processed');
    }
  }

  // Observe DOM mutations for dynamically added chat messages
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Apply logic to the node itself if it has text
            if (node.textContent && node.textContent.trim().length > 0) {
              // We should probably target specific chat bubble selectors here if we knew them.
              // For a generic approach, we look for paragraphs or divs with raw text.
              const elementsToScan = node.querySelectorAll('p, span, div.message-content, div.chat-bubble, li, h1, h2, h3');
              elementsToScan.forEach(el => {
                if (!el.classList.contains('agy-rtl-processed')) {
                  applyRTL(el);
                }
              });
              
              // Also check the root node added
              if (!node.classList.contains('agy-rtl-processed')) {
                 applyRTL(node);
              }
            }
          }
        });
      }
    });
  });

  // Start observing
  window.addEventListener('load', () => {
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
    
    // Initial scan
    document.querySelectorAll('p, span, div, li, h1, h2, h3').forEach(el => {
      if (el.textContent && el.textContent.trim().length > 0 && !el.children.length) {
         applyRTL(el);
      }
    });
  });

})();
