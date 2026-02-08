document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('promptList');
    const nameInput = document.getElementById('promptName');
    const textInput = document.getElementById('promptText');
    const addButton = document.getElementById('addPrompt');

    // Load initial list
    chrome.storage.sync.get(['prompts'], (result) => {
        const prompts = result.prompts || {};
        renderList(prompts);
    });

    addButton.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const text = textInput.value.trim();

        if (!name || !text) {
            alert("Please enter both a Name and a Prompt!");
            return;
        }

        // Clean up ID (replace spaces with hyphens, lowercase)
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        chrome.storage.sync.get(['prompts'], (result) => {
            const prompts = result.prompts || {};
            
            // Check for duplicate ID (optional, simple check)
            if (prompts[id]) {
                if(!confirm(`Replace existing prompt "${name}"?`)) return;
            }

            prompts[id] = { name: name, text: text };

            chrome.storage.sync.set({ prompts: prompts }, () => {
                nameInput.value = '';
                textInput.value = '';
                renderList(prompts);
                
                // Notify background script (optional if background listens to storage.onChanged)
                // chrome.runtime.sendMessage({ action: "updateMenus" }); 
            });
        });
    });

    function renderList(prompts) {
        list.innerHTML = '';
        if (Object.keys(prompts).length === 0) {
            list.innerHTML = '<li style="text-align:center; color:#999;">No custom prompts yet. Add one!</li>';
            return;
        }

        for (const [id, promptData] of Object.entries(prompts)) {
            const li = document.createElement('li');
            
            const info = document.createElement('div');
            info.className = 'prompt-info';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'prompt-name';
            nameSpan.textContent = promptData.name; // Use stored name directly
            
            const detailSpan = document.createElement('span');
            detailSpan.className = 'prompt-detail';
            detailSpan.textContent = promptData.text; // Use stored text directly

            info.appendChild(nameSpan);
            info.appendChild(detailSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remove';
            deleteBtn.onclick = () => removePrompt(id);

            li.appendChild(info);
            li.appendChild(deleteBtn);
            list.appendChild(li);
        }
    }

    function removePrompt(id) {
        chrome.storage.sync.get(['prompts'], (result) => {
            const prompts = result.prompts || {};
            delete prompts[id];
            chrome.storage.sync.set({ prompts: prompts }, () => {
                renderList(prompts);
            });
        });
    }
});