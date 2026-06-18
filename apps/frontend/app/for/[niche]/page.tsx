import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, MapPin, Star } from 'lucide-react'

// ─── Niche config ────────────────────────────────────────────────────────────

const NICHES: Record<string, {
  category: string        // maps to wizard category param
  label: string           // display name
  emoji: string
  headline: string
  subheadline: string
  pain: string[]          // 3 pain points specific to this niche
  platforms: string[]     // what platforms they're on
  examples: { name: string; city: string; tagline: string; accent: string; bg: string; text: string; badge: string }[]
  proofStat: string
  proofLabel: string
  cta: string
  metaTitle: string
  metaDesc: string
}> = {
  restaurants: {
    category: 'restaurant',
    label: 'Restaurants & Food Businesses',
    emoji: '🍽️',
    headline: 'Your food deserves more than a Facebook post.',
    subheadline: 'Get a free website that shows your menu, hours, and location — so hungry customers can find you on Google, not just on your feed.',
    pain: [
      'Customers ask "where are you located?" every single day in the comments.',
      'Your menu photos get buried under old posts. A website keeps them front and center, always.',
      'Grab, foodpanda, and Shopee Food take 30% commission. Your website sends customers directly to you.',
    ],
    platforms: ['📘 Facebook Page', '📸 Instagram Food Photos', '🎵 TikTok Recipes', '🛍️ Shopee Food', '🚗 Grab / Foodpanda'],
    examples: [
      { name: "Lola's Kitchen", city: 'Quezon City', tagline: 'Authentic Filipino home cooking since 1992', accent: '#f59e0b', bg: '#431407', text: '#fef3c7', badge: 'Restaurant' },
      { name: 'Café de Manila', city: 'Makati', tagline: 'Specialty coffee & light bites in the heart of the city', accent: '#a16207', bg: '#1c1917', text: '#fef9c3', badge: 'Café' },
    ],
    proofStat: '3×',
    proofLabel: 'more Google visibility vs. Facebook-only',
    cta: 'Get My Restaurant Website Free',
    metaTitle: 'Free Website for Restaurants in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your restaurant, carinderia, or food business in the Philippines. Ready in 60 seconds. No coding needed.',
  },

  salons: {
    category: 'salon',
    label: 'Salons & Beauty Businesses',
    emoji: '✂️',
    headline: 'Your clients find you on Facebook. But new clients find you on Google.',
    subheadline: 'A free website that shows your services, prices, and booking link — so you stop losing customers to the salon they Googled instead.',
    pain: [
      'Potential clients Google "salon near me" and you don\'t show up — even if you\'re two streets away.',
      'Clients always ask for your price list. A website answers that before they even message you.',
      'Your best work photos deserve a permanent home, not to disappear in the Instagram feed.',
    ],
    platforms: ['📘 Facebook Page', '📸 Instagram Portfolio', '🎵 TikTok Tutorials', '💬 Viber Bookings'],
    examples: [
      { name: 'Studio Glam', city: 'Pasig', tagline: 'Premium hair, nails & skin care for modern Filipinas', accent: '#ec4899', bg: '#1a0010', text: '#fce7f3', badge: 'Salon' },
      { name: 'The Barber Society', city: 'Taguig', tagline: 'Precision cuts & fades for the modern gentleman', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Barbershop' },
    ],
    proofStat: '60%',
    proofLabel: 'of salon bookings start with a Google search',
    cta: 'Get My Salon Website Free',
    metaTitle: 'Free Website for Salons & Beauty Shops in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your salon, barbershop, or beauty business in the Philippines. Show your services, prices & booking link instantly.',
  },

  auto: {
    category: 'auto',
    label: 'Auto Repair & Automotive',
    emoji: '🚗',
    headline: 'Car owners Google the mechanic they trust. Are you showing up?',
    subheadline: 'A free website that shows your services, location, and contact — so drivers in your area find you first.',
    pain: [
      'Most drivers don\'t have a regular mechanic. They Google one when they need help. Without a website, you\'re invisible.',
      'Trust is everything in auto repair. A professional website builds credibility before the customer even drives in.',
      'Referrals are your best customers. Give them a link to share — not just a name to pass along.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber / SMS', '🗣️ Word of Mouth'],
    examples: [
      { name: 'Metro Auto Works', city: 'Makati', tagline: 'ASE-certified mechanics. Trusted by Makati drivers since 2015.', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Auto Repair' },
      { name: 'FastLane Vulcanizing', city: 'Quezon City', tagline: 'Tire repair, alignment & aircon — same day service', accent: '#f97316', bg: '#1c0a00', text: '#ffedd5', badge: 'Vulcanizing' },
    ],
    proofStat: '7 in 10',
    proofLabel: 'customers choose a mechanic they found online',
    cta: 'Get My Auto Shop Website Free',
    metaTitle: 'Free Website for Auto Repair Shops in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your auto repair shop, vulcanizing, or car service business in the Philippines. Ready in 60 seconds.',
  },

  medical: {
    category: 'medical',
    label: 'Clinics & Medical Practices',
    emoji: '🏥',
    headline: 'Patients research their doctor before they book. What do they find when they search yours?',
    subheadline: 'A free clinic website showing your specialization, schedule, and location — so patients choose you with confidence.',
    pain: [
      'Patients Google doctors before booking. If you have no website, they move on to the next clinic.',
      'New patients need to know: What do you specialize in? What are your hours? Where exactly are you? A website answers all three.',
      'A professional web presence signals trust — critical in healthcare where patients are already anxious.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber for Appointments', '🗣️ Patient Referrals'],
    examples: [
      { name: 'Dr. Santos Family Clinic', city: 'Mandaluyong', tagline: 'Compassionate general medicine for families in Metro Manila', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'General Medicine' },
      { name: 'MindWell Psychology', city: 'BGC, Taguig', tagline: 'Professional mental health support in a safe, private setting', accent: '#8b5cf6', bg: '#1e1b4b', text: '#ede9fe', badge: 'Psychology' },
    ],
    proofStat: '80%',
    proofLabel: 'of patients research a clinic online before visiting',
    cta: 'Get My Clinic Website Free',
    metaTitle: 'Free Website for Clinics & Doctors in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your clinic or medical practice in the Philippines. Show your schedule, specialization & location instantly.',
  },

  dental: {
    category: 'medical',
    label: 'Dental Clinics',
    emoji: '🦷',
    headline: 'People search for dentists near them every day. Show up when they do.',
    subheadline: 'A free dental website with your services, pricing, and booking info — so nervous patients pick you over the unknown.',
    pain: [
      '"Dentist near me" is one of the most Googled health searches in the Philippines. No website means no visibility.',
      'Patients want to know what you charge before they book. A website answers that and reduces cancellations.',
      'Before-and-after photos build trust faster than any ad. A website gives them a permanent, professional home.',
    ],
    platforms: ['📘 Facebook Page', '📸 Instagram Before/After', '💬 Viber for Bookings'],
    examples: [
      { name: 'BrightSmile Dental', city: 'Cebu City', tagline: 'Gentle, modern dentistry for the whole family', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Dental Clinic' },
      { name: 'Dra. Reyes Orthodontics', city: 'Quezon City', tagline: 'Specialist braces & Invisalign for teens and adults', accent: '#6366f1', bg: '#1e1b4b', text: '#e0e7ff', badge: 'Orthodontics' },
    ],
    proofStat: '2×',
    proofLabel: 'more new patient inquiries with a website vs. without',
    cta: 'Get My Dental Website Free',
    metaTitle: 'Free Website for Dental Clinics in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your dental clinic in the Philippines. Show your services, pricing & booking link. Ready in 60 seconds.',
  },

  retail: {
    category: 'retail',
    label: 'Retail Shops & Boutiques',
    emoji: '🛍️',
    headline: 'Shopee and Lazada take their cut. Your website keeps it all.',
    subheadline: 'A free retail website that showcases your products and drives customers straight to you — no platform commission, no algorithm.',
    pain: [
      'Every Shopee and Lazada sale costs you 10–20% in commission. Direct customers through your own site cost nothing.',
      'On marketplaces, you compete on price. On your own site, you compete on brand — and you win.',
      'Marketplace customers are the platform\'s customers. Website customers are yours, forever.',
    ],
    platforms: ['🛍️ Shopee Store', '📦 Lazada Store', '📘 Facebook Shop', '📸 Instagram Shop', '🎵 TikTok Shop'],
    examples: [
      { name: 'Casa Hermosa', city: 'Manila', tagline: 'Handcrafted Filipino home décor & lifestyle pieces', accent: '#d97706', bg: '#1c1208', text: '#fef3c7', badge: 'Home Décor' },
      { name: 'Threads & Co.', city: 'Pasig', tagline: 'Affordable everyday fashion for the modern Filipina', accent: '#ec4899', bg: '#1a0010', text: '#fce7f3', badge: 'Boutique' },
    ],
    proofStat: '0%',
    proofLabel: 'commission on direct website sales vs. 10–20% on marketplaces',
    cta: 'Get My Shop Website Free',
    metaTitle: 'Free Website for Retail Shops in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your retail shop or boutique in the Philippines. Stop paying marketplace fees. Ready in 60 seconds.',
  },

  bakery: {
    category: 'restaurant',
    label: 'Bakeries & Pastry Shops',
    emoji: '🧁',
    headline: 'Your pastries are beautiful. Your online presence should be too.',
    subheadline: 'A free bakery website that shows your bestsellers, custom order details, and pickup schedule — so customers order directly from you.',
    pain: [
      'Custom order inquiries get lost in Messenger threads. A website form collects everything you need upfront.',
      'Your Shopee or Facebook Shop photos disappear. A website keeps your best products visible forever.',
      'Word of mouth is powerful — but only if referrals have a link to send. Give them one.',
    ],
    platforms: ['📘 Facebook Orders', '📸 Instagram Showcase', '💬 Viber / Messenger Orders', '🛍️ Shopee'],
    examples: [
      { name: "Veyron's Cakes & Pastries", city: 'Manila', tagline: 'Custom celebration cakes made with love for every occasion', accent: '#f472b6', bg: '#1a0010', text: '#fce7f3', badge: 'Bakery' },
      { name: 'Pan de Amor', city: 'Caloocan', tagline: 'Freshly baked Filipino breads and pastries daily', accent: '#d97706', bg: '#1c0a00', text: '#fef3c7', badge: 'Panaderya' },
    ],
    proofStat: '40%',
    proofLabel: 'of custom cake orders come via Google search',
    cta: 'Get My Bakery Website Free',
    metaTitle: 'Free Website for Bakeries & Pastry Shops in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your bakery or pastry shop in the Philippines. Show your menu, take custom orders. Ready in 60 seconds.',
  },

  trades: {
    category: 'trades',
    label: 'Trades & Home Services',
    emoji: '🔧',
    headline: 'When a pipe bursts, people Google a plumber. Not Facebook.',
    subheadline: 'A free website for your plumbing, electrical, aircon, or construction business — so urgent customers find you first, not your competitor.',
    pain: [
      'Emergency service jobs go to whoever shows up first on Google. A website puts you there.',
      'Clients want to see past work before they hire. A website with photos closes jobs before the call.',
      'Free quotes take time. A website pre-qualifies customers so you only talk to serious ones.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber / SMS', '🗣️ Referrals & Barangay Groups'],
    examples: [
      { name: 'QuickFix Home Services', city: 'Paranaque', tagline: 'Plumbing, electrical & aircon repair — same day response', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Home Services' },
      { name: 'BuildRight Construction', city: 'Cavite', tagline: 'Trusted residential construction & renovation since 2010', accent: '#f59e0b', bg: '#1c1208', text: '#fef3c7', badge: 'Construction' },
    ],
    proofStat: '5×',
    proofLabel: 'more job inquiries for trades with a website vs. without',
    cta: 'Get My Business Website Free',
    metaTitle: 'Free Website for Trades & Home Services in the Philippines | Guma AI',
    metaDesc: 'Free website for plumbers, electricians, aircon repair, and construction businesses in the Philippines. Get found on Google. Ready in 60 seconds.',
  },

  gym: {
    category: 'generic',
    label: 'Gyms & Fitness Studios',
    emoji: '💪',
    headline: 'People search for gyms near them before they ever walk in.',
    subheadline: 'A free gym website showing your rates, schedules, and facilities — so fitness-seekers choose you over the gym they found on Google.',
    pain: [
      '"Gym near me" is searched thousands of times a month in every city. Without a website, you miss all of it.',
      'Membership inquiries flood your Messenger. A website answers rates, schedules, and FAQs before they even ask.',
      'Photos of your equipment and space close sign-ups. Keep them front and center on your own site.',
    ],
    platforms: ['📘 Facebook Page', '📸 Instagram Workouts', '🎵 TikTok Fitness Content'],
    examples: [
      { name: 'Iron District Gym', city: 'Quezon City', tagline: 'Serious training for serious athletes — open 24/7', accent: '#ef4444', bg: '#1a0000', text: '#fee2e2', badge: 'Gym' },
      { name: 'Bloom Pilates Studio', city: 'BGC, Taguig', tagline: 'Reformer Pilates & yoga for women in BGC', accent: '#8b5cf6', bg: '#1e1b4b', text: '#ede9fe', badge: 'Fitness Studio' },
    ],
    proofStat: '65%',
    proofLabel: 'of new gym members found it via Google search',
    cta: 'Get My Gym Website Free',
    metaTitle: 'Free Website for Gyms & Fitness Studios in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your gym or fitness studio in the Philippines. Show rates, schedules & facilities. Ready in 60 seconds.',
  },

  laundry: {
    category: 'generic',
    label: 'Laundry Shops',
    emoji: '👕',
    headline: 'Laundry shops with a website get 3× more walk-ins from Google.',
    subheadline: 'A free website showing your rates, pickup/delivery options, and location — so busy customers choose you over the shop they found first.',
    pain: [
      'Customers Google "laundry pickup near me." Without a website, you\'re not in that list.',
      'Your rates and services are the first thing customers want to know. A website answers before they call.',
      'Offering pickup & delivery? That\'s your biggest edge — a website lets you shout it to the whole barangay.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber / SMS Orders', '🗣️ Barangay Word of Mouth'],
    examples: [
      { name: 'FreshFold Laundry', city: 'Pasig', tagline: 'Wash, dry & fold with free pickup & delivery in Pasig', accent: '#06b6d4', bg: '#001a1f', text: '#cffafe', badge: 'Laundry Shop' },
      { name: 'CleanPro Express', city: 'Manila', tagline: '8-hour express laundry service — clean, fresh, on time', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Laundry' },
    ],
    proofStat: '3×',
    proofLabel: 'more walk-ins for laundry shops with a Google presence',
    cta: 'Get My Laundry Shop Website Free',
    metaTitle: 'Free Website for Laundry Shops in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your laundry shop in the Philippines. Show your rates, pickup & delivery options. Ready in 60 seconds.',
  },

  photography: {
    category: 'generic',
    label: 'Photography & Videography',
    emoji: '📷',
    headline: 'Your portfolio deserves better than an Instagram grid.',
    subheadline: 'A free website that showcases your best work, packages, and booking info — so clients find and hire you with confidence.',
    pain: [
      'Clients Google "wedding photographer [city]" before they check Instagram. Without a website, you miss every one of them.',
      'Your Instagram grid can\'t show pricing, packages, or a contact form. A website does all three automatically.',
      'Past clients want to refer you but have nothing to send. Give them a professional link.',
    ],
    platforms: ['📸 Instagram Portfolio', '📘 Facebook Page', '🎵 TikTok BTS Content', '💬 Viber Inquiries'],
    examples: [
      { name: 'Lumière Studios', city: 'Makati', tagline: 'Wedding & lifestyle photography across the Philippines', accent: '#f59e0b', bg: '#1c1208', text: '#fef3c7', badge: 'Photography' },
      { name: 'Reel Motion Co.', city: 'BGC, Taguig', tagline: 'Corporate video & event cinematography — tell your story beautifully', accent: '#6366f1', bg: '#1e1b4b', text: '#e0e7ff', badge: 'Videography' },
    ],
    proofStat: '4×',
    proofLabel: 'more inquiries for photographers with a portfolio website',
    cta: 'Get My Photography Website Free',
    metaTitle: 'Free Website for Photographers & Videographers in the Philippines | Guma AI',
    metaDesc: 'Get a free professional portfolio website for your photography or videography business in the Philippines. Showcase your work. Ready in 60 seconds.',
  },

  printing: {
    category: 'retail',
    label: 'Printing & Graphics Shops',
    emoji: '🖨️',
    headline: 'Printing customers Google before they walk in. Are you showing up?',
    subheadline: 'A free website listing your services, turnaround times, and pricing — so businesses in your area order from you, not the shop they found online.',
    pain: [
      'B2B customers — offices, schools, event organizers — Google printing services before they order. No website means no B2B.',
      'Customers want to know: do you do tarpaulin? Stickers? ID laces? A website lists everything, saving you repetitive chats.',
      'Corporate clients need a professional vendor. A polished website signals you\'re one.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber / Messenger Orders', '🗣️ Word of Mouth'],
    examples: [
      { name: 'PrintMaster Manila', city: 'Manila', tagline: 'Tarpaulin, stickers, IDs & corporate printing — same day available', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Printing Shop' },
      { name: 'Inkwell Graphics', city: 'Quezon City', tagline: 'Custom designs & full-service printing for events and businesses', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Graphics & Print' },
    ],
    proofStat: '70%',
    proofLabel: 'of B2B printing orders start with a Google search',
    cta: 'Get My Print Shop Website Free',
    metaTitle: 'Free Website for Printing Shops in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your printing or graphics shop in the Philippines. List services, turnaround & pricing. Ready in 60 seconds.',
  },

  childcare: {
    category: 'medical',
    label: 'Childcare & Daycare Centers',
    emoji: '🧒',
    headline: 'Parents research childcare more carefully than anything else. Be findable.',
    subheadline: 'A free website showing your facilities, schedule, rates, and safety measures — so parents trust you before they even visit.',
    pain: [
      'Parents Google "daycare near me" the moment they need one. No website means they call your competitor.',
      'Trust is the #1 factor in childcare decisions. A professional website with photos of your space builds that trust instantly.',
      'Enrollment inquiries flood your Messenger. A website answers FAQs — hours, age groups, rates — so only serious parents reach out.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber Parent Groups', '🗣️ Parent-to-Parent Referrals'],
    examples: [
      { name: 'Little Stars Daycare', city: 'Paranaque', tagline: 'Safe, nurturing childcare for ages 0–6 in a home-like environment', accent: '#f59e0b', bg: '#1c0a00', text: '#fef3c7', badge: 'Daycare Center' },
      { name: 'Seedlings Learning Hub', city: 'Marikina', tagline: 'Play-based early childhood education for curious little minds', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Childcare' },
    ],
    proofStat: '9 in 10',
    proofLabel: 'parents research childcare online before enrolling',
    cta: 'Get My Childcare Website Free',
    metaTitle: 'Free Website for Daycare & Childcare Centers in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your daycare or childcare center in the Philippines. Build trust with parents online. Ready in 60 seconds.',
  },

  tutoring: {
    category: 'generic',
    label: 'Tutorial Centers & Tutors',
    emoji: '📚',
    headline: 'Parents searching for tutors go straight to Google. Not Facebook.',
    subheadline: 'A free website listing your subjects, schedule, rates, and qualifications — so parents enroll their child with you instead of the next person on Google.',
    pain: [
      'Parents Google "Math tutor [city]" or "tutorial center near me" constantly. Without a website, you\'re invisible to all of them.',
      'Credentials matter in education. A professional website to display your qualifications closes enrollments faster.',
      'Group class slots fill up fast — a website lets you post availability and take inquiries 24/7, even when you\'re teaching.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber Class Groups', '🗣️ School Parent Networks'],
    examples: [
      { name: 'Excellere Tutorial Center', city: 'Las Piñas', tagline: 'K–12 academic excellence through personalized one-on-one tutoring', accent: '#6366f1', bg: '#1e1b4b', text: '#e0e7ff', badge: 'Tutorial Center' },
      { name: 'Math Made Easy', city: 'Caloocan', tagline: 'Patient, effective Math & Science tutoring for Grades 1–10', accent: '#f59e0b', bg: '#1c1208', text: '#fef3c7', badge: 'Private Tutor' },
    ],
    proofStat: '3×',
    proofLabel: 'more enrollments for tutorial centers with a website',
    cta: 'Get My Tutorial Center Website Free',
    metaTitle: 'Free Website for Tutorial Centers & Tutors in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your tutorial center or private tutoring service in the Philippines. Ready in 60 seconds.',
  },

  petshop: {
    category: 'retail',
    label: 'Pet Shops & Veterinary Clinics',
    emoji: '🐾',
    headline: 'Pet owners Google vets and pet shops before they trust anyone with their fur baby.',
    subheadline: 'A free website showing your services, available pets, and clinic hours — so pet owners in your area choose you first.',
    pain: [
      '"Vet near me" is one of the most urgent Google searches. Emergency pet situations go to whoever shows up first online.',
      'Pet shop customers want to know: what breeds do you carry? Do you do grooming? A website answers everything.',
      'Pet owners are a passionate community — they share and refer. Give them a professional link to recommend you.',
    ],
    platforms: ['📘 Facebook Pet Pages', '📸 Instagram Pet Photos', '💬 Viber Pet Communities', '🎵 TikTok Pet Content'],
    examples: [
      { name: 'PawCity Veterinary Clinic', city: 'Quezon City', tagline: 'Compassionate vet care for dogs, cats & small animals', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Veterinary Clinic' },
      { name: 'Furever Friends Pet Shop', city: 'Pasig', tagline: 'Premium pets, grooming & accessories for your beloved companions', accent: '#f472b6', bg: '#1a0010', text: '#fce7f3', badge: 'Pet Shop' },
    ],
    proofStat: '85%',
    proofLabel: 'of pet owners research a vet online before their first visit',
    cta: 'Get My Pet Business Website Free',
    metaTitle: 'Free Website for Pet Shops & Vets in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your pet shop or veterinary clinic in the Philippines. Ready in 60 seconds. No coding needed.',
  },

  travel: {
    category: 'generic',
    label: 'Travel Agencies & Tour Operators',
    emoji: '✈️',
    headline: 'Travelers book online. Your agency needs to be where they\'re looking.',
    subheadline: 'A free website showcasing your tours, packages, and destinations — so travelers find and book with you instead of a big online platform.',
    pain: [
      'Travelers compare packages online before they call anyone. Without a website, you\'re not even in the comparison.',
      'Trust is everything in travel — people are handing you their vacation money. A professional website builds that trust.',
      'Your Facebook posts get buried. A website keeps your packages visible and searchable forever.',
    ],
    platforms: ['📘 Facebook Travel Page', '📸 Instagram Destinations', '🎵 TikTok Travel Reels', '💬 Viber Group Tours'],
    examples: [
      { name: 'Isla Trips Philippines', city: 'Manila', tagline: 'Curated island hopping & adventure tours across the Philippines', accent: '#06b6d4', bg: '#001a1f', text: '#cffafe', badge: 'Tour Operator' },
      { name: 'TravelNow Agency', city: 'Cebu', tagline: 'Affordable travel packages to Japan, Korea, Europe & beyond', accent: '#6366f1', bg: '#1e1b4b', text: '#e0e7ff', badge: 'Travel Agency' },
    ],
    proofStat: '90%',
    proofLabel: 'of travelers research and compare packages online first',
    cta: 'Get My Travel Agency Website Free',
    metaTitle: 'Free Website for Travel Agencies in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your travel agency or tour operator in the Philippines. Showcase your packages. Ready in 60 seconds.',
  },

  events: {
    category: 'generic',
    label: 'Events & Catering Services',
    emoji: '🎉',
    headline: 'Every event client Googles before they inquire. Make sure they find you.',
    subheadline: 'A free website showing your past events, packages, and availability — so brides, corporate clients, and birthday families book you with confidence.',
    pain: [
      'Event budgets are big decisions. Clients spend hours researching online before they pick up the phone. No website = no shortlist.',
      'Your best events deserve to live somewhere permanent, not buried in a Facebook timeline from three years ago.',
      'Catering clients want to see: menu options, headcount capacity, price range. A website answers all three before the first call.',
    ],
    platforms: ['📘 Facebook Events Page', '📸 Instagram Event Photos', '🎵 TikTok Event Highlights', '💬 Viber Client Groups'],
    examples: [
      { name: 'Fiesta Catering Co.', city: 'Valenzuela', tagline: 'Full-service catering for weddings, birthdays & corporate events', accent: '#f59e0b', bg: '#1c0a00', text: '#fef3c7', badge: 'Catering' },
      { name: 'Grand Occasions Events', city: 'Manila', tagline: 'Elegant event styling & coordination for life\'s most important moments', accent: '#ec4899', bg: '#1a0010', text: '#fce7f3', badge: 'Events Organizer' },
    ],
    proofStat: '75%',
    proofLabel: 'of event bookings begin with an online search',
    cta: 'Get My Events Business Website Free',
    metaTitle: 'Free Website for Events & Catering Businesses in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your events, catering, or wedding coordination business in the Philippines. Ready in 60 seconds.',
  },

  realestate: {
    category: 'legal',
    label: 'Real Estate Brokers & Agents',
    emoji: '🏠',
    headline: 'Property buyers research agents online for weeks before they call.',
    subheadline: 'A free website that showcases your listings, credentials, and contact — so serious buyers and sellers find and trust you first.',
    pain: [
      'Buyers spend weeks researching online before they contact an agent. Without a website, you\'re invisible during the most important phase.',
      'Sellers want to know your track record. A website with past sales and testimonials wins listings before the pitch.',
      'Your listings on Facebook disappear in the feed. A website keeps every property permanently searchable.',
    ],
    platforms: ['📘 Facebook Property Listings', '📸 Instagram Property Photos', '💬 Viber Buyer Groups', '🏘️ Property Portals'],
    examples: [
      { name: 'Reyes Properties', city: 'Manila', tagline: 'Trusted real estate brokerage for residential & commercial properties', accent: '#f59e0b', bg: '#1c1208', text: '#fef3c7', badge: 'Real Estate Broker' },
      { name: 'Urban Living Realty', city: 'BGC, Taguig', tagline: 'Premium condo & house listings across Metro Manila', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Real Estate Agent' },
    ],
    proofStat: '95%',
    proofLabel: 'of property buyers start their search online',
    cta: 'Get My Real Estate Website Free',
    metaTitle: 'Free Website for Real Estate Brokers in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your real estate brokerage or agency in the Philippines. Showcase listings & credentials. Ready in 60 seconds.',
  },

  spa: {
    category: 'salon',
    label: 'Spas & Massage Centers',
    emoji: '💆',
    headline: 'Stressed Filipinos Google "massage near me" every single day.',
    subheadline: 'A free website showing your services, rates, and booking — so they choose your spa over every other result on the page.',
    pain: [
      '"Massage near me" and "spa [city]" are searched thousands of times monthly. Without a website, none of those searchers find you.',
      'First-time spa clients are nervous. Professional photos and a polished website turn hesitation into bookings.',
      'Corporate wellness packages are high-value. A website makes you look credible enough to pitch to HR managers.',
    ],
    platforms: ['📘 Facebook Page', '📸 Instagram Ambiance Photos', '💬 Viber Bookings', '🗣️ Office Referrals'],
    examples: [
      { name: 'Serenity Wellness Spa', city: 'Makati', tagline: 'Premium relaxation & therapeutic massage in the heart of Makati', accent: '#8b5cf6', bg: '#1e1b4b', text: '#ede9fe', badge: 'Wellness Spa' },
      { name: 'Hilot Healing Center', city: 'Quezon City', tagline: 'Traditional Filipino hilot & modern massage therapy', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Massage Center' },
    ],
    proofStat: '5×',
    proofLabel: 'more new clients for spas with Google visibility',
    cta: 'Get My Spa Website Free',
    metaTitle: 'Free Website for Spas & Massage Centers in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your spa or massage center in the Philippines. Show services, rates & booking info. Ready in 60 seconds.',
  },

  insurance: {
    category: 'legal',
    label: 'Insurance Agents & Financial Advisors',
    emoji: '🛡️',
    headline: 'Trust is everything in insurance. A professional website builds it before the first meeting.',
    subheadline: 'A free website that establishes your credibility, explains your products, and generates leads — so prospects come to you ready to buy.',
    pain: [
      'People are skeptical of insurance agents. A professional website with your credentials and client testimonials breaks down that wall.',
      'You compete with dozens of agents selling the same products. Your personal brand — shown through a website — is your only differentiator.',
      'Referrals are gold in insurance. Give your happy clients a professional link to share, not just your name and number.',
    ],
    platforms: ['📘 Facebook Personal Page', '💼 LinkedIn Profile', '💬 Viber Client Groups', '🗣️ Referral Network'],
    examples: [
      { name: 'Carlo Reyes — Financial Advisor', city: 'Makati', tagline: 'Helping Filipino families protect their future through smart financial planning', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Financial Advisor' },
      { name: 'Shield Insurance Solutions', city: 'Cebu', tagline: 'Life, health & non-life insurance tailored to your needs', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Insurance Agent' },
    ],
    proofStat: '3×',
    proofLabel: 'higher close rate for agents with a professional website',
    cta: 'Get My Insurance Website Free',
    metaTitle: 'Free Website for Insurance Agents in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your insurance agency or financial advisory practice in the Philippines. Build trust. Ready in 60 seconds.',
  },

  construction: {
    category: 'trades',
    label: 'Construction & Renovation',
    emoji: '🏗️',
    headline: 'Homeowners spend months planning renovations. Be the contractor they find first.',
    subheadline: 'A free website showcasing your past projects, services, and contact — so homeowners trust you with their biggest investment.',
    pain: [
      'Renovation clients research for months. A website with project photos puts you in front of them during every stage of that research.',
      'Construction scams are common in the Philippines. A professional website immediately signals you\'re legitimate and trustworthy.',
      'Large projects come from referrals — but referrals need a link. A website is that link.',
    ],
    platforms: ['📘 Facebook Page', '📸 Instagram Before/After', '💬 Viber Client Coordination', '🗣️ Contractor Referrals'],
    examples: [
      { name: 'CraftBuild Construction', city: 'Cavite', tagline: 'Quality residential construction & renovation — on time, on budget', accent: '#f59e0b', bg: '#1c1208', text: '#fef3c7', badge: 'General Contractor' },
      { name: 'InteriorPH Design & Build', city: 'Pasig', tagline: 'Interior design & full renovation services for modern Filipino homes', accent: '#8b5cf6', bg: '#1e1b4b', text: '#ede9fe', badge: 'Design & Build' },
    ],
    proofStat: '6×',
    proofLabel: 'more project inquiries for contractors with a portfolio website',
    cta: 'Get My Construction Website Free',
    metaTitle: 'Free Website for Construction & Renovation Contractors in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your construction or renovation business in the Philippines. Showcase your projects. Ready in 60 seconds.',
  },

  school: {
    category: 'generic',
    label: 'Schools & Learning Centers',
    emoji: '🏫',
    headline: 'Enrollment season is online now. Parents research schools before Open House.',
    subheadline: 'A free school website with your programs, tuition, and enrollment process — so families choose your institution with confidence.',
    pain: [
      'Parents research schools extensively online before visiting. No website means you\'re not on their shortlist.',
      'Enrollment questions flood your Facebook page and Messenger. A website answers: tuition, schedule, curriculum, requirements.',
      'Your academic achievements and milestones deserve a permanent, professional home — not buried in Facebook posts.',
    ],
    platforms: ['📘 Facebook School Page', '💬 Viber Parent Chats', '🗣️ Alumni Referrals'],
    examples: [
      { name: 'Sunrise Learning Center', city: 'Bulacan', tagline: 'Quality preschool & elementary education rooted in Filipino values', accent: '#f59e0b', bg: '#1c0a00', text: '#fef3c7', badge: 'Learning Center' },
      { name: 'Horizon Academy', city: 'Laguna', tagline: 'Holistic K–12 education for the next generation of Filipino leaders', accent: '#6366f1', bg: '#1e1b4b', text: '#e0e7ff', badge: 'Private School' },
    ],
    proofStat: '8 in 10',
    proofLabel: 'families research a school online before enrolling',
    cta: 'Get My School Website Free',
    metaTitle: 'Free Website for Schools & Learning Centers in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your school or learning center in the Philippines. Answer enrollment questions online. Ready in 60 seconds.',
  },

  pharmacy: {
    category: 'medical',
    label: 'Pharmacies & Drugstores',
    emoji: '💊',
    headline: 'When people need medicine fast, they Google the nearest pharmacy.',
    subheadline: 'A free website showing your location, hours, and services — so your pharmacy is the first one they find and trust.',
    pain: [
      'Customers Google "pharmacy open near me" especially at night and on holidays. Without a website, they go elsewhere.',
      'Independent pharmacies compete with big chains. A professional website levels the playing field by showing your quality and service.',
      'Delivery and reservation services are your edge. A website lets you promote these 24/7 without spending on ads.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber Medicine Orders', '🗣️ Barangay Word of Mouth'],
    examples: [
      { name: 'Caringal Pharmacy', city: 'Marikina', tagline: 'Your trusted neighborhood pharmacy — open 7 days, with delivery available', accent: '#10b981', bg: '#022c22', text: '#d1fae5', badge: 'Pharmacy' },
      { name: 'MediCare Drugstore', city: 'Paranaque', tagline: 'Affordable generic & branded medicines with fast same-day delivery', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Drugstore' },
    ],
    proofStat: '4×',
    proofLabel: 'more foot traffic for pharmacies with Google Maps presence',
    cta: 'Get My Pharmacy Website Free',
    metaTitle: 'Free Website for Pharmacies & Drugstores in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your pharmacy or drugstore in the Philippines. Show hours, location & delivery services. Ready in 60 seconds.',
  },

  transport: {
    category: 'generic',
    label: 'Transport & Logistics Services',
    emoji: '🚚',
    headline: 'Shippers and businesses Google freight and delivery services before they call.',
    subheadline: 'A free website showing your routes, rates, and vehicle fleet — so logistics clients choose your service over the competition.',
    pain: [
      'B2B logistics clients research online before signing contracts. No website means you\'re excluded from corporate shortlists.',
      'Customers want to know: what areas do you cover? What\'s your rate per km? A website answers this instantly.',
      'Referrals and repeat business are the lifeblood of logistics. A professional website gives you a credible identity to build on.',
    ],
    platforms: ['📘 Facebook Page', '💬 Viber / SMS Bookings', '🗣️ Shipper Referral Networks'],
    examples: [
      { name: 'SwiftHaul Logistics', city: 'Manila', tagline: 'Reliable cargo delivery across Luzon — same day and scheduled', accent: '#f97316', bg: '#1c0a00', text: '#ffedd5', badge: 'Logistics' },
      { name: 'Metro Courier Express', city: 'Quezon City', tagline: 'Fast, affordable same-day delivery for businesses in Metro Manila', accent: '#3b82f6', bg: '#0f172a', text: '#dbeafe', badge: 'Courier Service' },
    ],
    proofStat: '60%',
    proofLabel: 'of logistics B2B clients research providers online first',
    cta: 'Get My Transport Business Website Free',
    metaTitle: 'Free Website for Transport & Logistics Services in the Philippines | Guma AI',
    metaDesc: 'Get a free professional website for your transport, courier, or logistics business in the Philippines. Show routes & rates. Ready in 60 seconds.',
  },
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { niche: string } }
): Promise<Metadata> {
  const niche = NICHES[params.niche]
  if (!niche) return { title: 'Guma AI' }
  return {
    title: niche.metaTitle,
    description: niche.metaDesc,
    openGraph: {
      title: niche.metaTitle,
      description: niche.metaDesc,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NichePage({ params }: { params: { niche: string } }) {
  const niche = NICHES[params.niche]
  if (!niche) notFound()

  const wizardUrl = `/auth/signup/manual?category=${niche.category}`

  return (
    <div className="min-h-screen bg-[#0a0b12] text-white overflow-x-hidden font-sans">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo/8 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] right-[5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/"><img src="/guma-logo.png" alt="Guma AI" className="h-8 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/start" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Build my website
            </Link>
            <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">

          <div className="inline-flex items-center gap-2 bg-zinc-800/60 border border-white/10 text-zinc-300 text-xs font-bold px-4 py-1.5 rounded-full">
            <span className="text-xl leading-none">{niche.emoji}</span>
            {niche.label}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight text-white">
            {niche.headline.split('.')[0]}.{' '}
            {niche.headline.includes('.') && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-light via-violet-400 to-indigo">
                {niche.headline.split('.').slice(1).join('.').trim()}
              </span>
            )}
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {niche.subheadline}
          </p>

          {/* Proof stat */}
          <div className="inline-flex items-center gap-4 bg-zinc-900/60 border border-white/8 rounded-2xl px-6 py-3">
            <div className="text-3xl font-black text-white">{niche.proofStat}</div>
            <div className="text-sm text-zinc-400 text-left leading-snug max-w-[200px]">{niche.proofLabel}</div>
          </div>

          {/* Platforms */}
          <div className="flex flex-wrap justify-center gap-2">
            {niche.platforms.map(p => (
              <span key={p} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 bg-zinc-900/40 text-zinc-400">
                {p}
              </span>
            ))}
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo/30 bg-indigo/10 text-indigo-light">
              + your own website ✦
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={wizardUrl}
              className="btn-primary rounded-full py-4 px-10 text-base font-black shadow-xl shadow-indigo/25 inline-flex items-center gap-2 justify-center"
            >
              {niche.cta} <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full py-4 px-8 text-sm font-semibold border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition inline-flex items-center gap-2 justify-center"
            >
              Search if my site is ready
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['100% free to start', 'No coding needed', 'Ready in 60 seconds', 'Works on mobile'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <Check size={12} className="text-emerald-400" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Example Sites */}
      <section className="py-16 border-y border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">What your site could look like</p>
            <h2 className="text-2xl font-extrabold text-white">Real examples for {niche.label.toLowerCase()}</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {niche.examples.map((ex, i) => (
              <div key={i} className="rounded-[1.5rem] overflow-hidden border border-white/5 bg-zinc-900/40 hover:-translate-y-1 transition-all duration-300">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 bg-zinc-800 rounded px-3 py-0.5 text-[9px] text-zinc-500 font-mono truncate mx-3">
                    guma.ai/sites/{ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-{ex.city.toLowerCase().split(',')[0].replace(/[^a-z0-9]+/g, '-')}
                  </div>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full">Live</span>
                </div>

                {/* Site preview */}
                <div className="p-1">
                  <div
                    className="rounded-b-xl p-5 space-y-3"
                    style={{ background: ex.bg }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: ex.accent }}>{ex.badge}</p>
                        <h3 className="font-black text-base leading-tight mb-1.5" style={{ color: ex.text }}>{ex.name}</h3>
                        <p className="text-[10px] leading-relaxed" style={{ color: ex.text, opacity: 0.6 }}>{ex.tagline}</p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: ex.accent + '22', border: `1px solid ${ex.accent}44` }}
                      >
                        {niche.emoji}
                      </div>
                    </div>
                    <div
                      className="inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-full"
                      style={{ background: ex.accent, color: '#000' }}
                    >
                      {niche.category === 'restaurant' ? 'View Menu' :
                       niche.category === 'medical'    ? 'Book Appointment' :
                       niche.category === 'salon'      ? 'Book Now' :
                       niche.category === 'trades'     ? 'Get Free Quote' :
                       'Contact Us'} <ArrowRight size={9} />
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{ex.name}</p>
                    <p className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                      <MapPin size={8} /> {ex.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={9} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Why {niche.label.toLowerCase()} need their own website</h2>
          </div>

          <div className="space-y-4">
            {niche.pain.map((p, i) => (
              <div key={i} className="flex gap-4 bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-indigo/20 transition">
                <div className="w-8 h-8 rounded-xl bg-indigo/10 border border-indigo/20 flex items-center justify-center flex-shrink-0 text-sm font-black text-indigo-light">
                  {i + 1}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-white">Ready in 3 steps — takes 60 seconds</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: '01', icon: '✍️', title: 'Tell us your business name', desc: 'Add your tagline — what makes you special in one line.' },
              { n: '02', icon: '⚡', title: 'We build it instantly', desc: 'No waiting. Your professional site is ready before you finish reading this.' },
              { n: '03', icon: '🌐', title: 'Go live — free', desc: 'Share your link on all your platforms. Customers find you on Google too.' },
            ].map(s => (
              <div key={s.n} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 text-center hover:border-indigo/20 transition">
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-[10px] font-black tracking-widest text-indigo-light/50 uppercase mb-1">Step {s.n}</div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-indigo/10 via-zinc-900/40 to-zinc-950/60 border border-indigo/20 rounded-[2rem] p-10 text-center space-y-6 relative overflow-hidden">
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo/10 blur-3xl pointer-events-none" />
            <div className="text-4xl">{niche.emoji}</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Your {niche.label.toLowerCase().split('&')[0].trim()} deserves to be found online.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Free. No coding. No maintenance. Built in 60 seconds.
            </p>
            <Link
              href={wizardUrl}
              className="btn-primary py-4 px-10 rounded-full shadow-xl shadow-indigo/25 inline-flex text-sm font-black items-center gap-2"
            >
              {niche.cta} <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-zinc-600">No credit card · No technical skills · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Browse other niches */}
      <section className="py-12 px-6 border-t border-white/5 bg-zinc-950/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600 text-center mb-6">Other business types</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(NICHES)
              .filter(([key]) => key !== params.niche)
              .map(([key, n]) => (
                <Link
                  key={key}
                  href={`/for/${key}`}
                  className="text-xs font-semibold px-3 py-2 rounded-full border border-white/8 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-white/20 transition"
                >
                  {n.emoji} {n.label.split('&')[0].trim()}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080910] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} Guma AI. All rights reserved.</span>
          <div className="flex gap-6 text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/start" className="hover:text-white transition-colors">Build my website</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Static params for build-time generation ─────────────────────────────────

export function generateStaticParams() {
  return Object.keys(NICHES).map(niche => ({ niche }))
}
