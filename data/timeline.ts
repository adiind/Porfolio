
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
    skills: [
      { label: "Rapid Prototyping", description: "Quickly building functional models to test and iterate on ideas." },
      { label: "Service Design", description: "Designing end-to-end experiences across touchpoints and stakeholders." },
      { label: "Interaction Design", description: "Crafting intuitive interfaces and user flows for digital products." },
      { label: "Physical Computing", description: "Blending hardware and software to create interactive physical objects." },
      { label: "Ethnographic Research", description: "Understanding user behavior through immersive observation and interviews." },
      { label: "Figma", description: "Industry-standard tool for UI/UX design and collaborative prototyping." }
    ]
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
    summary: "Homepage & Search.",
    bullets: [
      "Senior Product Analyst on Zomato's Homepage & Search team, the highest-leverage surface through which ~80% of all orders were placed.",
      "Worked directly with product, engineering and design teams on UI layout, listing size, module ordering, ranking logic and surface interactions.",
      "Analytics covered ~10 million daily active users, using clickstream data to understand how users scrolled, clicked, searched, abandoned, or converted.",
      "Evaluated ML-based ranking output and helped identify gaps between algorithm predictions and real user behavior, feeding improvements into the ranking model.",
      "Shifted decision-making toward real-time experiment reads, enabling PM + Design to make changes the same day instead of waiting for long reporting cycles."
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png",
    themeColor: 'red',
    skills: [
      { label: "Clickstream Analytics", description: "Tracking full user paths (scroll → click → convert) to guide UI decisions." },
      { label: "A/B Testing", description: "Releasing multiple UI versions and measuring which performs better." },
      { label: "ML Feedback", description: "Evaluating ranking model outputs and providing improvement signals." },
      { label: "UI Behavior", description: "Interpreting how users interact with interface elements." }
    ],
    differentiator: "Learned to operate in an environment where design and product decisions must be made within hours, shaping a bias toward rapid iteration powered by real user behavior rather than assumptions.",
    featureCards: [
      {
        title: "Homepage & Search Performance",
        subtitle: "Senior Product Analyst",
        summary: "Analyzed how homepage and search changes impacted discovery, listing selection and ranking accuracy across ~10M daily users.",
        expandedSummary: "Evaluated clickstream behavior to understand how users scrolled, interacted and selected restaurants. These analytics guided UI enhancement decisions such as module placement, listing size, card order and search interaction patterns. Worked with the ML ranking team to analyze where algorithmic suggestions failed user intent and provided feedback that shaped how ranking logic was tuned and validated.",
        pills: [
          { label: "Clickstream Analytics", description: "Tracking full user paths (scroll → click → convert) to guide UI." },
          { label: "A/B Testing", description: "Releasing multiple UI versions and choosing based on performance." },
          { label: "CTR Analysis", description: "CTR = Click-Through-Rate, % of users who click after seeing a module." },
          { label: "Ranking Logic", description: "Evaluating how algorithm-sorted results align with real user behavior." }
        ],
        details: [
          "Identified high-impact modules and reduced UI noise that created empty scroll",
          "Guided homepage UI and ranking tweaks with data instead of intuition",
          "Enabled PM decisions through real-time experiment evaluation"
        ],
        skills: [
          { label: "Clickstream Analytics", description: "Full-path user behavior tracking for UI optimization." },
          { label: "A/B Testing", description: "Statistical experiment design and analysis." },
          { label: "ML-Model Feedback", description: "Translating user behavior into ranking model improvements." },
          { label: "UI Behavior Interpretation", description: "Understanding user intent from interface interactions." }
        ]
      },
      {
        title: "Friends Recommendation",
        subtitle: "Lead Analyst",
        summary: "Led analytics for Friends Recommendation, a social-proof feature sponsored by Zomato's founder, measuring how friend activity influenced ordering behavior.",
        expandedSummary: "Evaluated how seeing a friend's order impacted trust, selection and repeat-rate. Built social-graph analytics to understand which clusters of users behaved similarly and how influence spread. Took the feature from zero to rollout, analyzing prototypes, UI variants, placement logic and marketing versions, and helping PM + Design decide when and where signals should surface.",
        pills: [
          { label: "Social Proof", description: "Ordering increases when users see 'someone like them' chose it." },
          { label: "Social Graph Analytics", description: "Identifying clusters of connected users and shared behavior." },
          { label: "Influence Patterns", description: "Tracking when one user's order triggers another's." },
          { label: "Cohort Behaviour", description: "Comparing connected vs. unconnected user groups over time." }
        ],
        details: [
          "Defined how social signals should trigger and where they should appear",
          "Interpreted influence patterns across connected user groups"
        ],
        skills: [
          { label: "Social-Graph Analytics", description: "Analyzing connected user networks and behavior spread." },
          { label: "Behavioral Segmentation", description: "Grouping users by behavioral patterns for targeted features." },
          { label: "Feature Prioritization", description: "Ranking feature variations by impact potential." },
          { label: "PM Partnership", description: "Collaborating closely with product managers on decisions." }
        ]
      },
      {
        title: "Food Rescue (Waste Reduction)",
        subtitle: "Sole Product Analyst",
        summary: "Powered a system that surfaced expiring inventory at discounts, reducing waste and creating revenue from previously lost orders.",
        expandedSummary: "Food Rescue surfaced time-sensitive surplus inventory via targeted discounts. Analytics determined what discount to show, to which segment, and how long. Experimentation across cuisines, user segments and times of day showed how elastic each user / price / cuisine group was (how likely they were to buy when price changed). This work enabled restaurants and ops to convert inventory that otherwise would have been lost.",
        pills: [
          { label: "Sell-Through", description: "% of surplus inventory successfully sold." },
          { label: "Elasticity Testing", description: "Measuring how demand changes when price changes." },
          { label: "Eligibility Logic", description: "Deciding which items appear in Food Rescue." },
          { label: "Discount-Depth", description: "How steep pricing must go before conversion lifts." }
        ],
        details: [
          "Reduced food wastage pan-India by ~60%",
          "Generated pure incremental revenue from previously lost orders"
        ],
        skills: [
          { label: "Pricing Analytics", description: "Analyzing optimal discount levels for conversion." },
          { label: "Elasticity Testing", description: "Measuring price sensitivity across segments." },
          { label: "SKU-Level Modeling", description: "Building item-level demand and supply models." },
          { label: "Demand Triggers", description: "Identifying what drives purchase decisions." }
        ]
      }
    ],
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
            subtitle: "A real-time cancelled-order recovery feature in India's Largest Food Delivery App",
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
              { text: "Zomato has a new plan to stop food wastage, and how this 'Flash Sale' is good news for users.", source: "Times of India" },
              { text: "Zomato Launches 'Rescue' Service To Combat Food Wastage. How Does It Work?", source: "NDTV" },
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
    skills: [
      { label: "AI", description: "Artificial intelligence for voice recognition and command processing." },
      { label: "3D Print", description: "Custom enclosure design and additive manufacturing." },
      { label: "IOT", description: "Internet of Things device integration and communication." },
      { label: "Maixduino", description: "AI-capable microcontroller board with neural network acceleration." },
      { label: "MQTT", description: "Lightweight messaging protocol for IoT device communication." },
      { label: "Home Assistant", description: "Open-source home automation platform for smart device control." },
      { label: "C++", description: "Low-level programming language for embedded systems." },
      { label: "Arduino", description: "Microcontroller platform for rapid hardware prototyping." }
    ],
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
    skills: [
      { label: "Interaction Design", description: "Designing responsive behaviors and user engagement patterns." },
      { label: "Physical Computing", description: "Integrating sensors, actuators and code into physical objects." },
      { label: "Laser Cutting", description: "Precision fabrication of layered geometric components." },
      { label: "Electronics", description: "Circuit design and component integration for custom hardware." },
      { label: "Arduino", description: "Microcontroller programming for servo and sensor control." },
      { label: "Kinetic Sculpture", description: "Mechanical art with programmed, time-based motion." },
      { label: "Prototyping", description: "Iterative building and testing of physical designs." }
    ],
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
    summary: "Supply Chain, Marketplace, Product Analytics, Platform Building.",
    bullets: [
      "Worked full-time across Udaan's supply-chain vertical, supporting marketplace and inventory models at national scale.",
      "Owned reporting systems, procurement and availability analytics, and operational decision-intelligence used by product managers, central ops, warehousing, catalogue, pricing and CX teams.",
      "Built supply-chain systems first for single-city pilots, then scaled operations pan-India across FMCG, pharma and food.",
      "Designed real-time reporting dashboards that enabled teams to act immediately instead of waiting for analyst decks.",
      "Founding analyst for Percept Insights, a Mixpanel-alternative analytics platform used internally and by external partner teams.",
      "Only analyst and acting PM for Wondermart (mobile-first B2C commerce), running weekly product reviews with developers and prioritizing features using funnel and retention data."
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Udaanlogo.png",
    themeColor: 'orange',
    skills: [
      { label: "Supply Chain", description: "End-to-end logistics from procurement to last-mile delivery." },
      { label: "Marketplace", description: "Platform dynamics connecting buyers and sellers at scale." },
      { label: "Product Analytics", description: "Data-driven insights powering feature decisions and UX optimization." },
      { label: "Platform Building", description: "Creating internal tools and systems that enable teams to self-serve." }
    ],
    differentiator: "Experience across both marketplace operations and temporary warehouse-ownership pilots, giving rare visibility into how shifting supply risk changes economics, metrics and workflow design.",
    featureCards: [
      {
        title: "Nation Wide Availability and JIT Vendor Performance",
        subtitle: "Analytics Owner",
        summary: "Built real-time analytics controlling SKU availability and vendor reliability, enabling automated procurement instead of manual daily calls.",
        expandedSummary: "Centralized SKU availability, catalogue health, pricing correctness and vendor performance into one live system. Diagnosed SKU unavailability by tracing operational blockers such as MOQ rules and catalogue issues and exposed how these were creating preventable lost orders. Partnered with procurement and ops to tune reorder logic at SKU, vendor and city level.",
        pills: [
          { label: "SKU", description: "Stock Keeping Unit, a single product variant managed and reordered independently." },
          { label: "Availability", description: "Whether the item is actually purchasable right now." },
          { label: "MOQ", description: "Minimum Order Quantity, vendor minimum order rule that blocks ordering and creates artificial stockouts." },
          { label: "JIT Supply", description: "Just In Time, inventory is ordered only when demand occurs, reducing cost but increasing risk." },
          { label: "Warehousing", description: "Holding inventory in advance of demand in order to reduce delivery time and protect against supply uncertainty." }
        ],
        details: [
          "Automated procurement actions that previously required manual reconciliation",
          "Defined supply-chain decision metrics adopted by operations leadership"
        ],
        skills: [
          { label: "SQL", description: "Structured query language for database operations and complex analytics." },
          { label: "Real-time Dashboarding", description: "Live visualizations refreshing data as operations happen." },
          { label: "Metric Definition", description: "Designing KPIs that accurately measure business health." },
          { label: "Workflow Automation", description: "Replacing manual tasks with triggered, rule-based processes." }
        ]
      },
      {
        title: "Wondermart (Mobile-First B2C Commerce)",
        subtitle: "Sole Analyst & Acting PM",
        summary: "Mapped funnel friction and repeat-purchase drivers and ran weekly reviews with the development team and leadership.",
        expandedSummary: "Supported Wondermart by owning all analytics for feature decisions and acting as the product manager driving weekly reviews with the development team. Analytics shaped checkout UX, repeat-order incentives, homepage listing logic, special-deal placement and SKU visibility rules, as well as SKU selection strategy based on demand and retention patterns.",
        pills: [
          { label: "Customer Segmentation", description: "Grouping users by behavior to tailor product decisions." },
          { label: "Retention", description: "How many users return and continue buying after first experience." },
          { label: "Mixpanel-Style Analytics", description: "Event-level product usage signals rather than surface-level pageviews." },
          { label: "Repeat-Purchase", description: "Recurring orders indicating product-market fit for essentials." }
        ],
        details: [
          "Led weekly roadmap prioritization with dev team",
          "Drove UX fixes based on funnel-stage loss"
        ],
        skills: [
          { label: "Funnel Analytics", description: "Tracking user drop-off at each stage of a conversion flow." },
          { label: "PM Decision-Making", description: "Prioritizing features based on impact, effort, and strategic fit." },
          { label: "Quantified UX Prioritization", description: "Using data to rank UX improvements by measurable user impact." }
        ]
      },
      {
        title: "Percept Insights (Analytics Platform)",
        subtitle: "Founding Analyst",
        summary: "Defined the dashboards and onboarding that enabled teams and partners to make decisions without analyst dependency.",
        expandedSummary: "Set reusable dashboard patterns and training playbooks for an analytics platform similar in spirit to Mixpanel. Acted as the primary product tester and informed product requirements based on real usage gaps. Decided feature priority and sequence by evaluating which capabilities would unblock teams fastest. Shifted decision-making from BI reliance to direct product and ops ownership.",
        pills: [
          { label: "Self-Serve Dashboards", description: "Teams can answer questions without requesting analysts." },
          { label: "Analytics Training", description: "Structured onboarding to teach PMs, ops, CX to use data independently." },
          { label: "Team Enablement", description: "Data access made part of standard workflow." },
          { label: "Product-Led Decisions", description: "Decisions made where product is built, not in BI." }
        ],
        details: [
          "Created dashboard patterns reused across product teams",
          "Trained non-technical users to self-serve data"
        ],
        skills: [
          { label: "Platform Thinking", description: "Building reusable systems that serve multiple teams and use cases." },
          { label: "Internal Enablement", description: "Empowering colleagues to work independently with data and tools." },
          { label: "Analytics Training", description: "Teaching non-technical stakeholders to interpret and act on data." }
        ]
      }
    ],
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
            subtitle: "Dashboard System for Udaan's B2B Supply Chain",
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
              { name: 'GMV Impact %', def: "Availability × weighted average of last month's GMV", purpose: 'Shows business consequence' }
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
              "By merging engineering precision with human-centered visual language, Udaan's procurement dashboard became a living, shared system.",
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
    skills: [
      { label: "Ad-Tech Analytics", description: "Performance measurement and optimization for advertising products." },
      { label: "Revenue Attribution", description: "Tracing revenue back to specific ad actions and campaigns." },
      { label: "Supply Chain", description: "Logistics and inventory management for e-commerce operations." },
      { label: "Data Pipelines", description: "Automated data flows powering analytics and decision systems." }
    ],
    differentiator: "Rare combination of ad-tech revenue optimization and supply-chain infrastructure experience, bridging the gap between monetization strategy and operational execution.",
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
        expandedSummary: "Owned analytics and data pipelines for Snapdeal's seller advertising systems, supporting performance measurement, pricing evaluation, experiments and seller ROI understanding across multiple ad formats.",
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
        ],
        skills: [
          { label: "SQL", description: "Structured query language for complex data analysis." },
          { label: "Revenue Attribution", description: "Tracking revenue to specific ad interactions." },
          { label: "A/B Testing", description: "Controlled experiments to measure ad effectiveness." },
          { label: "Pricing Analytics", description: "Analyzing optimal pricing strategies for ad products." }
        ]
      },
      {
        title: "First-Party Warehousing Setup",
        subtitle: "Analytics Owner",
        summary: "Contributed to Snapdeal's first attempt at first-party warehousing, focusing on analytics and data systems supporting procurement automation.",
        expandedSummary: "Contributed to Snapdeal's first attempt at first-party warehousing, focusing on analytics and data systems supporting procurement automation, inventory visibility, and operational decision-making.",
        pills: [
          { label: "Warehousing", description: "Optimization of physical storage, layout, and fulfillment center operations." },
          { label: "Procurement", description: "Automated purchasing workflows and supplier management systems." },
          { label: "Inventory", description: "Real-time stock tracking and SKU-level availability analysis." }
        ],
        details: [
          "Working on analytics for Snapdeal-owned inventory instead of pure seller fulfillment",
          "Supporting automated procurement and inventory tracking workflows",
          "Analyzing warehouse- and SKU-level patterns affecting availability and fulfillment"
        ],
        skills: [
          { label: "Forecasting", description: "Predicting future demand and inventory needs." },
          { label: "Inventory Analytics", description: "Analyzing stock levels, turnover, and availability." },
          { label: "Operational Dashboards", description: "Real-time monitoring of warehouse operations." }
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
