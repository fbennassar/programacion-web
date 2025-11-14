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
    // currentInputDigits stores digits in order of entry (units first). e.g. user presses 3 then 2 -> ['3','2'] represents 23
    let currentInputDigits = [];
    let readonlyMode = false;

    function renderStackedNumber(container, value) {
            // Deprecated: kept for compatibility
            container.innerHTML = '';
            const str = String(value);
            const wrapper = document.createElement('div');
            wrapper.className = 'stacked-number';
            for (let ch of str) {
                const span = document.createElement('span');
                span.className = 'digit';
                span.textContent = ch;
                wrapper.appendChild(span);
            }
            container.appendChild(wrapper);
    }

        function renderCalculation(a, b, symbol) {
            // Build a grid with operator cell + digit columns, aligned to the right
            const container = document.querySelector('.big-numbers');
            container.innerHTML = '';

            const sa = String(a);
            const sb = String(b);
            const maxLen = Math.max(sa.length, sb.length);
            // determine number of answer boxes:
            let boxesCount;
            if (symbol === '-') {
                // subtraction: result will have at most maxLen digits
                boxesCount = maxLen;
            } else {
                // addition: result may have extra digit (e.g., 99+99=198)
                boxesCount = String(a + b).length;
                if (boxesCount < maxLen) boxesCount = maxLen;
            }

        // Create wrapper that will contain the calc grid and the answer row so columns align
        const wrapper = document.createElement('div');
        wrapper.className = 'calc-wrapper';
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateColumns = `auto repeat(${maxLen}, 1fr)`;
        wrapper.style.gap = '6px';

        // Create grid for digits (two rows)
        const grid = document.createElement('div');
        grid.className = 'calc-grid';
        grid.style.gridColumn = '1 / -1';
        grid.style.display = 'contents';

            // Top row: empty operator cell + digits of A (right-aligned)
            const topOpCell = document.createElement('div');
            topOpCell.className = 'cell operator-cell';
            topOpCell.textContent = '';
            grid.appendChild(topOpCell);
            // digits for A: pad left with blanks
            for (let i = 0; i < maxLen; i++) {
                const idx = i - (maxLen - sa.length);
                const ch = idx >= 0 ? sa[idx] : '';
                const cell = document.createElement('div');
                cell.className = 'cell top-digit';
                cell.textContent = ch;
                grid.appendChild(cell);
            }

            // Bottom row: operator in first cell, then digits for B
            const botOpCell = document.createElement('div');
            botOpCell.className = 'cell operator-cell';
            botOpCell.textContent = symbol;
            grid.appendChild(botOpCell);
            for (let i = 0; i < maxLen; i++) {
                const idx = i - (maxLen - sb.length);
                const ch = idx >= 0 ? sb[idx] : '';
                const cell = document.createElement('div');
                cell.className = 'cell bot-digit';
                cell.textContent = ch;
                grid.appendChild(cell);
            }

            // Append underline row (spanning all columns)
            const underline = document.createElement('div');
            underline.className = 'underline';
            underline.style.gridColumn = `1 / span ${maxLen + 1}`;
            grid.appendChild(underline);

            // Insert grid into wrapper
            wrapper.appendChild(grid);

            // Create answer-row container that will align under the digit columns (start at column 2)
            const answerRow = document.createElement('div');
            answerRow.className = 'answer-row';
            answerRow.style.gridColumn = `2 / span ${maxLen}`;
            answerRow.style.display = 'flex';
            answerRow.style.justifyContent = 'center';
            answerRow.style.gap = '12px';

            // Create boxes equal to boxesCount and append to answerRow
            answerRow.innerHTML = '';
            for (let i = 0; i < boxesCount; i++) {
                const box = document.createElement('span');
                box.className = 'answer-box';
                box.textContent = '';
                answerRow.appendChild(box);
            }

            wrapper.appendChild(answerRow);

            // Insert wrapper into container
            container.appendChild(wrapper);

            // Ensure answerDisplay references the answerRow (so updateAnswerBoxes uses these boxes)
            // Replace answerDisplay content with these boxes for consistency
            answerDisplay.innerHTML = '';
            answerDisplay.classList.remove('answer-boxes');
            // Move boxes into answerDisplay for previous logic compatibility
            const boxes = answerRow.querySelectorAll('.answer-box');
            boxes.forEach(b => answerDisplay.appendChild(b));
            // Add a wrapper styling class
            answerDisplay.classList.add('answer-boxes');
        }

        function renderAnswerBoxes(count) {
            // answerDisplay will be replaced with boxes
            answerDisplay.innerHTML = '';
            answerDisplay.classList.add('answer-boxes');
            for (let i = 0; i < count; i++) {
                const box = document.createElement('span');
                box.className = 'answer-box';
                box.textContent = '';
                answerDisplay.appendChild(box);
            }
        }

        function updateAnswerBoxes() {
                const boxesNode = answerDisplay.querySelectorAll('.answer-box');
                const boxesArr = Array.from(boxesNode);
                // Determine visual order: if container direction is rtl, the visual left-to-right
                // order is the reverse of DOM order. Normalize to visual left-to-right in visualBoxes.
                const dir = window.getComputedStyle(answerDisplay).direction || 'ltr';
                const visualBoxes = dir === 'rtl' ? boxesArr.slice().reverse() : boxesArr;

                // clear
                visualBoxes.forEach(b => { b.textContent = ''; b.classList.remove('filled'); });
                // fill from right to left using currentInputDigits (units-first)
                for (let i = 0; i < currentInputDigits.length; i++) {
                    const vIndex = visualBoxes.length - 1 - i; // rightmost visual box index
                    if (vIndex >= 0) visualBoxes[vIndex].textContent = currentInputDigits[i];
                }
                // mark filled boxes
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
    // render calculation grid (with operator)
    const symbol = (typeof TIPO !== 'undefined' && TIPO === 'R') ? '-' : '+';
    renderCalculation(a, b, symbol);
            // Determine readonly mode if this card is already done
            readonlyMode = card.classList.contains('done');
            if (readonlyMode) {
                // Try to populate entered digits from dataset (units-first), else from status/result
                if (card.dataset.entered) {
                    currentInputDigits = card.dataset.entered.split('');
                } else {
                    // fallback: use numeric status text if present
                    const statusEl = card.querySelector('.status');
                    if (statusEl) {
                        const text = statusEl.textContent.trim();
                        // remove any non-digit characters
                        const cleaned = text.replace(/[^0-9-]/g, '');
                        currentInputDigits = String(cleaned).split('').reverse();
                    } else {
                        currentInputDigits = [];
                    }
                }
                // disable keypad buttons
                keys.forEach(k => k.disabled = true);
                clearBtn.disabled = true;
                submitBtn.disabled = true;
            } else {
                currentInputDigits = [];
                // enable keypad
                keys.forEach(k => k.disabled = false);
                clearBtn.disabled = false;
                submitBtn.disabled = false;
            }
            // initialize answer boxes (they were created by renderCalculation)
            if (answerDisplay.querySelectorAll && answerDisplay.querySelectorAll('.answer-box').length) {
                updateAnswerBoxes();
            } else {
                // only set dash if there are no boxes
                answerDisplay.textContent = '—';
            }
        feedback.textContent = '';
        overlay.classList.remove('hidden');
        // hide other cards
        document.querySelectorAll('.card').forEach(c => { if (c !== card) c.style.display = 'none'; });
    }

    function closeOp() {
        overlay.classList.add('hidden');
        document.querySelectorAll('.card').forEach(c => c.style.display = 'block');
        currentOp = null;
        // reset readonly mode and re-enable keypad
        readonlyMode = false;
        keys.forEach(k => k.disabled = false);
        clearBtn.disabled = false;
        submitBtn.disabled = false;
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
            if (readonlyMode) return; // don't accept input in read-only view
            const val = e.target.textContent.trim();
            if (val === '0') {
                // Allow '0' even as first digit (units-first entry). Still enforce max length.
                if (currentInputDigits.length >= 3) return; // limit digits to 3
                currentInputDigits.push('0');
            } else if (val >= '1' && val <= '9') {
                if (currentInputDigits.length >= 3) return; // limit digits to 3
                currentInputDigits.push(val);
            }
            // Display right-to-left: join reversed so visually it appears units at right
            if (currentInputDigits.length === 0) {
                // if answer boxes exist, clear; otherwise show dash
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
        if (readonlyMode) return; // no clearing in read-only
        currentInputDigits = [];
        // If answer boxes exist, clear them, otherwise show dash
        if (answerDisplay.querySelectorAll && answerDisplay.querySelectorAll('.answer-box').length) {
            updateAnswerBoxes();
        } else {
            answerDisplay.textContent = '—';
        }
        feedback.textContent = '';
    });

    submitBtn.addEventListener('click', () => {
        if (readonlyMode) return; // prevent submitting in read-only mode
        if (!currentOp) return;

        const a = currentOp.a;
        const b = currentOp.b;
    // Determine tipo from global TIPO variable (set server-side). 'R' => restas
    const symbol = (typeof TIPO !== 'undefined' && TIPO === 'R') ? '-' : '+';
        const computed = symbol === '-' ? (a - b) : (a + b);
        // compute given from digits entered (currentInputDigits holds units-first)
        if (currentInputDigits.length === 0) {
            feedback.textContent = 'Introduce un número usando los botones.';
            return;
        }
        const givenStr = currentInputDigits.slice().reverse().join('');
        const given = parseInt(givenStr, 10);

        // If op has an id (saved in DB) send AJAX to check, otherwise evaluate locally
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
            // fallback local check
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
        // store entered digits (units-first) so we can show them later when viewing
        if (typeof enteredUnits !== 'undefined') card.dataset.entered = enteredUnits;
        const status = card.querySelector('.status');
        if (status) {
            // compute and display the numeric result with a green check
            const a = parseInt(card.dataset.a, 10);
            const b = parseInt(card.dataset.b, 10);
            const symbol = (typeof TIPO !== 'undefined' && TIPO === 'R') ? '-' : '+';
            const result = symbol === '-' ? (a - b) : (a + b);
            status.textContent = '✅ ' + String(result);
        }
        // add a short celebration animation class and remove after animation completes
        card.classList.add('celebrate');
        // ensure the card has position:relative to place pseudo-element correctly
        card.style.position = card.style.position || 'relative';
        const onEnd = () => { card.classList.remove('celebrate'); card.removeEventListener('animationend', onEnd); };
        card.addEventListener('animationend', onEnd);
    }
});
