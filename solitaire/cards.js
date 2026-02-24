/**
 * Cards.js - Deck generation and SVG card rendering
 * Pure SVG generation - no external images
 */

const Cards = (function() {
    'use strict';
    
    // ========================================================================
    // CONSTANTS
    // ========================================================================
    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const SUIT_SYMBOLS = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };
    const SUIT_COLORS = {
        hearts: 'var(--red-suit, #dc2626)',
        diamonds: 'var(--red-suit, #dc2626)',
        clubs: 'var(--black-suit, #1f2937)',
        spades: 'var(--black-suit, #1f2937)'
    };
    const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const RANK_VALUES = {
        'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
        '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
    };
    
    // ========================================================================
    // CRYPTO RNG
    // ========================================================================
    function cryptoRandom() {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    }
    
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(cryptoRandom() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // ========================================================================
    // DECK CREATION
    // ========================================================================
    function createDeck() {
        const deck = [];
        let id = 0;
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({
                    id: id++,
                    suit,
                    rank,
                    value: RANK_VALUES[rank],
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                    faceUp: false
                });
            }
        }
        return deck;
    }
    
    function shuffleDeck(deck) {
        return shuffleArray(deck);
    }
    
    // ========================================================================
    // CARD COMPATIBILITY CHECKS
    // ========================================================================
    function canStackOnTableau(card, targetCard) {
        if (!targetCard) {
            // Empty tableau - only Kings allowed
            return card.rank === 'K';
        }
        // Must be face up, alternating colors, one rank lower
        return targetCard.faceUp &&
               card.color !== targetCard.color &&
               card.value === targetCard.value - 1;
    }
    
    function canStackOnFoundation(card, targetCard, foundationSuit) {
        if (!targetCard) {
            // Empty foundation - only Aces allowed
            return card.rank === 'A';
        }
        // Must be same suit, one rank higher
        return card.suit === targetCard.suit &&
               card.value === targetCard.value + 1;
    }
    
    function isRed(card) {
        return card.color === 'red';
    }
    
    function isBlack(card) {
        return card.color === 'black';
    }
    
    // ========================================================================
    // SVG CARD RENDERING
    // ========================================================================
    // All cards use a fixed internal viewBox of 100×140 for consistent proportions.
    // The SVG is set to width="100%" height="100%" so CSS controls actual display size.
    
    function createCardSVG(card) {
        const color = SUIT_COLORS[card.suit];
        const symbol = SUIT_SYMBOLS[card.suit];
        const rank = card.rank;
        
        // Fixed internal coordinate space
        const VW = 100, VH = 140;
        
        let centerContent = '';
        
        if (['J', 'Q', 'K'].includes(rank)) {
            // Face cards: large rank letter centred in upper portion,
            // suit symbol centred in lower portion — well-separated, no overlap.
            centerContent = `
                <text x="50" y="72" font-size="52" font-weight="bold"
                    text-anchor="middle" dominant-baseline="middle"
                    fill="${color}" font-family="Georgia, 'Times New Roman', serif">${rank}</text>
                <text x="50" y="110" font-size="26"
                    text-anchor="middle" dominant-baseline="middle"
                    fill="${color}">${symbol}</text>
            `;
        } else if (rank === 'A') {
            // Ace: single large centred suit symbol
            centerContent = `
                <text x="50" y="78" font-size="60"
                    text-anchor="middle" dominant-baseline="middle"
                    fill="${color}">${symbol}</text>
            `;
        } else {
            // Number cards: pip grid that stays safely inside the pip zone
            centerContent = generatePipPattern(rank, symbol, color);
        }
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}"
                 width="100%" height="100%">
                <!-- Card background -->
                <rect x="1" y="1" width="${VW - 2}" height="${VH - 2}"
                    rx="7" fill="var(--card-front, #fefefe)"
                    stroke="var(--card-border, rgba(0,0,0,0.12))" stroke-width="1"/>

                <!-- Top-left corner: rank then suit -->
                <text x="6" y="20" font-size="19" font-weight="bold"
                    fill="${color}" font-family="Arial, Helvetica, sans-serif">${rank}</text>
                <text x="7" y="36" font-size="16" font-weight="bold"
                    fill="${color}" font-family="Arial, Helvetica, sans-serif">${symbol}</text>

                <!-- Bottom-right corner: rotated 180° around the card centre -->
                <g transform="rotate(180 50 70)">
                    <text x="6" y="20" font-size="19" font-weight="bold"
                        fill="${color}" font-family="Arial, Helvetica, sans-serif">${rank}</text>
                    <text x="7" y="36" font-size="16" font-weight="bold"
                        fill="${color}" font-family="Arial, Helvetica, sans-serif">${symbol}</text>
                </g>

                <!-- Centre content -->
                ${centerContent}
            </svg>
        `;
        
        return svg;
    }
    
    // Pip positions are expressed in the fixed 100×140 coordinate space.
    // Pip zone: roughly y = 48–122 (clear of both corner text areas).
    // Pips at leftX/rightX (x = 32/68) do NOT overlap the corner text (x ≤ 26).
    function generatePipPattern(rank, symbol, color) {
        const value = parseInt(rank) || 0;
        const pips = [];
        const cx = 50, L = 32, R = 68;
        // y anchor rows
        const t  = 54,  tm = 69,  m  = 83,  bm = 97,  b  = 112;
        const PIP = 22; // font-size for pip symbols (larger for readability)
        
        // Pip positions keyed by card value.
        // Using dominant-baseline="middle" so y is the visual centre of each pip.
        const pipMap = {
            2:  [[cx,t],                                  [cx,b]],
            3:  [[cx,t],           [cx,m],                [cx,b]],
            4:  [[L,t],[R,t],                             [L,b],[R,b]],
            5:  [[L,t],[R,t],      [cx,m],                [L,b],[R,b]],
            6:  [[L,t],[R,t],      [L,m],[R,m],           [L,b],[R,b]],
            7:  [[L,t],[R,t],[cx,tm],  [L,m],[R,m],       [L,b],[R,b]],
            8:  [[L,t],[R,t],[cx,tm],  [L,m],[R,m],[cx,bm],[L,b],[R,b]],
            9:  [[L,50],[R,50],[L,67],[R,67],[cx,m],[L,99],[R,99],[L,116],[R,116]],
            10: [[L,50],[R,50],[cx,63],[L,72],[R,72],[L,95],[R,95],[cx,107],[L,116],[R,116]]
        };
        
        const coords = pipMap[value] || [];
        coords.forEach(([x, y]) => {
            pips.push(
                `<text x="${x}" y="${y}" font-size="${PIP}"` +
                ` text-anchor="middle" dominant-baseline="middle"` +
                ` fill="${color}">${symbol}</text>`
            );
        });
        
        return pips.join('\n');
    }
    
    function createCardBackSVG() {
        // Fixed 100×140 coordinate space, same as createCardSVG
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"
                 width="100%" height="100%">
                <defs>
                    <pattern id="backPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                        <rect width="12" height="12" fill="var(--card-back, #2563eb)"/>
                        <circle cx="6" cy="6" r="3.5"
                            fill="var(--card-back-pattern, #3b82f6)" opacity="0.5"/>
                    </pattern>
                </defs>

                <!-- Card background with pattern -->
                <rect x="1" y="1" width="98" height="138"
                    rx="7" fill="url(#backPattern)"
                    stroke="var(--card-back, #2563eb)" stroke-width="2"/>

                <!-- Inner decorative border -->
                <rect x="8" y="8" width="84" height="124"
                    rx="4" fill="none"
                    stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
            </svg>
        `;
        
        return svg;
    }
    
    // ========================================================================
    // CARD ELEMENT CREATION
    // ========================================================================
    
    function createCardElement(card) {
        const el = document.createElement('div');
        el.className = 'card';
        el.dataset.cardId = card.id;
        el.dataset.suit = card.suit;
        el.dataset.rank = card.rank;
        el.dataset.value = card.value;
        el.dataset.color = card.color;
        
        updateCardElement(el, card);
        
        return el;
    }
    
    function updateCardElement(el, card) {
        if (card.faceUp) {
            el.innerHTML = createCardSVG(card);
            el.classList.remove('face-down');
        } else {
            el.innerHTML = createCardBackSVG();
            el.classList.add('face-down');
        }
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    return {
        SUITS,
        SUIT_SYMBOLS,
        RANKS,
        RANK_VALUES,
        
        createDeck,
        shuffleDeck,
        shuffleArray,
        cryptoRandom,
        
        canStackOnTableau,
        canStackOnFoundation,
        isRed,
        isBlack,
        
        createCardSVG,
        createCardBackSVG,
        createCardElement,
        updateCardElement
    };
})();

// Export for use in solitaire.js
window.Cards = Cards;
