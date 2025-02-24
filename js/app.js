// app.js

/**
 * Clase que representa un proyecto individual
 * Maneja la información y el formato de presentación de cada proyecto
 */
class Project {
    /**
     * @param {number} id - Identificador único del proyecto
     * @param {string} nombre - Nombre del proyecto
     * @param {string} estado - Estado actual del proyecto (en-progreso, completados, pausados)
     * @param {string} fechaActualizacion - Fecha de última actualización
     * @param {Array<string>} tecnologias - Array de tecnologías utilizadas
     * @param {string} descripcion - Descripción detallada del proyecto
     */
    constructor(id, nombre, estado, fechaActualizacion, tecnologias, descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.estado = estado;
        this.fechaActualizacion = fechaActualizacion;
        this.tecnologias = tecnologias;
        this.descripcion = descripcion;
    }

    /**
     * Formatea la fecha de actualización al formato local español
     * @returns {string} Fecha formateada (ejemplo: "20 de febrero de 2025")
     */
    formatDate() {
        return new Date(this.fechaActualizacion).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Obtiene la clase CSS correspondiente al estado del proyecto
     * @returns {string} Nombre de la clase CSS
     */
    getStatusClass() {
        const statusClasses = {
            'en-progreso': 'status-progress',
            'completados': 'status-completed',
            'pausados': 'status-paused'
        };
        return statusClasses[this.estado];
    }

    /**
     * Obtiene el texto formateado del estado del proyecto
     * @returns {string} Texto del estado en español
     */
    getStatusText() {
        const statusTexts = {
            'en-progreso': 'En Progreso',
            'completados': 'Completado',
            'pausados': 'Pausado'
        };
        return statusTexts[this.estado];
    }
}

/**
 * Clase principal que gestiona el dashboard
 * Maneja la carga de datos, filtros y visualización de proyectos
 */
class DashboardManager {
    constructor() {
        // Inicializa el array de proyectos
        this.projects = [];
        // Recupera el filtro guardado en localStorage o usa 'todos' por defecto
        this.currentFilter = localStorage.getItem('currentFilter') || 'todos';
        this.init();
    }

    /**
     * Inicializa el dashboard
     * Carga los datos y configura los eventos
     */
    async init() {
        await this.loadProjectsData();
        this.setupEventListeners();
        this.loadProjects();
        this.setActiveFilter();
    }

    /**
     * Carga los datos de los proyectos desde el archivo JSON
     * Crea instancias de Project para cada proyecto
     */
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

    /**
     * Configura los event listeners para los botones de filtro
     */
    setupEventListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                this.handleFilterChange(filter);
            });
        });
    }

    /**
     * Maneja el cambio de filtro
     * @param {string} filter - Filtro seleccionado
     */
    handleFilterChange(filter) {
        this.currentFilter = filter;
        localStorage.setItem('currentFilter', filter);
        this.setActiveFilter();
        this.loadProjects();
    }

    /**
     * Actualiza la clase active en los botones de filtro
     */
    setActiveFilter() {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === this.currentFilter);
        });
    }

    /**
     * Carga y muestra los proyectos en el grid
     * Aplica los filtros actuales
     */
    loadProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        const filteredProjects = this.filterProjects();
        
        projectsGrid.innerHTML = filteredProjects
            .map(project => this.createProjectCard(project))
            .join('');

        // Agrega event listeners a las tarjetas de proyecto
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = parseInt(card.dataset.id);
                const project = this.projects.find(p => p.id === projectId);
                this.showProjectDetails(project);
            });
        });
    }

    /**
     * Filtra los proyectos según el filtro actual
     * @returns {Array<Project>} Array de proyectos filtrados
     */
    filterProjects() {
        if (this.currentFilter === 'todos') {
            return this.projects;
        }
        return this.projects.filter(project => project.estado === this.currentFilter);
    }

    /**
     * Crea el HTML para una tarjeta de proyecto
     * @param {Project} project - Instancia de Project
     * @returns {string} HTML de la tarjeta
     */
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

    /**
     * Muestra los detalles de un proyecto en una alerta
     * @param {Project} project - Instancia de Project
     */
    showProjectDetails(project) {
        const message = `
            Proyecto: ${project.nombre}
            Estado: ${project.estado}
            Fecha de actualización: ${project.formatDate()}
            Tecnologías: ${project.tecnologias.join(', ')}
            Descripción: ${project.descripcion}
        `;
        alert(message);
    }
}

// Inicializa el dashboard cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});