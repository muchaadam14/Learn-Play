document.addEventListener('DOMContentLoaded', () => {
  // Stan aplikacji (brak startowych dzieci Natalka/Bartek zgodnie z ustaleniami)
  const defaultState = {
    onboarded: false,
    parentName: '',
    children: [],
    theme: 'theme-pink',
    biometricType: null, // 'fingerprint' | 'face' | null
    biometricCredentialId: null
  };

  let state = JSON.parse(localStorage.getItem('learnPlayState')) || { ...defaultState };

  // Stan bieżącej rezerwacji
  let booking = {
    childName: '',
    isOtherChild: false,
    passName: 'Jedno wejście',
    price: 10,
    dateStr: '',
    hour: '16',
    minute: '15'
  };

  function saveState() {
    localStorage.setItem('learnPlayState', JSON.stringify(state));
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // Zastosowanie zapisanego motywu
  function applyTheme(themeClass) {
    document.body.className = themeClass;
    state.theme = themeClass;
    saveState();
  }
  applyTheme(state.theme);

  // Elementy onboardingu
  const screenOnboarding = document.getElementById('screen-onboarding');
  const mainApp = document.getElementById('main-app');
  const bgDots = document.getElementById('bgDots');
  const step1 = document.getElementById('onboarding-step-1');
  const step2 = document.getElementById('onboarding-step-2');
  const onboardingChildFields = document.getElementById('onboardingChildFields');
  
  const navIndicator = document.getElementById('navIndicator');
  // Jeśli użytkownik już ukończył pierwszą konfigurację
  if (state.onboarded) {
    screenOnboarding.classList.add('hidden');
    bgDots.classList.add('fade-out');
    mainApp.classList.remove('hidden');
    updateNavIndicator(0);
  }

  // STRONA 1 -> STRONA 2 (Animacja przesuwania kropek na boki)
  document.getElementById('btnStart').addEventListener('click', () => {
    bgDots.classList.add('pushed');
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
  });

  // STRONA 2 -> STRONA 3 (Animacja wjeżdżania pól dziecka)
  document.getElementById('btnShowChildFields').addEventListener('click', () => {
    onboardingChildFields.classList.toggle('collapsed');
  });

  // STRONA 2/3 -> STRONA GŁÓWNA (KONTYNUUJ)
  document.getElementById('btnContinue').addEventListener('click', () => {
    const pName = document.getElementById('parentName').value.trim();
    if (!pName) {
      showToast('Wpisz imię rodzica');
      return;
    }
    state.parentName = pName;

    // Jeśli rozwinięto formularz dziecka i wpisano dane, dodaj profil
    if (!onboardingChildFields.classList.contains('collapsed')) {
      const cFirst = document.getElementById('initChildFirstName').value.trim();
      const cLast = document.getElementById('initChildLastName').value.trim();
      const cAge = document.getElementById('initChildAge').value.trim();

      if (cFirst && cAge) {
        state.children.push({
          id: Date.now(),
          firstName: cFirst,
          lastName: cLast,
          age: parseInt(cAge, 10)
        });
      }
    }

    state.onboarded = true;
    saveState();

    bgDots.classList.add('fade-out');
    screenOnboarding.classList.add('hidden');
    mainApp.classList.remove('hidden');
    switchTab('tab-home', 0);
  });
  // NAWIGACJA DOLNA (Strony 4, 5, 10, 11 + animowany paseczek)
  const navItems = document.querySelectorAll('.nav-item');
  const tabScreens = document.querySelectorAll('.tab-screen');

  function updateNavIndicator(index) {
    const navWidth = document.getElementById('bottomNav').offsetWidth || 420;
    const slotWidth = navWidth / 4;
    const indicatorWidth = 28;
    const leftOffset = (slotWidth * index) + (slotWidth / 2) - (indicatorWidth / 2);
    navIndicator.style.transform = `translateX(${leftOffset}px)`;
  }

  function switchTab(targetId, index) {
    tabScreens.forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    document.getElementById(targetId).classList.add('active');
    navItems[index].classList.add('active');
    updateNavIndicator(index);

    if (targetId === 'tab-booking') {
      resetBookingFlow();
    }
    if (targetId === 'tab-settings') {
      collapseAllSettings();
      renderSettingsChildren();
    }
  }

  navItems.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.target, idx);
    });
  });

  window.addEventListener('resize', () => {
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) updateNavIndicator(parseInt(activeNav.dataset.index, 10));
  });

  // Przyciski "ZAPISZ DZIECKO NA ZAJĘCIA" ze Strony Głównej i Cennika
  document.querySelectorAll('.go-to-booking').forEach(btn => {
    btn.addEventListener('click', () => switchTab('tab-booking', 1));
  });

  // ŚCIEŻKA REZERWACJI (Strony 5, 6, 7, 8, 9)
  const bookSteps = document.querySelectorAll('.book-step');
  const otherChildCard = document.getElementById('otherChildCard');
  const otherChildFields = document.getElementById('otherChildFields');

  function showBookingStep(stepNum) {
    bookSteps.forEach(s => s.classList.remove('active'));
    document.getElementById(`book-step-${stepNum}`).classList.add('active');
  }

  function formatAge(age) {
    if (age === 1) return '1 rok';
    if (age >= 2 && age <= 4) return `${age} lata`;
    return `${age} lat`;
  }

  function renderBookingChildren() {
    const list = document.getElementById('bookingChildrenList');
    list.innerHTML = '';

    state.children.forEach((child, idx) => {
      const card = document.createElement('div');
      card.className = 'radio-card' + (idx === 0 && !booking.isOtherChild ? ' selected' : '');
      card.innerHTML = `
        <div class="radio-card-header">
          <span><strong>${child.firstName}</strong> ${formatAge(child.age)}</span>
          <div class="custom-radio"></div>
        </div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('#tab-booking .radio-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        otherChildFields.classList.add('collapsed');
        booking.isOtherChild = false;
        booking.childName = child.firstName;
      });
      list.appendChild(card);

      if (idx === 0 && !booking.isOtherChild) {
        booking.childName = child.firstName;
      }
    });

    // Jeśli brak przypisanych dzieci, automatycznie otwórz opcję "Inne dziecko"
    if (state.children.length === 0) {
      otherChildCard.classList.add('selected');
      otherChildFields.classList.remove('collapsed');
      booking.isOtherChild = true;
    } else {
      otherChildCard.classList.remove('selected');
      otherChildFields.classList.add('collapsed');
    }
  }

  document.getElementById('otherChildToggle').addEventListener('click', () => {
    document.querySelectorAll('#tab-booking .radio-card').forEach(c => c.classList.remove('selected'));
    otherChildCard.classList.add('selected');
    otherChildFields.classList.remove('collapsed');
    booking.isOtherChild = true;
  });

  function resetBookingFlow() {
    booking.isOtherChild = state.children.length === 0;
    renderBookingChildren();
    showBookingStep(1);
  }

  // Krok 1 -> Krok 2
  document.getElementById('btnBookStep1Next').addEventListener('click', () => {
    if (booking.isOtherChild) {
      const fName = document.getElementById('bookOtherFirstName').value.trim();
      const lName = document.getElementById('bookOtherLastName').value.trim();
      const age = document.getElementById('bookOtherAge').value.trim();
      if (!fName || !age) {
        showToast('Uzupełnij imię i wiek dziecka');
        return;
      }
      booking.childName = fName;
      // Opcjonalnie zapisujemy nowe dziecko na koncie, jeśli rodzic chce
      state.children.push({ id: Date.now(), firstName: fName, lastName: lName, age: parseInt(age, 10) });
      saveState();
    } else if (!booking.childName) {
      showToast('Wybierz dziecko');
      return;
    }
    showBookingStep(2);
  });

  // Wybór karnetu (Krok 2 -> Krok 3)
  document.querySelectorAll('.pass-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.pass-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      booking.passName = card.dataset.pass;
      booking.price = parseInt(card.dataset.price, 10);
    });
  });

  document.getElementById('btnBookStep2Next').addEventListener('click', () => {
    showBookingStep(3);
  });

  // INTERAKTYWNY KALENDARZ (Krok 3)
  let currentCalDate = new Date(2026, 10, 19); // Listopad 2026
  let selectedDate = new Date(2026, 10, 20);

  const monthNames = [
    'STYCZEŃ', 'LUTY', 'MARZEC', 'KWIECIEŃ', 'MAJ', 'CZERWIEC',
    'LIPIEC', 'SIERPIEŃ', 'WRZESIEŃ', 'PAŹDZIERNIK', 'LISTOPAD', 'GRUDZIEŃ'
  ];

  function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    document.getElementById('calMonthYear').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'cal-day';
      dayEl.textContent = d;

      if (
        selectedDate &&
        selectedDate.getDate() === d &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year
      ) {
        dayEl.classList.add('selected');
      }

      dayEl.addEventListener('click', () => {
        selectedDate = new Date(year, month, d);
        renderCalendar();
      });

      grid.appendChild(dayEl);
    }
  }

  document.getElementById('calPrev').addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();

  // Krok 3 -> Krok 4 (Podsumowanie)
  document.getElementById('btnBookStep3Next').addEventListener('click', () => {
    const h = document.getElementById('selectHour').value;
    const m = document.getElementById('selectMinute').value;
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = selectedDate.getFullYear();

    booking.dateStr = `${dd}.${mm}.${yyyy}, ${h}:${m}`;
    document.getElementById('sumDateTime').textContent = booking.dateStr;
    document.getElementById('sumChild').textContent = booking.childName;
    document.getElementById('sumPass').textContent = booking.passName;
    document.getElementById('sumPrice').textContent = `${booking.price}zł`;

    showBookingStep(4);
  });

  // Podsumowanie: ANULUJ / ZAPISZ -> Strona główna
  document.getElementById('btnCancelBooking').addEventListener('click', () => {
    switchTab('tab-home', 0);
  });

  document.getElementById('btnSaveBooking').addEventListener('click', () => {
    const foundChild = state.children.find(c => c.firstName === booking.childName);
    const childAge = foundChild ? formatAge(foundChild.age) : 'nie podano';

    document.getElementById('fSubject').value = `Nowy zapis Learn & Play: ${booking.childName} (${booking.dateStr})`;
    document.getElementById('fParent').value = state.parentName || 'Nie podano';
    document.getElementById('fChild').value = booking.childName;
    document.getElementById('fAge').value = childAge;
    document.getElementById('fPass').value = booking.passName;
    document.getElementById('fDate').value = booking.dateStr;
    document.getElementById('fPrice').value = `${booking.price} zł`;

    document.getElementById('realBookingForm').submit();

    showToast(`Zapisano ${booking.childName} na zajęcia!`);
    switchTab('tab-home', 0);
  });



  // USTAWIENIA: Animacja znikania innych i rozszerzania klikniętej kategorii
  const settingsContainer = document.getElementById('settingsContainer');
  const settingsCards = document.querySelectorAll('.settings-card');

  function collapseAllSettings() {
    settingsContainer.classList.remove('has-expanded');
    settingsCards.forEach(c => c.classList.remove('expanded'));
    document.getElementById('settingsAddChildForm').classList.add('collapsed');
  }

  settingsCards.forEach(card => {
    const header = card.querySelector('.settings-card-header');
    header.addEventListener('click', () => {
      // Opcja B: ponowne kliknięcie w tytuł zwija kategorię
      if (card.classList.contains('expanded')) {
        collapseAllSettings();
      } else {
        settingsCards.forEach(c => c.classList.remove('expanded'));
        card.classList.add('expanded');
        settingsContainer.classList.add('has-expanded');
      }
    });
  });

  // Ustawienia: Profile dzieci (Strona 14 & 15)
  function renderSettingsChildren() {
    const container = document.getElementById('settingsChildrenList');
    container.innerHTML = '';

    if (state.children.length === 0) {
      container.innerHTML = '<p style="text-align:center; font-size:0.9rem;">Brak dodanych dzieci. Kliknij +, aby dodać.</p>';
      return;
    }

    state.children.forEach(child => {
      const row = document.createElement('div');
      row.className = 'setting-child-item';
      row.innerHTML = `
        <span><strong>${child.firstName}</strong> ${formatAge(child.age)}</span>
        <button type="button" class="remove-child-btn" title="Usuń profil">&times;</button>
      `;
      row.querySelector('.remove-child-btn').addEventListener('click', () => {
        state.children = state.children.filter(c => c.id !== child.id);
        saveState();
        renderSettingsChildren();
      });
      container.appendChild(row);
    });
  }

  const settingsAddChildForm = document.getElementById('settingsAddChildForm');
  document.getElementById('btnToggleSettingsAddChild').addEventListener('click', () => {
    settingsAddChildForm.classList.toggle('collapsed');
  });

  document.getElementById('btnSaveNewChild').addEventListener('click', () => {
    const fName = document.getElementById('setChildFirstName').value.trim();
    const lName = document.getElementById('setChildLastName').value.trim();
    const age = document.getElementById('setChildAge').value.trim();

    if (!fName || !age) {
      showToast('Wpisz imię i wiek dziecka');
      return;
    }

    state.children.push({
      id: Date.now(),
      firstName: fName,
      lastName: lName,
      age: parseInt(age, 10)
    });
    saveState();

    document.getElementById('setChildFirstName').value = '';
    document.getElementById('setChildLastName').value = '';
    document.getElementById('setChildAge').value = '';
    settingsAddChildForm.classList.add('collapsed');
    renderSettingsChildren();
    showToast('Dodano profil dziecka');
  });

  // Ustawienia: Zmiana motywu (Strona 16)
  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
      showToast('Zmieniono motyw');
    });
  });

  // Ustawienia: Logowanie biometryczne WebAuthn (Windows Hello / Face ID / Touch ID)
  const btnBioFingerprint = document.getElementById('btnBioFingerprint');
  const btnBioFace = document.getElementById('btnBioFace');
  const bioStatusText = document.getElementById('bioStatusText');

  function updateBiometricUI() {
    btnBioFingerprint.classList.toggle('active', state.biometricType === 'fingerprint');
    btnBioFace.classList.toggle('active', state.biometricType === 'face');
    if (state.biometricType) {
      bioStatusText.textContent = 'Biometria systemowa jest WŁĄCZONA (kliknij ponownie, aby wyłączyć)';
    } else {
      bioStatusText.textContent = 'Kliknij ikonę, aby włączyć biometrię systemową';
    }
  }
  updateBiometricUI();

  async function toggleSystemBiometrics(type) {
    // Wyłączanie jeśli kliknięto aktywną opcję
    if (state.biometricType === type) {
      state.biometricType = null;
      state.biometricCredentialId = null;
      saveState();
      updateBiometricUI();
      showToast('Wyłączono logowanie biometryczne');
      setTimeout(collapseAllSettings, 450);
      return;
    }

    // Włączanie z wykorzystaniem WebAuthn (Windows Hello, FaceID, TouchID)
    if (!window.PublicKeyCredential) {
      showToast('Twoja przeglądarka nie obsługuje WebAuthn');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: 'Learn & Play' },
          user: {
            id: userId,
            name: state.parentName || 'rodzic@learnplay.pl',
            displayName: state.parentName || 'Rodzic Learn & Play'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Wymusza czytnik w urządzeniu (Windows Hello / FaceID)
            userVerification: 'required'
          },
          timeout: 60000
        }
      });

      if (credential) {
        state.biometricType = type;
        state.biometricCredentialId = credential.id;
        saveState();
        updateBiometricUI();
        showToast('Biometria skonfigurowana pomyślnie!');
        // Powrót do wszystkich kategorii po skonfigurowaniu
        setTimeout(collapseAllSettings, 500);
      }
    } catch (err) {
      showToast('Anulowano lub wymagane HTTPS / localhost');
    }
  }

  btnBioFingerprint.addEventListener('click', () => toggleSystemBiometrics('fingerprint'));
  btnBioFace.addEventListener('click', () => toggleSystemBiometrics('face'));

  // Ustawienia: Usuń konto / Zachowaj konto (Strona 13)
  document.getElementById('btnKeepAccount').addEventListener('click', () => {
    collapseAllSettings();
  });

  document.getElementById('btnConfirmDeleteAccount').addEventListener('click', () => {
    // 1. Całkowite wyczyszczenie pamięci i stanu
    localStorage.removeItem('learnPlayState');
    state = {
      onboarded: false,
      parentName: '',
      children: [],
      theme: 'theme-pink',
      biometricType: null,
      biometricCredentialId: null
    };

    booking = {
      childName: '',
      isOtherChild: true,
      passName: 'Jedno wejście',
      price: 18,
      dateStr: '',
      hour: '16',
      minute: '15'
    };

    // 2. Wyczyszczenie WSZYSTKICH pól formularzy w całej aplikacji
    document.getElementById('parentName').value = '';
    document.getElementById('initChildFirstName').value = '';
    document.getElementById('initChildLastName').value = '';
    document.getElementById('initChildAge').value = '';

    document.getElementById('bookOtherFirstName').value = '';
    document.getElementById('bookOtherLastName').value = '';
    document.getElementById('bookOtherAge').value = '';

    document.getElementById('setChildFirstName').value = '';
    document.getElementById('setChildLastName').value = '';
    document.getElementById('setChildAge').value = '';

    // 3. Odświeżenie widoków dzieci, motywu i biometrii
    renderSettingsChildren();
    renderBookingChildren();
    onboardingChildFields.classList.add('collapsed');
    collapseAllSettings();
    applyTheme('theme-pink');
    updateBiometricUI();

    // 4. Powrót na Stronę 1 (WITAJ!)
    mainApp.classList.add('hidden');
    screenOnboarding.classList.remove('hidden');
    step2.classList.add('hidden');
    step1.classList.remove('hidden');
    bgDots.classList.remove('fade-out', 'pushed');

    showToast('Konto i wszystkie dane zostały usunięte');
  });
});