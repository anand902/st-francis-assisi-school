// ================================================================
// SESSION CHECK – Run on app.html and superadmin.html
// ================================================================
if (window.location.pathname.includes('app.html') || window.location.pathname.includes('superadmin.html')) {
    var savedUser = localStorage.getItem('sfaCurrentUser');
    if (savedUser) {
        try { State.currentUser = JSON.parse(savedUser); } catch(e) { State.currentUser = null; }
    }
    if (!State.currentUser) {
        window.location.href = 'index.html';
    }
    // If Super Admin lands on app.html, redirect to superadmin.html
    if (window.location.pathname.includes('app.html') && State.currentUser && State.currentUser.type === 'superadmin') {
        window.location.href = 'superadmin.html';
    }
    // If regular user lands on superadmin.html, redirect to app.html
    if (window.location.pathname.includes('superadmin.html') && State.currentUser && State.currentUser.type !== 'superadmin') {
        window.location.href = 'app.html';
    }
}

// ================================================================
// CONSTANTS
// ================================================================

var CLASS_LIST = ['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
var DEFAULT_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Arts', 'Physical Education', 'Music', 'Moral Science'];
var FEE_COMPONENTS = ['Establishment Fee', 'Development Fee', 'Arts & Sports Fee', 'Annual Function Fee', 'Maintenance Fee', 'Exam Fee', 'Computer Lab Fee', 'Tuition Fee (Monthly)'];
var FEE_ICONS = ['🏫', '📈', '🎨', '🎉', '🔧', '📝', '💻', '📚'];

var DEFAULT_FEES = {
    'LKG': [5000, 3000, 1500, 1000, 2000, 1500, 1000, 1500],
    'UKG': [5000, 3000, 1500, 1000, 2000, 1500, 1000, 1800],
    'Grade 1': [5500, 3500, 2000, 1500, 2500, 2000, 1500, 2000],
    'Grade 2': [5500, 3500, 2000, 1500, 2500, 2000, 1500, 2000],
    'Grade 3': [6000, 4000, 2000, 1500, 2500, 2000, 1500, 2500],
    'Grade 4': [6000, 4000, 2000, 1500, 2500, 2000, 1500, 2500],
    'Grade 5': [6000, 4000, 2000, 1500, 2500, 2000, 1500, 2500],
    'Grade 6': [6500, 4500, 2500, 2000, 3000, 2500, 2000, 3000],
    'Grade 7': [6500, 4500, 2500, 2000, 3000, 2500, 2000, 3000],
    'Grade 8': [6500, 4500, 2500, 2000, 3000, 2500, 2000, 3000],
    'Grade 9': [7000, 5000, 2500, 2000, 3000, 2500, 2000, 3500],
    'Grade 10': [7000, 5000, 2500, 2000, 3000, 2500, 2000, 3500]
};

var DEFAULT_SCHOOLS = [
    { id: 's1', name: 'St. Francis of Assisi School', tagline: '"Pax et Bonum" - Peace and Goodness', domain: '', status: 'active' },
    { id: 's2', name: 'St. Mary Convent School', tagline: 'Knowledge is Power', domain: '', status: 'active' },
    { id: 's3', name: 'Green Valley Public School', tagline: 'Nurturing Tomorrow\'s Leaders', domain: '', status: 'active' },
    { id: 's4', name: 'Sunrise Academy', tagline: 'Bright Futures Begin Here', domain: '', status: 'active' },
    { id: 's5', name: 'Little Angels School', tagline: 'Learning with Love', domain: '', status: 'active' },
    { id: 's6', name: 'Holy Cross School', tagline: 'Wisdom and Virtue', domain: '', status: 'active' },
    { id: 's7', name: 'St. Joseph High School', tagline: 'Discipline and Devotion', domain: '', status: 'active' },
    { id: 's8', name: 'Sacred Heart School', tagline: 'Faith, Hope and Knowledge', domain: '', status: 'active' }
];

var GLOBAL_KEYS = ['sfaSchoolRegistry', 'sfaCurrentSchoolId', 'sfaSuperAdminAuth', 'sfaServerSettings', 'theme'];
var DEFAULT_RELIGIONS = ['Christian', 'Hindu', 'Muslim', 'Sikh', 'Buddhist', 'Jain'];

// ================================================================
// STORAGE
// ================================================================

var Storage = {
    scope: function(key) {
        return GLOBAL_KEYS.includes(key) ? key : getCurrentSchoolId() + '::' + key;
    },
    get: function(key, defaultVal) {
        try {
            var data = localStorage.getItem(Storage.scope(key));
            return data ? JSON.parse(data) : defaultVal;
        } catch (e) { return defaultVal; }
    },
    set: function(key, data) {
        try { localStorage.setItem(Storage.scope(key), JSON.stringify(data)); } catch (e) { console.warn('Storage write failed:', e); }
    },
    remove: function(key) {
        try { localStorage.removeItem(Storage.scope(key)); } catch (e) { console.warn('Storage remove failed:', e); }
    }
};

// ================================================================
// MULTI-SCHOOL HELPERS
// ================================================================

function getSchoolRegistry() {
    var reg = null;
    try { reg = JSON.parse(localStorage.getItem('sfaSchoolRegistry') || 'null'); } catch (e) { reg = null; }
    if (!Array.isArray(reg) || reg.length === 0) {
        reg = JSON.parse(JSON.stringify(DEFAULT_SCHOOLS));
        try { localStorage.setItem('sfaSchoolRegistry', JSON.stringify(reg)); } catch (e) {}
    }
    var changed = false;
    reg.forEach(function(s) { if (!s.status) { s.status = 'active'; changed = true; } });
    if (changed) { try { localStorage.setItem('sfaSchoolRegistry', JSON.stringify(reg)); } catch (e) {} }
    return reg;
}

function getCurrentSchoolId() {
    var domainId = getDomainSchoolId();
    if (domainId) return domainId;
    var id = null;
    try { id = localStorage.getItem('sfaCurrentSchoolId'); } catch (e) { id = null; }
    var reg = getSchoolRegistry();
    if (!id || !reg.some(function(s) { return s.id === id; })) id = (reg[0] || { id: 's1' }).id;
    return id;
}

function getDomainSchoolId() {
    try {
        var host = (window.location.hostname || '').toLowerCase();
        if (!host) return null;
        var registry = getSchoolRegistry();
        for (var i = 0; i < registry.length; i++) {
            if (registry[i].domain && registry[i].domain.toLowerCase() === host) return registry[i].id;
        }
        return null;
    } catch (e) { return null; }
}

function getCurrentSchool() {
    var id = getCurrentSchoolId();
    var reg = getSchoolRegistry();
    for (var i = 0; i < reg.length; i++) {
        if (reg[i].id === id) return reg[i];
    }
    return reg[0] || { id: 's1', name: 'School' };
}

function switchSchool(id) {
    if (!id) return;
    try { localStorage.setItem('sfaCurrentSchoolId', id); } catch (e) {}
    location.reload();
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ================================================================
// STATE
// ================================================================

var State = {
    students: Storage.get('sfaStudents', []),
    teachers: Storage.get('sfaTeachers', []),
    feeRecords: Storage.get('sfaFees', []),
    teacherAttendance: Storage.get('sfaTeacherAttendance', []),
    studentAttendance: Storage.get('sfaStudentAttendance', []),
    qrCodes: Storage.get('sfaQRCodes', {}),
    notices: Storage.get('sfaNotices', []),
    marksData: Storage.get('sfaMarks', {}),
    admissionFees: Storage.get('sfaAdmissionFees', JSON.parse(JSON.stringify(DEFAULT_FEES))),
    reAdmissionFees: Storage.get('sfaReAdmissionFees', JSON.parse(JSON.stringify(DEFAULT_FEES))),
    homework: Storage.get('sfaHomework', []),
    homeworkViews: Storage.get('sfaHomeworkViews', []),
    ukgApplications: Storage.get('sfaukgApplications', []),
    generalApplications: Storage.get('sfageneralApplications', []),
    currentUser: null,
    schoolSettings: Storage.get('sfaSchoolSettings', {
        schoolName: 'St. Francis of Assisi School',
        tagline: '"Pax et Bonum" - Peace and Goodness',
        logo: '',
        appIcon: '',
        loginBg: '',
        notificationEnabled: false,
        notificationMessage: '',
        address: '123 Education Lane, Knowledge City',
        phone: '+91-9876543210',
        email: 'info@stfrancis.edu',
        principalName: 'Fr. Michael Rodrigues',
        academicYear: '2026-2027',
        mission: 'To provide quality education with moral values.',
        religions: DEFAULT_RELIGIONS
    })
};

var MarkSettings = Object.assign({ ut1Full: 25, ut1Pass: 9, ut2Full: 25, ut2Pass: 9, hyFull: 100, hyPass: 25, anFull: 100, anPass: 33 }, Storage.get('sfaMarkSettings', {}));

var MarkPermissions = Object.assign({
    ut1: { enabled: false, deadline: '2024-10-15', locked: true, approved: false, published: false },
    ut2: { enabled: false, deadline: '2024-12-01', locked: true, approved: false, published: false },
    hy: { enabled: false, deadline: '2024-11-30', locked: true, approved: false, published: false },
    an: { enabled: false, deadline: '2025-03-15', locked: true, approved: false, published: false }
}, Storage.get('sfaMarkPermissions', {}));

// ================================================================
// INIT DEFAULT DATA
// ================================================================

function initDefaultData() {
    if (State.students.length === 0) {
        State.students = [
            { id: 1, admissionNo: 'ADM-2024-0001', name: 'Aarav Sharma', gender: 'Male', class: 'Grade 5', section: 'A', fatherName: 'Rajesh Sharma', motherName: 'Priya Sharma', parentPhone: '9876543211', dob: '2016-05-15', religion: 'Hindu', status: 'Active', photo: '' },
            { id: 2, admissionNo: 'ADM-2024-0002', name: 'Priya Patel', gender: 'Female', class: 'UKG', section: 'B', fatherName: 'Amit Patel', motherName: 'Neha Patel', parentPhone: '9876543221', dob: '2019-08-22', religion: 'Hindu', status: 'Active', photo: '' },
            { id: 3, admissionNo: 'ADM-2024-0003', name: 'Rohan Gupta', gender: 'Male', class: 'Grade 5', section: 'A', fatherName: 'Suresh Gupta', motherName: 'Anita Gupta', parentPhone: '9876543231', dob: '2016-05-15', religion: 'Hindu', status: 'Active', photo: '' },
            { id: 4, admissionNo: 'ADM-2024-0004', name: "Sarah D'Souza", gender: 'Female', class: 'Grade 3', section: 'A', fatherName: "Michael D'Souza", motherName: "Mary D'Souza", parentPhone: '9876543241', dob: '2017-06-20', religion: 'Christian', status: 'Active', photo: '' },
            { id: 5, admissionNo: 'ADM-2024-0005', name: 'Mohammed Ali', gender: 'Male', class: 'Grade 7', section: 'B', fatherName: 'Ahmed Ali', motherName: 'Fatima Ali', parentPhone: '9876543251', dob: '2014-03-10', religion: 'Muslim', status: 'Active', photo: '' },
            { id: 6, admissionNo: 'ADM-2024-0006', name: 'Gurpreet Singh', gender: 'Male', class: 'Grade 9', section: 'A', fatherName: 'Harpreet Singh', motherName: 'Jaspreet Kaur', parentPhone: '9876543261', dob: '2012-11-05', religion: 'Sikh', status: 'Active', photo: '' }
        ];
        Storage.set('sfaStudents', State.students);
    }

    if (State.teachers.length === 0) {
        State.teachers = [
            { id: 1, employeeId: 'TCH-2024-001', name: "Dr. Maria D'Souza", subject: 'English', subjects: ['LKG:English', 'UKG:English'], classTeacher: 'LKG - A', qualification: 'M.A. B.Ed.', experience: 10, status: 'Active', photo: '' },
            { id: 2, employeeId: 'TCH-2024-002', name: 'Prof. John Fernandes', subject: 'Mathematics', subjects: ['Grade 3:Mathematics', 'Grade 5:Mathematics'], classTeacher: 'Grade 5 - A', qualification: 'M.Sc. B.Ed.', experience: 12, status: 'Active', photo: '' },
            { id: 3, employeeId: 'TCH-2024-003', name: 'Mrs. Sarah Thomas', subject: 'Science', subjects: ['Grade 6:Science'], classTeacher: 'Grade 5 - A', qualification: 'B.Sc. B.Ed.', experience: 8, status: 'Active', photo: '' }
        ];
        Storage.set('sfaTeachers', State.teachers);
    }

    if (!Storage.get('sfaAdmissionFees')) {
        Storage.set('sfaAdmissionFees', JSON.parse(JSON.stringify(DEFAULT_FEES)));
        State.admissionFees = JSON.parse(JSON.stringify(DEFAULT_FEES));
    }
    if (!Storage.get('sfaReAdmissionFees')) {
        Storage.set('sfaReAdmissionFees', JSON.parse(JSON.stringify(DEFAULT_FEES)));
        State.reAdmissionFees = JSON.parse(JSON.stringify(DEFAULT_FEES));
    }
    if (!Storage.get('sfaMarkPermissions')) {
        Storage.set('sfaMarkPermissions', MarkPermissions);
    }
    if (State.homework.length === 0) {
        State.homework = [
            { id: 1, teacherId: 2, teacherName: 'Prof. John Fernandes', subject: 'Mathematics', class: 'Grade 5', section: 'A', title: 'Chapter 5 - Practice Problems', description: 'Complete all problems from Chapter 5 (Exercises 1-20). Show all steps.', instructions: '1. Solve in notebook\n2. Show all working\n3. Check answers', dueDate: '2024-10-20', createdDate: '2024-10-15', priority: 'High', status: 'Active', attachments: ['Chapter5_Practice.pdf'], views: 0 },
            { id: 2, teacherId: 3, teacherName: 'Mrs. Sarah Thomas', subject: 'Science', class: 'Grade 5', section: 'A', title: 'Plant Life - Parts and Functions', description: 'Read the chapter on Plant Life and write a summary.', instructions: '1. Read Chapter 3\n2. Write summary\n3. Draw and label a plant', dueDate: '2024-10-22', createdDate: '2024-10-16', priority: 'Medium', status: 'Active', attachments: ['Plant_Diagram.pdf'], views: 0 }
        ];
        Storage.set('sfaHomework', State.homework);
    }
}

// ================================================================
// SUBJECTS
// ================================================================

function getSubjects() {
    var list = Storage.get('sfaSubjects', null);
    if (list && Array.isArray(list) && list.length) return list.slice();
    return DEFAULT_SUBJECTS.slice();
}

function saveSubjects(list) {
    Storage.set('sfaSubjects', list);
}

function addSubject() {
    var input = document.getElementById('newSubjectName');
    var name = input.value.trim();
    if (!name) { showToast('Please enter a subject name', 'error'); return; }
    var list = getSubjects();
    for (var i = 0; i < list.length; i++) {
        if (list[i].toLowerCase() === name.toLowerCase()) {
            showToast('⚠️ Subject "' + name + '" already exists', 'error');
            input.focus();
            return;
        }
    }
    list.push(name);
    saveSubjects(list);
    input.value = '';
    loadSubjectsPage();
    showToast('✅ Subject "' + name + '" added!', 'success');
}

function removeSubject(index) {
    var list = getSubjects();
    var name = list[index];
    if (!name) return;
    if (!confirm('Remove subject "' + name + '"?')) return;
    list.splice(index, 1);
    saveSubjects(list);
    loadSubjectsPage();
    showToast('🗑️ Subject "' + name + '" removed', 'success');
}

function loadSubjectsPage() {
    var container = document.getElementById('subjectListContainer');
    if (!container) return;
    var list = getSubjects();
    if (!list.length) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">No subjects yet. Add one above.</p>';
        return;
    }
    var html = '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    for (var i = 0; i < list.length; i++) {
        html += '<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:8px 14px;">' +
            '<span style="font-weight:600;font-size:13px;">📚 ' + escapeHtml(list[i]) + '</span>' +
            '<button class="btn btn-outline btn-sm" onclick="removeSubject(' + i + ')" title="Remove ' + escapeHtml(list[i]) + '">🗑️</button>' +
            '</div>';
    }
    container.innerHTML = html + '</div>';
}

// ================================================================
// TOAST
// ================================================================

function showToast(message, type) {
    type = type || 'info';
    var colors = { success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#8B5CF6' };
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

// ================================================================
// MODAL HELPERS
// ================================================================

function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.remove();
}

// ================================================================
// LOGIN / LOGOUT
// ================================================================

function loginBlocked(errorEl, roleLabel) {
    if (errorEl) {
        errorEl.textContent = '🚫 This ' + roleLabel + ' account has been disabled. Please contact the system administrator.';
        errorEl.classList.add('show');
    }
    return false;
}

function doLogin() {
    var errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.classList.remove('show');

    var id = document.getElementById('loginId') ? document.getElementById('loginId').value.trim() : '';
    var pwd = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value.trim() : '';

    var ok = false;

    try {
        if (id) {
            var curSchool = getCurrentSchool();
            var schoolSuspended = curSchool && curSchool.status === 'suspended';

            var superAdminCreds = Storage.get('sfaSuperAdminAuth', { email: 'superadmin@stfrancis.edu', password: 'superadmin123' });
            if (id === (superAdminCreds.email || 'superadmin@stfrancis.edu') && pwd === (superAdminCreds.password || 'superadmin123')) {
                State.currentUser = { name: 'System Administrator', role: 'Admin', type: 'superadmin' };
                ok = true;
            }

            if (!ok && schoolSuspended) {
                if (errorEl) {
                    errorEl.textContent = '🚫 This school\'s account has been suspended. Please contact the system administrator.';
                    errorEl.classList.add('show');
                }
                return false;
            }

            if (!ok) {
                var principalCreds = Storage.get('sfaPrincipalAuth', { email: 'principal@stfrancis.edu', password: 'admin123' });
                if (id === (principalCreds.email || 'principal@stfrancis.edu') && pwd === (principalCreds.password || 'admin123')) {
                    if (principalCreds.enabled === false) { return loginBlocked(errorEl, 'Principal'); }
                    State.currentUser = { name: 'Fr. Michael Rodrigues', role: 'Principal', type: 'admin' };
                    ok = true;
                }
            }

            if (!ok) {
                var accountantCreds = Storage.get('sfaAccountantAuth', { email: 'accounts@stfrancis.edu', password: 'account123' });
                if (id === (accountantCreds.email || 'accounts@stfrancis.edu') && pwd === (accountantCreds.password || 'account123')) {
                    if (accountantCreds.enabled === false) { return loginBlocked(errorEl, 'Accountant'); }
                    State.currentUser = { name: 'Mr. Thomas Matthew', role: 'Accountant', type: 'accountant' };
                    ok = true;
                }
            }

            if (!ok) {
                for (var i = 0; i < State.teachers.length; i++) {
                    var t = State.teachers[i];
                    if (t.employeeId === id && pwd === (t.password || 'teacher123')) {
                        if (t.enabled === false) { return loginBlocked(errorEl, 'Teacher'); }
                        State.currentUser = { name: t.name, role: 'Teacher', type: 'teacher', id: t.id };
                        ok = true;
                        break;
                    }
                }
            }

            if (!ok) {
                for (var j = 0; j < State.students.length; j++) {
                    var s = State.students[j];
                    if (s.admissionNo === id && pwd === (s.loginPasswordOverride || s.dob)) {
                        if (s.enabled === false) { return loginBlocked(errorEl, 'Student'); }
                        State.currentUser = { name: s.name, role: 'Student', type: 'student', id: s.id };
                        ok = true;
                        break;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Login error:', e);
        if (errorEl) {
            errorEl.textContent = '❌ System error: ' + e.message;
            errorEl.classList.add('show');
        }
        return false;
    }

    if (ok) {
        try {
            localStorage.setItem('sfaCurrentUser', JSON.stringify(State.currentUser));
            if (State.currentUser.type === 'superadmin') {
                window.location.href = 'superadmin.html';
            } else {
                window.location.href = 'app.html';
            }
        } catch (e) {
            console.error('Redirect error:', e);
            if (errorEl) {
                errorEl.textContent = '❌ Error loading page: ' + e.message;
                errorEl.classList.add('show');
            }
        }
    } else {
        if (errorEl) {
            errorEl.textContent = '❌ Invalid credentials. Please check and try again.';
            errorEl.classList.add('show');
        }
        var card = document.getElementById('loginCard');
        if (card) {
            card.style.animation = 'shake 0.4s ease';
            setTimeout(function() { card.style.animation = ''; }, 500);
        }
    }
    return false;
}

function doLogout() {
    markOffline();
    stopHeartbeat();
    stopOnlineStatusPolling();
    if (serverPollTimer) { clearInterval(serverPollTimer); serverPollTimer = null; }
    localStorage.removeItem('sfaCurrentUser');
    window.location.href = 'index.html';
}

// ================================================================
// THEME
// ================================================================

function toggleTheme() {
    var html = document.documentElement;
    var current = html.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// ================================================================
// SIDEBAR
// ================================================================

function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var main = document.getElementById('mainContent');
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
}

function toggleMobileSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
}

function closeMobileSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function openPage(name, el) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');

    var navItems = document.querySelectorAll('.nav-item');
    for (var j = 0; j < navItems.length; j++) navItems[j].classList.remove('active');

    var page = document.getElementById('page-' + name);
    if (page) page.classList.add('active');
    if (el) el.classList.add('active');

    var titles = {
        'dashboard': 'Dashboard',
        'admissions': 'Admissions Management',
        'students': 'Students',
        'teachers': 'Teachers',
        'teacher-attendance': 'Teacher Attendance',
        'student-attendance': 'Student Attendance',
        'fee-structure': 'Fee Structure Settings',
        'fee-collection': 'Collect Fee',
        'fee-records': 'Payment History',
        'qrcodes': 'QR Codes',
        'notices': 'Notices & Announcements',
        'subjects': 'Subjects',
        'mark-settings': 'Mark Sheet Settings',
        'marksheet': 'Mark Sheet Entry',
        'mark-view': 'View Mark Sheet',
        'student-marks': 'My Mark Sheet',
        'student-self': 'My Profile',
        'teacher-homework': 'My Homework',
        'student-homework': 'My Homework',
        'principal-performance': 'Teacher Performance',
        'school-settings': 'School Settings',
        'duplicates': 'Duplicate Data Check',
        'super-dashboard': 'System Overview',
        'admin-creds': 'Admin Credentials',
        'school-manage': 'Manage Schools',
        'user-manage': 'User Management',
        'data-manage': 'Data Management'
    };
    document.getElementById('pageTitle').textContent = titles[name] || name;
    if (name === 'data-manage') loadServerSettings();
    closeMobileSidebar();
}

function buildSidebar() {
    var nav = document.getElementById('sidebarNav');
    var items = '';

    if (State.currentUser.type === 'superadmin') {
        items = '<div class="nav-section"><div class="nav-section-title">Admin</div></div>' +
            '<button class="nav-item active" onclick="openPage(\'super-dashboard\',this);loadSuperDashboard();"><i class="fas fa-crown"></i>System Overview</button>' +
            '<button class="nav-item" onclick="openPage(\'admin-creds\',this);loadAdminCreds();"><i class="fas fa-user-shield"></i>Admin Credentials</button>' +
            '<button class="nav-item" onclick="openPage(\'school-manage\',this);loadSchoolManager();"><i class="fas fa-school"></i>Manage Schools</button>' +
            '<button class="nav-item" onclick="openPage(\'user-manage\',this);loadUserManage();"><i class="fas fa-users-cog"></i>User Management</button>' +
            '<button class="nav-item" onclick="openPage(\'data-manage\',this);"><i class="fas fa-database"></i>Data Management</button>';
    } else if (State.currentUser.type === 'admin') {
        items =
            '<div class="nav-section"><div class="nav-section-title">Main</div></div>' +
            '<button class="nav-item active" onclick="openPage(\'dashboard\',this);initDashboard();"><i class="fas fa-th-large"></i>Dashboard</button>' +
            '<button class="nav-item" onclick="openPage(\'admissions\',this);loadAdmissions(\'all\');"><i class="fas fa-clipboard-list"></i>Admissions</button>' +
            '<button class="nav-item" onclick="openPage(\'students\',this);loadStudents();"><i class="fas fa-users"></i>Students</button>' +
            '<button class="nav-item" onclick="openPage(\'teachers\',this);loadTeachers();"><i class="fas fa-chalkboard-teacher"></i>Teachers</button>' +
            '<button class="nav-item" onclick="openPage(\'teacher-attendance\',this);loadTeacherAttendance();"><i class="fas fa-clipboard-check"></i>Teacher Attendance</button>' +
            '<button class="nav-item" onclick="openPage(\'student-attendance\',this);"><i class="fas fa-calendar-check"></i>Student Attendance</button>' +
            '<button class="nav-item" onclick="openPage(\'qrcodes\',this);updateQRSelects();"><i class="fas fa-qrcode"></i>QR Codes</button>' +
            '<button class="nav-item" onclick="openPage(\'notices\',this);loadAllNotices();"><i class="fas fa-bullhorn"></i>Notices</button>' +
            '<div class="nav-section"><div class="nav-section-title">Academics</div></div>' +
            '<button class="nav-item" onclick="openPage(\'subjects\',this);loadSubjectsPage();"><i class="fas fa-book-open"></i>Subjects</button>' +
            '<button class="nav-item" onclick="openPage(\'mark-settings\',this);loadMarkSettings();loadMarkPermissionsUI();"><i class="fas fa-cog"></i>Mark Settings</button>' +
            '<button class="nav-item" onclick="openPage(\'marksheet\',this);"><i class="fas fa-edit"></i>Mark Entry</button>' +
            '<button class="nav-item" onclick="openPage(\'mark-view\',this);"><i class="fas fa-eye"></i>View Marks</button>' +
            '<div class="nav-section"><div class="nav-section-title">Homework</div></div>' +
            '<button class="nav-item" onclick="openPage(\'teacher-homework\',this);loadTeacherHomework();"><i class="fas fa-book"></i>My Homework</button>' +
            '<div class="nav-section"><div class="nav-section-title">Performance</div></div>' +
            '<button class="nav-item" onclick="openPage(\'principal-performance\',this);loadPrincipalPerformance();"><i class="fas fa-trophy"></i>Teacher Performance</button>' +
            '<div class="nav-section"><div class="nav-section-title">Administration</div></div>' +
            '<button class="nav-item" onclick="openPage(\'school-settings\',this);loadSchoolSettings();"><i class="fas fa-sliders-h"></i>School Settings</button>' +
            '<div class="nav-section"><div class="nav-section-title">Finance</div></div>' +
            '<button class="nav-item" onclick="openPage(\'fee-structure\',this);loadFeeSettingsPage();"><i class="fas fa-cog"></i>Fee Settings</button>' +
            '<button class="nav-item" onclick="openPage(\'fee-collection\',this);"><i class="fas fa-indian-rupee-sign"></i>Collect Fee</button>' +
            '<button class="nav-item" onclick="openPage(\'fee-records\',this);loadFeeRecords();"><i class="fas fa-file-invoice-dollar"></i>Fee Records</button>' +
            '<div class="nav-section"><div class="nav-section-title">Data Quality</div></div>' +
            '<button class="nav-item" onclick="openPage(\'duplicates\',this);loadDuplicates();"><i class="fas fa-clone"></i>Duplicate Data Check</button>';
    } else if (State.currentUser.type === 'accountant') {
        items =
            '<div class="nav-section"><div class="nav-section-title">Admissions</div></div>' +
            '<button class="nav-item active" onclick="openPage(\'admissions\',this);loadAdmissions(\'all\');"><i class="fas fa-clipboard-list"></i>Admissions</button>' +
            '<div class="nav-section"><div class="nav-section-title">Finance</div></div>' +
            '<button class="nav-item" onclick="openPage(\'fee-collection\',this);"><i class="fas fa-indian-rupee-sign"></i>Collect Fee</button>' +
            '<button class="nav-item" onclick="openPage(\'fee-records\',this);loadFeeRecords();"><i class="fas fa-file-invoice-dollar"></i>Payment History</button>' +
            '<button class="nav-item" onclick="openPage(\'fee-structure\',this);loadFeeSettingsPage();"><i class="fas fa-cog"></i>Fee Settings</button>';
    } else if (State.currentUser.type === 'teacher') {
        var teacher = null;
        for (var k = 0; k < State.teachers.length; k++) {
            if (State.teachers[k].id === State.currentUser.id) { teacher = State.teachers[k]; break; }
        }
        items =
            '<div class="nav-section"><div class="nav-section-title">Homework</div></div>' +
            '<button class="nav-item active" onclick="openPage(\'teacher-homework\',this);loadTeacherHomework();"><i class="fas fa-book"></i>My Homework</button>' +
            '<div class="nav-section"><div class="nav-section-title">Attendance</div></div>' +
            '<button class="nav-item" onclick="openPage(\'teacher-attendance\',this);loadTeacherAttendance();"><i class="fas fa-clipboard-check"></i>My Attendance</button>' +
            '<button class="nav-item" onclick="openPage(\'student-attendance\',this);"><i class="fas fa-calendar-check"></i>Student Attendance</button>';
        if (teacher && teacher.classTeacher) {
            items +=
                '<div class="nav-section"><div class="nav-section-title">Academics</div></div>' +
                '<button class="nav-item" onclick="openPage(\'marksheet\',this);"><i class="fas fa-edit"></i>Mark Entry (' + escapeHtml(teacher.classTeacher) + ')</button>' +
                '<button class="nav-item" onclick="openPage(\'mark-view\',this);"><i class="fas fa-eye"></i>View Marks (' + escapeHtml(teacher.classTeacher) + ')</button>' +
                '<button class="nav-item" onclick="openPage(\'students\',this);loadStudents();"><i class="fas fa-users"></i>My Students</button>';
        }
    } else {
        items =
            '<div class="nav-section"><div class="nav-section-title">Homework</div></div>' +
            '<button class="nav-item active" onclick="openPage(\'student-homework\',this);loadStudentHomework();"><i class="fas fa-book"></i>My Homework</button>' +
            '<div class="nav-section"><div class="nav-section-title">Profile</div></div>' +
            '<button class="nav-item" onclick="openPage(\'student-self\',this);loadStudentSelf();"><i class="fas fa-user"></i>My Profile</button>' +
            '<button class="nav-item" onclick="openPage(\'student-marks\',this);loadStudentMarks();"><i class="fas fa-file-alt"></i>My Marks</button>';
    }

    nav.innerHTML = items;
}

// ================================================================
// SCHOOL SETTINGS
// ================================================================

function getSchoolReligions() {
    var list = (State.schoolSettings && State.schoolSettings.religions) || DEFAULT_RELIGIONS;
    return list.length ? list : DEFAULT_RELIGIONS;
}

function populateReligionSelects() {
    var ids = ['ukgReligion', 'genReligion'];
    var religions = getSchoolReligions();
    for (var i = 0; i < ids.length; i++) {
        var sel = document.getElementById(ids[i]);
        if (!sel) continue;
        var current = sel.value;
        var html = '<option value="">Select</option>';
        for (var j = 0; j < religions.length; j++) {
            html += '<option value="' + escapeHtml(religions[j]) + '">' + escapeHtml(religions[j]) + '</option>';
        }
        html += '<option>Other</option>';
        sel.innerHTML = html;
        if (current) sel.value = current;
    }
}

function applySchoolSettings() {
    var s = State.schoolSettings;
    var banner = document.getElementById('publicNotification');
    if (banner) {
        if (s.notificationEnabled && s.notificationMessage) {
            banner.textContent = s.notificationMessage;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    }
    var loginPage = document.getElementById('loginPage');
    if (loginPage) {
        if (s.loginBg) {
            loginPage.style.background = 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,58,95,0.85)), url(' + s.loginBg + ')';
            loginPage.style.backgroundSize = 'cover';
            loginPage.style.backgroundPosition = 'center';
        } else {
            loginPage.style.background = 'linear-gradient(135deg, #0F172A, #1E3A5F, #2563EB)';
        }
    }
    var yearEl = document.getElementById('topStudentsYear');
    if (yearEl) yearEl.textContent = s.academicYear || '';
    var logoEl = document.querySelector('.sidebar-logo');
    if (logoEl) {
        if (s.logo) {
            logoEl.style.backgroundImage = 'url(' + s.logo + ')';
            logoEl.style.backgroundSize = 'cover';
            logoEl.style.backgroundPosition = 'center';
            logoEl.textContent = '';
        } else {
            logoEl.style.backgroundImage = 'none';
            logoEl.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
            logoEl.textContent = '✝️';
        }
    }
    var brandEl = document.querySelector('.sidebar-brand');
    if (brandEl) {
        var parts = (s.schoolName || 'School').split(' ');
        var lastWord = parts.pop() || 'School';
        brandEl.innerHTML = escapeHtml(parts.join(' ')) + '<small>' + escapeHtml(lastWord) + '</small>';
    }
    var appIcon = null;
    try { appIcon = s.appIcon ? JSON.parse(s.appIcon) : null; } catch (e) { appIcon = null; }
    var favicon = document.getElementById('appFavicon');
    var appleIcon = document.getElementById('appleAppIcon');
    if (appIcon && appIcon['512']) {
        if (favicon) favicon.href = appIcon['512'];
        if (appleIcon) appleIcon.href = appIcon['512'];
    } else {
        if (favicon) favicon.href = 'icon.svg';
        if (appleIcon) appleIcon.href = 'icon.svg';
    }
    buildAppManifest();
    loadTopStudents();
}

function buildAppManifest() {
    var link = document.querySelector('link[rel="manifest"]');
    if (!link) return;
    var s = State.schoolSettings || {};
    var appIcon = null;
    try { appIcon = s.appIcon ? JSON.parse(s.appIcon) : null; } catch (e) { appIcon = null; }
    var icons = [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }];
    if (appIcon && appIcon['512']) {
        icons = [
            { src: appIcon['512'], sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: appIcon['192'], sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: appIcon['512'], sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ];
    }
    var manifest = {
        name: s.schoolName || 'St. Francis of Assisi School',
        short_name: (s.schoolName || 'St. Francis of Assisi School').slice(0, 12),
        description: 'Complete School Management System',
        start_url: 'school.html',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0F172A',
        theme_color: '#2563EB',
        icons: icons
    };
    try {
        if (link.dataset.blobUrl) URL.revokeObjectURL(link.dataset.blobUrl);
        var blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
        var url = URL.createObjectURL(blob);
        link.href = url;
        link.dataset.blobUrl = url;
    } catch (e) { console.error('Manifest update failed:', e); }
}

function compressSchoolLogo(input) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
        showToast('Please select a JPG or PNG image.', 'warning');
        input.value = '';
        return;
    }
    var indicator = document.getElementById('setLogoCompressing');
    if (indicator) indicator.classList.add('show');
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var w = img.width, h = img.height;
            var MAX = 400;
            if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; } else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
            canvas.width = w; canvas.height = h;
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            var quality = 0.9;
            var dataUrl = canvas.toDataURL('image/jpeg', quality);
            var kb = Math.round((dataUrl.length * 3) / 4096);
            while (kb > 200 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }
            if (kb > 200) {
                var scale = Math.sqrt(200 / kb);
                var nw = Math.round(w * scale);
                var nh = Math.round(h * scale);
                canvas.width = nw; canvas.height = nh;
                ctx.fillStyle = '#FFF';
                ctx.fillRect(0, 0, nw, nh);
                ctx.drawImage(img, 0, 0, nw, nh);
                dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }
            var preview = document.getElementById('settingsCrestPreview');
            if (preview) {
                preview.style.backgroundImage = 'url(' + dataUrl + ')';
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.textContent = '';
            }
            document.getElementById('setLogoData').value = dataUrl;
            document.getElementById('setLogoRemoveBtn').style.display = 'inline-flex';
            document.getElementById('logoStatusText').textContent = '✅ Logo uploaded (' + kb + 'KB)';
            if (indicator) indicator.classList.remove('show');
            updateSettingsPreview();
            showToast('📸 Logo uploaded!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeSchoolLogo() {
    document.getElementById('setLogoData').value = '';
    document.getElementById('setLogoInput').value = '';
    var preview = document.getElementById('settingsCrestPreview');
    if (preview) {
        preview.style.backgroundImage = 'none';
        preview.textContent = '✝️';
    }
    document.getElementById('setLogoRemoveBtn').style.display = 'none';
    document.getElementById('logoStatusText').textContent = '';
    updateSettingsPreview();
    showToast('Logo removed', 'warning');
}

function compressAppIcon(input) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.match(/^image\//)) {
        showToast('Please select a valid image.', 'warning');
        input.value = '';
        return;
    }
    var indicator = document.getElementById('setAppIconCompressing');
    if (indicator) indicator.classList.add('show');
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var SIZE = 512;
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = SIZE; canvas.height = SIZE;
            var side = Math.min(img.width, img.height);
            var sx = (img.width - side) / 2;
            var sy = (img.height - side) / 2;
            ctx.clearRect(0, 0, SIZE, SIZE);
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, 0, SIZE, SIZE);
            ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
            var data512 = canvas.toDataURL('image/png');
            var small = document.createElement('canvas');
            var sctx = small.getContext('2d');
            small.width = 192; small.height = 192;
            sctx.drawImage(canvas, 0, 0, 192, 192);
            var data192 = small.toDataURL('image/png');
            var payload = JSON.stringify({ '512': data512, '192': data192 });
            document.getElementById('setAppIconData').value = payload;
            var preview = document.getElementById('appIconPreview');
            if (preview) {
                preview.style.backgroundImage = 'url(' + data512 + ')';
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.textContent = '';
            }
            document.getElementById('setAppIconRemoveBtn').style.display = 'inline-flex';
            var status = document.getElementById('appIconStatusText');
            if (status) status.textContent = '✅ App icon uploaded (' + Math.round((payload.length * 3) / 4096) + 'KB)';
            if (indicator) indicator.classList.remove('show');
            showToast('📱 App icon uploaded!', 'success');
        };
        img.onerror = function() {
            if (indicator) indicator.classList.remove('show');
            showToast('❌ Could not read image.', 'warning');
            input.value = '';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeAppIcon() {
    document.getElementById('setAppIconData').value = '';
    document.getElementById('setAppIconInput').value = '';
    var preview = document.getElementById('appIconPreview');
    if (preview) {
        preview.style.backgroundImage = 'none';
        preview.textContent = '📱';
    }
    document.getElementById('setAppIconRemoveBtn').style.display = 'none';
    var status = document.getElementById('appIconStatusText');
    if (status) status.textContent = '';
    showToast('App icon removed', 'warning');
}

function compressLoginBg(input) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
        showToast('Please select a JPG or PNG image.', 'warning');
        input.value = '';
        return;
    }
    var indicator = document.getElementById('setBgCompressing');
    if (indicator) indicator.classList.add('show');
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var w = img.width, h = img.height;
            var MAX_W = 1920, MAX_H = 1080;
            if (w > MAX_W) { h = Math.round((h * MAX_W) / w); w = MAX_W; }
            if (h > MAX_H) { w = Math.round((w * MAX_H) / h); h = MAX_H; }
            canvas.width = w; canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            var quality = 0.85;
            var dataUrl = canvas.toDataURL('image/jpeg', quality);
            var kb = Math.round((dataUrl.length * 3) / 4096);
            while (kb > 500 && quality > 0.2) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }
            document.getElementById('setBgData').value = dataUrl;
            document.getElementById('setBgRemoveBtn').style.display = 'inline-flex';
            document.getElementById('bgStatusText').textContent = '✅ Background uploaded (' + kb + 'KB)';
            var container = document.getElementById('bgPreviewContainer');
            container.style.backgroundImage = 'url(' + dataUrl + ')';
            var placeholder = document.getElementById('bgPreviewPlaceholder');
            if (placeholder) placeholder.style.display = 'none';
            if (indicator) indicator.classList.remove('show');
            showToast('🖼️ Background uploaded!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeLoginBackground() {
    document.getElementById('setBgData').value = '';
    document.getElementById('setBgInput').value = '';
    var container = document.getElementById('bgPreviewContainer');
    container.style.backgroundImage = 'none';
    var placeholder = document.getElementById('bgPreviewPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
    document.getElementById('setBgRemoveBtn').style.display = 'none';
    document.getElementById('bgStatusText').textContent = '';
    showToast('Background removed', 'warning');
}

function resetToDefaultSettings() {
    if (!confirm('Reset all school settings to defaults? This cannot be undone.')) return;
    var defaults = {
        schoolName: 'St. Francis of Assisi School',
        tagline: '"Pax et Bonum" - Peace and Goodness',
        logo: '',
        appIcon: '',
        loginBg: '',
        notificationEnabled: false,
        notificationMessage: '',
        address: '123 Education Lane, Knowledge City',
        phone: '+91-9876543210',
        email: 'info@stfrancis.edu',
        principalName: 'Fr. Michael Rodrigues',
        academicYear: '2026-2027',
        mission: 'To provide quality education with moral values.',
        religions: DEFAULT_RELIGIONS
    };
    State.schoolSettings = defaults;
    Storage.set('sfaSchoolSettings', defaults);
    loadSchoolSettings();
    applySchoolSettings();
    populateReligionSelects();
    showToast('🔄 Settings reset to defaults', 'info');
}

function updateSettingsPreview() {
    var logoData = document.getElementById('setLogoData').value || '';
    var crestPreview = document.getElementById('previewCrest');
    var logoImgPreview = document.getElementById('previewLogoImg');
    if (logoData) {
        crestPreview.style.display = 'none';
        logoImgPreview.style.display = 'block';
        logoImgPreview.style.backgroundImage = 'url(' + logoData + ')';
    } else {
        crestPreview.style.display = 'block';
        crestPreview.textContent = '✝️';
        logoImgPreview.style.display = 'none';
    }
    document.getElementById('previewName').textContent = document.getElementById('setSchoolName').value || 'School Name';
    document.getElementById('previewTagline').textContent = document.getElementById('setTagline').value || 'Tagline';
    document.getElementById('previewYear').textContent = '📅 ' + (document.getElementById('setAcademicYear').value || 'Year');
    document.getElementById('previewAddress').textContent = '📍 ' + (document.getElementById('setAddress').value || 'Address');
    document.getElementById('previewPhone').textContent = '📞 ' + (document.getElementById('setPhone').value || 'Phone');
    document.getElementById('previewEmail').textContent = '✉️ ' + (document.getElementById('setEmail').value || 'Email');
}

function loadSchoolSettings() {
    var s = State.schoolSettings;
    document.getElementById('setSchoolName').value = s.schoolName || '';
    document.getElementById('setTagline').value = s.tagline || '';
    document.getElementById('setAcademicYear').value = s.academicYear || '';
    document.getElementById('setAddress').value = s.address || '';
    document.getElementById('setPhone').value = s.phone || '';
    document.getElementById('setEmail').value = s.email || '';
    document.getElementById('setPrincipalName').value = s.principalName || '';
    var principalAuth = Storage.get('sfaPrincipalAuth', { email: 'principal@stfrancis.edu', password: 'admin123' });
    var curIdInput = document.getElementById('setPrincipalCurrentId');
    if (curIdInput) curIdInput.value = principalAuth.email || 'principal@stfrancis.edu';
    document.getElementById('setMission').value = s.mission || '';
    document.getElementById('setNotificationEnabled').checked = s.notificationEnabled || false;
    document.getElementById('setNotificationMessage').value = s.notificationMessage || '';
    var relInput = document.getElementById('setReligions');
    if (relInput) relInput.value = (s.religions && s.religions.length ? s.religions : DEFAULT_RELIGIONS).join('\n');
    document.getElementById('setLogoData').value = s.logo || '';
    document.getElementById('setBgData').value = s.loginBg || '';
    var appIcon = null;
    try { appIcon = s.appIcon ? JSON.parse(s.appIcon) : null; } catch (e) { appIcon = null; }
    var appIconData = document.getElementById('setAppIconData');
    if (appIconData) appIconData.value = s.appIcon || '';
    var appIconPreview = document.getElementById('appIconPreview');
    var appIconRemoveBtn = document.getElementById('setAppIconRemoveBtn');
    if (appIcon && appIcon['512']) {
        appIconPreview.style.backgroundImage = 'url(' + appIcon['512'] + ')';
        appIconPreview.style.backgroundSize = 'cover';
        appIconPreview.style.backgroundPosition = 'center';
        appIconPreview.textContent = '';
        if (appIconRemoveBtn) appIconRemoveBtn.style.display = 'inline-flex';
    } else {
        appIconPreview.style.backgroundImage = 'none';
        appIconPreview.textContent = '📱';
        if (appIconRemoveBtn) appIconRemoveBtn.style.display = 'none';
    }
    var crestPreview = document.getElementById('settingsCrestPreview');
    var removeBtn = document.getElementById('setLogoRemoveBtn');
    if (s.logo) {
        crestPreview.style.backgroundImage = 'url(' + s.logo + ')';
        crestPreview.style.backgroundSize = 'cover';
        crestPreview.style.backgroundPosition = 'center';
        crestPreview.textContent = '';
        if (removeBtn) removeBtn.style.display = 'inline-flex';
    } else {
        crestPreview.style.backgroundImage = 'none';
        crestPreview.textContent = '✝️';
        if (removeBtn) removeBtn.style.display = 'none';
    }
    var bgContainer = document.getElementById('bgPreviewContainer');
    var bgPlaceholder = document.getElementById('bgPreviewPlaceholder');
    var bgRemoveBtn = document.getElementById('setBgRemoveBtn');
    var bgStatus = document.getElementById('bgStatusText');
    if (s.loginBg) {
        bgContainer.style.backgroundImage = 'url(' + s.loginBg + ')';
        if (bgPlaceholder) bgPlaceholder.style.display = 'none';
        if (bgRemoveBtn) bgRemoveBtn.style.display = 'inline-flex';
        if (bgStatus) bgStatus.textContent = '✅ Background saved';
    } else {
        bgContainer.style.backgroundImage = 'none';
        if (bgPlaceholder) bgPlaceholder.style.display = 'flex';
        if (bgRemoveBtn) bgRemoveBtn.style.display = 'none';
        if (bgStatus) bgStatus.textContent = '';
    }
    updateSettingsPreview();
}

function saveSchoolSettings() {
    var s = {
        schoolName: document.getElementById('setSchoolName').value.trim() || 'St. Francis of Assisi School',
        tagline: document.getElementById('setTagline').value.trim(),
        logo: document.getElementById('setLogoData').value || '',
        appIcon: document.getElementById('setAppIconData').value || '',
        loginBg: document.getElementById('setBgData').value || '',
        academicYear: document.getElementById('setAcademicYear').value.trim() || '2026-2027',
        address: document.getElementById('setAddress').value.trim(),
        phone: document.getElementById('setPhone').value.trim(),
        email: document.getElementById('setEmail').value.trim(),
        principalName: document.getElementById('setPrincipalName').value.trim() || 'Principal',
        mission: document.getElementById('setMission').value.trim(),
        notificationEnabled: document.getElementById('setNotificationEnabled').checked,
        notificationMessage: document.getElementById('setNotificationMessage').value.trim(),
        religions: parseReligionsInput(document.getElementById('setReligions').value)
    };
    State.schoolSettings = s;
    Storage.set('sfaSchoolSettings', s);
    applySchoolSettings();
    populateReligionSelects();
    showToast('✅ School settings saved!', 'success');
    return false;
}

function parseReligionsInput(value) {
    var list = String(value || '').split('\n').map(function(x) { return x.trim(); }).filter(Boolean);
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
        var key = list[i].toLowerCase();
        if (!seen[key]) { seen[key] = true; out.push(list[i]); }
    }
    return out.length ? out : DEFAULT_RELIGIONS;
}

function savePrincipalCredentials() {
    var newId = document.getElementById('setPrincipalNewId').value.trim();
    var newPwd = document.getElementById('setPrincipalNewPassword').value.trim();
    var confirmPwd = document.getElementById('setPrincipalConfirmPassword').value.trim();

    if (!newId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newId)) {
        showToast('❌ Please enter a valid email ID.', 'warning');
        return;
    }
    if (newPwd.length < 6) {
        showToast('❌ Password must be at least 6 characters.', 'warning');
        return;
    }
    if (newPwd !== confirmPwd) {
        showToast('❌ Passwords do not match.', 'warning');
        return;
    }

    Storage.set('sfaPrincipalAuth', { email: newId, password: newPwd });
    document.getElementById('setPrincipalCurrentId').value = newId;
    document.getElementById('setPrincipalNewId').value = '';
    document.getElementById('setPrincipalNewPassword').value = '';
    document.getElementById('setPrincipalConfirmPassword').value = '';
    showToast('🔐 Principal ID & password updated!', 'success');
}

// ================================================================
// TOP PERFORMERS
// ================================================================

function loadTopStudents() {
    var container = document.getElementById('topStudentsContainer');
    if (!container) return;
    var studentsWithMarks = [];
    for (var i = 0; i < State.students.length; i++) {
        var s = State.students[i];
        var exams = ['ut1', 'ut2', 'hy', 'an'];
        var hasMarks = false;
        for (var j = 0; j < exams.length; j++) {
            if (State.marksData[exams[j] + '_' + s.id]) { hasMarks = true; break; }
        }
        if (hasMarks) studentsWithMarks.push(s);
    }
    if (studentsWithMarks.length === 0) {
        container.innerHTML = '<div class="top-students-placeholder">🌟 Top performers will appear here once marks are entered.</div>';
        return;
    }
    var ranked = [];
    for (var k = 0; k < studentsWithMarks.length; k++) {
        var st = studentsWithMarks[k];
        var total = 0, count = 0;
        var exams2 = ['ut1', 'ut2', 'hy', 'an'];
        for (var m = 0; m < exams2.length; m++) {
            var data = State.marksData[exams2[m] + '_' + st.id];
            if (data) {
                var subj = getSubjects();
                for (var n = 0; n < subj.length; n++) {
                    var val = parseInt(data[subj[n]]) || 0;
                    total += val;
                    count++;
                }
            }
        }
        var avg = count > 0 ? Math.round(total / count) : 0;
        ranked.push({ student: st, avgScore: avg });
    }
    ranked.sort(function(a, b) { return b.avgScore - a.avgScore; });
    ranked = ranked.slice(0, 10);

    var html = '';
    for (var p = 0; p < ranked.length; p++) {
        var item = ranked[p];
        var s2 = item.student;
        var rankClass = p === 0 ? 'gold' : p === 1 ? 'silver' : p === 2 ? 'bronze' : '';
        var medal = p === 0 ? '🥇' : p === 1 ? '🥈' : p === 2 ? '🥉' : '#' + (p + 1);
        html += '<div class="top-student-card">' +
            '<div class="ts-rank ' + rankClass + '">' + medal + '</div>' +
            '<div class="ts-avatar">' + escapeHtml(s2.name.charAt(0)) + '</div>' +
            '<div class="ts-info"><div class="ts-name">' + escapeHtml(s2.name) + '</div><div class="ts-class">' + escapeHtml(s2.class) + ' - ' + escapeHtml(s2.section) + '</div></div>' +
            '<div class="ts-score">' + item.avgScore + '%</div>' +
            '</div>';
    }
    container.innerHTML = html;
}

// ================================================================
// ADMISSION MODAL
// ================================================================

function openAdmissionModal(type) {
    var modal = document.getElementById('admissionModal');
    var title = document.getElementById('admissionModalTitle');
    var ukgForm = document.getElementById('ukgForm');
    var generalForm = document.getElementById('generalForm');
    var success = document.getElementById('admissionSuccess');

    success.style.display = 'none';
    ukgForm.style.display = 'none';
    generalForm.style.display = 'none';

    if (type === 'ukg') {
        title.textContent = '🎒 UKG Admission 2026-2027';
        ukgForm.style.display = 'block';
        ukgForm.classList.add('active');
    } else {
        title.textContent = '📚 General Admission 2026-2027';
        generalForm.style.display = 'block';
        generalForm.classList.add('active');
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdmissionModal() {
    document.getElementById('admissionModal').classList.remove('active');
    document.body.style.overflow = '';
    resetUKGForm();
    resetGeneralForm();
    document.getElementById('admissionSuccess').style.display = 'none';
}

// ================================================================
// FILE UPLOAD (Admission)
// ================================================================

function uploadFile(input, containerId) {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast('❌ File too large (max 2MB)', 'warning');
        input.value = '';
        return;
    }
    var container = document.getElementById(containerId);
    var fileSize = (file.size / 1024 / 1024).toFixed(2);
    var html = '<div class="file-item">' +
        '<span class="file-name">📄 ' + escapeHtml(file.name) + '</span>' +
        '<span class="file-size">' + fileSize + ' MB</span>' +
        '<span class="file-status uploaded">✅ Uploaded</span>' +
        '<button class="file-remove" onclick="removeFile(\'' + containerId + '\')">✕</button>' +
        '</div>';
    container.innerHTML = html;

    var reader = new FileReader();
    reader.onload = function(e) {
        var hiddenInput = input.id + 'Data';
        if (!document.getElementById(hiddenInput)) {
            var hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = hiddenInput;
            hidden.value = e.target.result;
            input.parentNode.appendChild(hidden);
        } else {
            document.getElementById(hiddenInput).value = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

function removeFile(containerId) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    var parent = container.parentNode;
    var hiddenInputs = parent.querySelectorAll('input[type="hidden"]');
    for (var i = 0; i < hiddenInputs.length; i++) hiddenInputs[i].remove();
}

// ================================================================
// PHOTO COMPRESSION (Admission)
// ================================================================

function compressAdmissionPhoto(input, type) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
        showToast('Please select a JPG or PNG image.', 'warning');
        input.value = '';
        return;
    }

    var previewId = type === 'ukg' ? 'ukgPhotoPreview' : 'genPhotoPreview';
    var dataId = type === 'ukg' ? 'ukgPhotoData' : 'genPhotoData';
    var indicatorId = type === 'ukg' ? 'ukgCompressing' : 'genCompressing';

    var indicator = document.getElementById(indicatorId);
    if (indicator) indicator.classList.add('show');

    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var w = img.width, h = img.height;
            var MAX = 400;
            if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; } else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
            canvas.width = w; canvas.height = h;
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            var quality = 0.9;
            var dataUrl = canvas.toDataURL('image/jpeg', quality);
            var kb = Math.round((dataUrl.length * 3) / 4096);
            while (kb > 100 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }
            if (kb > 100) {
                var scale = Math.sqrt(100 / kb);
                var nw = Math.round(w * scale);
                var nh = Math.round(h * scale);
                canvas.width = nw; canvas.height = nh;
                ctx.fillStyle = '#FFF';
                ctx.fillRect(0, 0, nw, nh);
                ctx.drawImage(img, 0, 0, nw, nh);
                dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }

            var preview = document.getElementById(previewId);
            if (preview) {
                preview.style.backgroundImage = 'url(' + dataUrl + ')';
                preview.innerHTML = '';
                preview.classList.add('has-photo');
            }
            document.getElementById(dataId).value = dataUrl;
            if (indicator) indicator.classList.remove('show');
            showToast('📸 Photo uploaded successfully!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ================================================================
// UKG ADMISSION SUBMIT
// ================================================================

function submitUKGAdmission(event) {
    event.preventDefault();

    var requiredFiles = ['ukgFatherAadhaar', 'ukgMotherAadhaar', 'ukgBirthCert', 'ukgChildAadhaar'];
    var allUploaded = true;
    for (var i = 0; i < requiredFiles.length; i++) {
        var fInput = document.getElementById(requiredFiles[i]);
        var data = fInput.parentNode.querySelector('input[type="hidden"]');
        if (!data || !data.value) {
            allUploaded = false;
            showToast('Please upload all required documents', 'warning');
        }
    }
    if (!allUploaded) return;

    var app = {
        id: Date.now(),
        applicationNo: 'UKG-' + new Date().getFullYear() + '-' + String(State.ukgApplications.length + 1).padStart(4, '0'),
        type: 'UKG',
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        childName: document.getElementById('ukgChildName').value,
        childDOB: document.getElementById('ukgChildDOB').value,
        childGender: document.getElementById('ukgChildGender').value,
        bloodGroup: document.getElementById('ukgBloodGroup').value,
        religion: document.getElementById('ukgReligion').value,
        placeOfBirth: document.getElementById('ukgPlaceOfBirth').value,
        photo: document.getElementById('ukgPhotoData').value,
        fatherName: document.getElementById('ukgFatherName').value,
        fatherOcc: document.getElementById('ukgFatherOcc').value,
        fatherPhone: document.getElementById('ukgFatherPhone').value,
        fatherAadhaar: document.getElementById('ukgFatherAadhaarData') ? document.getElementById('ukgFatherAadhaarData').value : '',
        motherName: document.getElementById('ukgMotherName').value,
        motherOcc: document.getElementById('ukgMotherOcc').value,
        motherPhone: document.getElementById('ukgMotherPhone').value,
        motherAadhaar: document.getElementById('ukgMotherAadhaarData') ? document.getElementById('ukgMotherAadhaarData').value : '',
        email: document.getElementById('ukgEmail').value,
        address: document.getElementById('ukgAddress').value,
        city: document.getElementById('ukgCity').value,
        state: document.getElementById('ukgState').value,
        pincode: document.getElementById('ukgPincode').value,
        birthCertificate: document.getElementById('ukgBirthCertData') ? document.getElementById('ukgBirthCertData').value : '',
        childAadhaar: document.getElementById('ukgChildAadhaarData') ? document.getElementById('ukgChildAadhaarData').value : ''
    };

    State.ukgApplications.push(app);
    Storage.set('sfaukgApplications', State.ukgApplications);

    document.getElementById('ukgForm').style.display = 'none';
    document.getElementById('admissionSuccess').style.display = 'block';
    document.getElementById('appNumberDisplay').textContent = app.applicationNo;

    showToast('✅ UKG Application submitted!', 'success');
}

function resetUKGForm() {
    document.getElementById('ukgAdmissionForm').reset();
    document.getElementById('ukgPhotoData').value = '';
    var preview = document.getElementById('ukgPhotoPreview');
    if (preview) {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<i class="fas fa-user-graduate"></i>';
        preview.classList.remove('has-photo');
    }
    var lists = document.querySelectorAll('#ukgAdmissionForm .file-list');
    for (var i = 0; i < lists.length; i++) lists[i].innerHTML = '';
    var hiddens = document.querySelectorAll('#ukgAdmissionForm input[type="hidden"]');
    for (var j = 0; j < hiddens.length; j++) { if (hiddens[j].id.includes('Data')) hiddens[j].value = ''; }
}

// ================================================================
// GENERAL ADMISSION SUBMIT
// ================================================================

function submitGeneralAdmission(event) {
    event.preventDefault();

    var requiredFiles = ['genFatherAadhaar', 'genMotherAadhaar', 'genTC', 'genBirthCert', 'genStudentAadhaar', 'genMarksheet'];
    var allUploaded = true;
    for (var i = 0; i < requiredFiles.length; i++) {
        var fInput = document.getElementById(requiredFiles[i]);
        var data = fInput.parentNode.querySelector('input[type="hidden"]');
        if (!data || !data.value) {
            allUploaded = false;
            showToast('Please upload all required documents', 'warning');
        }
    }
    if (!allUploaded) return;

    var app = {
        id: Date.now(),
        applicationNo: 'GEN-' + new Date().getFullYear() + '-' + String(State.generalApplications.length + 1).padStart(4, '0'),
        type: 'General',
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        studentName: document.getElementById('genStudentName').value,
        studentDOB: document.getElementById('genStudentDOB').value,
        studentGender: document.getElementById('genStudentGender').value,
        bloodGroup: document.getElementById('genBloodGroup').value,
        religion: document.getElementById('genReligion').value,
        placeOfBirth: document.getElementById('genPlaceOfBirth').value,
        applyingClass: document.getElementById('genApplyingClass').value,
        photo: document.getElementById('genPhotoData').value,
        prevSchool: document.getElementById('genPrevSchool').value,
        prevSchoolAddr: document.getElementById('genPrevSchoolAddr').value,
        schoolBoard: document.getElementById('genSchoolBoard').value,
        lastClass: document.getElementById('genLastClass').value,
        percentage: document.getElementById('genPercentage').value,
        leavingDate: document.getElementById('genLeavingDate').value,
        reason: document.getElementById('genReason').value,
        tc: document.getElementById('genTCData') ? document.getElementById('genTCData').value : '',
        fatherName: document.getElementById('genFatherName').value,
        fatherOcc: document.getElementById('genFatherOcc').value,
        fatherPhone: document.getElementById('genFatherPhone').value,
        fatherEmail: document.getElementById('genFatherEmail').value,
        fatherAadhaar: document.getElementById('genFatherAadhaarData') ? document.getElementById('genFatherAadhaarData').value : '',
        motherName: document.getElementById('genMotherName').value,
        motherOcc: document.getElementById('genMotherOcc').value,
        motherPhone: document.getElementById('genMotherPhone').value,
        motherEmail: document.getElementById('genMotherEmail').value,
        motherAadhaar: document.getElementById('genMotherAadhaarData') ? document.getElementById('genMotherAadhaarData').value : '',
        email: document.getElementById('genParentEmail').value,
        address: document.getElementById('genAddress').value,
        city: document.getElementById('genCity').value,
        state: document.getElementById('genState').value,
        pincode: document.getElementById('genPincode').value,
        birthCertificate: document.getElementById('genBirthCertData') ? document.getElementById('genBirthCertData').value : '',
        studentAadhaar: document.getElementById('genStudentAadhaarData') ? document.getElementById('genStudentAadhaarData').value : '',
        marksheet: document.getElementById('genMarksheetData') ? document.getElementById('genMarksheetData').value : ''
    };

    State.generalApplications.push(app);
    Storage.set('sfageneralApplications', State.generalApplications);

    document.getElementById('generalForm').style.display = 'none';
    document.getElementById('admissionSuccess').style.display = 'block';
    document.getElementById('appNumberDisplay').textContent = app.applicationNo;

    showToast('✅ General Application submitted!', 'success');
}

function resetGeneralForm() {
    document.getElementById('generalAdmissionForm').reset();
    document.getElementById('genPhotoData').value = '';
    var preview = document.getElementById('genPhotoPreview');
    if (preview) {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<i class="fas fa-user-graduate"></i>';
        preview.classList.remove('has-photo');
    }
    var lists = document.querySelectorAll('#generalAdmissionForm .file-list');
    for (var i = 0; i < lists.length; i++) lists[i].innerHTML = '';
    var hiddens = document.querySelectorAll('#generalAdmissionForm input[type="hidden"]');
    for (var j = 0; j < hiddens.length; j++) { if (hiddens[j].id.includes('Data')) hiddens[j].value = ''; }
}

// ================================================================
// ADMISSIONS MANAGEMENT
// ================================================================

function canDecideAdmissions() {
    return State.currentUser && State.currentUser.type === 'admin';
}

function loadAdmissions(type) {
    var apps = [];
    if (type === 'ukg' || type === 'all') {
        for (var i = 0; i < State.ukgApplications.length; i++) {
            var a = State.ukgApplications[i];
            apps.push({ id: a.id, applicationNo: a.applicationNo, formType: 'UKG', childName: a.childName, studentName: a.childName, applyingClass: 'UKG', appliedDate: a.appliedDate, status: a.status, photo: a.photo, fatherName: a.fatherName, motherName: a.motherName, fatherPhone: a.fatherPhone, motherPhone: a.motherPhone, email: a.email, address: a.address, city: a.city, state: a.state, pincode: a.pincode, birthCertificate: a.birthCertificate, childAadhaar: a.childAadhaar, fatherAadhaar: a.fatherAadhaar, motherAadhaar: a.motherAadhaar });
        }
    }
    if (type === 'general' || type === 'all') {
        for (var j = 0; j < State.generalApplications.length; j++) {
            var b = State.generalApplications[j];
            apps.push({ id: b.id, applicationNo: b.applicationNo, formType: 'General', childName: b.studentName, studentName: b.studentName, applyingClass: b.applyingClass, appliedDate: b.appliedDate, status: b.status, photo: b.photo, fatherName: b.fatherName, motherName: b.motherName, fatherPhone: b.fatherPhone, motherPhone: b.motherPhone, email: b.email, address: b.address, city: b.city, state: b.state, pincode: b.pincode, birthCertificate: b.birthCertificate, studentAadhaar: b.studentAadhaar, fatherAadhaar: b.fatherAadhaar, motherAadhaar: b.motherAadhaar, marksheet: b.marksheet, tc: b.tc });
        }
    }

    var total = apps.length;
    var pending = 0, shortlisted = 0, accepted = 0;
    for (var k = 0; k < apps.length; k++) {
        if (apps[k].status === 'Pending') pending++;
        else if (apps[k].status === 'Shortlisted') shortlisted++;
        else if (apps[k].status === 'Accepted') accepted++;
    }

    document.getElementById('admTotal').textContent = total;
    document.getElementById('admPending').textContent = pending;
    document.getElementById('admShortlisted').textContent = shortlisted;
    document.getElementById('admAccepted').textContent = accepted;

    var list = document.getElementById('admissionsList');
    if (!apps.length) {
        list.innerHTML = '<p style="text-align:center;padding:30px;color:var(--text-secondary);">No applications found</p>';
        return;
    }

    apps.sort(function(a, b) { return new Date(b.appliedDate) - new Date(a.appliedDate); });

    var html = '<div class="table-card"><table><thead><tr><th>App No.</th><th>Type</th><th>Student Name</th><th>Class</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    for (var m = 0; m < apps.length; m++) {
        var app = apps[m];
        var statusBadge = app.status === 'Pending' ? 'badge-warning' : app.status === 'Shortlisted' ? 'badge-info' : app.status === 'Accepted' ? 'badge-success' : 'badge-danger';
        var actions = '<button class="btn btn-outline btn-sm" onclick="viewApplication(' + app.id + ',\'' + app.formType + '\')">👁️</button>';
        if (canDecideAdmissions() && app.status === 'Pending') {
            actions += '<button class="btn btn-primary btn-sm" onclick="updateApplicationStatus(' + app.id + ',\'Shortlisted\',\'' + app.formType + '\')">📋</button>';
        }
        if (canDecideAdmissions() && app.status === 'Shortlisted') {
            actions += '<button class="btn btn-success btn-sm" onclick="updateApplicationStatus(' + app.id + ',\'Accepted\',\'' + app.formType + '\')">✅</button>';
        }
        if (canDecideAdmissions() && (app.status === 'Pending' || app.status === 'Shortlisted')) {
            actions += '<button class="btn btn-danger btn-sm" onclick="updateApplicationStatus(' + app.id + ',\'Rejected\',\'' + app.formType + '\')">❌</button>';
        }
        html += '<tr><td><strong>' + escapeHtml(app.applicationNo) + '</strong></td>' +
            '<td><span class="badge ' + (app.formType === 'UKG' ? 'badge-success' : 'badge-primary') + '">' + escapeHtml(app.formType) + '</span></td>' +
            '<td>' + escapeHtml(app.childName || app.studentName) + '</td>' +
            '<td>' + escapeHtml(app.applyingClass || 'UKG') + '</td>' +
            '<td>' + escapeHtml(app.appliedDate) + '</td>' +
            '<td><span class="badge ' + statusBadge + '">' + escapeHtml(app.status) + '</span></td>' +
            '<td>' + actions + '</td></tr>';
    }
    html += '</tbody></table></div>';
    list.innerHTML = html;
}

function viewApplication(id, type) {
    var app = type === 'UKG' ?
        State.ukgApplications.filter(function(a) { return a.id === id; })[0] :
        State.generalApplications.filter(function(a) { return a.id === id; })[0];
    if (!app) return;

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'viewAppModal';

    var details = '';
    if (type === 'UKG') {
        details =
            '<div class="form-grid">' +
            '<div class="form-group"><label>Child Name</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.childName) + '</div></div>' +
            '<div class="form-group"><label>DOB</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.childDOB) + '</div></div>' +
            '<div class="form-group"><label>Gender</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.childGender) + '</div></div>' +
            '<div class="form-group"><label>Blood Group</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.bloodGroup || 'N/A') + '</div></div>' +
            '<div class="form-group"><label>Religion</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.religion || 'N/A') + '</div></div>' +
            '<div class="form-group"><label>Place of Birth</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.placeOfBirth || 'N/A') + '</div></div>' +
            '<div class="form-group"><label>Father</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.fatherName) + ' (' + escapeHtml(app.fatherPhone) + ')</div></div>' +
            '<div class="form-group"><label>Mother</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.motherName) + ' (' + escapeHtml(app.motherPhone) + ')</div></div>' +
            '<div class="form-group"><label>Email</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.email) + '</div></div>' +
            '<div class="form-group"><label>Address</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.address) + ', ' + escapeHtml(app.city || '') + ' ' + escapeHtml(app.state || '') + ' ' + escapeHtml(app.pincode || '') + '</div></div>' +
            '</div>' +
            '<div style="margin-top:12px;"><p style="font-size:12px;font-weight:600;color:var(--text-secondary);">📎 Documents Uploaded</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">' +
            (app.photo ? '<span class="badge badge-success">✅ Photo</span>' : '') +
            (app.birthCertificate ? '<span class="badge badge-success">✅ Birth Certificate</span>' : '') +
            (app.childAadhaar ? '<span class="badge badge-success">✅ Child Aadhaar</span>' : '') +
            (app.fatherAadhaar ? '<span class="badge badge-success">✅ Father Aadhaar</span>' : '') +
            (app.motherAadhaar ? '<span class="badge badge-success">✅ Mother Aadhaar</span>' : '') +
            '</div></div>';
    } else {
        details =
            '<div class="form-grid">' +
            '<div class="form-group"><label>Student Name</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.studentName) + '</div></div>' +
            '<div class="form-group"><label>Applying for</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.applyingClass) + '</div></div>' +
            '<div class="form-group"><label>DOB</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.studentDOB) + '</div></div>' +
            '<div class="form-group"><label>Gender</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.studentGender) + '</div></div>' +
            '<div class="form-group"><label>Previous School</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.prevSchool) + '</div></div>' +
            '<div class="form-group"><label>Board</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.schoolBoard) + '</div></div>' +
            '<div class="form-group"><label>Last Class</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.lastClass) + '</div></div>' +
            '<div class="form-group"><label>Percentage</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.percentage || 'N/A') + '</div></div>' +
            '<div class="form-group"><label>Father</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.fatherName) + ' (' + escapeHtml(app.fatherPhone) + ')</div></div>' +
            '<div class="form-group"><label>Mother</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.motherName) + ' (' + escapeHtml(app.motherPhone) + ')</div></div>' +
            '<div class="form-group"><label>Email</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.email) + '</div></div>' +
            '<div class="form-group"><label>Address</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(app.address) + ', ' + escapeHtml(app.city || '') + ' ' + escapeHtml(app.state || '') + ' ' + escapeHtml(app.pincode || '') + '</div></div>' +
            '</div>' +
            '<div style="margin-top:12px;"><p style="font-size:12px;font-weight:600;color:var(--text-secondary);">📎 Documents Uploaded</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">' +
            (app.photo ? '<span class="badge badge-success">✅ Photo</span>' : '') +
            (app.tc ? '<span class="badge badge-success">✅ TC</span>' : '') +
            (app.birthCertificate ? '<span class="badge badge-success">✅ Birth Certificate</span>' : '') +
            (app.studentAadhaar ? '<span class="badge badge-success">✅ Student Aadhaar</span>' : '') +
            (app.marksheet ? '<span class="badge badge-success">✅ Marksheet</span>' : '') +
            (app.fatherAadhaar ? '<span class="badge badge-success">✅ Father Aadhaar</span>' : '') +
            (app.motherAadhaar ? '<span class="badge badge-success">✅ Mother Aadhaar</span>' : '') +
            '</div></div>';
    }

    var canDecide = canDecideAdmissions();
    var actionsHtml = '';
    if (canDecide && app.status === 'Pending') {
        actionsHtml += '<button class="btn btn-primary btn-sm" onclick="updateApplicationStatus(' + app.id + ',\'Shortlisted\',\'' + type + '\');closeModal(\'viewAppModal\')">📋 Shortlist</button>';
    }
    if (canDecide && app.status === 'Shortlisted') {
        actionsHtml += '<button class="btn btn-success btn-sm" onclick="updateApplicationStatus(' + app.id + ',\'Accepted\',\'' + type + '\');closeModal(\'viewAppModal\')">✅ Accept</button>';
    }
    if (canDecide && (app.status === 'Pending' || app.status === 'Shortlisted')) {
        actionsHtml += '<button class="btn btn-danger btn-sm" onclick="updateApplicationStatus(' + app.id + ',\'Rejected\',\'' + type + '\');closeModal(\'viewAppModal\')">❌ Reject</button>';
    }

    modal.innerHTML =
        '<div class="modal-content">' +
        '<div class="modal-header"><h2>📋 Application Details - ' + escapeHtml(app.applicationNo) + '</h2><button class="close-btn" onclick="closeModal(\'viewAppModal\')">✕</button></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">' +
        '<span class="badge ' + (app.status === 'Pending' ? 'badge-warning' : app.status === 'Shortlisted' ? 'badge-info' : app.status === 'Accepted' ? 'badge-success' : 'badge-danger') + '">Status: ' + escapeHtml(app.status) + '</span>' +
        '<span style="font-size:11px;color:var(--text-secondary);">Applied: ' + escapeHtml(app.appliedDate) + '</span>' +
        '</div>' +
        details +
        '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">' + actionsHtml +
        '<button class="btn btn-outline btn-sm" onclick="closeModal(\'viewAppModal\')">Close</button>' +
        '</div></div>';
    document.body.appendChild(modal);
}

function updateApplicationStatus(id, status, type) {
    var apps = type === 'UKG' ? State.ukgApplications : State.generalApplications;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === id) { apps[i].status = status; break; }
    }
    Storage.set(type === 'UKG' ? 'sfaukgApplications' : 'sfageneralApplications', apps);
    showToast('✅ Application ' + status, 'success');
    loadAdmissions('all');
}

// ================================================================
// STUDENTS
// ================================================================

function loadStudents() {
    var search = (document.getElementById('studentSearch') ? document.getElementById('studentSearch').value : '').toLowerCase();
    var filtered = State.students.slice();

    if (State.currentUser && State.currentUser.type === 'teacher') {
        var teacher = null;
        for (var i = 0; i < State.teachers.length; i++) {
            if (State.teachers[i].id === State.currentUser.id) { teacher = State.teachers[i]; break; }
        }
        if (teacher && teacher.classTeacher) {
            var parts = teacher.classTeacher.split(' - ');
            var cls = parts[0] || '';
            var sec = parts[1] || '';
            filtered = filtered.filter(function(s) { return s.class === cls && s.section === sec; });
        } else {
            filtered = [];
        }
    }

    if (search) {
        filtered = filtered.filter(function(s) {
            return s.name.toLowerCase().includes(search) || s.admissionNo.toLowerCase().includes(search);
        });
    }

    var tbody = document.getElementById('studentsTableBody');
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7">No students found</td></tr>';
        return;
    }

    var html = '';
    for (var j = 0; j < filtered.length; j++) {
        var s = filtered[j];
        var genderBadge = s.gender === 'Male' ? 'badge-primary' : 'badge-info';
        html += '<tr><td><div class="table-photo">' + escapeHtml(s.name.charAt(0)) + '</div></td>' +
            '<td><strong>' + escapeHtml(s.admissionNo) + '</strong></td>' +
            '<td>' + escapeHtml(s.name) + '</td>' +
            '<td><span class="badge ' + genderBadge + '">' + escapeHtml(s.gender) + '</span></td>' +
            '<td>' + escapeHtml(s.religion || '-') + '</td>' +
            '<td>' + escapeHtml(s.class) + '</td>' +
            '<td>Sec ' + escapeHtml(s.section) + '</td></tr>';
    }
    tbody.innerHTML = html;
}

// ================================================================
// TEACHERS
// ================================================================

function populateSubjectGrid(teacherId) {
    var grid = document.getElementById('teacherSubjectGrid');
    var existingSubs = [];
    if (teacherId) {
        for (var i = 0; i < State.teachers.length; i++) {
            if (State.teachers[i].id === teacherId) {
                existingSubs = State.teachers[i].subjects || [];
                break;
            }
        }
    }
    var subjects = getSubjects();
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">';
    for (var c = 0; c < CLASS_LIST.length; c++) {
        var cls = CLASS_LIST[c];
        html += '<div style="background:#F8FAFC;padding:8px;border-radius:8px;border:1px solid var(--border);">';
        html += '<strong style="font-size:11px;">' + cls + '</strong><br>';
        for (var s = 0; s < subjects.length; s++) {
            var sub = subjects[s];
            var checked = existingSubs.indexOf(cls + ':' + sub) !== -1 ? 'checked' : '';
            html += '<label style="font-size:10px;display:block;cursor:pointer;">' +
                '<input type="checkbox" class="tch-subject-cb" value="' + cls + ':' + sub + '" ' + checked + '> ' + sub +
                '</label>';
        }
        html += '</div>';
    }
    html += '</div>';
    grid.innerHTML = html;
}

function populateClassTeacherOptions() {
    var sel = document.getElementById('tchClassTeacher');
    var opts = '<option value="">Not Assigned</option>';
    for (var i = 0; i < CLASS_LIST.length; i++) {
        var cls = CLASS_LIST[i];
        opts += '<option value="' + cls + ' - A">' + cls + ' - Section A</option>';
        opts += '<option value="' + cls + ' - B">' + cls + ' - Section B</option>';
    }
    sel.innerHTML = opts;
}

function showTeacherForm(teacherId) {
    var card = document.getElementById('teacherFormCard');
    card.style.display = 'block';
    document.getElementById('teacherFormTitle').textContent = teacherId ? '✏️ Edit Teacher' : '📝 Add Teacher';
    removePhoto('tch');
    populateClassTeacherOptions();

    if (teacherId) {
        var teacher = null;
        for (var i = 0; i < State.teachers.length; i++) {
            if (State.teachers[i].id === teacherId) { teacher = State.teachers[i]; break; }
        }
        if (teacher) {
            document.getElementById('tchId').value = teacher.id;
            document.getElementById('tchName').value = teacher.name || '';
            document.getElementById('tchGender').value = teacher.gender || '';
            document.getElementById('tchDob').value = teacher.dob || '';
            document.getElementById('tchFatherName').value = teacher.fatherName || '';
            document.getElementById('tchEmail').value = teacher.email || '';
            document.getElementById('tchPhone').value = teacher.phone || '';
            document.getElementById('tchDesignation').value = teacher.designation || '';
            document.getElementById('tchSubject').value = teacher.subject || '';
            document.getElementById('tchQualification').value = teacher.qualification || '';
            document.getElementById('tchExperience').value = teacher.experience || 0;
            document.getElementById('tchAddress').value = teacher.address || '';
            document.getElementById('tchClassTeacher').value = teacher.classTeacher || '';
            document.getElementById('tchEmpIdPreview').textContent = teacher.employeeId;
            if (teacher.photo) {
                var preview = document.getElementById('tchPhotoPreview');
                preview.style.backgroundImage = 'url(' + teacher.photo + ')';
                preview.innerHTML = '';
                preview.classList.add('has-photo');
                document.getElementById('tchPhotoData').value = teacher.photo;
                document.getElementById('tchRemovePhotoBtn').style.display = 'inline-flex';
            }
            populateSubjectGrid(teacherId);
        }
    } else {
        document.getElementById('tchId').value = '';
        document.getElementById('teacherForm').reset();
        var year = new Date().getFullYear();
        var next = String(State.teachers.length + 1).padStart(3, '0');
        document.getElementById('tchEmpIdPreview').textContent = 'TCH-' + year + '-' + next;
        populateSubjectGrid(null);
    }
}

function saveTeacher() {
    var id = document.getElementById('tchId').value;
    var photoData = document.getElementById('tchPhotoData') ? document.getElementById('tchPhotoData').value : '';
    var subjectCbs = document.querySelectorAll('.tch-subject-cb:checked');
    var subjects = [];
    for (var i = 0; i < subjectCbs.length; i++) subjects.push(subjectCbs[i].value);
    var primarySubject = subjects.length > 0 ? subjects[0].split(':')[1] : document.getElementById('tchSubject').value;

    var teacherData = {
        name: document.getElementById('tchName').value,
        gender: document.getElementById('tchGender').value,
        dob: document.getElementById('tchDob').value,
        fatherName: document.getElementById('tchFatherName').value.trim(),
        email: document.getElementById('tchEmail').value,
        phone: document.getElementById('tchPhone').value,
        designation: document.getElementById('tchDesignation').value.trim(),
        subject: primarySubject,
        subjects: subjects,
        qualification: document.getElementById('tchQualification').value,
        experience: parseInt(document.getElementById('tchExperience').value) || 0,
        address: document.getElementById('tchAddress').value.trim(),
        classTeacher: document.getElementById('tchClassTeacher').value,
        status: 'Active',
        photo: photoData,
        hasPhoto: !!photoData
    };

    if (id) {
        var existing = null;
        for (var j = 0; j < State.teachers.length; j++) {
            if (State.teachers[j].id === parseInt(id)) { existing = State.teachers[j]; break; }
        }
        if (existing) {
            for (var key in teacherData) { if (teacherData.hasOwnProperty(key)) existing[key] = teacherData[key]; }
        }
    } else {
        var year2 = new Date().getFullYear();
        var next2 = String(State.teachers.length + 1).padStart(3, '0');
        teacherData.id = Date.now();
        teacherData.employeeId = 'TCH-' + year2 + '-' + next2;
        State.teachers.push(teacherData);
    }

    Storage.set('sfaTeachers', State.teachers);
    document.getElementById('teacherFormCard').style.display = 'none';
    loadTeachers();
    showToast('✅ Teacher saved successfully!', 'success');
    return false;
}

function loadTeachers() {
    var tbody = document.getElementById('teachersTableBody');
    if (!State.teachers.length) {
        tbody.innerHTML = '<tr><td colspan="6">No teachers</td></tr>';
        return;
    }
    var html = '';
    for (var i = 0; i < State.teachers.length; i++) {
        var t = State.teachers[i];
        var photo = t.photo ? '<div class="table-photo" style="background-image:url(' + t.photo + ');background-size:cover;"></div>' : '<div class="table-photo">' + escapeHtml(t.name.charAt(0)) + '</div>';
        var ct = t.classTeacher ? '<span class="class-teacher-badge">🏫 ' + escapeHtml(t.classTeacher) + '</span>' : '-';
        html += '<tr><td>' + photo + '</td><td><strong>' + escapeHtml(t.employeeId) + '</strong></td><td>' + escapeHtml(t.name) + '</td><td>' + escapeHtml(t.subject) + '</td><td>' + ct + '</td><td>' +
            '<button class="btn btn-outline btn-sm" onclick="showTeacherForm(' + t.id + ')">✏️</button> ' +
            '<button class="btn btn-danger btn-sm" onclick="deleteTeacher(' + t.id + ')">🗑️</button>' +
            '</td></tr>';
    }
    tbody.innerHTML = html;
}

function deleteTeacher(id) {
    var teacher = null;
    for (var i = 0; i < State.teachers.length; i++) {
        if (State.teachers[i].id === id) { teacher = State.teachers[i]; break; }
    }
    if (!teacher) return;
    if (!confirm('Delete teacher ' + teacher.name + ' (' + teacher.employeeId + ')? This cannot be undone.')) return;
    State.teachers = State.teachers.filter(function(t) { return t.id !== id; });
    Storage.set('sfaTeachers', State.teachers);
    loadTeachers();
    showToast('🗑️ Teacher deleted', 'success');
}

function removePhoto(type) {
    var previewId = 'tchPhotoPreview';
    var dataId = 'tchPhotoData';
    var infoId = 'tchPhotoInfo';
    var removeBtnId = 'tchRemovePhotoBtn';
    var inputId = 'tchPhotoInput';
    var indicatorId = 'tchCompressingIndicator';

    var preview = document.getElementById(previewId);
    if (preview) {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<i class="fas fa-chalkboard-teacher"></i>';
        preview.classList.remove('has-photo');
    }
    document.getElementById(dataId).value = '';
    document.getElementById(infoId).innerHTML = 'Max 100KB';
    document.getElementById(removeBtnId).style.display = 'none';
    document.getElementById(inputId).value = '';
    var indicator = document.getElementById(indicatorId);
    if (indicator) indicator.classList.remove('show');
}

function compressAndPreview(input, type) {
    var file = input.files[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
        showToast('Please select a JPG or PNG image.', 'warning');
        input.value = '';
        return;
    }

    var previewId = 'tchPhotoPreview';
    var dataId = 'tchPhotoData';
    var infoId = 'tchPhotoInfo';
    var removeBtnId = 'tchRemovePhotoBtn';
    var indicatorId = 'tchCompressingIndicator';

    var indicator = document.getElementById(indicatorId);
    if (indicator) indicator.classList.add('show');

    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var w = img.width, h = img.height;
            var MAX = 400;
            if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; } else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
            canvas.width = w; canvas.height = h;
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            var quality = 0.9;
            var dataUrl = canvas.toDataURL('image/jpeg', quality);
            var kb = Math.round((dataUrl.length * 3) / 4096);
            while (kb > 100 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }
            if (kb > 100) {
                var scale = Math.sqrt(100 / kb);
                var nw = Math.round(w * scale);
                var nh = Math.round(h * scale);
                canvas.width = nw; canvas.height = nh;
                ctx.fillStyle = '#FFF';
                ctx.fillRect(0, 0, nw, nh);
                ctx.drawImage(img, 0, 0, nw, nh);
                dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                kb = Math.round((dataUrl.length * 3) / 4096);
            }

            var preview = document.getElementById(previewId);
            if (preview) {
                preview.style.backgroundImage = 'url(' + dataUrl + ')';
                preview.innerHTML = '';
                preview.classList.add('has-photo');
            }
            document.getElementById(dataId).value = dataUrl;
            document.getElementById(infoId).innerHTML = '<span class="size-ok">✅ ' + kb + 'KB</span>';
            document.getElementById(removeBtnId).style.display = 'inline-flex';
            if (indicator) indicator.classList.remove('show');
            showToast('📸 Photo uploaded successfully!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ================================================================
// ATTENDANCE
// ================================================================

function isAttendanceLocked(date) {
    if (!date) return false;
    var now = new Date();
    var today = new Date().toISOString().split('T')[0];
    if (date !== today) return true;
    var attRecords = [];
    for (var i = 0; i < State.teacherAttendance.length; i++) {
        if (State.teacherAttendance[i].date === date) attRecords.push(State.teacherAttendance[i]);
    }
    if (attRecords.length === 0) return false;
    var firstMark = attRecords[0].markedAt ? new Date(attRecords[0].markedAt) : new Date();
    return (now - firstMark) / 60000 > 30;
}

function loadTeacherAttendance() {
    var date = document.getElementById('teacherAttDate') ? document.getElementById('teacherAttDate').value : new Date().toISOString().split('T')[0];
    var locked = isAttendanceLocked(date);
    var statusEl = document.getElementById('attendanceLockStatus');
    if (statusEl) {
        statusEl.innerHTML = locked ? '<span class="lock-badge">🔒 LOCKED</span>' : '<span class="auto-save-indicator">💾 Auto-save ON</span>';
    }

    if (State.currentUser && State.currentUser.type === 'teacher') {
        var t = null;
        for (var i = 0; i < State.teachers.length; i++) {
            if (State.teachers[i].id === State.currentUser.id) { t = State.teachers[i]; break; }
        }
        if (!t) {
            document.getElementById('teacherAttendanceSheet').innerHTML = '';
            return;
        }
        var existing = null;
        for (var j = 0; j < State.teacherAttendance.length; j++) {
            if (State.teacherAttendance[j].teacherId === t.id && State.teacherAttendance[j].date === date) {
                existing = State.teacherAttendance[j];
                break;
            }
        }
        var status = existing ? existing.status : 'present';
        document.getElementById('teacherAttendanceSheet').innerHTML =
            '<div class="table-card"><table><thead><tr><th>Emp ID</th><th>Name</th><th>Subject</th><th>Status</th></tr></thead><tbody>' +
            '<tr class="' + (locked ? 'attendance-locked' : '') + '"><td><strong>' + t.employeeId + '</strong></td><td>' + escapeHtml(t.name) + '</td><td>' + escapeHtml(t.subject) + '</td><td><select class="form-input tatt-status" data-id="' + t.id + '" ' + (locked ? 'disabled' : '') + ' onchange="autoSaveTeacherAttendance(this)"><option value="present" ' + (status === 'present' ? 'selected' : '') + '>✅ Present</option><option value="absent" ' + (status === 'absent' ? 'selected' : '') + '>❌ Absent</option><option value="leave" ' + (status === 'leave' ? 'selected' : '') + '>📝 Leave</option></select></td></tr>' +
            '</tbody></table></div>';
        return;
    }

    var html = '<div class="table-card"><table><thead><tr><th>Emp ID</th><th>Name</th><th>Subject</th><th>Status</th></tr></thead><tbody>';
    for (var k = 0; k < State.teachers.length; k++) {
        var t2 = State.teachers[k];
        var existing2 = null;
        for (var m = 0; m < State.teacherAttendance.length; m++) {
            if (State.teacherAttendance[m].teacherId === t2.id && State.teacherAttendance[m].date === date) {
                existing2 = State.teacherAttendance[m];
                break;
            }
        }
        var status2 = existing2 ? existing2.status : 'present';
        html += '<tr class="' + (locked ? 'attendance-locked' : '') + '"><td><strong>' + t2.employeeId + '</strong></td><td>' + escapeHtml(t2.name) + '</td><td>' + escapeHtml(t2.subject) + '</td><td><select class="form-input tatt-status" data-id="' + t2.id + '" ' + (locked ? 'disabled' : '') + ' onchange="autoSaveTeacherAttendance(this)"><option value="present" ' + (status2 === 'present' ? 'selected' : '') + '>✅ Present</option><option value="absent" ' + (status2 === 'absent' ? 'selected' : '') + '>❌ Absent</option><option value="leave" ' + (status2 === 'leave' ? 'selected' : '') + '>📝 Leave</option></select></td></tr>';
    }
    html += '</tbody></table></div>';
    document.getElementById('teacherAttendanceSheet').innerHTML = html;
}

function autoSaveTeacherAttendance(sel) {
    var date = document.getElementById('teacherAttDate').value;
    var teacherId = parseInt(sel.dataset.id);
    State.teacherAttendance = State.teacherAttendance.filter(function(a) {
        return !(a.teacherId === teacherId && a.date === date);
    });
    State.teacherAttendance.push({ teacherId: teacherId, status: sel.value, date: date, markedAt: new Date().toISOString() });
    Storage.set('sfaTeacherAttendance', State.teacherAttendance);
    showToast('✅ Attendance saved!', 'success');
}

function loadStudentAttendance() {
    var cls = document.getElementById('attClass').value;
    var sec = document.getElementById('attSection').value;
    var container = document.getElementById('attendanceSheet');

    if (State.currentUser && State.currentUser.type === 'teacher') {
        var teacher = null;
        for (var i = 0; i < State.teachers.length; i++) {
            if (State.teachers[i].id === State.currentUser.id) { teacher = State.teachers[i]; break; }
        }
        if (teacher && teacher.classTeacher) {
            var parts = teacher.classTeacher.split(' - ');
            var tcls = parts[0] || '';
            var tsec = parts[1] || '';
            document.getElementById('attClass').value = tcls;
            document.getElementById('attSection').value = tsec;
            document.getElementById('attClass').disabled = true;
            document.getElementById('attSection').disabled = true;
            cls = tcls;
            sec = tsec;
        }
    }

    if (!cls || !sec) { container.innerHTML = '<p>Please select Class & Section</p>'; return; }

    var students = State.students.filter(function(s) { return s.class === cls && s.section === sec; });
    if (!students.length) {
        container.innerHTML = '<p>No students found in this class</p>';
        return;
    }

    var html = '<div class="table-card"><table><thead><tr><th>Adm No.</th><th>Name</th><th>Status</th></tr></thead><tbody>';
    for (var j = 0; j < students.length; j++) {
        var s = students[j];
        html += '<tr><td>' + escapeHtml(s.admissionNo) + '</td><td>' + escapeHtml(s.name) + '</td><td><select class="form-input satt-status" data-id="' + s.id + '"><option value="present">✅ Present</option><option value="absent">❌ Absent</option><option value="leave">📝 Leave</option></select></td></tr>';
    }
    html += '</tbody></table></div><button class="btn btn-primary btn-sm" onclick="saveStudentAttendance()" style="margin-top:10px;">💾 Save Attendance</button>';
    container.innerHTML = html;
}

function saveStudentAttendance() {
    var date = document.getElementById('attDate').value;
    var cls = document.getElementById('attClass').value;
    var sec = document.getElementById('attSection').value;
    var records = [];
    var sels = document.querySelectorAll('.satt-status');
    for (var i = 0; i < sels.length; i++) {
        var sel = sels[i];
        var studentId = parseInt(sel.dataset.id);
        var student = null;
        for (var j = 0; j < State.students.length; j++) {
            if (State.students[j].id === studentId) { student = State.students[j]; break; }
        }
        if (student) {
            records.push({ studentId: student.id, studentName: student.name, status: sel.value, date: date, class: cls, section: sec });
        }
    }
    State.studentAttendance = State.studentAttendance.filter(function(a) {
        return !(a.date === date && a.class === cls && a.section === sec);
    });
    for (var k = 0; k < records.length; k++) State.studentAttendance.push(records[k]);
    Storage.set('sfaStudentAttendance', State.studentAttendance);
    showToast('✅ Attendance saved!', 'success');
}

// ================================================================
// STUDENT SELF PROFILE
// ================================================================

function loadStudentSelf() {
    if (!State.currentUser || !State.currentUser.id) return;
    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === State.currentUser.id) { student = State.students[i]; break; }
    }
    if (!student) return;

    var photoHtml = student.photo ?
        '<div class="photo-preview" style="width:80px;height:80px;margin:0 auto 16px;cursor:default;background-image:url(' + student.photo + ');background-size:cover;background-position:center;"></div>' :
        '<div class="photo-preview" style="width:80px;height:80px;margin:0 auto 16px;cursor:default;font-size:32px;">' + escapeHtml(student.name.charAt(0)) + '</div>';

    var attendance = getStudentAttendance(student.id);
    var status = getAttendanceStatus(attendance.percentage);

    var html =
        '<div style="text-align:center;margin-bottom:16px;">' + photoHtml +
        '<h3>' + escapeHtml(student.name) + '</h3>' +
        '<p style="color:var(--text-secondary);">' + escapeHtml(student.admissionNo) + '</p></div>' +
        '<div class="form-grid">' +
        '<div class="form-group"><label>Class</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.class) + ' - ' + escapeHtml(student.section) + '</div></div>' +
        '<div class="form-group"><label>Gender</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.gender) + '</div></div>' +
        '<div class="form-group"><label>DOB</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.dob) + '</div></div>' +
        '<div class="form-group"><label>Religion</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.religion || 'N/A') + '</div></div>' +
        '<div class="form-group"><label>Father\'s Name</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.fatherName || 'N/A') + '</div></div>' +
        '<div class="form-group"><label>Mother\'s Name</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.motherName || 'N/A') + '</div></div>' +
        '<div class="form-group"><label>Parent Phone</label><div class="form-input" style="background:#F8FAFC;">' + escapeHtml(student.parentPhone || 'N/A') + '</div></div>' +
        '<div class="form-group"><label>Status</label><div class="form-input" style="background:#F8FAFC;"><span class="badge badge-success">' + escapeHtml(student.status || 'Active') + '</span></div></div></div>' +
        '<div class="form-section" style="margin-top:20px;border-top:2px solid var(--border);padding-top:20px;">' +
        '<h3 class="form-section-title">📅 Attendance Overview</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;">' +
        '<div style="background:var(--bg-card);border-radius:var(--radius);padding:12px;text-align:center;border:1px solid #22C55E;"><div class="stat-number" style="color:#22C55E;">' + attendance.present + '</div><div class="stat-label">✅ Present</div></div>' +
        '<div style="background:var(--bg-card);border-radius:var(--radius);padding:12px;text-align:center;border:1px solid #EF4444;"><div class="stat-number" style="color:#EF4444;">' + attendance.absent + '</div><div class="stat-label">❌ Absent</div></div>' +
        '<div style="background:var(--bg-card);border-radius:var(--radius);padding:12px;text-align:center;border:1px solid #F59E0B;"><div class="stat-number" style="color:#B45309;">' + attendance.leave + '</div><div class="stat-label">📝 Leave</div></div>' +
        '<div style="background:var(--bg-card);border-radius:var(--radius);padding:12px;text-align:center;border:1px solid #8B5CF6;"><div class="stat-number" style="color:#8B5CF6;">' + attendance.total + '</div><div class="stat-label">📅 Total Days</div></div></div>' +
        '<div style="border-left:4px solid ' + status.color + ';background:' + status.color + '15;padding:12px 16px;border-radius:var(--radius);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">' +
        '<div><span style="font-size:24px;">' + status.icon + '</span><span style="font-weight:700;margin-left:8px;color:' + status.color + ';">' + status.label + '</span></div>' +
        '<div style="font-size:24px;font-weight:800;color:' + status.color + ';">' + attendance.percentage + '%</div></div>' +
        '<div style="width:100%;height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:8px;"><div style="width:' + attendance.percentage + '%;height:100%;background:' + status.color + ';border-radius:4px;transition:width 0.6s ease;"></div></div>';

    if (attendance.recent && attendance.recent.length > 0) {
        html += '<div style="margin-top:12px;"><p style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">📋 Recent Attendance</p><table class="table-card"><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>';
        var recent = attendance.recent.slice(0, 7);
        for (var r = 0; r < recent.length; r++) {
            var a = recent[r];
            var badge = a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-danger' : 'badge-warning';
            var label = a.status === 'present' ? '✅ Present' : a.status === 'absent' ? '❌ Absent' : '📝 Leave';
            html += '<tr><td>' + a.date + '</td><td><span class="badge ' + badge + '">' + label + '</span></td></tr>';
        }
        html += '</tbody></table></div>';
    } else {
        html += '<p style="text-align:center;color:var(--text-secondary);font-size:12px;padding:12px;">No attendance records found.</p>';
    }
    html += '</div>';

    document.getElementById('studentSelfView').innerHTML = html;
}

function getStudentAttendance(studentId) {
    var records = [];
    for (var i = 0; i < State.studentAttendance.length; i++) {
        if (State.studentAttendance[i].studentId === studentId) records.push(State.studentAttendance[i]);
    }
    var present = 0, absent = 0, leave = 0;
    for (var j = 0; j < records.length; j++) {
        if (records[j].status === 'present') present++;
        else if (records[j].status === 'absent') absent++;
        else if (records[j].status === 'leave') leave++;
    }
    var total = records.length;
    var percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    var recent = records.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    return { present: present, absent: absent, leave: leave, total: total, percentage: percentage, recent: recent };
}

function getAttendanceStatus(percentage) {
    if (percentage >= 90) return { label: 'Excellent', color: '#22C55E', icon: '🌟' };
    if (percentage >= 75) return { label: 'Good Standing', color: '#3B82F6', icon: '🟢' };
    if (percentage >= 60) return { label: 'Satisfactory', color: '#F59E0B', icon: '🟡' };
    if (percentage >= 40) return { label: 'Needs Improvement', color: '#F97316', icon: '🟠' };
    return { label: 'Poor', color: '#DC2626', icon: '🔴' };
}

// ================================================================
// FEE STRUCTURE
// ================================================================

function loadFeeSettingsPage() {
    loadSettingsAdmissionFeeTable();
    loadSettingsReAdmissionFeeTable();
}

function buildFeeTableHTML(tableId, feeData, prefix, readOnly) {
    var html = '';
    for (var i = 0; i < FEE_COMPONENTS.length; i++) {
        var comp = FEE_COMPONENTS[i];
        html += '<tr><td>' + FEE_ICONS[i] + ' ' + comp + '</td>';
        for (var c = 0; c < CLASS_LIST.length; c++) {
            var cls = CLASS_LIST[c];
            var val = (feeData[cls] || DEFAULT_FEES[cls])[i] || 0;
            if (readOnly) {
                html += '<td><span class="fee-readonly">' + val + '</span></td>';
            } else {
                html += '<td><input type="number" class="' + prefix + '-fee-input" data-row="' + i + '" data-col="' + c + '" value="' + val + '" style="width:50px;" min="0"></td>';
            }
        }
        html += '</tr>';
    }
    html += '<tr class="total-col"><td><strong>💰 TOTAL</strong></td>';
    for (var d = 0; d < CLASS_LIST.length; d++) {
        html += '<td><span class="' + prefix + '-class-total" data-class="' + CLASS_LIST[d] + '">₹0</span></td>';
    }
    html += '</tr>';
    document.querySelector('#' + tableId + ' tbody').innerHTML = html;
}

function updateFeeTotals(prefix, feeData) {
    for (var c = 0; c < CLASS_LIST.length; c++) {
        var cls = CLASS_LIST[c];
        var total = 0;
        for (var i = 0; i < FEE_COMPONENTS.length; i++) {
            var inputs = document.querySelectorAll('.' + prefix + '-fee-input[data-row="' + i + '"]');
            if (inputs.length > c) {
                var val = parseInt(inputs[c].value) || 0;
                total += compIncludesTuition(i) ? val * 12 : val;
            }
        }
        var el = document.querySelector('.' + prefix + '-class-total[data-class="' + cls + '"]');
        if (el) el.textContent = '₹' + total.toLocaleString('en-IN');
    }
}

function compIncludesTuition(index) {
    return FEE_COMPONENTS[index] && FEE_COMPONENTS[index].includes('Tuition');
}

function saveFeeData(prefix, feeData, storageKey) {
    var inputs = document.querySelectorAll('.' + prefix + '-fee-input');
    for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        var row = parseInt(inp.dataset.row);
        var col = parseInt(inp.dataset.col);
        var cls = CLASS_LIST[col];
        if (!feeData[cls]) feeData[cls] = DEFAULT_FEES[cls].slice();
        feeData[cls][row] = parseInt(inp.value) || 0;
    }
    Storage.set(storageKey, feeData);
}

function loadSettingsAdmissionFeeTable() {
    buildFeeTableHTML('settingsAdmissionFeeTable', State.admissionFees, 'settings-adm', false);
    var inputs = document.querySelectorAll('.settings-adm-fee-input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', function() { updateFeeTotals('settings-adm', State.admissionFees); });
    }
    updateFeeTotals('settings-adm', State.admissionFees);
}

function loadSettingsReAdmissionFeeTable() {
    buildFeeTableHTML('settingsReAdmissionFeeTable', State.reAdmissionFees, 'settings-readm', false);
    var inputs = document.querySelectorAll('.settings-readm-fee-input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', function() { updateFeeTotals('settings-readm', State.reAdmissionFees); });
    }
    updateFeeTotals('settings-readm', State.reAdmissionFees);
}

function saveAllFeeSettings() {
    saveFeeData('settings-adm', State.admissionFees, 'sfaAdmissionFees');
    saveFeeData('settings-readm', State.reAdmissionFees, 'sfaReAdmissionFees');
    showToast('✅ All fee settings saved!', 'success');
}

// ================================================================
// FEE COLLECTION
// ================================================================

function searchStudentForFee() {
    var query = document.getElementById('feeSearchStudent').value.trim().toLowerCase();
    var resultsDiv = document.getElementById('feeStudentSearchResults');
    if (query.length < 2) { resultsDiv.innerHTML = ''; return; }

    var results = State.students.filter(function(s) {
        return s.name.toLowerCase().includes(query) || s.admissionNo.toLowerCase().includes(query);
    });
    if (!results.length) {
        resultsDiv.innerHTML = '<div style="padding:10px;color:var(--text-secondary);text-align:center;">No students found</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
        var s = results[i];
        html += '<div onclick="selectStudentForFee(' + s.id + ')" style="padding:10px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:10px;">' +
            '<div class="table-photo">' + escapeHtml(s.name.charAt(0)) + '</div>' +
            '<div style="flex:1;"><strong>' + escapeHtml(s.name) + '</strong><div style="font-size:11px;color:var(--text-secondary);">' + escapeHtml(s.admissionNo) + ' | ' + escapeHtml(s.class) + ' - ' + escapeHtml(s.section) + '</div></div></div>';
    }
    resultsDiv.innerHTML = html;
}

function selectStudentForFee(studentId) {
    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === studentId) { student = State.students[i]; break; }
    }
    if (!student) return;
    document.getElementById('feeSelectedStudentId').value = studentId;
    document.getElementById('feeSearchStudent').value = student.name;
    document.getElementById('feeStudentSearchResults').innerHTML = '';
    document.getElementById('feeStudentProfile').style.display = 'block';

    document.getElementById('feeStudentProfileContent').innerHTML =
        '<div style="display:flex;align-items:center;gap:16px;padding:12px;background:var(--primary-light);border-radius:10px;">' +
        '<div class="photo-preview" style="width:60px;height:60px;font-size:20px;margin:0;cursor:default;">' + escapeHtml(student.name.charAt(0)) + '</div>' +
        '<div><h3>' + escapeHtml(student.name) + '</h3><div style="font-size:12px;color:var(--text-secondary);">' + escapeHtml(student.admissionNo) + ' | ' + escapeHtml(student.class) + ' - ' + escapeHtml(student.section) +
        '<br>Father: ' + escapeHtml(student.fatherName || 'N/A') + ' | Religion: ' + escapeHtml(student.religion || 'N/A') +
        '</div></div></div>';

    var classFee = State.admissionFees[student.class] || DEFAULT_FEES[student.class];
    if (classFee) document.getElementById('feeAmount').value = classFee[classFee.length - 1] || 0;
    loadFeePaymentHistory(studentId);
}

function loadFeePaymentHistory(studentId) {
    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === studentId) { student = State.students[i]; break; }
    }
    if (!student) return;

    var studentFees = State.feeRecords.filter(function(r) { return r.studentId === studentId; });
    var totalPaid = 0;
    for (var j = 0; j < studentFees.length; j++) {
        totalPaid += (studentFees[j].total || studentFees[j].amount || 0);
    }
    var allMonths = ['April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027'];
    var paidMonths = [];
    for (var k = 0; k < studentFees.length; k++) {
        if (studentFees[k].feeMonth) paidMonths.push(studentFees[k].feeMonth);
    }

    var html =
        '<div style="margin-bottom:12px;padding:10px;background:#F0FDF4;border-radius:8px;display:flex;justify-content:space-between;">' +
        '<span><strong>Total Paid:</strong> <span style="color:#22C55E;">₹' + totalPaid.toLocaleString('en-IN') + '</span></span>' +
        '<span><strong>Receipts:</strong> ' + studentFees.length + '</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px;">';

    for (var m = 0; m < allMonths.length; m++) {
        var month = allMonths[m];
        var paid = paidMonths.indexOf(month) !== -1;
        html += '<div style="padding:6px;border-radius:6px;background:' + (paid ? '#DCFCE7' : '#FEE2E2') + ';text-align:center;font-size:11px;font-weight:600;color:' + (paid ? '#22C55E' : '#EF4444') + ';">' + (paid ? '✅' : '❌') + ' ' + month.split(' ')[0].substring(0,3) + '</div>';
    }
    html += '</div>';

    if (studentFees.length > 0) {
        studentFees.reverse();
        html += '<table class="table-card"><thead><tr><th>Receipt</th><th>Month</th><th>Amount</th><th>Date</th></tr></thead><tbody>';
        for (var r = 0; r < studentFees.length; r++) {
            var rec = studentFees[r];
            html += '<tr><td><strong>' + escapeHtml(rec.receiptNo) + '</strong></td><td>' + escapeHtml(rec.feeMonth || '-') + '</td><td>₹' + (rec.total || rec.amount || 0).toLocaleString('en-IN') + '</td><td>' + escapeHtml(rec.date) + '</td></tr>';
        }
        html += '</tbody></table>';
    }
    document.getElementById('feePaymentHistory').innerHTML = html;
}

function collectFeeForStudent() {
    var studentId = parseInt(document.getElementById('feeSelectedStudentId').value);
    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === studentId) { student = State.students[i]; break; }
    }
    if (!student) { showToast('Please select a student first', 'warning'); return; }

    var amount = parseFloat(document.getElementById('feeAmount').value) || 0;
    if (amount <= 0) { showToast('Please enter a valid amount', 'warning'); return; }

    var feeMonth = document.getElementById('feeMonth').value;
    if (!feeMonth) { showToast('Please select a fee month', 'warning'); return; }

    var category = document.getElementById('feeCategory').value;
    var method = document.getElementById('feeMethod').value;
    var date = document.getElementById('feeDate').value || new Date().toISOString().split('T')[0];
    var transactionId = document.getElementById('feeTransactionId').value;
    var receiptNo = 'RCP-' + new Date().getFullYear() + '-' + String(State.feeRecords.length + 1).padStart(3, '0');

    var record = {
        id: Date.now(),
        receiptNo: receiptNo,
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admissionNo,
        class: student.class,
        section: student.section,
        category: category,
        amount: amount,
        total: amount,
        feeMonth: feeMonth,
        method: method,
        date: date,
        transactionId: transactionId,
        collectedBy: State.currentUser ? State.currentUser.name : 'Accountant'
    };

    State.feeRecords.push(record);
    Storage.set('sfaFees', State.feeRecords);

    document.getElementById('feeReceiptContainer').innerHTML =
        '<div style="background:white;padding:20px;border:2px dashed #E2E8F0;border-radius:12px;margin-top:16px;">' +
        '<div style="text-align:center;border-bottom:2px solid #F59E0B;"><h3>St. Francis of Assisi School</h3><p>Receipt #' + escapeHtml(receiptNo) + '</p></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;"><span>Student:</span><strong>' + escapeHtml(student.name) + '</strong></div>' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;"><span>Month:</span><span>' + escapeHtml(feeMonth || 'N/A') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:16px;border-top:2px solid #E2E8F0;margin-top:8px;"><span>Amount:</span><span style="color:#22C55E;">₹' + amount.toLocaleString('en-IN') + '</span></div>' +
        '<button class="btn btn-primary btn-sm" onclick="window.print()" style="margin-top:10px;">🖨️ Print</button>' +
        '</div>';

    document.getElementById('feeAmount').value = '';
    document.getElementById('feeMonth').value = '';
    document.getElementById('feeTransactionId').value = '';
    loadFeePaymentHistory(studentId);
    showToast('✅ Fee collected successfully!', 'success');
}

function loadFeeRecords() {
    var tbody = document.getElementById('feeRecordsTableBody');
    if (!State.feeRecords.length) {
        tbody.innerHTML = '<tr><td colspan="6">No records found</td></tr>';
        return;
    }
    var sorted = State.feeRecords.slice().reverse();
    var html = '';
    for (var i = 0; i < sorted.length; i++) {
        var r = sorted[i];
        html += '<tr><td><strong>' + escapeHtml(r.receiptNo) + '</strong></td><td>' + escapeHtml(r.studentName) + '</td><td>' + escapeHtml(r.class) + '</td><td>' + escapeHtml(r.feeMonth || '-') + '</td><td>₹' + (r.total || r.amount || 0).toLocaleString('en-IN') + '</td><td>' + escapeHtml(r.date) + '</td></tr>';
    }
    tbody.innerHTML = html;
}

// ================================================================
// QR CODES
// ================================================================

function updateQRSelects() {
    var ss = document.getElementById('qrStudentSelect');
    var ts = document.getElementById('qrTeacherSelect');
    if (ss) {
        var html = '<option value="">Select Student</option>';
        for (var i = 0; i < State.students.length; i++) {
            var s = State.students[i];
            html += '<option value="' + s.id + '">' + escapeHtml(s.name) + ' (' + escapeHtml(s.admissionNo) + ') - ' + escapeHtml(s.class) + ' ' + escapeHtml(s.section) + '</option>';
        }
        ss.innerHTML = html;
    }
    if (ts) {
        var html2 = '<option value="">Select Teacher</option>';
        for (var j = 0; j < State.teachers.length; j++) {
            var t = State.teachers[j];
            html2 += '<option value="' + t.id + '">' + escapeHtml(t.name) + ' (' + escapeHtml(t.employeeId) + ') - ' + escapeHtml(t.subject) + '</option>';
        }
        ts.innerHTML = html2;
    }
}

function generateQR(type) {
    var selectId = type === 'student' ? 'qrStudentSelect' : 'qrTeacherSelect';
    var displayId = type + 'QRDisplay';
    var id = parseInt(document.getElementById(selectId) ? document.getElementById(selectId).value : 0);
    var display = document.getElementById(displayId);
    if (!id || !display) {
        if (display) display.innerHTML = '<p style="color:#94A3B8;">Select a ' + type + ' to generate QR</p>';
        return;
    }

    var person = type === 'student' ? null : null;
    if (type === 'student') {
        for (var i = 0; i < State.students.length; i++) {
            if (State.students[i].id === id) { person = State.students[i]; break; }
        }
    } else {
        for (var j = 0; j < State.teachers.length; j++) {
            if (State.teachers[j].id === id) { person = State.teachers[j]; break; }
        }
    }
    if (!person) return;

    var data = type === 'student' ? {
        type: 'Student',
        admissionNo: person.admissionNo,
        name: person.name,
        class: person.class,
        section: person.section,
        father: person.fatherName || '',
        school: 'St. Francis of Assisi School'
    } : {
        type: 'Teacher',
        employeeId: person.employeeId,
        name: person.name,
        subject: person.subject,
        school: 'St. Francis of Assisi School'
    };

    display.innerHTML = '';
    try {
        new QRCode(display, { text: JSON.stringify(data), width: 160, height: 160, colorDark: '#1E3A5F', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.H });
        State.qrCodes[type + '_' + id] = { data: data, generatedAt: new Date().toISOString() };
        Storage.set('sfaQRCodes', State.qrCodes);
        showToast('✅ QR Code generated!', 'success');
    } catch (e) {
        display.innerHTML = '<p style="color:#EF4444;">Error generating QR. Please refresh.</p>';
        console.error('QR Error:', e);
    }
}

function downloadQR(type) {
    var display = document.getElementById(type + 'QRDisplay');
    var select = document.getElementById(type === 'student' ? 'qrStudentSelect' : 'qrTeacherSelect');
    var id = select ? parseInt(select.value) : 0;
    var person = null;
    if (type === 'student') {
        for (var i = 0; i < State.students.length; i++) {
            if (State.students[i].id === id) { person = State.students[i]; break; }
        }
    } else {
        for (var j = 0; j < State.teachers.length; j++) {
            if (State.teachers[j].id === id) { person = State.teachers[j]; break; }
        }
    }
    if (!display || !person) { showToast('Please generate a QR code first', 'warning'); return; }
    var canvas = display.querySelector('canvas');
    if (!canvas) { showToast('No QR code to download. Please generate it first.', 'warning'); return; }
    var link = document.createElement('a');
    var safe = (person.name || type).replace(/[^a-z0-9]+/gi, '_');
    link.download = safe + '_QR.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('⬇️ QR Code downloaded!', 'success');
}

// ================================================================
// NOTICES
// ================================================================

function createNotice() {
    var title = document.getElementById('noticeTitle').value.trim();
    var message = document.getElementById('noticeMessage').value.trim();
    if (!title || !message) { showToast('Please fill in all fields', 'warning'); return false; }

    var notice = {
        id: Date.now(),
        title: title,
        message: message,
        type: document.getElementById('noticeType').value,
        for: document.getElementById('noticeFor').value,
        date: new Date().toISOString().split('T')[0],
        createdBy: State.currentUser ? State.currentUser.name : 'Principal'
    };
    State.notices.unshift(notice);
    Storage.set('sfaNotices', State.notices);
    document.getElementById('noticeForm').reset();
    loadAllNotices();
    loadNoticeBoard();
    showToast('✅ Notice published!', 'success');
    return false;
}

function loadNoticeBoard() {
    var container = document.getElementById('noticeList');
    if (!container) return;
    var visible = State.notices.filter(function(n) {
        return n.for === 'All' ||
            (State.currentUser && State.currentUser.type === 'admin') ||
            (State.currentUser && State.currentUser.type === 'superadmin') ||
            (State.currentUser && State.currentUser.type === 'teacher' && n.for === 'Teachers Only') ||
            (State.currentUser && State.currentUser.type === 'student' && n.for === 'Students Only') ||
            (State.currentUser && State.currentUser.type === 'accountant' && n.for === 'Accountant Only');
    }).slice(0, 5);
    if (!visible.length) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:12px;">No notices available</p>';
        return;
    }
    var html = '';
    for (var i = 0; i < visible.length; i++) {
        var n = visible[i];
        var cls = n.type.toLowerCase() === 'urgent' ? 'urgent' : n.type.toLowerCase() === 'important' ? 'info' : '';
        html += '<div class="notice-item ' + cls + '">' +
            '<h4>' + escapeHtml(n.title) + ' <span class="notice-badge ' + escapeHtml(n.type.toLowerCase()) + '">' + escapeHtml(n.type) + '</span></h4>' +
            '<p>' + escapeHtml(n.message) + '</p>' +
            '<div class="notice-date">📅 ' + escapeHtml(n.date) + ' | By: ' + escapeHtml(n.createdBy) + ' | For: ' + escapeHtml(n.for) + '</div></div>';
    }
    container.innerHTML = html;
}

function loadAllNotices() {
    var tbody = document.getElementById('noticesTableBody');
    if (!tbody) return;
    if (!State.notices.length) {
        tbody.innerHTML = '<tr><td colspan="5">No notices</td></tr>';
        return;
    }
    var html = '';
    for (var i = 0; i < State.notices.length; i++) {
        var n = State.notices[i];
        var badge = n.type === 'Urgent' ? 'badge-danger' : n.type === 'Important' ? 'badge-warning' : 'badge-success';
        html += '<tr><td><strong>' + escapeHtml(n.title) + '</strong></td><td><span class="badge ' + badge + '">' + escapeHtml(n.type) + '</span></td><td>' + escapeHtml(n.for) + '</td><td>' + escapeHtml(n.date) + '</td><td><button class="btn btn-danger btn-sm" onclick="deleteNotice(' + n.id + ')">🗑️</button></td></tr>';
    }
    tbody.innerHTML = html;
}

function deleteNotice(id) {
    if (!confirm('Delete this notice?')) return;
    State.notices = State.notices.filter(function(n) { return n.id !== id; });
    Storage.set('sfaNotices', State.notices);
    loadAllNotices();
    loadNoticeBoard();
    showToast('Notice deleted', 'warning');
}

// ================================================================
// MARK SETTINGS & PERMISSIONS
// ================================================================

function saveMarkSettings() {
    MarkSettings.ut1Full = Math.max(1, parseInt(document.getElementById('ut1Full').value) || 25);
    MarkSettings.ut1Pass = Math.max(0, parseInt(document.getElementById('ut1Pass').value) || 9);
    MarkSettings.ut2Full = Math.max(1, parseInt(document.getElementById('ut2Full').value) || 25);
    MarkSettings.ut2Pass = Math.max(0, parseInt(document.getElementById('ut2Pass').value) || 9);
    MarkSettings.hyFull = Math.max(1, parseInt(document.getElementById('hyFull').value) || 100);
    MarkSettings.hyPass = Math.max(0, parseInt(document.getElementById('hyPass').value) || 25);
    MarkSettings.anFull = Math.max(1, parseInt(document.getElementById('anFull').value) || 100);
    MarkSettings.anPass = Math.max(0, parseInt(document.getElementById('anPass').value) || 33);
    Storage.set('sfaMarkSettings', MarkSettings);
    Storage.set('sfaMarkPermissions', MarkPermissions);
    loadMarkSettings();
    loadMarkPermissionsUI();
    showToast('✅ Mark settings and permissions saved!', 'success');
}

function loadMarkSettings() {
    var keys = ['ut1Full', 'ut1Pass', 'ut2Full', 'ut2Pass', 'hyFull', 'hyPass', 'anFull', 'anPass'];
    for (var i = 0; i < keys.length; i++) {
        var input = document.getElementById(keys[i]);
        if (input) input.value = MarkSettings[keys[i]];
    }
}

function getMarkLimits(exam) {
    if (exam === 'ut1') return { full: MarkSettings.ut1Full, pass: MarkSettings.ut1Pass };
    if (exam === 'ut2') return { full: MarkSettings.ut2Full, pass: MarkSettings.ut2Pass };
    if (exam === 'hy') return { full: MarkSettings.hyFull, pass: MarkSettings.hyPass };
    return { full: MarkSettings.anFull, pass: MarkSettings.anPass };
}

function loadMarkPermissionsUI() {
    var container = document.getElementById('markPermissionsContainer');
    if (!container) return;
    if (!State.currentUser || State.currentUser.type !== 'admin') {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">Only Principal can manage mark permissions.</p>';
        return;
    }

    var examNames = { ut1: '1st Unit Test', ut2: '2nd Unit Test', hy: 'Half Yearly', an: '📌 Annual Exam' };
    var html = '';
    var keys = Object.keys(MarkPermissions);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var perm = MarkPermissions[key];
        var status = perm.published ? 'Published' : perm.approved ? 'Approved' : perm.locked ? 'Locked' : perm.enabled ? 'Open' : 'Disabled';
        var statusClass = perm.published ? 'published' : perm.approved ? 'approved' : perm.locked ? 'locked' : perm.enabled ? 'open' : 'locked';

        html += '<div class="permission-toggle">' +
            '<div style="flex:1;">' +
            '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
            '<strong style="font-size:13px;">' + examNames[key] + '</strong>' +
            '<span class="status-badge ' + statusClass + '">' + status + '</span>' +
            (perm.deadline ? '<span style="font-size:10px;color:var(--text-secondary);">📅 Deadline: ' + perm.deadline + '</span>' : '') +
            (perm.locked && !perm.enabled ? '<span style="font-size:10px;color:var(--danger);">🔒 Entry Closed</span>' : '') +
            (perm.enabled ? '<span style="font-size:10px;color:var(--success);">✅ Entry Open</span>' : '') +
            '</div></div>' +
            '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
            '<label style="font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;"><span>Enable</span><div class="toggle-switch"><input type="checkbox" id="perm_enabled_' + key + '" ' + (perm.enabled ? 'checked' : '') + ' onchange="updateMarkPermission(\'' + key + '\', \'enabled\', this.checked)"><span class="toggle-slider"></span></div></label>' +
            '<label style="font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;"><span>Lock</span><div class="toggle-switch"><input type="checkbox" id="perm_locked_' + key + '" ' + (perm.locked ? 'checked' : '') + ' onchange="updateMarkPermission(\'' + key + '\', \'locked\', this.checked)"><span class="toggle-slider"></span></div></label>' +
            '<label style="font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;"><span>Approved</span><div class="toggle-switch"><input type="checkbox" id="perm_approved_' + key + '" ' + (perm.approved ? 'checked' : '') + ' onchange="updateMarkPermission(\'' + key + '\', \'approved\', this.checked)"><span class="toggle-slider"></span></div></label>' +
            '<label style="font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;"><span>Published</span><div class="toggle-switch"><input type="checkbox" id="perm_published_' + key + '" ' + (perm.published ? 'checked' : '') + ' onchange="updateMarkPermission(\'' + key + '\', \'published\', this.checked)"><span class="toggle-slider"></span></div></label>' +
            '<input type="date" class="form-input" style="width:140px;padding:4px 8px;font-size:11px;" value="' + (perm.deadline || '') + '" onchange="updateMarkPermission(\'' + key + '\', \'deadline\', this.value)">' +
            '</div></div>';
    }
    container.innerHTML = html;
}

function updateMarkPermission(examKey, field, value) {
    if (!State.currentUser || State.currentUser.type !== 'admin') {
        showToast('Only Principal can change permissions', 'warning');
        return;
    }
    MarkPermissions[examKey][field] = value;
    if (field === 'enabled' && value === false) MarkPermissions[examKey].locked = true;
    if (field === 'enabled' && value === true) MarkPermissions[examKey].locked = false;
    Storage.set('sfaMarkPermissions', MarkPermissions);
    showToast('✅ Permission updated for ' + examKey.toUpperCase(), 'success');
    loadMarkPermissionsUI();
}

function canEnterMarks(examType, classSection) {
    if (!State.currentUser || State.currentUser.type !== 'teacher') {
        return { allowed: false, reason: 'Only teachers can enter marks' };
    }
    var teacher = null;
    for (var i = 0; i < State.teachers.length; i++) {
        if (State.teachers[i].id === State.currentUser.id) { teacher = State.teachers[i]; break; }
    }
    if (!teacher || teacher.classTeacher !== classSection) {
        return { allowed: false, reason: 'You are not the Class Teacher for this section' };
    }

    var perm = MarkPermissions[examType];
    if (!perm) return { allowed: false, reason: 'Exam not found' };
    if (perm.published) return { allowed: false, reason: '📊 Marks are published and locked' };
    if (perm.approved) return { allowed: false, reason: '✅ Marks are approved - view only' };
    if (perm.locked) return { allowed: false, reason: '🔒 Entry is locked by Principal' };
    if (!perm.enabled) return { allowed: false, reason: '🚫 Entry is disabled by Principal' };
    if (perm.deadline) {
        var deadline = new Date(perm.deadline);
        var today = new Date();
        if (today > deadline) {
            MarkPermissions[examType].locked = true;
            Storage.set('sfaMarkPermissions', MarkPermissions);
            return { allowed: false, reason: '⏰ Deadline passed - entry closed' };
        }
    }
    return { allowed: true, reason: '✅ Entry allowed' };
}

// ================================================================
// MARK ENTRY
// ================================================================

function loadMarkSheet() {
    var exam = document.getElementById('examType').value;
    var cls = document.getElementById('markClass').value;
    var sec = document.getElementById('markSection').value;
    var container = document.getElementById('markSheetContainer');
    var statusEl = document.getElementById('markEntryStatus');

    if (!exam || !cls || !sec) {
        container.innerHTML = '';
        if (statusEl) { statusEl.textContent = ''; statusEl.style.display = 'none'; }
        return;
    }

    var classSection = cls + ' - ' + sec;
    var permission = canEnterMarks(exam, classSection);

    if (!permission.allowed) {
        if (statusEl) {
            statusEl.textContent = '🔒 ' + permission.reason;
            statusEl.style.display = 'inline-block';
            statusEl.style.background = '#FEE2E2';
            statusEl.style.color = '#DC2626';
            statusEl.style.padding = '4px 12px';
            statusEl.style.borderRadius = '20px';
            statusEl.style.fontWeight = '600';
            statusEl.style.fontSize = '11px';
        }
        container.innerHTML = '<div style="text-align:center;padding:60px 20px;background:var(--warning-light);border-radius:var(--radius);">' +
            '<i class="fas fa-lock" style="font-size:48px;color:#B45309;margin-bottom:16px;display:block;"></i>' +
            '<h3 style="color:#B45309;margin-bottom:8px;">Access Restricted</h3>' +
            '<p style="color:var(--text-secondary);">' + permission.reason + '</p></div>';
        return;
    }

    if (statusEl) {
        statusEl.textContent = '✅ ' + permission.reason;
        statusEl.style.display = 'inline-block';
        statusEl.style.background = '#DCFCE7';
        statusEl.style.color = '#16A34A';
        statusEl.style.padding = '4px 12px';
        statusEl.style.borderRadius = '20px';
        statusEl.style.fontWeight = '600';
        statusEl.style.fontSize = '11px';
    }

    var students = State.students.filter(function(s) { return s.class === cls && s.section === sec; });
    if (!students.length) {
        container.innerHTML = '<p style="text-align:center;padding:20px;">No students found</p>';
        return;
    }

    var limits = getMarkLimits(exam);
    var subjects = getSubjects();

    var html = '<div style="overflow-x:auto;"><table class="mark-sheet-table"><thead><tr><th>Adm No.</th><th>Student Name</th>';
    for (var s = 0; s < subjects.length; s++) html += '<th>' + subjects[s] + '</th>';
    html += '<th>Total</th><th>Result</th></tr></thead><tbody>';

    for (var i = 0; i < students.length; i++) {
        var student = students[i];
        var key = exam + '_' + student.id;
        var existing = State.marksData[key] || {};
        var total = 0, allPass = true;
        html += '<tr><td>' + escapeHtml(student.admissionNo) + '</td><td class="subject-col">' + escapeHtml(student.name) + '</td>';
        for (var j = 0; j < subjects.length; j++) {
            var subject = subjects[j];
            var value = existing[subject] !== undefined ? existing[subject] : '';
            if (value !== '' && !isNaN(value)) {
                total += parseInt(value);
                if (parseInt(value) < limits.pass) allPass = false;
            }
            html += '<td><input type="number" class="mark-input" data-exam="' + exam + '" data-student="' + student.id + '" data-subject="' + subject + '" value="' + value + '" min="0" max="' + limits.full + '" onchange="autoSaveMark(this)"></td>';
        }
        var result = total > 0 ? (allPass ? '<span class="pass">✅ PASS</span>' : '<span class="fail">❌ FAIL</span>') : '-';
        html += '<td class="total-row">' + total + '</td><td>' + result + '</td></tr>';
    }

    html += '</tbody></table></div><div style="font-size:10px;color:var(--text-secondary);margin-top:8px;">Full Marks: ' + limits.full + ' | Pass Marks: ' + limits.pass + ' | Changes save automatically' +
        (MarkPermissions[exam] && MarkPermissions[exam].deadline ? ' | 📅 Deadline: ' + MarkPermissions[exam].deadline : '') +
        '</div>';
    container.innerHTML = html;
}

function autoSaveMark(input) {
    var cls = document.getElementById('markClass').value;
    var sec = document.getElementById('markSection').value;
    var classSection = cls + ' - ' + sec;
    var exam = input.dataset.exam;

    var permission = canEnterMarks(exam, classSection);
    if (!permission.allowed) {
        showToast('❌ ' + permission.reason, 'error');
        loadMarkSheet();
        return;
    }
    if (State.currentUser && State.currentUser.type === 'student') {
        showToast('❌ Students cannot enter marks.', 'error');
        return;
    }

    var studentId = parseInt(input.dataset.student);
    var subject = input.dataset.subject;
    var limits = getMarkLimits(exam);

    var value = parseInt(input.value);
    if (isNaN(value) || value < 0) value = 0;
    if (value > limits.full) value = limits.full;

    var key = exam + '_' + studentId;
    if (!State.marksData[key]) State.marksData[key] = {};
    State.marksData[key][subject] = value;
    Storage.set('sfaMarks', State.marksData);
    input.style.borderColor = '#22C55E';
    setTimeout(function() { input.style.borderColor = ''; }, 1000);
}

// ================================================================
// MARK VIEW
// ================================================================

function loadMarkSheetView() {
    var exam = document.getElementById('viewExamType').value;
    var cls = document.getElementById('viewMarkClass').value;
    var sec = document.getElementById('viewMarkSection').value;
    var container = document.getElementById('markSheetViewContainer');

    if (!exam || !cls || !sec) { container.innerHTML = ''; return; }

    if (State.currentUser && State.currentUser.type === 'student') {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-lock fa-3x"></i><p>Go to "My Mark Sheet" to view your marks.</p></div>';
        return;
    }
    if (State.currentUser && State.currentUser.type === 'accountant') {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-lock fa-3x"></i><p>Access Denied</p></div>';
        return;
    }
    if (State.currentUser && State.currentUser.type === 'teacher') {
        var teacher = null;
        for (var i = 0; i < State.teachers.length; i++) {
            if (State.teachers[i].id === State.currentUser.id) { teacher = State.teachers[i]; break; }
        }
        var assignedClass = (teacher && teacher.classTeacher) || '';
        if (assignedClass !== cls + ' - ' + sec) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-lock fa-3x"></i><p>You can only view marks for your own class: <strong>' + (assignedClass || 'None') + '</strong></p></div>';
            return;
        }
    }

    var students = State.students.filter(function(s) { return s.class === cls && s.section === sec; });
    if (!students.length) {
        container.innerHTML = '<p style="text-align:center;padding:20px;">No students found</p>';
        return;
    }

    var limits = getMarkLimits(exam);
    var subjects = getSubjects();
    var perm = MarkPermissions[exam];

    var html =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">' +
        '<span style="font-size:12px;color:var(--text-secondary);">Full Marks: ' + limits.full + ' | Pass Marks: ' + limits.pass +
        (perm && perm.deadline ? ' | Deadline: ' + perm.deadline : '') +
        '</span>' +
        '<span class="status-badge ' + (perm && perm.published ? 'published' : perm && perm.approved ? 'approved' : perm && perm.locked ? 'locked' : 'open') + '">' +
        (perm && perm.published ? '📊 Published' : perm && perm.approved ? '✅ Approved' : perm && perm.locked ? '🔒 Locked' : '🔓 Open') +
        '</span></div>' +
        '<div style="overflow-x:auto;"><table class="mark-sheet-table"><thead><tr><th>Adm No.</th><th>Student Name</th>';
    for (var s = 0; s < subjects.length; s++) html += '<th>' + subjects[s] + '</th>';
    html += '<th>Total</th><th>%</th><th>Result</th></tr></thead><tbody>';

    for (var i = 0; i < students.length; i++) {
        var student = students[i];
        var existing = State.marksData[exam + '_' + student.id] || {};
        var total = 0, allPass = true;
        html += '<tr><td>' + escapeHtml(student.admissionNo) + '</td><td class="subject-col">' + escapeHtml(student.name) + '</td>';
        for (var j = 0; j < subjects.length; j++) {
            var subject = subjects[j];
            var value = parseInt(existing[subject]) || 0;
            total += value;
            if (value < limits.pass) allPass = false;
            html += '<td>' + value + '</td>';
        }
        var maxTotal = limits.full * subjects.length;
        var percent = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
        html += '<td class="total-row">' + total + '/' + maxTotal + '</td><td>' + percent + '%</td><td>' + (allPass ? '<span class="pass">✅ PASS</span>' : '<span class="fail">❌ FAIL</span>') + '</td></tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ================================================================
// STUDENT MARKS
// ================================================================

function loadStudentMarks() {
    var container = document.getElementById('studentMarksContainer');
    if (!container) return;
    if (!State.currentUser || !State.currentUser.id) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Please login first.</p>';
        return;
    }

    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === State.currentUser.id) { student = State.students[i]; break; }
    }
    if (!student) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Student data not found.</p>';
        return;
    }

    var attendance = getStudentAttendance(student.id);
    var attStatus = getAttendanceStatus(attendance.percentage);

    var exams = [
        { key: 'ut1', name: '1st Unit Test', icon: '📝' },
        { key: 'ut2', name: '2nd Unit Test', icon: '📝' },
        { key: 'hy', name: 'Half Yearly', icon: '📊' },
        { key: 'an', name: '📌 Annual Exam', icon: '🎓' }
    ];

    var examData = [];
    for (var e = 0; e < exams.length; e++) {
        var exam = exams[e];
        var data = State.marksData[exam.key + '_' + student.id] || {};
        var limits = getMarkLimits(exam.key);
        var subjects = getSubjects();
        var total = 0, maxTotal = limits.full * subjects.length, allPass = true, hasMarks = false;
        var subjectMarks = [];
        for (var s = 0; s < subjects.length; s++) {
            var subject = subjects[s];
            var value = parseInt(data[subject]) || 0;
            if (value > 0) hasMarks = true;
            total += value;
            if (value < limits.pass && value > 0) allPass = false;
            subjectMarks.push({ name: subject, obtained: value, max: limits.full, passed: value >= limits.pass && value > 0 });
        }
        var percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
        var passed = hasMarks ? allPass : null;
        var perm = MarkPermissions[exam.key];
        var grade = getGrade(percentage);
        examData.push({
            key: exam.key,
            name: exam.name,
            icon: exam.icon,
            total: total,
            maxTotal: maxTotal,
            percentage: percentage,
            passed: passed,
            hasMarks: hasMarks,
            limits: limits,
            subjects: subjectMarks,
            grade: grade,
            status: perm && perm.published ? 'Published' : perm && perm.approved ? 'Approved' : perm && perm.locked ? 'Locked' : 'Open'
        });
    }

    var totalOverall = 0, maxOverall = 0;
    for (var d = 0; d < examData.length; d++) {
        totalOverall += examData[d].total;
        maxOverall += examData[d].maxTotal;
    }
    var overallPercentage = maxOverall > 0 ? Math.round((totalOverall / maxOverall) * 100) : 0;
    var overallGrade = getGrade(overallPercentage);
    var passedExams = 0, totalExams = 0;
    for (var p = 0; p < examData.length; p++) {
        if (examData[p].passed === true) passedExams++;
        if (examData[p].hasMarks) totalExams++;
    }

    var html =
        '<div class="marksheet-container">' +
        '<div style="text-align:center;padding:16px;border-bottom:2px solid var(--border);margin-bottom:16px;">' +
        '<div style="font-size:32px;">✝️</div>' +
        '<h1 style="font-family:var(--font-display);">St. Francis of Assisi School</h1>' +
        '<p style="color:var(--text-secondary);font-style:italic;">"Pax et Bonum" - Peace and Goodness</p>' +
        '<div style="font-size:12px;color:var(--text-secondary);">📅 Academic Year 2026-2027</div></div>' +

        '<div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--bg);border-radius:var(--radius-lg);border:1px solid var(--border);margin-bottom:16px;">' +
        (student.photo ? '<div style="width:64px;height:64px;border-radius:50%;background-size:cover;background-position:center;background-image:url(' + student.photo + ');flex-shrink:0;"></div>' :
            '<div style="width:64px;height:64px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:var(--primary);flex-shrink:0;">' + escapeHtml(student.name.charAt(0)) + '</div>') +
        '<div style="flex:1;">' +
        '<h3 style="font-family:var(--font-display);">' + escapeHtml(student.name) + '</h3>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-secondary);">' +
        '<span>📋 ' + escapeHtml(student.admissionNo) + '</span>' +
        '<span>📚 ' + escapeHtml(student.class) + ' - Section ' + escapeHtml(student.section) + '</span>' +
        '<span>👨‍👦 ' + escapeHtml(student.fatherName || 'N/A') + '</span>' +
        '<span>📅 ' + escapeHtml(student.dob) + '</span>' +
        '</div></div>' +
        '<div style="text-align:center;flex-shrink:0;"><div style="font-size:24px;font-weight:800;color:#F59E0B;">' + overallGrade.grade + '</div><div style="font-size:11px;color:var(--text-secondary);">Overall Grade</div></div>' +
        '</div>' +

        '<div style="background:var(--bg);border-radius:var(--radius-lg);padding:16px;margin-bottom:20px;border:1px solid var(--border);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:20px;">' + attStatus.icon + '</span>' +
        '<div><div style="font-weight:700;">Attendance: ' + attendance.percentage + '%</div><div style="font-size:11px;color:var(--text-secondary);">' + attStatus.label + '</div></div></div>' +
        '<div style="display:flex;gap:16px;">' +
        '<div><span style="color:#22C55E;font-weight:700;">✅ ' + attendance.present + '</span> <span style="font-size:11px;color:var(--text-secondary);">Present</span></div>' +
        '<div><span style="color:#EF4444;font-weight:700;">❌ ' + attendance.absent + '</span> <span style="font-size:11px;color:var(--text-secondary);">Absent</span></div>' +
        '<div><span style="color:#B45309;font-weight:700;">📝 ' + attendance.leave + '</span> <span style="font-size:11px;color:var(--text-secondary);">Leave</span></div>' +
        '<div><span style="color:#8B5CF6;font-weight:700;">📅 ' + attendance.total + '</span> <span style="font-size:11px;color:var(--text-secondary);">Total</span></div>' +
        '</div></div></div>' +

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;">';

    for (var e2 = 0; e2 < examData.length; e2++) {
        var ex = examData[e2];
        var cardCls = ex.hasMarks ? getExamCardClass(ex.percentage) : '';
        var statusText = !ex.hasMarks ? 'Pending' : ex.passed ? '✅ PASS' : '❌ FAIL';
        var statusCls = !ex.hasMarks ? 'pending' : ex.passed ? 'pass' : 'fail';
        var isLocked = ex.status === 'Locked' || ex.status === 'Published';
        html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:16px;border:1px solid var(--border);text-align:center;' +
            (cardCls === 'excellent' ? 'border-top:4px solid #22C55E;' : cardCls === 'good' ? 'border-top:4px solid #3B82F6;' : cardCls === 'average' ? 'border-top:4px solid #F59E0B;' : cardCls === 'below' ? 'border-top:4px solid #F97316;' : cardCls === 'poor' ? 'border-top:4px solid #DC2626;' : '') +
            (isLocked ? 'opacity:0.8;' : '') +
            '">' +
            '<div style="font-size:13px;font-weight:600;color:var(--text-secondary);">' + ex.icon + ' ' + ex.name + '</div>' +
            '<div style="font-size:22px;font-weight:800;margin:6px 0;">' + (ex.hasMarks ? ex.total + '/' + ex.maxTotal : '-') + '</div>' +
            '<div style="font-size:16px;font-weight:700;' + (ex.hasMarks ? (ex.percentage >= 90 ? 'color:#22C55E;' : ex.percentage >= 75 ? 'color:#3B82F6;' : ex.percentage >= 60 ? 'color:#F59E0B;' : 'color:#DC2626;') : 'color:var(--text-secondary);') + '">' + (ex.hasMarks ? ex.percentage + '%' : 'Not Available') + '</div>' +
            '<div style="margin-top:8px;"><span class="badge ' + (statusCls === 'pass' ? 'badge-success' : statusCls === 'fail' ? 'badge-danger' : 'badge-warning') + '">' + statusText + '</span></div>' +
            (ex.hasMarks ? '<div style="margin-top:4px;font-size:20px;font-weight:800;color:#F59E0B;">' + ex.grade.grade + '</div>' : '') +
            (isLocked ? '<div style="font-size:10px;color:var(--text-secondary);margin-top:4px;">🔒 ' + ex.status + '</div>' : '') +
            '</div>';
    }

    html +=
        '</div>' +

        '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:16px;border:1px solid var(--border);margin-bottom:20px;">' +
        '<h3 style="font-family:var(--font-display);font-size:15px;margin-bottom:12px;">📈 Performance Trend</h3>' +
        '<div id="studentTrendChart" style="height:250px;"></div></div>' +

        '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:16px;border:1px solid var(--border);margin-bottom:20px;">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">';

    for (var t = 0; t < examData.length; t++) {
        var ex2 = examData[t];
        html += '<button class="btn ' + (t === 0 ? 'btn-primary' : 'btn-outline') + ' btn-sm exam-tab-btn" data-exam="' + ex2.key + '" onclick="switchExamTab2(\'' + ex2.key + '\')">' + ex2.icon + ' ' + ex2.name + '</button>';
    }

    html += '</div>';

    for (var u = 0; u < examData.length; u++) {
        var ex3 = examData[u];
        var display = u === 0 ? 'block' : 'none';
        html += '<div id="examTabContent_' + ex3.key + '" style="display:' + display + ';">';
        if (ex3.hasMarks) {
            html += '<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#1E3A5F;color:white;"><th style="padding:6px 8px;">Subject</th><th style="padding:6px 8px;">Marks</th><th style="padding:6px 8px;">%</th><th style="padding:6px 8px;">Status</th><th style="padding:6px 8px;">Progress</th></tr></thead><tbody>';
            for (var v = 0; v < ex3.subjects.length; v++) {
                var sub = ex3.subjects[v];
                var pct = sub.max > 0 ? Math.round((sub.obtained / sub.max) * 100) : 0;
                var passCls = sub.obtained > 0 ? (sub.passed ? 'pass' : 'fail') : '';
                html += '<tr style="border-bottom:1px solid var(--border);">' +
                    '<td style="padding:6px 8px;font-weight:600;">' + escapeHtml(sub.name) + '</td>' +
                    '<td style="padding:6px 8px;">' + sub.obtained + '/' + sub.max + '</td>' +
                    '<td style="padding:6px 8px;">' + pct + '%</td>' +
                    '<td style="padding:6px 8px;">' + (sub.obtained > 0 ? (sub.passed ? '<span style="color:#22C55E;font-weight:700;">✅ Pass</span>' : '<span style="color:#DC2626;font-weight:700;">❌ Fail</span>') : '-') + '</td>' +
                    '<td style="padding:6px 8px;"><div style="width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:' + (sub.passed ? '#22C55E' : '#EF4444') + ';border-radius:3px;transition:width 0.6s ease;"></div></div></td>' +
                    '</tr>';
            }
            html += '<tr style="background:#FEF3C7;font-weight:700;"><td style="padding:6px 8px;">TOTAL</td><td style="padding:6px 8px;">' + ex3.total + '/' + ex3.maxTotal + '</td><td style="padding:6px 8px;">' + ex3.percentage + '%</td><td style="padding:6px 8px;">' + (ex3.passed ? '<span style="color:#22C55E;">✅ PASS</span>' : '<span style="color:#DC2626;">❌ FAIL</span>') + '</td><td style="padding:6px 8px;"><div style="width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden;"><div style="width:' + ex3.percentage + '%;height:100%;background:#F59E0B;border-radius:3px;transition:width 0.6s ease;"></div></div></td></tr>';
            html += '</tbody></table>';
            if (ex3.status !== 'Open') {
                html += '<div style="text-align:center;font-size:10px;color:var(--text-secondary);margin-top:8px;">🔒 Status: ' + ex3.status + '</div>';
            }
        } else {
            html += '<p style="text-align:center;padding:30px;color:var(--text-secondary);">No marks entered for ' + ex3.name + ' yet.</p>';
        }
        html += '</div>';
    }

    html +=
        '</div>' +

        '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:16px;border:1px solid var(--border);margin-bottom:20px;">' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">' +
        '<div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#3B82F6;">' + overallPercentage + '%</div><div style="font-size:11px;color:var(--text-secondary);">Overall Score</div></div>' +
        '<div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#F59E0B;">' + overallGrade.grade + '</div><div style="font-size:11px;color:var(--text-secondary);">Grade</div></div>' +
        '<div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#22C55E;">' + passedExams + '/' + totalExams + '</div><div style="font-size:11px;color:var(--text-secondary);">Exams Passed</div></div>' +
        '<div style="text-align:center;"><div style="font-size:28px;font-weight:800;color:#8B5CF6;">' + examData.filter(function(x) { return x.percentage >= 90; }).length + '</div><div style="font-size:11px;color:var(--text-secondary);">Excellence (90%+)</div></div>' +
        '</div>' +
        '<div style="margin-bottom:8px;display:flex;justify-content:space-between;"><span>Performance</span><span>' + overallPercentage + '%</span></div>' +
        '<div style="width:100%;height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="width:' + overallPercentage + '%;height:100%;background:linear-gradient(90deg,#22C55E,#F59E0B);border-radius:4px;transition:width 0.6s ease;"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-top:4px;"><span>0%</span><span>50%</span><span>100%</span></div>' +
        '<div style="text-align:center;margin-top:12px;"><span style="display:inline-block;padding:6px 20px;background:#F59E0B;color:white;border-radius:20px;font-weight:700;">' + overallGrade.grade + '</span><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">' + overallGrade.label + '</div></div></div>' +

        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">' +
        '<button class="btn btn-primary" onclick="printMarkSheet()"><i class="fas fa-print"></i> 🖨️ Print Mark Sheet</button>' +
        '<button class="btn btn-gold" onclick="window.print()"><i class="fas fa-download"></i> 📥 Print as PDF</button>' +
        '<button class="btn btn-outline" onclick="shareMarkSheet()"><i class="fas fa-share"></i> 📤 Share</button>' +
        '</div>' +

        '<div style="text-align:center;font-size:10px;color:var(--text-secondary);margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">' +
        '📅 Generated on: ' + new Date().toLocaleDateString() + ' | St. Francis of Assisi School Management System</div></div>';

    container.innerHTML = html;
    setTimeout(function() { renderStudentTrendChart(examData); }, 100);
}

function getGrade(percentage) {
    if (percentage >= 90) return { grade: 'A+', label: 'Excellent', color: '#16A34A' };
    if (percentage >= 80) return { grade: 'A', label: 'Very Good', color: '#22C55E' };
    if (percentage >= 70) return { grade: 'B+', label: 'Good', color: '#3B82F6' };
    if (percentage >= 60) return { grade: 'B', label: 'Average', color: '#F59E0B' };
    if (percentage >= 50) return { grade: 'C', label: 'Below Average', color: '#F97316' };
    return { grade: 'F', label: 'Needs Improvement', color: '#DC2626' };
}

function getExamCardClass(percentage) {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    if (percentage >= 40) return 'below';
    return 'poor';
}

function switchExamTab2(examKey) {
    var tabs = document.querySelectorAll('.exam-tab-btn');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(/btn-primary/g, 'btn-outline');
        if (tabs[i].dataset.exam === examKey) {
            tabs[i].classList.remove('btn-outline');
            tabs[i].classList.add('btn-primary');
        }
    }
    var contents = document.querySelectorAll('[id^="examTabContent_"]');
    for (var j = 0; j < contents.length; j++) {
        contents[j].style.display = contents[j].id === 'examTabContent_' + examKey ? 'block' : 'none';
    }
}

function renderStudentTrendChart(examData) {
    var chartContainer = document.getElementById('studentTrendChart');
    if (!chartContainer) return;

    var hasMarks = false;
    for (var i = 0; i < examData.length; i++) {
        if (examData[i].hasMarks) { hasMarks = true; break; }
    }
    if (!hasMarks) {
        chartContainer.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);">No marks available to display chart</p>';
        return;
    }

    var labels = [];
    var percentages = [];
    for (var j = 0; j < examData.length; j++) {
        var parts = examData[j].name.split(' ');
        labels.push(parts.slice(0, 2).join(' '));
        percentages.push(examData[j].hasMarks ? examData[j].percentage : null);
    }

    if (typeof ApexCharts === 'undefined') {
        chartContainer.innerHTML = '<p style="text-align:center;padding:20px;">Chart library not loaded</p>';
        return;
    }
    if (chartContainer._chart) chartContainer._chart.destroy();

    try {
        var chart = new ApexCharts(chartContainer, {
            series: [{ name: 'Percentage', data: percentages, type: 'line' }],
            chart: { height: 250, type: 'line', toolbar: { show: false }, animations: { enabled: true } },
            stroke: { curve: 'smooth', width: 3, colors: ['#3B82F6'] },
            fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, opacityFrom: 0.7, opacityTo: 0.1 } },
            markers: { size: 8, colors: ['#3B82F6'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 10 } },
            grid: { borderColor: 'var(--border)', row: { colors: ['transparent'] } },
            xaxis: { categories: labels, labels: { style: { fontSize: '11px', fontWeight: 600 } } },
            yaxis: { min: 0, max: 100, labels: { formatter: function(value) { return value + '%'; } } },
            dataLabels: { enabled: true, formatter: function(value) { return value !== null ? value + '%' : 'N/A'; }, style: { fontSize: '11px', fontWeight: 600 } },
            colors: ['#3B82F6'],
            theme: { mode: document.documentElement.getAttribute('data-theme') || 'light' }
        });
        chart.render();
        chartContainer._chart = chart;
    } catch (e) {
        chartContainer.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">Chart could not be rendered.</p>';
        console.error('Chart error:', e);
    }
}

function printMarkSheet() {
    var container = document.querySelector('.marksheet-container');
    if (!container) return;
    var printWindow = window.open('', '_blank', 'width=800,height=600');
    var content = container.outerHTML;
    printWindow.document.write(
        '<!DOCTYPE html><html><head><title>Mark Sheet - ' + escapeHtml(State.currentUser.name) + '</title>' +
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />' +
        '<style>body{font-family:"Inter",sans-serif;padding:20px;background:white;}.marksheet-container{max-width:1000px;margin:0 auto;}.exam-tab-btn,.btn,.marksheet-actions{display:none!important;}.exam-card:hover{transform:none!important;box-shadow:none!important;}@media print{body{padding:0;}}</style></head><body>' +
        content + '<script>window.onload=function(){window.print();}<\/script></body></html>'
    );
    printWindow.document.close();
}

function shareMarkSheet() {
    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === State.currentUser.id) { student = State.students[i]; break; }
    }
    if (!student) return;
    var overallEl = document.querySelector('.marksheet-container .stat-number');
    var gradeEl = document.querySelector('.marksheet-container .grade-badge, .marksheet-container .preview-grade');
    var shareText =
        '📊 Student Progress Report\n' +
        '🏫 St. Francis of Assisi School\n' +
        '👤 ' + student.name + ' (' + student.admissionNo + ')\n' +
        '📚 ' + student.class + ' - Section ' + student.section + '\n' +
        'Overall Performance: ' + (overallEl ? overallEl.textContent : 'N/A') + '\n' +
        'Grade: ' + (gradeEl ? gradeEl.textContent : 'N/A') + '\n' +
        'Generated on: ' + new Date().toLocaleDateString();
    if (navigator.share) {
        navigator.share({ title: 'Student Mark Sheet', text: shareText }).catch(function() {});
    } else {
        navigator.clipboard.writeText(shareText).then(function() {
            showToast('📋 Mark sheet summary copied to clipboard!', 'success');
        }).catch(function() {
            showToast('Please copy the mark sheet manually.', 'info');
        });
    }
}

// ================================================================
// TEACHER HOMEWORK
// ================================================================

function loadTeacherHomework() {
    var teacherId = State.currentUser.id;
    var homework = State.homework.filter(function(h) { return h.teacherId === teacherId; });

    var total = homework.length;
    var active = 0, completed = 0, views = 0;
    for (var i = 0; i < homework.length; i++) {
        if (homework[i].status === 'Active') active++;
        else if (homework[i].status === 'Completed') completed++;
        views += (homework[i].views || 0);
    }

    document.getElementById('thTotal').textContent = total;
    document.getElementById('thActive').textContent = active;
    document.getElementById('thCompleted').textContent = completed;
    document.getElementById('thViews').textContent = views;

    var list = document.getElementById('teacherHomeworkList');
    if (!homework.length) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-book fa-3x" style="margin-bottom:12px;display:block;opacity:0.3;"></i>No homework assigned yet.<br><small>Click "New Homework" to create your first assignment.</small></div>';
        return;
    }

    homework.sort(function(a, b) { return new Date(b.createdDate) - new Date(a.createdDate); });
    var html = '';
    for (var j = 0; j < homework.length; j++) {
        var h = homework[j];
        html += '<div class="homework-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">' +
            '<div>' +
            '<div style="font-size:16px;font-weight:700;">' + escapeHtml(h.title) + '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text-secondary);margin-top:4px;">' +
            '<span>📖 ' + escapeHtml(h.subject) + '</span>' +
            '<span>📚 ' + escapeHtml(h.class) + ' - ' + escapeHtml(h.section) + '</span>' +
            '<span>📅 Due: ' + escapeHtml(h.dueDate) + '</span>' +
            '<span class="hw-priority ' + escapeHtml(h.priority.toLowerCase()) + '">' + escapeHtml(h.priority) + '</span>' +
            '<span class="hw-status ' + escapeHtml(h.status.toLowerCase()) + '">' + escapeHtml(h.status) + '</span>' +
            '<span>👁️ ' + (h.views || 0) + ' views</span>' +
            '</div></div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn btn-outline btn-sm" onclick="viewHomework(' + h.id + ')">👁️ View</button>' +
            '<button class="btn btn-outline btn-sm" onclick="editHomework(' + h.id + ')">✏️ Edit</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteHomework(' + h.id + ')">🗑️</button>' +
            '</div></div>' +
            '<div style="font-size:13px;color:var(--text-secondary);margin-top:8px;">' + escapeHtml(h.description) + '</div></div>';
    }
    list.innerHTML = html;
}

function showCreateHomework() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'homeworkModal';
    modal.innerHTML =
        '<div class="modal-content">' +
        '<div class="modal-header"><h2>✏️ Create New Homework</h2><button class="close-btn" onclick="closeModal(\'homeworkModal\')">✕</button></div>' +
        '<form id="homeworkForm" onsubmit="saveHomework(event)">' +
        '<input type="hidden" id="hwId" value="" />' +
        '<div class="form-section"><h3 class="form-section-title">📖 Basic Information</h3>' +
        '<div class="form-grid">' +
        '<div class="form-group"><label>Title *</label><input type="text" class="form-input" id="hwTitle" required /></div>' +
        '<div class="form-group"><label>Subject *</label><input type="text" class="form-input" id="hwSubject" required /></div>' +
        '<div class="form-group"><label>Class *</label><select class="form-input" id="hwClass" required><option value="">Select</option>' +
        CLASS_LIST.map(function(c) { return '<option>' + c + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-group"><label>Section *</label><select class="form-input" id="hwSection" required><option value="">Select</option><option>A</option><option>B</option></select></div>' +
        '</div>' +
        '<div class="form-group"><label>Priority</label><div style="display:flex;gap:16px;margin-top:4px;">' +
        '<label><input type="radio" name="priority" value="High" checked /> 🔴 High</label>' +
        '<label><input type="radio" name="priority" value="Medium" /> 🟡 Medium</label>' +
        '<label><input type="radio" name="priority" value="Low" /> 🟢 Low</label></div></div></div>' +

        '<div class="form-section"><h3 class="form-section-title">📄 Details</h3>' +
        '<div class="form-group"><label>Description *</label><textarea class="form-input" id="hwDescription" rows="3" required></textarea></div>' +
        '<div class="form-group"><label>Instructions</label><textarea class="form-input" id="hwInstructions" rows="3"></textarea></div></div>' +

        '<div class="form-section"><h3 class="form-section-title">📎 Attachments</h3>' +
        '<div class="form-group"><label>Upload Files (JPG, PDF)</label><input type="file" class="form-input" id="hwFileInput" accept=".jpg,.jpeg,.pdf" multiple onchange="prependFilePreviews(this)" /></div>' +
        '<div id="hwAttachmentPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div>' +
        '<input type="hidden" id="hwAttachments" value="" /></div>' +

        '<div class="form-section"><h3 class="form-section-title">⏰ Schedule</h3>' +
        '<div class="form-group"><label>Due Date *</label><input type="date" class="form-input" id="hwDueDate" required /></div></div>' +

        '<div style="display:flex;gap:10px;margin-top:16px;">' +
        '<button type="submit" class="btn btn-primary">📤 Publish Homework</button>' +
        '<button type="button" class="btn btn-outline" onclick="closeModal(\'homeworkModal\')">Cancel</button></div></form></div>';
    document.body.appendChild(modal);
}

function saveHomework(event) {
    event.preventDefault();
    var id = document.getElementById('hwId').value;
    var teacherId = State.currentUser.id;
    var teacher = null;
    for (var i = 0; i < State.teachers.length; i++) {
        if (State.teachers[i].id === teacherId) { teacher = State.teachers[i]; break; }
    }
    var priorityEl = document.querySelector('input[name="priority"]:checked');
    var priority = priorityEl ? priorityEl.value : 'Medium';

    var attachments = [];
    try { attachments = JSON.parse(document.getElementById('hwAttachments').value || '[]'); } catch (e) {}

    var homeworkData = {
        teacherId: teacherId,
        teacherName: teacher ? teacher.name : State.currentUser.name,
        subject: document.getElementById('hwSubject').value,
        class: document.getElementById('hwClass').value,
        section: document.getElementById('hwSection').value,
        title: document.getElementById('hwTitle').value,
        description: document.getElementById('hwDescription').value,
        instructions: document.getElementById('hwInstructions').value,
        dueDate: document.getElementById('hwDueDate').value,
        priority: priority,
        status: 'Active',
        attachments: attachments,
        views: 0,
        createdDate: new Date().toISOString().split('T')[0]
    };

    if (id) {
        var found = false;
        for (var j = 0; j < State.homework.length; j++) {
            if (State.homework[j].id === parseInt(id)) {
                if (State.homework[j].teacherId !== teacherId) {
                    showToast('❌ You can only edit your own homework!', 'error');
                    return;
                }
                State.homework[j] = { id: State.homework[j].id, views: State.homework[j].views || 0, createdDate: State.homework[j].createdDate, ...homeworkData };
                found = true;
                break;
            }
        }
        if (!found) { showToast('❌ Homework not found.', 'error'); return; }
        showToast('✅ Homework updated successfully!', 'success');
    } else {
        homeworkData.id = Date.now();
        State.homework.push(homeworkData);
        showToast('✅ Homework published successfully!', 'success');
    }

    Storage.set('sfaHomework', State.homework);
    closeModal('homeworkModal');
    loadTeacherHomework();
}

function prependFilePreviews(input) {
    var preview = document.getElementById('hwAttachmentPreview');
    var hidden = document.getElementById('hwAttachments');
    var existing = [];
    try { existing = JSON.parse(hidden.value || '[]'); } catch (e) {}
    var rejected = false;
    var files = input.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.type.match(/image\/jpeg|application\/pdf/)) continue;
        if (file.size > 2 * 1024 * 1024) { rejected = true; continue; }
        var reader = new FileReader();
        reader.onload = (function(f) {
            return function(e) {
                var data = { name: f.name, data: e.target.result };
                var idx = existing.length;
                existing.push(data);
                hidden.value = JSON.stringify(existing);
                var ext = f.name.split('.').pop().toUpperCase();
                preview.innerHTML += '<div class="attachment-pill" data-idx="' + idx + '" onclick="openAttachmentPreview(this)">📎 <span class="attachment-name">' + escapeHtml(f.name) + '</span> <span style="font-size:10px;color:var(--text-secondary)">(' + escapeHtml(ext) + ')</span> <span onclick="event.stopPropagation();removeAttachment(this)" style="cursor:pointer;color:var(--danger);margin-left:4px;">✕</span></div>';
            };
        })(file);
        reader.readAsDataURL(file);
    }
    if (rejected) showToast('⚠️ Some files skipped (max 2MB, JPG/PDF only)', 'warning');
    input.value = '';
}

function openAttachmentPreview(el) {
    var idx = parseInt(el.dataset.idx);
    var hidden = document.getElementById('hwAttachments');
    var existing = [];
    try { existing = JSON.parse(hidden.value || '[]'); } catch (e) {}
    var f = existing[idx];
    if (f) window.open(f.data, '_blank');
}

function removeAttachment(el) {
    var pill = el.closest('.attachment-pill');
    if (!pill) return;
    var idx = parseInt(pill.dataset.idx);
    pill.remove();
    var hidden = document.getElementById('hwAttachments');
    var existing = [];
    try { existing = JSON.parse(hidden.value || '[]'); } catch (e) {}
    existing.splice(idx, 1);
    hidden.value = JSON.stringify(existing);
    var pills = document.querySelectorAll('#hwAttachmentPreview .attachment-pill');
    for (var i = 0; i < pills.length; i++) pills[i].dataset.idx = i;
}

function editHomework(id) {
    var homework = null;
    for (var i = 0; i < State.homework.length; i++) {
        if (State.homework[i].id === id) { homework = State.homework[i]; break; }
    }
    if (!homework) return;
    if (State.currentUser && State.currentUser.type === 'teacher' && homework.teacherId !== State.currentUser.id) {
        showToast('❌ You can only edit your own homework!', 'error');
        return;
    }
    showCreateHomework();
    document.getElementById('hwId').value = homework.id;
    document.getElementById('hwTitle').value = homework.title;
    document.getElementById('hwSubject').value = homework.subject;
    document.getElementById('hwClass').value = homework.class;
    document.getElementById('hwSection').value = homework.section;
    document.getElementById('hwDescription').value = homework.description;
    document.getElementById('hwInstructions').value = homework.instructions || '';
    document.getElementById('hwDueDate').value = homework.dueDate;
    var attachments = homework.attachments || [];
    document.getElementById('hwAttachments').value = JSON.stringify(attachments);
    var preview = document.getElementById('hwAttachmentPreview');
    var html = '';
    for (var j = 0; j < attachments.length; j++) {
        var f = attachments[j];
        var name = typeof f === 'object' ? f.name : f;
        var ext = name.split('.').pop().toUpperCase();
        html += '<div class="attachment-pill" data-idx="' + j + '" onclick="openAttachmentPreview(this)">📎 <span class="attachment-name">' + escapeHtml(name) + '</span> <span style="font-size:10px;color:var(--text-secondary)">(' + escapeHtml(ext) + ')</span> <span onclick="event.stopPropagation();removeAttachment(this)" style="cursor:pointer;color:var(--danger);margin-left:4px;">✕</span></div>';
    }
    preview.innerHTML = html;
    var priorityRadios = document.querySelectorAll('input[name="priority"]');
    for (var r = 0; r < priorityRadios.length; r++) {
        if (priorityRadios[r].value === homework.priority) priorityRadios[r].checked = true;
    }
    document.querySelector('#homeworkModal .modal-header h2').textContent = '✏️ Edit Homework';
}

function deleteHomework(id) {
    var hw = null;
    for (var i = 0; i < State.homework.length; i++) {
        if (State.homework[i].id === id) { hw = State.homework[i]; break; }
    }
    if (State.currentUser && State.currentUser.type === 'teacher' && hw && hw.teacherId !== State.currentUser.id) {
        showToast('❌ You can only delete your own homework!', 'error');
        return;
    }
    if (!confirm('Are you sure you want to delete this homework?')) return;
    State.homework = State.homework.filter(function(h) { return h.id !== id; });
    Storage.set('sfaHomework', State.homework);
    loadTeacherHomework();
    showToast('🗑️ Homework deleted', 'warning');
}

function viewHomework(id) {
    var homework = null;
    for (var i = 0; i < State.homework.length; i++) {
        if (State.homework[i].id === id) { homework = State.homework[i]; break; }
    }
    if (!homework) return;

    if (State.currentUser && State.currentUser.type === 'teacher' && homework.teacherId !== State.currentUser.id) {
        showToast('❌ You can only view your own homework!', 'error');
        return;
    }

    if (State.currentUser && State.currentUser.type === 'student') {
        var studentId = State.currentUser.id;
        var viewRecord = { homeworkId: id, studentId: studentId, viewedDate: new Date().toISOString().split('T')[0] };
        State.homeworkViews.push(viewRecord);
        Storage.set('sfaHomeworkViews', State.homeworkViews);
        homework.views = (homework.views || 0) + 1;
        Storage.set('sfaHomework', State.homework);
    }

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'viewHomeworkModal';

    var attachmentsHtml = '';
    if (homework.attachments && homework.attachments.length) {
        attachmentsHtml = '<div class="form-section"><h3 class="form-section-title">📎 Attachments</h3><div style="display:flex;flex-direction:column;gap:4px;">';
        for (var a = 0; a < homework.attachments.length; a++) {
            var f = homework.attachments[a];
            var isDataUrl = typeof f === 'object' && f.data;
            var name = isDataUrl ? f.name : f;
            var url = isDataUrl ? f.data : f;
            var ext = name.split('.').pop().toUpperCase();
            attachmentsHtml += '<div>📄 <a href="' + url + '" target="_blank" rel="noopener" download="' + escapeHtml(name) + '">' + escapeHtml(name) + ' (' + escapeHtml(ext) + ')</a></div>';
        }
        attachmentsHtml += '</div></div>';
    }

    modal.innerHTML =
        '<div class="modal-content">' +
        '<div class="modal-header"><h2>📖 ' + escapeHtml(homework.title) + '</h2><button class="close-btn" onclick="closeModal(\'viewHomeworkModal\')">✕</button></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border);margin-bottom:12px;">' +
        '<div><span style="color:var(--text-secondary);">Subject:</span> ' + escapeHtml(homework.subject) + '</div>' +
        '<div><span style="color:var(--text-secondary);">Class:</span> ' + escapeHtml(homework.class) + ' - ' + escapeHtml(homework.section) + '</div>' +
        '<div><span style="color:var(--text-secondary);">Teacher:</span> ' + escapeHtml(homework.teacherName) + '</div>' +
        '<div><span style="color:var(--text-secondary);">Priority:</span> <span class="hw-priority ' + escapeHtml(homework.priority.toLowerCase()) + '">' + escapeHtml(homework.priority) + '</span></div>' +
        '<div><span style="color:var(--text-secondary);">Status:</span> <span class="hw-status ' + escapeHtml(homework.status.toLowerCase()) + '">' + escapeHtml(homework.status) + '</span></div>' +
        '<div><span style="color:var(--text-secondary);">Due Date:</span> ' + escapeHtml(homework.dueDate) + '</div>' +
        '<div><span style="color:var(--text-secondary);">Created:</span> ' + escapeHtml(homework.createdDate) + '</div>' +
        '<div><span style="color:var(--text-secondary);">Views:</span> ' + (homework.views || 0) + '</div></div>' +
        '<div class="form-section"><h3 class="form-section-title">📄 Description</h3><p>' + escapeHtml(homework.description) + '</p></div>' +
        (homework.instructions ? '<div class="form-section"><h3 class="form-section-title">📌 Instructions</h3><p style="white-space:pre-wrap;">' + escapeHtml(homework.instructions) + '</p></div>' : '') +
        attachmentsHtml +
        '<div style="margin-top:16px;display:flex;gap:8px;">' +
        '<button class="btn btn-outline btn-sm" onclick="closeModal(\'viewHomeworkModal\')">Close</button>' +
        (State.currentUser && State.currentUser.type === 'teacher' ? '<button class="btn btn-outline btn-sm" onclick="closeModal(\'viewHomeworkModal\');editHomework(' + homework.id + ')">✏️ Edit</button>' : '') +
        '</div></div>';
    document.body.appendChild(modal);
}

// ================================================================
// STUDENT HOMEWORK
// ================================================================

function loadStudentHomework() {
    var student = null;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].id === State.currentUser.id) { student = State.students[i]; break; }
    }
    if (!student) return;

    var homework = State.homework.filter(function(h) {
        return h.class === student.class && h.section === student.section && h.status === 'Active';
    });

    var viewedIds = [];
    for (var v = 0; v < State.homeworkViews.length; v++) {
        if (State.homeworkViews[v].studentId === student.id) {
            viewedIds.push(State.homeworkViews[v].homeworkId);
        }
    }

    var total = homework.length;
    var active = 0, completed = 0, overdue = 0;
    var now = new Date();
    for (var h = 0; h < homework.length; h++) {
        if (homework[h].status === 'Active') active++;
        else if (homework[h].status === 'Completed') completed++;
        if (new Date(homework[h].dueDate) < now && homework[h].status === 'Active') overdue++;
    }

    document.getElementById('shTotal').textContent = total;
    document.getElementById('shActive').textContent = active;
    document.getElementById('shCompleted').textContent = completed;
    document.getElementById('shOverdue').textContent = overdue;

    var list = document.getElementById('studentHomeworkList');
    if (!homework.length) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-book fa-3x" style="margin-bottom:12px;display:block;opacity:0.3;"></i>No homework assigned yet.<br><small>Check back later for new assignments.</small></div>';
        return;
    }

    homework.sort(function(a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
    var html = '';
    for (var k = 0; k < homework.length; k++) {
        var hw = homework[k];
        var viewed = viewedIds.indexOf(hw.id) !== -1;
        var isOverdue = new Date(hw.dueDate) < new Date();
        var daysLeft = Math.ceil((new Date(hw.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        html += '<div class="homework-card" style="' + (isOverdue ? 'border-left:4px solid #EF4444;' : '') + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">' +
            '<div>' +
            '<div style="font-size:16px;font-weight:700;">' + escapeHtml(hw.title) + (viewed ? ' 👁️' : ' 🆕') + '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text-secondary);margin-top:4px;">' +
            '<span>📖 ' + escapeHtml(hw.subject) + '</span>' +
            '<span>👨‍🏫 ' + escapeHtml(hw.teacherName) + '</span>' +
            '<span class="hw-priority ' + escapeHtml(hw.priority.toLowerCase()) + '">' + escapeHtml(hw.priority) + '</span>' +
            (isOverdue ? '<span style="color:#EF4444;font-weight:600;">🔴 OVERDUE</span>' : '<span>⏰ ' + daysLeft + ' days left</span>') +
            '</div></div>' +
            '<button class="btn btn-primary btn-sm" onclick="viewHomework(' + hw.id + ')">👁️ View Details</button></div>' +
            '<div style="font-size:13px;color:var(--text-secondary);margin-top:8px;">' + escapeHtml(hw.description.substring(0, 100)) + (hw.description.length > 100 ? '...' : '') + '</div></div>';
    }
    list.innerHTML = html;
}

// ================================================================
// PRINCIPAL PERFORMANCE
// ================================================================

function loadPrincipalPerformance() {
    var teachers = State.teachers;
    var homework = State.homework;

    var performanceData = [];
    for (var i = 0; i < teachers.length; i++) {
        var t = teachers[i];
        var teacherHomework = homework.filter(function(h) { return h.teacherId === t.id; });
        var totalHomework = teacherHomework.length;
        var activeHomework = 0, completedHomework = 0, totalViews = 0;
        for (var h = 0; h < teacherHomework.length; h++) {
            if (teacherHomework[h].status === 'Active') activeHomework++;
            else if (teacherHomework[h].status === 'Completed') completedHomework++;
            totalViews += (teacherHomework[h].views || 0);
        }
        var studentCount = 1;
        if (t.classTeacher) {
            var parts = t.classTeacher.split(' - ');
            var cls = parts[0] || '';
            var sec = parts[1] || '';
            var cnt = 0;
            for (var s = 0; s < State.students.length; s++) {
                if (State.students[s].class === cls && State.students[s].section === sec) cnt++;
            }
            if (cnt > 0) studentCount = cnt;
        }
        var engagementRate = totalHomework > 0 ? Math.min(100, Math.round((totalViews / (totalHomework * studentCount)) * 100)) : 0;
        var timeliness = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;
        var performanceScore = Math.round((engagementRate * 0.6) + (timeliness * 0.4));
        performanceData.push({
            id: t.id,
            name: t.name,
            subject: t.subject,
            classTeacher: t.classTeacher,
            totalHomework: totalHomework,
            activeHomework: activeHomework,
            completedHomework: completedHomework,
            totalViews: totalViews,
            engagementRate: engagementRate,
            performanceScore: performanceScore,
            studentCount: studentCount
        });
    }

    var sorted = performanceData.slice().sort(function(a, b) { return b.performanceScore - a.performanceScore; });

    var activeTeachers = 0;
    for (var p = 0; p < performanceData.length; p++) {
        if (performanceData[p].totalHomework > 0) activeTeachers++;
    }
    var totalHomework = homework.length;
    var totalViews = 0;
    for (var v = 0; v < homework.length; v++) totalViews += (homework[v].views || 0);
    var avgEngagement = performanceData.length > 0 ? Math.round(performanceData.reduce(function(sum, x) { return sum + x.engagementRate; }, 0) / performanceData.length) : 0;

    document.getElementById('ppTotalTeachers').textContent = activeTeachers + '/' + teachers.length;
    document.getElementById('ppTotalHomework').textContent = totalHomework;
    document.getElementById('ppTotalViews').textContent = totalViews;
    document.getElementById('ppAvgEngagement').textContent = avgEngagement + '%';

    var rankingContainer = document.getElementById('teacherPerformanceRanking');
    if (!sorted.length || sorted.every(function(x) { return x.totalHomework === 0; })) {
        rankingContainer.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">No homework data available yet.</p>';
    } else {
        var html = '';
        for (var r = 0; r < sorted.length; r++) {
            var item = sorted[r];
            if (item.totalHomework === 0) continue;
            var rankClass = item.performanceScore >= 80 ? 'excellent' : item.performanceScore >= 60 ? 'good' : item.performanceScore >= 40 ? 'average' : 'poor';
            var medal = r === 0 ? '🥇' : r === 1 ? '🥈' : r === 2 ? '🥉' : '#' + (r + 1);
            var barColor = item.performanceScore >= 80 ? '#22C55E' : item.performanceScore >= 60 ? '#3B82F6' : item.performanceScore >= 40 ? '#F59E0B' : '#EF4444';
            html += '<div class="performance-rank ' + rankClass + '">' +
                '<div class="rank-number">' + medal + '</div>' +
                '<div class="rank-info"><div class="name">' + escapeHtml(item.name) + '</div><div class="detail">' + escapeHtml(item.subject) + ' | ' + item.totalHomework + ' homework | ' + item.totalViews + ' views</div></div>' +
                '<div class="rank-score"><div class="score">' + item.performanceScore + '%</div><div class="label">' + item.engagementRate + '% engagement</div><div class="rank-bar"><div class="fill" style="width:' + item.performanceScore + '%;background:' + barColor + ';"></div></div></div></div>';
        }
        rankingContainer.innerHTML = html;
    }

    // Subject-wise chart
    var subjectMap = {};
    for (var h2 = 0; h2 < homework.length; h2++) {
        var subj = homework[h2].subject;
        if (!subjectMap[subj]) subjectMap[subj] = { total: 0, views: 0 };
        subjectMap[subj].total++;
        subjectMap[subj].views += (homework[h2].views || 0);
    }
    var subjectKeys = Object.keys(subjectMap);
    var subjectData = [];
    var totalStudents = State.students.length || 1;
    for (var sk = 0; sk < subjectKeys.length; sk++) {
        var key = subjectKeys[sk];
        var d = subjectMap[key];
        var engagement = d.total > 0 ? Math.min(100, Math.round((d.views / (d.total * totalStudents)) * 100)) : 0;
        subjectData.push({ subject: key, total: d.total, views: d.views, engagement: engagement });
    }

    var subChartEl = document.getElementById('subjectPerformanceChart');
    if (typeof ApexCharts !== 'undefined' && subjectData.length > 0) {
        subChartEl.innerHTML = '';
        try {
            new ApexCharts(subChartEl, {
                series: [{ name: 'Engagement Rate', data: subjectData.map(function(x) { return x.engagement; }) }],
                chart: { type: 'bar', height: 280, toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 6, horizontal: false } },
                colors: ['#8B5CF6'],
                xaxis: { categories: subjectData.map(function(x) { return x.subject; }) },
                yaxis: { max: 100, labels: { formatter: function(v) { return v + '%'; } } },
                dataLabels: { enabled: true, formatter: function(v) { return v + '%'; } }
            }).render();
        } catch (e) { console.error('Subject chart error:', e); }
    } else {
        subChartEl.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">No subject data available yet.</p>';
    }

    // Trend chart
    var weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    var weekData = [];
    for (var w = 5; w >= 0; w--) {
        var date = new Date();
        date.setDate(date.getDate() - (w * 7));
        var weekHomework = [];
        for (var hh = 0; hh < homework.length; hh++) {
            var created = new Date(homework[hh].createdDate);
            var diff = (date - created) / (1000 * 60 * 60 * 24);
            if (diff >= 0 && diff < 7) weekHomework.push(homework[hh]);
        }
        var weekViews = 0;
        for (var vv = 0; vv < weekHomework.length; vv++) weekViews += (weekHomework[vv].views || 0);
        var weekEngagement = weekHomework.length > 0 ? Math.min(100, Math.round((weekViews / (weekHomework.length * totalStudents)) * 100)) : 0;
        weekData.push(weekEngagement);
    }

    var trendEl = document.getElementById('performanceTrendChart');
    if (typeof ApexCharts !== 'undefined') {
        trendEl.innerHTML = '';
        try {
            new ApexCharts(trendEl, {
                series: [{ name: 'Engagement Rate', data: weekData }],
                chart: { type: 'line', height: 230, toolbar: { show: false } },
                stroke: { curve: 'smooth', width: 3 },
                colors: ['#3B82F6'],
                markers: { size: 6 },
                xaxis: { categories: weeks },
                yaxis: { max: 100, labels: { formatter: function(v) { return v + '%'; } } },
                dataLabels: { enabled: true, formatter: function(v) { return v + '%'; } }
            }).render();
        } catch (e) { console.error('Trend chart error:', e); }
    } else {
        trendEl.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">Chart library not loaded</p>';
    }

    // Alerts
    var alertsContainer = document.getElementById('lowPerformanceAlerts');
    var lowPerformers = sorted.filter(function(x) { return x.performanceScore < 50 && x.totalHomework > 0; });
    if (!lowPerformers.length) {
        alertsContainer.innerHTML = '<p style="color:var(--success);font-weight:600;padding:12px;">✅ All teachers are performing well! No alerts.</p>';
    } else {
        var alertHtml = '';
        for (var al = 0; al < lowPerformers.length; al++) {
            var lp = lowPerformers[al];
            alertHtml += '<div class="performance-rank poor">' +
                '<div class="rank-number">⚠️</div>' +
                '<div class="rank-info"><div class="name">' + escapeHtml(lp.name) + '</div><div class="detail">' + escapeHtml(lp.subject) + ' | ' + lp.totalHomework + ' homework | ' + lp.engagementRate + '% engagement</div></div>' +
                '<div><button class="btn btn-primary btn-sm" onclick="sendTeacherReminder(this)" data-name="' + escapeHtml(lp.name) + '">🔔 Send Reminder</button></div></div>';
        }
        alertsContainer.innerHTML = alertHtml;
    }
}

function sendTeacherReminder(el) {
    showToast('📧 Reminder sent to ' + el.dataset.name, 'success');
}

function exportPerformanceReport() {
    var teachers = State.teachers;
    var homework = State.homework;
    var report = 'St. Francis of Assisi School\nTeacher Performance Report\nGenerated: ' + new Date().toLocaleDateString() + '\n' + '='.repeat(50) + '\n\n';
    report += 'Teacher\tTotal Homework\tActive\tCompleted\tViews\tEngagement\tScore\n' + '-'.repeat(80) + '\n';

    for (var i = 0; i < teachers.length; i++) {
        var t = teachers[i];
        var th = homework.filter(function(h) { return h.teacherId === t.id; });
        var total = th.length;
        var active = 0, completed = 0, views = 0;
        for (var h = 0; h < th.length; h++) {
            if (th[h].status === 'Active') active++;
            else if (th[h].status === 'Completed') completed++;
            views += (th[h].views || 0);
        }
        var studentCount = 1;
        if (t.classTeacher) {
            var parts = t.classTeacher.split(' - ');
            var cls = parts[0] || '', sec = parts[1] || '';
            var cnt = 0;
            for (var s = 0; s < State.students.length; s++) {
                if (State.students[s].class === cls && State.students[s].section === sec) cnt++;
            }
            if (cnt > 0) studentCount = cnt;
        }
        var engagement = total > 0 ? Math.min(100, Math.round((views / (total * studentCount)) * 100)) : 0;
        var timeliness = total > 0 ? Math.round((completed / total) * 100) : 0;
        var score = Math.round((engagement * 0.6) + (timeliness * 0.4));
        report += t.name + '\t' + total + '\t' + active + '\t' + completed + '\t' + views + '\t' + engagement + '%\t' + score + '%\n';
    }

    var blob = new Blob([report], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Teacher_Performance_Report.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Report downloaded successfully!', 'success');
}

// ================================================================
// DASHBOARD
// ================================================================

function initDashboard() {
    var totalStudents = State.students.length;
    var boys = 0, girls = 0;
    for (var i = 0; i < State.students.length; i++) {
        if (State.students[i].gender === 'Male') boys++;
        else girls++;
    }

    var today = new Date().toISOString().split('T')[0];
    var todayAtt = State.teacherAttendance.filter(function(a) { return a.date === today; });
    var presentT = 0;
    for (var a = 0; a < todayAtt.length; a++) {
        if (todayAtt[a].status === 'present') presentT++;
    }
    var absentT = State.teachers.length - presentT;

    var totalFees = 0;
    for (var f = 0; f < State.feeRecords.length; f++) {
        totalFees += (State.feeRecords[f].total || State.feeRecords[f].amount || 0);
    }
    var targetFees = 500000;

    var boyP = totalStudents ? Math.round((boys / totalStudents) * 100) : 0;
    var girlP = totalStudents ? Math.round((girls / totalStudents) * 100) : 0;
    var presP = State.teachers.length ? Math.round((presentT / State.teachers.length) * 100) : 0;
    var absP = State.teachers.length ? Math.round((absentT / State.teachers.length) * 100) : 0;
    var feeP = Math.min(100, Math.round((totalFees / targetFees) * 100));

    document.getElementById('studentsDonuts').innerHTML =
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#3B82F6 0deg,#3B82F6 ' + (boyP * 3.6) + 'deg,#F1F5F9 ' + (boyP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + boys + '</div></div><div class="kpi-mini-label">👦 Boys</div><div class="kpi-mini-value" style="color:#3B82F6;">' + boyP + '%</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#EC4899 0deg,#EC4899 ' + (girlP * 3.6) + 'deg,#F1F5F9 ' + (girlP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + girls + '</div></div><div class="kpi-mini-label">👧 Girls</div><div class="kpi-mini-value" style="color:#EC4899;">' + girlP + '%</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#8B5CF6 0deg,#8B5CF6 360deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + totalStudents + '</div></div><div class="kpi-mini-label">👨‍🎓 Total</div><div class="kpi-mini-value" style="color:#8B5CF6;">Students</div></div>';

    document.getElementById('teachersDonuts').innerHTML =
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#22C55E 0deg,#22C55E ' + (presP * 3.6) + 'deg,#F1F5F9 ' + (presP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + presentT + '</div></div><div class="kpi-mini-label">✅ Present</div><div class="kpi-mini-value" style="color:#22C55E;">' + presP + '%</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#EF4444 0deg,#EF4444 ' + (absP * 3.6) + 'deg,#F1F5F9 ' + (absP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + absentT + '</div></div><div class="kpi-mini-label">❌ Absent</div><div class="kpi-mini-value" style="color:#EF4444;">' + absP + '%</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#8B5CF6 0deg,#8B5CF6 360deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + State.teachers.length + '</div></div><div class="kpi-mini-label">👨‍🏫 Total</div><div class="kpi-mini-value" style="color:#8B5CF6;">Teachers</div></div>';

    document.getElementById('feeDonuts').innerHTML =
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#22C55E 0deg,#22C55E ' + (feeP * 3.6) + 'deg,#F1F5F9 ' + (feeP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">₹' + (totalFees / 1000).toFixed(0) + 'K</div></div><div class="kpi-mini-label">💰 Collected</div><div class="kpi-mini-value" style="color:#22C55E;">' + feeP + '%</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#EF4444 0deg,#EF4444 ' + ((100 - feeP) * 3.6) + 'deg,#F1F5F9 ' + ((100 - feeP) * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">₹' + ((targetFees - totalFees) / 1000).toFixed(0) + 'K</div></div><div class="kpi-mini-label">📋 Pending</div><div class="kpi-mini-value" style="color:#EF4444;">' + (100 - feeP) + '%</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#F59E0B 0deg,#F59E0B 360deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + State.feeRecords.length + '</div></div><div class="kpi-mini-label">🧾 Receipts</div><div class="kpi-mini-value" style="color:#F59E0B;">Issued</div></div>';

    document.getElementById('attendanceDonuts').innerHTML =
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#22C55E 0deg,#22C55E ' + (presP * 3.6) + 'deg,#F1F5F9 ' + (presP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + presentT + '</div></div><div class="kpi-mini-label">✅ Present</div><div class="kpi-mini-value" style="color:#22C55E;">Teachers</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#EF4444 0deg,#EF4444 ' + (absP * 3.6) + 'deg,#F1F5F9 ' + (absP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + absentT + '</div></div><div class="kpi-mini-label">❌ Absent</div><div class="kpi-mini-value" style="color:#EF4444;">Teachers</div></div>' +
        '<div class="kpi-donut-item"><div class="kpi-mini-donut" style="background:conic-gradient(#8B5CF6 0deg,#8B5CF6 ' + (presP * 3.6) + 'deg,#F1F5F9 ' + (presP * 3.6) + 'deg,#F1F5F9 360deg);"><div class="kpi-mini-donut-inner">' + presP + '%</div></div><div class="kpi-mini-label">📊 Rate</div><div class="kpi-mini-value" style="color:#8B5CF6;">Attendance</div></div>';

    if (typeof ApexCharts !== 'undefined') {
        try {
            document.getElementById('genderDonut').innerHTML = '';
            new ApexCharts(document.querySelector('#genderDonut'), {
                series: [boys, girls],
                chart: { type: 'donut', height: 280 },
                labels: ['Boys', 'Girls'],
                colors: ['#3B82F6', '#EC4899']
            }).render();

            var religions = {};
            for (var r = 0; r < State.students.length; r++) {
                var rel = State.students[r].religion || 'Unknown';
                religions[rel] = (religions[rel] || 0) + 1;
            }
            document.getElementById('religionChart').innerHTML = '';
            new ApexCharts(document.querySelector('#religionChart'), {
                series: Object.values(religions),
                chart: { type: 'donut', height: 280 },
                labels: Object.keys(religions),
                colors: ['#3B82F6', '#EC4899', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16']
            }).render();

            var classData = [];
            for (var c = 0; c < CLASS_LIST.length; c++) {
                var cls = CLASS_LIST[c];
                var cnt = 0;
                for (var sc = 0; sc < State.students.length; sc++) {
                    if (State.students[sc].class === cls) cnt++;
                }
                classData.push({ class: cls, count: cnt });
            }
            document.getElementById('classStrengthChart').innerHTML = '';
            new ApexCharts(document.querySelector('#classStrengthChart'), {
                series: [{ name: 'Students', data: classData.map(function(d) { return d.count; }) }],
                chart: { type: 'bar', height: 280 },
                plotOptions: { bar: { borderRadius: 6, horizontal: true } },
                colors: ['#8B5CF6'],
                xaxis: { categories: classData.map(function(d) { return d.class; }) }
            }).render();
        } catch (e) { console.error('Chart error:', e); }
    }

    loadNoticeBoard();
}

// ================================================================
// DASHBOARD SEARCH
// ================================================================

function dashSearch() {
    var q = (document.getElementById('dashSearchInput').value || '').toLowerCase().trim();
    var box = document.getElementById('dashSearchResults');
    if (!box) return;
    if (!q) { box.innerHTML = ''; return; }

    var students = [];
    for (var i = 0; i < State.students.length; i++) {
        var s = State.students[i];
        if (s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q)) {
            students.push(s);
            if (students.length >= 8) break;
        }
    }
    var teachers = [];
    for (var j = 0; j < State.teachers.length; j++) {
        var t = State.teachers[j];
        if (t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q)) {
            teachers.push(t);
            if (teachers.length >= 8) break;
        }
    }

    if (!students.length && !teachers.length) {
        box.innerHTML = '<div style="padding:10px;color:var(--text-secondary);font-size:12px;">No results found for "' + escapeHtml(q) + '".</div>';
        return;
    }

    var html = '';
    for (var si = 0; si < students.length; si++) {
        var st = students[si];
        html += '<div class="dash-result" onclick="viewPerson(\'student\', ' + st.id + ')"><span class="dash-result-icon">🎒</span><div class="dash-result-info"><strong>' + escapeHtml(st.name) + '</strong><small>' + escapeHtml(st.admissionNo) + ' &bull; ' + escapeHtml(st.class) + ' - ' + escapeHtml(st.section) + '</small></div><span class="badge badge-primary">Student</span></div>';
    }
    for (var ti = 0; ti < teachers.length; ti++) {
        var tc = teachers[ti];
        html += '<div class="dash-result" onclick="viewPerson(\'teacher\', ' + tc.id + ')"><span class="dash-result-icon">👨‍🏫</span><div class="dash-result-info"><strong>' + escapeHtml(tc.name) + '</strong><small>' + escapeHtml(tc.employeeId) + ' &bull; ' + escapeHtml(tc.subject) + '</small></div><span class="badge badge-info">Teacher</span></div>';
    }
    box.innerHTML = html;
}

function viewPerson(type, id) {
    var box = document.getElementById('dashPersonDetails');
    if (!box) return;

    if (type === 'student') {
        var student = null;
        for (var i = 0; i < State.students.length; i++) {
            if (State.students[i].id === id) { student = State.students[i]; break; }
        }
        if (!student) return;
        var attendance = getStudentAttendance(student.id);
        var attStatus = getAttendanceStatus(attendance.percentage);
        var examNames = { ut1: '1st Unit Test', ut2: '2nd Unit Test', hy: 'Half Yearly', an: 'Annual Exam' };
        var marksRows = '';
        var examKeys = ['ut1', 'ut2', 'hy', 'an'];
        for (var e = 0; e < examKeys.length; e++) {
            var ek = examKeys[e];
            var data = State.marksData[ek + '_' + student.id] || {};
            var limits = getMarkLimits(ek);
            var subjects = getSubjects();
            var total = 0, maxTotal = limits.full * subjects.length;
            for (var s = 0; s < subjects.length; s++) {
                total += parseInt(data[subjects[s]]) || 0;
            }
            var pct = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
            var hasMarks = false;
            for (var s2 = 0; s2 < subjects.length; s2++) {
                if (data[subjects[s2]]) { hasMarks = true; break; }
            }
            marksRows += '<div class="detail-row"><span>' + examNames[ek] + '</span><span>' + (hasMarks ? '<strong>' + total + '</strong> / ' + maxTotal + ' (' + pct + '%)' : 'No marks yet') + '</span></div>';
        }
        box.innerHTML =
            '<div class="dash-detail-card">' +
            '<div class="dash-detail-header">' +
            (student.photo ? '<img class="dash-detail-photo" src="' + student.photo + '" alt="" />' : '<div class="dash-detail-photo">' + escapeHtml(student.name.charAt(0)) + '</div>') +
            '<div><h3>' + escapeHtml(student.name) + '</h3>' +
            '<span class="badge badge-primary">' + escapeHtml(student.admissionNo) + '</span> <span class="badge badge-info">' + escapeHtml(student.class) + ' - ' + escapeHtml(student.section) + '</span> ' +
            '<span class="badge ' + (student.status === 'Active' ? 'badge-success' : 'badge-danger') + '">' + escapeHtml(student.status || 'Active') + '</span></div></div>' +
            '<div class="detail-grid">' +
            '<div class="detail-row"><span>👨 Father</span><span>' + escapeHtml(student.fatherName || '-') + '</span></div>' +
            '<div class="detail-row"><span>👩 Mother</span><span>' + escapeHtml(student.motherName || '-') + '</span></div>' +
            '<div class="detail-row"><span>📞 Parent Phone</span><span>' + escapeHtml(student.parentPhone || '-') + '</span></div>' +
            '<div class="detail-row"><span>🎂 DOB</span><span>' + escapeHtml(student.dob || '-') + '</span></div>' +
            '<div class="detail-row"><span>⛪ Religion</span><span>' + escapeHtml(student.religion || '-') + '</span></div>' +
            '<div class="detail-row"><span>📊 Attendance</span><span><strong>' + attendance.percentage + '%</strong> (' + attStatus.label + ')</span></div></div>' +
            '<h4 style="margin:14px 0 8px;">📝 Exam Performance</h4>' + marksRows + '</div>';
    } else {
        var teacher = null;
        for (var t = 0; t < State.teachers.length; t++) {
            if (State.teachers[t].id === id) { teacher = State.teachers[t]; break; }
        }
        if (!teacher) return;
        var attRecords = State.teacherAttendance.filter(function(a) { return a.teacherId === teacher.id; });
        var present = 0;
        for (var pa = 0; pa < attRecords.length; pa++) {
            if (attRecords[pa].status === 'present') present++;
        }
        var attPct = attRecords.length ? Math.round((present / attRecords.length) * 100) : 0;
        var hw = State.homework.filter(function(h) { return h.teacherId === teacher.id; });
        var hwViews = 0;
        for (var hv = 0; hv < hw.length; hv++) hwViews += (hw[hv].views || 0);
        box.innerHTML =
            '<div class="dash-detail-card">' +
            '<div class="dash-detail-header">' +
            (teacher.photo ? '<img class="dash-detail-photo" src="' + teacher.photo + '" alt="" />' : '<div class="dash-detail-photo">' + escapeHtml(teacher.name.charAt(0)) + '</div>') +
            '<div><h3>' + escapeHtml(teacher.name) + '</h3>' +
            '<span class="badge badge-info">' + escapeHtml(teacher.employeeId) + '</span> <span class="badge badge-primary">' + escapeHtml(teacher.subject) + '</span></div></div>' +
            '<div class="detail-grid">' +
            '<div class="detail-row"><span>🏫 Class Teacher</span><span>' + escapeHtml(teacher.classTeacher || 'Not assigned') + '</span></div>' +
            '<div class="detail-row"><span>💼 Designation</span><span>' + escapeHtml(teacher.designation || '-') + '</span></div>' +
            '<div class="detail-row"><span>👤 Gender</span><span>' + escapeHtml(teacher.gender || '-') + '</span></div>' +
            '<div class="detail-row"><span>🎂 DOB</span><span>' + escapeHtml(teacher.dob || '-') + '</span></div>' +
            '<div class="detail-row"><span>👨 Father\'s Name</span><span>' + escapeHtml(teacher.fatherName || '-') + '</span></div>' +
            '<div class="detail-row"><span>🎓 Qualification</span><span>' + escapeHtml(teacher.qualification || '-') + '</span></div>' +
            '<div class="detail-row"><span>📍 Address</span><span>' + escapeHtml(teacher.address || '-') + '</span></div>' +
            '<div class="detail-row"><span>⏳ Experience</span><span>' + (teacher.experience || 0) + ' yrs</span></div>' +
            '<div class="detail-row"><span>📊 Attendance</span><span><strong>' + attPct + '%</strong> (' + present + '/' + attRecords.length + ' present)</span></div>' +
            '<div class="detail-row"><span>📚 Homework</span><span>' + hw.length + ' assigned &bull; ' + hwViews + ' views</span></div></div></div>';
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ================================================================
// DUPLICATE DATA CHECK
// ================================================================

function findDuplicateGroups(list, keyFn) {
    var map = {};
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var k = null;
        try { k = keyFn(item); } catch (e) { k = null; }
        if (!k) continue;
        if (!map[k]) map[k] = [];
        map[k].push(item);
    }
    var groups = [];
    for (var key in map) {
        if (map[key].length > 1) groups.push({ key: key, items: map[key] });
    }
    return groups;
}

function getDuplicateRules() {
    return [
        { title: '🧑‍🎓 Students — Duplicate Admission No', store: 'sfaStudents', list: function() { return State.students; }, key: function(s) { return String(s.admissionNo || '').trim().toLowerCase(); }, label: function(s) { return (s.admissionNo || '?') + ' · ' + (s.name || '?'); } },
        { title: '🧑‍🎓 Students — Same Name in Same Class', store: 'sfaStudents', list: function() { return State.students; }, key: function(s) { return (s.name || '').trim().toLowerCase() + '|' + (s.class || '') + '|' + (s.section || ''); }, label: function(s) { return (s.name || '?') + ' · ' + (s.class || '') + ' ' + (s.section || ''); } },
        { title: '🧑‍🎓 Students — Duplicate Parent Phone', store: 'sfaStudents', list: function() { return State.students; }, key: function(s) { return String(s.parentPhone || '').trim() || null; }, label: function(s) { return (s.name || '?') + ' · ' + (s.parentPhone || '-'); } },
        { title: '👨‍🏫 Teachers — Duplicate Employee ID', store: 'sfaTeachers', list: function() { return State.teachers; }, key: function(t) { return String(t.employeeId || '').trim().toLowerCase(); }, label: function(t) { return (t.employeeId || '?') + ' · ' + (t.name || '?'); } },
        { title: '👨‍🏫 Teachers — Duplicate Name', store: 'sfaTeachers', list: function() { return State.teachers; }, key: function(t) { return (t.name || '').trim().toLowerCase(); }, label: function(t) { return (t.name || '?'); } },
        { title: '💰 Fee Records — Duplicate Receipt No', store: 'sfaFees', list: function() { return State.feeRecords; }, key: function(r) { return String(r.receiptNo || '').trim().toLowerCase(); }, label: function(r) { return (r.receiptNo || '?') + ' · ' + (r.studentName || '') + ' ₹' + (r.total || r.amount || 0); } },
        { title: '📝 Homework — Duplicate Assignment', store: 'sfaHomework', list: function() { return State.homework; }, key: function(h) { return (h.title || '').trim().toLowerCase() + '|' + (h.class || '') + '|' + (h.section || '') + '|' + (h.subject || ''); }, label: function(h) { return (h.title || '?') + ' · ' + (h.subject || '') + ' · ' + (h.class || '') + ' ' + (h.section || ''); } },
        { title: '📢 Notices — Duplicate Title + Date', store: 'sfaNotices', list: function() { return State.notices; }, key: function(n) { return (n.title || '').trim().toLowerCase() + '|' + (n.date || ''); }, label: function(n) { return (n.title || '?') + ' · ' + (n.date || ''); } },
        { title: '🎒 Admission Apps — Duplicate Parent Phone', store: null, list: function() { return State.ukgApplications.concat(State.generalApplications); }, key: function(a) { return String(a.fatherPhone || a.motherPhone || a.parentPhone || '').trim() || null; }, label: function(a) { return (a.childName || a.studentName || a.name || 'Applicant') + ' · ' + (a.fatherPhone || a.motherPhone || a.parentPhone || '-'); } }
    ];
}

var lastDuplicatePlan = [];

function loadDuplicates() {
    var out = document.getElementById('duplicateResults');
    if (!out) return;
    var rules = getDuplicateRules();
    var html = '';
    var totalDupes = 0;
    var any = false;
    var plan = [];

    for (var ri = 0; ri < rules.length; ri++) {
        var rule = rules[ri];
        var groups = findDuplicateGroups(rule.list(), rule.key);
        if (groups.length === 0) continue;
        any = true;
        var extraIds = [];
        for (var gi = 0; gi < groups.length; gi++) {
            var g = groups[gi];
            for (var ii = 1; ii < g.items.length; ii++) extraIds.push(g.items[ii].id);
        }
        plan.push({ store: rule.store, extraIds: extraIds });
        totalDupes += extraIds.length;

        html += '<div class="form-section" style="border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px;">';
        html += '<h3 class="form-section-title" style="margin:0;">' + rule.title + ' <span class="badge badge-danger">' + extraIds.length + ' duplicate(s)</span></h3>';
        if (rule.store && extraIds.length) html += '<button class="btn btn-danger btn-sm" onclick="removeDuplicates(\'' + rule.store + '\',' + JSON.stringify(extraIds) + ')">🗑️ Remove ' + extraIds.length + '</button>';
        html += '</div>';
        for (var g2 = 0; g2 < groups.length; g2++) {
            var grp = groups[g2];
            html += '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 12px;margin-top:10px;">' +
                '<div style="font-weight:700;font-size:12px;color:#B91C1C;margin-bottom:6px;">⚠️ ' + escapeHtml(String(grp.key)) + '</div>';
            for (var it = 0; it < grp.items.length; it++) {
                html += '<div style="font-size:13px;padding:2px 0;">• ' + escapeHtml(rule.label(grp.items[it])) + ' <span style="color:#B91C1C;font-size:11px;">#' + grp.items[it].id + '</span></div>';
            }
            html += '</div>';
        }
        html += '</div>';
    }

    lastDuplicatePlan = plan;
    if (!any) {
        out.innerHTML = '<div style="text-align:center;padding:40px 20px;"><div style="font-size:42px;">✅</div><h3 style="margin:10px 0 4px;">No duplicate data found</h3><p style="color:var(--text-secondary);font-size:13px;">All records look clean across students, teachers, fees, homework, notices and admissions.</p></div>';
        return;
    }
    out.innerHTML = '<div class="stats-grid" style="margin-bottom:16px;"><div class="stat-card"><div class="stat-number">' + totalDupes + '</div><div class="stat-label">⚠️ Duplicate Records Found</div></div></div>' + html + '<div style="margin-top:4px;"><button class="btn btn-danger" onclick="removeAllDuplicates()">🗑️ Remove All Duplicates (' + totalDupes + ')</button></div>';
}

function removeDuplicates(storeKey, ids) {
    if (!Array.isArray(ids) || ids.length === 0) { showToast('Nothing to remove', 'warning'); return; }
    if (!confirm('Remove ' + ids.length + ' duplicate record(s)? The first entry in each group will be kept.')) return;
    var idSet = {};
    for (var i = 0; i < ids.length; i++) idSet[ids[i]] = true;
    var removed = 0;
    var applyFn = function(list) {
        var kept = [];
        for (var j = 0; j < list.length; j++) {
            if (idSet[list[j].id]) { removed++; } else { kept.push(list[j]); }
        }
        return kept;
    };
    if (storeKey === 'sfaStudents') { State.students = applyFn(State.students); Storage.set('sfaStudents', State.students); }
    else if (storeKey === 'sfaTeachers') { State.teachers = applyFn(State.teachers); Storage.set('sfaTeachers', State.teachers); }
    else if (storeKey === 'sfaFees') { State.feeRecords = applyFn(State.feeRecords); Storage.set('sfaFees', State.feeRecords); }
    else if (storeKey === 'sfaHomework') { State.homework = applyFn(State.homework); Storage.set('sfaHomework', State.homework); }
    else if (storeKey === 'sfaNotices') { State.notices = applyFn(State.notices); Storage.set('sfaNotices', State.notices); }
    else { showToast('⚠️ Cannot auto-remove this type', 'error'); return; }
    showToast('🗑️ Removed ' + removed + ' duplicate(s)', 'success');
    loadDuplicates();
}

function removeAllDuplicates() {
    var plan = lastDuplicatePlan || [];
    var withIds = [];
    for (var i = 0; i < plan.length; i++) {
        if (plan[i].extraIds.length > 0) withIds.push(plan[i]);
    }
    var total = 0;
    for (var j = 0; j < withIds.length; j++) total += withIds[j].extraIds.length;
    if (!total) { showToast('No duplicates to remove', 'warning'); return; }
    if (!confirm('Remove ALL ' + total + ' duplicate record(s)? The first entry in each group will be kept.')) return;
    for (var k = 0; k < withIds.length; k++) {
        var p = withIds[k];
        var idSet = {};
        for (var l = 0; l < p.extraIds.length; l++) idSet[p.extraIds[l]] = true;
        var applyFn2 = function(list) {
            var kept = [];
            for (var m = 0; m < list.length; m++) {
                if (!idSet[list[m].id]) kept.push(list[m]);
            }
            return kept;
        };
        if (p.store === 'sfaStudents') { State.students = applyFn2(State.students); Storage.set('sfaStudents', State.students); }
        else if (p.store === 'sfaTeachers') { State.teachers = applyFn2(State.teachers); Storage.set('sfaTeachers', State.teachers); }
        else if (p.store === 'sfaFees') { State.feeRecords = applyFn2(State.feeRecords); Storage.set('sfaFees', State.feeRecords); }
        else if (p.store === 'sfaHomework') { State.homework = applyFn2(State.homework); Storage.set('sfaHomework', State.homework); }
        else if (p.store === 'sfaNotices') { State.notices = applyFn2(State.notices); Storage.set('sfaNotices', State.notices); }
    }
    showToast('🗑️ Removed ' + total + ' duplicate(s)', 'success');
    loadDuplicates();
}

// ================================================================
// SUPER ADMIN HELPERS
// ================================================================

function computePlatformTotals() {
    var reg = getSchoolRegistry();
    var students = 0, teachers = 0, revenue = 0;
    for (var i = 0; i < reg.length; i++) {
        var sid = reg[i].id;
        try {
            var sArr = JSON.parse(localStorage.getItem(sid + '::sfaStudents') || '[]');
            if (Array.isArray(sArr)) students += sArr.length;
        } catch (e) {}
        try {
            var tArr = JSON.parse(localStorage.getItem(sid + '::sfaTeachers') || '[]');
            if (Array.isArray(tArr)) teachers += tArr.length;
        } catch (e) {}
        try {
            var fees = JSON.parse(localStorage.getItem(sid + '::sfaFees') || '[]');
            if (Array.isArray(fees)) {
                for (var f = 0; f < fees.length; f++) {
                    revenue += (Number(fees[f].total) || Number(fees[f].amount) || 0);
                }
            }
        } catch (e) {}
    }
    return { schools: reg.length, students: students, teachers: teachers, principals: reg.length, revenue: revenue };
}

function renderPlatformTotals() {
    var t = computePlatformTotals();
    var setEl = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('ptSchools', t.schools);
    setEl('ptStudents', t.students);
    setEl('ptTeachers', t.teachers);
    setEl('ptPrincipals', t.principals);
    setEl('ptRevenue', '₹' + t.revenue.toLocaleString('en-IN'));
    var statusEl = document.getElementById('ptServerStatus');
    if (statusEl) {
        var s = getServerSettings();
        var light = document.getElementById('headerServerStatusLight');
        var cls = light ? light.className : '';
        if (!s.url) { statusEl.textContent = '⚪ Not Configured'; }
        else if (cls.indexOf('green') !== -1) { statusEl.textContent = '🟢 Connected'; }
        else if (cls.indexOf('yellow') !== -1) { statusEl.textContent = '🟡 Connecting'; }
        else { statusEl.textContent = '🔴 Offline'; }
    }
}

function loadSuperDashboard() {
    renderOnlineStatus();
    renderPlatformTotals();

    var students = State.students.length;
    var teachers = State.teachers.length;
    var fees = 0;
    for (var f = 0; f < State.feeRecords.length; f++) {
        fees += (Number(State.feeRecords[f].total) || Number(State.feeRecords[f].amount) || 0);
    }
    var pending = 0;
    for (var p = 0; p < State.ukgApplications.length; p++) {
        if (State.ukgApplications[p].status === 'Pending') pending++;
    }
    for (var q = 0; q < State.generalApplications.length; q++) {
        if (State.generalApplications[q].status === 'Pending') pending++;
    }

    document.getElementById('saStudents').textContent = students;
    document.getElementById('saTeachers').textContent = teachers;
    document.getElementById('saFees').textContent = '₹' + fees.toLocaleString('en-IN');
    document.getElementById('saPending').textContent = pending;
    document.getElementById('saHomework').textContent = State.homework.length;
    document.getElementById('saNotices').textContent = State.notices.length;

    var s = State.schoolSettings;
    document.getElementById('saSystemStatus').innerHTML =
        '<div class="sa-user-row"><span>🏫 School</span><strong>' + escapeHtml(s.schoolName || 'St. Francis of Assisi School') + '</strong></div>' +
        '<div class="sa-user-row"><span>📅 Academic Year</span><strong>' + escapeHtml(s.academicYear || '2026-2027') + '</strong></div>' +
        '<div class="sa-user-row"><span>👑 Principal</span><strong>' + escapeHtml(s.principalName || 'N/A') + '</strong></div>' +
        '<div class="sa-user-row"><span>🗄️ Data Storage</span><strong>Browser (localStorage)</strong></div>' +
        '<div class="sa-user-row"><span>👤 Logged In As</span><strong>' + (State.currentUser ? escapeHtml(State.currentUser.name) : 'N/A') + '</strong></div>';

    var pa = Storage.get('sfaPrincipalAuth', {});
    var aa = Storage.get('sfaAccountantAuth', {});
    var sa = Storage.get('sfaSuperAdminAuth', {});
    document.getElementById('saUserList').innerHTML =
        '<div class="sa-user-row"><span>👑 Principal</span><strong>' + escapeHtml(pa.email || 'principal@stfrancis.edu') + '</strong></div>' +
        '<div class="sa-user-row"><span>💰 Accountant</span><strong>' + escapeHtml(aa.email || 'accounts@stfrancis.edu') + '</strong></div>' +
        '<div class="sa-user-row"><span>🛡️ Admin</span><strong>' + escapeHtml(sa.email || 'superadmin@stfrancis.edu') + '</strong></div>' +
        '<div class="sa-user-row"><span>👨‍🏫 Teachers</span><strong>' + teachers + ' accounts</strong></div>' +
        '<div class="sa-user-row"><span>🎒 Students</span><strong>' + students + ' accounts</strong></div>';

    var apps = [];
    for (var a = 0; a < State.ukgApplications.length; a++) apps.push(State.ukgApplications[a]);
    for (var b = 0; b < State.generalApplications.length; b++) apps.push(State.generalApplications[b]);
    apps.sort(function(x, y) { return new Date(y.appliedDate || 0) - new Date(x.appliedDate || 0); });
    apps = apps.slice(0, 5);
    var appsEl = document.getElementById('saRecentApps');
    if (!apps.length) {
        appsEl.innerHTML = '<p style="color:var(--text-secondary);font-size:12px;">No admission applications yet.</p>';
    } else {
        var appsHtml = '';
        for (var c = 0; c < apps.length; c++) {
            var app = apps[c];
            var badge = app.status === 'Accepted' ? 'badge-success' : app.status === 'Rejected' ? 'badge-danger' : app.status === 'Shortlisted' ? 'badge-warning' : 'badge-info';
            appsHtml += '<div class="sa-user-row"><span>' + (app.type === 'UKG' ? '🎒 UKG' : '📚 General') + '</span>' +
                '<strong>' + escapeHtml(app.childName || app.studentName || 'Applicant') + ' <span class="badge ' + badge + '">' + escapeHtml(app.status || 'Pending') + '</span></strong></div>';
        }
        appsEl.innerHTML = appsHtml;
    }
}

function loadAdminCreds() {
    var pa = Storage.get('sfaPrincipalAuth', { email: 'principal@stfrancis.edu', password: 'admin123' });
    var aa = Storage.get('sfaAccountantAuth', { email: 'accounts@stfrancis.edu', password: 'account123' });
    var sa = Storage.get('sfaSuperAdminAuth', { email: 'superadmin@stfrancis.edu', password: 'superadmin123' });
    document.getElementById('saPrincipalCurrent').value = pa.email || 'principal@stfrancis.edu';
    document.getElementById('saAccountantCurrent').value = aa.email || 'accounts@stfrancis.edu';
    document.getElementById('saSuperCurrent').value = sa.email || 'superadmin@stfrancis.edu';
    document.getElementById('saPrincipalNewId').value = '';
    document.getElementById('saPrincipalNewPwd').value = '';
    document.getElementById('saAccountantNewId').value = '';
    document.getElementById('saAccountantNewPwd').value = '';
    document.getElementById('saSuperNewId').value = '';
    document.getElementById('saSuperNewPwd').value = '';
}

function saveRoleCreds(role) {
    var curId, newId, newPwd, key, label;
    if (role === 'principal') {
        curId = 'saPrincipalCurrent';
        newId = 'saPrincipalNewId';
        newPwd = 'saPrincipalNewPwd';
        key = 'sfaPrincipalAuth';
        label = 'Principal';
    } else if (role === 'accountant') {
        curId = 'saAccountantCurrent';
        newId = 'saAccountantNewId';
        newPwd = 'saAccountantNewPwd';
        key = 'sfaAccountantAuth';
        label = 'Accountant';
    } else {
        curId = 'saSuperCurrent';
        newId = 'saSuperNewId';
        newPwd = 'saSuperNewPwd';
        key = 'sfaSuperAdminAuth';
        label = 'Admin';
    }

    var idVal = document.getElementById(newId).value.trim();
    var pwdVal = document.getElementById(newPwd).value.trim();

    if (!idVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(idVal)) {
        showToast('❌ Please enter a valid email ID.', 'warning');
        return;
    }
    if (pwdVal.length < 6) {
        showToast('❌ Password must be at least 6 characters.', 'warning');
        return;
    }

    var existing = Storage.get(key, {});
    Storage.set(key, { email: idVal, password: pwdVal, enabled: existing.enabled !== false });
    document.getElementById(curId).value = idVal;
    document.getElementById(newId).value = '';
    document.getElementById(newPwd).value = '';
    showToast('🔐 ' + label + ' ID & password updated!', 'success');
}

// ================================================================
// SCHOOL MANAGER (Super Admin)
// ================================================================

function saveSchoolRegistry(reg) {
    try { localStorage.setItem('sfaSchoolRegistry', JSON.stringify(reg)); } catch (e) { console.warn('Failed to save school registry:', e); }
}

function schoolStorageUsage(id) {
    var bytes = 0;
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(id + '::') === 0) {
            var v = localStorage.getItem(k) || '';
            bytes += k.length + v.length;
        }
    }
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function schoolGet(schoolId, key, defaultVal) {
    try {
        var raw = localStorage.getItem(schoolId + '::' + key);
        return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) { return defaultVal; }
}

function schoolSet(schoolId, key, val) {
    try { localStorage.setItem(schoolId + '::' + key, JSON.stringify(val)); } catch (e) {}
}

function loadSchoolManager() {
    var reg = getSchoolRegistry();
    var countEl = document.getElementById('schoolCount');
    if (countEl) countEl.textContent = '(' + reg.length + '/8 schools)';

    var list = document.getElementById('schoolList');
    if (!list) return;
    if (!reg.length) {
        list.innerHTML = '<p style="color:var(--text-secondary);font-size:12px;">No schools registered yet.</p>';
        return;
    }
    var cur = getCurrentSchoolId();
    var html = '';
    for (var i = 0; i < reg.length; i++) {
        var s = reg[i];
        var suspended = s.status === 'suspended';
        html += '<div class="sa-user-row" style="flex-wrap:wrap;gap:8px;' + (suspended ? 'opacity:0.6;' : '') + '">' +
            '<span style="font-size:18px;flex-shrink:0;">🏫</span>' +
            '<div style="flex:1;min-width:170px;"><strong>' + escapeHtml(s.name) + '</strong><div style="font-size:11px;color:var(--text-secondary);">' + escapeHtml(s.tagline || 'No tagline') + (s.domain ? ' • 🌐 ' + escapeHtml(s.domain) : '') + ' • 💾 ' + schoolStorageUsage(s.id) + '</div></div>' +
            (s.id === cur ? '<span class="badge badge-success">Current</span>' : '') +
            '<span class="badge ' + (suspended ? 'badge-danger' : 'badge-success') + '">' + (suspended ? 'Suspended' : 'Active') + '</span>' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="switchToSchool(\'' + escapeHtml(s.id) + '\')">🔄 Switch</button>' +
            '<button type="button" class="btn btn-gold btn-sm" onclick="editSchool(\'' + escapeHtml(s.id) + '\')">✏️ Edit</button>' +
            '<button type="button" class="btn ' + (suspended ? 'btn-success' : 'btn-dark') + ' btn-sm" onclick="toggleSchoolSuspend(\'' + escapeHtml(s.id) + '\')">' + (suspended ? '▶️ Activate' : '⏸️ Suspend') + '</button>' +
            '<button type="button" class="btn btn-danger btn-sm" onclick="deleteSchool(\'' + escapeHtml(s.id) + '\')">🗑️ Delete</button></div>';
    }
    list.innerHTML = html;
}

function toggleSchoolSuspend(id) {
    var reg = getSchoolRegistry();
    var school = null;
    for (var i = 0; i < reg.length; i++) {
        if (reg[i].id === id) { school = reg[i]; break; }
    }
    if (!school) return;
    var suspending = school.status !== 'suspended';
    if (suspending && !confirm('Suspend "' + school.name + '"? Its Principal, Accountant, Teachers and Students will not be able to log in until reactivated.')) return;
    school.status = suspending ? 'suspended' : 'active';
    saveSchoolRegistry(reg);
    loadSchoolManager();
    showToast(suspending ? '⏸️ "' + school.name + '" suspended.' : '▶️ "' + school.name + '" activated.', 'success');
}

function addSchool() {
    var reg = getSchoolRegistry();
    if (reg.length >= 8) {
        showToast('❌ Maximum 8 schools allowed.', 'warning');
        return;
    }
    var name = document.getElementById('newSchoolName').value.trim();
    if (!name) {
        showToast('❌ Please enter a school name.', 'warning');
        return;
    }
    var tagline = document.getElementById('newSchoolTagline').value.trim();
    var domain = (document.getElementById('newSchoolDomain').value.trim() || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
    var id = 's' + Date.now();
    reg.push({ id: id, name: name, tagline: tagline, domain: domain });
    saveSchoolRegistry(reg);

    var defaults = {
        schoolName: name,
        tagline: tagline || '',
        logo: '',
        appIcon: '',
        loginBg: '',
        notificationEnabled: false,
        notificationMessage: '',
        address: '123 Education Lane, Knowledge City',
        phone: '+91-9876543210',
        email: 'info@' + domain || 'school.edu',
        principalName: 'Principal',
        academicYear: '2026-2027',
        mission: 'To provide quality education with moral values.',
        religions: DEFAULT_RELIGIONS
    };
    try { localStorage.setItem(id + '::sfaSchoolSettings', JSON.stringify(defaults)); } catch (e) {}

    document.getElementById('newSchoolName').value = '';
    document.getElementById('newSchoolTagline').value = '';
    document.getElementById('newSchoolDomain').value = '';
    loadSchoolManager();
    showToast('✅ School "' + name + '" added successfully!', 'success');
}

function editSchool(id) {
    var reg = getSchoolRegistry();
    var school = null;
    for (var i = 0; i < reg.length; i++) {
        if (reg[i].id === id) { school = reg[i]; break; }
    }
    if (!school) return;
    var newName = prompt('Edit school name:', school.name);
    if (newName === null) return;
    var trimmed = newName.trim();
    if (!trimmed) {
        showToast('❌ School name cannot be empty.', 'warning');
        return;
    }
    var newTagline = prompt('Edit tagline:', school.tagline || '');
    if (newTagline === null) return;
    var newDomain = prompt('Edit domain (leave blank for none, auto-loads this school when the URL hostname matches):', school.domain || '');
    if (newDomain === null) return;
    school.name = trimmed;
    school.tagline = newTagline.trim();
    school.domain = (newDomain.trim() || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
    saveSchoolRegistry(reg);
    if (id === getCurrentSchoolId()) {
        State.schoolSettings.schoolName = trimmed;
        State.schoolSettings.tagline = school.tagline;
        Storage.set('sfaSchoolSettings', State.schoolSettings);
        applySchoolSettings();
    }
    loadSchoolManager();
    showToast('✅ School updated!', 'success');
}

function deleteSchool(id) {
    var reg = getSchoolRegistry();
    if (reg.length <= 1) {
        showToast('❌ At least one school must remain.', 'warning');
        return;
    }
    var school = null;
    for (var i = 0; i < reg.length; i++) {
        if (reg[i].id === id) { school = reg[i]; break; }
    }
    if (!school) return;
    if (!confirm('Delete "' + school.name + '"? It will no longer appear on the website. Its saved data will remain in this browser until cleared.')) return;
    var newReg = reg.filter(function(s) { return s.id !== id; });
    saveSchoolRegistry(newReg);
    if (getCurrentSchoolId() === id) {
        try { localStorage.setItem('sfaCurrentSchoolId', newReg[0].id); } catch (e) {}
    }
    loadSchoolManager();
    showToast('✅ School "' + school.name + '" deleted.', 'success');
}

function switchToSchool(id) {
    if (!id) return;
    var reg = getSchoolRegistry();
    var found = false;
    for (var i = 0; i < reg.length; i++) {
        if (reg[i].id === id) { found = true; break; }
    }
    if (!found) return;
    switchSchool(id);
}

// ================================================================
// USER MANAGEMENT (Super Admin)
// ================================================================

function loadUserManage() {
    var sel = document.getElementById('umSchoolSelect');
    if (!sel) return;
    var reg = getSchoolRegistry();
    if (!sel.options.length) {
        var opts = '';
        for (var i = 0; i < reg.length; i++) {
            opts += '<option value="' + escapeHtml(reg[i].id) + '">' + escapeHtml(reg[i].name) + '</option>';
        }
        sel.innerHTML = opts;
        sel.value = getCurrentSchoolId();
    }
    var schoolId = sel.value || getCurrentSchoolId();

    var principal = schoolGet(schoolId, 'sfaPrincipalAuth', { email: 'principal@stfrancis.edu', password: 'admin123', enabled: true });
    var accountant = schoolGet(schoolId, 'sfaAccountantAuth', { email: 'accounts@stfrancis.edu', password: 'account123', enabled: true });
    document.getElementById('umAdminLogins').innerHTML =
        '<div class="sa-user-row"><span>👑 Principal</span><strong>' + escapeHtml(principal.email) + '</strong>' +
        '<span class="badge ' + (principal.enabled === false ? 'badge-danger' : 'badge-success') + '">' + (principal.enabled === false ? 'Disabled' : 'Enabled') + '</span>' +
        '<button type="button" class="btn ' + (principal.enabled === false ? 'btn-success' : 'btn-dark') + ' btn-sm" onclick="umToggleAdminEnabled(\'' + schoolId + '\',\'sfaPrincipalAuth\')">' + (principal.enabled === false ? '▶️ Enable' : '⏸️ Disable') + '</button></div>' +
        '<div class="sa-user-row"><span>💰 Accountant</span><strong>' + escapeHtml(accountant.email) + '</strong>' +
        '<span class="badge ' + (accountant.enabled === false ? 'badge-danger' : 'badge-success') + '">' + (accountant.enabled === false ? 'Disabled' : 'Enabled') + '</span>' +
        '<button type="button" class="btn ' + (accountant.enabled === false ? 'btn-success' : 'btn-dark') + ' btn-sm" onclick="umToggleAdminEnabled(\'' + schoolId + '\',\'sfaAccountantAuth\')">' + (accountant.enabled === false ? '▶️ Enable' : '⏸️ Disable') + '</button></div>';

    var teachers = schoolGet(schoolId, 'sfaTeachers', []);
    var tList = document.getElementById('umTeacherList');
    if (!teachers.length) {
        tList.innerHTML = '<p style="color:var(--text-secondary);font-size:12px;">No teachers in this school yet.</p>';
    } else {
        var thtml = '';
        for (var t = 0; t < teachers.length; t++) {
            var tc = teachers[t];
            thtml += '<div class="sa-user-row" style="flex-wrap:wrap;gap:8px;"><span>👨‍🏫</span>' +
                '<div style="flex:1;min-width:150px;"><strong>' + escapeHtml(tc.name) + '</strong><div style="font-size:11px;color:var(--text-secondary);">ID: ' + escapeHtml(tc.employeeId) + '</div></div>' +
                '<span class="badge ' + (tc.enabled === false ? 'badge-danger' : 'badge-success') + '">' + (tc.enabled === false ? 'Disabled' : 'Enabled') + '</span>' +
                '<button type="button" class="btn ' + (tc.enabled === false ? 'btn-success' : 'btn-dark') + ' btn-sm" onclick="umToggleTeacherEnabled(\'' + schoolId + '\',' + tc.id + ')">' + (tc.enabled === false ? '▶️ Enable' : '⏸️ Disable') + '</button>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="umResetTeacherPassword(\'' + schoolId + '\',' + tc.id + ')">🔑 Reset Password</button></div>';
        }
        tList.innerHTML = thtml;
    }

    var students = schoolGet(schoolId, 'sfaStudents', []);
    var sList = document.getElementById('umStudentList');
    if (!students.length) {
        sList.innerHTML = '<p style="color:var(--text-secondary);font-size:12px;">No students in this school yet.</p>';
    } else {
        var shtml = '';
        for (var s = 0; s < students.length; s++) {
            var st = students[s];
            shtml += '<div class="sa-user-row" style="flex-wrap:wrap;gap:8px;"><span>👨‍🎓</span>' +
                '<div style="flex:1;min-width:150px;"><strong>' + escapeHtml(st.name) + '</strong><div style="font-size:11px;color:var(--text-secondary);">Adm No: ' + escapeHtml(st.admissionNo) + '</div></div>' +
                '<span class="badge ' + (st.enabled === false ? 'badge-danger' : 'badge-success') + '">' + (st.enabled === false ? 'Disabled' : 'Enabled') + '</span>' +
                '<button type="button" class="btn ' + (st.enabled === false ? 'btn-success' : 'btn-dark') + ' btn-sm" onclick="umToggleStudentEnabled(\'' + schoolId + '\',' + st.id + ')">' + (st.enabled === false ? '▶️ Enable' : '⏸️ Disable') + '</button>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="umResetStudentPassword(\'' + schoolId + '\',' + st.id + ')">🔑 Reset Password</button></div>';
        }
        sList.innerHTML = shtml;
    }
}

function umSaveAccount() {
    var sel = document.getElementById('umSchoolSelect');
    var schoolId = sel.value;
    var role = document.getElementById('umRole').value;
    var idVal = document.getElementById('umNewId').value.trim();
    var pwdVal = document.getElementById('umNewPwd').value.trim();
    if (!idVal || !pwdVal) { showToast('❌ Please enter both ID and password.', 'warning'); return; }
    if (pwdVal.length < 6) { showToast('❌ Password must be at least 6 characters.', 'warning'); return; }
    var key = role === 'principal' ? 'sfaPrincipalAuth' : 'sfaAccountantAuth';
    schoolSet(schoolId, key, { email: idVal, password: pwdVal, enabled: true });
    document.getElementById('umNewId').value = '';
    document.getElementById('umNewPwd').value = '';
    loadUserManage();
    showToast('✅ ' + (role === 'principal' ? 'Principal' : 'Accountant') + ' account saved!', 'success');
}

function umToggleAdminEnabled(schoolId, key) {
    var creds = schoolGet(schoolId, key, {});
    creds.enabled = creds.enabled === false ? true : false;
    schoolSet(schoolId, key, creds);
    loadUserManage();
    showToast(creds.enabled ? '▶️ Account enabled.' : '⏸️ Account disabled.', 'success');
}

function umToggleTeacherEnabled(schoolId, teacherId) {
    var teachers = schoolGet(schoolId, 'sfaTeachers', []);
    var t = null;
    for (var i = 0; i < teachers.length; i++) {
        if (teachers[i].id === teacherId) { t = teachers[i]; break; }
    }
    if (!t) return;
    t.enabled = t.enabled === false ? true : false;
    schoolSet(schoolId, 'sfaTeachers', teachers);
    if (schoolId === getCurrentSchoolId()) State.teachers = teachers;
    loadUserManage();
    showToast(t.enabled ? '▶️ Teacher enabled.' : '⏸️ Teacher disabled.', 'success');
}

function umResetTeacherPassword(schoolId, teacherId) {
    var teachers = schoolGet(schoolId, 'sfaTeachers', []);
    var t = null;
    for (var i = 0; i < teachers.length; i++) {
        if (teachers[i].id === teacherId) { t = teachers[i]; break; }
    }
    if (!t) return;
    var newPwd = prompt('New password for ' + t.name + ' (leave blank to reset to default "teacher123"):', '');
    if (newPwd === null) return;
    t.password = newPwd.trim() || null;
    schoolSet(schoolId, 'sfaTeachers', teachers);
    if (schoolId === getCurrentSchoolId()) State.teachers = teachers;
    showToast('🔑 Password reset for ' + t.name + '.', 'success');
}

function umToggleStudentEnabled(schoolId, studentId) {
    var students = schoolGet(schoolId, 'sfaStudents', []);
    var s = null;
    for (var i = 0; i < students.length; i++) {
        if (students[i].id === studentId) { s = students[i]; break; }
    }
    if (!s) return;
    s.enabled = s.enabled === false ? true : false;
    schoolSet(schoolId, 'sfaStudents', students);
    if (schoolId === getCurrentSchoolId()) State.students = students;
    loadUserManage();
    showToast(s.enabled ? '▶️ Student enabled.' : '⏸️ Student disabled.', 'success');
}

function umResetStudentPassword(schoolId, studentId) {
    var students = schoolGet(schoolId, 'sfaStudents', []);
    var s = null;
    for (var i = 0; i < students.length; i++) {
        if (students[i].id === studentId) { s = students[i]; break; }
    }
    if (!s) return;
    var newPwd = prompt('New password for ' + s.name + ' (leave blank to reset to default: date of birth):', '');
    if (newPwd === null) return;
    s.loginPasswordOverride = newPwd.trim() || null;
    schoolSet(schoolId, 'sfaStudents', students);
    if (schoolId === getCurrentSchoolId()) State.students = students;
    showToast('🔑 Password reset for ' + s.name + '.', 'success');
}

// ================================================================
// DATA MANAGEMENT (Super Admin)
// ================================================================

function collectAllData() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = localStorage.getItem(k);
        if (v === null) continue;
        try { data[k] = JSON.parse(v); } catch (e) { data[k] = v; }
    }
    return data;
}

function restoreAllData(payload) {
    var data = (payload && payload.data && typeof payload.data === 'object') ? payload.data : payload;
    if (!data || typeof data !== 'object') throw new Error('Invalid server/backup data.');
    var count = 0;
    for (var k in data) {
        if (k === 'app' || k === 'version' || k === 'exportedAt') continue;
        try { localStorage.setItem(k, JSON.stringify(data[k])); count++; } catch (e) {}
    }
    return count;
}

function exportAllData() {
    var blob = new Blob([JSON.stringify({ app: 'sfas-school', version: 6.1, exportedAt: new Date().toISOString(), data: collectAllData() }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'SFAS_Backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('📥 Backup downloaded successfully!', 'success');
}

function importAllData(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        try {
            var parsed = JSON.parse(ev.target.result);
            var count = restoreAllData(parsed);
            showToast('✅ Restored ' + count + ' data entries. Reloading...', 'success');
            setTimeout(function() { location.reload(); }, 1200);
        } catch (e) {
            showToast('❌ Import failed: ' + e.message, 'warning');
        }
        input.value = '';
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (!confirm('Reset THIS school\'s data to the default demo data? This cannot be undone. (Other schools are not affected.)')) return;
    var keys = ['sfaStudents', 'sfaTeachers', 'sfaFees', 'sfaTeacherAttendance', 'sfaStudentAttendance', 'sfaQRCodes', 'sfaNotices', 'sfaMarks', 'sfaAdmissionFees', 'sfaReAdmissionFees', 'sfaHomework', 'sfaHomeworkViews', 'sfaukgApplications', 'sfageneralApplications', 'sfaSchoolSettings', 'sfaMarkSettings', 'sfaMarkPermissions'];
    for (var i = 0; i < keys.length; i++) {
        localStorage.removeItem(Storage.scope(keys[i]));
    }
    showToast('🔄 Data reset to demo. Reloading...', 'success');
    setTimeout(function() { location.reload(); }, 1200);
}

function clearAllData() {
    if (!confirm('⚠️ DELETE ALL of THIS school\'s data permanently? This cannot be undone. (Other schools are not affected.)')) return;
    var keys = ['sfaStudents', 'sfaTeachers', 'sfaFees', 'sfaTeacherAttendance', 'sfaStudentAttendance', 'sfaQRCodes', 'sfaNotices', 'sfaMarks', 'sfaAdmissionFees', 'sfaReAdmissionFees', 'sfaHomework', 'sfaHomeworkViews', 'sfaukgApplications', 'sfageneralApplications', 'sfaSchoolSettings', 'sfaMarkSettings', 'sfaMarkPermissions'];
    for (var i = 0; i < keys.length; i++) {
        localStorage.removeItem(Storage.scope(keys[i]));
    }
    showToast('🗑️ All data cleared. Reloading...', 'success');
    setTimeout(function() { location.reload(); }, 1200);
}

// ================================================================
// SERVER SETTINGS & SYNC
// ================================================================

var SERVER_SETTINGS_KEY = 'sfaServerSettings';

function getServerSettings() {
    return Storage.get(SERVER_SETTINGS_KEY, { url: '', token: '' });
}

function currentServerSettings() {
    var urlEl = document.getElementById('serverUrl');
    var tokenEl = document.getElementById('serverToken');
    return {
        url: (urlEl ? urlEl.value : '').trim(),
        token: (tokenEl ? tokenEl.value : '').trim()
    };
}

function saveServerSettings() {
    var s = currentServerSettings();
    if (!s.url) {
        setServerStatus('offline', 'No server URL configured.');
        return;
    }
    Storage.set(SERVER_SETTINGS_KEY, { url: s.url, token: s.token });
    showToast('💾 Server settings saved!', 'success');
}

function loadServerSettings() {
    var s = getServerSettings();
    var urlEl = document.getElementById('serverUrl');
    var tokenEl = document.getElementById('serverToken');
    if (urlEl) urlEl.value = s.url || '';
    if (tokenEl) tokenEl.value = s.token || '';
    if (s.url) {
        checkServerConnection();
    } else {
        setServerStatus('offline', 'No server URL configured.');
    }
}

function setServerStatus(mode, text) {
    var row = document.getElementById('serverStatusRow');
    var light = document.getElementById('serverStatusLight');
    var label = document.getElementById('serverStatusText');
    var cls = 'status-light ' + (mode === 'connecting' ? 'yellow' : mode === 'connected' ? 'green' : 'red');
    if (row && light && label) {
        row.style.display = 'flex';
        light.className = cls;
        label.textContent = text || '';
    }
    var hLight = document.getElementById('headerServerStatusLight');
    var hLabel = document.getElementById('headerServerStatusText');
    if (hLight && hLabel) {
        hLight.className = cls;
        hLabel.textContent = mode === 'connected' ? 'Server Online' : mode === 'connecting' ? 'Connecting...' : 'Server Offline';
    }
    var ptEl = document.getElementById('ptServerStatus');
    if (ptEl) {
        ptEl.textContent = mode === 'connected' ? '🟢 Connected' : mode === 'connecting' ? '🟡 Connecting' : (getServerSettings().url ? '🔴 Offline' : '⚪ Not Configured');
    }
}

var serverPollTimer = null;

async function checkServerConnection() {
    var s = currentServerSettings();
    if (!s.url) {
        setServerStatus('offline', 'No server URL configured.');
        showToast('❌ Please enter a server URL first.', 'warning');
        return;
    }
    Storage.set(SERVER_SETTINGS_KEY, { url: s.url, token: s.token });
    setServerStatus('connecting', 'Trying to connect to server...');
    try {
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, 8000);
        var headers = {};
        if (s.token) headers['Authorization'] = 'Bearer ' + s.token;
        var res = await fetch(s.url, { method: 'GET', headers: headers, signal: controller.signal });
        clearTimeout(timer);
        setServerStatus('connected', 'Connected to server (HTTP ' + res.status + ').');
        showToast('🟢 Server connection OK!', 'success');
    } catch (e) {
        setServerStatus('offline', 'Server offline or unreachable: ' + (e.name === 'AbortError' ? 'timed out' : e.message));
        showToast('🔴 Server offline: ' + (e.name === 'AbortError' ? 'timed out' : e.message), 'danger');
    }
}

async function syncPush() {
    var s = currentServerSettings();
    if (!s.url) {
        setServerStatus('offline', 'No server URL configured.');
        showToast('❌ Please configure the server URL first.', 'warning');
        return;
    }
    Storage.set(SERVER_SETTINGS_KEY, { url: s.url, token: s.token });
    setServerStatus('connecting', 'Pushing data to server...');
    try {
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, 15000);
        var headers = { 'Content-Type': 'application/json' };
        if (s.token) headers['Authorization'] = 'Bearer ' + s.token;
        var res = await fetch(s.url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ app: 'sfas-school', version: 6.1, exportedAt: new Date().toISOString(), data: collectAllData() }),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error('Server responded HTTP ' + res.status);
        setServerStatus('connected', 'Data pushed to server at ' + new Date().toLocaleTimeString() + '.');
        showToast('📤 Data pushed to server successfully!', 'success');
    } catch (e) {
        setServerStatus('offline', 'Push failed: ' + (e.name === 'AbortError' ? 'timed out' : e.message));
        showToast('🔴 Push failed: ' + (e.name === 'AbortError' ? 'timed out' : e.message), 'danger');
    }
}

async function syncPull() {
    var s = currentServerSettings();
    if (!s.url) {
        setServerStatus('offline', 'No server URL configured.');
        showToast('❌ Please configure the server URL first.', 'warning');
        return;
    }
    if (!confirm('Pull data from server? This will overwrite ALL local data for every school.')) return;
    setServerStatus('connecting', 'Pulling data from server...');
    try {
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, 15000);
        var headers = {};
        if (s.token) headers['Authorization'] = 'Bearer ' + s.token;
        var res = await fetch(s.url, { method: 'GET', headers: headers, signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('Server responded HTTP ' + res.status);
        var payload = await res.json();
        var count = restoreAllData(payload);
        setServerStatus('connected', 'Pulled ' + count + ' entries from server at ' + new Date().toLocaleTimeString() + '.');
        showToast('📥 Data pulled (' + count + ' entries). Reloading...', 'success');
        setTimeout(function() { location.reload(); }, 1200);
    } catch (e) {
        setServerStatus('offline', 'Pull failed: ' + (e.name === 'AbortError' ? 'timed out' : e.message));
        showToast('🔴 Pull failed: ' + (e.name === 'AbortError' ? 'timed out' : e.message), 'danger');
    }
}

// ================================================================
// ONLINE PRESENCE
// ================================================================

var ONLINE_SESSIONS_KEY = 'sfaOnlineSessions';
var ONLINE_TIMEOUT_MS = 90 * 1000;
var heartbeatTimer = null;
var onlineStatusTimer = null;

function getOnlineSessions() {
    return Storage.get(ONLINE_SESSIONS_KEY, {});
}

function sessionKeyForCurrentUser() {
    var u = State.currentUser;
    if (!u) return null;
    if (u.type === 'admin') return 'principal';
    if (u.type === 'teacher') return 'teacher-' + u.id;
    if (u.type === 'student') return 'student-' + u.id;
    return null;
}

function markOnline() {
    var key = sessionKeyForCurrentUser();
    if (!key) return;
    var sessions = getOnlineSessions();
    sessions[key] = { type: State.currentUser.type, name: State.currentUser.name, lastActive: Date.now() };
    Storage.set(ONLINE_SESSIONS_KEY, sessions);
}

function markOffline() {
    var key = sessionKeyForCurrentUser();
    if (!key) return;
    var sessions = getOnlineSessions();
    delete sessions[key];
    Storage.set(ONLINE_SESSIONS_KEY, sessions);
}

function getOnlineCounts() {
    var sessions = getOnlineSessions();
    var now = Date.now();
    var counts = { admin: 0, teacher: 0, student: 0 };
    var changed = false;
    for (var k in sessions) {
        var s = sessions[k];
        if (now - (s.lastActive || 0) > ONLINE_TIMEOUT_MS) {
            delete sessions[k];
            changed = true;
        } else if (counts[s.type] !== undefined) {
            counts[s.type]++;
        }
    }
    if (changed) Storage.set(ONLINE_SESSIONS_KEY, sessions);
    return counts;
}

function renderOnlineStatus() {
    var counts = getOnlineCounts();
    var pEl = document.getElementById('saOnlinePrincipal');
    var tEl = document.getElementById('saOnlineTeachers');
    var sEl = document.getElementById('saOnlineStudents');
    if (pEl) pEl.textContent = counts.admin;
    if (tEl) tEl.textContent = counts.teacher;
    if (sEl) sEl.textContent = counts.student;
}

function startHeartbeat() {
    stopHeartbeat();
    markOnline();
    heartbeatTimer = setInterval(markOnline, 30 * 1000);
}

function stopHeartbeat() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function startOnlineStatusPolling() {
    stopOnlineStatusPolling();
    renderOnlineStatus();
    onlineStatusTimer = setInterval(renderOnlineStatus, 15 * 1000);
}

function stopOnlineStatusPolling() {
    if (onlineStatusTimer) { clearInterval(onlineStatusTimer); onlineStatusTimer = null; }
}

// ================================================================
// WEB APP DOWNLOAD
// ================================================================

var deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredInstallPrompt = e;
});
window.addEventListener('appinstalled', function() {
    deferredInstallPrompt = null;
    try { showToast('✅ App installed successfully!'); } catch (err) {}
});

function schoolFileSlug() {
    var name = (State.schoolSettings && State.schoolSettings.schoolName) || 'School';
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'school';
}

function downloadWebApp() {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function(choice) {
            if (choice && choice.outcome === 'dismissed') deferredInstallPrompt = null;
        }).catch(function() { deferredInstallPrompt = null; });
        return;
    }
    var a = document.createElement('a');
    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    a.href = URL.createObjectURL(blob);
    a.download = schoolFileSlug() + '_WebApp.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast('📥 Web app downloaded! Open index.html in any browser.', 'success');
}

function downloadDesktopApp() {
    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    var mainJs =
        "const { app, BrowserWindow, Menu, shell } = require('electron');\n" +
        "const path = require('path');\n\n" +
        "function createWindow() {\n" +
        "    const win = new BrowserWindow({\n" +
        "        width: 1280,\n" +
        "        height: 800,\n" +
        "        autoHideMenuBar: true,\n" +
        "        webPreferences: { nodeIntegration: false, contextIsolation: true }\n" +
        "    });\n" +
        "    win.loadFile('index.html');\n" +
        "    win.webContents.setWindowOpenHandler(function ({ url }) {\n" +
        "        shell.openExternal(url);\n" +
        "        return { action: 'deny' };\n" +
        "    });\n" +
        "}\n\n" +
        "app.whenReady().then(function () {\n" +
        "    Menu.setApplicationMenu(null);\n" +
        "    createWindow();\n" +
        "    app.on('activate', function () {\n" +
        "        if (BrowserWindow.getAllWindows().length === 0) createWindow();\n" +
        "    });\n" +
        "});\n\n" +
        "app.on('window-all-closed', function () {\n" +
        "    if (process.platform !== 'darwin') app.quit();\n" +
        "});";
    var pkgJson = JSON.stringify({
        name: schoolFileSlug() + '-desktop',
        version: '6.0.0',
        description: (State.schoolSettings && State.schoolSettings.schoolName || 'School') + ' - Complete System',
        main: 'main.js',
        scripts: { start: 'electron .' },
        devDependencies: { electron: '^31.0.0' }
    }, null, 2);
    var readme =
        (State.schoolSettings && State.schoolSettings.schoolName || 'School') +
        ' - Desktop App\n=======================\n\n1) Install Node.js from https://nodejs.org\n2) In this folder run:  npm install\n3) Start the app with:  npm start\n\nTo build a standalone Windows .exe run:\n   npx electron-packager . ' + schoolFileSlug() + ' --platform=win32 --arch=x64\n';
    var files = [
        { name: 'index.html', data: stringToUint8(html) },
        { name: 'main.js', data: stringToUint8(mainJs) },
        { name: 'package.json', data: stringToUint8(pkgJson) },
        { name: 'README.txt', data: stringToUint8(readme) }
    ];

    try {
        var zip = makeZip(files);
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
        a.download = schoolFileSlug() + '_Desktop.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast('📥 Desktop package downloaded! Unzip, then: npm install && npm start', 'success');
    } catch (e) {
        showToast('⚠️ Could not create desktop package.', 'error');
    }
}

function stringToUint8(str) {
    var buf = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
    return buf;
}

function makeZip(files) {
    var chunks = [];
    var central = [];
    var offset = 0;
    var now = new Date();
    var dosTime = function(d) { return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF; };
    var dosDate = function(d) { return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF; };

    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var name = stringToUint8(f.name);
        var data = f.data;
        var crc = crc32(data);

        var local = new ArrayBuffer(30);
        var lv = new DataView(local);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0, true);
        lv.setUint16(8, 0, true);
        lv.setUint16(10, dosTime(now), true);
        lv.setUint16(12, dosDate(now), true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true);
        chunks.push(new Uint8Array(local), name, data);

        var cbuf = new ArrayBuffer(46);
        var cv = new DataView(cbuf);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, dosTime(now), true);
        cv.setUint16(14, dosDate(now), true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true);
        cv.setUint32(42, offset, true);
        central.push(new Uint8Array(cbuf), name);
        offset += 30 + name.length + data.length;
    }

    var centralSize = 0;
    for (var c = 0; c < central.length; c++) centralSize += central[c].length;

    var end = new ArrayBuffer(22);
    var ev = new DataView(end);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    var all = new Uint8Array(offset + centralSize + 22);
    var pos = 0;
    for (var ci = 0; ci < chunks.length; ci++) { all.set(chunks[ci], pos); pos += chunks[ci].length; }
    for (var cj = 0; cj < central.length; cj++) { all.set(central[cj], pos); pos += central[cj].length; }
    all.set(new Uint8Array(end), pos);
    return all;
}

function crc32(buf) {
    var table = crc32.table;
    if (!table) {
        table = [];
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        crc32.table = table;
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ================================================================
// INIT
// ================================================================

try { initDefaultData(); } catch (e) { console.error('initDefaultData error:', e); }

var savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

try { applySchoolSettings(); } catch (e) { console.error('applySchoolSettings error:', e); }
window.addEventListener('beforeunload', function() { try { markOffline(); } catch (e) {} });

populateReligionSelects();

console.log('✅ St. Francis of Assisi School - Complete System');
console.log('📚 Version: 6.1 - All Features Integrated');
console.log('👥 Students:', State.students.length);
console.log('👨‍🏫 Teachers:', State.teachers.length);
console.log('📝 Homework:', State.homework.length);
console.log('🎒 UKG Applications:', State.ukgApplications.length);
console.log('📚 General Applications:', State.generalApplications.length);

// Live preview on input
document.addEventListener('input', function(e) {
    if (e.target.closest && e.target.closest('#schoolSettingsForm')) {
        updateSettingsPreview();
    }
});