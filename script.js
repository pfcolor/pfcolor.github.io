// 이 파일은 건드릴 일이 거의 없음. 콘텐츠 추가는 /data/*.json 파일만 수정하면 됨.

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('불러오기 실패: ' + path);
  return res.json();
}

function formatDate(iso) {
  return iso.replaceAll('-', '.');
}

function renderBooks(books) {
  const container = document.getElementById('book-list');
  container.innerHTML = books.map(b => {
    const cover = `<img class="cover${b.forthcoming ? ' forthcoming' : ''}" src="${b.cover}" alt="${b.title} 표지" loading="lazy">`;
    const titleText = b.link ? `<a href="${b.link}" target="_blank" rel="noopener">${b.title}</a>` : b.title;
    const sub = b.forthcoming ? `${b.publisher} · 출간 예정` : `${b.publisher} · ${formatDate(b.date)}`;
    return `
    <div class="book">
      ${b.link
        ? `<a class="cover-link" href="${b.link}" target="_blank" rel="noopener">${cover}</a>`
        : `<span class="cover-link">${cover}</span>`}
      <div>
        <div class="title">${titleText}</div>
        <div class="sub">${sub}</div>
      </div>
    </div>
  `;
  }).join('');
}

function renderList(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(item => `
    <li><a href="${item.url}" target="_blank" rel="noopener">${item.title}</a><span class="date">${formatDate(item.date)}</span></li>
  `).join('');
}

function initReveal(btn) {
  const container = document.querySelector(btn.dataset.target);
  const items = Array.from(container.children);
  const steps = btn.dataset.steps.split(',').map(Number);
  const total = items.length;
  let shown = 0;

  function render() {
    items.forEach((el, i) => { el.style.display = i < shown ? '' : 'none'; });
    if (shown >= total) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    const nextStep = steps.find(s => s > shown);
    const nextShown = Math.min(nextStep === undefined ? total : nextStep, total);
    const remaining = nextShown - shown;
    btn.querySelector('.label').textContent = remaining + '개 더보기';
    btn.dataset.next = nextShown;
  }

  btn.addEventListener('click', () => {
    shown = Number(btn.dataset.next);
    render();
  });

  shown = Math.min(steps[0], total);
  render();
}

function updateCounts() {
  document.querySelectorAll('[data-count-for]').forEach(el => {
    const target = document.querySelector(el.dataset.countFor);
    if (target) el.textContent = target.children.length;
  });
}

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    let resetTimer;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      const toast = btn.parentElement.querySelector('.copy-toast');
      btn.classList.add('copied');
      toast.classList.add('show');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        btn.classList.remove('copied');
        toast.classList.remove('show');
      }, 1500);
    });
  });
}

async function init() {
  const [books, papers, articles] = await Promise.all([
    loadJSON('data/books.json'),
    loadJSON('data/papers.json'),
    loadJSON('data/articles.json'),
  ]);

  // 최신순 정렬 (JSON 순서와 무관하게 항상 최신이 위로)
  const byDateDesc = (a, b) => b.date.localeCompare(a.date);
  books.sort(byDateDesc);
  papers.sort(byDateDesc);
  articles.sort(byDateDesc);

  renderBooks(books);
  renderList('paper-list', papers);
  renderList('article-list', articles);

  document.querySelectorAll('.more[data-target]').forEach(initReveal);
  updateCounts();
}

initCopyButtons();

init().catch(err => {
  console.error(err);
  document.querySelector('.wrap').insertAdjacentHTML(
    'beforeend',
    '<p style="color:#a33;">콘텐츠를 불러오지 못했습니다. data 폴더의 JSON 파일을 확인해 주세요.</p>'
  );
});
