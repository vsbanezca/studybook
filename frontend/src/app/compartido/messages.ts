// app/compartido/messages.ts
// LITERAL = texto aprobado en la especificacion (no cambiar). PROPUESTA = a confirmar con cada historia.
export const MSG = {
  reserva: {
    creada:            'La reserva se ha creado exitosamente',                    // LITERAL
    datosInvalidos:    'Datos proporcionados incorrectos',                        // LITERAL
    capacidadExcedida: 'La cantidad de asistentes supera la capacidad del espacio', // LITERAL
    noDisponible:      'El espacio ya está reservado en esa fecha y horario',     // LITERAL
    sinEspacios:       'No hay espacios registrados',                             // LITERAL
    confirmar:         '¿Confirmas la reserva?',                                  // PROPUESTA
  },
  cuenta: {
    creada:            'La cuenta se ha creado exitosamente',                     // PROPUESTA
    correoRegistrado:  'Ya existe una cuenta con ese correo',                     // PROPUESTA
    correoNoUcab:      'Usa tu correo institucional de la UCAB.',                 // PROPUESTA
    clavesDistintas:   'Las contraseñas no coinciden.',                           // PROPUESTA
    confirmar:         '¿Confirmas el registro?',                                 // PROPUESTA
    credencialesMal:   'Correo o contraseña incorrectos',                        // LITERAL
    correoObligatorio: 'El correo es obligatorio',                                // PROPUESTA
    correoFormato:     'El correo debe tener formato de correo electrónico',                    // PROPUESTA
    claveObligatoria:  'La contraseña es obligatoria',                            // PROPUESTA
  },
  espacio: {
    creado:            'El espacio se ha creado exitosamente',                    // PROPUESTA
    capacidadInvalida: 'La capacidad debe ser un número entero mayor que 0', // PROPUESTA
    repetido:          'Ya existe un espacio con ese nombre en esa ubicación',    // PROPUESTA
    confirmar:         '¿Confirmas la creación del espacio?',                     // PROPUESTA
    sinPermiso:        'No tienes permiso para ver esta página',                  // PROPUESTA
  },
  equipamiento: {
    creado:            'El equipamiento se ha creado exitosamente',               // PROPUESTA
    repetido:          'Este espacio ya tiene ese equipamiento',                  // PROPUESTA
    confirmar:         '¿Confirmas el registro del equipamiento?',                // PROPUESTA
    vacio:             'Este espacio no tiene equipamiento registrado',           // PROPUESTA
  },
  comunes: {
    campoObligatorio: 'Este campo es obligatorio.', aceptar: 'Aceptar', si: 'Sí', no: 'No',
    datosInvalidos:   'Datos proporcionados incorrectos',                         // LITERAL
    errorServidor:    'No se pudo conectar con el servidor. Inténtalo de nuevo.',  // PROPUESTA
  },
} as const;
