// app/compartido/messages.ts
// LITERAL = texto aprobado en la especificacion (no cambiar). PROPUESTA = a confirmar con cada historia.
export const MSG = {
  reserva: {
    creada:            'La reserva se ha creado exitosamente',                    // LITERAL
    datosInvalidos:    'Datos proporcionados incorrectos',                        // LITERAL
    capacidadExcedida: 'La cantidad de asistentes supera la capacidad del espacio', // LITERAL
    noDisponible:      'El espacio ya está reservado en esa fecha y horario',     // LITERAL
    sinEspacios:       'No hay espacios registrados',                             // LITERAL
    sinReservasTitulo: 'Aún no tienes reservas',                                  // PROPUESTA
    sinReservasTexto:  'Cuando reserves un espacio, aparecerá aquí.',             // PROPUESTA
    confirmar:         '¿Confirmas la reserva?',                                  // PROPUESTA
    espacioObligatorio: 'Selecciona un espacio',                                  // PROPUESTA
    fechaPasada:       'La fecha no puede estar en el pasado',                    // PROPUESTA
    horaInicioPasada:  'La hora de inicio no puede ser anterior a la hora actual',  // PROPUESTA (la valida solo el servidor)
    finNoPosterior:    'La hora de fin debe ser posterior a la hora de inicio',   // PROPUESTA
    asistentesInvalidos: 'Los asistentes deben ser un número entero mayor o igual a 1', // PROPUESTA
  },
  cuenta: {
    creada:            'La cuenta se ha creado exitosamente',                     // PROPUESTA
    correoRegistrado:  'Ya existe una cuenta con ese correo',                     // PROPUESTA
    cedulaRegistrada:  'Ya existe una cuenta con esa cédula',                     // PROPUESTA
    confirmar:         '¿Confirmas el registro?',                                 // PROPUESTA
    credencialesMal:   'Correo o contraseña incorrectos',                        // LITERAL
    correoObligatorio: 'El correo es obligatorio',                                // PROPUESTA
    correoFormato:     'El correo debe tener formato de correo electrónico',                    // PROPUESTA
    claveObligatoria:  'La contraseña es obligatoria',                            // PROPUESTA
    nombreObligatorio: 'El nombre es obligatorio',                                // PROPUESTA
    cedulaObligatoria: 'La cédula es obligatoria',                                // PROPUESTA
    cedulaFormato:     'La cédula debe tener solo números',                       // PROPUESTA
    telefonoObligatorio: 'El teléfono es obligatorio',                            // PROPUESTA
    telefonoFormato:   'El teléfono debe tener de 10 a 15 dígitos, con + opcional al inicio', // PROPUESTA
    claveCorta:        'La contraseña debe tener al menos 8 caracteres',          // PROPUESTA
    claveLarga:        'La contraseña debe tener como máximo 72 caracteres',      // PROPUESTA
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
    repetido:          'Ya existe ese equipamiento en este espacio',              // SUPOSICION (propuesto, a confirmar)
    cantidadInvalida:  'La cantidad debe ser un número entero mayor o igual a 1', // PROPUESTA
    confirmar:         '¿Confirmas el registro del equipamiento?',                // PROPUESTA
    vacio:             'Este espacio no tiene equipamiento registrado',           // PROPUESTA
    vacioAdmin:        'Agrega el primer equipamiento para este espacio.',        // PROPUESTA
    vacioMiembro:      'Cuando el administrador agregue equipamiento, aparecerá aquí.', // PROPUESTA
    espacioNoExiste:   'El espacio indicado no existe',                           // PROPUESTA
  },
  comunes: {
    campoObligatorio: 'Este campo es obligatorio.', aceptar: 'Aceptar', si: 'Sí', no: 'No',
    datosInvalidos:   'Datos proporcionados incorrectos',                         // LITERAL
    errorServidor:    'No se pudo conectar con el servidor. Inténtalo de nuevo.',  // PROPUESTA
    errorCarga:       'No se pudo cargar la información. Inténtalo de nuevo.',     // PROPUESTA
  },
} as const;
