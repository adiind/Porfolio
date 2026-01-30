
import { TimelineItem } from '../types';
import { TINKERVERSE_LOGO } from '../assets';

export const TIMELINE_DATA: TimelineItem[] = [
  {
    id: "portfolio-website",
    lane: 2,
    title: "Portfolio V2",
    company: "Personal Project",
    headline: "A portfolio built with Agentic AI.",
    type: "personal",
    subtype: 'project',
    start: "2025-01-01",
    end: "Present",
    summary: "Building a portfolio using advanced agentic coding workflows to explore the future of human-AI collaboration.",
    bullets: [
      "Leveraged Google Deepmind's Antigravity agent to architect and implement the site.",
      "Moved beyond 'vibe coding' to structured, verifiable agentic development.",
      "Showcasing the potential of AI as a pair programmer and system architect."
    ],
    logoUrl: "/images/portfolio_hero.png",
    imageUrl: "/images/portfolio_projects.png",
    skills: [
      { label: "Agentic AI", description: "Collaborating with autonomous agents." },
      { label: "Next.js", description: "Modern React framework." },
      { label: "Tailwind", description: "Utility-first styling." }
    ]
  },

  {
    id: "ms-edi",
    lane: 0,
    title: "MS Engineering Design Innovation",
    company: "Northwestern University | Segal Design Institute",
    headline: "Deepening design engineering skills to build what matters.",
    type: "education",
    subtype: 'role',
    start: "2025-08-01",
    end: "2025-12-31",
    summary: "Learning to decide what is worth building, and how to make it real.",
    bullets: [
      "Graduate program centered on human-centered design, systems thinking, and real-world problem solving",
      "Studio-led work in ambiguous problem spaces with an emphasis on framing the right problem before building",
      "Strong focus on user research, synthesis, and translating insight into concrete decisions",
      "Regular exposure to trade-offs between technical feasibility, user needs, and execution constraints",
      "Hands-on prototyping across physical and digital artifacts to validate ideas early",
      "Collaborative, critique-driven environment that prioritizes clarity of thinking and intent"
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Northwestern_Wildcats_logo.svg/1200px-Northwestern_Wildcats_logo.svg.png",
    imageUrl: "/images/northwestern_ford.png",
    skills: [
      { label: "User Research", description: "Qualitative and quantitative methods to uncover user needs." },
      { label: "Interaction Design", description: "Crafting intuitive interfaces and user flows." },
      { label: "Rapid Prototyping", description: "Iterative testing with physical and digital models." },
      { label: "Design Strategy", description: "Aligning design decisions with business and user goals." },
      { label: "Physical Computing", description: "Building interactive hardware systems." },
      { label: "Figma", description: "Interface design and prototyping tool." }
    ],
    differentiator: "In an age where technology makes building fast and easy, this program sharpens my ability to decide what is worth building, and refines how I approach making it real.",
    featureCards: [
      {
        title: "NUvention: Medical",
        subtitle: "Biodesign · Healthcare Systems · MedTech",
        summary: "Identified unmet clinical needs and developed pitch-ready medical concepts through stakeholder interviews and regulatory analysis.",
        expandedSummary: "Lead a biodesign project from need identification to pitch-ready concept. Conducted primary research with patients and clinicians to define defensible need statements, then evaluated solutions against real-world regulatory, adoption, and feasibility constraints.",
        imageUrl: "/images/nuvention-medical.jpg",
        pills: [
          { label: "Biodesign", description: "End-to-end medical innovation process." },
          { label: "Clinical Needs", description: "Surfacing unmet needs via stakeholder interviews." },
          { label: "Regulatory Analysis", description: "Evaluating concepts against FDA/adoption risks." },
          { label: "MedTech Strategy", description: "Creating pitch-ready concepts for healthcare systems." }
        ],
        details: [
          "Conducted primary stakeholder interviews (patients, clinicians, caregivers) to surface unmet clinical needs",
          "Built and screened a structured needs list to prioritize problems with real clinical and workflow impact",
          "Defined a defensible need statement with explicit users, outcomes, and constraints",
          "Evaluated early concepts against adoption, regulatory, and feasibility risks—not just technical novelty",
          "Produced a pitch-ready concept grounded in clinical reality and system constraints"
        ],
        skills: [
          { label: "Stakeholder Interviews", description: "Conducting primary research with clinicians and patients." },
          { label: "Needs Finding", description: "Structuring and prioritizing unmet clinical needs." },
          { label: "Regulatory Assessment", description: "Evaluating FDA pathways and adoption risks." },
          { label: "Concept Validation", description: "Testing concepts against system constraints." }
        ]
      },
      {
        title: "P&G Design Project",
        subtitle: "Innovation Strategy",
        summary: "Innovation strategy for a mature hair-care category.",
        expandedSummary: "Exploring innovation in a mature, habit-driven hair-care category. Under NDA. Worked in a category where users already had strong preferences, making meaningful change difficult to introduce.",
        pills: [
          { label: "Design Strategy", description: "Strategic innovation in mature markets." },
          { label: "User Research", description: "In-home and on-site user behavior analysis." },
          { label: "Prototyping", description: "Physical-digital prototyping under constraints." },
          { label: "Consumer Insights", description: "Understanding deep-rooted user habits." }
        ],
        details: [
          "Worked in a highly saturated hair-care space where users are deeply conditioned to existing formats.",
          "Studied why meaningful innovation is difficult in categories shaped by routine, expectation, and legacy design.",
          "Conducted in-home and on-site user research to understand behavior beyond stated needs.",
          "Built and iterated physical–digital prototypes within real-world brand and manufacturing constraints."
        ],
        imageUrl: "/images/pg-design-project.jpg",
        skills: [
          { label: "Design Strategy", description: "Strategic innovation within market constraints." },
          { label: "User Research", description: "Ethnographic research and behavior analysis." },
          { label: "Rapid Prototyping", description: "Iterative testing of physical and digital concepts." },
          { label: "Design for Manufacturing", description: "Designing within real-world production constraints." }
        ]
      }
    ]
  },
  {
    id: "zomato",
    lane: 1,
    title: "Senior Product Analyst",
    company: "Zomato",
    headline: "Driving decisions for India's largest food delivery home screen.",
    type: "corporate",
    subtype: 'role',
    start: "2024-10-01",
    end: "2025-07-31",
    summary: "Analytics for the highest-leverage surface in India's largest food delivery app.",
    bullets: [
      "Senior Product Analyst on Zomato's Homepage & Search team, the highest-leverage surface through which ~80% of all orders were placed.",
      "Worked directly with product, engineering and design teams on UI layout, listing size, module ordering, ranking logic and surface interactions.",
      "Analytics covered ~10 million daily active users, using clickstream data to understand how users scrolled, clicked, searched, abandoned, or converted.",
      "Evaluated ML-based ranking output and helped identify gaps between algorithm predictions and real user behavior, feeding improvements into the ranking model.",
      "Shifted decision-making toward real-time experiment reads, enabling PM + Design to make changes the same day instead of waiting for long reporting cycles."
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png",
    imageUrl: "/images/zomato_eternal.jpg",
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
        ],
        imageUrl: "/images/zomato_homepage.png"
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
        imageUrl: "/images/zomato_friends.png",
        details: [
          "Defined how social signals should trigger and where they should appear",
          "Interpreted influence patterns across connected user groups"
        ],
        skills: [
          { label: "Social-Graph Analytics", description: "Analyzing connected user networks and behavior spread." },
          { label: "Behavioral Segmentation", description: "Grouping users by behavioral patterns for targeted features." },
          { label: "Feature Prioritization", description: "Ranking feature variations by impact potential." },
          { label: "PM Partnership", description: "Collaborating closely with product managers on decisions." }
        ],
        projectLinks: [
          { label: "ImpactOnNet Article", url: "https://www.impactonnet.com/more-from-impact/zomato-launches-recommendations-from-friends-feature-9479.html" },
          { label: "MediaNama Article", url: "https://www.medianama.com/2025/10/223-loved-by-friends-feature-zomato-private-food-choices-public-data/" }
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
        ],
        imageUrl: "/images/food_rescue.png",
        projectLinks: [
          { label: "Zomato Blog", url: "https://www.zomato.com/blog/food-rescue/" },
          { label: "Green Queen Article", url: "https://www.greenqueen.com.hk/zomato-food-rescue-waste-climate-conscious-delivery-india/" }
        ]
      }
    ],
    caseStudy: {
      title: "Food Rescue",
      summary: "Preventing food wastage by redirecting cancelled orders to nearby customers at discounted rates.",
      thumbnailUrl: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Leafy%20Green.png",
      imageUrl: "/images/food_rescue.png",
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
            ],
            articles: [
              {
                title: "Zomato Launches Recommendations From Friends Feature",
                source: "ImpactOnNet",
                url: "https://www.impactonnet.com/more-from-impact/zomato-launches-recommendations-from-friends-feature-9479.html"
              },
              {
                title: "Loved by Friends Feature: Zomato Private Food Choices Public Data",
                source: "MediaNama",
                url: "https://www.medianama.com/2025/10/223-loved-by-friends-feature-zomato-private-food-choices-public-data/"
              }
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
    headline: "Voice-controlled AI home assistant built from scratch.",
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
    id: "udaan",
    lane: 1,
    title: "Product Analyst",
    company: "Udaan",
    headline: "Scaling supply chain & marketplace ops via data intelligence.",
    type: "corporate",
    subtype: 'role',
    start: "2023-02-01",
    end: "2024-09-30",
    summary: "Built analytics and decision systems across supply chain, marketplace, and product at national scale.",
    bullets: [
      "Worked full-time across Udaan's supply-chain vertical, supporting marketplace and inventory models at national scale.",
      "Owned reporting systems, procurement and availability analytics, and operational decision-intelligence used by product managers, central ops, warehousing, catalogue, pricing and CX teams.",
      "Built supply-chain systems first for single-city pilots, then scaled operations pan-India across FMCG, pharma and food.",
      "Designed real-time reporting dashboards that enabled teams to act immediately instead of waiting for analyst decks.",
      "Founding analyst for Percept Insights, a Mixpanel-alternative analytics platform used internally and by external partner teams.",
      "Only analyst and acting PM for Wondermart (mobile-first B2C commerce), running weekly product reviews with developers and prioritizing features using funnel and retention data."
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Udaanlogo.png",
    imageUrl: "/images/udaan_id.jpg",
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
        imageUrl: "/images/udaan_supply_chain.png",
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
        imageUrl: "/images/udaan_wondermart.png",
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
        imageUrl: "/images/udaan_percept.png",
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
    id: "schmooze",
    lane: 1,
    title: "Product and Growth Analyst",
    company: "Schmooze",
    headline: "Zero-to-one analytics for a meme-based dating app.",
    type: "corporate",
    subtype: 'role',
    start: "2022-10-01",
    end: "2022-12-31",
    summary: "Pre-PMF analytics at a seed-stage dating app exploring meme-based matching.",
    bullets: [
      "Second analyst in the company working in a multifunctional role across product, basic growth, and user behavior.",
      "Set up the V0 top down dashboards for creator management at scale.",
      "Tested early tech implementations and strategies to validate whether the concept had traction."
    ],
    logoUrl: "/images/schmooze_logo.png",
    imageUrl: "/images/schmooze_team.jpg",
    differentiator: "Analytics here happened before product market fit, where data is incomplete, experiments are messy, and signal has to be created from zero.",
    skills: [
      { label: "Exploration–Exploitation", description: "Balancing testing new ideas with repeating what is already working." },
      { label: "User Session Analysis", description: "Manually watching individual sessions to understand behavior." },
      { label: "V0 Dashboards", description: "First directional dashboards created for decision-making." },
      { label: "Mixpanel", description: "Event-based product analytics for tracking user interactions and funnels." }
    ]
  },
  {
    id: "snapdeal",
    lane: 1,
    title: "Data Analyst · Ads & Supply Infrastructure",
    company: "Snapdeal",
    headline: "Building ads analytics and supply infrastructure during Snapdeal's first-party transition.",
    type: "corporate",
    subtype: 'role',
    start: "2020-06-01",
    end: "2022-08-31",
    summary: "Building ads analytics and supply infrastructure during Snapdeal's first-party transition.",
    bullets: [
      "Set up data pipelines to support Snapdeal's first-party product rollout",
      "Built replenishment logic for newly established warehouse operations",
      "Enabled inventory planning as Snapdeal scaled owned supply and fulfillment",
      "Contributed to ads revenue optimization, resulting in a 14% uplift"
    ],
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
        summary: "Worked on ads revenue analytics and supply-side data infrastructure during Snapdeal's shift toward first-party products and in-house warehousing.",
        expandedSummary: "Worked on ads revenue analytics and supply-side data infrastructure during Snapdeal's shift toward first-party products and in-house warehousing. Set up data pipelines, built replenishment logic, and enabled inventory planning as Snapdeal scaled owned supply and fulfillment.",
        pills: [
          { label: "CPC", description: "Cost Per Click. Advertisers are charged only when a user clicks on their ad." },
          { label: "CPT", description: "Cost Per Transaction. Advertisers pay a commission only when a sale occurs." },
          { label: "Banner Ads", description: "High-visibility visual placements on the homepage and category pages." }
        ],
        imageUrl: "/images/snapdeal_ads.png",
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
        imageUrl: "/images/snapdeal_warehousing.png",
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
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Snapdeal-Logo.png",
    imageUrl: "/images/snapdeal_id.jpg"
  },
  {
    id: "tinkerverse",
    lane: 2,
    title: "Founder & Creator",
    company: "Tinker Verse",
    headline: "A sandbox for physical computing and creative tech.",
    type: "personal",
    subtype: 'role',
    start: "2024-02-01",
    end: "2025-12-31",
    summary: "Personal lab for physical computing, generative art, and expressive hardware.",
    bullets: ["Voice-controlled home assistant.", "Generative drawing plotter."],
    logoUrl: TINKERVERSE_LOGO,
    projects: [
      {
        id: "jarvis",
        title: "Jarvis Home Assistant",
        description: "A voice-controlled home automation system built with Maixduino and MQTT. Features local voice recognition, motion detection, and seamless integration with Home Assistant.",
        imageUrl: "https://img.youtube.com/vi/3aCWb3PsAQs/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=3aCWb3PsAQs",
        tags: ["IoT", "AI", "C++"],
        link: "https://github.com/adiind/diy-jarvis"
      },
      {
        id: "plotter",
        title: "Voice Plotter",
        description: "A generative art machine that translates spoken words into physical drawings. Explores the imperfection of translation between digital voice and analog motion.",
        imageUrl: "https://i.ibb.co/v6nVSTw9/IMG-8392-2.jpg",
        tags: ["Generative Art", "Robotics", "Python"],
        link: "#"
      }
    ]
  },
  {
    id: "bits",
    lane: 0,
    title: "B.Tech Civil Engineering + M.Sc. Biological Sciences",
    company: "BITS Pilani, Hyderabad Campus",
    headline: "Foundational dual-degree in Engineering & Biology.",
    type: "education",
    subtype: 'role',
    start: "2016-08-01",
    end: "2021-05-30",
    summary: "Interdisciplinary academic training combined with hands-on leadership across technical, biological, and student-led initiatives.",
    bullets: [
      "Dual-degree education spanning civil engineering and biological sciences, enabling systems-level thinking across physical and biological domains.",
      "Early exposure to medical innovation and bio-design through structured workshops and healthcare-focused projects.",
      "Led and contributed to healthcare and sanitation design projects addressing real-world constraints and usability.",
      "Stage Design Head for TEDx BITS Hyderabad, responsible for concept development and execution.",
      "Secretary, Synapsis (Biological Science Association), driving academic engagement and student-led initiatives.",
      "Founder and Instructor, Inferno (Self Defense Society), trained and mentored students with a focus on fitness and personal safety.",
      "Hockey A Team member, representing the institute in competitive sports."
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/d/d3/BITS_Pilani-Logo.svg",
    imageUrl: "/images/bits_hyderabad.jpg",
    differentiator: "This phase shaped my interdisciplinary instincts by working across biology, engineering, and design long before it became a formal specialization.",
    skills: [
      { label: "Healthcare Instrumentation", description: "Designing medical devices and testing systems for clinical use." },
      { label: "Product Design", description: "End-to-end physical product development from concept to prototype." },
      { label: "Electronics Design", description: "PCB layout, component selection, and hardware integration." },
      { label: "Sustainability", description: "Resource-conscious design considering environmental impact." },
      { label: "Human-Centered Infrastructure", description: "Designing systems that prioritize user comfort and accessibility." },
      { label: "Systems Thinking", description: "Approaching problems as interconnected systems rather than isolated parts." }
    ],
    featureCards: [
      {
        title: "Rightbiotic: Antimicrobial Testing Machine",
        subtitle: "Healthcare Instrumentation",
        summary: "Collaborated on a low-cost antimicrobial resistance testing system to reduce test turnaround from days to hours.",
        expandedSummary: "Worked under the guidance of Dr. Suman Kapur (late) to repurpose a UTI analysis machine for antimicrobial resistance testing. Owned the product design layer, working with multiple PCB vendors and proposing a compact redesign using smaller, more efficient components. Co-developed a simple, lab-friendly app with a software collaborator to improve usability for technicians. Project could not be fabricated due to COVID-19 disruptions and health constraints, but reflects real-world healthcare innovation under pressure.",
        pills: [
          { label: "AMR Testing", description: "Antimicrobial Resistance testing to identify drug-resistant bacteria." },
          { label: "PCB Design", description: "Printed circuit board layout and component integration." },
          { label: "Medical Devices", description: "Healthcare instrumentation designed for clinical environments." },
          { label: "Rapid Diagnostics", description: "Reducing test turnaround time from days to hours." }
        ],
        details: [
          "Repurposed UTI analysis machine for antimicrobial resistance testing",
          "Proposed compact redesign with smaller, more efficient components",
          "Co-developed lab-friendly app for technician usability"
        ],
        skills: [
          { label: "Healthcare Instrumentation", description: "Designing medical devices for clinical use." },
          { label: "PCB Design", description: "Circuit board layout and vendor coordination." },
          { label: "Product Design", description: "Physical product development and prototyping." },
          { label: "Cross-Functional Collaboration", description: "Working with software and hardware teams." }
        ]
      },
      {
        title: "Modular Water Closet System",
        subtitle: "Sanitation Design",
        summary: "Designed a modular water closet system adaptable to multiple settings with a focus on efficiency and sustainability.",
        expandedSummary: "Approached sanitation as a systems design problem balancing user comfort, resource use, and scalability. Integrated water-saving flush mechanisms, ergonomic interactions, and responsible material selection. Developed concept renders featuring an adjustable ergonomic handle with angle and force control, along with an attachable bidet compatible with standard Western toilets.",
        pills: [
          { label: "Sustainability", description: "Water-saving and resource-conscious design principles." },
          { label: "Ergonomics", description: "Designing for user comfort and physical interaction." },
          { label: "Modular Design", description: "Adaptable systems for multiple settings and use cases." },
          { label: "Sanitation", description: "Infrastructure focused on hygiene and accessibility." }
        ],
        details: [
          "Integrated water-saving flush mechanisms",
          "Designed adjustable ergonomic handle with angle and force control",
          "Created attachable bidet compatible with standard Western toilets"
        ],
        skills: [
          { label: "Sustainability", description: "Resource-conscious design considering environmental impact." },
          { label: "Ergonomic Design", description: "Optimizing for user comfort and physical interaction." },
          { label: "Systems Design", description: "Balancing user comfort, resource use, and scalability." },
          { label: "Concept Rendering", description: "Visualizing product concepts for stakeholder review." }
        ]
      }
    ]
  }
];
