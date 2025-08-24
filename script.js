/*
 * JavaScript for Clicker Journey Game
 * Made by Raka
 */

const Game = {
    // 1. Properti Game
    score: 0,
    level: 1,
    playerName: "Player 1",
    // Kata sandi developer untuk edit profil. GANTI INI DENGAN KATA SANDI AMAN ANDA!
    developerProfilePassword: "raka", // <--- GANTI INI!
                                                            // PERINGATAN: Kata sandi ini terlihat di kode sumber!
                                                            // Jangan gunakan kata sandi yang Anda pakai di tempat lain.
    isDeveloper: false,
    isDevPanelActive: false,
    developerUsers: ["Developer1", "raka", "Admin"], // <--- GANTI NAMA ANDA DI SINI!

    // Gamepass state
    hasGamepass: {
        doubleClick: false,
        megaClick: false,
        autoClick: false,
    },
    gamepassCosts: {
        doubleClick: 100,
        megaClick: 500,
        autoClick: 1000,
    },
    clickMultiplier: 1,

    // Autoclick state
    autoClickInterval: null,
    isAutoClickActive: false,

    // Rebirth state
    rebirths: 0,
    rebirthMultiplierPer: 1,
    rebirthCost: 100000,
    baseRebirthCost: 100000,

    // Notification state
    notificationTimeout: null,
    notificationQueue: [],

    // 2. Elemen HTML
    elements: {
        scoreDisplay: document.getElementById("scoreDisplay"),
        clickButton: document.getElementById("clickButton"),
        levelDisplay: document.getElementById("levelDisplay"),
        playerNameDisplay: document.getElementById("playerNameDisplay"),
        editProfileBtn: document.getElementById("editProfileBtn"),
        gameNotification: document.getElementById("gameNotification"),
        notificationText: document.getElementById("notificationText"),
        closeNotificationBtn: document.getElementById("closeNotificationBtn"),
        doubleClickPassBtn: document.getElementById("doubleClickPassBtn"),
        megaClickPassBtn: document.getElementById("megaClickPassBtn"),
        autoClickPassBtn: document.getElementById("autoClickPassBtn"),
        developerPanel: document.getElementById("developerPanel"),
        toggleDevPanelBtn: document.getElementById("toggleDevPanelBtn"),
        devTargetUser: document.getElementById("devTargetUser"),
        devGiftScore: document.getElementById("devGiftScore"),
        devGiftScoreBtn: document.getElementById("devGiftScoreBtn"),
        devGiftLevel: document.getElementById("devGiftLevel"),
        devGiftLevelBtn: document.getElementById("devGiftLevelBtn"),
        devGiftRebirths: document.getElementById("devGiftRebirths"),
        devGiftRebirthsBtn: document.getElementById("devGiftRebirthsBtn"),
        devGiftDoubleClick: document.getElementById("devGiftDoubleClick"),
        devGiftMegaClick: document.getElementById("devGiftMegaClick"),
        devGiftAutoClick: document.getElementById("devGiftAutoClick"),
        devMessage: document.getElementById("devMessage"),
        devSendMessageBtn: document.getElementById("devSendMessageBtn"),
        rebirthButtonContainer: document.getElementById("rebirthButtonContainer"),
        toggleAutoClickBtn: document.getElementById("toggleAutoClickBtn"),
        rebirthsDisplay: document.getElementById("rebirthsDisplay"),
        scoreEffectContainer: document.getElementById("scoreEffectContainer"),
    },

    // 3. Manage Event & UI

    /**
     * Mengikat semua event listener ke elemen HTML.
     */
    bindEvents() {
        this.elements.clickButton.addEventListener("click", () => this.clickAction());
        this.elements.editProfileBtn.addEventListener("click", () => this.editProfile());
        this.elements.doubleClickPassBtn.addEventListener("click", () => this.buyGamepass("doubleClick"));
        this.elements.megaClickPassBtn.addEventListener("click", () => this.buyGamepass("megaClick"));
        this.elements.autoClickPassBtn.addEventListener("click", () => this.buyGamepass("autoClick"));

        if (this.elements.toggleAutoClickBtn) {
            this.elements.toggleAutoClickBtn.addEventListener("click", () => this.toggleAutoClick());
        }

        // Developer Panel
        if (this.elements.toggleDevPanelBtn) {
            this.elements.toggleDevPanelBtn.addEventListener("click", () => this.toggleDeveloperPanel());
        } else {
            console.warn("toggleDevPanelBtn not found. Developer panel toggle will not function.");
        }
        
        if (this.elements.devGiftScoreBtn) { this.elements.devGiftScoreBtn.addEventListener("click", () => this.giftItem("score")); }
        if (this.elements.devGiftLevelBtn) { this.elements.devGiftLevelBtn.addEventListener("click", () => this.giftItem("level")); }
        if (this.elements.devGiftRebirthsBtn) { this.elements.devGiftRebirthsBtn.addEventListener("click", () => this.giftItem("rebirths")); }
        if (this.elements.devGiftDoubleClick) { this.elements.devGiftDoubleClick.addEventListener("click", () => this.giftItem("doubleClickPass")); }
        if (this.elements.devGiftMegaClick) { this.elements.devGiftMegaClick.addEventListener("click", () => this.giftItem("megaClickPass")); }
        if (this.elements.devGiftAutoClick) { this.elements.devGiftAutoClick.addEventListener("click", () => this.giftItem("autoClickPass")); }
        if (this.elements.devSendMessageBtn) { this.elements.devSendMessageBtn.addEventListener("click", () => this.sendMessageFromDevPanel()); }

        // Notifikasi Pesan
        if (this.elements.closeNotificationBtn) {
            this.elements.closeNotificationBtn.addEventListener("click", () => this.hideNotification());
        }

        // Menutup panel jika klik di luar
        document.addEventListener("click", (event) => {
            const isClickInsidePanel = this.elements.developerPanel && this.elements.developerPanel.contains(event.target);
            const isClickOnToggleButton = (event.target && event.target.id === "toggleDevPanelBtn");
            const isClickInsideNotification = this.elements.gameNotification && this.elements.gameNotification.contains(event.target);
            
            if (this.isDevPanelActive && !isClickInsidePanel && !isClickOnToggleButton && !isClickInsideNotification) {
                this.toggleDeveloperPanel();
            }
        });
    },

    updateDisplay() {
        this.elements.scoreDisplay.textContent = this.score.toLocaleString();
        this.elements.levelDisplay.textContent = `Level ${this.level.toLocaleString()}`;
        this.elements.playerNameDisplay.textContent = this.playerName;
        this.elements.rebirthsDisplay.textContent = this.rebirths.toLocaleString();
    },

    /**
     * Memeriksa apakah user saat ini adalah developer berdasarkan playerName.
     * Tombol Developer Panel akan selalu terlihat, tapi hanya bisa diaktifkan jika playerName adalah developer.
     */
    checkDeveloperAccess() {
        if (this.elements.toggleDevPanelBtn) {
            this.elements.toggleDevPanelBtn.style.display = 'block';
        }

        this.isDeveloper = this.developerUsers.includes(this.playerName);
        
        if (!this.isDeveloper) {
            this.isDevPanelActive = false;
            if (this.elements.developerPanel) {
                this.elements.developerPanel.classList.remove('active');
            }
        }
    },
    
    toggleDeveloperPanel() {
        if (this.isDeveloper) {
            this.isDevPanelActive = !this.isDevPanelActive;
            this.applyDevPanelVisibility();
            this.saveGame();
        } else {
            this.showNotification("Akses ditolak. Anda bukan developer.", 3000, 'error');
        }
    },
    
    applyDevPanelVisibility() {
        if (this.elements.developerPanel) {
            if (this.isDevPanelActive) {
                this.elements.developerPanel.classList.add('active');
            } else {
                this.elements.developerPanel.classList.remove('active');
            }
        }
    },

    // 4. Logic Game
    
    calculateEffectiveClickMultiplier() {
        let baseMultiplier = 1;
        if (this.hasGamepass.doubleClick) baseMultiplier *= 2;
        if (this.hasGamepass.megaClick) baseMultiplier *= 5;

        const currentRebirths = this.rebirths || 0; 
        const rebirthMultiplier = 1 + (currentRebirths * this.rebirthMultiplierPer);
        this.clickMultiplier = baseMultiplier * rebirthMultiplier;
    },

    clickAction() {
        const scoreGained = this.clickMultiplier;
        this.score += scoreGained;
        this.updateDisplay();
        this.checkLevelUp();
        this.saveGame();
        this.showScoreEffect(scoreGained);
    },

    showScoreEffect(amount) {
        if (!this.elements.scoreEffectContainer) return;

        const effect = document.createElement('span');
        effect.classList.add('score-pop');
        effect.textContent = `+${amount}`;

        const buttonRect = this.elements.clickButton.getBoundingClientRect();
        
        const offsetX = (Math.random() - 0.5) * buttonRect.width * 0.5;
        const offsetY = (Math.random() - 0.5) * buttonRect.height * 0.5;

        const containerRect = this.elements.scoreEffectContainer.getBoundingClientRect();
        const relativeX = (buttonRect.left + buttonRect.width / 2) - containerRect.left + offsetX;
        const relativeY = (buttonRect.top + buttonRect.height / 2) - containerRect.top + offsetY;

        effect.style.left = `${relativeX}px`;
        effect.style.top = `${relativeY}px`;

        this.elements.scoreEffectContainer.appendChild(effect);

        effect.addEventListener('animationend', () => {
            effect.remove();
        });
    },

    checkLevelUp() {
        const nextLevelThreshold = this.level * 100;
        if (this.score >= nextLevelThreshold) {
            this.level++;
            this.showNotification(`🎉 Level Up! Anda sekarang Level ${this.level}!`, 5000, 'success');
        }
    },

    buyGamepass(passType) {
        const cost = this.gamepassCosts[passType];
        
        if (this.hasGamepass[passType]) {
            this.showNotification(`Anda sudah memiliki gamepass ${passType.replace(/([A-Z])/g, ' $1').toLowerCase()}!`, 3000, 'warning');
            return;
        }

        if (this.score >= cost) {
            this.score -= cost;
            this.hasGamepass[passType] = true;
            this.calculateEffectiveClickMultiplier(); 
            const displayName = passType.replace(/([A-Z])/g, ' $1').toLowerCase().replace('click', ' Click');
            this.showNotification(`Anda berhasil membeli ${displayName} seharga ${cost} skor!`, 3000, 'success');
            this.updateDisplay();
            this.updateGamepassButtons();
            this.saveGame();
            
            if (passType === "autoClick") {
                this.isAutoClickActive = true;
                this.startAutoClick();
                this.updateAutoClickToggleButton();
            }
        } else {
            const displayName = passType.replace(/([A-Z])/g, ' $1').toLowerCase().replace('click', ' Click');
            this.showNotification(`Skor tidak cukup! Anda memerlukan ${cost - this.score} skor lagi untuk membeli ${displayName}.`, 3000, 'error');
        }
    },

    updateGamepassButtons() {
        const gamepassKeys = Object.keys(this.hasGamepass);
        const iconMap = {
            doubleClick: '<i class="fas fa-mouse-pointer"></i>',
            megaClick: '<i class="fas fa-bolt"></i>',
            autoClick: '<i class="fas fa-robot"></i>'
        };

        gamepassKeys.forEach(key => {
            const btn = this.elements[`${key}PassBtn`];
            if (!btn) return; 

            const displayName = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace('click', ' Click');
            const icon = iconMap[key] || '';

            if (this.hasGamepass[key]) {
                btn.disabled = true;
                btn.innerHTML = `${icon} ${displayName} (ACTIVE)`;
                if (key === 'autoClick') {
                    btn.style.display = 'none'; 
                }
            } else {
                btn.disabled = false;
                btn.style.display = 'flex';
                const cost = this.gamepassCosts[key];
                const multiplierText = (key === 'doubleClick' ? 'x2 Score' : (key === 'megaClick' ? 'x5 Score' : '1 click/sec'));
                btn.innerHTML = `${icon} ${displayName} (${multiplierText}) - ${cost} Score`;
            }
        });
        this.updateAutoClickToggleButton();
    },

    startAutoClick() {
        if (!this.hasGamepass.autoClick) return;
        
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
        }
        this.autoClickInterval = setInterval(() => {
            const scoreGained = 1 * this.clickMultiplier;
            this.score += scoreGained;
            this.updateDisplay();
            this.checkLevelUp();
        }, 1000);
        console.log("AutoClick Started.");
    },

    stopAutoClick() {
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
            this.autoClickInterval = null;
        }
        console.log("AutoClick Stopped.");
    },

    toggleAutoClick() {
        if (!this.hasGamepass.autoClick) {
            this.showNotification("Anda harus membeli gamepass AutoClick terlebih dahulu!", 3000, 'error');
            return;
        }

        this.isAutoClickActive = !this.isAutoClickActive;
        if (this.isAutoClickActive) {
            this.startAutoClick();
            this.showNotification("AutoClick diaktifkan!", 2000, 'success');
        } else {
            this.stopAutoClick();
            this.showNotification("AutoClick dinonaktifkan!", 2000, 'warning');
        }
        this.updateAutoClickToggleButton();
        this.saveGame();
    },

    updateAutoClickToggleButton() {
        const btn = this.elements.toggleAutoClickBtn;
        if (!btn) return;

        if (!this.hasGamepass.autoClick) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
            if (this.isAutoClickActive) {
                btn.innerHTML = '<i class="fas fa-toggle-on"></i> Toggle AutoClick (ON)';
                btn.style.backgroundColor = 'var(--button-green)';
            } else {
                btn.innerHTML = '<i class="fas fa-toggle-off"></i> Toggle AutoClick (OFF)';
                btn.style.backgroundColor = 'var(--button-red)';
            }
            btn.disabled = false;
        }
    },
    
    createRebirthButton() {
        if (!this.elements.rebirthButtonContainer) return;

        const rebirthBtn = document.createElement('button');
        rebirthBtn.id = 'rebirthBtn';
        rebirthBtn.className = 'utility-btn';
        rebirthBtn.innerHTML = `<i class="fas fa-redo-alt"></i> Rebirth (x${1 + (this.rebirths || 0) * this.rebirthMultiplierPer}) - ${this.rebirthCost.toLocaleString()} Score`;
        rebirthBtn.addEventListener('click', () => this.performRebirth());

        this.elements.rebirthButtonContainer.innerHTML = '';
        this.elements.rebirthButtonContainer.appendChild(rebirthBtn);
        this.elements.rebirthBtn = rebirthBtn;
    },

    updateRebirthButtonState() {
        if (!this.elements.rebirthBtn) {
            this.createRebirthButton();
            if (!this.elements.rebirthBtn) return;
        }
        const currentRebirths = this.rebirths || 0;
        this.rebirthCost = this.baseRebirthCost * Math.pow(10, currentRebirths);
        this.elements.rebirthBtn.innerHTML = `<i class="fas fa-redo-alt"></i> Rebirth (x${1 + currentRebirths * this.rebirthMultiplierPer}) - ${this.rebirthCost.toLocaleString()} Score`;
        if (this.score >= this.rebirthCost) {
            this.elements.rebirthBtn.disabled = false;
        } else {
            this.elements.rebirthBtn.disabled = true;
        }
    },

    performRebirth() {
        if (this.score >= this.rebirthCost) {
            if (confirm(`Apakah Anda yakin ingin melakukan Rebirth? Anda akan me-reset semua progres (skor, level, gamepass) dan mendapatkan keuntungan x${this.rebirthMultiplierPer} skor permanen! (Total Rebirths: ${this.rebirths + 1})`)) {
                this.rebirths++; 
                clearInterval(this.autoClickInterval);
                this.autoClickInterval = null;
                this.isAutoClickActive = false;

                this.score = 0;
                this.level = 1;
                this.hasGamepass = {
                    doubleClick: false,
                    megaClick: false,
                    autoClick: false
                };

                this.calculateEffectiveClickMultiplier(); 
                this.updateDisplay(); 
                this.updateGamepassButtons(); 
                this.updateRebirthButtonState(); 
                this.updateAutoClickToggleButton();

                this.saveGame(); 
                this.showNotification(`🚀 Rebirth berhasil! Anda sekarang memiliki keuntungan x${this.clickMultiplier} skor dasar.`, 5000, 'success');
            }
        } else {
            this.showNotification(`Anda membutuhkan ${this.rebirthCost.toLocaleString()} skor untuk melakukan Rebirth! Anda masih kurang ${ (this.rebirthCost - this.score).toLocaleString() } skor.`, 5000, 'error');
        }
    },

    editProfile() {
        const passwordInput = prompt("Masukkan kata sandi untuk mengedit profil:");
        if (passwordInput === null) {
            this.showNotification("Pengeditan profil dibatalkan.", 2000, 'info');
            return;
        }

        if (passwordInput !== this.developerProfilePassword) {
            this.showNotification("Kata sandi salah. Pengeditan profil ditolak.", 3000, 'error');
            return;
        }

        const newName = prompt("Masukkan nama profil baru (maks. 15 karakter):");
        if (newName === null) {
            this.showNotification("Pengeditan profil dibatalkan.", 2000, 'info');
            return;
        }
        const trimmedName = newName.trim();

        if (trimmedName === "") {
            this.showNotification("Nama tidak boleh kosong!", 3000, 'error');
            return;
        }
        if (trimmedName.length > 15) {
            this.showNotification("Nama terlalu panjang! Maksimal 15 karakter.", 3000, 'error');
            return;
        }
        if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
            this.showNotification("Nama hanya boleh mengandung huruf, angka, dan spasi.", 3000, 'error');
            return;
        }

        if (trimmedName !== this.playerName) {
            this.playerName = trimmedName;
            this.updateDisplay();
            this.saveGame();
            if (this.isDeveloper && this.elements.devTargetUser) {
                this.elements.devTargetUser.value = this.playerName;
            }
            this.checkDeveloperAccess(); 
            this.applyDevPanelVisibility();
            this.showNotification(`Nama profil diubah menjadi "${this.playerName}".`, 3000, 'success');
        } else {
            this.showNotification("Nama profil tidak berubah.", 2000, 'info');
        }
    },

    // 5. Logic Notifikasi dan Developer Panel
    
    giftItem(itemType) {
        if (!this.isDeveloper) {
            this.showNotification("Akses ditolak. Anda bukan developer.", 3000, 'error');
            return;
        }
    
        let success = false;
        let message = "";
        let giftAmount;

        if (this.elements.devGiftScore) {
            giftAmount = parseFloat(this.elements.devGiftScore.value);
        }
    
        if (itemType === "score" && !isNaN(giftAmount) && giftAmount >= 0) {
            this.score += giftAmount;
            message = `Berhasil memberikan ${giftAmount.toLocaleString()} skor.`;
            success = true;
        } else if (itemType === "level" && this.elements.devGiftLevel && !isNaN(parseFloat(this.elements.devGiftLevel.value)) && parseFloat(this.elements.devGiftLevel.value) >= 0) {
            giftAmount = parseFloat(this.elements.devGiftLevel.value);
            this.level += giftAmount;
            message = `Berhasil memberikan ${giftAmount.toLocaleString()} level.`;
            success = true;
        } else if (itemType === "rebirths" && this.elements.devGiftRebirths && !isNaN(parseFloat(this.elements.devGiftRebirths.value)) && parseFloat(this.elements.devGiftRebirths.value) >= 0) {
            giftAmount = parseFloat(this.elements.devGiftRebirths.value);
            this.rebirths += giftAmount;
            message = `Berhasil memberikan ${giftAmount.toLocaleString()} rebirth.`;
            success = true;
        } else if (this.hasGamepass.hasOwnProperty(itemType.replace('Pass', ''))) {
            this.hasGamepass[itemType.replace('Pass', '')] = true;
            message = `Berhasil memberikan gamepass ${itemType.replace('Pass', '').replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
            success = true;
        } else {
            message = "Gagal: Input tidak valid atau jenis item tidak dikenali.";
            this.showNotification(message, 3000, 'error');
            return;
        }
    
        if (success) {
            this.calculateEffectiveClickMultiplier();
            this.updateDisplay();
            this.updateGamepassButtons();
            this.updateAutoClickToggleButton();
            this.updateRebirthButtonState();
            this.showNotification(message, 3000, 'success');
            this.saveGame();
        }
    },

    sendMessageFromDevPanel() {
        if (!this.isDeveloper) {
            this.showNotification("Akses ditolak. Anda bukan developer.", 3000, 'error');
            return;
        }
        if (this.elements.devMessage) {
            const message = this.elements.devMessage.value;
            if (message && message.trim() !== "") {
                this.showNotification(`[Developer]: ${message}`, 7000, 'info');
                this.elements.devMessage.value = "";
            } else {
                this.showNotification("Pesan developer tidak boleh kosong.", 3000, 'warning');
            }
        }
    },

    showNotification(message, duration = 5000, type = 'info') {
        if (!this.elements.gameNotification || !this.elements.notificationText) {
            console.error("Notification elements not found. Cannot show notification.");
            return;
        }

        this.notificationQueue.push({ message, duration, type });
        if (!this.notificationTimeout) {
            this.processMessageQueue();
        }
    },

    processMessageQueue() {
        if (this.notificationQueue.length === 0) {
            this.notificationTimeout = null;
            return;
        }
        
        const currentNotif = this.notificationQueue.shift();
        this.elements.notificationText.textContent = currentNotif.message;
        this.elements.gameNotification.className = `game-notification show ${currentNotif.type}`;
        
        this.notificationTimeout = setTimeout(() => {
            if (this.notificationQueue.length === 0) {
                this.hideNotification();
            } else {
                this.elements.gameNotification.classList.remove('show');
                this.notificationTimeout = setTimeout(() => {
                    this.processMessageQueue();
                }, 400);
            }
        }, currentNotif.duration);
    },

    hideNotification() {
        if (this.elements.gameNotification) {
            if (this.notificationTimeout) {
                clearTimeout(this.notificationTimeout);
                this.notificationTimeout = null;
            }
            this.elements.gameNotification.classList.remove('show');
        }
    },

    resetGameInitialState() {
        this.score = 0;
        this.level = 1;
        this.clickMultiplier = 1; 
        clearInterval(this.autoClickInterval);
        this.autoClickInterval = null;
        this.isAutoClickActive = false;
        this.isDevPanelActive = false;
        this.rebirths = 0;
        this.hasGamepass = {
            doubleClick: false,
            megaClick: false,
            autoClick: false
        };
        this.calculateEffectiveClickMultiplier(); 
        this.updateDisplay();
        this.updateGamepassButtons(); 
        this.updateAutoClickToggleButton();
        this.checkDeveloperAccess();
        this.applyDevPanelVisibility(); 
        this.saveGame(); 
    },

    loadGame() {
        const savedData = localStorage.getItem('clickerGameSave');
        
        if (!savedData || savedData === 'undefined' || savedData === 'null') {
            console.log("No saved game data found or data is null. Starting a new game.");
            this.showNotification("Selamat datang di Clicker Journey! Game baru dimulai.", 3000, 'info');
            this.resetGameInitialState();
            return;
        }
        
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData && typeof parsedData === 'object') {
                this.score = parsedData.score || 0;
                this.level = parsedData.level || 1;
                this.playerName = parsedData.playerName || "Player 1";
                this.rebirths = parsedData.rebirths || 0;
                this.isAutoClickActive = parsedData.isAutoClickActive || false;
                
                if (parsedData.hasGamepass && typeof parsedData.hasGamepass === 'object') {
                    this.hasGamepass.doubleClick = parsedData.hasGamepass.doubleClick || false;
                    this.hasGamepass.megaClick = parsedData.hasGamepass.megaClick || false;
                    this.hasGamepass.autoClick = parsedData.hasGamepass.autoClick || false;
                }
            } else {
                throw new Error("Parsed data is not a valid object.");
            }
        } catch (e) {
            console.error("Error loading game from localStorage:", e);
            alert("Corrupted save data detected. Starting a new game.");
            this.showNotification("Data game rusak terdeteksi. Memulai game baru.", 5000, 'error');
            localStorage.removeItem('clickerGameSave');
            this.resetGameInitialState();
        }
        
        this.calculateEffectiveClickMultiplier(); 
        this.updateAutoClickToggleButton(); 
        this.checkDeveloperAccess();
        this.applyDevPanelVisibility();
    },

    saveGame() {
        const dataToSave = {
            score: this.score,
            level: this.level,
            playerName: this.playerName,
            hasGamepass: this.hasGamepass,
            rebirths: this.rebirths,
            isAutoClickActive: this.isAutoClickActive,
        };
        try {
            localStorage.setItem('clickerGameSave', JSON.stringify(dataToSave));
        } catch (e) {
            console.error("Failed to save game to localStorage:", e);
        }
    },
    
    // 6. Inisialisasi Game

    init() {
        const requiredElements = [
            "scoreDisplay", "clickButton", "levelDisplay", "playerNameDisplay",
            "editProfileBtn", "gameNotification", "notificationText", "closeNotificationBtn",
            "doubleClickPassBtn", "megaClickPassBtn", "autoClickPassBtn",
            "developerPanel", "toggleDevPanelBtn", 
            "rebirthButtonContainer", "toggleAutoClickBtn",
            "rebirthsDisplay", "scoreEffectContainer"
        ];
    
        for (const id of requiredElements) {
            if (!document.getElementById(id)) {
                console.error(`Critical HTML element missing: #${id}. Please check your index.html file.`);
                alert(`Game failed to load. A necessary element is missing: #${id}.`);
                return;
            }
        }

        for (const key in this.elements) {
            this.elements[key] = document.getElementById(key) || this.elements[key];
        }

        this.loadGame();
        this.bindEvents();
        this.updateDisplay();
        this.updateGamepassButtons();
        this.createRebirthButton(); 
        this.updateRebirthButtonState(); 
        this.updateAutoClickToggleButton();

        if (this.hasGamepass.autoClick && this.isAutoClickActive) {
            this.startAutoClick();
        } else {
            this.stopAutoClick(); 
        }
        console.log("Game initialized successfully!");
    },
};

// DOM Content
document.addEventListener("DOMContentLoaded", () => {
    Game.init();

});
