// app.js

class Project {
    constructor(id, nombre, estado, fechaActualizacion, tecnologias, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.estado = estado;
        this.fechaActualizacion = fechaActualizacion;
        this.tecnologias = tecnologias;
        this.descripcion = descripcion;
    }

    formatDate() {
        return new Date(this.fechaActualizacion).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getStatusClass() {
        const statusClasses = {
            'en-progreso': 'status-progress',
            'completados': 'status-completed',
            'pausados': 'status-paused'
        };
        return statusClasses[this.estado];
    }

    getStatusText() {
        const statusTexts = {
            'en-progreso': 'En Progreso',
            'completados': 'Completado',
            'pausados': 'Pausado'
        };
        return statusTexts[this.estado];
    }
}

class DashboardManager {
    constructor() {
        this.projects = [];
        this.currentFilter = localStorage.getItem('currentFilter') || 'todos';
        this.currentPage = 1;
        this.projectsPerPage = 10;
        this.init();
    }

    async init() {
        await this.loadProjectsData();
        this.setupEventListeners();
        this.loadProjects();
        this.setActiveFilter();
    }

    async loadProjectsData() {
        try {
            const response = await fetch('projects.json');
            const projectsData = await response.json();
            this.projects = projectsData.map(project => new Project(
                project.id,
                project.nombre,
                project.estado,
                project.fechaActualizacion,
                project.tecnologias,
                project.descripcion
            ));
        } catch (error) {
            console.error('Error al cargar los datos de los proyectos:', error);
        }
    }

    setupEventListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                this.handleFilterChange(filter);
            });
        });

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            this.loadProjects();
        });

        const sortSelect = document.getElementById('sortSelect');
        sortSelect.addEventListener('change', () => {
            this.loadProjects();
        });
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        localStorage.setItem('currentFilter', filter);
        this.setActiveFilter();
        this.currentPage = 1;
        this.loadProjects();
    }

    setActiveFilter() {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === this.currentFilter);
        });
    }

    loadProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        const filteredProjects = this.filterProjects();
        const searchedProjects = this.searchProjects(filteredProjects);
        const sortedProjects = this.sortProjects(searchedProjects);
        const paginatedProjects = this.paginateProjects(sortedProjects);

        projectsGrid.innerHTML = paginatedProjects
            .map(project => this.createProjectCard(project))
            .join('');

        this.setupPagination(sortedProjects.length);
        this.setupProjectCardClickEvents();
    }

    filterProjects() {
        if (this.currentFilter === 'todos') {
            return this.projects;
        }
        return this.projects.filter(project => project.estado === this.currentFilter);
    }

    searchProjects(projects) {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        return projects.filter(project => project.nombre.toLowerCase().includes(searchInput));
    }

    sortProjects(projects) {
        const sortSelect = document.getElementById('sortSelect').value;
        return projects.sort((a, b) => {
            if (sortSelect === 'fechaActualizacion') {
                return new Date(b.fechaActualizacion) - new Date(a.fechaActualizacion);
            } else if (sortSelect === 'nombre') {
                return a.nombre.localeCompare(b.nombre);
            } else if (sortSelect === 'estado') {
                return a.estado.localeCompare(b.estado);
            }
        });
    }

    paginateProjects(projects) {
        const startIndex = (this.currentPage - 1) * this.projectsPerPage;
        const endIndex = startIndex + this.projectsPerPage;
        return projects.slice(startIndex, endIndex);
    }

    setupPagination(totalProjects) {
        const paginationContainer = document.getElementById('pagination');
        const totalPages = Math.ceil(totalProjects / this.projectsPerPage);

        paginationContainer.innerHTML = `
            <button class="pagination__button" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">Anterior</button>
            ${Array.from({ length: totalPages }, (_, i) => `
                <button class="pagination__button ${this.currentPage === i + 1 ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
            `).join('')}
            <button class="pagination__button" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">Siguiente</button>
        `;

        paginationContainer.querySelectorAll('.pagination__button').forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.dataset.page);
                if (!isNaN(page)) {
                    this.currentPage = page;
                    this.loadProjects();
                }
            });
        });
    }

    setupProjectCardClickEvents() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = parseInt(card.dataset.id);
                const project = this.projects.find(p => p.id === projectId);
                this.showProjectDetails(project);
            });
        });
    }

    createProjectCard(project) {
        return `
            <article class="project-card" data-id="${project.id}">
                <div class="project-card__header">
                    <h3 class="project-card__title">${project.nombre}</h3>
                    <span class="project-card__status ${project.getStatusClass()}">
                        ${project.getStatusText()}
                    </span>
                </div>
                <p>Última actualización: ${project.formatDate()}</p>
                <div class="project-card__tech">
                    ${project.tecnologias.map(tech => `
                        <span class="tech-tag">${tech}</span>
                    `).join('')}
                </div>
            </article>
        `;
    }

    showProjectDetails(project) {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>${project.nombre}</h2>
                <p><strong>Estado:</strong> ${project.getStatusText()}</p>
                <p><strong>Fecha de actualización:</strong> ${project.formatDate()}</p>
                <p><strong>Tecnologías:</strong> ${project.tecnologias.join(', ')}</p>
                <p><strong>Descripción:</strong> ${project.descripcion}</p>
            </div>
        `;
        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});