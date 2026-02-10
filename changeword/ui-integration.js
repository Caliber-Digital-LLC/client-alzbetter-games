/**
 * Change Word - UI Integration
 * Connects the new casino-style UI with the existing canvas game
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    $(document).ready(function() {
        initializeUI();
    });
    
    /**
     * Initialize all UI components
     */
    function initializeUI() {
        setupSoundButton();
        setupHelpModal();
        setupStatsUpdater();
        
        // Initialize sound button state
        updateSoundButtonState();
    }
    
    /**
     * Setup sound button toggle
     */
    function setupSoundButton() {
        const soundBtn = document.getElementById('soundBtn');
        if (!soundBtn) return;
        
        soundBtn.addEventListener('click', function() {
            // Toggle sound using the existing game's sound system
            if (typeof soundOn !== 'undefined') {
                soundOn = !soundOn;
                toggleMute(!soundOn);
            }
            
            updateSoundButtonState();
        });
    }
    
    /**
     * Update sound button visual state
     */
    function updateSoundButtonState() {
        const soundBtn = document.getElementById('soundBtn');
        if (!soundBtn) return;
        
        // Check if sound is on
        let isSoundOn = true;
        if (typeof soundOn !== 'undefined') {
            isSoundOn = soundOn;
        }
        
        if (isSoundOn) {
            soundBtn.classList.remove('sound-off');
            soundBtn.classList.add('sound-on');
        } else {
            soundBtn.classList.remove('sound-on');
            soundBtn.classList.add('sound-off');
        }
    }
    
    /**
     * Setup help modal
     */
    function setupHelpModal() {
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeHelpBtn = document.getElementById('closeHelpBtn');
        const gotItBtn = document.getElementById('gotItBtn');
        
        if (!helpBtn || !helpModal) return;
        
        // Open modal
        helpBtn.addEventListener('click', function() {
            helpModal.classList.add('active');
        });
        
        // Close modal
        const closeModal = function() {
            helpModal.classList.remove('active');
        };
        
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', closeModal);
        }
        
        if (gotItBtn) {
            gotItBtn.addEventListener('click', closeModal);
        }
        
        // Close on backdrop click
        helpModal.addEventListener('click', function(e) {
            if (e.target === helpModal) {
                closeModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && helpModal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    /**
     * Setup stats updater - monitors game variables and updates display
     */
    function setupStatsUpdater() {
        // Update stats periodically
        setInterval(updateStats, 100);
    }
    
    /**
     * Update stats display from game variables
     */
    function updateStats() {
        const scoreElement = document.getElementById('gameScore');
        const wordsElement = document.getElementById('gameWords');
        
        if (!scoreElement || !wordsElement) return;
        
        // Get score and words from game variables
        let score = 0;
        let words = 0;
        
        if (typeof playerData !== 'undefined' && playerData.score !== undefined) {
            score = Math.floor(playerData.score);
        }
        
        if (typeof gameData !== 'undefined' && gameData.solve !== undefined) {
            words = gameData.solve.length;
        }
        
        // Update display (simple update, no animation needed due to frequent updates)
        const currentScore = parseInt(scoreElement.textContent.replace(/,/g, '')) || 0;
        const currentWords = parseInt(wordsElement.textContent.replace(/,/g, '')) || 0;
        
        if (currentScore !== score) {
            scoreElement.textContent = score.toLocaleString();
        }
        
        if (currentWords !== words) {
            wordsElement.textContent = words.toLocaleString();
        }
    }
    
    // Make functions globally accessible if needed
    window.updateSoundButtonState = updateSoundButtonState;
    window.updateGameStats = updateStats;
    
})();
