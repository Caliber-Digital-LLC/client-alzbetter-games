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
    
    function createCardSVG(card, width = 90, height = 126) {
        const color = SUIT_COLORS[card.suit];
        const symbol = SUIT_SYMBOLS[card.suit];
        const rank = card.rank;
        
        // Adjust font sizes based on card size
        const rankFontSize = Math.round(width * 0.22);
        const suitFontSize = Math.round(width * 0.18);
        const centerPipSize = Math.round(width * 0.35);
        const smallPipSize = Math.round(width * 0.15);
        const cornerOffset = Math.round(width * 0.08);
        const radius = Math.round(width * 0.08);
        
        let centerContent = '';
        
        // For face cards, show large rank in center
        if (['J', 'Q', 'K'].includes(rank)) {
            centerContent = `
                <text x="${width/2}" y="${height/2 + rankFontSize * 0.35}" 
                    font-size="${rankFontSize * 1.8}" font-weight="bold" 
                    text-anchor="middle" fill="${color}">${rank}</text>
                <text x="${width/2}" y="${height/2 + rankFontSize * 0.9}" 
                    font-size="${centerPipSize * 0.8}" 
                    text-anchor="middle" fill="${color}">${symbol}</text>
            `;
        } else if (rank === 'A') {
            // Ace - large center pip
            centerContent = `
                <text x="${width/2}" y="${height/2 + centerPipSize * 0.35}" 
                    font-size="${centerPipSize * 1.5}" 
                    text-anchor="middle" fill="${color}">${symbol}</text>
            `;
        } else {
            // Number cards - pip pattern
            centerContent = generatePipPattern(rank, symbol, color, width, height, smallPipSize);
        }
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" 
                 width="100%" height="100%">
                <defs>
                    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15"/>
                    </filter>
                </defs>
                
                <!-- Card background -->
                <rect x="1" y="1" width="${width-2}" height="${height-2}" 
                    rx="${radius}" fill="var(--card-front, #fefefe)" 
                    stroke="var(--card-border, rgba(0,0,0,0.1))" stroke-width="1"
                    filter="url(#cardShadow)"/>
                
                <!-- Top-left corner -->
                <text x="${cornerOffset}" y="${cornerOffset + rankFontSize * 0.8}" 
                    font-size="${rankFontSize}" font-weight="bold" fill="${color}">${rank}</text>
                <text x="${cornerOffset}" y="${cornerOffset + rankFontSize + suitFontSize * 0.7}" 
                    font-size="${suitFontSize}" fill="${color}">${symbol}</text>
                
                <!-- Bottom-right corner (rotated) -->
                <g transform="rotate(180 ${width/2} ${height/2})">
                    <text x="${cornerOffset}" y="${cornerOffset + rankFontSize * 0.8}" 
                        font-size="${rankFontSize}" font-weight="bold" fill="${color}">${rank}</text>
                    <text x="${cornerOffset}" y="${cornerOffset + rankFontSize + suitFontSize * 0.7}" 
                        font-size="${suitFontSize}" fill="${color}">${symbol}</text>
                </g>
                
                <!-- Center content -->
                ${centerContent}
            </svg>
        `;
        
        return svg;
    }
    
    function generatePipPattern(rank, symbol, color, width, height, pipSize) {
        const value = parseInt(rank) || 0;
        const pips = [];
        const cx = width / 2;
        const topY = height * 0.25;
        const midY = height * 0.5;
        const botY = height * 0.75;
        const leftX = width * 0.28;
        const rightX = width * 0.72;
        
        // Pip positions for each card value
        const positions = {
            2: [[cx, topY], [cx, botY]],
            3: [[cx, topY], [cx, midY], [cx, botY]],
            4: [[leftX, topY], [rightX, topY], [leftX, botY], [rightX, botY]],
            5: [[leftX, topY], [rightX, topY], [cx, midY], [leftX, botY], [rightX, botY]],
            6: [[leftX, topY], [rightX, topY], [leftX, midY], [rightX, midY], [leftX, botY], [rightX, botY]],
            7: [[leftX, topY], [rightX, topY], [cx, height * 0.37], [leftX, midY], [rightX, midY], [leftX, botY], [rightX, botY]],
            8: [[leftX, topY], [rightX, topY], [cx, height * 0.37], [leftX, midY], [rightX, midY], [cx, height * 0.63], [leftX, botY], [rightX, botY]],
            9: [[leftX, height * 0.22], [rightX, height * 0.22], [leftX, height * 0.39], [rightX, height * 0.39], [cx, midY], [leftX, height * 0.61], [rightX, height * 0.61], [leftX, height * 0.78], [rightX, height * 0.78]],
            10: [[leftX, height * 0.2], [rightX, height * 0.2], [cx, height * 0.32], [leftX, height * 0.38], [rightX, height * 0.38], [leftX, height * 0.62], [rightX, height * 0.62], [cx, height * 0.68], [leftX, height * 0.8], [rightX, height * 0.8]]
        };
        
        const coords = positions[value] || [];
        coords.forEach(([x, y]) => {
            pips.push(`<text x="${x}" y="${y + pipSize * 0.35}" 
                font-size="${pipSize}" text-anchor="middle" fill="${color}">${symbol}</text>`);
        });
        
        return pips.join('\n');
    }
    
    function createCardBackSVG(width = 90, height = 126) {
        const radius = Math.round(width * 0.08);
        const patternSize = Math.round(width * 0.12);
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" 
                 width="100%" height="100%">
                <defs>
                    <pattern id="backPattern" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse">
                        <rect width="${patternSize}" height="${patternSize}" fill="var(--card-back, #2563eb)"/>
                        <circle cx="${patternSize/2}" cy="${patternSize/2}" r="${patternSize * 0.3}" 
                            fill="var(--card-back-pattern, #3b82f6)" opacity="0.5"/>
                    </pattern>
                    <filter id="backShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.2"/>
                    </filter>
                </defs>
                
                <!-- Card background -->
                <rect x="1" y="1" width="${width-2}" height="${height-2}" 
                    rx="${radius}" fill="url(#backPattern)" 
                    stroke="var(--card-back, #2563eb)" stroke-width="2"
                    filter="url(#backShadow)"/>
                
                <!-- Inner border -->
                <rect x="${width * 0.1}" y="${height * 0.07}" 
                    width="${width * 0.8}" height="${height * 0.86}" 
                    rx="${radius * 0.5}" fill="none" 
                    stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
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
