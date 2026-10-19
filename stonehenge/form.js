(() => {
  const config = window.stonehengeFormConfig;
  const dialog = document.getElementById('leadDialog');
  const form = document.getElementById('leadForm');
  const formView = document.getElementById('formView');
  const successView = document.getElementById('successView');
  const errorView = document.getElementById('formError');
  const close = document.getElementById('closeDialog');
  const submit = form.querySelector('.submit');
  let sending = false;
  let idleTimer;
  const copy = {
    consultation: ['Free consultation', 'Book your free consultation', '15 minutes with Ivan in the Stonehenge 1 gym. We will identify your weak points and give you clear recommendations on nutrition, routine, training frequency and exercises.'],
    group: ['Free resident workouts', 'Join free workouts with your neighbours', 'Free group sessions for Stonehenge 1 residents: Tuesday 20:00–21:00 and Sunday 11:00–12:00.'],
    pt: ['Personal training — 300 AED', 'Personal training with Ivan', '1-on-1 coaching in Stonehenge 1. One session costs 300 AED. Tell us your goal and Ivan will contact you.'],
  };
  function clearError() {
    errorView.hidden = true;
    errorView.textContent = '';
  }
  function showError(message) {
    errorView.textContent = message;
    errorView.hidden = false;
    errorView.focus();
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (sending) return resetIdle();
      if (dialog.open && formView.style.display !== 'none' &&
          [...form.querySelectorAll('input:not([type=hidden]), select')].some(field => field.value)) return resetIdle();
      dialog.close();
      form.reset();
      clearError();
      formView.style.display = 'block';
      successView.style.display = 'none';
      window.scrollTo(0, 0);
    }, 90000);
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(event => document.addEventListener(event, resetIdle, {passive: true}));
  resetIdle();
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    const [interest, title, description] = copy[button.dataset.open];
    document.getElementById('interest').value = interest;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = description;
    document.getElementById('detailCard').style.display = button.dataset.open === 'consultation' ? 'block' : 'none';
    formView.style.display = 'block';
    successView.style.display = 'none';
    clearError();
    dialog.showModal();
    resetIdle();
  }));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); });
  document.getElementById('doneBtn').addEventListener('click', () => {
    dialog.close();
    form.reset();
    clearError();
    window.scrollTo(0, 0);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    clearError();
    if (!config.enabled) {
      showError('Online requests are temporarily unavailable. Your request has not been sent. Please speak with Ivan in the Stonehenge 1 gym.');
      return;
    }
    sending = true;
    submit.disabled = true;
    close.disabled = true;
    submit.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    try {
      const requestId = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g, '');
      const data = {...Object.fromEntries(new FormData(form).entries()), request_id: requestId, website: ''};
      await fetch(config.endpoint, {method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(data)});
      const checkStatus = () => new Promise((resolve,reject) => {
        const callback = 'stonehengeStatus_' + Math.random().toString(36).slice(2);
        const script = document.createElement('script');
        const cleanup = () => {clearTimeout(timer);delete window[callback];script.remove();};
        const timer = setTimeout(() => {cleanup();reject(Error('Timeout'));},6500);
        window[callback] = result => {cleanup();resolve(result && result.ok === true && result.id === requestId);};
        script.onerror = () => {cleanup();reject(Error('Status unavailable'));};
        script.src = config.endpoint + '?id=' + encodeURIComponent(requestId) + '&callback=' + callback + '&t=' + Date.now();
        document.head.appendChild(script);
      });
      let confirmed = false;
      for (let attempt = 0; attempt < 5 && !confirmed; attempt++) {
        await new Promise(resolve => setTimeout(resolve, attempt ? 1800 : 700));
        try {confirmed = await checkStatus();} catch (_) {}
      }
      if (!confirmed) throw Error('Delivery not confirmed');
      formView.style.display = 'none';
      successView.style.display = 'block';
      successView.querySelector('h2').focus();
      form.reset();
    } catch (error) {
      showError(error.name === 'AbortError'
        ? 'We could not confirm your request before the connection timed out. Please try again or speak with Ivan in the gym.'
        : 'We could not confirm your request. Please check your connection and try again, or speak with Ivan in the gym.');
    } finally {
      sending = false;
      submit.disabled = false;
      close.disabled = false;
      submit.textContent = 'Send request →';
      form.removeAttribute('aria-busy');
      resetIdle();
    }
  });
})();
