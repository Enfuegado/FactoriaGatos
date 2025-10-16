// claves y almacenamiento local
const CLAVE_CATFACTS = 'catfacts-vue';

// almacén reactivo
const almacen = Vue.reactive({
  facts: [], // guardados
});

function cargarDesdeLocalStorage() {
  try {
    const raw = localStorage.getItem(CLAVE_CATFACTS);
    almacen.facts = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error cargando localStorage', e);
    almacen.facts = [];
  }
}

function guardarEnLocalStorage() {
  try {
    localStorage.setItem(CLAVE_CATFACTS, JSON.stringify(almacen.facts));
  } catch (e) {
    console.error('Error guardando localStorage', e);
  }
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}


/* Componente para obtener un dato desde la API pública */
const FetchFact = {
  template: `
    <div class="tarjeta cat-display">
      <!-- Header: título + botón -->
      <div class="fetch-header">
        <div class="fetch-title">
          <h3 style="margin:0 0 6px">Obtener dato</h3>
        </div>


        <div class="obtener-btn">
          <button class="boton" @click="obtener" :disabled="loading">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            <span v-else>Obtener</span>
          </button>
        </div>
      </div>

      <div v-if="error" style="margin-top:12px;color:#ffb3b3;font-weight:600">{{ error }}</div>

      <div v-if="fact" style="margin-top:14px">
        <div class="cat-fact">“{{ fact.fact }}”</div>
        <div class="cat-meta">{{ fact.length ? fact.length + ' caracteres' : '' }}</div>

        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="boton" @click="guardar" :disabled="saving">Guardar</button>
          <button class="boton fantasma" @click="descartar">Descartar</button>
        </div>

        <div v-if="mensaje" class="small-note" style="margin-top:10px">{{ mensaje }}</div>
      </div>
    </div>
  `,
  data() { return { fact: null, loading: false, error: '', saving: false, mensaje: '' }; },
  methods: {
    async obtener() {
      this.error = ''; this.fact = null; this.mensaje = '';
      this.loading = true;
      try {
        const res = await fetch('https://catfact.ninja/fact');
        if (!res.ok) throw new Error('Error al obtener dato (' + res.status + ')');
        const data = await res.json();
        this.fact = data;
      } catch (e) {
        console.error(e);
        this.error = 'No se pudo obtener el dato.';
      } finally {
        this.loading = false;
      }
    },
    guardar() {
      if (!this.fact) return;
      this.saving = true;
      try {
        const existe = almacen.facts.some(f => f.fact === this.fact.fact);
        if (existe) {
          this.mensaje = 'Ya existe.';
        } else {
          const item = {
            id: generarId(),
            fact: this.fact.fact,
            length: this.fact.length || null,
            createdAt: new Date().toISOString()
          };
          almacen.facts.unshift(item);
          guardarEnLocalStorage();
          this.mensaje = 'Guardado';
          this.fact = null;
        }
      } catch (e) {
        console.error(e);
        this.mensaje = 'Error guardando.';
      } finally {
        this.saving = false;
      }
    },
    descartar() {
      this.fact = null;
      this.mensaje = '';
    }
  }
};

/* Lista de guardados */
const SavedList = {
  template: `
    <div class="tarjeta">
      <h3 style="margin-top:0">Guardados</h3>

      <div v-if="facts.length === 0" class="pequeno" style="margin-top:8px">No hay datos guardados.</div>

      <div class="saved-list" v-else>
        <div v-for="f in facts" :key="f.id" class="saved-fact">
          <div>
            <p>{{ f.fact }}</p>
            <div class="saved-date">{{ formatearFecha(f.createdAt) }}{{ f.length ? ' · ' + f.length + ' caracteres' : '' }}</div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
            <template v-if="toConfirm !== f.id">
              <button class="boton" @click="iniciarConfirm(f.id)">Eliminar</button>
            </template>

            <template v-else>
              <div style="display:flex;gap:8px;align-items:center">
                <span class="texto-confirmacion">¿Eliminar?</span>
                <button class="boton peligro" @click="confirmarEliminar(f.id)">Sí</button>
                <button class="boton fantasma" @click="cancelarConfirm">No</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  `,
  data() { return { toConfirm: null }; },
  computed: {
    facts() { return almacen.facts; }
  },
  methods: {
    iniciarConfirm(id) { this.toConfirm = id; },
    cancelarConfirm() { this.toConfirm = null; },
    confirmarEliminar(id) {
      almacen.facts = almacen.facts.filter(x => x.id !== id);
      guardarEnLocalStorage();
      this.toConfirm = null;
    },
    formatearFecha(iso) {
      try {
        const d = new Date(iso);
        return d.toLocaleString();
      } catch { return iso; }
    }
  }
};

/* --- MONTAR APP --- */
cargarDesdeLocalStorage();

const App = {
  template: `
    <div class="contenedor">
      <!-- título principal -->
      <div style="margin-bottom:14px">
        <h1>Factoría de gatos</h1>
      </div>

      <!-- sección de info  -->
      <div class="tarjeta" style="margin-bottom:14px">
        <p class="pequeno-mute" style="margin:0">Guarda o descarta datos curiosos sobre gatos.</p>
      </div>

      <!-- obtener dato  -->
      <div style="margin-bottom:14px">
        <FetchFact />
      </div>

      <!-- lista guardada  -->
      <div>
        <SavedList />
      </div>
    </div>
  `,
  components: { FetchFact, SavedList }
};

Vue.createApp(App).mount('#app');
