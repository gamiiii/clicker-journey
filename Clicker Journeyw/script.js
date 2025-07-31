// script.js

// --- Game State Variables ---
// Definisi state awal game untuk pemain
let player = {
    name: "Player 1",
    score: 0,
    level: 1,
    rebirths: 0,
    pointsPerClick: 1,
    autoClickRate: 0, // Clicks per second (0 means off, 1 means 1 click/sec, etc.)
    vip: {
        active: false,
        multiplier: 1 // Default multiplier
    },
    upgrades: {
        doubleClickPass: false,
        megaClickPass: false,
        autoClickPass: false
    },
    gamepassCosts: {
        doubleClick: 100,
        megaClick: 500,
        autoClick: 1000
    },
    vipCost: 20000,
    lastAutoClickTime: Date.now() // Untuk mengelola waktu auto-click
};

// Persyaratan skor untuk naik level
const LEVEL_UP_REQUIREMENTS = [
    { level: 1, score: 0 },
    { level: 2, score: 100 },
    { level: 3, score: 300 },
    { level: 4, score: 700 },
    { level: 5, score: 1500 },
    { level: 6, score: 3000 },
    { level: 7, score: 5000 },
    { level: 8, score: 8000 },
    { level: 9, score: 12000 },
    { level: 10, score: 18000 },
    { level: 11, score: 25000 },
    { level: 12, score: 35000 },
    { level: 13, score: 50000 },
    { level: 14, score: 75000 },
    { level: 15, score: 100000 }
];

// Kata sandi untuk developer panel
const DEV_PASSWORD = 'dev';

// --- DOM Elements ---
// Mendapatkan referensi ke elemen-elemen HTML yang akan dimanipulasi
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const rebirthsDisplay = document.getElementById('rebirthsDisplay');
const clickButton = document.getElementById('clickButton');
const doubleClickPassBtn = document.getElementById('doubleClickPassBtn');
const megaClickPassBtn = document.getElementById('megaClickPassBtn');
const autoClickPassBtn = document.getElementById('autoClickPassBtn');
const toggleAutoClickBtn = document.getElementById('toggleAutoClickBtn');
const buyVipBtn = document.getElementById('buyVipBtn');
const vipCostDisplay = document.getElementById('vipCostDisplay');
const vipBonusDisplay = document.getElementById('vipBonusDisplay');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const playerCrownIcon = document.getElementById('playerCrownIcon');
const editProfileBtn = document.getElementById('editProfileBtn');
const rebirthButtonContainer = document.getElementById('rebirthButtonContainer');
const gameNotification = document.getElementById('gameNotification');
const notificationText = document.getElementById('notificationText');
const closeNotificationBtn = document.getElementById('closeNotificationBtn');
const scoreEffectContainer = document.getElementById('scoreEffectContainer');

// Elemen Developer Panel
const toggleDevPanelBtn = document.getElementById('toggleDevPanelBtn');
const developerPanel = document.getElementById('developerPanel');
const closeDevPanelBtn = document.getElementById('closeDevPanelBtn');
const devTargetUser = document.getElementById('devTargetUser');
const devGiftScore = document.getElementById('devGiftScore');
const devGiftLevel = document.getElementById('devGiftLevel');
const devGiftRebirths = document.getElementById('devGiftRebirths');
const devGiftScoreBtn = document.getElementById('devGiftScoreBtn');
const devGiftLevelBtn = document.getElementById('devGiftLevelBtn');
const devGiftRebirthsBtn = document.getElementById('devGiftRebirthsBtn');
const devGiftDoubleClick = document.getElementById('devGiftDoubleClick');
const devGiftMegaClick = document.getElementById('devGiftMegaClick');
const devGiftAutoClick = document.getElementById('devGiftAutoClick');
const devGiftVip = document.getElementById('devGiftVip');
const devMessage = document.getElementById('devMessage');
const devSendMessageBtn = document.getElementById('devSendMessageBtn');
const devResetGame = document.getElementById('devResetGame');
const devSaveGame = document.getElementById('devSaveGame');
const devLoadGame = document.getElementById('devLoadGame');


// --- Utility Functions ---

/**
 * Memformat angka dengan koma sebagai pemisah ribuan.
 * @param {number} num
 * @returns {string} Angka yang diformat.
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Mendapatkan persyaratan skor untuk level tertentu.
 * @param {number} level
 * @returns {number} Skor yang dibutuhkan untuk level tersebut, atau Infinity jika tidak ditemukan.
 */
function getLevelUpRequirement(level) {
    const found = LEVEL_UP_REQUIREMENTS.find(req => req.level === level);
    return found ? found.score : Infinity;
}

/**
 * Menghitung level pemain berdasarkan skor saat ini.
 * @param {number} score
 * @returns {number} Level pemain.
 */
function getLevelFromScore(score) {
    let currentLevel = 1;
    for (let i = LEVEL_UP_REQUIREMENTS.length - 1; i >= 0; i--) {
        if (score >= LEVEL_UP_REQUIREMENTS[i].score) {
            currentLevel = LEVEL_UP_REQUIREMENTS[i].level;
            break;
        }
    }
    return currentLevel;
}

// --- Game Logic Functions ---

/**
 * Menghitung ulang poin per klik berdasarkan upgrade, VIP, dan rebirth.
 */
function calculatePointsPerClick() {
    let basePoints = 1;
    if (player.upgrades.doubleClickPass) {
        basePoints *= 2;
    }
    if (player.upgrades.megaClickPass) {
        basePoints *= 5;
    }
    if (player.vip.active) {
        basePoints *= player.vip.multiplier;
    }
    basePoints *= (1 + player.rebirths * 0.1); // Setiap rebirth memberikan +10% skor
    player.pointsPerClick = Math.ceil(basePoints); // Bulatkan ke atas
}

/**
 * Menambahkan skor ke pemain dan memicu efek visual, level up, dan update UI.
 * @param {number} amount
 */
function updateScore(amount) {
    player.score += amount;
    // Tampilkan efek skor mengambang
    const clickRect = clickButton.getBoundingClientRect();
    const x = clickRect.left + clickRect.width / 2;
    const y = clickRect.top + clickRect.height / 2;
    displayScoreEffect(amount, x, y);

    checkLevelUp();
    updateUI();
    saveGame(); // Otomatis menyimpan game setelah setiap update skor
}

/**
 * Memeriksa apakah pemain memenuhi syarat untuk naik level.
 */
function checkLevelUp() {
    const newLevel = getLevelFromScore(player.score);
    if (newLevel > player.level) {
        player.level = newLevel;
        showNotification(`Selamat! Anda naik ke Level ${player.level}!`, 4000, 'success');
    }
}

/**
 * Menerapkan upgrade gamepass yang dibeli.
 * @param {string} upgradeName Nama upgrade (misal: 'doubleClickPass')
 */
function applyGamepassUpgrade(upgradeName) {
    player.upgrades[upgradeName] = true;
    calculatePointsPerClick();
    updateUI();
    saveGame();
}

/**
 * Membeli upgrade gamepass.
 * @param {string} upgradeType Tipe upgrade yang akan dibeli.
 */
function buyUpgrade(upgradeType) {
    const cost = player.gamepassCosts[upgradeType];
    if (player.score >= cost && !player.upgrades[upgradeType]) {
        player.score -= cost;
        applyGamepassUpgrade(upgradeType);
        showNotification(`${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1).replace('Pass', ' Pass')} dibeli!`, 2500, 'success');
    } else if (player.upgrades[upgradeType]) {
        showNotification(`${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1).replace('Pass', ' Pass')} sudah Anda miliki.`, 2500, 'info');
    } else {
        showNotification(`Skor tidak cukup untuk ${upgradeType.replace('Pass', ' Pass')}. Anda butuh ${formatNumber(cost)} Score.`, 2500, 'error');
    }
}

/**
 * Membeli keanggotaan VIP.
 */
function buyVipMembership() {
    if (player.score >= player.vipCost && !player.vip.active) {
        player.score -= player.vipCost;
        player.vip.active = true;
        player.vip.multiplier = 2; // VIP memberikan bonus skor x2
        calculatePointsPerClick();
        showNotification('Anda sekarang adalah anggota VIP! Bonus skor x2 aktif!', 5000, 'success');
        updateUI(); // Memastikan UI diperbarui setelah VIP aktif
        saveGame();
    } else if (player.vip.active) {
        showNotification('Anda sudah menjadi anggota VIP!', 2500, 'info');
    } else {
        showNotification(`Skor tidak cukup untuk membeli VIP Membership. Anda butuh ${formatNumber(player.vipCost)} Score.`, 2500, 'error');
    }
}

/**
 * Melakukan proses Rebirth.
 */
function rebirth() {
    const nextRebirthNum = player.rebirths + 1;
    const rebirthBaseScore = 50000;
    const scoreMultiplierPerRebirth = 1.5;
    const rebirthScoreRequirement = rebirthBaseScore * (nextRebirthNum > 1 ? Math.pow(scoreMultiplierPerRebirth, nextRebirthNum - 1) : 1);

    const minLevelForRebirth = 5 + (player.rebirths * 2);
    const actualRebirthCost = Math.ceil(rebirthScoreRequirement);

    if (player.score >= actualRebirthCost && player.level >= minLevelForRebirth) {
        player.rebirths++;
        player.score = 0; // Reset skor
        player.level = 1; // Reset level
        player.pointsPerClick = 1; // Reset poin per klik dasar
        player.autoClickRate = 0; // Reset status auto-click
        player.upgrades = { // Reset upgrade
            doubleClickPass: false,
            megaClickPass: false,
            autoClickPass: false
        };
        // VIP membership TIDAK direset setelah rebirth untuk memberikan nilai premium

        calculatePointsPerClick(); // Hitung ulang poin berdasarkan multiplier rebirth baru
        showNotification(`Rebirth ke-${player.rebirths} berhasil! Anda mendapatkan bonus skor permanen!`, 5000, 'success');
        updateUI();
        saveGame();
    } else {
        let message = `Untuk Rebirth ke-${nextRebirthNum}, Anda perlu ${formatNumber(actualRebirthCost)} Score`;
        if (player.level < minLevelForRebirth) {
            message += ` dan Level ${minLevelForRebirth}.`;
        } else {
            message += `.`;
        }
        showNotification(message, 4000, 'error');
    }
}


// --- UI Update Functions ---

/**
 * Memperbarui semua elemen UI berdasarkan state pemain saat ini.
 */
function updateUI() {
    scoreDisplay.textContent = formatNumber(player.score);
    levelDisplay.textContent = `Level ${player.level}`;
    rebirthsDisplay.textContent = player.rebirths;

    // Memperbarui nama pemain dan status VIP (mahkota dan warna nama)
    playerNameDisplay.textContent = player.name; // Perbarui teks nama pemain
    if (player.vip.active) {
        playerNameDisplay.classList.add('vip'); // Tambahkan kelas untuk nama kuning
        playerCrownIcon.style.display = 'inline-block'; // Tampilkan mahkota
    } else {
        playerNameDisplay.classList.remove('vip'); // Hapus kelas
        playerCrownIcon.style.display = 'none'; // Sembunyikan mahkota
    }


    // Memperbarui tombol upgrade dan status pembelian
    updateButtonState(doubleClickPassBtn, 'doubleClickPass', 'Double Click (x2 Score)', 'Double Click (Dibeli)', player.gamepassCosts.doubleClick);
    updateButtonState(megaClickPassBtn, 'megaClickPass', 'Mega Click (x5 Score)', 'Mega Click (Dibeli)', player.gamepassCosts.megaClick);
    updateButtonState(autoClickPassBtn, 'autoClickPass', 'AutoClick (1 click/sec)', 'AutoClick (Dibeli)', player.gamepassCosts.autoClick);

    // Memperbarui tombol toggle AutoClick
    if (player.upgrades.autoClickPass) {
        toggleAutoClickBtn.style.display = 'block';
        toggleAutoClickBtn.innerHTML = player.autoClickRate > 0 ? '<i class="fas fa-toggle-on"></i> Toggle AutoClick (ON)' : '<i class="fas fa-toggle-off"></i> Toggle AutoClick (OFF)';
        toggleAutoClickBtn.classList.toggle('active', player.autoClickRate > 0);
    } else {
        toggleAutoClickBtn.style.display = 'none';
    }

    // Memperbarui tombol VIP
    vipCostDisplay.textContent = formatNumber(player.vipCost);
    buyVipBtn.disabled = player.vip.active || player.score < player.vipCost;
    if (player.vip.active) {
        buyVipBtn.innerHTML = '<i class="fas fa-crown"></i> VIP Aktif!';
        buyVipBtn.classList.add('purchased');
        vipBonusDisplay.textContent = '100%';
    } else {
        buyVipBtn.innerHTML = `<i class="fas fa-crown"></i> Beli VIP (Bonus x2) - <span id="vipCostDisplay">${formatNumber(player.vipCost)}</span> Score`;
        buyVipBtn.classList.remove('purchased');
        vipBonusDisplay.textContent = '0%';
    }

    // Memperbarui atau membuat tombol Rebirth secara dinamis
    const nextRebirthNum = player.rebirths + 1;
    const rebirthBaseScore = 50000;
    const scoreMultiplierPerRebirth = 1.5;
    const rebirthScoreRequirement = rebirthBaseScore * (nextRebirthNum > 1 ? Math.pow(scoreMultiplierPerRebirth, nextRebirthNum - 1) : 1);
    const minLevelForRebirth = 5 + (player.rebirths * 2);
    const actualRebirthCost = Math.ceil(rebirthScoreRequirement);

    let existingRebirthBtn = document.getElementById('rebirthBtn');
    if (!existingRebirthBtn) {
        const rebirthBtn = document.createElement('button');
        rebirthBtn.id = 'rebirthBtn';
        rebirthBtn.className = 'upgrade-btn';
        rebirthBtn.onclick = rebirth;
        rebirthButtonContainer.appendChild(rebirthBtn);
        existingRebirthBtn = rebirthBtn;
    }
    existingRebirthBtn.innerHTML = `<i class="fas fa-redo-alt"></i> Rebirth (Next: ${formatNumber(actualRebirthCost)} Score, Level ${minLevelForRebirth})`;
    existingRebirthBtn.disabled = player.score < actualRebirthCost || player.level < minLevelForRebirth;
}

/**
 * Fungsi pembantu untuk memperbarui status tombol upgrade.
 * @param {HTMLElement} buttonElement Elemen tombol.
 * @param {string} upgradeKey Kunci upgrade dalam objek player.upgrades.
 * @param {string} defaultText Teks default untuk tombol.
 * @param {string} purchasedText Teks saat sudah dibeli.
 * @param {number} cost Biaya upgrade.
 */
function updateButtonState(buttonElement, upgradeKey, defaultText, purchasedText, cost) {
    if (player.upgrades[upgradeKey]) {
        buttonElement.innerHTML = `<i class="fas fa-check"></i> ${purchasedText}`;
        buttonElement.classList.add('purchased');
        buttonElement.disabled = true;
    } else {
        buttonElement.innerHTML = `${defaultText} - ${formatNumber(cost)} Score`;
        buttonElement.classList.remove('purchased');
        buttonElement.disabled = player.score < cost;
    }
}


// --- Notification System ---
let notificationTimeout;
let isNotificationVisible = false;

/**
 * Menampilkan notifikasi game dengan pesan, durasi, dan tipe tertentu.
 * @param {string} message Pesan notifikasi.
 * @param {number} [duration=3000] Durasi tampilan notifikasi dalam ms.
 * @param {string} [type='info'] Tipe notifikasi (info, success, error, dev, gift).
 */
function showNotification(message, duration = 3000, type = 'info') {
    clearTimeout(notificationTimeout); // Hapus timeout sebelumnya

    // Sembunyikan notifikasi yang sedang terlihat untuk mencegah tumpang tindih
    if (isNotificationVisible) {
        gameNotification.classList.remove('show', 'slide-in');
        setTimeout(() => {
            _displayNotification(message, duration, type);
        }, 300); // Tunggu sebentar agar transisi selesai
    } else {
        _displayNotification(message, duration, type);
    }
}

/**
 * Fungsi internal untuk menampilkan notifikasi.
 * @param {string} message
 * @param {number} duration
 * @param {string} type
 */
function _displayNotification(message, duration, type) {
    // Hapus semua tipe notifikasi sebelumnya dan tambahkan tipe saat ini
    gameNotification.classList.remove('error', 'info', 'success', 'dev', 'gift');
    gameNotification.classList.add(type);

    notificationText.textContent = message;
    gameNotification.style.display = 'flex'; // Pastikan notifikasi terlihat

    // Memicu reflow untuk memastikan animasi dimulai ulang
    void gameNotification.offsetWidth;
    gameNotification.classList.add('show', 'slide-in');

    isNotificationVisible = true;

    notificationTimeout = setTimeout(() => {
        hideNotification();
    }, duration);

    closeNotificationBtn.onclick = hideNotification;
}

/**
 * Menyembunyikan notifikasi game.
 */
function hideNotification() {
    gameNotification.classList.remove('show', 'slide-in');
    isNotificationVisible = false;
    // Sembunyikan sepenuhnya setelah transisi selesai
    setTimeout(() => {
        gameNotification.style.display = 'none';
        gameNotification.classList.remove('error', 'info', 'success', 'dev', 'gift');
    }, 400); // Sesuaikan dengan durasi transisi CSS
}

// --- Score Effect ---
/**
 * Menampilkan efek skor mengambang di atas tombol klik.
 * @param {number} amount Jumlah skor yang ditampilkan.
 * @param {number} x Posisi X (pusat tombol klik).
 * @param {number} y Posisi Y (pusat tombol klik).
 */
function displayScoreEffect(amount, x, y) {
    const scoreEffect = document.createElement('span');
    scoreEffect.className = 'score-effect';
    scoreEffect.textContent = `+${formatNumber(amount)}`;

    // Posisikan relatif terhadap kontainer efek skor, dengan sedikit variasi acak
    const randomOffsetX = (Math.random() - 0.5) * 80; // -40 hingga +40px
    const randomOffsetY = (Math.random() - 0.5) * 80; // -40 hingga +40px

    scoreEffect.style.left = `calc(50% + ${randomOffsetX}px)`;
    scoreEffect.style.top = `calc(50% + ${randomOffsetY}px)`;

    scoreEffectContainer.appendChild(scoreEffect);

    scoreEffect.addEventListener('animationend', () => {
        scoreEffect.remove();
    });
}


// --- Game Loop for AutoClick ---
/**
 * Fungsi loop game utama, digunakan untuk mengelola auto-click.
 */
function gameLoop() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - player.lastAutoClickTime;

    if (player.autoClickRate > 0 && elapsedTime >= (1000 / player.autoClickRate)) {
        const clicksToPerform = Math.floor(elapsedTime / (1000 / player.autoClickRate));
        for (let i = 0; i < clicksToPerform; i++) {
            updateScore(player.pointsPerClick);
        }
        player.lastAutoClickTime = currentTime;
    }
    requestAnimationFrame(gameLoop);
}

// --- Save/Load/Reset Game ---

/**
 * Menyimpan state game pemain saat ini ke Local Storage.
 */
function saveGame() {
    if (player.name && player.name.trim() !== '') {
        localStorage.setItem('currentPlayerName', player.name); // Simpan nama pemain aktif saat ini
        localStorage.setItem(`clickerJourneySave_${player.name.toLowerCase()}`, JSON.stringify(player)); // Gunakan nama kecil untuk kunci
        // showNotification('Game Saved!', 1000, 'info'); // Jangan spam notifikasi auto-save
    }
}

/**
 * Memuat state game dari Local Storage. Jika tidak ada save, inisialisasi game baru.
 */
function loadGame() {
    let savedPlayerName = localStorage.getItem('currentPlayerName');
    let loadedPlayer = null;

    if (savedPlayerName && savedPlayerName.trim() !== '') {
        const savedData = localStorage.getItem(`clickerJourneySave_${savedPlayerName.toLowerCase()}`);
        if (savedData) {
            loadedPlayer = JSON.parse(savedData);
        }
    }

    if (loadedPlayer) {
        // Gabungkan data yang dimuat ke objek pemain saat ini untuk kompatibilitas mundur
        player = {
            ...player,
            ...loadedPlayer,
            upgrades: {
                ...player.upgrades,
                ...(loadedPlayer.upgrades || {})
            },
            vip: {
                ...player.vip,
                ...(loadedPlayer.vip || {})
            }
        };

        // Pastikan nama pemain diatur dengan benar dari data yang dimuat
        player.name = loadedPlayer.name || "Player 1";
        playerNameDisplay.textContent = player.name; // Perbarui tampilan nama langsung
        devTargetUser.value = player.name; // Atur target dev panel ke pemain saat ini

        calculatePointsPerClick(); // Hitung ulang poin per klik setelah memuat
        updateUI(); // Perbarui UI untuk mencerminkan data yang dimuat
        showNotification('Game berhasil dimuat!', 2000, 'success');
    } else {
        // Jika tidak ada save, inisialisasi dengan state default "Player 1"
        player.name = "Player 1";
        playerNameDisplay.textContent = player.name;
        devTargetUser.value = player.name;
        calculatePointsPerClick();
        updateUI();
        showNotification(`Selamat datang, ${player.name}! Klik untuk memulai petualangan Anda!`, 4000, 'info');
    }
}

/**
 * Mereset seluruh progres game.
 */
function resetGame() {
    if (confirm('Apakah Anda yakin ingin me-reset seluruh progres game? Ini tidak dapat diurungkan!')) {
        // Hapus data untuk pemain saat ini
        localStorage.removeItem(`clickerJourneySave_${player.name.toLowerCase()}`);
        // Hapus juga nama pemain aktif terakhir jika game direset sepenuhnya
        localStorage.removeItem('currentPlayerName');

        // Reset objek pemain ke state awal
        player = {
            name: "Player 1",
            score: 0,
            level: 1,
            rebirths: 0,
            pointsPerClick: 1,
            autoClickRate: 0,
            vip: { active: false, multiplier: 1 },
            upgrades: { doubleClickPass: false, megaClickPass: false, autoClickPass: false },
            gamepassCosts: { doubleClick: 100, megaClick: 500, autoClick: 1000 },
            vipCost: 20000,
            lastAutoClickTime: Date.now()
        };
        playerNameDisplay.textContent = player.name;
        devTargetUser.value = player.name;
        calculatePointsPerClick();
        updateUI();
        saveGame(); // Simpan state yang direset
        showNotification('Game berhasil direset!', 3000, 'success');
    }
}

// --- Developer Gifting Logic ---
/**
 * Memberikan item kepada pemain target (bisa pemain aktif atau simulasi pemain lain).
 * @param {string} targetUsername Nama pengguna target.
 * @param {string} itemType Tipe item yang diberikan (e.g., 'score', 'vip').
 * @param {any} value Nilai item (jumlah skor, true/false untuk pass, dll.).
 */
function giftItemToUser(targetUsername, itemType, value) {
    if (!targetUsername || targetUsername.trim() === '') {
        showNotification('Target User tidak boleh kosong.', 2000, 'error');
        return;
    }

    // Coba memuat data pemain target dari Local Storage
    let targetPlayerData = JSON.parse(localStorage.getItem(`clickerJourneySave_${targetUsername.toLowerCase()}`));

    // Jika tidak ada save untuk target, inisialisasi objek pemain baru untuk mereka
    if (!targetPlayerData) {
        targetPlayerData = {
            name: targetUsername,
            score: 0,
            level: 1,
            rebirths: 0,
            pointsPerClick: 1,
            autoClickRate: 0,
            vip: { active: false, multiplier: 1 },
            upgrades: { doubleClickPass: false, megaClickPass: false, autoClickPass: false },
            gamepassCosts: { doubleClick: 100, megaClick: 500, autoClick: 1000 },
            vipCost: 20000,
            lastAutoClickTime: Date.now()
        };
        showNotification(`Membuat data baru untuk ${targetUsername} karena tidak ditemukan save game.`, 3000, 'dev');
    } else {
        // Pastikan objek VIP dan upgrade ada jika memuat save lama
        targetPlayerData.vip = targetPlayerData.vip || { active: false, multiplier: 1 };
        targetPlayerData.upgrades = targetPlayerData.upgrades || { doubleClickPass: false, megaClickPass: false, autoClickPass: false };
    }

    let message = `Developer memberi ${targetUsername} `;
    let notificationType = 'dev'; // Default tipe notifikasi untuk dev panel
    let itemGiven = false;

    switch (itemType) {
        case 'score':
            if (typeof value !== 'number' || value <= 0) {
                showNotification('Jumlah skor harus angka positif.', 2000, 'error');
                return;
            }
            targetPlayerData.score += value;
            message += `${formatNumber(value)} Score!`;
            itemGiven = true;
            break;
        case 'level':
            if (typeof value !== 'number' || value <= 0) {
                showNotification('Jumlah level harus angka positif.', 2000, 'error');
                return;
            }
            targetPlayerData.level += value;
            message += `${value} Level!`;
            itemGiven = true;
            break;
        case 'rebirths':
            if (typeof value !== 'number' || value <= 0) {
                showNotification('Jumlah rebirth harus angka positif.', 2000, 'error');
                return;
            }
            targetPlayerData.rebirths += value;
            // Poin per klik akan dihitung ulang saat data ini dimuat/menjadi aktif
            message += `${value} Rebirth!`;
            itemGiven = true;
            break;
        case 'doubleClick':
            if (targetPlayerData.upgrades.doubleClickPass) {
                showNotification(`Double Click Pass sudah dimiliki oleh ${targetUsername}.`, 2000, 'info');
                return;
            }
            targetPlayerData.upgrades.doubleClickPass = true;
            message += `Double Click Pass!`;
            itemGiven = true;
            break;
        case 'megaClick':
            if (targetPlayerData.upgrades.megaClickPass) {
                showNotification(`Mega Click Pass sudah dimiliki oleh ${targetUsername}.`, 2000, 'info');
                return;
            }
            targetPlayerData.upgrades.megaClickPass = true;
            message += `Mega Click Pass!`;
            itemGiven = true;
            break;
        case 'autoClick':
            if (targetPlayerData.upgrades.autoClickPass) {
                showNotification(`AutoClick Pass sudah dimiliki oleh ${targetUsername}.`, 2000, 'info');
                return;
            }
            targetPlayerData.upgrades.autoClickPass = true;
            message += `AutoClick Pass!`;
            itemGiven = true;
            break;
        case 'vip':
            if (targetPlayerData.vip.active) {
                showNotification(`VIP Membership sudah aktif untuk ${targetUsername}.`, 2000, 'info');
                return;
            }
            targetPlayerData.vip.active = true;
            targetPlayerData.vip.multiplier = 2;
            message += `VIP Membership!`;
            itemGiven = true;
            break;
        default:
            showNotification('Item hadiah tidak dikenal.', 2000, 'error');
            return;
    }

    if (itemGiven) {
        // Simpan data pemain target yang dimodifikasi kembali ke Local Storage
        localStorage.setItem(`clickerJourneySave_${targetUsername.toLowerCase()}`, JSON.stringify(targetPlayerData));

        // Jika pemain target adalah pemain yang sedang aktif, perbarui objek pemain saat ini dan UI
        if (targetUsername.toLowerCase() === player.name.toLowerCase()) {
            player = targetPlayerData; // Perbarui objek pemain aktif
            calculatePointsPerClick(); // Hitung ulang poin setelah pemberian hadiah
            updateUI(); // Perbarui UI untuk mencerminkan perubahan
            showNotification(message.replace('Developer memberi Anda', 'Anda menerima hadiah'), 5000, 'gift'); // Tampilkan notifikasi hadiah untuk pemain aktif
        } else {
            // Jika target bukan pemain aktif, hanya tampilkan notifikasi dev
            showNotification(message, 3000, 'dev');
        }
    }
}


// --- Event Listeners ---
clickButton.addEventListener('click', () => {
    updateScore(player.pointsPerClick);
});

doubleClickPassBtn.addEventListener('click', () => {
    buyUpgrade('doubleClickPass');
});

megaClickPassBtn.addEventListener('click', () => {
    buyUpgrade('megaClickPass');
});

autoClickPassBtn.addEventListener('click', () => {
    buyUpgrade('autoClickPass');
});

toggleAutoClickBtn.addEventListener('click', () => {
    if (player.upgrades.autoClickPass) {
        if (player.autoClickRate === 0) {
            player.autoClickRate = 1; // 1 klik per detik
            showNotification('AutoClick diaktifkan!', 2000, 'success');
        } else {
            player.autoClickRate = 0;
            showNotification('AutoClick dinonaktifkan!', 2000, 'info');
        }
        player.lastAutoClickTime = Date.now(); // Reset timer untuk mencegah ledakan klik instan
        updateUI();
        saveGame();
    }
});

buyVipBtn.addEventListener('click', buyVipMembership);

// Fungsionalitas Edit Nama Pemain
editProfileBtn.addEventListener('click', () => {
    let currentName = player.name;
    let newName = prompt('Masukkan nama pemain baru:', currentName);

    if (newName !== null) { // Pengguna tidak mengklik batal
        newName = newName.trim();
        if (newName === '') {
            showNotification('Nama tidak boleh kosong.', 2000, 'error');
            return;
        }
        if (newName.toLowerCase() === currentName.toLowerCase()) {
            showNotification('Nama tidak diubah.', 1500, 'info');
            return;
        }

        // Simpan state game saat ini sebelum beralih ke slot save nama baru
        // Ini memastikan data nama lama tetap tersimpan
        localStorage.setItem(`clickerJourneySave_${currentName.toLowerCase()}`, JSON.stringify(player));

        // Periksa apakah save untuk nama baru sudah ada
        const existingNewNameSave = localStorage.getItem(`clickerJourneySave_${newName.toLowerCase()}`);

        if (existingNewNameSave) {
            // Jika save ada untuk nama baru, muat data tersebut
            player = JSON.parse(existingNewNameSave);
            player.name = newName; // Pastikan nama diatur dari prompt, bukan dari save lama jika ada
            showNotification(`Memuat progres untuk ${player.name}!`, 2000, 'success');
        } else {
            // Jika tidak ada save untuk nama baru, cukup perbarui nama pemain saat ini
            // (secara efektif mengganti nama save yang sedang aktif)
            player.name = newName;
            showNotification(`Nama pemain diubah menjadi ${player.name}!`, 2000, 'success');
        }

        // Atur nama baru sebagai nama pemain yang sedang aktif
        localStorage.setItem('currentPlayerName', player.name);

        // Perbarui UI dan simpan state baru (baik itu hasil muatan atau penggantian nama)
        devTargetUser.value = player.name; // Perbarui target dev panel
        calculatePointsPerClick(); // Hitung ulang berdasarkan data pemain yang berpotensi baru
        updateUI();
        saveGame(); // Simpan dengan nama baru
    }
});


// --- Developer Panel Functionality ---
toggleDevPanelBtn.addEventListener('click', () => {
    // Periksa apakah panel saat ini terlihat (misalnya di layar yang lebih besar di mana ia tidak fixed)
    const isPanelCurrentlyVisible = developerPanel.classList.contains('show') || getComputedStyle(developerPanel).transform === 'none';

    if (!isPanelCurrentlyVisible) { // Hanya minta kata sandi jika belum terbuka
        const password = prompt('Masukkan kata sandi developer:');
        if (password === DEV_PASSWORD) {
            developerPanel.classList.add('show'); // Tampilkan panel
            showNotification('Developer Panel diakses!', 1500, 'dev');
        } else {
            showNotification('Kata sandi salah!', 1500, 'error');
        }
    } else {
        developerPanel.classList.remove('show'); // Jika sudah terbuka, tutup saja
    }
});

closeDevPanelBtn.addEventListener('click', () => {
    developerPanel.classList.remove('show');
});

// Tombol Hadiah Developer
devGiftScoreBtn.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    const amount = parseInt(devGiftScore.value);
    if (!isNaN(amount) && amount > 0) {
        giftItemToUser(target, 'score', amount);
        devGiftScore.value = '';
    } else {
        showNotification('Jumlah skor harus angka positif.', 2000, 'error');
    }
});

devGiftLevelBtn.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    const amount = parseInt(devGiftLevel.value);
    if (!isNaN(amount) && amount > 0) {
        giftItemToUser(target, 'level', amount);
        devGiftLevel.value = '';
    } else {
        showNotification('Jumlah level harus angka positif.', 2000, 'error');
    }
});

devGiftRebirthsBtn.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    const amount = parseInt(devGiftRebirths.value);
    if (!isNaN(amount) && amount > 0) {
        giftItemToUser(target, 'rebirths', amount);
        devGiftRebirths.value = '';
    } else {
        showNotification('Jumlah rebirth harus angka positif.', 2000, 'error');
    }
});

devGiftDoubleClick.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    giftItemToUser(target, 'doubleClick', true);
});

devGiftMegaClick.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    giftItemToUser(target, 'megaClick', true);
});

devGiftAutoClick.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    giftItemToUser(target, 'autoClick', true);
});

devGiftVip.addEventListener('click', () => {
    const target = devTargetUser.value.trim();
    giftItemToUser(target, 'vip', true);
});

devMessage.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        devSendMessageBtn.click();
    }
});

devSendMessageBtn.addEventListener('click', () => {
    const message = devMessage.value.trim();
    const target = devTargetUser.value.trim();
    if (message && target) {
        // Ini adalah simulasi pengiriman pesan di game lokal
        if (target.toLowerCase() === player.name.toLowerCase()) {
            showNotification(`Pesan dari Dev: ${message}`, 5000, 'dev');
        } else {
            showNotification(`Pesan dikirim ke ${target} (simulasi).`, 3000, 'dev');
        }
        devMessage.value = '';
    } else {
        showNotification('Masukkan pesan dan target user.', 2000, 'error');
    }
});

devResetGame.addEventListener('click', resetGame);
devSaveGame.addEventListener('click', () => { saveGame(); showNotification('Game disimpan secara manual!', 1500, 'success'); });
devLoadGame.addEventListener('click', () => { loadGame(); });


// --- Initialization ---
// Pastikan semua DOMContentLoaded event listener berada di dalam satu blok
document.addEventListener('DOMContentLoaded', () => {
    // Sembunyikan panel developer pada pemuatan awal
    developerPanel.classList.remove('show');
    // Atur transform awal panel developer agar tersembunyi
    // Ini penting agar animasi slide-in berfungsi dengan benar saat pertama kali dibuka
    developerPanel.style.transform = 'translateX(-100%)';

    loadGame(); // Muat state game saat halaman dimuat
    updateUI(); // Perbarui UI berdasarkan state yang dimuat atau default
    gameLoop(); // Mulai loop game untuk auto-click
});

// Simpan state game secara otomatis setiap 30 detik
setInterval(saveGame, 30000);