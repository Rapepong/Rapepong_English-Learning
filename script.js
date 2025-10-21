'<script>'
    // ไฟล์ CSV ที่อยู่ข้างๆ index.html
    const CSV_URL = 'words.csv';

    const statusBox = document.getElementById('statusBox');
    const tbody = document.getElementById('wordsBody');
    const stats = document.getElementById('stats');
    const totalCount = document.getElementById('totalCount');
    const btnStartQuiz = document.getElementById('btnStartQuiz');
    const btnShowAll = document.getElementById('btnShowAll');
    const tableContainer = document.getElementById('tableContainer');

    let allRows = [];

    // ===== Favorite Storage (order-preserving) =====
    function loadFavorites() {
      try {
        // คีย์ใหม่: เก็บเป็นอาร์เรย์เรียงตามลำดับที่กด
        const saved = localStorage.getItem('wordsFavoritesOrder');
        if (saved) {
          const arr = JSON.parse(saved);
          return { order: Array.isArray(arr) ? arr : [], set: new Set(arr || []) };
        }
        // รองรับคีย์เดิม (ถ้ามี) แล้วย้ายข้อมูลมาคีย์ใหม่
        const legacy = localStorage.getItem('wordsFavorites');
        if (legacy) {
          const arr = JSON.parse(legacy);
          localStorage.setItem('wordsFavoritesOrder', JSON.stringify(arr));
          localStorage.removeItem('wordsFavorites');
          return { order: Array.isArray(arr) ? arr : [], set: new Set(arr || []) };
        }
        return { order: [], set: new Set() };
      } catch (e) {
        console.error('Error loading favorites:', e);
        return { order: [], set: new Set() };
      }
    }

    function saveFavorites() {
      try {
        localStorage.setItem('wordsFavoritesOrder', JSON.stringify(favoritesOrder));
      } catch (e) {
        console.error('Error saving favorites:', e);
      }
    }

    // ใช้ทั้ง "order" และ "set"
    let { order: favoritesOrder, set: favoritesSet } = loadFavorites();
    console.log('Initial favorites loaded:', favoritesOrder);

    function badge(text) {
      return `<span class="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">${text}</span>`;
    }

    // --- Quiz feature ---
    const quizCard = document.getElementById('quizCard');
    const quizEnglish = document.getElementById('quizEnglish');
    const quizPOS = document.getElementById('quizPOS');
    const quizThai = document.getElementById('quizThai');
    const quizProgress = document.getElementById('quizProgress');
    const btnReveal = document.getElementById('btnReveal');
    const btnResetQuiz = document.getElementById('btnResetQuiz');
    const btnBackQuiz = document.getElementById('btnBackQuiz');
    const quizFav = document.getElementById('quizFav');

    let quizQueue = [];
    let quizIndex = -1;

    function shuffleArray(arr){
      const a = arr.slice();
      for(let i = a.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function startQuiz(rows){
      if(!rows || !rows.length){
        quizCard.classList.add('hidden');
        return;
      }
      quizQueue = shuffleArray(rows.map(r => ({
        en: r.en || r.English || r.english || '',
        th: r.th || r.Thai || r.thai || '',
        pos: r.pos || r.POS || r.PartOfSpeech || ''
      })));
      quizIndex = 0;
      quizCard.classList.remove('hidden');
      showCurrentQuiz();
    }

    function setQuizFavUI(isFav){
      if(isFav){
        quizFav.classList.remove('bg-slate-100','text-slate-600','hover:bg-slate-200','border');
        quizFav.classList.add('bg-rose-50','text-red-600','border','border-rose-200','hover:bg-rose-100');
        quizFav.setAttribute('aria-pressed','true');
        quizFav.title = 'Unfavorite';
      } else {
        quizFav.classList.remove('bg-rose-50','text-red-600','border-rose-200','hover:bg-rose-100');
        quizFav.classList.add('bg-slate-100','text-slate-600','hover:bg-slate-200','border');
        quizFav.setAttribute('aria-pressed','false');
        quizFav.title = 'Favorite';
      }
    }

    function showCurrentQuiz(){
      if(quizIndex < 0 || quizIndex >= quizQueue.length){
        quizEnglish.textContent = 'จบแล้ว';
        quizPOS.innerHTML = '';
        quizThai.textContent = '';
        quizThai.classList.add('invisible'); // จองที่ไว้
        quizProgress.textContent = `${quizQueue.length} / ${quizQueue.length}`;
        if(btnReveal) { btnReveal.disabled = true; btnReveal.textContent = 'Done'; }
        if(btnBackQuiz) btnBackQuiz.disabled = !(quizQueue.length && quizIndex > 0);
        setQuizFavUI(false);
        return;
      }
      const r = quizQueue[quizIndex];
      quizEnglish.textContent = r.en || '—';
      quizPOS.innerHTML = r.pos ? badge(r.pos) : '';
      quizThai.textContent = r.th || '';
      quizThai.classList.add('invisible'); // ซ่อนแบบคงพื้นที่
      quizProgress.textContent = `${quizIndex + 1} / ${quizQueue.length}`;
      if(btnReveal){ btnReveal.disabled = false; setRevealMode('reveal'); }
      if(btnBackQuiz) btnBackQuiz.disabled = (quizIndex <= 0);

      const isFav = favoritesSet.has(r.en || '');
      setQuizFavUI(isFav);
    }

    function setRevealMode(mode){
      if(!btnReveal) return;
      if(mode === 'reveal'){
        btnReveal.textContent = 'Reveal';
        btnReveal.dataset.mode = 'reveal';
        btnReveal.style.backgroundColor = '#f59e0b'; // amber-500
      } else {
        btnReveal.textContent = 'Next';
        btnReveal.dataset.mode = 'next';
        btnReveal.style.backgroundColor = '#059669'; // emerald-600
      }
    }

    btnReveal.addEventListener('click', ()=>{
      if(!quizQueue.length || quizIndex < 0) return;
      const isInvisible = quizThai.classList.contains('invisible');
      if(isInvisible){
        // แสดงคำไทยโดยไม่เปลี่ยน layout ของปุ่ม
        quizThai.classList.remove('invisible');
        setRevealMode('next');
      } else {
        quizIndex++;
        setRevealMode('reveal');
        showCurrentQuiz();
      }
    });

    btnResetQuiz.addEventListener('click', ()=>{
      if(!quizQueue.length) return;
      quizQueue = shuffleArray(quizQueue);
      quizIndex = 0;
      showCurrentQuiz();
    });

    if(btnBackQuiz){
      btnBackQuiz.addEventListener('click', ()=>{
        if(quizIndex <= 0) return;
        quizIndex--;
        setRevealMode('reveal');
        showCurrentQuiz();
      });
    }

    // คลิกหัวใจในหน้า Quiz เพื่อ toggle favorite ของคำที่กำลังแสดง
    quizFav.addEventListener('click', ()=>{
      if(quizIndex < 0 || quizIndex >= quizQueue.length) return;
      const en = quizQueue[quizIndex].en || '';
      if(!en) return;

      if (favoritesSet.has(en)) {
        favoritesSet.delete(en);
        favoritesOrder = favoritesOrder.filter(w => w !== en);
      } else {
        favoritesSet.add(en);
        favoritesOrder.push(en);
      }
      saveFavorites();
      setQuizFavUI(favoritesSet.has(en));
      renderRows(allRows);
    });

    function setActiveView(view){
      if(view === 'quiz'){
        btnStartQuiz.classList.add('active');
        btnShowAll.classList.remove('active');
        tableContainer.classList.add('hidden');
        quizCard.classList.remove('hidden');
      } else {
        btnStartQuiz.classList.remove('active');
        btnShowAll.classList.add('active');
        quizCard.classList.add('hidden');
        tableContainer.classList.remove('hidden');
      }
    }

    if(btnStartQuiz) btnStartQuiz.disabled = true;
    if(btnShowAll) btnShowAll.disabled = true;
    if(btnStartQuiz) btnStartQuiz.addEventListener('click', ()=>{
      if(!allRows.length) return;
      setActiveView('quiz');
      startQuiz(allRows);
    });
    if(btnShowAll) btnShowAll.addEventListener('click', ()=>{
      setActiveView('table');
    });

    function renderRows(rows) {
      tbody.innerHTML = '';

      // ทำดัชนีลำดับ favorite (word → index) เพื่อ sort ได้เร็ว
      const favIndex = new Map(favoritesOrder.map((w, i) => [w, i]));

      // Sort:
      // 1) กลุ่ม favorite มาก่อน เรียงตามลำดับที่กด
      // 2) กลุ่มที่เหลือคง "ลำดับตามไฟล์ CSV" (ใช้ __idx ที่ติดไว้ตอนโหลด)
      const sortedRows = rows.slice().sort((a, b) => {
        const aEn = a.english ?? a.English ?? a.EN ?? a.en ?? '';
        const bEn = b.english ?? b.English ?? b.EN ?? b.en ?? '';
        const ai = favIndex.has(aEn) ? favIndex.get(aEn) : Infinity;
        const bi = favIndex.has(bEn) ? favIndex.get(bEn) : Infinity;

        if (ai !== bi) return ai - bi;            // favorite ก่อน ตามลำดับที่กด
        return (a.__idx ?? 0) - (b.__idx ?? 0);   // non-favorite: ตามลำดับ CSV เดิม
      });

      sortedRows.forEach((row, idx) => {
        const en = row.english ?? row.English ?? row.EN ?? row.en ?? '';
        const th = row.thai ?? row.Thai ?? row.TH ?? row.th ?? '';
        const pos = row.pos ?? row.POS ?? row.PartOfSpeech ?? '';
        const isFav = favoritesSet.has(en);

        const tr = document.createElement('tr');
        if (isFav) tr.classList.add('favorited');
        tr.innerHTML = `
          <td class="px-4 py-3 heart-cell">
            <span class="heart-icon ${isFav ? 'favorited' : ''}" data-word="${en}">♥</span>
          </td>
          <td class="px-4 py-3 text-gray-500">${idx + 1}</td>
          <td class="px-4 py-3 font-medium">${en}</td>
          <td class="px-4 py-3">${th}</td>
          <td class="px-4 py-3">${badge(pos)}</td>
        `;
        tbody.appendChild(tr);
      });

      // จัดการคลิกไอคอนหัวใจ (ในตาราง)
      document.querySelectorAll('.heart-icon').forEach(icon => {
        icon.addEventListener('click', function() {
          const word = this.dataset.word;

          if (favoritesSet.has(word)) {
            favoritesSet.delete(word);
            favoritesOrder = favoritesOrder.filter(w => w !== word);
          } else {
            favoritesSet.add(word);
            favoritesOrder.push(word);
          }

          saveFavorites();
          renderRows(allRows); // re-render ตาราง
          // ถ้าอยู่ในหน้า Quiz และคำปัจจุบันตรงกับ word ให้รีเฟรชหัวใจบน Quiz ด้วย
          if (quizIndex >= 0 && quizIndex < quizQueue.length) {
            const currentEn = quizQueue[quizIndex].en || '';
            if (currentEn === word) {
              setQuizFavUI(favoritesSet.has(word));
            }
          }
        });
      });

      totalCount.textContent = rows.length;
      stats.classList.remove('hidden');
    }

    async function loadCSV() {
      statusBox.textContent = 'กำลังโหลดคำศัพท์...';
      try {
        const res = await fetch(CSV_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('โหลดไฟล์ไม่สำเร็จ: ' + res.status + ' ' + res.statusText);
        const csvText = await res.text();

        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim(),
          transform: v => typeof v === 'string' ? v.trim() : v,
        });

        if (parsed.errors && parsed.errors.length) {
          console.warn('CSV parse errors:', parsed.errors);
        }

        const rows = (parsed.data || []).filter(r =>
          (r.english ?? r.English ?? r.EN ?? r.en) &&
          (r.thai ?? r.Thai ?? r.TH ?? r.th) &&
          (r.pos ?? r.POS ?? r.PartOfSpeech)
        );

        // เก็บลำดับเดิมจากไฟล์ไว้ใน __idx เพื่อใช้เรียงกลุ่ม non-favorite
        allRows = rows.map((r, i) => ({ ...r, __idx: i }));

        renderRows(allRows);
        if(btnStartQuiz) btnStartQuiz.disabled = !rows.length;
        if(btnShowAll) btnShowAll.disabled = !rows.length;
        statusBox.textContent = rows.length ? 'โหลดสำเร็จ' : 'ไม่พบข้อมูลในไฟล์ CSV';
      } catch (err) {
        console.error(err);
        statusBox.innerHTML = `
          <div class="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            โหลดข้อมูลไม่สำเร็จ: ${err.message}<br/>
            <span class="text-xs text-red-600">
              เคล็ดลับ: การเปิดไฟล์ด้วย <code>file://</code> อาจบล็อก <code>fetch()</code>.
              ให้รันผ่าน local server เช่น <code>python -m http.server</code> แล้วเปิด <code>http://localhost:8000</code>
              หรืออัปโหลดขึ้น GitHub Pages / Netlify
            </span>
          </div>
        `;
      }
    }

    loadCSV();
'</script>'