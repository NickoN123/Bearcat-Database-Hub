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
                summary: 'Surprise flash mob during halftime',
                event_type: 'Football'
            },
            {
                id: 'AA-002', 
                idea_title: 'Giant Flag Run',
                last_used_date: '2021-09-20T00:00:00Z',
                props_list: 'Giant flag, smoke machines',
                summary: 'Run through crowd with massive flag',
                event_type: 'Football'
            }
        ];
    }

    loadTemplates() {
        return {
            // Event-specific settings
            eventSettings: {
                Football: ['endzone', 'sideline', '50-yard line', 'student section', 'tunnel entrance'],
                Basketball: ['center court', 'baseline', 'student section', 'upper deck', 'court entrance'],
                Volleyball: ['net area', 'service line', 'team bench', 'crowd walkway'],
                Soccer: ['goal area', 'midfield', 'corner flag', 'sideline'],
                Baseball: ['home plate', 'pitcher mound', 'outfield', 'dugout', 'first base line'],
                Pep_Rally: ['stage center', 'crowd front', 'stage wings', 'audience aisles'],
                Community_Event: ['booth area', 'main stage', 'kids zone', 'entrance area'],
                Campus_Activation: ['quad center', 'library steps', 'student union', 'campus green'],
                Other: ['venue center', 'main area', 'entrance', 'crowd zone']
            },
            
            // Event-specific mechanics
            eventMechanics: {
                Football: ['charge', 'flex', 'pump up', 'lead cheer', 'flag wave', 'pushups after score'],
                Basketball: ['dunk attempt', 'dance off', 'half-court shot', 'crowd wave', 'free throw distraction'],
                Volleyball: ['serve mimic', 'spike celebration', 'dig demonstration', 'net dance'],
                Soccer: ['goal celebration', 'keeper save', 'corner kick routine', 'scarf wave'],
                Baseball: ['bat swing', 'home run trot', 'seventh inning stretch', 'rally cap'],
                Pep_Rally: ['speech hype', 'crowd chant', 'spirit competition', 'coordinated dance'],
                Community_Event: ['high fives', 'photo ops', 'mini games', 'prize giveaway'],
                Campus_Activation: ['selfie station', 'flash mob', 'chalk art', 'free hugs'],
                Other: ['dance', 'interact', 'perform', 'energize']
            },
            
            // Event-specific props
            eventProps: {
                Football: {
                    Indoor: ['foam fingers', 'thunder sticks', 'signs', 'megaphone'],
                    Outdoor: ['smoke machines', 'flags', 'fireworks', 'giant football', 'cannon']
                },
                Basketball: {
                    Indoor: ['mini hoop', 'oversized basketball', 'noise makers', 't-shirt cannon'],
                    Outdoor: ['portable hoop', 'chalk', 'speakers', 'banners']
                },
                Volleyball: {
                    Indoor: ['oversized volleyball', 'net prop', 'pom poms', 'signs'],
                    Outdoor: ['beach balls', 'portable net', 'flags', 'megaphone']
                },
                Soccer: {
                    Indoor: ['mini goal', 'soccer ball', 'scarves', 'drums'],
                    Outdoor: ['smoke bombs', 'giant soccer ball', 'flags', 'confetti cannons']
                },
                Baseball: {
                    Indoor: ['foam baseballs', 'bat prop', 'glove', 'rally towels'],
                    Outdoor: ['hot dog cannon', 'giant mitt', 'base props', 'organ prop']
                },
                Pep_Rally: {
                    Indoor: ['confetti', 'streamers', 'glow sticks', 'signs', 'megaphone'],
                    Outdoor: ['smoke machines', 'fireworks', 'giant banner', 'sound system']
                },
                Community_Event: {
                    Indoor: ['balloons', 'prize wheel', 'photo props', 'giveaway items'],
                    Outdoor: ['tent', 'inflatables', 'games', 'mascot mobile']
                },
                Campus_Activation: {
                    Indoor: ['free merch', 'photo booth props', 'interactive games', 'tablets'],
                    Outdoor: ['chalk', 'frisbees', 'bubble machines', 'giant jenga']
                },
                Other: {
                    Indoor: ['signs', 'pom poms', 'noisemakers', 'props'],
                    Outdoor: ['flags', 'megaphone', 'confetti', 'banners']
                }
            },
            
            // Event-specific crowd chants
            eventChants: {
                Football: [
                    'DEFENSE! DEFENSE!',
                    'Let\'s go BEARCATS!',
                    'TOUCHDOWN! Stand up and shout!',
                    'C-A-T-S CATS CATS CATS!',
                    'Show me that Bearcat ROAR!'
                ],
                Basketball: [
                    'DE-FENSE! *clap clap*',
                    'Let\'s go Cats! *clap clap clap-clap-clap*',
                    'BEARCATS... FIGHT!',
                    'Three! Three! Three!',
                    'Get loud, Bearcat Nation!'
                ],
                Volleyball: [
                    'ACE! ACE! ACE!',
                    'Side out! *clap clap*',
                    'SPIKE IT!',
                    'Block that ball!',
                    'Go Bearcats, take the set!'
                ],
                Soccer: [
                    'Ole, ole, ole, ole! BEARCATS!',
                    'We want a GOAL!',
                    'Defense! Hold the line!',
                    'Let\'s go Cincy!',
                    'Red and Black Attack!'
                ],
                Baseball: [
                    'Let\'s go Cats, let\'s go! *clap clap*',
                    'CHARGE!',
                    'Strike \'em out!',
                    'Home run! Home run!',
                    'Rally time, Bearcats!'
                ],
                Pep_Rally: [
                    'We are... UC!',
                    'Bearcat Pride, campus wide!',
                    'Louder! LOUDER!',
                    'Show your spirit!',
                    'Who rocks the house? BEARCATS!'
                ],
                Community_Event: [
                    'Welcome to Bearcat Nation!',
                    'Cincy pride!',
                    'Join the fun!',
                    'Let\'s celebrate together!',
                    'Bearcat family!'
                ],
                Campus_Activation: [
                    'Go Bearcats!',
                    'UC and proud!',
                    'Join the movement!',
                    'Bearcat strong!',
                    'Campus spirit!'
                ],
                Other: [
                    'Let\'s go Bearcats!',
                    'Make some noise!',
                    'Show your spirit!',
                    'Bearcat pride!',
                    'Get loud!'
                ]
            },
            
            twists: ['backward', 'in slow motion', 'synchronized with crowd', 'with opponent mascot', 'with surprise guest', 'in costume change', 'with props reveal'],
            
            themes: {
                retro: ['80s style', '90s throwback', 'disco era', 'old school'],
                rivalry: ['vs opponent', 'battle style', 'competitive', 'showdown'],
                kids: ['kid-friendly', 'educational', 'silly', 'cartoon-style'],
                alumni: ['nostalgia', 'tradition', 'legacy', 'homecoming'],
                meme: ['viral dance', 'TikTok trend', 'internet famous', 'social media'],
                holiday: ['seasonal', 'festive', 'themed costume', 'special occasion']
            }
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
        // Get event-specific templates
        const settings = this.templates.eventSettings[eventType] || this.templates.eventSettings.Other;
        const mechanics = this.templates.eventMechanics[eventType] || this.templates.eventMechanics.Other;
        const props = this.templates.eventProps[eventType]?.[location] || 
                     this.templates.eventProps.Other[location] ||
                     this.templates.eventProps.Other.Indoor;
        const chants = this.templates.eventChants[eventType] || this.templates.eventChants.Other;
        
        const setting = this.pick(settings);
        const mechanic = this.pick(mechanics);
        const propList = this.pickMultiple(props, 2, 3);
        const twist = this.pick(this.templates.twists);
        const chant = this.pick(chants);
        
        // Add theme modifier if provided
        let themeModifier = '';
        if (theme && this.templates.themes[theme]) {
            const themeStyle = this.pick(this.templates.themes[theme]);
            themeModifier = ` (${themeStyle})`;
        }

        const title = `${this.capitalize(mechanic)} ${twist}${themeModifier}`;
        
        // Generate beat sheet
        const beats = this.generateBeatSheet(eventType, setting, mechanic, propList, twist);
        
        return {
            id: this.generateIdeaId(),
            idea_title: title,
            summary: `${eventType} activation: Bearcat performs ${mechanic} ${twist} at ${setting} using ${propList.join(', ')}${themeModifier}`,
            media_type: this.pickMediaType(eventType),
            event_type: eventType,
            indoor_outdoor: location,
            props_list: propList.join(', '),
            costume_notes: this.generateCostumeNotes(eventType, location, theme),
            crowd_callouts: chant,
            risk_checks: this.generateRiskChecks(location, propList.join(', '), eventType),
            delivery_plan: this.generateDeliveryPlan(eventType, setting, mechanic, beats),
            beat_sheet: beats,
            tags: [eventType.toLowerCase(), location.toLowerCase(), theme].filter(Boolean),
            years_since_last_use: 0,
            trend_source: theme === 'meme' ? this.generateTrendSource() : null
        };
    }

    generateBeatSheet(eventType, setting, mechanic, props, twist) {
        const beats = [];
        
        // Opening
        beats.push(`Enter from ${setting} with ${props[0]}`);
        
        // Build up
        if (eventType === 'Football' || eventType === 'Basketball') {
            beats.push('Pump up the crowd with gestures');
            beats.push(`Start ${mechanic} routine`);
        } else if (eventType === 'Community_Event' || eventType === 'Campus_Activation') {
            beats.push('Greet families and kids');
            beats.push(`Begin interactive ${mechanic}`);
        } else {
            beats.push('Build energy with movement');
            beats.push(`Initiate ${mechanic}`);
        }
        
        // Climax
        beats.push(`Execute main move ${twist}`);
        if (props.length > 1) {
            beats.push(`Reveal ${props[1]} for surprise element`);
        }
        
        // Crowd interaction
        beats.push('Engage crowd for participation');
        
        // Finale
        beats.push(`Big finish with ${mechanic} climax`);
        beats.push('Exit with energy or transition to next segment');
        
        return beats;
    }

    generateCostumeNotes(eventType, location, theme) {
        let notes = ['Standard Bearcat costume'];
        
        // Weather considerations
        if (location === 'Outdoor') {
            notes.push('weather-appropriate gear');
        }
        
        // Event-specific additions
        const eventCostumes = {
            Football: 'mini jersey over costume',
            Basketball: 'basketball shorts accessory',
            Baseball: 'baseball cap addition',
            Soccer: 'scarf accessory',
            Pep_Rally: 'extra sparkly elements',
            Community_Event: 'approachable, less intimidating look',
            Campus_Activation: 'school colors prominent',
            Holiday: 'seasonal accessories'
        };
        
        if (eventCostumes[eventType]) {
            notes.push(eventCostumes[eventType]);
        }
        
        // Theme additions
        if (theme === 'retro') {
            notes.push('retro accessories (headband, wristbands)');
        } else if (theme === 'holiday') {
            notes.push('holiday-themed additions');
        }
        
        return notes.join(', ');
    }

    generateRiskChecks(location, props, eventType) {
        const risks = [];
        
        // Location risks
        if (location === 'Outdoor') {
            risks.push('Check weather conditions');
            risks.push('Secure props against wind');
        }
        
        // Prop-specific risks
        if (props.includes('smoke') || props.includes('fireworks')) {
            risks.push('Fire safety clearance required');
            risks.push('Maintain safe distance from crowd');
        }
        
        if (props.includes('cannon') || props.includes('launcher')) {
            risks.push('Test trajectory before event');
            risks.push('Clear landing zone');
        }
        
        if (props.includes('confetti')) {
            risks.push('Arrange cleanup crew');
        }
        
        // Event-specific risks
        if (eventType === 'Basketball' || eventType === 'Volleyball') {
            risks.push('Stay clear of playing surface during game');
        } else if (eventType === 'Community_Event') {
            risks.push('Extra care around children');
            risks.push('Maintain appropriate interaction boundaries');
        }
        
        return risks.join('; ') || 'Standard safety protocols apply';
    }

    generateDeliveryPlan(eventType, setting, mechanic, beats) {
        const timing = {
            Football: 'During TV timeout or quarter break',
            Basketball: 'Timeout or halftime',
            Volleyball: 'Between sets',
            Soccer: 'Halftime',
            Baseball: 'Between innings',
            Pep_Rally: 'Scheduled segment',
            Community_Event: 'Ongoing throughout event',
            Campus_Activation: 'Peak foot traffic times',
            Other: 'As scheduled'
        };
        
        return `
Timing: ${timing[eventType] || timing.Other}
Location: Start at ${setting}
Duration: 2-3 minutes
Beat Sheet:
${beats.map((beat, i) => `${i + 1}. ${beat}`).join('\n')}
Exit: High energy, leave crowd wanting more`;
    }

    pickMediaType(eventType) {
        // Event-appropriate media types
        const mediaPreferences = {
            Football: ['Live_Skit', 'Instagram_Post'],
            Basketball: ['Live_Skit', 'TikTok'],
            Volleyball: ['Live_Skit', 'Reel'],
            Soccer: ['Live_Skit', 'Instagram_Post'],
            Baseball: ['Live_Skit', 'Photo_Concept'],
            Pep_Rally: ['Live_Skit', 'YouTube_Hype'],
            Community_Event: ['Photo_Concept', 'Instagram_Post'],
            Campus_Activation: ['TikTok', 'Reel'],
            Other: ['Live_Skit', 'Instagram_Post']
        };
        
        const options = mediaPreferences[eventType] || mediaPreferences.Other;
        return this.pick(options);
    }

    generateTrendSource() {
        const trends = [
            'TikTok dance challenge',
            'Viral meme format',
            'Popular audio trend',
            'Instagram Reels trend',
            'Twitter moment',
            'YouTube shorts trend'
        ];
        return this.pick(trends);
    }

    generateAlternative(blocked, eventType, location) {
        // Get event-specific options
        const mechanics = this.templates.eventMechanics[eventType] || this.templates.eventMechanics.Other;
        const props = this.templates.eventProps[eventType]?.[location] || this.templates.eventProps.Other[location];
        
        // Find different mechanic
        const newMechanic = mechanics.find(m => !blocked.idea_title.toLowerCase().includes(m.toLowerCase())) || 'perform';
        const setting = this.pick(this.templates.eventSettings[eventType] || this.templates.eventSettings.Other);
        const newProps = this.pickMultiple(props.filter(p => !blocked.props_list.includes(p)), 2, 3);
        
        return {
            idea_title: `Alternative: ${this.capitalize(newMechanic)} Performance`,
            summary: `Alternative to blocked idea: ${newMechanic} at ${setting} with ${newProps.join(', ')}`,
            props_list: newProps.join(', '),
            event_type: eventType
        };
    }

    checkFourYearRule(idea) {
        const now = new Date();
        const fourYearsAgo = new Date();
        fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

        for (const existing of this.ideas) {
            const lastUsed = new Date(existing.last_used_date);
            
            if (lastUsed > fourYearsAgo) {
                // Check if same event type for more strict matching
                const sameEvent = existing.event_type === idea.event_type;
                const similarity = this.calculateSimilarity(idea, existing);
                const threshold = sameEvent ? 0.35 : 0.45; // Lower threshold for same event
                
                if (similarity > threshold) {
                    idea.originality_notes = `Similar to "${existing.idea_title}" (ID: ${existing.id}, ${existing.event_type}) used ${this.getYearsAgo(lastUsed)} years ago`;
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
            idea.props_list,
            idea.event_type
        ].join(' ').toLowerCase();
        
        return text.match(/\w+/g) || [];
    }

    getYearsAgo(date) {
        const years = (new Date() - date) / (1000 * 60 * 60 * 24 * 365);
        return Math.round(years * 10) / 10;
    }

    // Helper methods
    pickMultiple(array, min = 2, max = 3) {
        const count = min + this.random(max - min + 1);
        const results = [];
        const available = [...array];
        
        for (let i = 0; i < count && available.length > 0; i++) {
            const index = this.random(available.length);
            results.push(available[index]);
            available.splice(index, 1);
        }
        
        return results;
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
