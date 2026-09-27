/**
 * SoftAC - Sistema de Gestión Académico
 * Frontend Application: HU-04 Visualizar Cursos (#78, #79, #80, #83, #84)
 */

// Configuration & Simulated Docente JWT Profiles for Live Testing
const CONFIG = {
	API_BASE_URL: 'http://localhost:3000/api/v1',
	DOCENTES: {
		1: {
			id: 1,
			nombre: 'Admin Sistema',
			email: 'admin@instituto.edu.ar',
			rol: 'Docente Titular / Administrador',
			initials: 'AS',
			// Token firmado con secret 'jwt_secret_key' para ID 1
			token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBpbnN0aXR1dG8uZWR1LmFyIiwicm9sX2lkIjoyLCJpYXQiOjE3NDMyMTYwMDB9.z'
		},
		2: {
			id: 2,
			nombre: 'Juan Perez',
			email: 'juan.perez@instituto.edu.ar',
			rol: 'Docente Adjunto',
			initials: 'JP',
			// Token firmado para ID 2
			token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJqdWFuLnBlcmV6QGluc3RpdHV0by5lZHUuYXIiLCJyb2xfaWQiOjEsImlhdCI6MTc0MzIxNjAwMH0.z'
		},
		3: {
			id: 3,
			nombre: 'María Gómez',
			email: 'maria.gomez@instituto.edu.ar',
			rol: 'Docente Sin Asignación Activa',
			initials: 'MG',
			// Token firmado para ID 3 (0 Cursos -> Estado Vacío #83)
			token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJtYXJpYS5nb21lekBpbnN0aXR1dG8uZWR1LmFyIiwicm9sX2lkIjoxLCJpYXQiOjE3NDMyMTYwMDB9.z'
		}
	},
	FALLBACK_COURSES: [
		{
			id: 1,
			codigo: 'DSW-301',
			nombre: 'Desarrollo de Sistemas Web',
			descripcion: 'Arquitectura cliente-servidor, APIs REST con Node.js y Express, seguridad JWT, consultas MySQL y desarrollo guiado por pruebas (TDD).',
			docente_id: 1,
			docente_nombre: 'Admin',
			docente_apellido: 'Sistema',
			docente_email: 'admin@instituto.edu.ar',
			comision: 'Comisión A',
			periodo: '2026 - 1° Cuatrimestre',
			aula: 'Lab 3 - Informática',
			horario: 'Lunes y Miércoles 18:30 - 21:30',
			cupo_maximo: 30,
			alumnos_inscritos: 24,
			activo: 1
		},
		{
			id: 2,
			codigo: 'BD-201',
			nombre: 'Bases de Datos Avanzadas',
			descripcion: 'Diseño relacional avanzado, índices, procedimientos almacenados, optimización de consultas SQL, transacciones ACID e integridad.',
			docente_id: 1,
			docente_nombre: 'Admin',
			docente_apellido: 'Sistema',
			docente_email: 'admin@instituto.edu.ar',
			comision: 'Comisión B',
			periodo: '2026 - 1° Cuatrimestre',
			aula: 'Aula Magna 2',
			horario: 'Martes y Jueves 19:00 - 22:00',
			cupo_maximo: 40,
			alumnos_inscritos: 38,
			activo: 1
		},
		{
			id: 3,
			codigo: 'ING-202',
			nombre: 'Ingeniería de Software I',
			descripcion: 'Ciclos de vida de software, metodologías ágiles (Scrum, Kanban), modelado UML, historias de usuario y testing unitario.',
			docente_id: 1,
			docente_nombre: 'Admin',
			docente_apellido: 'Sistema',
			docente_email: 'admin@instituto.edu.ar',
			comision: 'Comisión A',
			periodo: '2026 - 2° Cuatrimestre',
			aula: 'Lab 1',
			horario: 'Sábados 09:00 - 13:00',
			cupo_maximo: 25,
			alumnos_inscritos: 19,
			activo: 1
		},
		{
			id: 4,
			codigo: 'AYED-101',
			nombre: 'Algoritmos y Estructuras de Datos',
			descripcion: 'Fundamentos de algoritmos, análisis asintótico de complejidad Big-O, pilas, colas, listas enlazadas, árboles binarios y grafos.',
			docente_id: 2,
			docente_nombre: 'Juan',
			docente_apellido: 'Perez',
			docente_email: 'juan.perez@instituto.edu.ar',
			comision: 'Comisión C',
			periodo: '2026 - 1° Cuatrimestre',
			aula: 'Aula 104',
			horario: 'Viernes 14:00 - 18:00',
			cupo_maximo: 35,
			alumnos_inscritos: 32,
			activo: 1
		}
	]
};

// Application State
const state = {
	currentDocenteId: 1,
	activeView: 'mis-cursos', // 'mis-cursos' | 'todos'
	searchTerm: '',
	filterPeriodo: '',
	filterComision: '',
	filterEscuela: '',
	currentPage: 1,
	limit: 10,
	viewMode: 'grid', // 'grid' | 'list'
	courses: [],
	allCourses: [],
	pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
	isLoading: false,
	searchDebounceTimer: null
};

// DOM Elements Cache
const DOM = {
	docenteSelector: document.getElementById('docente-selector'),
	userName: document.getElementById('user-name'),
	userRole: document.getElementById('user-role'),
	userAvatar: document.getElementById('user-avatar'),
	themeToggle: document.getElementById('theme-toggle'),
	
	tabMisCursos: document.getElementById('tab-mis-cursos'),
	tabTodosCursos: document.getElementById('tab-todos-cursos'),
	countMisCursos: document.getElementById('count-mis-cursos'),
	pageTitle: document.getElementById('page-title'),

	statTotalCursos: document.getElementById('stat-total-cursos'),
	statTotalCupos: document.getElementById('stat-total-cupos'),
	statTotalComisiones: document.getElementById('stat-total-comisiones'),

	searchInput: document.getElementById('search-input'),
	clearSearch: document.getElementById('clear-search'),
	escuelaFilter: document.getElementById('escuela-filter'),
	periodoFilter: document.getElementById('periodo-filter'),
	comisionFilter: document.getElementById('comision-filter'),
	viewGrid: document.getElementById('view-grid'),
	viewList: document.getElementById('view-list'),
	btnNuevoCurso: document.getElementById('btn-nuevo-curso'),


	loadingSpinner: document.getElementById('loading-spinner'),
	coursesGrid: document.getElementById('courses-grid'),
	coursesTableWrapper: document.getElementById('courses-table-wrapper'),
	coursesTableBody: document.getElementById('courses-table-body'),
	
	// Empty state elements (#83)
	emptyState: document.getElementById('empty-state'),
	emptyIcon: document.getElementById('empty-icon'),
	emptyTitle: document.getElementById('empty-title'),
	emptyDescription: document.getElementById('empty-description'),
	emptyBtnAction: document.getElementById('empty-btn-action'),
	emptyBtnExplore: document.getElementById('empty-btn-explore'),

	// Pagination elements
	paginationBar: document.getElementById('pagination-bar'),
	pagStart: document.getElementById('pag-start'),
	pagEnd: document.getElementById('pag-end'),
	pagTotal: document.getElementById('pag-total'),
	pagPrev: document.getElementById('pag-prev'),
	pagNext: document.getElementById('pag-next'),
	paginationPages: document.getElementById('pagination-pages'),

	// Modal Details
	modalDetalleOverlay: document.getElementById('modal-detalle-overlay'),
	modalCodigo: document.getElementById('modal-codigo'),
	modalNombre: document.getElementById('modal-nombre'),
	modalDocente: document.getElementById('modal-docente'),
	modalComision: document.getElementById('modal-comision'),
	modalPeriodo: document.getElementById('modal-periodo'),
	modalAula: document.getElementById('modal-aula'),
	modalHorario: document.getElementById('modal-horario'),
	modalCupo: document.getElementById('modal-cupo'),
	modalDescripcion: document.getElementById('modal-descripcion'),
	btnCloseDetalle: document.getElementById('btn-close-detalle'),
	btnCerrarModal: document.getElementById('btn-cerrar-modal'),
	btnCopiarCodigo: document.getElementById('btn-copiar-codigo'),

	// Modal Create
	modalCrearOverlay: document.getElementById('modal-crear-overlay'),
	formCrearCurso: document.getElementById('form-crear-curso'),
	btnCloseCrear: document.getElementById('btn-close-crear'),
	btnCancelarCrear: document.getElementById('btn-cancelar-crear'),

	toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
	initTheme();
	updateDocenteProfileUI();
	setupEventListeners();
	fetchCourses();
});

// Setup Event Listeners
function setupEventListeners() {
	// Theme toggle
	DOM.themeToggle.addEventListener('click', toggleTheme);

	// Docente switcher
	DOM.docenteSelector.addEventListener('change', (e) => {
		state.currentDocenteId = parseInt(e.target.value, 10);
		state.currentPage = 1;
		updateDocenteProfileUI();
		fetchCourses();
		showToast(`Perfil cambiado a: ${CONFIG.DOCENTES[state.currentDocenteId].nombre}`, 'info');
	});

	// View Tabs
	DOM.tabMisCursos.addEventListener('click', () => switchView('mis-cursos'));
	DOM.tabTodosCursos.addEventListener('click', () => switchView('todos'));

	// Search Input with Debounce
	DOM.searchInput.addEventListener('input', (e) => {
		state.searchTerm = e.target.value;
		DOM.clearSearch.style.display = state.searchTerm ? 'block' : 'none';

		clearTimeout(state.searchDebounceTimer);
		state.searchDebounceTimer = setTimeout(() => {
			state.currentPage = 1;
			fetchCourses();
		}, 300);
	});

	DOM.clearSearch.addEventListener('click', () => {
		DOM.searchInput.value = '';
		state.searchTerm = '';
		DOM.clearSearch.style.display = 'none';
		state.currentPage = 1;
		fetchCourses();
	});

	// Filters
	if (DOM.escuelaFilter) {
		DOM.escuelaFilter.addEventListener('change', (e) => {
			state.filterEscuela = e.target.value;
			state.currentPage = 1;
			fetchCourses();
		});
	}

	DOM.periodoFilter.addEventListener('change', (e) => {
		state.filterPeriodo = e.target.value;
		state.currentPage = 1;
		fetchCourses();
	});

	DOM.comisionFilter.addEventListener('change', (e) => {
		state.filterComision = e.target.value;
		state.currentPage = 1;
		fetchCourses();
	});


	// View mode (Grid / List)
	DOM.viewGrid.addEventListener('click', () => setViewMode('grid'));
	DOM.viewList.addEventListener('click', () => setViewMode('list'));

	// Pagination
	DOM.pagPrev.addEventListener('click', () => {
		if (state.currentPage > 1) {
			state.currentPage--;
			fetchCourses();
		}
	});

	DOM.pagNext.addEventListener('click', () => {
		if (state.currentPage < state.pagination.totalPages) {
			state.currentPage++;
			fetchCourses();
		}
	});

	// Modals
	DOM.btnCloseDetalle.addEventListener('click', closeDetailsModal);
	DOM.btnCerrarModal.addEventListener('click', closeDetailsModal);
	DOM.modalDetalleOverlay.addEventListener('click', (e) => {
		if (e.target === DOM.modalDetalleOverlay) closeDetailsModal();
	});

	DOM.btnNuevoCurso.addEventListener('click', openCreateModal);
	DOM.btnCloseCrear.addEventListener('click', closeCreateModal);
	DOM.btnCancelarCrear.addEventListener('click', closeCreateModal);
	DOM.modalCrearOverlay.addEventListener('click', (e) => {
		if (e.target === DOM.modalCrearOverlay) closeCreateModal();
	});

	DOM.formCrearCurso.addEventListener('submit', handleCreateCourse);

	// Empty state action buttons (#83)
	DOM.emptyBtnAction.addEventListener('click', () => {
		if (state.searchTerm || state.filterPeriodo || state.filterComision) {
			// Limpiar filtros
			DOM.searchInput.value = '';
			DOM.clearSearch.style.display = 'none';
			DOM.periodoFilter.value = '';
			DOM.comisionFilter.value = '';
			state.searchTerm = '';
			state.filterPeriodo = '';
			state.filterComision = '';
			state.currentPage = 1;
			fetchCourses();
		} else {
			fetchCourses();
		}
	});

	DOM.emptyBtnExplore.addEventListener('click', () => {
		switchView('todos');
	});
}

// ==========================================================================
// Theme Management (Dark / Light)
// ==========================================================================
function initTheme() {
	const savedTheme = localStorage.getItem('softac_theme') || 'dark';
	document.documentElement.setAttribute('data-theme', savedTheme);
	updateThemeIcon(savedTheme);
}

function toggleTheme() {
	const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
	const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
	document.documentElement.setAttribute('data-theme', newTheme);
	localStorage.setItem('softac_theme', newTheme);
	updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
	const icon = DOM.themeToggle.querySelector('i');
	if (theme === 'dark') {
		icon.className = 'fa-solid fa-moon';
	} else {
		icon.className = 'fa-solid fa-sun';
	}
}

// ==========================================================================
// View Mode & Tab Switching
// ==========================================================================
function switchView(view) {
	state.activeView = view;
	state.currentPage = 1;

	if (view === 'mis-cursos') {
		DOM.tabMisCursos.classList.add('active');
		DOM.tabTodosCursos.classList.remove('active');
		DOM.pageTitle.textContent = 'Mis Cursos Asignados';
	} else {
		DOM.tabMisCursos.classList.remove('active');
		DOM.tabTodosCursos.classList.add('active');
		DOM.pageTitle.textContent = 'Catálogo General de Cursos';
	}

	fetchCourses();
}

function setViewMode(mode) {
	state.viewMode = mode;
	if (mode === 'grid') {
		DOM.viewGrid.classList.add('active');
		DOM.viewList.classList.remove('active');
		DOM.coursesGrid.style.display = 'grid';
		DOM.coursesTableWrapper.style.display = 'none';
	} else {
		DOM.viewGrid.classList.remove('active');
		DOM.viewList.classList.add('active');
		DOM.coursesGrid.style.display = 'none';
		DOM.coursesTableWrapper.style.display = 'block';
	}
}

function updateDocenteProfileUI() {
	const docente = CONFIG.DOCENTES[state.currentDocenteId];
	DOM.userName.textContent = docente.nombre;
	DOM.userRole.textContent = docente.rol;
	DOM.userAvatar.textContent = docente.initials;
	DOM.docenteSelector.value = state.currentDocenteId;
}

// ==========================================================================
// Data Fetching (Backend API with Fallback) - #78, #79, #84
// ==========================================================================
async function fetchCourses() {
	setLoading(true);

	const docente = CONFIG.DOCENTES[state.currentDocenteId];
	const isMisCursos = state.activeView === 'mis-cursos';

	let endpoint = isMisCursos
		? `${CONFIG.API_BASE_URL}/cursos/docente/${docente.id}`
		: `${CONFIG.API_BASE_URL}/cursos`;

	const params = new URLSearchParams();
	if (state.searchTerm) params.append('search', state.searchTerm);
	if (state.filterEscuela) params.append('escuela_id', state.filterEscuela);
	if (state.currentPage) params.append('page', state.currentPage);
	if (state.limit) params.append('limit', state.limit);

	const url = `${endpoint}?${params.toString()}`;

	try {
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${docente.token}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		let courses = data.data || [];

		// Apply client-side filters if needed (period, commission, school)
		if (state.filterEscuela) {
			courses = courses.filter(c => String(c.escuela_id) === String(state.filterEscuela));
		}
		if (state.filterPeriodo) {
			courses = courses.filter(c => c.periodo === state.filterPeriodo);
		}
		if (state.filterComision) {
			courses = courses.filter(c => c.comision === state.filterComision);
		}


		state.courses = courses;
		state.pagination = data.pagination || {
			total: courses.length,
			page: state.currentPage,
			limit: state.limit,
			totalPages: Math.ceil(courses.length / state.limit) || 1
		};

		renderCourseList();
		updateStats();
		updateBadgeCount();
	} catch (error) {
		console.warn('API backend no disponible o error de red. Utilizando datos locales en memoria:', error);
		
		// Fallback data
		let courses = [...CONFIG.FALLBACK_COURSES];

		if (isMisCursos) {
			courses = courses.filter(c => c.docente_id === docente.id);
		}

		if (state.searchTerm) {
			const term = state.searchTerm.toLowerCase();
			courses = courses.filter(c =>
				c.nombre.toLowerCase().includes(term) ||
				c.codigo.toLowerCase().includes(term) ||
				(c.descripcion && c.descripcion.toLowerCase().includes(term)) ||
				c.comision.toLowerCase().includes(term) ||
				c.aula.toLowerCase().includes(term)
			);
		}

		if (state.filterPeriodo) {
			courses = courses.filter(c => c.periodo === state.filterPeriodo);
		}

		if (state.filterComision) {
			courses = courses.filter(c => c.comision === state.filterComision);
		}

		state.courses = courses;
		state.pagination = {
			total: courses.length,
			page: 1,
			limit: 10,
			totalPages: Math.ceil(courses.length / 10) || 1
		};

		renderCourseList();
		updateStats();
		updateBadgeCount();
	} finally {
		setLoading(false);
	}
}

function setLoading(loading) {
	state.isLoading = loading;
	if (loading) {
		DOM.loadingSpinner.style.display = 'flex';
		DOM.coursesGrid.style.display = 'none';
		DOM.coursesTableWrapper.style.display = 'none';
		DOM.emptyState.style.display = 'none';
		DOM.paginationBar.style.display = 'none';
	} else {
		DOM.loadingSpinner.style.display = 'none';
		if (state.viewMode === 'grid') {
			DOM.coursesGrid.style.display = state.courses.length > 0 ? 'grid' : 'none';
		} else {
			DOM.coursesTableWrapper.style.display = state.courses.length > 0 ? 'block' : 'none';
		}
	}
}

// ==========================================================================
// Rendering: Course List (#80) & Empty State (#83)
// ==========================================================================
function renderCourseList() {
	const { courses } = state;

	// Si no hay cursos, renderizar Estado Vacío (#83)
	if (courses.length === 0) {
		renderEmptyState();
		DOM.coursesGrid.style.display = 'none';
		DOM.coursesTableWrapper.style.display = 'none';
		DOM.paginationBar.style.display = 'none';
		return;
	}

	DOM.emptyState.style.display = 'none';
	if (state.viewMode === 'grid') {
		DOM.coursesGrid.style.display = 'grid';
		DOM.coursesTableWrapper.style.display = 'none';
	} else {
		DOM.coursesGrid.style.display = 'none';
		DOM.coursesTableWrapper.style.display = 'block';
	}

	// Render Grid Cards
	DOM.coursesGrid.innerHTML = courses.map(course => createCourseCardHTML(course)).join('');

	// Render Table Rows
	DOM.coursesTableBody.innerHTML = courses.map(course => createCourseRowHTML(course)).join('');

	// Attach click listeners to cards & buttons
	document.querySelectorAll('.btn-view-details').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
			openDetailsModal(id);
		});
	});

	renderPagination();
}

function createCourseCardHTML(course) {
	const docenteNombre = course.docente_nombre 
		? `${course.docente_nombre} ${course.docente_apellido || ''}`.trim()
		: (CONFIG.DOCENTES[course.docente_id]?.nombre || 'Docente Asignado');
	
	const enrolled = course.alumnos_inscritos || Math.floor(course.cupo_maximo * 0.85);
	const percent = Math.min(100, Math.round((enrolled / (course.cupo_maximo || 35)) * 100));

	return `
		<article class="course-card" data-id="${course.id}">
			<div class="card-top">
				<span class="course-code-badge">${escapeHTML(course.codigo)}</span>
				<div class="card-tags">
					<span class="comision-pill"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(course.comision || 'Comisión A')}</span>
					<span class="comision-pill"><i class="fa-solid fa-calendar"></i> ${escapeHTML(course.periodo || '2026')}</span>
				</div>
			</div>

			<h3 class="course-title">${escapeHTML(course.nombre)}</h3>
			<p class="course-desc">${escapeHTML(course.descripcion || 'Sin descripción disponible para este curso.')}</p>

			<div class="course-meta-grid">
				<div class="meta-item">
					<i class="fa-solid fa-door-open"></i>
					<span>Aula: <strong>${escapeHTML(course.aula || 'Virtual')}</strong></span>
				</div>
				<div class="meta-item">
					<i class="fa-solid fa-clock"></i>
					<span>Horario: <strong>${escapeHTML(course.horario || 'A definir')}</strong></span>
				</div>
			</div>

			<div class="capacity-wrapper">
				<div class="capacity-labels">
					<span>Capacidad Ocupada</span>
					<span><strong>${enrolled}</strong> / ${course.cupo_maximo || 35} (${percent}%)</span>
				</div>
				<div class="capacity-bar">
					<div class="capacity-progress" style="width: ${percent}%;"></div>
				</div>
			</div>

			<div class="card-footer">
				<div class="docente-badge">
					<div class="docente-avatar-sm">${escapeHTML(docenteNombre.slice(0, 2).toUpperCase())}</div>
					<span class="docente-name-text">${escapeHTML(docenteNombre)}</span>
				</div>
				<button class="btn btn-secondary card-action-btn btn-view-details" data-id="${course.id}">
					<i class="fa-regular fa-eye"></i>
					<span>Detalles</span>
				</button>
			</div>
		</article>
	`;
}

function createCourseRowHTML(course) {
	const docenteNombre = course.docente_nombre 
		? `${course.docente_nombre} ${course.docente_apellido || ''}`.trim()
		: (CONFIG.DOCENTES[course.docente_id]?.nombre || 'Docente');

	return `
		<tr>
			<td><span class="course-code-badge">${escapeHTML(course.codigo)}</span></td>
			<td><strong>${escapeHTML(course.nombre)}</strong></td>
			<td>${escapeHTML(course.comision || 'Comisión A')}</td>
			<td>${escapeHTML(course.periodo || '2026 - 1C')}</td>
			<td>${escapeHTML(course.aula || 'Virtual')}</td>
			<td>${escapeHTML(course.horario || 'A definir')}</td>
			<td>${course.cupo_maximo || 35} est.</td>
			<td>${escapeHTML(docenteNombre)}</td>
			<td>
				<button class="btn btn-secondary card-action-btn btn-view-details" data-id="${course.id}">
					<i class="fa-regular fa-eye"></i>
					<span>Ver</span>
				</button>
			</td>
		</tr>
	`;
}

// ==========================================================================
// Empty State Component (#83 HU-04)
// ==========================================================================
function renderEmptyState() {
	DOM.emptyState.style.display = 'flex';

	const hasFilters = state.searchTerm || state.filterPeriodo || state.filterComision;
	const isMisCursos = state.activeView === 'mis-cursos';

	if (hasFilters) {
		DOM.emptyIcon.className = 'fa-solid fa-filter-circle-xmark';
		DOM.emptyTitle.textContent = 'No se encontraron resultados';
		DOM.emptyDescription.textContent = `No hay ningún curso que coincida con los criterios de búsqueda "${state.searchTerm || state.filterPeriodo || state.filterComision}". Intenta modificar los términos o restablecer los filtros.`;
		DOM.emptyBtnAction.innerHTML = '<i class="fa-solid fa-xmark"></i> <span>Limpiar Filtros</span>';
		DOM.emptyBtnExplore.style.display = 'inline-flex';
	} else if (isMisCursos) {
		DOM.emptyIcon.className = 'fa-solid fa-folder-open';
		DOM.emptyTitle.textContent = 'No tienes cursos asignados actualmente';
		DOM.emptyDescription.textContent = 'No se registran asignaturas ni comisiones vinculadas a tu perfil de docente para este ciclo lectivo. Puedes explorar el catálogo institucional o solicitar la asignación de materias.';
		DOM.emptyBtnAction.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> <span>Recargar Cursos</span>';
		DOM.emptyBtnExplore.style.display = 'inline-flex';
	} else {
		DOM.emptyIcon.className = 'fa-solid fa-book-open';
		DOM.emptyTitle.textContent = 'Catálogo de cursos vacío';
		DOM.emptyDescription.textContent = 'Actualmente no hay materias registradas en la plataforma. Utiliza el botón "Nuevo Curso" para crear la primera asignatura.';
		DOM.emptyBtnAction.innerHTML = '<i class="fa-solid fa-plus"></i> <span>Crear Primer Curso</span>';
		DOM.emptyBtnExplore.style.display = 'none';
	}
}

// ==========================================================================
// Stats & Badge Counts
// ==========================================================================
function updateStats() {
	const count = state.courses.length;
	const totalCupos = state.courses.reduce((acc, c) => acc + (c.cupo_maximo || 35), 0);
	const comisiones = new Set(state.courses.map(c => c.comision)).size;

	DOM.statTotalCursos.textContent = count;
	DOM.statTotalCupos.textContent = totalCupos;
	DOM.statTotalComisiones.textContent = comisiones;
}

function updateBadgeCount() {
	const docenteId = state.currentDocenteId;
	const myCourses = CONFIG.FALLBACK_COURSES.filter(c => c.docente_id === docenteId);
	DOM.countMisCursos.textContent = state.activeView === 'mis-cursos' ? state.courses.length : myCourses.length;
}

// ==========================================================================
// Pagination Rendering
// ==========================================================================
function renderPagination() {
	const { total, page, limit, totalPages } = state.pagination;

	if (total <= limit) {
		DOM.paginationBar.style.display = 'none';
		return;
	}

	DOM.paginationBar.style.display = 'flex';
	const start = (page - 1) * limit + 1;
	const end = Math.min(page * limit, total);

	DOM.pagStart.textContent = start;
	DOM.pagEnd.textContent = end;
	DOM.pagTotal.textContent = total;

	DOM.pagPrev.disabled = page <= 1;
	DOM.pagNext.disabled = page >= totalPages;

	// Render page numbers
	let pagesHTML = '';
	for (let i = 1; i <= totalPages; i++) {
		pagesHTML += `<button class="page-num ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
	}
	DOM.paginationPages.innerHTML = pagesHTML;
}

window.goToPage = function(pageNumber) {
	state.currentPage = pageNumber;
	fetchCourses();
};

// ==========================================================================
// Course Details Modal (HU-06 #96, #97, #99, #101, #104)
// ==========================================================================
async function openDetailsModal(courseId) {
	const currentDocente = CONFIG.DOCENTES[state.currentDocenteId];
	let course = null;

	try {
		// Llamada al endpoint de detalle (HU-06 #97)
		const response = await fetch(`${CONFIG.API_BASE_URL}/cursos/${courseId}/detalle`, {
			headers: {
				'Authorization': `Bearer ${currentDocente.token}`,
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			course = await response.json();
		}
	} catch {
		// Backend no disponible
	}

	if (!course) {
		course = state.courses.find(c => c.id === courseId) ||
				CONFIG.FALLBACK_COURSES.find(c => c.id === courseId);
	}

	if (!course) {
		showToast('No se encontró la información del curso', 'error');
		return;
	}

	const docenteNombre = course.docente_nombre 
		? `${course.docente_nombre} ${course.docente_apellido || ''} (${course.docente_email || ''})`.trim()
		: (CONFIG.DOCENTES[course.docente_id]?.nombre || 'Docente Titular');

	const cupoMaximo = course.cupo_maximo || 35;
	const cantidadAlumnos = course.cantidad_alumnos !== undefined 
		? Number(course.cantidad_alumnos) 
		: (course.alumnos_inscritos || 0);
	const cuposDisponibles = course.cupos_disponibles !== undefined 
		? course.cupos_disponibles 
		: Math.max(0, cupoMaximo - cantidadAlumnos);
	const porcentajeOcupacion = course.porcentaje_ocupacion !== undefined 
		? course.porcentaje_ocupacion 
		: Math.min(100, Math.round((cantidadAlumnos / cupoMaximo) * 100));

	const escuela = course.escuela || {
		nombre: 'Escuela de Informática y Tecnología',
		codigo: 'ESC-INF',
		director: 'Dr. Roberto Gómez',
		email_contacto: 'informatica@instituto.edu.ar',
		ubicacion: 'Campus Central'
	};

	// Modal Header & Info
	DOM.modalCodigo.textContent = course.codigo;
	DOM.modalNombre.textContent = course.nombre;
	DOM.modalDocente.textContent = docenteNombre;
	DOM.modalComision.textContent = course.comision || 'Comisión A';
	DOM.modalPeriodo.textContent = course.periodo || '2026 - 1° Cuatrimestre';
	DOM.modalAula.textContent = course.aula || 'Aula Virtual';
	DOM.modalHorario.textContent = course.horario || 'Lunes y Miércoles 18:30 - 21:30';
	DOM.modalCupo.textContent = `${cantidadAlumnos} / ${cupoMaximo} Estudiantes`;
	DOM.modalDescripcion.textContent = course.descripcion || 'Sin descripción detallada del programa.';

	// HU-06 #99: Escuela Asociada
	const escuelaBadge = document.getElementById('modal-escuela-badge');
	const escuelaNombre = document.getElementById('modal-escuela-nombre');
	const escuelaDirector = document.getElementById('modal-escuela-director');
	const escuelaUbicacion = document.getElementById('modal-escuela-ubicacion');
	const escuelaContacto = document.getElementById('modal-escuela-contacto');

	if (escuelaBadge) escuelaBadge.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${escapeHTML(escuela.nombre || 'Escuela')}`;
	if (escuelaNombre) escuelaNombre.textContent = escuela.nombre || 'Escuela General';
	if (escuelaDirector) escuelaDirector.textContent = escuela.director || 'Dirección Académica';
	if (escuelaUbicacion) escuelaUbicacion.textContent = escuela.ubicacion || 'Campus Central';
	if (escuelaContacto) escuelaContacto.textContent = escuela.email_contacto || 'contacto@instituto.edu.ar';

	// HU-06 #101: Capacidad y Ocupación
	const capacidadTexto = document.getElementById('modal-capacidad-texto');
	const capacidadProgress = document.getElementById('modal-capacidad-progress');
	if (capacidadTexto) {
		capacidadTexto.innerHTML = `<strong>${cantidadAlumnos} inscriptos</strong> • ${cuposDisponibles} cupos libres (${porcentajeOcupacion}%)`;
	}
	if (capacidadProgress) {
		capacidadProgress.style.width = `${porcentajeOcupacion}%`;
	}

	// HU-06 #101 & #104: Nómina de Alumnos con Validación de Permisos
	const btnCargarAlumnos = document.getElementById('btn-cargar-alumnos');
	const containerAlumnos = document.getElementById('modal-alumnos-container');

	if (containerAlumnos) {
		containerAlumnos.style.display = 'none';
		containerAlumnos.innerHTML = '';
	}

	if (btnCargarAlumnos) {
		btnCargarAlumnos.onclick = async () => {
			if (!containerAlumnos) return;

			containerAlumnos.style.display = 'block';
			containerAlumnos.innerHTML = '<div style="display:flex;align-items:center;gap:0.5rem;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Consultando nómina de alumnos...</div>';

			try {
				const resAlumnos = await fetch(`${CONFIG.API_BASE_URL}/cursos/${courseId}/alumnos`, {
					headers: {
						'Authorization': `Bearer ${currentDocente.token}`,
						'Content-Type': 'application/json'
					}
				});

				if (resAlumnos.status === 403) {
					containerAlumnos.innerHTML = `
						<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.75rem; color: #ef4444; display: flex; align-items: center; gap: 0.75rem;">
							<i class="fa-solid fa-shield-halved" style="font-size: 1.25rem;"></i>
							<div>
								<strong>Acceso Restringido (HU-06 #104)</strong>
								<div style="font-size: 0.85rem; opacity: 0.9;">No tienes permisos para ver la nómina de alumnos. Solo el docente titular o un administrador pueden acceder a estos datos.</div>
							</div>
						</div>
					`;
					return;
				}

				if (resAlumnos.status === 401) {
					containerAlumnos.innerHTML = `
						<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.75rem; color: #ef4444;">
							<strong>No autenticado</strong>. Debe iniciar sesión con un token válido.
						</div>
					`;
					return;
				}

				if (resAlumnos.ok) {
					const dataAlumnos = await responseDataOrLocal(resAlumnos, courseId);
					renderAlumnosRoster(containerAlumnos, dataAlumnos.alumnos || [], courseId, true, course);
				} else {
					throw new Error('Error al consultar lista');
				}
			} catch {
				// Fallback de demostración local
				const esTitular = currentDocente.id === course.docente_id || currentDocente.rol.includes('Administrador');
				if (esTitular) {
					const mockAlumnos = [
						{ alumno_id: 1, nombre: 'Carlos', apellido: 'Gómez', email: 'carlos.gomez@alumnos.edu.ar', estado: 'inscripto', fecha_inscripcion: '2026-03-01' },
						{ alumno_id: 2, nombre: 'Ana', apellido: 'Martínez', email: 'ana.martinez@alumnos.edu.ar', estado: 'inscripto', fecha_inscripcion: '2026-03-02' },
						{ alumno_id: 3, nombre: 'Lucía', apellido: 'Fernández', email: 'lucia.f@alumnos.edu.ar', estado: 'inscripto', fecha_inscripcion: '2026-03-03' }
					];
					renderAlumnosRoster(containerAlumnos, mockAlumnos, courseId, esTitular, course);
				} else {
					containerAlumnos.innerHTML = `
						<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.75rem; color: #ef4444; display: flex; align-items: center; gap: 0.75rem;">
							<i class="fa-solid fa-shield-halved" style="font-size: 1.25rem;"></i>
							<div>
								<strong>Acceso Restringido (HU-06 #104)</strong>
								<div style="font-size: 0.85rem; opacity: 0.9;">No tienes permisos para ver la nómina de alumnos. Solo el docente titular o un administrador pueden acceder a estos datos.</div>
							</div>
						</div>
					`;
				}
			}
		};
	}

	DOM.btnCopiarCodigo.onclick = () => {
		navigator.clipboard.writeText(course.codigo).then(() => {
			showToast(`Código ${course.codigo} copiado al portapapeles`, 'success');
		});
	};

	DOM.modalDetalleOverlay.style.display = 'flex';
}

async function responseDataOrLocal(res, courseId) {
	try {
		return await res.json();
	} catch {
		return { alumnos: [] };
	}
}

function updateCapacidadUI(stats) {
	if (!stats) return;
	const capacidadTexto = document.getElementById('modal-capacidad-texto');
	const capacidadProgress = document.getElementById('modal-capacidad-progress');
	const modalCupo = DOM.modalCupo;

	const totalAlumnos = stats.total_alumnos || 0;
	const cupoMaximo = stats.cupo_maximo || 35;
	const cuposDisponibles = stats.cupos_disponibles !== undefined ? stats.cupos_disponibles : Math.max(0, cupoMaximo - totalAlumnos);
	const porcentajeOcupacion = stats.porcentaje_ocupacion !== undefined ? stats.porcentaje_ocupacion : Math.min(100, Math.round((totalAlumnos / cupoMaximo) * 100));

	if (capacidadTexto) {
		capacidadTexto.innerHTML = `<strong>${totalAlumnos} inscriptos</strong> • ${cuposDisponibles} cupos libres (${porcentajeOcupacion}%)`;
	}
	if (capacidadProgress) {
		capacidadProgress.style.width = `${porcentajeOcupacion}%`;
	}
	if (modalCupo) {
		modalCupo.textContent = `${totalAlumnos} / ${cupoMaximo} Estudiantes`;
	}
}

function renderAlumnosRoster(container, alumnos, courseId, puedeGestionar = false, course = {}) {
	const currentDocente = CONFIG.DOCENTES[state.selectedDocenteId] || CONFIG.DOCENTES[1];

	let headerActions = '';
	if (puedeGestionar) {
		headerActions = `
			<div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; align-items: center; background: var(--card-bg, #1e293b); padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
				<input type="number" id="input-nuevo-alumno-id" placeholder="ID Alumno (ej: 4)" style="width: 130px; padding: 0.35rem 0.5rem; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-color, #0f172a); color: var(--text-color, #fff);" min="1" />
				<button type="button" id="btn-inscribir-alumno" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
					<i class="fa-solid fa-user-plus"></i> Inscribir
				</button>
				<span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">HU-45: Actualización automática</span>
			</div>
		`;
	}

	if (!alumnos || alumnos.length === 0) {
		container.innerHTML = `
			${headerActions}
			<div id="roster-empty-msg" style="color:var(--text-muted); padding: 0.5rem; font-size: 0.9rem;">No hay alumnos inscriptos en este curso actualmente.</div>
		`;
		attachEnrollEvents(container, courseId, alumnos, course);
		return;
	}

	let rows = alumnos.map((a, idx) => `
		<tr id="row-alumno-${a.alumno_id}" style="border-bottom: 1px solid var(--border-color);">
			<td style="padding: 0.4rem 0.6rem; font-size: 0.85rem;">${idx + 1}</td>
			<td style="padding: 0.4rem 0.6rem; font-size: 0.85rem; font-weight: 500;">
				<a href="javascript:void(0)" class="link-perfil-alumno" data-alumno-id="${a.alumno_id}" style="color: var(--text-color); text-decoration: none; border-bottom: 1px dashed var(--accent-primary);" title="Consultar Perfil Académico (HU-09)">
					${escapeHTML(a.apellido || '')}, ${escapeHTML(a.nombre || '')}
				</a>
			</td>
			<td style="padding: 0.4rem 0.6rem; font-size: 0.85rem; color: var(--text-muted);">${escapeHTML(a.email || '')}</td>
			<td style="padding: 0.4rem 0.6rem; font-size: 0.85rem;"><span class="comision-pill" style="font-size: 0.75rem;">${escapeHTML(a.estado || 'inscripto')}</span></td>
			<td style="padding: 0.4rem 0.6rem; text-align: center; white-space: nowrap;">
				<button type="button" class="btn-ver-perfil-alumno" data-alumno-id="${a.alumno_id}" title="Ver Perfil y Calificaciones (HU-09)" style="background: none; border: none; color: var(--accent-primary); cursor: pointer; padding: 2px 6px; font-size: 0.9rem;">
					<i class="fa-solid fa-address-card"></i>
				</button>
				${puedeGestionar ? `
					<button type="button" class="btn-desinscribir-alumno" data-alumno-id="${a.alumno_id}" title="Eliminar alumno del curso" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px 6px; border-radius: 4px;">
						<i class="fa-solid fa-trash-can"></i>
					</button>
				` : ''}
			</td>
		</tr>
	`).join('');

	container.innerHTML = `
		${headerActions}
		<div style="max-height: 200px; overflow-y: auto;">
			<table style="width: 100%; border-collapse: collapse; text-align: left;">
				<thead>
					<tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 0.8rem;">
						<th style="padding: 0.4rem 0.6rem;">#</th>
						<th style="padding: 0.4rem 0.6rem;">Alumno</th>
						<th style="padding: 0.4rem 0.6rem;">Email</th>
						<th style="padding: 0.4rem 0.6rem;">Condición</th>
						<th style="padding: 0.4rem 0.6rem; text-align: center;">Acciones</th>
					</tr>
				</thead>
				<tbody id="roster-tbody">
					${rows}
				</tbody>
			</table>
		</div>
	`;

	attachEnrollEvents(container, courseId, alumnos, course);
}

function attachEnrollEvents(container, courseId, alumnosList, course) {
	const currentDocente = CONFIG.DOCENTES[state.selectedDocenteId] || CONFIG.DOCENTES[1];
	const btnInscribir = container.querySelector('#btn-inscribir-alumno');
	const inputAlumnoId = container.querySelector('#input-nuevo-alumno-id');

	// Eventos para ver perfil del alumno (HU-09 #140)
	container.querySelectorAll('.btn-ver-perfil-alumno, .link-perfil-alumno').forEach(btn => {
		btn.onclick = () => {
			const alumnoId = btn.getAttribute('data-alumno-id');
			openAlumnoProfileModal(alumnoId);
		};
	});

	if (btnInscribir && inputAlumnoId) {
		btnInscribir.onclick = async () => {
			const alumnoIdVal = parseInt(inputAlumnoId.value, 10);
			if (isNaN(alumnoIdVal) || alumnoIdVal <= 0) {
				showToast('Ingrese un ID de alumno válido (entero positivo)', 'error');
				return;
			}

			btnInscribir.disabled = true;
			btnInscribir.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

			try {
				const res = await fetch(`${CONFIG.API_BASE_URL}/cursos/${courseId}/alumnos`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${currentDocente.token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ alumno_id: alumnoIdVal })
				});

				const result = await res.json();
				if (res.ok) {
					showToast(result.message || 'Alumno inscripto exitosamente', 'success');
					updateCapacidadUI(result.data?.estadisticas);
					// Recargar lista de alumnos
					const resAlumnos = await fetch(`${CONFIG.API_BASE_URL}/cursos/${courseId}/alumnos`, {
						headers: { 'Authorization': `Bearer ${currentDocente.token}` }
					});
					if (resAlumnos.ok) {
						const data = await resAlumnos.json();
						renderAlumnosRoster(container, data.alumnos || [], courseId, true, course);
					}
					fetchAndRenderCourses();
				} else {
					showToast(result.message || result.error || 'Error al inscribir alumno', 'error');
				}
			} catch (err) {
				showToast('Error de conexión con el servidor', 'error');
			} finally {
				btnInscribir.disabled = false;
				btnInscribir.innerHTML = '<i class="fa-solid fa-user-plus"></i> Inscribir';
			}
		};
	}

	// Delete buttons
	const deleteBtns = container.querySelectorAll('.btn-desinscribir-alumno');
	deleteBtns.forEach(btn => {
		btn.onclick = async () => {
			const alumnoId = btn.getAttribute('data-alumno-id');
			if (!confirm(`¿Está seguro de que desea eliminar al alumno con ID ${alumnoId} del curso?`)) return;

			btn.disabled = true;
			btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

			try {
				const res = await fetch(`${CONFIG.API_BASE_URL}/cursos/${courseId}/alumnos/${alumnoId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${currentDocente.token}`
					}
				});

				const result = await res.json();
				if (res.ok) {
					showToast(result.message || 'Alumno eliminado del curso', 'success');
					updateCapacidadUI(result.data?.estadisticas);
					// Recargar lista de alumnos
					const resAlumnos = await fetch(`${CONFIG.API_BASE_URL}/cursos/${courseId}/alumnos`, {
						headers: { 'Authorization': `Bearer ${currentDocente.token}` }
					});
					if (resAlumnos.ok) {
						const data = await resAlumnos.json();
						renderAlumnosRoster(container, data.alumnos || [], courseId, true, course);
					}
					fetchAndRenderCourses();
				} else {
					showToast(result.message || result.error || 'Error al desinscribir alumno', 'error');
				}
			} catch (err) {
				showToast('Error de conexión con el servidor', 'error');
			}
		};
	});
}

// ==========================================================================
// Student Profile Modal & Handlers (HU-09 #139, #140, #145, #146, #149, #150)
// ==========================================================================
async function openAlumnoProfileModal(alumnoId) {
	const currentDocente = CONFIG.DOCENTES[state.selectedDocenteId] || CONFIG.DOCENTES[1];
	const modal = document.getElementById('modal-alumno-overlay');
	if (!modal) return;

	modal.style.display = 'flex';

	// Referencias de elementos del modal
	const elLegajo = document.getElementById('modal-alumno-legajo');
	const elNombre = document.getElementById('modal-alumno-nombre');
	const elCarrera = document.getElementById('modal-alumno-carrera');
	const elDesempeno = document.getElementById('modal-alumno-desempeno');
	const elPromedio = document.getElementById('resumen-promedio');
	const elMaterias = document.getElementById('resumen-materias');
	const elEvalRendidas = document.getElementById('resumen-eval-rendidas');
	const elTasa = document.getElementById('resumen-tasa-aprobacion');

	const containerCalificaciones = document.getElementById('alumno-calificaciones-container');
	const containerEvaluaciones = document.getElementById('alumno-evaluaciones-container');
	const containerCursos = document.getElementById('alumno-cursos-container');

	if (containerCalificaciones) containerCalificaciones.innerHTML = '<div style="padding:1rem;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando calificaciones...</div>';

	// Wiring tabs
	const tabCal = document.getElementById('tab-alumno-calificaciones');
	const tabEv = document.getElementById('tab-alumno-evaluaciones');
	const tabCur = document.getElementById('tab-alumno-cursos');
	const contentCal = document.getElementById('tab-content-calificaciones');
	const contentEv = document.getElementById('tab-content-evaluaciones');
	const contentCur = document.getElementById('tab-content-cursos');

	function activateTab(activeTab, activeContent) {
		[tabCal, tabEv, tabCur].forEach(t => {
			if (t) {
				t.style.color = 'var(--text-muted)';
				t.style.borderBottomColor = 'transparent';
			}
		});
		[contentCal, contentEv, contentCur].forEach(c => {
			if (c) c.style.display = 'none';
		});

		if (activeTab) {
			activeTab.style.color = 'var(--accent-primary)';
			activeTab.style.borderBottomColor = 'var(--accent-primary)';
		}
		if (activeContent) activeContent.style.display = 'block';
	}

	if (tabCal) tabCal.onclick = () => activateTab(tabCal, contentCal);
	if (tabEv) tabEv.onclick = () => activateTab(tabEv, contentEv);
	if (tabCur) tabCur.onclick = () => activateTab(tabCur, contentCur);

	// Close buttons
	const btnClose = document.getElementById('btn-close-alumno');
	const btnCerrar = document.getElementById('btn-cerrar-alumno-modal');
	const closeModal = () => { modal.style.display = 'none'; };
	if (btnClose) btnClose.onclick = closeModal;
	if (btnCerrar) btnCerrar.onclick = closeModal;

	try {
		// Fetch perfil completo (#140, #149)
		const resPerfil = await fetch(`${CONFIG.API_BASE_URL}/alumnos/${alumnoId}/perfil`, {
			headers: { 'Authorization': `Bearer ${currentDocente.token}` }
		});

		if (resPerfil.status === 403) {
			showToast('Acceso denegado: No tiene permisos para ver el perfil de este alumno (HU-09 #150)', 'error');
			closeModal();
			return;
		}

		if (resPerfil.ok) {
			const perfil = await resPerfil.json();
			if (elLegajo) elLegajo.textContent = perfil.legajo || `ALU-2026-${alumnoId}`;
			if (elNombre) elNombre.textContent = perfil.nombre_completo || `${perfil.nombre} ${perfil.apellido}`;
			if (elCarrera) elCarrera.textContent = perfil.carrera || 'Tecnicatura Superior en Desarrollo de Software';

			const resu = perfil.resumen_academico || {};
			if (elPromedio) elPromedio.textContent = resu.promedio_general ? resu.promedio_general.toFixed(2) : '0.00';
			if (elMaterias) elMaterias.textContent = resu.total_materias || 0;
			if (elEvalRendidas) elEvalRendidas.textContent = resu.evaluaciones_rendidas || 0;
			if (elTasa) elTasa.textContent = `${resu.tasa_aprobacion || 0}%`;

			if (elDesempeno) {
				elDesempeno.textContent = resu.desempeno || 'Regular';
				if (resu.desempeno === 'Excelente') {
					elDesempeno.style.background = 'rgba(16, 185, 129, 0.2)';
					elDesempeno.style.color = '#10b981';
				} else if (resu.desempeno === 'Muy Bueno') {
					elDesempeno.style.background = 'rgba(56, 189, 248, 0.2)';
					elDesempeno.style.color = '#38bdf8';
				} else {
					elDesempeno.style.background = 'rgba(234, 179, 8, 0.2)';
					elDesempeno.style.color = '#eab308';
				}
			}

			// Render Cursos Tab
			if (containerCursos) {
				const cursos = perfil.cursos_inscriptos || [];
				if (cursos.length === 0) {
					containerCursos.innerHTML = '<div style="color:var(--text-muted);padding:0.5rem;">No registra cursos inscriptos.</div>';
				} else {
					containerCursos.innerHTML = `
						<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
							<thead>
								<tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
									<th style="padding: 0.4rem;">Código</th>
									<th style="padding: 0.4rem;">Materia</th>
									<th style="padding: 0.4rem;">Comisión</th>
									<th style="padding: 0.4rem;">Docente</th>
									<th style="padding: 0.4rem;">Condición</th>
								</tr>
							</thead>
							<tbody>
								${cursos.map(c => `
									<tr style="border-bottom: 1px solid var(--border-color);">
										<td style="padding: 0.4rem; font-weight: 600;">${escapeHTML(c.curso_codigo || '')}</td>
										<td style="padding: 0.4rem;">${escapeHTML(c.curso_nombre || '')}</td>
										<td style="padding: 0.4rem;">${escapeHTML(c.comision || '')}</td>
										<td style="padding: 0.4rem; color: var(--text-muted);">${escapeHTML(c.docente_nombre_completo || '')}</td>
										<td style="padding: 0.4rem;"><span class="comision-pill">${escapeHTML(c.condicion_materia || 'inscripto')}</span></td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					`;
				}
			}
		}

		// Fetch Calificaciones (#145)
		const resCal = await fetch(`${CONFIG.API_BASE_URL}/alumnos/${alumnoId}/calificaciones`, {
			headers: { 'Authorization': `Bearer ${currentDocente.token}` }
		});
		if (resCal.ok && containerCalificaciones) {
			const dataCal = await resCal.json();
			const cals = dataCal.calificaciones || [];
			if (cals.length === 0) {
				containerCalificaciones.innerHTML = '<div style="color:var(--text-muted);padding:0.5rem;">No registra calificaciones en el período.</div>';
			} else {
				containerCalificaciones.innerHTML = `
					<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
						<thead>
							<tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
								<th style="padding: 0.4rem;">Materia</th>
								<th style="padding: 0.4rem;">Instancia Evaluativa</th>
								<th style="padding: 0.4rem;">Tipo</th>
								<th style="padding: 0.4rem; text-align: center;">Nota</th>
								<th style="padding: 0.4rem;">Estado</th>
							</tr>
						</thead>
						<tbody>
							${cals.map(cl => `
								<tr style="border-bottom: 1px solid var(--border-color);">
									<td style="padding: 0.4rem;"><strong>${escapeHTML(cl.curso_nombre || '')}</strong></td>
									<td style="padding: 0.4rem;">${escapeHTML(cl.evaluacion_nombre || '')}</td>
									<td style="padding: 0.4rem; text-transform: uppercase; font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(cl.evaluacion_tipo || '')}</td>
									<td style="padding: 0.4rem; text-align: center; font-weight: 700; font-size: 1rem; color: ${Number(cl.nota) >= 6 ? '#10b981' : '#ef4444'};">${cl.nota}</td>
									<td style="padding: 0.4rem;"><span class="badge ${cl.estado_calificacion === 'Aprobado' ? 'badge-success' : 'badge-danger'}" style="font-size:0.75rem;">${escapeHTML(cl.estado_calificacion || 'Aprobado')}</span></td>
								</tr>
							`).join('')}
						</tbody>
					</table>
				`;
			}
		}

		// Fetch Evaluaciones (#146)
		const resEv = await fetch(`${CONFIG.API_BASE_URL}/alumnos/${alumnoId}/evaluaciones`, {
			headers: { 'Authorization': `Bearer ${currentDocente.token}` }
		});
		if (resEv.ok && containerEvaluaciones) {
			const dataEv = await resEv.json();
			const evals = dataEv.evaluaciones || [];
			if (evals.length === 0) {
				containerEvaluaciones.innerHTML = '<div style="color:var(--text-muted);padding:0.5rem;">No hay evaluaciones asignadas.</div>';
			} else {
				containerEvaluaciones.innerHTML = `
					<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
						<thead>
							<tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
								<th style="padding: 0.4rem;">Materia</th>
								<th style="padding: 0.4rem;">Evaluación</th>
								<th style="padding: 0.4rem;">Fecha</th>
								<th style="padding: 0.4rem;">Ponderación</th>
								<th style="padding: 0.4rem;">Estado</th>
							</tr>
						</thead>
						<tbody>
							${evals.map(e => `
								<tr style="border-bottom: 1px solid var(--border-color);">
									<td style="padding: 0.4rem;">${escapeHTML(e.curso_nombre || '')}</td>
									<td style="padding: 0.4rem;"><strong>${escapeHTML(e.evaluacion_nombre || '')}</strong></td>
									<td style="padding: 0.4rem; color: var(--text-muted);">${escapeHTML(e.fecha_evaluacion || 'A definir')}</td>
									<td style="padding: 0.4rem;">${e.ponderacion}%</td>
									<td style="padding: 0.4rem;"><span class="comision-pill" style="font-size:0.75rem;">${escapeHTML(e.estado_evaluacion || 'Pendiente')}</span></td>
								</tr>
							`).join('')}
						</tbody>
					</table>
				`;
			}
		}

	} catch (err) {
		console.error('Error al cargar perfil de alumno:', err);
		// Fallback demostración
		if (elNombre) elNombre.textContent = `Alumno ID ${alumnoId}`;
		if (containerCalificaciones) containerCalificaciones.innerHTML = '<div style="padding:0.5rem;color:var(--text-muted);">Datos de muestra: Parcial 1: 8.50 (Aprobado), TP 1: 9.00 (Aprobado)</div>';
	}
}



function closeDetailsModal() {
	DOM.modalDetalleOverlay.style.display = 'none';
}


// ==========================================================================
// Create Course Modal & Handlers (HU-05 #87, #89, #92)
// ==========================================================================
function openCreateModal() {
	DOM.formCrearCurso.reset();
	const docente = CONFIG.DOCENTES[state.currentDocenteId];
	const modalDocenteEl = document.getElementById('crear-modal-docente');
	if (modalDocenteEl && docente) {
		modalDocenteEl.textContent = `${docente.nombre} (${docente.email})`;
	}
	DOM.modalCrearOverlay.style.display = 'flex';

	// Auto-uppercase on code input
	const codigoInput = document.getElementById('form-codigo');
	if (codigoInput) {
		codigoInput.oninput = (e) => {
			e.target.value = e.target.value.toUpperCase().replace(/\s+/g, '-');
		};
	}
}

function closeCreateModal() {
	DOM.modalCrearOverlay.style.display = 'none';
}

async function handleCreateCourse(e) {
	e.preventDefault();

	const formData = new FormData(DOM.formCrearCurso);
	const codigoRaw = formData.get('codigo') ? formData.get('codigo').trim().toUpperCase() : '';
	const nombreRaw = formData.get('nombre') ? formData.get('nombre').trim() : '';

	// Validaciones cliente rápidas (#93)
	if (!codigoRaw || codigoRaw.length < 2) {
		showToast('El código de curso debe contener al menos 2 caracteres', 'error');
		return;
	}
	if (!nombreRaw || nombreRaw.length < 3) {
		showToast('El nombre del curso debe contener al menos 3 caracteres', 'error');
		return;
	}

	const newCourse = {
		codigo: codigoRaw,
		nombre: nombreRaw,
		descripcion: formData.get('descripcion') ? formData.get('descripcion').trim() : '',
		escuela_id: parseInt(formData.get('escuela_id'), 10) || 1,
		comision: formData.get('comision') ? formData.get('comision').trim() : 'Comisión A',
		periodo: formData.get('periodo') ? formData.get('periodo').trim() : '2026 - 1° Cuatrimestre',
		aula: formData.get('aula') ? formData.get('aula').trim() : 'Aula Virtual',
		horario: formData.get('horario') ? formData.get('horario').trim() : 'Lunes 18:00 - 22:00',
		cupo_maximo: parseInt(formData.get('cupo_maximo'), 10) || 35,
		activo: 1
	};


	const docente = CONFIG.DOCENTES[state.currentDocenteId];

	try {
		const response = await fetch(`${CONFIG.API_BASE_URL}/cursos`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${docente.token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(newCourse)
		});

		if (response.status === 201) {
			const data = await response.json();
			showToast(`¡Curso '${newCourse.nombre}' registrado con éxito!`, 'success');
			closeCreateModal();
			fetchCourses();
			return;
		} else if (response.status === 409) {
			showToast(`El código '${newCourse.codigo}' ya existe en el sistema.`, 'error');
			return;
		} else {
			const err = await response.json();
			showToast(err.message || 'Error al guardar el curso en el servidor', 'error');
		}
	} catch (error) {
		console.warn('Backend no disponible. Guardando en memoria local:', error);
		// Local fallback addition
		const localId = Date.now();
		const createdLocally = {
			id: localId,
			...newCourse,
			docente_id: docente.id,
			docente_nombre: docente.nombre,
			docente_email: docente.email,
			alumnos_inscritos: 0
		};
		CONFIG.FALLBACK_COURSES.unshift(createdLocally);
		showToast(`Curso '${newCourse.nombre}' registrado localmente`, 'success');
		closeCreateModal();
		fetchCourses();
	}
}


// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info') {
	const toast = document.createElement('div');
	toast.className = `toast ${type}`;

	const icon = type === 'success' ? 'fa-circle-check'
		: type === 'error' ? 'fa-circle-exclamation'
		: 'fa-circle-info';

	toast.innerHTML = `
		<i class="fa-solid ${icon}"></i>
		<span>${escapeHTML(message)}</span>
	`;

	DOM.toastContainer.appendChild(toast);

	setTimeout(() => {
		toast.style.animation = 'slideIn 0.25s ease-out reverse';
		setTimeout(() => toast.remove(), 250);
	}, 3500);
}

// Utility: HTML Escaping for XSS prevention
function escapeHTML(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
