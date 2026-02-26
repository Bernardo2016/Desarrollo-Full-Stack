/**
 * Clase que representa una Tarea individual
 */
class Tarea {
  constructor(id, nombre, completa = false) {
    this.id = id;
    this.nombre = nombre;
    this.completa = completa;
  }

  // Método para alternar el estado de la tarea
  alternarEstado() {
    this.completa = !this.completa;
  }

  // Método para editar el texto
  editar(nuevoNombre) {
    this.nombre = nuevoNombre;
  }
}

/**
 * Clase que gestiona el conjunto de tareas y la interfaz (DOM)
 */
class GestorDeTareas {
  constructor() {
    // 1. Cargar datos de LocalStorage al iniciar
    const tareasGuardadas = JSON.parse(localStorage.getItem('tareas-poo')) || [];
    
    // Convertimos los objetos planos del JSON a instancias de la clase Tarea
    this.tareas = tareasGuardadas.map(t => new Tarea(t.id, t.nombre, t.completa));

    // 2. Referencias a elementos del DOM
    this.ulElement = document.getElementById('lista-tareas');
    this.inputElement = document.getElementById('nueva-tarea');
    this.btnAgregar = document.getElementById('agregar-tarea');

    // 3. Escuchar eventos
    this.btnAgregar.addEventListener('click', () => this.agregarTarea());
    
    // Permitir agregar tarea al presionar "Enter"
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.agregarTarea();
    });

    // 4. Renderizar al cargar
    this.render();
  }

  agregarTarea() {
    const nombre = this.inputElement.value.trim();

    // Validación de entrada vacía
    if (!nombre) {
      alert("La tarea no puede estar vacía");
      return;
    }

    // Crear nueva instancia de Tarea con ID único (timestamp)
    const nuevaTarea = new Tarea(Date.now(), nombre);
    
    this.tareas.push(nuevaTarea);
    this.inputElement.value = ''; // Limpiar input
    this.guardarYActualizar();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter(t => t.id !== id);
    this.guardarYActualizar();
  }

  editarTarea(id) {
    const tarea = this.tareas.find(t => t.id === id);
    const nuevoNombre = prompt("Editar tarea:", tarea.nombre);

    if (nuevoNombre !== null && nuevoNombre.trim() !== "") {
      tarea.editar(nuevoNombre.trim());
      this.guardarYActualizar();
    }
  }

  toggleTarea(id) {
    const tarea = this.tareas.find(t => t.id === id);
    if (tarea) {
      tarea.alternarEstado();
      this.guardarYActualizar();
    }
  }

  guardarYActualizar() {
    // Guardar en LocalStorage
    localStorage.setItem('tareas-poo', JSON.stringify(this.tareas));
    // Refrescar la vista
    this.render();
  }

  render() {
    // Limpiar lista actual
    this.ulElement.innerHTML = '';

    // Generar HTML dinámicamente
    this.tareas.forEach(tarea => {
      const li = document.createElement('li');
      
      // Aplicar estilos dinámicos si está completa
      const estiloTexto = tarea.completa 
        ? 'text-decoration: line-through; opacity: 0.5;' 
        : 'text-decoration: none; opacity: 1;';

      li.innerHTML = `
        <span style="cursor: pointer; ${estiloTexto}" onclick="gestor.toggleTarea(${tarea.id})">
          ${tarea.nombre}
        </span>
        <div class="acciones">
          <button class="edit" onclick="gestor.editarTarea(${tarea.id})">Editar</button>
          <button class="delete" onclick="gestor.eliminarTarea(${tarea.id})">Eliminar</button>
        </div>
      `;
      
      this.ulElement.appendChild(li);
    });
  }
}

// Inicializar la aplicación
const gestor = new GestorDeTareas();