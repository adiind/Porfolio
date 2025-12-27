
import { TimelineItem } from '../types';
import { TINKERVERSE_LOGO } from '../assets';

export const TIMELINE_DATA: TimelineItem[] = [
  {
    id: "pg-project",
    lane: 1,
    title: "P&G Design Project",
    company: "Northwestern",
    type: "corporate",
    subtype: 'role',
    start: "2025-09-01",
    end: "2025-12-31",
    summary: "Leading Hair-care UX Research & Prototyping initiative.",
    bullets: ["Conducted 8 in-home ethnographic studies & 16 central-site user visits.", "Developed high-fidelity physical-digital prototypes for executive review."],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Procter_%26_Gamble_logo.svg/2560px-Procter_%26_Gamble_logo.svg.png"
  },
  {
    id: "ms-edi",
    lane: 0,
    title: "MS Engineering Design Innovation",
    company: "Northwestern University",
    type: "education",
    subtype: 'role',
    start: "2025-01-01",
    end: "2025-12-31",
    summary: "Specializing in Human-Centered Design. Bridging the gap between engineering feasibility and user desirability.",
    bullets: ["Thesis: AI-Human collaboration in creative workflows."],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Northwestern_Wildcats_logo.svg/1200px-Northwestern_Wildcats_logo.svg.png",
    skills: ["Rapid Prototyping", "Service Design", "Interaction Design", "Physical Computing", "Ethnographic Research", "Figma"]
  },
  {
    id: "zomato",
    lane: 1,
    title: "Senior Product Analyst",
    company: "Zomato",
    type: "corporate",
    subtype: 'role',
    start: "2024-10-01",
    end: "2025-07-31",
    summary: "Optimizing Search & Discovery for millions of users.",
    bullets: ["Leveraged 1B+ social graph contacts to build recommendation engine.", "Reduced food waste by 50% via Hyperpure supply prediction models.", "Led cross-functional team of 6 engineers."],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png",
    themeColor: 'red',
    caseStudy: {
      title: "Food Rescue",
      summary: "Preventing food wastage by redirecting cancelled orders to nearby customers at discounted rates.",
      thumbnailUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Leafy%20Green.png",
      themeColor: 'red',
      slides: [
        {
          type: 'cover',
          title: 'Food Rescue',
          content: {
            subtitle: 'A real-time cancelled-order recovery feature in India’s Largest Food Delivery App',
            description: 'Reducing food wastage by enabling users to claim freshly prepared but unserved orders at a discounted price.',
            role: 'Adi Agarwal - Senior Product Analyst'
          }
        },
        {
          type: 'problem',
          title: 'Structural Breakdown',
          content: {
            stat: 'Zomato sees ~400,000 cancellations/month that lead to freshly prepared, perfectly edible meals being discarded.',
            stakeholders: [
              { name: 'Restaurants', icon: 'plate', points: ['Lost revenue and food cost on meals already prepared.', 'Faced operational friction when cancellations spiked unpredictably.'] },
              { name: 'Delivery Partners', icon: 'bike', points: ['Lost time and distance on mid-route cancellations.', 'Saw reduced effective earnings and increased trip churn.'] },
              { name: 'Users', icon: 'user', points: ['Genuine users incurred partial-refund losses.', 'A small segment exploited refund timings, adding to waste.'] }
            ]
          }
        },
        {
          type: 'solution',
          title: 'Final Solution',
          content: {
            steps: [
              { title: 'User Cancellation', desc: 'The cancellation triggers an instant re-pitch, excluding the original user’s vicinity.' },
              { title: 'Driver Rerouting', desc: 'The repitch travels outward along the driver’s route, always seeking the closest eligible buyer while the driver is fully compensated for any detour.' },
              { title: 'Food Rescued!', desc: 'The new buyer gets a freshly prepared meal delivered in minutes at a steep discount because it’s already cooked and already nearby.' }
            ]
          }
        },
        {
          type: 'impact',
          title: 'Media Coverage',
          content: {
            quotes: [
              { text: "Zomato has a new plan to stop food wastage, and how this ‘Flash Sale’ is good news for users.", source: "Times of India" },
              { text: "Zomato Launches ‘Rescue’ Service To Combat Food Wastage. How Does It Work?", source: "NDTV" },
              { text: "Zomato introduces Food Rescue initiative to reduce food wastage", source: "Verdict Foodservice" }
            ]
          }
        }
      ]
    }
  },
  {
    id: "jarvis-competition",
    lane: 2,
    title: "Jarvis Assistant",
    company: "IOT and Edge AI Electronics Design Contest Top 10 Winner",
    companyUrl: "https://circuitdigest.com/tags/iot-and-edge-ai-electronics-design-contest-2024",
    type: "competition",
    subtype: 'role',
    start: "2024-11-01",
    end: "2024-11-30",
    summary: "Award-winning DIY Voice Recognition Home Assistant built with Maixduino & MQTT.",
    bullets: [
      "Top 10 National Award Winner @ Circuit Digest & DigiKey Challenge.",
      "Integrated Voice Recognition, Motion Detection, and Home Assistant via MQTT.",
      "Designed custom 3D-printed enclosure and open-sourced the library."
    ],
    videoUrl: "https://www.youtube.com/watch?v=3aCWb3PsAQs",
    skills: ["AI", "3D Print", "IOT", "Maixduino", "MQTT", "Home Assistant", "C++", "Arduino"],
    projectLinks: [
      { label: "GitHub", url: "https://github.com/adiind/diy-jarvis" },
      { label: "Circuit Digest", url: "https://circuitdigest.com/microcontroller-projects/voice-controlled-smart-home-assistant" }
    ],
    extendedDescription: `Jarvis is an open-source, voice-controlled smart home assistant that integrates IoT and AI technologies to deliver a seamless and interactive smart home experience. Developed for the ASEAN-level Edge AI & IoT Challenge hosted by Circuit Digest and DigiKey, the project earned Top 10 award and received special praise for its innovative approach and detailed video demonstration.

The assistant leverages voice recognition, motion detection, and MQTT communication to interact with Home Assistant, allowing precise control of smart devices. With dynamic visual feedback, advanced voice commands, and a modular design, Jarvis bridges the gap between smart home technology and user accessibility. Its open-source nature invites experimentation and customization, empowering smart home enthusiasts to tailor it to their specific needs. Balancing affordability with advanced functionality, Jarvis exemplifies a scalable and adaptable solution in the smart home space.

The challenge was to create an Edge AI and IoT project using specific boards. Due to stock unavailability, I couldn’t get the display version of the Maixduino board. Instead, I used its onboard LEDs and an MQTT-connected LED strip for visual feedback. Leveraging the Maixduino’s AI capabilities, I designed it as a voice assistant with a PIR motion detector as a trigger—simply approach Jarvis, and it activates. Using an ESP32 for Wi-Fi connectivity, I integrated the system with my local Home Assistant setup, enabling it to control all my IoT devices through specific commands.

The entire microcontroller was programmed using Arduino, and I enhanced its functionality by releasing my own version of the library with improved algorithms. I also designed and 3D-printed a custom case for the board and its peripherals, which I supplied as part of the project. Given the challenge’s time constraints, I prioritized creating a complete and functional product. While this limited software optimization, the final outcome included fully working open-source code and 3D models, making it a comprehensive and accessible project.`
  },
  {
    id: "surya-kinetic-sun",
    lane: 2,
    title: "Surya",
    company: "Northwestern University",
    type: "project",
    subtype: "role",
    start: "2025-09-01",
    end: "2025-09-15",
    summary: "A kinetic time-synchronized sculpture with blooming mechanical flowers representing family across global time zones.",
    bullets: [
      "Designed and built a kinetic mandala sculpture with servo-driven flowers that open and close based on real-time sunrise cycles.",
      "Laser-cut layered geometry inspired by solar patterns; integrated custom electronics and precision servo control.",
      "Explored emotion-driven interaction design, translating time, distance, and connection into mechanical motion."
    ],
    skills: ["Interaction Design", "Physical Computing", "Laser Cutting", "Electronics", "Arduino", "Kinetic Sculpture", "Prototyping"],
    projectLinks: [
      { label: "Process Reel", url: "https://www.instagram.com/reel/DPm6dEjjCmO/?igsh=MXM4cHo0d2huZ3ZzMQ==" },
      { label: "Build Notes", url: "https://github.com/adiind/surya" }
    ],
    imageUrl: "https://i.ibb.co/5gWPHd62/IMG-1438.jpg",
    extendedDescription: "Surya is a kinetic installation created during the Engineering Design Innovation orientation at Northwestern. The prompt was to build something that represents 'True North.' For me, that direction pointed toward home. Living across time zones had made even small moments of connection feel delayed and fractured, so I set out to build a sculpture that could make time visible and shared again.\n\nThe final installation features a layered wooden mandala with mechanical flowers driven by micro-servos. Each flower represents a family member in a different part of the world. Using custom code and a precise calibration workflow, the petals open and close in sync with the light cycle of each time zone. The motion is slow and intentional, creating the sense of a living object responding to its own rhythm.\n\nThe most challenging part of the build was achieving smooth motion across all flowers. This required repeated rewiring, tuning of servo ranges, and refinements to torque compensation in the code. After a long night of debugging, the moment the first flower opened cleanly in sync with its programmed sunrise became the emotional turning point of the project. It shifted Surya from a technical prototype to a meaningful artifact that embodied the idea of staying connected across distance.\n\nBeyond its final form, Surya reflects my approach to design: translating abstract feelings into tangible interactions, blending engineering precision with expressive gesture, and using motion as a medium for storytelling. It was an early example of how I embed emotion into mechanical systems and create objects that communicate through behavior rather than screens."
  },
  {
    id: "plotter-vignette",
    lane: 2,
    title: "Vignette — The Plotter That Drew My Voice",
    company: "Personal Reflection",
    type: "vignette",
    subtype: "role",
    start: "2025-06-01",
    end: "2025-06-15",
    summary: "Reflecting on the imperfect translation of voice to physical form.",
    bullets: [],
    imageUrl: "https://i.ibb.co/v6nVSTw9/IMG-8392-2.jpg",
    extendedDescription: `I had been troubleshooting the speech to text pipeline for most of the evening. The audio model worked by itself and the plotter worked by itself, but getting them to talk to each other felt impossible. The first few attempts produced empty G-code files, then random symbols, then nothing at all. I kept adjusting the preprocessing, fixing small bugs, and sending new commands to the ESP32, hoping the pen would finally move the way it was supposed to.

Eventually, I tried again. I said a simple word into the microphone, waited for the conversion to finish, watched the G-code appear, and sent it to the plotter. The pen lifted, moved across the frame, touched the paper, and drew something that looked vaguely like the word I had spoken. It was mirrored and incomplete. The last stroke stopped early. But it was still clearly my voice translated into a physical mark on the page.

That moment changed the project for me. Until then, it had been a technical problem that needed to be solved. Once I saw my spoken word appear as a line drawing, even in an imperfect form, the work began to feel more expressive. The machine was no longer just executing instructions. It was capturing something personal and giving it form.

Since then, I have been thinking about how tools can help people express themselves in ways they do not expect. The flawed drawing on the paper reminded me that expression does not need to be perfect to be meaningful. Sometimes the imperfections are what make it feel human.`
  },
  {
    id: "udaan",
    lane: 1,
    title: "Product Analyst",
    company: "Udaan",
    type: "corporate",
    subtype: 'role',
    start: "2023-02-01",
    end: "2024-09-30",
    summary: "Supply Chain Algorithms & Network Design.",
    bullets: ["Scaled Wondermart from city to country operations.", "Built real-time pipelines for 1000+ stakeholders."],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Udaanlogo.png",
    themeColor: 'orange',
    caseStudy: {
      title: "Unified Procurement Reporting",
      summary: "A system built to bring clarity, speed, and trust to India-wide procurement reporting.",
      thumbnailUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Decreasing.png",
      themeColor: 'orange',
      slides: [
        {
          type: 'cover',
          title: 'Unified Procurement Reporting',
          content: {
            subtitle: 'Dashboard System for Udaan’s B2B Supply Chain',
            description: 'A system built to bring clarity, speed, and trust to India-wide procurement reporting after a complete supply-chain restructuring.',
            role: 'Adi Agarwal - Product Analyst'
          }
        },
        {
          type: 'problem-statement',
          title: 'Context & Challenge',
          content: {
            context: 'When Udaan unified its supply chain verticals, existing reporting collapsed under inconsistent metrics, broken data links, and manual spreadsheets. Leaders lacked a single, reliable picture of stock availability or business impact.',
            painPoints: [
              { title: 'Fragmented Visibility', desc: 'Procurement visibility across thousands of SKUs and 50 regions became fragmented.' },
              { title: 'The "Why"', desc: 'Leaders lacked a single, reliable picture of stock availability.' }
            ],
            challenges: [
              'Align three verticals (FMCG, Pharma, Pulses) under one KPI language',
              'Remain usable by both directors and on-ground teams',
              'Refresh fast enough for hourly warehousing decisions'
            ]
          }
        },
        {
          type: 'process-role',
          title: 'Strategy',
          content: {
            goals: ['Simplify KPIs', '3 Distinct Verticals', 'Top Down Drilling', 'Bottom Up Usage', 'Hourly Refresh'],
            role: [
              { title: 'Decode Needs', desc: 'Interviewed directors & PMs to define "availability" and "impact". Converted into company-wide KPI formulas.' },
              { title: 'Build Data Engine', desc: 'Created 7 asynchronous ETL pipelines for near real-time refresh using SQL and data engineering.' },
              { title: 'Redesign UX', desc: 'Rebuilt dashboards in PowerBI with consistent navigation and branded color themes.' },
              { title: 'Overhaul Toolchain', desc: 'Migrated from Google Data Studio to PowerBI, optimizing refresh triggers.' }
            ]
          }
        },
        {
          type: 'system-architecture',
          title: 'System In Action',
          content: {
            features: [
              { title: 'Daily Operations', desc: 'All three dashboards became source-of-truth venues for morning standups. Regional pods relied on live views instead of static Excel reports.' },
              { title: 'Technical Backbone', desc: '7 async ETL pipelines for fast, low-cost refreshes. Hourly updates mapped to warehouse inbound activity.' },
              { title: 'Operational Shift', desc: 'After restructuring reduced manpower to 10%, the system allowed small pod-style teams to sustain national operations.' }
            ],
            visualCues: [
              { name: 'Pacman', context: 'Pulses' },
              { name: 'Mario', context: 'FMCG' },
              { name: 'Sonic', context: 'Pharma' }
            ]
          }
        },
        {
          type: 'outcomes',
          title: 'Outcomes',
          content: {
            kpis: [
              { name: 'Availability %', def: '#In-Stock / #Total Products', purpose: 'Shows supply-chain health' },
              { name: 'GMV Impact %', def: 'Availability × weighted average of last month’s GMV', purpose: 'Shows business consequence' }
            ],
            highlights: [
              'National overview + Hero SKUs highlighted',
              'Live update time always visible',
              'Filters placed top-center for immediate slicing',
              'SKU-level tables downloadable for Excel'
            ]
          }
        },
        {
          type: 'reflection',
          title: 'Reflection',
          content: {
            points: [
              'This project started as a data cleanup task but evolved into a study of how design translates trust in data.',
              'Dashboard Changed Decision-Making altogether, leadership reviews began directly in dashboards.',
              'By merging engineering precision with human-centered visual language, Udaan’s procurement dashboard became a living, shared system.',
              'Not just improving viewing performance, but aligning every team on what performance means.'
            ]
          }
        }
      ]
    }
  },
  {
    id: "snapdeal",
    lane: 1,
    title: "Data Analyst",
    company: "Snapdeal",
    type: "corporate",
    subtype: 'role',
    start: "2020-06-01",
    end: "2022-09-30",
    summary: "Ad-Revenue & Infrastructure.",
    bullets: ["Automated warehouse forecasting.", "Increased Ad Revenue by 14%."],
    award: {
      title: "Above and Beyond",
      summary: "Awarded for exceptional contribution to the Ad-Tech revenue optimization project.",
      icon: "trophy"
    },
    featureCards: [
      {
        title: "Seller Ads Intelligence System",
        subtitle: "Analytics Owner",
        summary: "Launched analytics foundation powering CPC, CPT, & banner ad products. Automated revenue attribution & forecasting driving ad bidding logic.",
        expandedSummary: "Owned analytics and data pipelines for Snapdeal’s seller advertising systems, supporting performance measurement, pricing evaluation, experiments and seller ROI understanding across multiple ad formats.",
        pills: [
          { label: "CPC", description: "Cost Per Click. Advertisers are charged only when a user clicks on their ad." },
          { label: "CPT", description: "Cost Per Transaction. Advertisers pay a commission only when a sale occurs." },
          { label: "Banner Ads", description: "High-visibility visual placements on the homepage and category pages." }
        ],
        details: [
          "End-to-end ownership of data pipelines powering seller ads analytics",
          "Defining and maintaining core performance metrics beyond surface-level CTR",
          "Analyzing pricing and performance patterns across CPT, CPC, and banner ads",
          "Supporting internal product and business decisions around ad effectiveness",
          "Upkeep of algo pipelines that charge individual seller, audit with finance team"
        ]
      },
      {
        title: "First-Party Warehousing Setup",
        subtitle: "Analytics Owner",
        summary: "Contributed to Snapdeal’s first attempt at first-party warehousing, focusing on analytics and data systems supporting procurement automation.",
        expandedSummary: "Contributed to Snapdeal’s first attempt at first-party warehousing, focusing on analytics and data systems supporting procurement automation, inventory visibility, and operational decision-making.",
        pills: [
          { label: "Warehousing", description: "Optimization of physical storage, layout, and fulfillment center operations." },
          { label: "Procurement", description: "Automated purchasing workflows and supplier management systems." },
          { label: "Inventory", description: "Real-time stock tracking and SKU-level availability analysis." }
        ],
        details: [
          "Working on analytics for Snapdeal-owned inventory instead of pure seller fulfillment",
          "Supporting automated procurement and inventory tracking workflows",
          "Analyzing warehouse- and SKU-level patterns affecting availability and fulfillment"
        ]
      }
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Snapdeal-Logo.png"
  },
  {
    id: "tinkerverse",
    lane: 2,
    title: "Founder & Creator",
    company: "Tinker Verse",
    type: "personal",
    subtype: 'role',
    start: "2024-02-01",
    end: "2025-12-31",
    summary: "Design, Hardware & Storytelling.",
    bullets: ["Voice-controlled home assistant.", "Generative drawing plotter."],
    logoUrl: TINKERVERSE_LOGO
  },
  {
    id: "rightbiotic",
    lane: 2,
    title: "Product Lead",
    company: "Rightbiotic",
    type: "foundational",
    subtype: 'role',
    start: "2019-09-01",
    end: "2020-05-30",
    summary: "Medical Device Design.",
    bullets: ["Antimicrobial Resistance Analyzer.", "65% volume reduction."]
  },
  {
    id: "bits",
    lane: 0,
    title: "MSc Bio Science + B.Tech Civil Engineering",
    company: "BITS Pilani",
    type: "education",
    subtype: 'role',
    start: "2016-08-01",
    end: "2021-05-30",
    summary: "Dual Degree. Integrated Masters.",
    bullets: ["TEDx Stage Design Head."],
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/d/d3/BITS_Pilani-Logo.svg",

  }
];
