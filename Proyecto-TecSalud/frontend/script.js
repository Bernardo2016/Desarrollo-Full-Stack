let montoSeleccionado = 500;
let tipoDonacion = 'individual';
let causaSeleccionada = "Becas con Propósito";
let logoActual = "";

const LOGOS_INSTITUCIONALES = {
    tecmilenio: "img/tecmilenio.png",
    tec: "img/tec.png",
    tecsalud: "img/tecsalud.png"
};

window.onload = () => { 
    logoActual = LOGOS_INSTITUCIONALES.tecmilenio;
    document.getElementById('p-logo').src = logoActual; 
};

function formatearTarjeta(e) {
    let val = e.target.value.replace(/\D/g, '').substring(0,16);
    e.target.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatearFecha(e) {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
    else e.target.value = val;
}

function asignarMonto(valor, btn) {
    montoSeleccionado = valor;
    document.querySelectorAll('.btn-monto').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('input-monto').value = '';
}

function montoPersonalizado() {
    const val = document.getElementById('input-monto').value;
    if (val > 0) { 
        montoSeleccionado = val; 
        document.querySelectorAll('.btn-monto').forEach(b => b.classList.remove('active')); 
    }
}

function seleccionarCausa(el, nombre, llaveLogo) {
    causaSeleccionada = nombre;
    document.querySelectorAll('.cause-option').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('p-cause').innerText = nombre;
    
    if(tipoDonacion === 'individual' || document.getElementById('corp-logo').files.length === 0) {
        logoActual = LOGOS_INSTITUCIONALES[llaveLogo];
        document.getElementById('p-logo').src = logoActual;
    }
}

function cambiarTipoDonacion(tipo) {
    tipoDonacion = tipo;
    
    document.getElementById('btn-ind').classList.remove('active');
    document.getElementById('btn-corp').classList.remove('active');
    document.getElementById('fields-individual').classList.add('d-none');
    document.getElementById('fields-masiva').classList.add('d-none');

    if(tipo === 'individual') {
        document.getElementById('btn-ind').classList.add('active');
        document.getElementById('fields-individual').classList.remove('d-none');
        sincronizarVistaPrevia();
    } else {
        document.getElementById('btn-corp').classList.add('active');
        document.getElementById('fields-masiva').classList.remove('d-none');
        document.getElementById('p-name').innerText = "NOMBRE DEL COLABORADOR/A";
    }
}

function sincronizarVistaPrevia() {
    if(tipoDonacion === 'individual') {
        const nombre = document.getElementById('reg-nombre').value;
        document.getElementById('p-name').innerText = nombre ? nombre.toUpperCase() : "NOMBRE";
    }
}

function actualizarMensaje(val) { 
    document.getElementById('p-msg').innerText = val ? `"${val}"` : ""; 
}

function cargarLogoEmpresa(event) {
    const reader = new FileReader();
    reader.onload = function() {
        logoActual = reader.result;
        document.getElementById('p-logo').src = logoActual;
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function cambiarEstilo(tipo, valor, el) {
    const cert = document.getElementById('main-cert');
    if (tipo === 'bg') {
        cert.style.setProperty('background-color', valor, 'important');
        document.querySelectorAll('.style-dot').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
    } else if (tipo === 'border') {
        cert.classList.remove('b-none', 'b-simple', 'b-double', 'b-elegant');
        cert.classList.add(valor);
    }
}

function navegarPaso(pasoDestino) {
    const pasoActual = parseInt(document.querySelector('.form-step:not(.d-none)').id.replace('step-', ''));
    if (pasoDestino > pasoActual && !validarFormulario(pasoActual)) return;
    
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('d-none'));
    document.getElementById('step-' + pasoDestino).classList.remove('d-none');
    
    document.querySelectorAll('.step').forEach((s, i) => {
        s.classList.toggle('active', i + 1 === pasoDestino);
        s.classList.toggle('completed', i + 1 < pasoDestino);
    });
}

function validarFormulario(paso) {
    if (paso === 1) {
        if(montoSeleccionado < 50) { alert("El donativo mínimo es de $50"); return false; }
        if (tipoDonacion === 'individual') {
            const email = document.getElementById('reg-email').value;
            const tel = document.getElementById('reg-tel').value;
            if (document.getElementById('reg-nombre').value.length < 2) { alert("Ingresa el nombre"); return false; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert("Email inválido"); return false; }
            if (!/^\d{10}$/.test(tel)) { alert("Teléfono debe tener 10 dígitos"); return false; }
        } else {
            if (document.getElementById('bulk-file').files.length === 0) { alert("Sube el archivo CSV"); return false; }
        }
        document.getElementById('final-monto').innerText = `$${montoSeleccionado}.00 MXN`;
    }
    if (paso === 3) {
        if (document.getElementById('fisc-rfc').value.length < 12) { alert("RFC incompleto"); return false; }
        if (document.getElementById('fisc-razon').value === "") { alert("Selecciona un Régimen"); return false; }
    }
    return true;
}

function procesarPago(event) {
    if(event) event.preventDefault();

    if(document.getElementById('pay-card').value.length < 19 || document.getElementById('pay-date').value.length < 5) {
        alert("Completa los datos de la tarjeta."); 
        return;
    }

    const datosJSON = {
        transaccion: {
            id_pago: "TXN-" + Date.now(),
            fecha: new Date().toISOString(),
            tipo: tipoDonacion,
            monto: montoSeleccionado,
            causa: causaSeleccionada
        },
        donante: {
            nombre: document.getElementById('reg-nombre')?.value || "Carga Masiva",
            email: document.getElementById('reg-email')?.value || "N/A",
            fiscales: {
                rfc: document.getElementById('fisc-rfc').value,
                regimen: document.getElementById('fisc-razon').value,
                domicilio: document.getElementById('fisc-dom').value
            }
        },
        certificado: {
            fondo: document.getElementById('main-cert').style.backgroundColor,
            borde: document.getElementById('main-cert').className,
            mensaje: document.getElementById('p-msg').innerText
        }
    };

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    enviarAPI(datosJSON).then((exito) => {
        if(exito || !exito) { // Permite probarlo aunque el backend no esté encendido
            const modalElement = document.getElementById('successModal');
            const myModal = new bootstrap.Modal(modalElement, { keyboard: false, backdrop: 'static' });
            myModal.show();
        }
    });
}

async function enviarAPI(datos) {
    try {
        const respuesta = await fetch('http://localhost:3000/api/guardar-donacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return respuesta.ok;
    } catch (error) {
        console.warn("API Backend no encendida.");
        return false;
    }
}

async function descargarPDF() {
    const btn = document.getElementById('btn-descargar');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando PDF...';
    btn.disabled = true;

    try {
        const certificadoOriginal = document.getElementById('main-cert');
        
        const clon = certificadoOriginal.cloneNode(true);
        clon.style.position = 'fixed';
        clon.style.top = '0';
        clon.style.left = '0';
        clon.style.zIndex = '-9999';
        clon.style.width = '800px'; 
        clon.style.height = '600px';
        clon.style.display = 'flex';
        clon.style.flexDirection = 'column';
        clon.style.justifyContent = 'center';
        
        document.body.appendChild(clon);

        const canvas = await html2canvas(clon, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: clon.style.backgroundColor || '#ffffff'
        });

        document.body.removeChild(clon);
        
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf; 
        const pdf = new jsPDF('l', 'mm', 'letter'); 
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        
        const marginX = 20;
        const targetWidth = pdfWidth - (marginX * 2);
        const targetHeight = targetWidth / ratio;
        const marginY = (pdfHeight - targetHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', marginX, marginY, targetWidth, targetHeight);
        pdf.save(`Certificado_${causaSeleccionada.replace(/\s+/g, '_')}.pdf`);
        
    } catch (error) {
        console.error("Error al generar PDF: ", error);
        alert("Ocurrió un error al generar el PDF.");
    } finally {
        btn.innerHTML = `<i class="bi bi-file-earmark-pdf me-2"></i>Descargar tu Certificado`;
        btn.disabled = false;
    }
}