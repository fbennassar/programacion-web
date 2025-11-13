document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeOverlay');
    const bigA = document.getElementById('bigA');
    const bigB = document.getElementById('bigB');
    const answerDisplay = document.getElementById('answerDisplay');
    const keys = document.querySelectorAll('.key');
    const clearBtn = document.getElementById('clearBtn');
    const submitBtn = document.getElementById('submitBtn');
    const feedback = document.getElementById('feedback');

    let currentOp = null;
    let currentInput = '';

    function openOp(card) {
        const a = card.dataset.a;
        const b = card.dataset.b;
        const id = card.dataset.id;
        currentOp = { id: id ? parseInt(id) : null, a: parseInt(a), b: parseInt(b), card };
        bigA.textContent = a;
        bigB.textContent = b;
        currentInput = '';
        answerDisplay.textContent = '—';
        feedback.textContent = '';
        overlay.classList.remove('hidden');
        // hide other cards
        document.querySelectorAll('.card').forEach(c => { if (c !== card) c.style.display = 'none'; });
    }

    function closeOp() {
        overlay.classList.add('hidden');
        document.querySelectorAll('.card').forEach(c => c.style.display = 'block');
        currentOp = null;
    }

    cards.forEach(card => {
        card.addEventListener('click', () => openOp(card));
    });

    closeBtn.addEventListener('click', closeOp);

    // Add reset button handler if present
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (!confirm('¿Reiniciar todos los ejercicios y generar nuevos?')) return;
            fetch(window.location.href, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'reset' })
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    alert('Se han generado ' + data.created + ' nuevos ejercicios. La página se recargará.');
                    window.location.reload();
                } else {
                    alert('Error al reiniciar ejercicios');
                }
            }).catch(() => alert('Error de red'));
        });
    }

    keys.forEach(k => {
        k.addEventListener('click', (e) => {
            const val = e.target.textContent.trim();
            if (val === '0') {
                if (currentInput === '') return; // avoid leading zero
                currentInput += '0';
            } else if (val >= '1' && val <= '9') {
                if (currentInput.length >= 3) return; // limit digits
                currentInput += val;
            }
            answerDisplay.textContent = currentInput === '' ? '—' : currentInput;
        });
    });

    clearBtn.addEventListener('click', () => {
        currentInput = '';
        answerDisplay.textContent = '—';
        feedback.textContent = '';
    });

    submitBtn.addEventListener('click', () => {
        if (!currentOp) return;
        if (currentInput === '') {
            feedback.textContent = 'Introduce un número usando los botones.';
            return;
        }

        const a = currentOp.a;
        const b = currentOp.b;
        // Detect tipo from presence of minus sign in page
        const symbol = document.querySelector('.big-sym').textContent.trim();
        const computed = symbol === '-' ? (a - b) : (a + b);
        const given = parseInt(currentInput, 10);

        // If op has an id (saved in DB) send AJAX to check, otherwise evaluate locally
        if (currentOp.id) {
            fetch(window.location.href, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'check', op_id: currentOp.id, answer: given })
            }).then(r => r.json()).then(data => {
                if (data.success && data.correct) {
                    feedback.textContent = 'Correcto ✅';
                    markDone(currentOp.card);
                    setTimeout(closeOp, 900);
                } else if (data.success && !data.correct) {
                    feedback.textContent = 'Incorrecto ❌. Intenta otra vez.';
                } else {
                    feedback.textContent = 'Error en el servidor.';
                }
            }).catch(() => feedback.textContent = 'Error de red.');
        } else {
            // fallback local check
            if (given === computed) {
                feedback.textContent = 'Correcto ✅ (no persistido)';
                markDone(currentOp.card);
                setTimeout(closeOp, 900);
            } else {
                feedback.textContent = 'Incorrecto ❌. Intenta otra vez.';
            }
        }
    });

    function markDone(card) {
        card.classList.add('done');
        const status = card.querySelector('.status');
        if (status) status.textContent = 'Correcto';
    }
});
