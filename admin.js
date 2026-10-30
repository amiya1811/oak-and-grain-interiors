/* ============================================================================
   OAK & GRAIN INTERIORS — PRIVATE ADMIN PORTAL LOGIC
   Strictly enforced access, real-time Supabase data, activity tracking.
   ============================================================================ */

// 1. Authorized Studio Administrators Whitelist
const AUTHORIZED_ADMIN_EMAILS = [
  'amit@oakandgrain.in',
  'studio@oakandgrain.in',
  'manager@oakandgrain.in'
];

// 2. Global State
let currentSession = null;
let currentAdminUser = null;
let allEnquiries = [];
let filteredEnquiries = [];
let activeStatusFilter = 'all';
let searchQuery = '';
let sortOrder = 'newest';
let selectedEnquiryForModal = null;
let selectedEnquiryForDelete = null;

// Helper: Toast alerts
function showToast(message, type = 'normal') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast active' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
  setTimeout(() => {
    toast.className = 'toast';
  }, 4500);
}

// Helper: Format Date & Time
function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}

// Helper: Clean phone number for links
function cleanPhoneForCall(phoneStr) {
  if (!phoneStr) return '';
  return phoneStr.replace(/[^0-9+]/g, '');
}

function cleanPhoneForWhatsApp(phoneStr) {
  if (!phoneStr) return '';
  const digits = phoneStr.replace(/[^0-9]/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// AUTHENTICATION CONTROLLER
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initAuthAndViews();
});

function initAuthAndViews() {
  const configNotice = document.getElementById('configNotice');
  const authContainer = document.getElementById('authContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');
  const authAlert = document.getElementById('authAlert');

  // Check Supabase Configuration
  const configured = typeof isSupabaseConfigured === 'function' && isSupabaseConfigured();
  if (!configured && configNotice) {
    configNotice.style.display = 'block';
  }

  const client = typeof getSupabase === 'function' ? getSupabase() : null;

  // View toggle elements
  const loginForm = document.getElementById('loginForm');
  const forgotForm = document.getElementById('forgotForm');
  const recoveryForm = document.getElementById('recoveryForm');
  const showForgotBtn = document.getElementById('showForgotBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');

  if (showForgotBtn) {
    showForgotBtn.addEventListener('click', () => {
      loginForm.style.display = 'none';
      forgotForm.style.display = 'block';
      recoveryForm.style.display = 'none';
      if (authAlert) authAlert.style.display = 'none';
    });
  }

  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
      forgotForm.style.display = 'none';
      loginForm.style.display = 'block';
      recoveryForm.style.display = 'none';
      if (authAlert) authAlert.style.display = 'none';
    });
  }

  // Check URL hash for Password Recovery flow
  if (window.location.hash && window.location.hash.includes('type=recovery')) {
    loginForm.style.display = 'none';
    forgotForm.style.display = 'none';
    recoveryForm.style.display = 'block';
    showToast('Password recovery session detected. Please enter your new password.');
  }

  // Handle Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const btn = document.getElementById('loginBtn');
      const btnText = document.getElementById('loginBtnText');

      if (!configured || !client) {
        showAuthAlert('Supabase is not configured yet. Please paste your Supabase Project URL and Anon Key into supabase-config.js.');
        return;
      }

      // Pre-check whitelist before network call
      if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        showAuthAlert('Access Denied: This email is not on the authorised studio administrator whitelist.');
        return;
      }

      try {
        btn.disabled = true;
        btnText.textContent = 'Authenticating...';
        if (authAlert) authAlert.style.display = 'none';

        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        // Verify authorized email
        const userEmail = (data.user?.email || '').toLowerCase();
        if (!AUTHORIZED_ADMIN_EMAILS.includes(userEmail)) {
          await client.auth.signOut();
          throw new Error('Access Denied: Your account is not authorised for admin access.');
        }

        // Log admin login
        if (typeof logActivity === 'function') {
          await logActivity('Admin login', `Admin logged in: ${userEmail}`, { email: userEmail });
        }

        showToast('Signed in successfully as ' + userEmail, 'success');
        switchToDashboard(data.session, data.user);

      } catch (err) {
        console.error('Login error:', err);
        showAuthAlert(err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        btn.disabled = false;
        btnText.textContent = 'Sign In ↗';
      }
    });
  }

  // Handle Forgot Password submission
  if (forgotForm) {
    forgotForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
      const btn = document.getElementById('forgotBtn');
      const btnText = document.getElementById('forgotBtnText');

      if (!configured || !client) {
        showAuthAlert('Supabase is not configured yet. Please configure supabase-config.js.');
        return;
      }

      if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        showAuthAlert('If this is an authorised administrator email, a password reset link has been dispatched.');
        return;
      }

      try {
        btn.disabled = true;
        btnText.textContent = 'Sending Link...';
        const redirectUrl = window.location.origin + window.location.pathname;

        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });

        if (error) throw error;

        showAuthAlert('Password reset email sent! Please check your inbox and click the recovery link.', 'success');
      } catch (err) {
        console.error('Forgot password error:', err);
        showAuthAlert(err.message || 'Unable to send password reset email.');
      } finally {
        btn.disabled = false;
        btnText.textContent = 'Send Reset Link ↗';
      }
    });
  }

  // Handle Set New Password submission (Recovery flow)
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', async e => {
      e.preventDefault();
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const btn = document.getElementById('recoveryBtn');
      const btnText = document.getElementById('recoveryBtnText');

      if (newPassword.length < 6) {
        showAuthAlert('Password must be at least 6 characters long.');
        return;
      }

      if (newPassword !== confirmPassword) {
        showAuthAlert('Passwords do not match. Please re-enter.');
        return;
      }

      try {
        btn.disabled = true;
        btnText.textContent = 'Updating...';

        const { data, error } = await client.auth.updateUser({ password: newPassword });
        if (error) throw error;

        showToast('Password updated successfully! Redirecting...', 'success');
        recoveryForm.style.display = 'none';
        
        // Log activity
        if (typeof logActivity === 'function') {
          await logActivity('Admin password reset', `Password updated for admin: ${data.user?.email}`);
        }

        switchToDashboard(null, data.user);
      } catch (err) {
        console.error('Password update error:', err);
        showAuthAlert(err.message || 'Failed to update password.');
      } finally {
        btn.disabled = false;
        btnText.textContent = 'Update Password & Login ↗';
      }
    });
  }

  // Handle Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (client) {
        await client.auth.signOut();
      }
      currentSession = null;
      currentAdminUser = null;
      showToast('You have been signed out.');
      switchToLogin();
    });
  }

  // Listen to Supabase Auth State changes
  if (client) {
    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        loginForm.style.display = 'none';
        forgotForm.style.display = 'none';
        recoveryForm.style.display = 'block';
        return;
      }

      if (session && session.user) {
        const email = (session.user.email || '').toLowerCase();
        if (AUTHORIZED_ADMIN_EMAILS.includes(email)) {
          switchToDashboard(session, session.user);
        } else {
          await client.auth.signOut();
          showAuthAlert('Access Denied: Your account is not on the approved studio admin whitelist.');
          switchToLogin();
        }
      } else {
        switchToLogin();
      }
    });
  }
}

function showAuthAlert(msg, type = 'error') {
  const alertEl = document.getElementById('authAlert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.className = 'auth-alert' + (type === 'success' ? ' success' : '');
  alertEl.style.display = 'block';
}

function switchToDashboard(session, user) {
  currentSession = session;
  currentAdminUser = user;

  const authContainer = document.getElementById('authContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');
  const userEmailBadge = document.getElementById('userEmailBadge');

  if (authContainer) authContainer.style.display = 'none';
  if (dashboardContainer) dashboardContainer.style.display = 'block';
  if (userEmailBadge && user) userEmailBadge.textContent = user.email;

  // Load dashboard data
  loadDashboardData();
  setupDashboardControls();
}

function switchToLogin() {
  const authContainer = document.getElementById('authContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');

  if (authContainer) authContainer.style.display = 'flex';
  if (dashboardContainer) dashboardContainer.style.display = 'none';
}

// ============================================================================
// DASHBOARD DATA FETCHING & UI RENDERING
// ============================================================================
async function loadDashboardData() {
  const client = typeof getSupabase === 'function' ? getSupabase() : null;
  const tbody = document.getElementById('enquiriesTableBody');
  const resultsCount = document.getElementById('resultsCount');

  if (!client) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Supabase client is not available. Please verify credentials in supabase-config.js.</td></tr>';
    return;
  }

  try {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Fetching enquiries from Supabase...</td></tr>';
    if (resultsCount) resultsCount.textContent = 'Loading...';

    // Fetch live enquiries from database
    const { data, error } = await client
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch enquiries error:', error);
      throw error;
    }

    allEnquiries = data || [];
    updateKpis();
    applyFiltersAndRender();

    // Also load activity logs in background
    loadActivityLogs();

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-loading" style="color:var(--danger)">Failed to load enquiries: ${escapeHtml(err.message || 'Database error')}. Please ensure Row Level Security policies are executed.</td></tr>`;
    }
    showToast('Failed to load enquiries: ' + (err.message || 'Error'), 'error');
  }
}

// Calculate and update KPI metric cards
function updateKpis() {
  const total = allEnquiries.length;
  const countNew = allEnquiries.filter(e => e.status === 'New').length;
  const countContacted = allEnquiries.filter(e => e.status === 'Contacted').length;
  const countCompleted = allEnquiries.filter(e => e.status === 'Completed').length;

  const kpiTotal = document.getElementById('kpiTotal');
  const kpiNew = document.getElementById('kpiNew');
  const kpiContacted = document.getElementById('kpiContacted');
  const kpiCompleted = document.getElementById('kpiCompleted');

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiNew) kpiNew.textContent = countNew;
  if (kpiContacted) kpiContacted.textContent = countContacted;
  if (kpiCompleted) kpiCompleted.textContent = countCompleted;
}

// Apply Search, Status Filter & Sorting
function applyFiltersAndRender() {
  let list = [...allEnquiries];

  // 1. Filter by Status
  if (activeStatusFilter !== 'all') {
    list = list.filter(e => e.status === activeStatusFilter);
  }

  // 2. Search Query filter (name, phone, email, service, message)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(e => 
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.phone && e.phone.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.service && e.service.toLowerCase().includes(q)) ||
      (e.message && e.message.toLowerCase().includes(q))
    );
  }

  // 3. Sorting
  list.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
  });

  filteredEnquiries = list;
  renderEnquiriesTable(filteredEnquiries);
}

// Render Enquiries Table
function renderEnquiriesTable(items) {
  const tbody = document.getElementById('enquiriesTableBody');
  const noResults = document.getElementById('noResults');
  const resultsCount = document.getElementById('resultsCount');

  if (!tbody) return;

  if (resultsCount) {
    resultsCount.textContent = `Showing ${items.length} of ${allEnquiries.length} enquiries`;
  }

  if (items.length === 0) {
    tbody.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    return;
  }

  if (noResults) noResults.style.display = 'none';

  tbody.innerHTML = items.map(e => {
    const callNumber = cleanPhoneForCall(e.phone);
    const waNumber = cleanPhoneForWhatsApp(e.phone);
    const waMessage = encodeURIComponent(`Hi ${e.name}, thank you for contacting Oak & Grain Interiors regarding your ${e.service} enquiry. I am Amit Singh, principal designer.`);
    const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

    return `
      <tr data-id="${escapeHtml(e.id)}">
        <td class="date-cell">${formatDateTime(e.created_at)}</td>
        <td>
          <div class="cust-name">${escapeHtml(e.name)}</div>
          <div class="cust-email">${escapeHtml(e.email || 'No email provided')}</div>
        </td>
        <td>
          <div class="phone-cell">
            <span class="phone-num">${escapeHtml(e.phone)}</span>
            <a href="tel:${callNumber}" class="action-icon-btn" title="Call customer" onclick="trackAdminCall('${escapeHtml(e.name)}')">📞</a>
            <a href="${waLink}" target="_blank" rel="noopener" class="action-icon-btn wa-icon" title="Chat on WhatsApp" onclick="trackAdminWa('${escapeHtml(e.name)}')">💬</a>
          </div>
        </td>
        <td>
          <span class="service-badge">${escapeHtml(e.service)}</span>
        </td>
        <td>
          <select class="status-inline-select status-${escapeHtml(e.status)}" data-id="${escapeHtml(e.id)}" onchange="handleInlineStatusChange(this)">
            <option value="New" ${e.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Completed" ${e.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td style="text-align:right">
          <div class="row-actions">
            <button class="btn btn-secondary btn-sm" onclick="openDetailModal('${escapeHtml(e.id)}')">View</button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${escapeHtml(e.id)}')">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Inline Status Change from Table Row
window.handleInlineStatusChange = async function(selectEl) {
  const enquiryId = selectEl.dataset.id;
  const newStatus = selectEl.value;
  const client = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!client) return;

  try {
    const { error } = await client
      .from('enquiries')
      .update({ status: newStatus })
      .eq('id', enquiryId);

    if (error) throw error;

    // Update local memory
    const item = allEnquiries.find(x => x.id === enquiryId);
    if (item) {
      const oldStatus = item.status;
      item.status = newStatus;
      selectEl.className = `status-inline-select status-${newStatus}`;
      updateKpis();

      // Log status update
      if (typeof logActivity === 'function') {
        await logActivity(
          'Enquiry status updated',
          `Status of enquiry for ${item.name} changed from ${oldStatus} to ${newStatus}`,
          { enquiryId, oldStatus, newStatus }
        );
      }
    }

    showToast(`Status updated to ${newStatus}`, 'success');
  } catch (err) {
    console.error('Update status error:', err);
    showToast('Failed to update status: ' + err.message, 'error');
  }
};

// Activity click trackers for admin call/wa buttons
window.trackAdminCall = function(customerName) {
  if (typeof logActivity === 'function') {
    logActivity('Admin call click', `Admin clicked call button for customer ${customerName} (initiates call app)`);
  }
};

window.trackAdminWa = function(customerName) {
  if (typeof logActivity === 'function') {
    logActivity('Admin WhatsApp click', `Admin opened WhatsApp chat for customer ${customerName}`);
  }
};

// ============================================================================
// ENQUIRY DETAIL MODAL
// ============================================================================
window.openDetailModal = function(id) {
  const item = allEnquiries.find(x => x.id === id);
  if (!item) return;
  selectedEnquiryForModal = item;

  const modal = document.getElementById('detailModal');
  const nameEl = document.getElementById('modalCustomerName');
  const idEl = document.getElementById('modalEnquiryId');
  const phoneEl = document.getElementById('modalPhone');
  const emailEl = document.getElementById('modalEmail');
  const serviceEl = document.getElementById('modalService');
  const dateEl = document.getElementById('modalDate');
  const msgEl = document.getElementById('modalMessage');
  const statusSelect = document.getElementById('modalStatusSelect');
  const notesEl = document.getElementById('modalNotes');

  const callBtn = document.getElementById('modalCallBtn');
  const waBtn = document.getElementById('modalWaBtn');
  const emailBtn = document.getElementById('modalEmailBtn');

  nameEl.textContent = item.name;
  idEl.textContent = `#${item.id.slice(0, 8).toUpperCase()}`;
  phoneEl.textContent = item.phone;
  emailEl.textContent = item.email || 'None provided';
  serviceEl.textContent = item.service;
  dateEl.textContent = formatDateTime(item.created_at);
  msgEl.textContent = item.message || 'No additional message provided by customer.';
  statusSelect.value = item.status;
  notesEl.value = item.notes || '';

  const cleanCall = cleanPhoneForCall(item.phone);
  const cleanWa = cleanPhoneForWhatsApp(item.phone);
  callBtn.href = `tel:${cleanCall}`;
  waBtn.href = `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${item.name}, I am Amit Singh from Oak & Grain Interiors following up on your ${item.service} enquiry.`)}`;
  emailBtn.href = item.email ? `mailto:${item.email}?subject=${encodeURIComponent('Oak & Grain Interiors — Your Project Consultation')}` : '#';
  emailBtn.style.display = item.email ? 'inline-flex' : 'none';

  modal.style.display = 'flex';
};

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
  selectedEnquiryForModal = null;
}

// Save Enquiry Changes from Modal
async function saveModalChanges() {
  if (!selectedEnquiryForModal) return;
  const client = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!client) return;

  const newStatus = document.getElementById('modalStatusSelect').value;
  const newNotes = document.getElementById('modalNotes').value.trim();
  const saveBtn = document.getElementById('saveEnquiryBtn');

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const { error } = await client
      .from('enquiries')
      .update({
        status: newStatus,
        notes: newNotes
      })
      .eq('id', selectedEnquiryForModal.id);

    if (error) throw error;

    // Update local memory
    selectedEnquiryForModal.status = newStatus;
    selectedEnquiryForModal.notes = newNotes;

    updateKpis();
    applyFiltersAndRender();
    showToast('Enquiry details saved successfully', 'success');

    if (typeof logActivity === 'function') {
      await logActivity(
        'Enquiry updated',
        `Admin updated details for enquiry: ${selectedEnquiryForModal.name}`,
        { enquiryId: selectedEnquiryForModal.id, status: newStatus }
      );
    }

    closeDetailModal();

  } catch (err) {
    console.error('Save error:', err);
    showToast('Failed to save changes: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
}

// ============================================================================
// DELETE ENQUIRY MODAL
// ============================================================================
window.openDeleteModal = function(id) {
  const item = allEnquiries.find(x => x.id === id);
  if (!item) return;
  selectedEnquiryForDelete = item;

  const modal = document.getElementById('deleteConfirmModal');
  const targetInfo = document.getElementById('deleteTargetInfo');

  targetInfo.textContent = `Customer: ${item.name} (${item.phone}) — Service: ${item.service}`;
  modal.style.display = 'flex';
};

function closeDeleteModal() {
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.style.display = 'none';
  selectedEnquiryForDelete = null;
}

async function confirmDeleteEnquiry() {
  if (!selectedEnquiryForDelete) return;
  const client = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!client) return;

  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const idToDelete = selectedEnquiryForDelete.id;
  const customerName = selectedEnquiryForDelete.name;

  try {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    const { error } = await client
      .from('enquiries')
      .delete()
      .eq('id', idToDelete);

    if (error) throw error;

    // Remove from local array
    allEnquiries = allEnquiries.filter(e => e.id !== idToDelete);

    updateKpis();
    applyFiltersAndRender();
    showToast(`Enquiry for ${customerName} has been deleted.`, 'success');

    if (typeof logActivity === 'function') {
      await logActivity(
        'Enquiry deleted',
        `Admin deleted enquiry of ${customerName}`,
        { deletedEnquiryId: idToDelete }
      );
    }

    closeDeleteModal();
    if (selectedEnquiryForModal && selectedEnquiryForModal.id === idToDelete) {
      closeDetailModal();
    }

  } catch (err) {
    console.error('Delete error:', err);
    showToast('Failed to delete enquiry: ' + err.message, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Yes, Delete Permanently';
  }
}

// ============================================================================
// ACTIVITY LOG TAB CONTROLLER
// ============================================================================
async function loadActivityLogs() {
  const client = typeof getSupabase === 'function' ? getSupabase() : null;
  const listContainer = document.getElementById('activityList');
  if (!client || !listContainer) return;

  try {
    const { data, error } = await client
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!data || data.length === 0) {
      listContainer.innerHTML = '<div class="table-loading">No activity logs recorded yet.</div>';
      return;
    }

    listContainer.innerHTML = data.map(log => `
      <div class="activity-item">
        <div class="ai-left">
          <span class="ai-type">${escapeHtml(log.event_type)}</span>
          <span class="ai-desc">${escapeHtml(log.description)}</span>
        </div>
        <div class="ai-time">${formatDateTime(log.created_at)}</div>
      </div>
    `).join('');

  } catch (err) {
    console.warn('Failed to load activity logs:', err);
    listContainer.innerHTML = `<div class="table-loading" style="color:var(--danger)">Could not load activity logs: ${escapeHtml(err.message)}</div>`;
  }
}

// ============================================================================
// DASHBOARD CONTROLS (SEARCH, FILTERS, TABS, MODAL LISTENERS)
// ============================================================================
function setupDashboardControls() {
  // Search input with debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      applyFiltersAndRender();
    });
  }

  // Status Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.filter;
      applyFiltersAndRender();
    });
  });

  // KPI card click to filter
  const kpiCards = document.querySelectorAll('.kpi-card');
  kpiCards.forEach(card => {
    card.addEventListener('click', () => {
      const status = card.dataset.status;
      if (!status) return;
      activeStatusFilter = status;
      filterBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.filter === status);
      });
      applyFiltersAndRender();
    });
  });

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      sortOrder = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Refresh Button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Refreshing data from Supabase...');
      loadDashboardData();
    });
  }

  // Navigation Tabs (Enquiries vs Activity)
  const tabBtns = document.querySelectorAll('.dash-tab');
  tabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      tabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetPaneId = tab.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) targetPane.style.display = 'block';

      if (targetPaneId === 'activityTab') {
        loadActivityLogs();
      }
    });
  });

  // Modal event listeners
  const closeDetail = document.getElementById('closeDetailModal');
  const cancelModal = document.getElementById('cancelModalBtn');
  const saveBtn = document.getElementById('saveEnquiryBtn');
  const deleteInModalBtn = document.getElementById('deleteEnquiryBtn');

  if (closeDetail) closeDetail.addEventListener('click', closeDetailModal);
  if (cancelModal) cancelModal.addEventListener('click', closeDetailModal);
  if (saveBtn) saveBtn.addEventListener('click', saveModalChanges);
  if (deleteInModalBtn) {
    deleteInModalBtn.addEventListener('click', () => {
      if (selectedEnquiryForModal) {
        openDeleteModal(selectedEnquiryForModal.id);
      }
    });
  }

  // Delete Confirmation Modal listeners
  const closeDelete = document.getElementById('closeDeleteModal');
  const cancelDelete = document.getElementById('cancelDeleteBtn');
  const confirmDelete = document.getElementById('confirmDeleteBtn');

  if (closeDelete) closeDelete.addEventListener('click', closeDeleteModal);
  if (cancelDelete) cancelDelete.addEventListener('click', closeDeleteModal);
  if (confirmDelete) confirmDelete.addEventListener('click', confirmDeleteEnquiry);
}
