/* assets/generator.js */
// Deterministic idea generator with 4-year rule
class IdeaGenerator {
    constructor() {
        this.ideas = [];
        this.seed = 42;
        this.loadIdeas();
        this.templates = this.loadTemplates();
    }

    loadIdeas() {
        // Load existing ideas from database or default set
        this.ideas = [
            {
                id: 'AA-001',
                idea_title: 'Mascot Flash Mob',
                last_used_date: '2020-10-15T00:00:00Z',
                props_list: 'Boom box, confetti cannons',
                summary: 'Surprise flash mob during halftime'
            },
            {
                id: 'AA-002', 
                idea_title: 'Giant Flag Run',
                last_used_date: '2021-09-20T00:00:00Z',
                props_list: 'Giant flag, smoke machines',
                summary: 'Run through crowd with massive flag'
            }
        ];
    }

    loadTemplates() {
        return {
            settings: ['stadium', 'courtside', 'field center', 'crowd', 'entrance tunnel'],
            mechanics: ['dance', 'run', 'jump', 'wave', 'chant', 'throw', 'catch'],
            props: {
                Indoor: ['signs', 'foam fingers', 'pom poms', 'banners', 'confetti poppers'],
                Outdoor: ['flags', 'smoke bombs', 'fireworks', 'giant inflatables', 'parachutes']
            },
            twists: ['backward', 'in slow motion', 'synchronized', 'with opponent mascot', 'crowd participation'],
            crowds: [
                'Stand up and roar!',
                'Wave your hands!', 
                'Make some noise!',
                'Show your spirit!',
                'Let\'s go Bearcats!'
            ]
        };
    }

    generate(eventType, location, theme = '') {
        const results = [];
        this.resetSeed();

        for (let i = 0; i < 3; i++) {
            const idea = this.generateSingleIdea(eventType, location, theme);
            idea.status = this.checkFourYearRule(idea);
            
            if (idea.status === 'BLOCKED') {
                // Generate alternative
                idea.alternative = this.generateAlternative(idea, eventType, location);
            }
            
            results.push(idea);
        }

        return results;
    }

    generateSingleIdea(eventType, location, theme) {
        const setting = this.pick(this.templates.settings);
        const mechanic = this.pick(this.templates.mechanics);
        const props = this.pick(this.templates.props[location] || this.templates.props.Indoor);
        const twist = this.pick(this.templates.twists);
        const crowd = this.pick(this.templates.crowds);

        const title = `${this.capitalize(mechanic)} ${this.capitalize(twist)} with ${props}`;
        
        return {
            id: this.generateIdeaId(),
            idea_title: title,
            summary: `Bearcat performs ${mechanic} ${twist} at ${setting} using ${props} for ${eventType} event`,
            media_type: this.pickMediaType(),
            event_type: eventType,
            indoor_outdoor: location,
            props_list: props,
            costume_notes: 'Standard Bearcat costume' + (location === 'Outdoor' ? ' with weather protection' : ''),
            crowd_callouts: crowd,
            risk_checks: this.generateRiskChecks(location, props),
            delivery_plan: this.generateDeliveryPlan(setting, mechanic),
            tags: [eventType.toLowerCase(), location.toLowerCase(), theme].filter(Boolean),
            years_since_last_use: 0
        };
    }

    generateAlternative(blocked, eventType, location) {
        // Change core mechanic to create alternative
        const newMechanic = this.templates.mechanics.find(m => !blocked.idea_title.toLowerCase().includes(m));
        const setting = this.pick(this.templates.settings);
        const props = this.pick(this.templates.props[location] || this.templates.props.Indoor);
        
        return {
            idea_title: `${this.capitalize(newMechanic)} Performance with ${props}`,
            summary: `Alternative to blocked idea: ${newMechanic} at ${setting}`,
            props_list: props
        };
    }

    checkFourYearRule(idea) {
        const now = new Date();
        const fourYearsAgo = new Date();
        fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

        for (const existing of this.ideas) {
            const lastUsed = new Date(existing.last_used_date);
            
            if (lastUsed > fourYearsAgo) {
                const similarity = this.calculateSimilarity(idea, existing);
                if (similarity > 0.45) {
                    idea.originality_notes = `Similar to "${existing.idea_title}" (ID: ${existing.id}) used ${this.getYearsAgo(lastUsed)} years ago`;
                    return 'BLOCKED';
                }
            }
        }

        return 'FRESH';
    }

    calculateSimilarity(idea1, idea2) {
        const tokens1 = this.tokenize(idea1);
        const tokens2 = this.tokenize(idea2);
        
        const intersection = tokens1.filter(t => tokens2.includes(t));
        const union = [...new Set([...tokens1, ...tokens2])];
        
        return intersection.length / union.length;
    }

    tokenize(idea) {
        const text = [
            idea.idea_title,
            idea.summary,
            idea.props_list
        ].join(' ').toLowerCase();
        
        return text.match(/\w+/g) || [];
    }

    getYearsAgo(date) {
        const years = (new Date() - date) / (1000 * 60 * 60 * 24 * 365);
        return Math.round(years * 10) / 10;
    }

    generateRiskChecks(location, props) {
        const risks = [];
        
        if (location === 'Outdoor') {
            risks.push('Check weather conditions');
            risks.push('Secure props against wind');
        }
        
        if (props.includes('smoke') || props.includes('fireworks')) {
            risks.push('Fire safety clearance required');
            risks.push('Keep safe distance from crowd');
        }
        
        if (props.includes('confetti')) {
            risks.push('Plan cleanup crew');
        }
        
        return risks.join('; ') || 'Standard safety protocols';
    }

    generateDeliveryPlan(setting, mechanic) {
        const plans = {
            'dance': '1. Enter from tunnel, 2. Build energy with music, 3. Hit signature moves, 4. Crowd interaction',
            'run': '1. Start at baseline, 2. Sprint through predetermined path, 3. High-five fans, 4. Finish at center',
            'jump': '1. Position at key spot, 2. Build anticipation, 3. Execute jump, 4. Celebrate with crowd',
            'default': '1. Enter venue, 2. Perform action, 3. Engage crowd, 4. Exit with energy'
        };
        
        return plans[mechanic] || plans.default;
    }

    pickMediaType() {
        const types = ['Live_Skit', 'TikTok', 'Reel', 'Instagram_Post'];
        return this.pick(types);
    }

    generateIdeaId() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const prefix = letters[this.random(26)] + letters[this.random(26)];
        const number = String(this.random(999) + 1).padStart(3, '0');
        return `${prefix}-${number}`;
    }

    // Seeded random number generator (mulberry32)
    random(max = 1) {
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        const t = (this.seed += 0x6D2B79F5);
        const a = Math.imul(t ^ t >>> 15, 1 | t);
        const b = a ^ a + Math.imul(a ^ a >>> 7, 61 | a);
        const result = ((b ^ b >>> 14) >>> 0) / 4294967296;
        return Math.floor(result * max);
    }

    resetSeed() {
        // Use current date as seed for daily variation
        const today = new Date();
        this.seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    }

    pick(array) {
        return array[this.random(array.length)];
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
