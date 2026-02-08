console.log("Gemini Shortcut: Content script loaded on " + window.location.hostname);

// --- PART 1: GEMINI-ONLY LOGIC ---
if (window.location.hostname === "gemini.google.com") {
    const urlParams = new URLSearchParams(window.location.search);
    const promptText = urlParams.get('q');
    const shouldSubmit = urlParams.get('autosubmit') === 'true';

    if (promptText) {
        const interval = setInterval(() => {
            const inputBox = document.querySelector('div[contenteditable="true"], textarea');
            if (inputBox) {
                clearInterval(interval);
                inputBox.focus();
                document.execCommand('insertText', false, decodeURIComponent(promptText));
                if (shouldSubmit) {
                    setTimeout(() => {
                        const sendButton = document.querySelector('button[aria-label="Send message"]');
                        if (sendButton) sendButton.click();
                    }, 600);
                }
            }
        }, 500);
    }
}

// --- PART 2: THE FLOATING BUTTON (With Shadow DOM) ---
else {
    // Ensure we don't inject twice and that body exists
    if (document.body && !document.getElementById('gemini-extension-host')) {
        const host = document.createElement('div');
        host.id = 'gemini-extension-host';
        host.style.all = 'initial'; // Reset inherited styles
        document.body.appendChild(host);
        const shadow = host.attachShadow({mode: 'open'}); // 'open' makes debugging easier

        const floatingButton = document.createElement('div');
    floatingButton.id = 'gemini-floating-button';
    floatingButton.innerText = 'G';
    
    const style = document.createElement('style');
    style.textContent = `
        #gemini-floating-button {
            position: fixed;
            width: 40px; height: 40px;
            background: #4285f4; color: white;
            border-radius: 50%; display: none;
            align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            z-index: 2147483647; font-family: sans-serif;
            font-weight: bold; border: 2px solid white;
            user-select: none;
        }
        #gemini-floating-button:hover { background: #3367d6; transform: scale(1.05); }
    `;
    
    shadow.appendChild(style);
    shadow.appendChild(floatingButton);

    let currentSelection = '';

    // Listen for mouseup to show button
    document.addEventListener('mouseup', (e) => {
        // Delay slightly to allow selection to finalize
        setTimeout(() => {
            const selection = window.getSelection().toString().trim();
            if (selection.length > 3) {
                console.log("Gemini Shortcut: Text selected, showing button at", e.clientX, e.clientY);
                currentSelection = selection;
                floatingButton.style.left = `${e.clientX + 10}px`;
                floatingButton.style.top = `${e.clientY + 10}px`;
                floatingButton.style.display = 'flex';
            } else {
                // If selection is cleared or too short, hide button (optional, but good UX)
                // We might not want to hide immediately if they just clicked the button, 
                // but this runs on mouseup anywhere.
                // If the user selects, then clicks the button, mouseup happens on button click?
                // No, button click is mousedown -> mouseup.
            }
        }, 10);
    });

    // Prevent button click from being treated as a 'click outside'
    floatingButton.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    // Hide button if we click anywhere else
    document.addEventListener('mousedown', (e) => {
        // If the click is not on our host element, hide button
        if (e.target !== host) {
            floatingButton.style.display = 'none';
        }
    });

    floatingButton.addEventListener('click', (e) => {
        console.log("Gemini Shortcut: Floating button clicked!");
        e.stopPropagation(); // Prevent the mousedown listener from firing
        if (currentSelection) {
            const url = `https://gemini.google.com/app?q=Summarize this: ${encodeURIComponent(currentSelection)}&autosubmit=true`;
            window.open(url, '_blank');
        }
    });
  } // Closing the if check
} // Closing the else block