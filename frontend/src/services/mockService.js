/**
 * Mock Service Layer for HIMATIF IT Competition & TechFest Platform
 * Handles local state operations, mock authentication, CRUD actions,
 * duplicate checks, and weighted evaluation calculations.
 */

import {
  INITIAL_USERS,
  INITIAL_COMPETITIONS,
  INITIAL_REGISTRATIONS,
  INITIAL_JUDGES,
  INITIAL_EVALUATIONS,
  INITIAL_SCHEDULES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ACTIVITIES,
} from '../data/mockData';

// Helper to get or init localStorage data safely
const getStored = (key, fallback) => {
  try {
    const item = localStorage.getItem(`fest_${key}`);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    // If fallback is an array and stored item is empty or invalid array, fallback to initial data
    if (Array.isArray(fallback) && (!Array.isArray(parsed) || parsed.length === 0)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(`fest_${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
};

class MockService {
  constructor() {
    this.users = getStored('users', INITIAL_USERS);
    this.competitions = getStored('competitions', INITIAL_COMPETITIONS);
    this.registrations = getStored('registrations', INITIAL_REGISTRATIONS);
    this.judges = getStored('judges', INITIAL_JUDGES);
    this.evaluations = getStored('evaluations', INITIAL_EVALUATIONS);
    this.schedules = getStored('schedules', INITIAL_SCHEDULES);
    this.announcements = getStored('announcements', INITIAL_ANNOUNCEMENTS);
    this.activities = getStored('activities', INITIAL_ACTIVITIES);

    // Normalize any legacy or missing fields in competitions
    this.normalizeCompetitions();
  }

  normalizeCompetitions() {
    const catMap = {
      'Design & Human Experience': { category: 'ui_ux', label: 'UI/UX Design' },
      'Engineering & Software Architecture': { category: 'web_dev', label: 'Web Development' },
      'Algorithms & Computational Logic': { category: 'competitive_prog', label: 'Competitive Programming' },
      'Cyber Defense & Ethical Hacking': { category: 'cyber_security', label: 'Cyber Security' },
      'Machine Learning & Predictive Intelligence': { category: 'data_science', label: 'Data Science' },
      'Scientific Research & Applied Technology': { category: 'web_dev', label: 'Web Development' },
    };

    const statusMap = {
      draft: 'Draft',
      registration_open: 'Pendaftaran Dibuka',
      registration_closed: 'Pendaftaran Ditutup',
      judging: 'Tahap Penjurian',
      finished: 'Selesai',
    };

    let changed = false;
    this.competitions = this.competitions.map((c) => {
      let updated = { ...c };
      if (catMap[c.category]) {
        updated.category = catMap[c.category].category;
        updated.category_label = catMap[c.category].label;
        changed = true;
      }
      if (c.status && statusMap[c.status] && updated.status_label !== statusMap[c.status]) {
        updated.status_label = statusMap[c.status];
        changed = true;
      }
      return updated;
    });

    if (changed) {
      this.saveState();
    }
  }

  saveState() {
    setStored('users', this.users);
    setStored('competitions', this.competitions);
    setStored('registrations', this.registrations);
    setStored('judges', this.judges);
    setStored('evaluations', this.evaluations);
    setStored('schedules', this.schedules);
    setStored('announcements', this.announcements);
    setStored('activities', this.activities);
  }

  // --- AUTH METHODS ---
  async login({ email, password }) {
    // Artificial small delay for UX feedback
    await new Promise((r) => setTimeout(r, 350));

    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      throw new Error('Akun dengan email ini tidak ditemukan.');
    }

    // In prototype mock mode, accept demo password or standard string
    const token = `mock-token-${user.id}-${Date.now()}`;
    const userData = { ...user };
    delete userData.password;

    return {
      success: true,
      data: {
        user: userData,
        token,
      },
    };
  }

  async register({ name, email, studentId, institution, phone, password }) {
    await new Promise((r) => setTimeout(r, 400));

    const existing = this.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
    }

    const newUser = {
      id: `usr-part-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: 'participant', // Public registration ALWAYS creates a participant
      status: 'active',
      avatar: name.trim().charAt(0).toUpperCase(),
      studentId: studentId?.trim() || 'NIM-PENDING',
      institution: institution?.trim() || 'Institusi Umum',
      phone: phone?.trim() || '',
    };

    this.users.push(newUser);
    this.activities.unshift({
      id: `act-${Date.now()}`,
      type: 'registration',
      description: `Peserta baru ${newUser.name} berhasil membuat akun`,
      timestamp: 'Baru saja',
    });

    this.saveState();

    const token = `mock-token-${newUser.id}-${Date.now()}`;
    return {
      success: true,
      data: {
        user: newUser,
        token,
      },
    };
  }

  async getMe(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan');
    return { success: true, data: user };
  }

  // --- PARTICIPANT METHODS ---
  getParticipantOverview(participantId) {
    const myRegistrations = this.registrations.filter((r) => r.participantId === participantId);
    const approvedCount = myRegistrations.filter((r) => r.status === 'approved').length;
    const pendingCount = myRegistrations.filter((r) => r.status === 'pending').length;
    const upcomingSchedules = this.schedules
      .filter((s) => s.status === 'upcoming')
      .slice(0, 3);
    const recentAnnouncements = this.announcements
      .filter((a) => a.status === 'published' && (a.audience === 'all' || a.audience === 'participants'))
      .slice(0, 3);

    return {
      registeredCount: myRegistrations.length,
      approvedCount,
      pendingCount,
      myRegistrations,
      upcomingSchedules,
      recentAnnouncements,
    };
  }

  registerForCompetition(participant, { competitionId, teamName, members = [] }) {
    const comp = this.competitions.find((c) => c.id === competitionId || c.slug === competitionId);
    if (!comp) throw new Error('Cabang kompetisi tidak valid.');

    // Prevent duplicate registration for the same participant and competition
    const existing = this.registrations.find(
      (r) => r.participantId === participant.id && r.competitionId === comp.id
    );

    if (existing) {
      throw new Error(`Anda sudah terdaftar pada cabang lomba "${comp.name}". Pendaftaran ganda tidak diizinkan.`);
    }

    const newReg = {
      id: `reg-${Date.now()}`,
      participantId: participant.id,
      participantName: participant.name,
      participantEmail: participant.email,
      participantInstitution: participant.institution || 'Institusi Peserta',
      competitionId: comp.id,
      competitionName: comp.name,
      teamName: teamName?.trim() || `${participant.name} Team`,
      teamMembers: members.length > 0 ? members : [{ name: participant.name, role: 'Ketua Tim', studentId: participant.studentId || '-' }],
      status: 'pending',
      paymentStatus: 'pending_verification',
      submissionStatus: 'pending',
      submissionTitle: '',
      submissionUrl: '',
      createdAt: new Date().toISOString(),
    };

    this.registrations.unshift(newReg);
    this.activities.unshift({
      id: `act-${Date.now()}`,
      type: 'registration',
      description: `Tim ${newReg.teamName} mendaftar pada cabang ${comp.name}`,
      timestamp: 'Baru saja',
    });

    this.saveState();
    return newReg;
  }

  updateParticipantProfile(userId, updatedFields) {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('Peserta tidak ditemukan');

    this.users[idx] = {
      ...this.users[idx],
      name: updatedFields.name?.trim() || this.users[idx].name,
      phone: updatedFields.phone?.trim() || this.users[idx].phone,
      institution: updatedFields.institution?.trim() || this.users[idx].institution,
      studentId: updatedFields.studentId?.trim() || this.users[idx].studentId,
    };

    this.saveState();
    return this.users[idx];
  }

  // --- JUDGE METHODS ---
  getJudgeOverview(judgeEmailOrId) {
    const judge = this.judges.find(
      (j) => j.id === judgeEmailOrId || j.email === judgeEmailOrId
    ) || this.judges[0];

    const assignedComps = this.competitions.filter((c) =>
      judge.assignedCompetitions?.includes(c.id)
    );

    const assignedCompIds = assignedComps.map((c) => c.id);
    const assignedSubmissions = this.registrations.filter(
      (r) => assignedCompIds.includes(r.competitionId) && r.status === 'approved'
    );

    const judgeEvals = this.evaluations.filter((e) => e.judgeId === judge.id);
    const completedCount = judgeEvals.filter((e) => e.status === 'submitted').length;
    const pendingCount = Math.max(0, assignedSubmissions.length - completedCount);

    return {
      judge,
      assignedCompetitions: assignedComps,
      totalSubmissions: assignedSubmissions.length,
      completedEvaluations: completedCount,
      pendingEvaluations: pendingCount,
      recentEvaluations: judgeEvals.slice(0, 5),
    };
  }

  saveJudgeEvaluation({
    judgeId,
    registrationId,
    scores,
    feedback,
    status = 'draft',
  }) {
    const reg = this.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Data registrasi peserta tidak ditemukan.');

    const comp = this.competitions.find((c) => c.id === reg.competitionId);
    if (!comp) throw new Error('Data kompetisi tidak ditemukan.');

    // Calculate weighted total consistently based on rubric
    let totalScore = 0;
    const rubric = comp.rubric || [
      { id: 'crit-1', name: 'Kualitas Teknis', weight: 40 },
      { id: 'crit-2', name: 'Inovasi', weight: 30 },
      { id: 'crit-3', name: 'Presentasi', weight: 20 },
      { id: 'crit-4', name: 'Dokumentasi', weight: 10 },
    ];

    rubric.forEach((crit) => {
      const val = Number(scores[crit.id]) || 0;
      // Clamp between 0 and 100
      const clamped = Math.max(0, Math.min(100, val));
      totalScore += (clamped * crit.weight) / 100;
    });

    totalScore = Number(totalScore.toFixed(2));

    const existingIdx = this.evaluations.findIndex(
      (e) => e.judgeId === judgeId && e.registrationId === registrationId
    );

    const evalRecord = {
      id: existingIdx !== -1 ? this.evaluations[existingIdx].id : `eval-${Date.now()}`,
      judgeId,
      registrationId,
      competitionId: comp.id,
      teamName: reg.teamName,
      submissionTitle: reg.submissionTitle || 'Karya Tim',
      submissionUrl: reg.submissionUrl || '#',
      scores,
      totalScore,
      feedback: feedback?.trim() || '',
      status, // 'draft' | 'submitted'
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.evaluations[existingIdx] = evalRecord;
    } else {
      this.evaluations.unshift(evalRecord);
    }

    if (status === 'submitted') {
      this.activities.unshift({
        id: `act-${Date.now()}`,
        type: 'evaluation',
        description: `Penilaian final diserahkan untuk tim ${reg.teamName} (${comp.name}) - Nilai: ${totalScore}`,
        timestamp: 'Baru saja',
      });
    }

    this.saveState();
    return evalRecord;
  }

  // --- ADMIN METHODS ---
  getAdminOverview() {
    const totalParticipants = this.users.filter((u) => u.role === 'participant').length;
    const totalCompetitions = this.competitions.length;
    const totalJudges = this.judges.length;
    const pendingRegistrations = this.registrations.filter((r) => r.status === 'pending').length;
    const approvedRegistrations = this.registrations.filter((r) => r.status === 'approved').length;

    return {
      totalParticipants,
      totalCompetitions,
      totalJudges,
      pendingRegistrations,
      approvedRegistrations,
      recentActivities: this.activities.slice(0, 6),
      upcomingMilestones: this.schedules.filter((s) => s.status === 'upcoming').slice(0, 4),
    };
  }

  updateRegistrationStatus(regId, newStatus) {
    const idx = this.registrations.findIndex((r) => r.id === regId);
    if (idx === -1) throw new Error('Data pendaftaran tidak ditemukan.');

    this.registrations[idx].status = newStatus;
    if (newStatus === 'approved') {
      this.registrations[idx].paymentStatus = 'paid';
    }

    this.activities.unshift({
      id: `act-${Date.now()}`,
      type: 'approval',
      description: `Admin memperbarui status pendaftaran ${this.registrations[idx].teamName} menjadi: ${newStatus.toUpperCase()}`,
      timestamp: 'Baru saja',
    });

    this.saveState();
    return this.registrations[idx];
  }

  createOrUpdateCompetition(data) {
    const categoryLabels = {
      ui_ux: 'UI/UX Design',
      web_dev: 'Web Development',
      mobile_dev: 'Mobile App',
      competitive_prog: 'Competitive Programming',
      data_science: 'Data Science',
      cyber_security: 'Cyber Security',
    };

    const statusLabels = {
      draft: 'Draft',
      registration_open: 'Pendaftaran Dibuka',
      registration_closed: 'Pendaftaran Ditutup',
      judging: 'Tahap Penjurian',
      finished: 'Selesai',
    };

    const targetCategory = data.category || 'ui_ux';
    const targetStatus = data.status || 'registration_open';
    const catLabel = data.category_label || categoryLabels[targetCategory] || targetCategory;
    const statLabel = data.status_label || statusLabels[targetStatus] || targetStatus;

    if (data.id) {
      const idx = this.competitions.findIndex((c) => c.id === data.id);
      if (idx !== -1) {
        this.competitions[idx] = {
          ...this.competitions[idx],
          ...data,
          category: targetCategory,
          category_label: catLabel,
          status: targetStatus,
          status_label: statLabel,
        };
        this.saveState();
        return this.competitions[idx];
      }
    }

    const newComp = {
      id: `comp-${Date.now()}`,
      slug: (data.name || 'kompetisi').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: data.name,
      category: targetCategory,
      category_label: catLabel,
      target_level: data.target_level || 'all',
      target_level_label: data.target_level_label || 'Mahasiswa & SMA',
      theme: data.theme || 'Inovasi Digital',
      description: data.description || '',
      prizePool: data.prizePool || 'Rp 5.000.000',
      min_team_member: Number(data.min_team_member) || 1,
      max_team_member: Number(data.max_team_member) || 3,
      registration_fee: Number(data.registration_fee) || 0,
      quota: Number(data.quota) || 50,
      status: targetStatus,
      status_label: statLabel,
      guidebook_url: data.guidebook_url || '/guidebook-itc-2026.pdf',
      rubric: data.rubric || [
        { id: 'crit-1', name: 'Kualitas Teknis', weight: 40 },
        { id: 'crit-2', name: 'Inovasi', weight: 30 },
        { id: 'crit-3', name: 'Presentasi', weight: 20 },
        { id: 'crit-4', name: 'Dokumentasi', weight: 10 },
      ],
    };

    this.competitions.unshift(newComp);
    this.saveState();
    return newComp;
  }

  createOrUpdateJudge(data) {
    if (data.id) {
      const idx = this.judges.findIndex((j) => j.id === data.id);
      if (idx !== -1) {
        this.judges[idx] = { ...this.judges[idx], ...data };
        this.saveState();
        return this.judges[idx];
      }
    }

    const newJudge = {
      id: `usr-judge-${Date.now()}`,
      name: data.name,
      email: data.email,
      institution: data.institution || 'Praktisi Industri',
      specialization: data.specialization || 'Software Engineering',
      assignedCompetitions: data.assignedCompetitions || [],
      activeEvaluationsCount: 0,
      completedEvaluationsCount: 0,
    };

    this.judges.push(newJudge);
    this.saveState();
    return newJudge;
  }

  createOrUpdateSchedule(data) {
    if (data.id) {
      const idx = this.schedules.findIndex((s) => s.id === data.id);
      if (idx !== -1) {
        this.schedules[idx] = { ...this.schedules[idx], ...data };
        this.saveState();
        return this.schedules[idx];
      }
    }

    const newSch = {
      id: `sch-${Date.now()}`,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time || '09:00 WIB',
      competitionId: data.competitionId || 'all',
      competitionName: data.competitionName || 'Semua Cabang',
      location: data.location || 'Online Platform',
      status: data.status || 'upcoming',
    };

    this.schedules.push(newSch);
    // Sort chronologically
    this.schedules.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.saveState();
    return newSch;
  }

  createOrUpdateAnnouncement(data) {
    if (data.id) {
      const idx = this.announcements.findIndex((a) => a.id === data.id);
      if (idx !== -1) {
        this.announcements[idx] = { ...this.announcements[idx], ...data };
        this.saveState();
        return this.announcements[idx];
      }
    }

    const newAnc = {
      id: `anc-${Date.now()}`,
      title: data.title,
      body: data.body,
      audience: data.audience || 'all',
      status: data.status || 'published',
      isPinned: !!data.isPinned,
      createdAt: new Date().toISOString(),
    };

    this.announcements.unshift(newAnc);
    this.saveState();
    return newAnc;
  }

  getAdminReports() {
    // Dynamically calculate distributions from available data
    const compStats = this.competitions.map((comp) => {
      const regs = this.registrations.filter((r) => r.competitionId === comp.id);
      const approved = regs.filter((r) => r.status === 'approved').length;
      return {
        id: comp.id,
        name: comp.name,
        totalRegistered: regs.length,
        approved,
        quota: comp.quota,
        fillRate: Math.round((regs.length / comp.quota) * 100),
      };
    });

    const totalEvaluations = this.evaluations.length;
    const submittedEvaluations = this.evaluations.filter((e) => e.status === 'submitted').length;
    const avgScore =
      submittedEvaluations > 0
        ? (
            this.evaluations
              .filter((e) => e.status === 'submitted')
              .reduce((acc, curr) => acc + curr.totalScore, 0) / submittedEvaluations
          ).toFixed(1)
        : 0;

    return {
      competitionStats: compStats,
      totalEvaluations,
      submittedEvaluations,
      averageScore: avgScore,
      totalRevenueEstimated: this.registrations
        .filter((r) => r.paymentStatus === 'paid')
        .reduce((sum, r) => {
          const comp = this.competitions.find((c) => c.id === r.competitionId);
          return sum + (comp?.registration_fee || 0);
        }, 0),
    };
  }
}

export const mockService = new MockService();
export default mockService;
