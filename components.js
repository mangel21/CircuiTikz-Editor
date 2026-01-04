/**
 * CircuiTikZ Component Definitions
 * Contains all component types with their SVG paths and CircuiTikZ mappings
 */

const COMPONENTS = {
    // ==========================================
    // MONOPOLES (Single-terminal components)
    // ==========================================
    monopoles: {
        name: "Grounds & Terminals",
        items: {
            ground: {
                name: "Ground",
                tikzName: "ground",
                terminals: [{ x: 0, y: -40, anchor: '' }],
                svg: `<path d="M0,-40 L0,0 M-20,0 L20,0 M-14,8 L14,8 M-7,16 L7,16" stroke="currentColor" stroke-width="2.5" fill="none"/>`,
                width: 40, height: 60
            },
            vcc: {
                name: "VCC",
                tikzName: "vcc",
                terminals: [{ x: 0, y: 40, anchor: '' }],
                svg: `<path d="M0,40 L0,10 M-15,10 L15,10 L0,-10 Z" stroke="currentColor" stroke-width="2.5" fill="none"/>`,
                width: 40, height: 60
            },
            vee: {
                name: "VEE",
                tikzName: "vee",
                terminals: [{ x: 0, y: -40, anchor: '' }],
                svg: `<path d="M0,-40 L0,-10 M-15,-10 L15,-10 L0,10 Z" stroke="currentColor" stroke-width="2.5" fill="none"/>`,
                width: 40, height: 60
            },
            antenna: {
                name: "Antenna",
                tikzName: "antenna",
                terminals: [{ x: 0, y: 40, anchor: '' }],
                svg: `<path d="M0,40 L0,0 M-15,-15 L0,0 L15,-15 M-15,-7 L15,-7" stroke="currentColor" stroke-width="2.5" fill="none"/>`,
                width: 40, height: 60
            }
        }
    },

    // ==========================================
    // BIPOLES - RESISTORS
    // ==========================================
    resistors: {
        name: "Resistors",
        styles: ["american", "european"],
        items: {
            resistor: {
                name: "Resistor",
                tikzName: "R",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-30,0 L-25,-8 L-15,8 L-5,-8 L5,8 L15,-8 L25,8 L30,0 L40,0" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 20
            },
            varResistor: {
                name: "Variable R",
                tikzName: "vR",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-30,0 L-25,-8 L-15,8 L-5,-8 L5,8 L15,-8 L25,8 L30,0 L40,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-20,15 L20,-15" stroke="currentColor" stroke-width="2"/><path d="M15,-15 L20,-15 L20,-10" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 40
            },
            potentiometer: {
                name: "Potentiometer",
                tikzName: "pR",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }, { x: 0, y: -20, anchor: 'wiper' }],
                svg: `<path d="M-40,0 L-30,0 L-25,-8 L-15,8 L-5,-8 L5,8 L15,-8 L25,8 L30,0 L40,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M0,-20 L0,-10 L-4,-14 M0,-10 L4,-14" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 40
            }
        }
    },

    // ==========================================
    // BIPOLES - CAPACITORS & INDUCTORS
    // ==========================================
    dynamics: {
        name: "Capacitors & Inductors",
        items: {
            capacitor: {
                name: "Capacitor",
                tikzName: "C",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-5,0 M5,0 L40,0" stroke="currentColor" stroke-width="2"/><path d="M-5,-15 L-5,15 M5,-15 L5,15" stroke="currentColor" stroke-width="2"/>`,
                width: 80, height: 30
            },
            polarCap: {
                name: "Electrolytic",
                tikzName: "eC",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-5,0 M5,0 L40,0" stroke="currentColor" stroke-width="2"/><path d="M-5,-15 L-5,15" stroke="currentColor" stroke-width="2"/><rect x="5" y="-15" width="4" height="30" fill="currentColor"/><text x="-18" y="-8" font-size="12" fill="currentColor">+</text>`,
                width: 80, height: 30
            },
            varCapacitor: {
                name: "Variable Cap",
                tikzName: "vC",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-5,0 M5,0 L30,0" stroke="currentColor" stroke-width="2"/><path d="M-5,-15 L-5,15 M5,-15 L5,15" stroke="currentColor" stroke-width="2"/><path d="M-15,12 L15,-12" stroke="currentColor" stroke-width="2"/><path d="M10,-12 L15,-12 L15,-7" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 60, height: 35
            },
            curvedCap: {
                name: "Curved Cap",
                tikzName: "cC",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-5,0 M5,0 L30,0" stroke="currentColor" stroke-width="2"/><path d="M-5,-15 L-5,15" stroke="currentColor" stroke-width="2"/><path d="M5,-15 Q12,0 5,15" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 60, height: 30
            },
            capSensor: {
                name: "Cap Sensor",
                tikzName: "sC",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }, { x: 0, y: -20, anchor: 'tip' }, { x: -10, y: 15, anchor: 'wiper' }],
                svg: `<path d="M-30,0 L-5,0 M5,0 L30,0" stroke="currentColor" stroke-width="2"/><path d="M-5,-15 L-5,15 M5,-15 L5,15" stroke="currentColor" stroke-width="2"/><path d="M0,-20 L0,-15" stroke="currentColor" stroke-width="2"/><path d="M0,-17 L3,-15 M0,-17 L-3,-15" stroke="currentColor" stroke-width="2"/><circle cx="-10" cy="12" r="3" fill="currentColor"/>`,
                width: 60, height: 40
            },
            piezoelectric: {
                name: "Piezoelectric",
                tikzName: "PZ",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-10,0 M10,0 L40,0" stroke="currentColor" stroke-width="2"/><rect x="-10" y="-12" width="20" height="24" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 30
            },
            cpe: {
                name: "CPE",
                tikzName: "cpe",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-10,0 M10,0 L40,0" stroke="currentColor" stroke-width="2"/><path d="M-10,-12 L-10,12 L10,0 Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10,-12 L10,12 L30,0 Z" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 30
            },
            ferroCap: {
                name: "Ferroelectric",
                tikzName: "feC",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-8,0 M8,0 L40,0" stroke="currentColor" stroke-width="2"/><path d="M-8,-15 L-8,15" stroke="currentColor" stroke-width="2"/><path d="M-3,-15 Q4,0 -3,15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3,-15 Q10,0 3,15" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 30
            },
            inductor: {
                name: "Inductor",
                tikzName: "L",
                terminals: [{ x: -40, y: 0, anchor: 'left' }, { x: 40, y: 0, anchor: 'right' }],
                svg: `<path d="M-40,0 L-25,0 C-25,-15 -15,-15 -15,0 C-15,-15 -5,-15 -5,0 C-5,-15 5,-15 5,0 C5,-15 15,-15 15,0 L40,0" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 80, height: 30
            }
        }
    },

    // ==========================================
    // BIPOLES - SOURCES
    // ==========================================
    sources: {
        name: "Sources",
        styles: ["american", "european", "classical"],
        items: {
            vsource: {
                name: "DC Voltage",
                tikzName: "vsource",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<circle cx="0" cy="0" r="15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0 M-8,0 L-2,0 M5,-3 L5,3 M2,0 L8,0" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 40
            },
            isource: {
                name: "DC Current",
                tikzName: "isource",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<circle cx="0" cy="0" r="15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0 M-10,0 L10,0 M5,-4 L10,0 L5,4" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 60, height: 40
            },
            battery: {
                name: "Battery",
                tikzName: "battery1",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-10,0 M10,0 L30,0 M-10,-15 L-10,15 M-4,-8 L-4,8 M2,-15 L2,15 M8,-8 L8,8" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 40
            },
            vsourceAC: {
                name: "AC source",
                tikzName: "sV",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<circle cx="0" cy="0" r="15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0 M-7,0 Q-3.5,-7 0,0 Q3.5,7 7,0" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 60, height: 40
            },
            fuse: {
                name: "Fuse",
                tikzName: "fuse",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<rect x="-15" y="-6" width="30" height="12" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0 M-15,0 L15,0" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 20
            },
            lamp: {
                name: "Lamp",
                tikzName: "lamp",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<circle cx="0" cy="0" r="15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-10.6,0 M10.6,0 L30,0 M-10.6,-10.6 L10.6,10.6 M-10.6,10.6 L10.6,-10.6" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 40
            }
        }
    },

    // ==========================================
    // DIODES
    // ==========================================
    diodes: {
        name: "Diodes",
        items: {
            diode: {
                name: "Diode",
                tikzName: "D",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-8,0 M8,0 L30,0" stroke="currentColor" stroke-width="2"/><polygon points="-8,-10 -8,10 8,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8,-10 L8,10" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 30
            },
            zener: {
                name: "Zener",
                tikzName: "zD",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-8,0 M8,0 L30,0" stroke="currentColor" stroke-width="2"/><polygon points="-8,-10 -8,10 8,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4,-10 L8,-10 L8,10 L12,10" stroke="currentColor" stroke-width="2" fill="none"/>`,
                width: 60, height: 30
            },
            led: {
                name: "LED",
                tikzName: "leD",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-8,0 M8,0 L30,0" stroke="currentColor" stroke-width="2"/><polygon points="-8,-10 -8,10 8,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8,-10 L8,10" stroke="currentColor" stroke-width="2"/><path d="M12,-12 L20,-20 M16,-20 L20,-20 L20,-16" stroke="currentColor" stroke-width="1.5"/><path d="M18,-8 L26,-16 M22,-16 L26,-16 L26,-12" stroke="currentColor" stroke-width="1.5"/>`,
                width: 60, height: 40
            },
            photodiode: {
                name: "Photodiode",
                tikzName: "pD",
                terminals: [{ x: -30, y: 0, anchor: 'left' }, { x: 30, y: 0, anchor: 'right' }],
                svg: `<path d="M-30,0 L-8,0 M8,0 L30,0" stroke="currentColor" stroke-width="2"/><polygon points="-8,-10 -8,10 8,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8,-10 L8,10" stroke="currentColor" stroke-width="2"/><path d="M-20,-20 L-12,-12 M-20,-20 L-16,-20 M-20,-20 L-20,-16" stroke="currentColor" stroke-width="1.5"/><path d="M-16,-16 L-8,-8 M-16,-16 L-12,-16 M-16,-16 L-16,-12" stroke="currentColor" stroke-width="1.5"/>`,
                width: 60, height: 40
            }
        }
    },

    // ==========================================
    // TRANSISTORS (Tripoles)
    // ==========================================
    transistors: {
        name: "Transistors",
        items: {
            // BJT Transistors
            npn: {
                name: "NPN",
                tikzName: "npn",
                category: "bjt",
                availableOptions: ['bulk', 'solderdot'],
                terminals: [{ x: -40, y: 0, anchor: 'B' }, { x: 0, y: -40, anchor: 'C' }, { x: 0, y: 40, anchor: 'E' }],
                svg: `<path d="M-40,0 L-6,0 M-6,-15 L-6,15" stroke="currentColor" stroke-width="3"/><path d="M-6,-8 L0,-25 L0,-40 M-6,8 L0,25 L0,40" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="0,25 -5,18 2,18" fill="currentColor"/>`,
                width: 50, height: 80
            },
            pnp: {
                name: "PNP",
                tikzName: "pnp",
                category: "bjt",
                availableOptions: ['bulk', 'solderdot'],
                terminals: [{ x: -40, y: 0, anchor: 'B' }, { x: 0, y: 40, anchor: 'C' }, { x: 0, y: -40, anchor: 'E' }],
                svg: `<path d="M-40,0 L-6,0 M-6,-15 L-6,15" stroke="currentColor" stroke-width="3"/><path d="M-6,8 L0,25 L0,40 M-6,-8 L0,-25 L0,-40" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="-6,-10 -2,-4 -8,-4" fill="currentColor"/>`,
                width: 50, height: 80
            },
            // MOSFET Transistors
            nmos: {
                name: "NMOS",
                tikzName: "nmos",
                category: "mosfet",
                availableOptions: ['bulk', 'solderdot', 'doublegate'],
                depletionVariant: 'nmosd',
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: -40, anchor: 'D' }, { x: 0, y: 40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-12,0 M-8,-20 L-8,20 M-4,-20 L-4,20 M-4,-15 L0,-15 L0,-40 M-4,15 L0,15 L0,40" stroke="currentColor" stroke-width="2.5" fill="none"/><polygon points="0,0 -8,-5 -8,5" fill="currentColor"/>`,
                width: 50, height: 80
            },
            pmos: {
                name: "PMOS",
                tikzName: "pmos",
                category: "mosfet",
                availableOptions: ['bulk', 'solderdot', 'doublegate'],
                depletionVariant: 'pmosd',
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: 40, anchor: 'D' }, { x: 0, y: -40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-16,0 M-8,-20 L-8,20 M-4,-20 L-4,20 M-4,-15 L0,-15 L0,-40 M-4,15 L0,15 L0,40" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="-12" cy="0" r="4" stroke="currentColor" fill="none"/><polygon points="-8,0 0,-5 0,5" fill="currentColor"/>`,
                width: 50, height: 80
            },
            nfet: {
                name: "N-FET",
                tikzName: "nfet",
                category: "fet",
                availableOptions: ['bulk', 'solderdot', 'doublegate'],
                depletionVariant: 'nfetd',
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: -40, anchor: 'D' }, { x: 0, y: 40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-15,0" stroke="currentColor" stroke-width="2.5"/><circle cx="-12" cy="0" r="3" fill="currentColor"/><path d="M-8,-20 L-8,20 M-4,-20 L-4,20" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M-4,-15 L0,-15 L0,-40 M-4,15 L0,15 L0,40" stroke="currentColor" stroke-width="2"/><polygon points="0,0 -8,-5 -8,5" fill="currentColor"/>`,
                width: 50, height: 80
            },
            pfet: {
                name: "P-FET",
                tikzName: "pfet",
                category: "fet",
                availableOptions: ['bulk', 'solderdot', 'doublegate'],
                depletionVariant: 'pfetd',
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: 40, anchor: 'D' }, { x: 0, y: -40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-15,0" stroke="currentColor" stroke-width="2.5"/><circle cx="-12" cy="0" r="3" fill="currentColor"/><path d="M-8,-20 L-8,20 M-4,-20 L-4,20" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M-4,-15 L0,-15 L0,-40 M-4,15 L0,15 L0,40" stroke="currentColor" stroke-width="2"/><polygon points="-8,0 0,-5 0,5" fill="currentColor"/>`,
                width: 50, height: 80
            },
            // JFET Transistors
            njfet: {
                name: "N-JFET",
                tikzName: "njfet",
                category: "jfet",
                availableOptions: [],
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: -40, anchor: 'D' }, { x: 0, y: 40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-8,0 M-8,-20 L-8,20" stroke="currentColor" stroke-width="3" fill="none"/><path d="M-8,-15 L0,-15 L0,-40 M-8,15 L0,15 L0,40" stroke="currentColor" stroke-width="2"/><polygon points="-12,0 -22,-7 -22,7" fill="currentColor"/>`,
                width: 50, height: 80
            },
            pjfet: {
                name: "P-JFET",
                tikzName: "pjfet",
                category: "jfet",
                availableOptions: [],
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: 40, anchor: 'D' }, { x: 0, y: -40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-8,0 M-8,-20 L-8,20" stroke="currentColor" stroke-width="3" fill="none"/><path d="M-8,15 L0,15 L0,40 M-8,-15 L0,-15 L0,-40" stroke="currentColor" stroke-width="2"/><polygon points="-22,0 -12,-7 -12,7" fill="currentColor"/>`,
                width: 50, height: 80
            },
            // IGBT Transistors
            nigbt: {
                name: "N-IGBT",
                tikzName: "nigbt",
                category: "igbt",
                availableOptions: ['bodydiode'],
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: -40, anchor: 'C' }, { x: 0, y: 40, anchor: 'E' }],
                svg: `<path d="M-40,0 L-10,0 M-14,-20 L-14,20 M-10,-20 L-10,20 M-6,-20 L-6,20" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M-6,-15 L0,-15 L0,-40 M-6,15 L0,15 L0,40" stroke="currentColor" stroke-width="2"/><polygon points="0,30 -6,22 1,22" fill="currentColor"/>`,
                width: 50, height: 80
            },
            pigbt: {
                name: "P-IGBT",
                tikzName: "pigbt",
                category: "igbt",
                availableOptions: ['bodydiode'],
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: 40, anchor: 'C' }, { x: 0, y: -40, anchor: 'E' }],
                svg: `<circle cx="-25" cy="0" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-40,0 L-29,0 M-14,-20 L-14,20 M-10,-20 L-10,20 M-6,-20 L-6,20" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M-6,15 L0,15 L0,40 M-6,-15 L0,-15 L0,-40" stroke="currentColor" stroke-width="2"/><polygon points="-6,-20 -2,-13 -8,-13" fill="currentColor"/>`,
                width: 50, height: 80
            },
            // HEMT
            hemt: {
                name: "HEMT",
                tikzName: "hemt",
                category: "fet",
                availableOptions: [],
                terminals: [{ x: -40, y: 0, anchor: 'G' }, { x: 0, y: -40, anchor: 'D' }, { x: 0, y: 40, anchor: 'S' }],
                svg: `<path d="M-40,0 L-8,0 M-8,-20 L-8,20" stroke="currentColor" stroke-width="3" fill="none"/><path d="M-8,-15 L0,-15 L0,-40 M-8,15 L0,15 L0,40" stroke="currentColor" stroke-width="2"/><circle cx="-8" cy="0" r="4" fill="currentColor"/>`,
                width: 50, height: 80
            }
        }
    },

    // ==========================================
    // OP-AMPS
    // ==========================================
    opamps: {
        name: "Op-Amps",
        items: {
            opamp: {
                name: "Op-Amp",
                tikzName: "op amp",
                terminals: [{ x: -40, y: -15, anchor: '-' }, { x: -40, y: 15, anchor: '+' }, { x: 40, y: 0, anchor: 'out' }],
                svg: `<polygon points="-25,-30 -25,30 25,0" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-40,-15 L-25,-15 M-40,15 L-25,15 M25,0 L40,0" stroke="currentColor" stroke-width="2"/><text x="-21" y="-11" font-size="12" fill="currentColor">−</text><text x="-21" y="19" font-size="12" fill="currentColor">+</text>`,
                width: 80, height: 60
            }
        }
    },

    // ==========================================
    // SWITCHES
    // ==========================================
    switches: {
        name: "Switches",
        items: {
            switchOpen: {
                name: "Switch",
                tikzName: "switch",
                terminals: [{ x: -30, y: 0 }, { x: 30, y: 0 }],
                svg: `<path d="M-30,0 L-10,0 M10,0 L30,0" stroke="currentColor" stroke-width="2"/><circle cx="-10" cy="0" r="3" stroke="currentColor" stroke-width="2" fill="currentColor"/><circle cx="10" cy="0" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-8,-2 L8,-12" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 30
            },
            pushButton: {
                name: "Push Button",
                tikzName: "push button",
                terminals: [{ x: -30, y: 0 }, { x: 30, y: 0 }],
                svg: `<path d="M-30,0 L-10,0 M10,0 L30,0" stroke="currentColor" stroke-width="2"/><circle cx="-10" cy="0" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="10" cy="0" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-10,-10 L10,-10 M0,-10 L0,-15" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 30
            }
        }
    },

    // ==========================================
    // METERS
    // ==========================================
    meters: {
        name: "Meters",
        items: {
            ammeter: {
                name: "Ammeter",
                tikzName: "ammeter",
                terminals: [{ x: -30, y: 0 }, { x: 30, y: 0 }],
                svg: `<circle cx="0" cy="0" r="15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0" stroke="currentColor" stroke-width="2"/><text x="0" y="5" font-size="14" font-weight="bold" text-anchor="middle" fill="currentColor">A</text>`,
                width: 60, height: 40
            },
            voltmeter: {
                name: "Voltmeter",
                tikzName: "voltmeter",
                terminals: [{ x: -30, y: 0 }, { x: 30, y: 0 }],
                svg: `<circle cx="0" cy="0" r="15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0" stroke="currentColor" stroke-width="2"/><text x="0" y="5" font-size="14" font-weight="bold" text-anchor="middle" fill="currentColor">V</text>`,
                width: 60, height: 40
            }
        }
    },

    // ==========================================
    // LOGIC GATES
    // ==========================================
    gates: {
        name: "Logic Gates",
        items: {
            andGate: {
                name: "AND Gate",
                tikzName: "and port",
                terminals: [{ x: -30, y: -10, anchor: 'in 1' }, { x: -30, y: 10, anchor: 'in 2' }, { x: 30, y: 0, anchor: 'out' }],
                svg: `<path d="M-15,-20 L-15,20 L0,20 Q20,20 20,0 Q20,-20 0,-20 L-15,-20" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,-10 L-15,-10 M-30,10 L-15,10 M20,0 L30,0" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 45
            },
            orGate: {
                name: "OR Gate",
                tikzName: "or port",
                terminals: [{ x: -30, y: -10, anchor: 'in 1' }, { x: -30, y: 10, anchor: 'in 2' }, { x: 30, y: 0, anchor: 'out' }],
                svg: `<path d="M-20,-20 Q-10,0 -20,20 Q0,20 20,0 Q0,-20 -20,-20" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,-10 L-17,-10 M-30,10 L-17,10 M20,0 L30,0" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 45
            },
            notGate: {
                name: "NOT Gate",
                tikzName: "not port",
                terminals: [{ x: -30, y: 0, anchor: 'in' }, { x: 30, y: 0, anchor: 'out' }],
                svg: `<polygon points="-15,-15 -15,15 12,0" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="16" cy="0" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M20,0 L30,0" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 40
            }
        }
    },

    // ==========================================
    // MISC
    // ==========================================
    misc: {
        name: "Miscellaneous",
        items: {
            fuse: {
                name: "Fuse",
                tikzName: "fuse",
                terminals: [{ x: -30, y: 0 }, { x: 30, y: 0 }],
                svg: `<rect x="-15" y="-8" width="30" height="16" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-15,0 M15,0 L30,0 M-10,0 L10,0" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 25
            },
            lamp: {
                name: "Lamp",
                tikzName: "lamp",
                terminals: [{ x: -30, y: 0 }, { x: 30, y: 0 }],
                svg: `<circle cx="0" cy="0" r="12" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-30,0 L-12,0 M12,0 L30,0 M-8,-8 L8,8 M-8,8 L8,-8" stroke="currentColor" stroke-width="2"/>`,
                width: 60, height: 30
            }
        }
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = COMPONENTS;
}
