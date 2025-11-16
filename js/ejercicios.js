document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeOverlay');
    const answerDisplay = document.getElementById('answerDisplay');
    const keys = document.querySelectorAll('.key');
    const clearBtn = document.getElementById('clearBtn');
    const submitBtn = document.getElementById('submitBtn');
    const feedback = document.getElementById('feedback');

    let currentOp = null;
    let currentInputDigits = [];
    let readonlyMode = false;

        function renderCalculation(a, b, symbol) {
            const container = document.querySelector('.big-numbers');
            container.innerHTML = '';

            const n1 = String(a);
            const n2 = String(b);
            const maxLen = Math.max(n1.length, n2.length);
            let boxesCount;
            if (symbol === '-') {
                boxesCount = maxLen;
            } else {
                boxesCount = String(a + b).length;
                if (boxesCount < maxLen) boxesCount = maxLen;
            }


        const wrapper = document.createElement('div');
        wrapper.className = 'calc-wrapper';
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateColumns = `auto repeat(${maxLen}, 1fr)`;
        wrapper.style.gap = '6px';

        const grid = document.createElement('div');
        grid.className = 'calc-grid';
        grid.style.gridColumn = '1 / -1';
        grid.style.display = 'contents';

            const topOpCell = document.createElement('div');
            topOpCell.className = 'cell operator-cell';
            topOpCell.textContent = '';
            grid.appendChild(topOpCell);
            for (let i = 0; i < maxLen; i++) {
                const idx = i - (maxLen - n1.length);
                const ch = idx >= 0 ? n1[idx] : '';
                const cell = document.createElement('div');
                cell.className = 'cell top-digit';
                cell.textContent = ch;
                grid.appendChild(cell);
            }

            const botOpCell = document.createElement('div');
            botOpCell.className = 'cell operator-cell';
            botOpCell.textContent = symbol;
            grid.appendChild(botOpCell);
            for (let i = 0; i < maxLen; i++) {
                const idx = i - (maxLen - n2.length);
                const ch = idx >= 0 ? n2[idx] : '';
                const cell = document.createElement('div');
                cell.className = 'cell bot-digit';
                cell.textContent = ch;
                grid.appendChild(cell);
            }

            const underline = document.createElement('div');
            underline.className = 'underline';
            underline.style.gridColumn = `1 / span ${maxLen + 1}`;
            grid.appendChild(underline);

            wrapper.appendChild(grid);

            const answerRow = document.createElement('div');
            answerRow.className = 'answer-row';
            answerRow.style.gridColumn = `2 / span ${maxLen}`;
            answerRow.style.display = 'flex';
            answerRow.style.justifyContent = 'center';
            answerRow.style.gap = '12px';

            answerRow.innerHTML = '';
            for (let i = 0; i < boxesCount; i++) {
                const box = document.createElement('span');
                box.className = 'answer-box';
                box.textContent = '';
                answerRow.appendChild(box);
            }

            wrapper.appendChild(answerRow);

            container.appendChild(wrapper);

            answerDisplay.innerHTML = '';
            answerDisplay.classList.remove('answer-boxes');
            const boxes = answerRow.querySelectorAll('.answer-box');
            boxes.forEach(b => answerDisplay.appendChild(b));
            answerDisplay.classList.add('answer-boxes');
        }


        function updateAnswerBoxes() {
                const boxesNode = answerDisplay.querySelectorAll('.answer-box');
                const boxesArr = Array.from(boxesNode);
                const dir = window.getComputedStyle(answerDisplay).direction || 'ltr';
                const visualBoxes = dir === 'rtl' ? boxesArr.slice().reverse() : boxesArr;

                visualBoxes.forEach(b => { b.textContent = ''; b.classList.remove('filled'); });
                for (let i = 0; i < currentInputDigits.length; i++) {
                    const vIndex = visualBoxes.length - 1 - i;
                    if (vIndex >= 0) visualBoxes[vIndex].textContent = currentInputDigits[i];
                }
                visualBoxes.forEach(b => {
                    if (b.textContent.trim() !== '') b.classList.add('filled');
                    else b.classList.remove('filled');
                });
        }

    function openOp(card) {
        const a = parseInt(card.dataset.a, 10);
        const b = parseInt(card.dataset.b, 10);
        const id = card.dataset.id;
        currentOp = { id: id ? parseInt(id) : null, a: a, b: b, card };

    const symbol = (typeof TIPO !== 'undefined' && TIPO === 'R') ? '-' : '+';

    renderCalculation(a, b, symbol);
            readonlyMode = card.classList.contains('done');
            if (readonlyMode) {
                if (card.dataset.entered) {
                    currentInputDigits = card.dataset.entered.split('');
                } else {
                    const statusEl = card.querySelector('.status');
                    if (statusEl) {
                        const text = statusEl.textContent.trim();
                        const cleaned = text.replace(/[^0-9-]/g, '');
                        currentInputDigits = String(cleaned).split('').reverse();
                    } else {
                        currentInputDigits = [];
                    }
                }
                keys.forEach(k => k.disabled = true);
                clearBtn.disabled = true;
                submitBtn.disabled = true;
            } else {
                currentInputDigits = [];
                keys.forEach(k => k.disabled = false);
                clearBtn.disabled = false;
                submitBtn.disabled = false;
            }
            if (answerDisplay.querySelectorAll && answerDisplay.querySelectorAll('.answer-box').length) {
                updateAnswerBoxes();
            } else {
                answerDisplay.textContent = '—';
            }
        feedback.textContent = '';
        overlay.classList.remove('hidden');
        document.querySelectorAll('.card').forEach(c => { if (c !== card) c.style.display = 'none'; });
    }

    function closeOp() {
        overlay.classList.add('hidden');
        document.querySelectorAll('.card').forEach(c => c.style.display = 'block');
        currentOp = null;
        readonlyMode = false;
        keys.forEach(k => k.disabled = false);
        clearBtn.disabled = false;
        submitBtn.disabled = false;
    }

    cards.forEach(card => {
        card.addEventListener('click', () => openOp(card));
    });

    closeBtn.addEventListener('click', closeOp);

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
            if (readonlyMode) return; // no hay input de nada si esta en modo lectura
            const val = e.target.textContent.trim();
            if (val === '0') {
                if (currentInputDigits.length >= 3) return;
                currentInputDigits.push('0');
            } else if (val >= '1' && val <= '9') {
                if (currentInputDigits.length >= 3) return;
                currentInputDigits.push(val);
            }
            if (currentInputDigits.length === 0) {
                if (answerDisplay.querySelectorAll && answerDisplay.querySelectorAll('.answer-box').length) {
                    updateAnswerBoxes();
                } else {
                    answerDisplay.textContent = '—';
                }
            } else {
                updateAnswerBoxes();
            }
        });
    });

    clearBtn.addEventListener('click', () => {
        if (readonlyMode) return; // No permite borrar en modo lectura
        currentInputDigits = [];
        if (answerDisplay.querySelectorAll && answerDisplay.querySelectorAll('.answer-box').length) {
            updateAnswerBoxes();
        } else {
            answerDisplay.textContent = '—';
        }
        feedback.textContent = '';
    });

    submitBtn.addEventListener('click', () => {
        if (readonlyMode) return; // Y no deja enviar el ejercicio en modo lectura
        if (!currentOp) return;

        const a = currentOp.a;
        const b = currentOp.b;
    // Resuelve la operación
    const symbol = (typeof TIPO !== 'undefined' && TIPO === 'R') ? '-' : '+';
        const computed = symbol === '-' ? (a - b) : (a + b);
        if (currentInputDigits.length === 0) {
            feedback.textContent = 'Introduce un número usando los botones.';
            return;
        }
        const givenStr = currentInputDigits.slice().reverse().join('');
        const given = parseInt(givenStr, 10);

        if (currentOp.id) {
            fetch(window.location.href, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'check', op_id: currentOp.id, answer: given })
            }).then(r => r.json()).then(data => {
                if (data.success && data.correct) {
                    feedback.textContent = 'Correcto ✅';
                    const enteredUnits = currentInputDigits.join('');
                    markDone(currentOp.card, enteredUnits);
                    setTimeout(closeOp, 900);
                } else if (data.success && !data.correct) {
                    feedback.textContent = 'Incorrecto ❌. Intenta otra vez.';
                } else {
                    feedback.textContent = 'Error en el servidor.';
                }
            }).catch(() => feedback.textContent = 'Error de red.');
        } else {
            if (given === computed) {
                feedback.textContent = 'Correcto ✅ (no persistido)';
                const enteredUnits = currentInputDigits.join('');
                markDone(currentOp.card, enteredUnits);
                setTimeout(closeOp, 900);
            } else {
                feedback.textContent = 'Incorrecto ❌. Intenta otra vez.';
            }
        }
    });

    function markDone(card, enteredUnits) {
        card.classList.add('done');
        if (typeof enteredUnits !== 'undefined') card.dataset.entered = enteredUnits;
        const status = card.querySelector('.status');
        if (status) {
            const a = parseInt(card.dataset.a, 10);
            const b = parseInt(card.dataset.b, 10);
            const symbol = (typeof TIPO !== 'undefined' && TIPO === 'R') ? '-' : '+';
            const result = symbol === '-' ? (a - b) : (a + b);
            status.textContent = '✅ ' + String(result);
        }
        card.classList.add('celebrate');
        card.style.position = card.style.position || 'relative';
        const onEnd = () => { card.classList.remove('celebrate'); card.removeEventListener('animationend', onEnd); };
        card.addEventListener('animationend', onEnd);
    }
});
