document.addEventListener('DOMContentLoaded', () => {
    // --- Funciones de Utilidad para LocalStorage ---
    const getData = (key) => JSON.parse(localStorage.getItem(key));
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Inicialización de Datos si no existen ---
    if (!getData('administradores')) saveData('administradores', []);
    if (!getData('registroBloqueado')) saveData('registroBloqueado', false);
    if (!getData('universidades')) saveData('universidades', []);
    if (!getData('grupos')) saveData('grupos', []);
    if (!getData('rubrica')) saveData('rubrica', []);
    if (!getData('evaluaciones')) saveData('evaluaciones', []);
    if (!getData('loggedInAdmin')) saveData('loggedInAdmin', null);
    if (!getData('loggedInJuez')) saveData('loggedInJuez', null);

    // --- Registro de Administradores (register.html) ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const checkAdminLimit = () => {
            const administradores = getData('administradores');
            const registroBloqueado = getData('registroBloqueado');
            const registerMessage = document.getElementById('register-message');
            const registerError = document.getElementById('register-error');

            if (registroBloqueado) {
                const formElements = registerForm.elements;
                for (let i = 0; i < formElements.length; i++) {
                    formElements[i].disabled = true;
                }
                if (registerError) registerError.textContent = 'El registro de administradores está cerrado.';
                return true;
            }

            if (administradores.length >= 2) {
                saveData('registroBloqueado', true);
                const formElements = registerForm.elements;
                for (let i = 0; i < formElements.length; i++) {
                    formElements[i].disabled = true;
                }
                if (registerError) registerError.textContent = 'Se ha alcanzado el límite de administradores. El registro se ha cerrado.';
                return true;
            }
            return false;
        };

        checkAdminLimit(); // Verificar al cargar la página de registro

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('register-nombre').value;
            const apellido = document.getElementById('register-apellido').value;
            const correo = document.getElementById('register-correo').value;
            const contraseña = document.getElementById('register-password').value;
            const registerMessage = document.getElementById('register-message');
            const registerError = document.getElementById('register-error');
            const administradores = getData('administradores');

            if (getData('registroBloqueado')) {
                registerError.textContent = 'El registro de administradores está cerrado.';
                return;
            }

            if (administradores.length >= 2) {
                saveData('registroBloqueado', true);
                registerError.textContent = 'Se ha alcanzado el límite de administradores. El registro se ha cerrado.';
                return;
            }

            const nuevoAdmin = { nombre, apellido, correo, contraseña }; // ¡No hacer esto en producción!
            administradores.push(nuevoAdmin);
            saveData('administradores', administradores);
            registerMessage.textContent = `Administrador ${nombre} registrado.`;
            registerForm.reset();

            if (administradores.length === 2) {
                saveData('registroBloqueado', true);
                registerMessage.textContent += ' El registro de administradores se ha cerrado.';
            }
            checkAdminLimit(); // Verificar después de un nuevo registro
        });

        // Bloquear formulario si ya hay 2 administradores
        if (getData('registroBloqueado')) {
            const formElements = registerForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }
            document.getElementById('register-message').textContent = 'El registro de administradores está cerrado.';
        } else if (getData('administradores').length >= 2) {
            const formElements = registerForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }
            document.getElementById('register-message').textContent = 'Se ha alcanzado el límite de administradores. El registro se ha cerrado.';
            saveData('registroBloqueado', true);
        }
    }

    // --- Inicio de Sesión (index.html) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const checkAdminRegistration = () => {
            const administradores = getData('administradores');
            const registerSection = document.getElementById('register-section');
            if (registerSection) {
                if (administradores.length >= 2) {
                    registerSection.style.display = 'none';
                } else {
                    registerSection.style.display = 'block';
                }
            }
        };

        checkAdminRegistration(); // Verificar al cargar la página de inicio de sesión

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const correo = document.getElementById('login-correo').value;
            const contraseña = document.getElementById('login-password').value;
            const loginError = document.getElementById('login-error');
            const administradores = getData('administradores');

            const adminLogueado = administradores.find(admin => admin.correo === correo && admin.contraseña === contraseña); // ¡No hacer esto en producción!

            if (adminLogueado) {
                saveData('loggedInAdmin', { correo: adminLogueado.correo, nombre: adminLogueado.nombre });
                window.location.href = 'admin.html';
            } else {
                // Intentar loguear como juez (solo verifica que ingresó nombre y apellido)
                const juezNombre = document.getElementById('juez-nombre').value;
                const juezApellido = document.getElementById('juez-apellido').value;
                if (juezNombre && juezApellido) {
                    saveData('loggedInJuez', { nombre: juezNombre, apellido: juezApellido });
                    window.location.href = 'juez.html';
                } else {
                    loginError.textContent = 'Credenciales de administrador incorrectas.';
                }
            }
        });
    }

    // --- Ingreso como Juez (index.html) ---
    const juezLoginForm = document.getElementById('juez-login-form');
    if (juezLoginForm) {
        juezLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('juez-nombre').value;
            const apellido = document.getElementById('juez-apellido').value;
            if (nombre && apellido) {
                saveData('loggedInJuez', { nombre, apellido });
                window.location.href = 'juez.html';
            } else {
                document.getElementById('juez-login-error').textContent = 'Por favor, ingresa tu nombre y apellido.';
            }
        });
    }

    // --- Panel de Administrador (admin.html) ---
    if (window.location.pathname.includes('admin.html')) {
        const loggedInAdmin = getData('loggedInAdmin');
        if (!loggedInAdmin) {
            window.location.href = 'index.html';
        }

        const manageUniversitiesSection = document.getElementById('manage-universities');
        const manageRubricSection = document.getElementById('manage-rubric');
        const viewResultsSection = document.getElementById('view-results');
        const manageUniversitiesLink = document.getElementById('manage-universities-link');
        const manageRubricLink = document.getElementById('manage-rubric-link');
        const viewResultsLink = document.getElementById('view-results-link');
        const logoutAdminButton = document.getElementById('logout-admin');
        const resetDataButton = document.getElementById('reset-data-button'); // Botón de reset

        const showSection = (section) => {
            manageUniversitiesSection.classList.add('hidden');
            manageRubricSection.classList.add('hidden');
            viewResultsSection.classList.add('hidden');
            section.classList.remove('hidden');
        };

        if (manageUniversitiesLink) manageUniversitiesLink.addEventListener('click', () => showSection(manageUniversitiesSection));
        if (manageRubricLink) manageRubricLink.addEventListener('click', () => showSection(manageRubricSection));
        if (viewResultsLink) viewResultsLink.addEventListener('click', () => showSection(viewResultsSection));

        // Inicialmente mostrar la sección de universidades
        if (!window.location.hash) {
            showSection(manageUniversitiesSection);
        } else if (window.location.hash === '#rubric') {
            showSection(manageRubricSection);
        } else if (window.location.hash === '#results') {
            showSection(viewResultsSection);
        }

        // Añadir Universidad
        const addUniversityForm = document.getElementById('add-university-form');
        if (addUniversityForm) {
            const universityNameInput = document.getElementById('university-name');
            const addUniversityMessage = document.getElementById('add-university-message');
            addUniversityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = universityNameInput.value.trim();
                if (name) {
                    const universidades = getData('universidades');
                    const newUniversity = { id: `uni_${Date.now()}`, nombre: name };
                    universidades.push(newUniversity);
                    saveData('universidades', universidades);
                    addUniversityMessage.textContent = `Universidad "${name}" añadida.`;
                    universityNameInput.value = '';
                    renderUniversitiesAndGroups();
                    populateUniversityDropdown();
                } else {
                    addUniversityMessage.textContent = 'Por favor, introduce el nombre de la universidad.';
                }
            });
        }

        // Añadir Grupo
        const addGroupForm = document.getElementById('add-group-form');
        if (addGroupForm) {
            const groupUniversitySelect = document.getElementById('group-university');
            const groupNameInput = document.getElementById('group-name');
            const addGroupMessage = document.getElementById('add-group-message');
            addGroupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const universityId = groupUniversitySelect.value;
                const name = groupNameInput.value.trim();
                if (universityId && name) {
                    const grupos = getData('grupos');
                    const newGroup = { id: `grp_${Date.now()}`, nombre: name, universidad_id: universityId };
                    grupos.push(newGroup);
                    saveData('grupos', grupos);
                    addGroupMessage.textContent = `Grupo "${name}" añadido a la universidad.`;
                    groupNameInput.value = '';
                    renderUniversitiesAndGroups();
                } else {
                    addGroupMessage.textContent = 'Por favor, selecciona una universidad y el nombre del grupo.';
                }
            });
        }

        // Añadir Criterio a la Rúbrica
        const addRubricItemForm = document.getElementById('add-rubric-item-form');
        if (addRubricItemForm) {
            const rubricNameInput = document.getElementById('rubric-name');
            const rubricWeightInput = document.getElementById('rubric-weight');
            const addRubricMessage = document.getElementById('add-rubric-message');
            addRubricItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = rubricNameInput.value.trim();
                const weight = parseFloat(rubricWeightInput.value) / 100;
                if (name && !isNaN(weight) && weight > 0) {
                    const rubrica = getData('rubrica');
                    const newRubricItem = { id: `rubric_${Date.now()}`, nombre: name, peso: weight };
                    rubrica.push(newRubricItem);
                    saveData('rubrica', rubrica);
                    addRubricMessage.textContent = `Criterio "${name}" añadido a la rúbrica.`;
                    rubricNameInput.value = '';
                    rubricWeightInput.value = '';
                    renderRubric();
                } else {
                    addRubricMessage.textContent = 'Por favor, introduce el nombre del criterio y un peso válido.';
                }
            });
        }

        // Renderizar Universidades y Grupos
        const universitiesGroupsListDiv = document.getElementById('universities-groups-list');
        const renderUniversitiesAndGroups = () => {
            if (!universitiesGroupsListDiv) return;
            const universidades = getData('universidades');
            const grupos = getData('grupos');
            let html = '<h3>Universidades</h3><ul>';
            universidades.forEach(uni => {
                html += `<li>${uni.nombre}<ul>`;
                grupos.filter(grupo => grupo.universidad_id === uni.id).forEach(grupo => {
                    html += `<li>- ${grupo.nombre}</li>`;
                });
                html += '</ul></li>';
            });
            html += '</ul>';
            universitiesGroupsListDiv.innerHTML = html;
        };
        renderUniversitiesAndGroups();

        // Renderizar Rúbrica
        const rubricListDiv = document.getElementById('rubric-list');
        const renderRubric = () => {
            if (!rubricListDiv) return;
            const rubrica = getData('rubrica');
            let html = '<ul>';
            rubrica.forEach(item => {
                html += `<li>${item.nombre} (Peso: ${item.peso * 100}%)</li>`;
            });
            html += '</ul>';
            rubricListDiv.innerHTML = html;
        };
        renderRubric();

        // Renderizar Resultados
        const resultsContainerDiv = document.getElementById('results-container');
        const renderResults = () => {
            if (!resultsContainerDiv) return;
            const evaluaciones = getData('evaluaciones');
            const universidades = getData('universidades');
            const grupos = getData('grupos');
            const rubrica = getData('rubrica');

            if (evaluaciones.length === 0) {
                resultsContainerDiv.innerHTML = '<p>No hay evaluaciones aún.</p>';
                return;
            }

            let resultsHTML = '';
            universidades.forEach(uni => {
                resultsHTML += `<h3>${uni.nombre}</h3>`;
                grupos.filter(grupo => grupo.universidad_id === uni.id).forEach(grupo => {
                    const grupoEvaluaciones = evaluaciones.filter(eval => eval.universidad_id === uni.id && eval.grupo_id === grupo.id);
                    if (grupoEvaluaciones.length > 0) {
                        let totalScore = 0;
                        grupoEvaluaciones.forEach(evaluacion => {
                            let score = 0;
                            rubrica.forEach(criterio => {
                                score += (evaluacion.puntuaciones[criterio.id] || 0) * criterio.peso;
                            });
                            totalScore += score;
                        });
                        const averageScore = totalScore / grupoEvaluaciones.length;
                        resultsHTML += `<ul><li>Grupo: ${grupo.nombre} - Puntuación Promedio: ${(averageScore).toFixed(2)}</li></ul>`;
                    } else {
                        resultsHTML += `<ul><li>Grupo: ${grupo.nombre} - Sin evaluaciones</li></ul>`;
                    }
                });
            });

            resultsContainerDiv.innerHTML = resultsHTML;
        };

        const viewResultsLinkElement = document.getElementById('view-results-link');
        if (viewResultsLinkElement) {
            viewResultsLinkElement.addEventListener('click', renderResults);
        }
        renderResults(); // Renderizar al cargar la página si estamos en la sección de resultados

        // Cerrar Sesión de Administrador
        if (logoutAdminButton) {
            logoutAdminButton.addEventListener('click', () => {
                saveData('loggedInAdmin', null);
                window.location.href = 'index.html';
            });
        }

        // Función para popular el dropdown de universidades
        const populateUniversityDropdown = () => {
            const universitySelects = document.querySelectorAll('#group-university, #eval-university');
            const universidades = getData('universidades');
            universitySelects.forEach(select => {
                if (select) {
                    select.innerHTML = '<option value="">Seleccionar Universidad</option>';
                    universidades.forEach(uni => {
                        const option = document.createElement('option');
                        option.value = uni.id;
                        option.textContent = uni.nombre;
                        select.appendChild(option);
                    });
                }
            });
        };
        populateUniversityDropdown();

        // --- Eliminar Todos los Datos ---
        if (resetDataButton) {
            resetDataButton.addEventListener('click', () => {
                localStorage.clear();
                alert('Todos los datos han sido eliminados. Por favor, recargue la página.');
                // Recargar la página después de limpiar los datos
                window.location.reload();
            });
        }
    }

    // --- Panel de Juez (juez.html) ---
    if (window.location.pathname.includes('juez.html')) {
        const loggedInJuez = getData('loggedInJuez');
        if (!loggedInJuez) {
            window.location.href = 'index.html';
        }

        const juezInfo = document.getElementById('juez-info');
        if (juezInfo && loggedInJuez) {
            juezInfo.textContent = `Juez: ${loggedInJuez.nombre} ${loggedInJuez.apellido}`;
        }

        const logoutJuezButton = document.getElementById('logout-juez');
        if (logoutJuezButton) {
            logoutJuezButton.addEventListener('click', () => {
                saveData('loggedInJuez', null);
                window.location.href = 'index.html';
            });
        }

        const evalUniversitySelect = document.getElementById('eval-university');
        const evalGroupSelect = document.getElementById('eval-group');
        const rubricEvaluationFieldsDiv = document.getElementById('rubric-evaluation-fields');
        const evaluationForm = document.getElementById('evaluation-form');
        const evaluationMessage = document.getElementById('evaluation-message');

        const universidades = getData('universidades');
        const rubrica = getData('rubrica');

        // Popular el selector de universidades
        if (evalUniversitySelect) {
            universidades.forEach(uni => {
                const option = document.createElement('option');
                option.value = uni.id;
                option.textContent = uni.nombre;
                evalUniversitySelect.appendChild(option);
            });

            evalUniversitySelect.addEventListener('change', () => {
                const selectedUniversityId = evalUniversitySelect.value;
                const grupos = getData('grupos').filter(g => g.universidad_id === selectedUniversityId);
                if (evalGroupSelect) {
                    evalGroupSelect.innerHTML = '<option value="">Seleccionar Grupo</option>';
                    grupos.forEach(grupo => {
                        const option = document.createElement('option');
                        option.value = grupo.id;
                        option.textContent = grupo.nombre;
                        evalGroupSelect.appendChild(option);
                    });
                    // Limpiar los campos de evaluación al cambiar de universidad
                    rubricEvaluationFieldsDiv.innerHTML = '';
                }
            });
        }

        // Generar campos de evaluación al seleccionar un grupo
        if (evalGroupSelect) {
            evalGroupSelect.addEventListener('change', () => {
                const selectedGroupId = evalGroupSelect.value;
                if (selectedGroupId) {
                    rubricEvaluationFieldsDiv.innerHTML = ''; // Limpiar campos anteriores
                    rubrica.forEach(item => {
                        const div = document.createElement('div');
                        div.innerHTML = `
                            <label for="eval-${item.id}">${item.nombre} (${item.peso * 100}%):</label>
                            <input type="number" id="eval-${item.id}" name="eval-${item.id}" min="0" max="10" required>
                        `;
                        rubricEvaluationFieldsDiv.appendChild(div);
                    });
                }
            });
        }

        // Enviar Evaluación
        if (evaluationForm) {
            evaluationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const universidadId = evalUniversitySelect.value;
                const grupoId = evalGroupSelect.value;

                if (!universidadId || !grupoId) {
                    evaluationMessage.textContent = 'Por favor, selecciona la universidad y el grupo a evaluar.';
                    return;
                }

                const puntuaciones = {};
                let valido = true;
                rubrica.forEach(item => {
                    const inputId = `eval-${item.id}`;
                    const valor = document.getElementById(inputId).value;
                    if (valor === '' || isNaN(valor) || valor < 0 || valor > 10) {
                        valido = false;
                    }
                    puntuaciones[item.id] = parseFloat(valor);
                });

                if (!valido) {
                    evaluationMessage.textContent = 'Por favor, ingresa una puntuación válida (0-10) para todos los criterios.';
                    return;
                }
                const loggedInJuez = getData('loggedInJuez');
                const nuevaEvaluacion = {
                    juez_nombre: loggedInJuez.nombre,
                    juez_apellido: loggedInJuez.apellido,
                    universidad_id: universidadId,
                    grupo_id: grupoId,
                    puntuaciones
                };

                const evaluaciones = getData('evaluaciones');
                evaluaciones.push(nuevaEvaluacion);
                saveData('evaluaciones', evaluaciones);
                evaluationMessage.textContent = 'Evaluación enviada.';
                evaluationForm.reset();
                rubricEvaluationFieldsDiv.innerHTML = ''; // Limpiar campos después de enviar
                evalGroupSelect.innerHTML = '<option value="">Seleccionar Grupo</option>';
                evalUniversitySelect.value = '';
            });
        }
    }
});

