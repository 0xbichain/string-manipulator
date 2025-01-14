// Tambahkan style untuk tombol menggunakan Tailwind
document.querySelectorAll('.transform-btn').forEach(button => {
    button.classList.add(
        'bg-indigo-500',
        'hover:bg-indigo-600',
        'text-white',
        'font-semibold',
        'py-2',
        'px-4',
        'rounded-lg',
        'transition-colors',
        'duration-200'
    );
});

// Style untuk tab buttons
document.querySelectorAll('.tab-btn').forEach(button => {
    button.classList.add(
        'px-4',
        'py-2',
        'text-gray-600',
        'hover:text-indigo-600',
        'focus:outline-none',
        'border-b-2',
        'border-transparent',
        'hover:border-indigo-600'
    );
});

function transformText(type) {
    const input = document.getElementById('inputText').value;
    const output = document.getElementById('outputText');
    let result = '';

    switch (type) {
        case 'uppercase':
            result = input.toUpperCase();
            break;
        case 'lowercase':
            result = input.toLowerCase();
            break;
        case 'capitalize':
            result = input.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            break;
        case 'reverse':
            result = input.split('').reverse().join('');
            break;
        case 'removeSpaces':
            result = input.replace(/\s+/g, '');
            break;
        case 'countChars':
            result = `Total karakter: ${input.length}`;
            break;
    }

    // Update output dan langsung copy
    output.innerHTML = result;
    copyToClipboard(result);
}

// Fungsi untuk copy ke clipboard
async function copyToClipboard(text) {
    try {
        const textToCopy = text || document.getElementById('outputText').innerText;
        await navigator.clipboard.writeText(textToCopy);
        showNotification('Teks berhasil disalin ke clipboard!');
    } catch (err) {
        showNotification('Gagal menyalin teks ke clipboard', true);
    }
}

// Fungsi untuk clear text
function clearText() {
    document.getElementById('inputText').value = '';
    document.getElementById('outputText').innerHTML = '';
}

// Fungsi untuk replace text
function replaceText() {
    const input = document.getElementById('inputText').value;
    const searchText = document.getElementById('searchText').value.trim();
    const replaceText = document.getElementById('replaceText').value;
    const replaceMode = document.querySelector('input[name="replaceMode"]:checked').value;
    const output = document.getElementById('outputText');
    
    if (!searchText) {
        showNotification('Masukkan teks yang ingin diganti!', true);
        return;
    }

    let result = '';
    
    if (replaceMode === 'word') {
        // Replace kata saja
        const regex = new RegExp(escapeRegExp(searchText), 'gi');
        result = input.replace(regex, replaceText);
    } else if (replaceMode === 'sentence') {
        // Pisahkan input menjadi array kata-kata
        const words = input.split(' ');
        const resultWords = [];
        let skipUntilSpace = false;

        for (let i = 0; i < words.length; i++) {
            // Jika kata mengandung searchText
            if (words[i].toLowerCase().includes(searchText.toLowerCase())) {
                skipUntilSpace = true;
                continue;
            }

            // Jika menemukan kata 'itu', 'ya', atau 'kak', simpan kata-kata tersebut
            if (words[i].match(/^(itu|ya|kak)$/i)) {
                resultWords.push(words[i]);
                skipUntilSpace = false;
            } else if (!skipUntilSpace) {
                resultWords.push(words[i]);
            }
        }

        result = resultWords.join(' ');
    }
    
    result = result || 'itu ya kak';
    
    // Update output saja
    output.innerHTML = result;
}

// Update variabel typoRules untuk menggunakan localStorage
let typoRules = JSON.parse(localStorage.getItem('typoRules')) || {
    'yg': 'yang',
    'dgn': 'dengan',
    'krn': 'karena',
    'tdk': 'tidak',
    'sy': 'saya'
};

// Fungsi untuk menyimpan rules ke localStorage
function saveRulesToStorage() {
    localStorage.setItem('typoRules', JSON.stringify(typoRules));
}

// Update fungsi addTypoRule
function addTypoRule() {
    const typoWord = document.getElementById('typoWord').value.trim();
    const correction = document.getElementById('typoCorrection').value.trim();
    
    if (!typoWord || !correction) {
        showNotification('Mohon isi kedua field!', true);
        return;
    }
    
    typoRules[typoWord] = correction;
    saveRulesToStorage(); // Simpan ke localStorage
    updateTypoRulesList();
    
    // Reset input fields
    document.getElementById('typoWord').value = '';
    document.getElementById('typoCorrection').value = '';
    
    autoReplace();
    showNotification('Rule berhasil ditambahkan!');
}

// Update fungsi deleteTypoRule
function deleteTypoRule(word) {
    delete typoRules[word];
    saveRulesToStorage(); // Simpan ke localStorage
    updateTypoRulesList();
    autoReplace();
    showNotification('Rule berhasil dihapus!');
}

// Fungsi untuk export rules
function exportRules() {
    const rulesJson = JSON.stringify(typoRules, null, 2);
    const blob = new Blob([rulesJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typo-rules.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Rules berhasil di-export!');
}

// Tambahkan fungsi untuk menangani modal
function showConfirmModal(onConfirm) {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmImport');
    const cancelBtn = document.getElementById('cancelImport');

    // Tampilkan modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Handle konfirmasi
    const handleConfirm = () => {
        onConfirm();
        closeModal();
    };

    // Handle batal
    const handleCancel = () => {
        closeModal();
    };

    // Tambahkan event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    // Fungsi untuk menutup modal
    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        // Hapus event listeners
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    }
}

// Update fungsi importRules
function importRules(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedRules = JSON.parse(e.target.result);
            
            // Tampilkan custom modal konfirmasi
            showConfirmModal(() => {
                typoRules = importedRules;
                saveRulesToStorage();
                updateTypoRulesList();
                autoReplace();
                showNotification('Rules berhasil di-import!');
            });
        } catch (error) {
            showNotification('File tidak valid!', true);
        }
    };
    reader.readAsText(file);
    
    // Reset input file
    event.target.value = '';
}

// Fungsi untuk update tampilan daftar rules
function updateTypoRulesList() {
    const container = document.getElementById('typoRulesList');
    container.innerHTML = '';
    
    Object.entries(typoRules).forEach(([word, correction]) => {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'flex justify-between items-center bg-white p-2 rounded border';
        ruleDiv.innerHTML = `
            <span class="text-sm">${word} → ${correction}</span>
            <button onclick="deleteTypoRule('${word}')" 
                    class="text-red-500 hover:text-red-700 text-sm">
                Hapus
            </button>
        `;
        container.appendChild(ruleDiv);
    });
}

// Update fungsi autoReplace
function autoReplace() {
    const input = document.getElementById('inputText').value;
    const output = document.getElementById('outputText');
    let text = input;

    // Terapkan typo rules
    Object.entries(typoRules).forEach(([typo, correction]) => {
        const regex = new RegExp(`\\b${escapeRegExp(typo)}\\b`, 'gi');
        text = text.replace(regex, correction);
    });

    // Update output saja
    output.innerHTML = text;
}

// Tambahkan event listener untuk input text
document.getElementById('inputText').addEventListener('input', function() {
    autoReplace();
});

// Update inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    // Load rules dari localStorage saat halaman dimuat
    typoRules = JSON.parse(localStorage.getItem('typoRules')) || typoRules;
    updateTypoRulesList();
    autoReplace();
});

// Helper function untuk escape regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, isError = false) {
    // Cek apakah sudah ada notifikasi
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg transition-opacity duration-300 ${
            isError ? 'bg-red-500' : 'bg-green-500'
        } text-white`;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hilangkan notifikasi setelah 3 detik
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Fungsi untuk switch tab
function switchTab(tabName) {
    // Sembunyikan semua konten tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Hapus class active dari semua tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-indigo-600', 'border-indigo-600');
    });
    
    // Tampilkan konten tab yang dipilih
    document.getElementById(tabName + 'Tools').classList.remove('hidden');
    
    // Aktifkan tab yang dipilih
    document.getElementById(tabName + 'Tab').classList.add('active', 'text-indigo-600', 'border-indigo-600');
}

// Hapus event listener lama yang mungkin mengganggu
const inputElement = document.getElementById('inputText');
const oldListeners = inputElement.getEventListeners && inputElement.getEventListeners()['input'];
if (oldListeners) {
    oldListeners.forEach(listener => {
        inputElement.removeEventListener('input', listener.listener);
    });
} 

// Tambah fungsi copyOutput untuk tombol Copy
function copyOutput() {
    const output = document.getElementById('outputText').innerText;
    copyToClipboard(output);
} 