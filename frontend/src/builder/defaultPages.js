/**
 * Default Builder Pages Schema for NEXUS ITC Portal 2026
 * Structured JSON configuration mapping to safe component nodes.
 */

export const INITIAL_BUILDER_PAGES = [
  {
    id: 'home',
    slug: '/',
    title: 'Beranda (Home)',
    description: 'Halaman utama festival teknologi dan etalase informasi publik',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    elements: [
      {
        id: 'sec-hero',
        type: 'section',
        props: {
          id: 'hero-section',
          name: 'Hero Showcase Section',
          paddingY: 'py-20',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'hero-main-block',
            type: 'hero_block',
            props: {
              badgeText: 'EDITION 2026 // NATIONAL TECHFEST',
              headline1: 'SHAPE THE',
              headline2: 'FUTURE OF',
              headlineAccent: 'INNOVATION.',
              description: 'Kompetisi teknologi informasi dan festival inovasi digital bergengsi se-Indonesia. Kembangkan solusi digital berdampak tinggi, raih prize pool puluhan juta rupiah, dan perluas jejaring profesional.',
              primaryBtnText: 'Daftar Sekarang',
              primaryBtnLink: '/register',
              secondaryBtnText: 'Eksplorasi Cabang Lomba',
              secondaryBtnLink: '/competitions',
              stat1Label: 'TOTAL PRIZE POOL',
              stat1Value: 'Rp 50JT+',
              stat2Label: 'JENJANG PESERTA',
              stat2Value: 'Mahasiswa & SMA',
              stat3Label: 'CABANG KOMPETISI',
              stat3Value: '6 Kategori',
            },
          },
        ],
      },
      {
        id: 'sec-about',
        type: 'section',
        props: {
          id: 'about-section',
          name: 'Tentang Acara (About)',
          paddingY: 'py-24',
          background: 'bg-[#17110D]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'about-main-block',
            type: 'about_block',
            props: {
              badgeText: '// 01. ABOUT THE EVENT',
              title: 'Mewadahi Inovasi Digital Generasi Muda Menuju Masa Depan Teknologi',
              story: 'HIMATIF IT Competition & Technology Festival (NEXUS ITC 2026) merupakan festival kompetisi teknologi informasi terbesar se-wilayah Cirebon, Indramayu, Majalengka, Kuningan (Ciayumajakuning) dan terbuka secara nasional.',
              stat1Val: '6 Cabang',
              stat1Lbl: 'Lomba Pilihan',
              stat2Val: 'Rp 50Jt+',
              stat2Lbl: 'Total Hadiah',
              stat3Val: '2 Tingkat',
              stat3Lbl: 'Mahasiswa & SMA',
              stat4Val: 'Hybrid',
              stat4Lbl: 'Pelaksanaan',
            },
          },
        ],
      },
      {
        id: 'sec-competitions',
        type: 'section',
        props: {
          id: 'competitions-section',
          name: 'Cabang Kompetisi',
          paddingY: 'py-24',
          background: 'bg-[#17110D]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'comp-list-block',
            type: 'competition_list',
            props: {
              badge: '// 03. COMPETITIONS',
              title: 'Cabang Lomba',
              highlight: 'Resmi 2026',
              description: 'Pilih cabang kompetisi sesuai minat keahlian dan jenjang pendidikan Anda.',
              showFilters: true,
            },
          },
        ],
      },
      {
        id: 'sec-timeline',
        type: 'section',
        props: {
          id: 'timeline-section',
          name: 'Lini Masa Acara',
          paddingY: 'py-24',
          background: 'bg-[#100B08]',
          glow: false,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'timeline-main-block',
            type: 'timeline_block',
            props: {
              badge: '// 04. TIMELINE',
              title: 'Lini Masa &',
              highlight: 'Agenda Resmi',
              description: 'Catat tanggal penting pendaftaran, batas pengumpulan karya, hingga awarding night.',
            },
          },
        ],
      },
      {
        id: 'sec-prizepool',
        type: 'section',
        props: {
          id: 'prizepool-section',
          name: 'Total Hadiah (Prize Pool)',
          paddingY: 'py-24',
          background: 'bg-[#17110D]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'prizepool-main-block',
            type: 'prizepool_block',
            props: {
              badge: '// 05. AWARDS & PRIZES',
              title: 'Total Prize Pool &',
              highlight: 'Apresiasi Juara',
              totalAmount: 'Rp 50.000.000+',
              description: 'Total hadiah pembinaan tunai, trofi bergengsi, dan sertifikat resmi tingkat nasional.',
            },
          },
        ],
      },
      {
        id: 'sec-faq',
        type: 'section',
        props: {
          id: 'faq-section',
          name: 'Tanya Jawab (FAQ)',
          paddingY: 'py-24',
          background: 'bg-[#100B08]',
          glow: false,
          maxWidth: 'max-w-5xl',
        },
        children: [
          {
            id: 'faq-main-block',
            type: 'faq_block',
            props: {
              badge: '// 06. FREQUENTLY ASKED',
              title: 'Pertanyaan yang Sering',
              highlight: 'Diajukan',
              description: 'Temukan jawaban cepat seputar persyaratan pendaftaran dan sistem perlombaan.',
            },
          },
        ],
      },
      {
        id: 'sec-sponsors',
        type: 'section',
        props: {
          id: 'sponsors-section',
          name: 'Sponsor & Mitra Acara',
          paddingY: 'py-24',
          background: 'bg-[#17110D]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'sponsors-main-block',
            type: 'sponsor_block',
            props: {
              badge: '// 07. PARTNERS & ECOSYSTEM',
              title: 'Kolaborator &',
              highlight: 'Mitra Pendukung',
              description: 'Didukung oleh jaringan ekosistem teknologi dan industri terkemuka.',
            },
          },
        ],
      },
      {
        id: 'sec-cta',
        type: 'section',
        props: {
          id: 'cta-section',
          name: 'Ajakan Bergabung (Final CTA)',
          paddingY: 'py-20',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-5xl',
        },
        children: [
          {
            id: 'final-cta-block',
            type: 'cta_box',
            props: {
              badge: 'PENDAFTARAN DIBUKA // EDISI 2026',
              title: 'Siap Membuktikan Inovasi Digital Terbaik Anda?',
              description: 'Daftarkan tim Anda sekarang dan bergabunglah dengan ratusan talenta terbaik se-Indonesia.',
              buttonText: 'Buat Akun Peserta Sekarang',
              buttonLink: '/register',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'about',
    slug: '/about',
    title: 'Tentang Acara (About)',
    description: 'Profil festival, visi transformasi digital, dan latar belakang penyelenggara',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    elements: [
      {
        id: 'sec-about-page-header',
        type: 'section',
        props: {
          id: 'about-header',
          name: 'Header Tentang Acara',
          paddingY: 'py-24',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-5xl',
        },
        children: [
          {
            id: 'about-heading',
            type: 'heading',
            props: {
              level: 'h1',
              text: 'Tentang Festival & Visi Transformasi',
              align: 'center',
              gradient: true,
              size: 'text-4xl sm:text-5xl',
            },
          },
          {
            id: 'about-subtext',
            type: 'text',
            props: {
              content: 'Mewadahi talenta digital, mahasiswa, dan pelajar muda Indonesia untuk berinovasi dan berkarya melalui kompetisi IT berstandar tinggi.',
              align: 'center',
              color: 'text-[#C4B3A7]',
              size: 'text-lg',
            },
          },
        ],
      },
      {
        id: 'sec-about-details',
        type: 'section',
        props: {
          id: 'about-details',
          name: 'Detail Visi & Penyelenggara',
          paddingY: 'py-16',
          background: 'bg-[#17110D]',
          glow: false,
          maxWidth: 'max-w-5xl',
        },
        children: [
          {
            id: 'card-latar-belakang',
            type: 'card',
            props: {
              title: 'Latar Belakang & Identitas',
              description: 'Himpunan Mahasiswa Teknik Informatika menyelenggarakan NEXUS IT Competition 2026 sebagai ajang kompetisi tahunan bergengsi untuk melahirkan talenta unggul di bidang kecerdasan buatan, rekayasa perangkat lunak, dan keamanan siber.',
              padding: 'p-8',
              border: true,
            },
          },
          {
            id: 'card-misi',
            type: 'card',
            props: {
              title: 'Visi & Misi Utama',
              description: 'Mendorong produk digital aplikatif, membiasakan peserta dengan standar kode bersih dan metodologi pengujian industri, serta memperluas kolaborasi lintas institusi se-nusantara.',
              padding: 'p-8',
              border: true,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'competitions',
    slug: '/competitions',
    title: 'Daftar Kompetisi',
    description: 'Katalog lengkap 6 cabang kompetisi IT dan panduan teknis',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    elements: [
      {
        id: 'sec-comp-header',
        type: 'section',
        props: {
          id: 'comp-header',
          name: 'Header Lomba',
          paddingY: 'py-20',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'comp-block-main',
            type: 'competition_list',
            props: {
              badge: '// CATALOG // CABANG LOMBA RESMI',
              title: 'Pilih Bidang',
              highlight: 'Keahlian Anda',
              description: 'Seluruh cabang kompetisi dirancang dengan rubrik terstandar dewan juri pakar industri dan akademisi.',
              showFilters: true,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'timeline',
    slug: '/timeline',
    title: 'Timeline & Jadwal',
    description: 'Tahapan pendaftaran, seleksi berkas, semifinal, dan awarding',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    elements: [
      {
        id: 'sec-time-header',
        type: 'section',
        props: {
          id: 'time-header',
          name: 'Lini Masa Lengkap',
          paddingY: 'py-20',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-7xl',
        },
        children: [
          {
            id: 'time-block-main',
            type: 'timeline_block',
            props: {
              badge: '// ROADMAP // TAHAPAN ACARA',
              title: 'Lini Masa &',
              highlight: 'Agenda Resmi',
              description: 'Pastikan tim Anda memenuhi seluruh tenggat waktu administrasi dan pengumpulan karya.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'faq',
    slug: '/faq',
    title: 'Pusat Bantuan (FAQ)',
    description: 'Tanya jawab berkas, pendaftaran, sistem penilaian, dan pelaksanaan',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    elements: [
      {
        id: 'sec-faq-header',
        type: 'section',
        props: {
          id: 'faq-header',
          name: 'Pusat Bantuan FAQ',
          paddingY: 'py-20',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-5xl',
        },
        children: [
          {
            id: 'faq-block-main',
            type: 'faq_block',
            props: {
              badge: '// HELP CENTER // FREQUENTLY ASKED',
              title: 'Pertanyaan yang Sering',
              highlight: 'Ditanyakan',
              description: 'Dapatkan panduan komprehensif mengenai tata cara registrasi, pembayaran, hingga sistem kurasi juri.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'contact',
    slug: '/contact',
    title: 'Kontak & Sekretariat',
    description: 'Saluran bantuan helpdesk, surel resmi, dan lokasi sekretariat',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    elements: [
      {
        id: 'sec-contact-header',
        type: 'section',
        props: {
          id: 'contact-header',
          name: 'Header Kontak',
          paddingY: 'py-20',
          background: 'bg-[#100B08]',
          glow: true,
          maxWidth: 'max-w-5xl',
        },
        children: [
          {
            id: 'contact-heading',
            type: 'heading',
            props: {
              level: 'h1',
              text: 'Hubungi Sekretariat NEXUS ITC 2026',
              align: 'center',
              gradient: true,
              size: 'text-4xl sm:text-5xl',
            },
          },
          {
            id: 'contact-subtext',
            type: 'text',
            props: {
              content: 'Ada pertanyaan atau membutuhkan pendampingan? Tim sekretariat kami siap membantu Anda setiap hari kerja.',
              align: 'center',
              color: 'text-[#C4B3A7]',
              size: 'text-base',
            },
          },
          {
            id: 'card-contact-channels',
            type: 'card',
            props: {
              title: 'Pusat Informasi & Saluran Bantuan',
              description: 'Email: contact@nexusitc2026.id | WhatsApp: +62 812-3456-7890 | Sekretariat: Gedung HIMATIF Center, Cirebon, Jawa Barat',
              padding: 'p-8',
              border: true,
            },
          },
        ],
      },
    ],
  },
];

export const INITIAL_BUILDER_ASSETS = [
  {
    id: 'ast-hero-emblem',
    name: 'Nexus Core Emblem',
    category: 'graphic',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    type: 'image/jpeg',
    size: '142 KB',
    alt: 'Futuristic Nexus Emblem Artwork',
  },
  {
    id: 'ast-sponsor-mandiri',
    name: 'Mandiri Digital Logo',
    category: 'sponsor',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=300&q=80',
    type: 'image/jpeg',
    size: '48 KB',
    alt: 'Bank Mandiri Digital Partner Logo',
  },
  {
    id: 'ast-sponsor-telkomsel',
    name: 'Telkomsel Enterprise Logo',
    category: 'sponsor',
    url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=300&q=80',
    type: 'image/jpeg',
    size: '52 KB',
    alt: 'Telkomsel Enterprise Partner Logo',
  },
  {
    id: 'ast-banner-techfest',
    name: 'Techfest Atmosphere Banner',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    type: 'image/jpeg',
    size: '310 KB',
    alt: 'Cyber Tech Festival Stage Background',
  },
];
