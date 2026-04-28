// Configuration & State
const state = {
  currentDate: new Date(),
  language: localStorage.getItem('app-lang') || 'as',
  theme: localStorage.getItem('app-theme') || 'light',
  events: JSON.parse(localStorage.getItem('app-events') || '[]'),
  editingEventId: null
};

// Date Utilities
const ASSAMESE_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ASSAMESE_MONTHS = [
  'ব’হাগ (Bohag)', 'জেঠ (Jeth)', 'আহাৰ (Ahaar)', 'শাওণ (Saon)',
  'ভাদ (Bhado)', 'আহিন (Ahin)', 'কাতি (Kati)', 'আঘোণ (Aghon)',
  'পুহ (Puh)', 'মাঘ (Magh)', 'ফাগুন (Phagun)', 'চ’ত (Chot)'
];
const ASSAMESE_WEEKDAYS = ['দেওবাৰ', 'সোমবাৰ', 'মঙ্গলবাৰ', 'বুধবাৰ', 'বৃহস্পতিবাৰ', 'শুক্ৰবাৰ', 'শনিবাৰ'];
const ASSAMESE_WEEKDAYS_SHORT = ['দেও', 'সোম', 'মংগ', 'বুধ', 'বৃহ', 'শুক্ৰ', 'শনি'];
const ENGLISH_MONTHS = [
  'Bohag', 'Jeth', 'Ahaar', 'Saon',
  'Bhado', 'Ahin', 'Kati', 'Aghon',
  'Puh', 'Magh', 'Phagun', 'Chot'
];
const ENGLISH_WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const GREGORIAN_MONTHS_AS = [
  'জানুৱাৰী', 'ফেব্ৰুৱাৰী', 'মাৰ্চ', 'এপ্ৰিল', 'মে’', 'জুন',
  'জুলাই', 'আগষ্ট', 'ছেপ্টেম্বৰ', 'অক্টোবৰ', 'নৱেম্বৰ', 'ডিচেম্বৰ'
];

function toAssameseNumeral(num) {
  if (num === null || num === undefined) return '';
  return num.toString().split('').map(char => {
    const digit = parseInt(char, 10);
    return isNaN(digit) ? char : ASSAMESE_DIGITS[digit];
  }).join('');
}

function getAssameseDateApprox(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  const boundaries = [
    { start: 15, prevDays: 30, asMonth: 9 },  // Jan (Magh)
    { start: 14, prevDays: 29, asMonth: 10 }, // Feb (Phagun)
    { start: 16, prevDays: 30, asMonth: 11 }, // Mar (Chot)
    { start: 15, prevDays: 30, asMonth: 0 },  // Apr (Bohag)
    { start: 15, prevDays: 31, asMonth: 1 },  // May (Jeth)
    { start: 16, prevDays: 31, asMonth: 2 },  // Jun (Ahar)
    { start: 17, prevDays: 31, asMonth: 3 },  // Jul (Shaon)
    { start: 18, prevDays: 31, asMonth: 4 },  // Aug (Bhado)
    { start: 18, prevDays: 31, asMonth: 5 },  // Sep (Ahin)
    { start: 18, prevDays: 30, asMonth: 6 },  // Oct (Kati)
    { start: 17, prevDays: 30, asMonth: 7 },  // Nov (Aghun)
    { start: 16, prevDays: 30, asMonth: 8 }   // Dec (Puh)
  ];

  const isLeap = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
  let curBound = boundaries[m];
  let startDay = curBound.start;

  if (isLeap && m === 2) startDay = 15;

  let asMonthIdx = 0;
  let asDay = 1;

  if (d >= startDay) {
    asMonthIdx = curBound.asMonth;
    asDay = d - startDay + 1;
  } else {
    let prevM = m === 0 ? 11 : m - 1;
    asMonthIdx = boundaries[prevM].asMonth;
    let prevDays = boundaries[m].prevDays;
    if (isLeap && m === 2) prevDays = 30;
    asDay = d + prevDays - startDay + 1;
  }

  const asYear = y + ((m > 3 || (m === 3 && d >= 15)) ? -593 : -594);
  return { monthIndex: asMonthIdx, day: asDay, year: asYear };
}

function getAssameseFestivals(year) {
  return [
    { id: `fest-${year}-1`, name: "Rongali Bihu", nameAssamese: "ৰঙালী বিহু", gregorianDate: `${year}-04-14`, category: "festival", desc: "Assamese New Year & Spring Festival" },
    { id: `fest-${year}-2`, name: "Bihu Sanmilan", nameAssamese: "বিহু সন্মিলন", gregorianDate: `${year}-04-15`, category: "festival", desc: "Cultural celebrations across Assam" },
    { id: `fest-${year}-3`, name: "Bhogali Bihu", nameAssamese: "ভোগালী বিহু", gregorianDate: `${year}-01-14`, category: "festival", desc: "Harvest festival of Assam" },
    { id: `fest-${year}-4`, name: "Kongali Bihu", nameAssamese: "কঙালী বিহু", gregorianDate: `${year}-10-18`, category: "festival", desc: "Kati Bihu observance" },
    { id: `fest-${year}-5`, name: "Durga Puja", nameAssamese: "দুৰ্গা পূজা", gregorianDate: `${year}-10-12`, category: "festival", desc: "Major autumn festival" },
    { id: `fest-${year}-6`, name: "Diwali", nameAssamese: "দীপাৱলী", gregorianDate: `${year}-11-01`, category: "festival", desc: "Festival of Lights" },
    { id: `fest-${year}-7`, name: "Republic Day", nameAssamese: "গণৰাজ্য দিৱস", gregorianDate: `${year}-01-26`, category: "holiday", desc: "National Holiday" },
    { id: `fest-${year}-8`, name: "Independence Day", nameAssamese: "স্বাধীনতা দিৱস", gregorianDate: `${year}-08-15`, category: "holiday", desc: "National Holiday" },
  ];
}

// Localization
const i18n = {
  en: {
    'btn.today': 'Current', 'lbl.no_events': 'No highlights this month', 'lbl.today': 'Today',
    'form.title': 'Event Title', 'form.date': 'Date', 'form.time': 'Time', 'form.category': 'Category',
    'form.desc': 'Description', 'form.notify': 'Enable Notifications',
    'toast.created': 'Event created', 'toast.updated': 'Event updated', 'toast.deleted': 'Event deleted'
  },
  as: {
    'btn.today': 'বৰ্তমান', 'lbl.no_events': 'এই মাহত কোনো বিশেষ দিন নাই', 'lbl.today': 'আজি',
    'form.title': 'শিৰোনাম', 'form.date': 'তাৰিখ', 'form.time': 'সময়', 'form.category': 'শ্ৰেণী',
    'form.desc': 'বিৱৰণ', 'form.notify': 'জাননী সক্ৰিয় কৰক',
    'toast.created': 'অনুষ্ঠান সৃষ্টি কৰা হৈছে', 'toast.updated': 'অনুষ্ঠান সলনি কৰা হৈছে', 'toast.deleted': 'অনুষ্ঠান বিলোপ কৰা হৈছে'
  }
};

function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[state.language][key]) el.textContent = i18n[state.language][key];
  });
  const langTextNodes = document.querySelectorAll('#lang-text, .lang-text');
  langTextNodes.forEach(node => { node.textContent = state.language === 'en' ? 'EN' : 'AS'; });
}

function toggleLanguage() {
  state.language = state.language === 'en' ? 'as' : 'en';
  localStorage.setItem('app-lang', state.language);
  translatePage();
  renderCalendarGrid();
  renderUpcomingEvents();
}

function applyTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.querySelectorAll('.theme-icon-moon').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.theme-icon-sun').forEach(el => el.classList.remove('hidden'));
  } else {
    document.documentElement.classList.remove('dark');
    document.querySelectorAll('.theme-icon-moon').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.theme-icon-sun').forEach(el => el.classList.add('hidden'));
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('app-theme', state.theme);
  applyTheme();
}

// Database
const DB = {
  save() { localStorage.setItem('app-events', JSON.stringify(state.events)); },
  create(e) { e.id = 'evt-' + Date.now(); state.events.push(e); this.save(); return e; },
  update(id, d) { const idx = state.events.findIndex(e => e.id === id); if (idx > -1) { state.events[idx] = { ...state.events[idx], ...d }; this.save(); } },
  delete(id) { state.events = state.events.filter(e => e.id !== id); this.save(); }
};

// Formatting
function formatDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Rendering
function renderCalendarGrid() {
  const titleEl = document.getElementById('calendar-title');
  if (!titleEl) return;

  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const todayDateStr = formatDateString(new Date());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDay);
  if (endDate.getDay() !== 6) endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const approxAsDate = getAssameseDateApprox(state.currentDate);
  const asMonthName = ASSAMESE_MONTHS[approxAsDate.monthIndex];
  const enMonthName = state.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  titleEl.textContent = state.language === 'as' ? asMonthName : enMonthName;
  document.getElementById('bhaskarabda-year').textContent = `Bhaskarabda ${approxAsDate.year}`;
  document.getElementById('saka-year').textContent = `Saka ${approxAsDate.year - 505}`;

  // Update Today's Date Display
  const todayDateDisplay = document.getElementById('today-date-display');
  if (todayDateDisplay) {
    const now = new Date();
    if (state.language === 'as') {
      const asDay = toAssameseNumeral(now.getDate());
      const asYear = toAssameseNumeral(now.getFullYear());
      const asMonth = GREGORIAN_MONTHS_AS[now.getMonth()];
      const asWeekday = ASSAMESE_WEEKDAYS[now.getDay()];
      todayDateDisplay.textContent = `${asWeekday}, ${asDay} ${asMonth}, ${asYear}`;
    } else {
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      todayDateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  // Weekdays
  const weekdaysGrid = document.getElementById('weekdays-grid');
  weekdaysGrid.innerHTML = '';
  const weekdaysFull = state.language === 'as' ? ASSAMESE_WEEKDAYS : ENGLISH_WEEKDAYS;
  const weekdaysShort = state.language === 'as' ? ASSAMESE_WEEKDAYS_SHORT : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  weekdaysFull.forEach((day, i) => {
    const el = document.createElement('div');
    el.className = `p-2 md:p-3 text-center text-[10px] font-bold ${i === 0 ? 'text-primary' : 'text-on-surface-variant'}`;
    el.innerHTML = `
      <span class="weekday-full">${day}</span>
      <span class="weekday-short">${weekdaysShort[i]}</span>
    `;
    weekdaysGrid.appendChild(el);
  });

  // Days
  const daysGrid = document.getElementById('days-grid');
  daysGrid.innerHTML = '';
  const allFestivals = getAssameseFestivals(year);
  let iterDate = new Date(startDate);

  while (iterDate <= endDate) {
    const isCurrentMonth = iterDate.getMonth() === month;
    const dateStr = formatDateString(iterDate);
    const isToday = dateStr === todayDateStr;
    const isSunday = iterDate.getDay() === 0;
    const currentIterDate = new Date(iterDate);

    const asDate = getAssameseDateApprox(iterDate);
    const dayEl = document.createElement('div');
    dayEl.className = `calendar-day-new ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSunday && isCurrentMonth ? 'sunday' : ''}`;

    const festivalsToday = allFestivals.filter(f => f.gregorianDate === dateStr);
    const userEventsToday = state.events.filter(e => e.eventDate === dateStr);

    dayEl.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="font-noto-serif text-lg md:text-2xl font-bold ${isSunday ? 'text-primary' : 'text-on-surface'}">${toAssameseNumeral(asDate.day)}</span>
        <span class="text-[10px] md:text-label-sm font-medium ${isToday ? 'text-primary' : 'text-stone-400'}">${iterDate.getDate()}</span>
      </div>
      <div class="space-y-1">
        ${festivalsToday.map(f => `<span class="block text-[8px] md:text-[9px] font-bold uppercase text-secondary truncate">${state.language === 'as' ? f.nameAssamese : f.name}</span><span class="block w-full h-0.5 bg-secondary rounded-full"></span>`).join('')}
        ${userEventsToday.map(e => `<span class="block text-[8px] md:text-[9px] font-bold uppercase text-primary truncate">● ${e.title}</span>`).join('')}
      </div>
    `;

    // dayEl.addEventListener('click', () => openEventDialog(null, currentIterDate));
    daysGrid.appendChild(dayEl);
    iterDate.setDate(iterDate.getDate() + 1);
  }

  renderBentoHighlights();
}

function renderUpcomingEvents() {
  const container = document.getElementById('upcoming-events-container');
  if (!container) return;
  container.innerHTML = '';

  const monthStart = formatDateString(new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1));
  const monthEnd = formatDateString(new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0));

  const allFestivals = getAssameseFestivals(state.currentDate.getFullYear());
  const monthFestivals = allFestivals.filter(f => f.gregorianDate >= monthStart && f.gregorianDate <= monthEnd);
  const monthEvents = state.events.filter(e => e.eventDate >= monthStart && e.eventDate <= monthEnd);

  const highlights = [...monthFestivals, ...monthEvents].sort((a, b) => {
    const dateA = a.gregorianDate || a.eventDate;
    const dateB = b.gregorianDate || b.eventDate;
    return new Date(dateA) - new Date(dateB);
  });

  if (highlights.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-muted-foreground py-8">${i18n[state.language]['lbl.no_events']}</p>`;
    return;
  }

  highlights.forEach(item => {
    const dateStr = item.gregorianDate || item.eventDate;
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate();
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
    const isFestival = !!item.gregorianDate;

    const el = document.createElement('div');
    el.className = "flex items-center gap-md p-md bg-white border border-stone-100 rounded-xl hover:border-primary-container transition-all cursor-pointer group shadow-sm";
    el.innerHTML = `
      <div class="w-12 h-12 flex flex-col items-center justify-center ${isFestival ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-on-primary-fixed'} rounded-lg shrink-0">
        <span class="font-bold text-xl leading-none">${day}</span>
        <span class="text-[9px] font-bold uppercase">${monthStr}</span>
      </div>
      <div class="flex-1 overflow-hidden">
        <h4 class="font-bold group-hover:text-primary transition-colors truncate">${state.language === 'as' && item.nameAssamese ? item.nameAssamese : (item.name || item.title)}</h4>
        <p class="text-label-sm text-on-surface-variant truncate">${item.desc || item.description || 'Monthly Highlight'}</p>
      </div>
      <span class="material-symbols-outlined text-stone-300 group-hover:text-primary shrink-0">${isFestival ? 'celebration' : 'event'}</span>
    `;

    if (!isFestival) {
      el.addEventListener('click', () => openEventDialog(item));
    }
    container.appendChild(el);
  });
}

function renderBentoHighlights() {
  const now = new Date();
  const asNow = getAssameseDateApprox(now);
  const progress = (asNow.day / 30) * 251.2;
  const ring = document.getElementById('bihu-progress-ring');
  if (ring) ring.style.strokeDashoffset = 251.2 - progress;
  const daysLeft = document.getElementById('bihu-days-left');
  if (daysLeft) daysLeft.textContent = 30 - asNow.day;

  // Update Large Progress Ring
  const largeRing = document.getElementById('month-progress-ring-large');
  if (largeRing) {
    const largeProgress = (asNow.day / 30) * 364.4;
    largeRing.style.strokeDashoffset = 364.4 - largeProgress;
  }
  const daysPassed = document.getElementById('month-days-passed');
  if (daysPassed) daysPassed.textContent = asNow.day;

  const currentMonthName = document.getElementById('current-as-month-name');
  if (currentMonthName) {
    const asMonthName = ASSAMESE_MONTHS[asNow.monthIndex].split(' ')[0]; // Just the name, not the (Bohag) part
    currentMonthName.textContent = state.language === 'as' ? asMonthName : ENGLISH_MONTHS[asNow.monthIndex];
  }

  const tithiName = document.getElementById('today-tithi-name');
  if (tithiName) tithiName.textContent = state.language === 'as' ? "দ্বিতীয়া তিথি" : "Dwitiya Tithi";
}

// Dialogs
function openEventDialog(event = null, dateObj = null) {
  state.editingEventId = event ? event.id : null;
  const dialog = document.getElementById('event-dialog');
  const form = document.getElementById('event-form');
  const delBtn = document.getElementById('btn-delete-event');

  if (event) {
    document.getElementById('dialog-title').textContent = "Edit Event";
    form['event-title'].value = event.title;
    form['event-date'].value = event.eventDate;
    form['event-time'].value = event.eventTime || '';
    form['event-category'].value = event.category || 'other';
    form['event-desc'].value = event.description || '';
    form['event-notify'].checked = event.notificationsEnabled || false;
    delBtn.classList.remove('hidden');
  } else {
    document.getElementById('dialog-title').textContent = i18n[state.language]['btn.add_event'] || 'Add Event';
    form.reset();
    form['event-date'].value = dateObj ? formatDateString(dateObj) : formatDateString(new Date());
    delBtn.classList.add('hidden');
  }
  dialog.classList.remove('hidden');
}

function closeEventDialog() { document.getElementById('event-dialog').classList.add('hidden'); }

// Init
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  applyTheme();
  translatePage();
  renderCalendarGrid();
  renderUpcomingEvents();

  // Listeners
  const langBtns = document.querySelectorAll('#lang-toggle-btn, .mobile-lang-btn');
  langBtns.forEach(btn => btn.addEventListener('click', toggleLanguage));

  const themeBtns = document.querySelectorAll('#theme-toggle-btn, .mobile-theme-btn');
  themeBtns.forEach(btn => btn.addEventListener('click', toggleTheme));

  document.getElementById('btn-today').addEventListener('click', () => { state.currentDate = new Date(); renderCalendarGrid(); renderUpcomingEvents(); });
  document.getElementById('btn-prev-month').addEventListener('click', () => { state.currentDate.setMonth(state.currentDate.getMonth() - 1); renderCalendarGrid(); renderUpcomingEvents(); });
  document.getElementById('btn-next-month').addEventListener('click', () => { state.currentDate.setMonth(state.currentDate.getMonth() + 1); renderCalendarGrid(); renderUpcomingEvents(); });

  document.getElementById('dialog-close-btn').addEventListener('click', closeEventDialog);
  document.getElementById('btn-cancel-event').addEventListener('click', closeEventDialog);

  document.getElementById('event-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = {
      title: document.getElementById('event-title').value,
      eventDate: document.getElementById('event-date').value,
      eventTime: document.getElementById('event-time').value,
      category: document.getElementById('event-category').value,
      description: document.getElementById('event-desc').value,
      notificationsEnabled: document.getElementById('event-notify').checked
    };
    if (state.editingEventId) DB.update(state.editingEventId, d);
    else DB.create(d);
    closeEventDialog();
    renderCalendarGrid();
    renderUpcomingEvents();
  });

  document.getElementById('btn-delete-event').addEventListener('click', () => {
    if (state.editingEventId) { DB.delete(state.editingEventId); closeEventDialog(); renderCalendarGrid(); renderUpcomingEvents(); }
  });

  // Notifications Check
  setInterval(() => {
    if (Notification.permission === 'granted') {
      const now = new Date();
      const nowTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const nowDateStr = formatDateString(now);
      state.events.forEach(evt => {
        if (evt.notificationsEnabled && evt.eventDate === nowDateStr && evt.eventTime === nowTimeStr) {
          new Notification('Reminder: ' + evt.title, { body: evt.description });
        }
      });
    }
  }, 60000);
});
