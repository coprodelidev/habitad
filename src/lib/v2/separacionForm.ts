import type { ModalidadPago, Moneda, Propiedad, TipoSeparacion } from './types';

export function crearFormularioSeparacion(propiedad: Propiedad) {
  return {
    nombres: '', segundo_nombre: '', apellido_paterno: '', apellido_materno: '',
    dni: '', telefono: '', email: '',
    moneda: propiedad.moneda as Moneda,
    tipo_separacion: (propiedad.tipo === 'casa' ? 'casa' : 'terreno_sin_interes') as TipoSeparacion,
    modalidad_pago: (propiedad.tipo === 'casa' ? 'bono_mivivienda' : 'cuotas_sin_interes') as ModalidadPago,
    monto_inicial_objetivo: '',
    // Domicilio actual del cliente: nunca se inicializa con la ubicación reservada.
    tipo_via: '', tipo_zona: '', zona_nombre: '', direccion_mz: '', direccion_lt: '',
    numero_puerta: '', interior: '', referencia: '', urbanizacion: '', ubigeo_cod: '',
  };
}

export function datosClienteSeparacion(form: ReturnType<typeof crearFormularioSeparacion>) {
  return {
    nombres: [form.nombres.trim(), form.segundo_nombre.trim()].filter(Boolean).join(' '),
    apellidos: [form.apellido_paterno.trim(), form.apellido_materno.trim()].filter(Boolean).join(' '),
    dni: form.dni.trim(), telefono: form.telefono.trim() || null, email: form.email.trim() || null,
    segundo_nombre: form.segundo_nombre.trim() || null,
    apellido_paterno: form.apellido_paterno.trim() || null,
    apellido_materno: form.apellido_materno.trim() || null,
    tipo_via: form.tipo_via || null, tipo_zona: form.tipo_zona || null,
    zona_nombre: form.zona_nombre.trim() || null,
    direccion_mz: form.direccion_mz.trim() || null,
    direccion_lt: form.direccion_lt.trim() || null,
    numero_puerta: form.numero_puerta.trim() || null, interior: form.interior.trim() || null,
    referencia: form.referencia.trim() || null, urbanizacion: form.urbanizacion.trim() || null,
    ubigeo_cod: form.ubigeo_cod || null,
  };
}
