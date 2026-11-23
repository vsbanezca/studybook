package ve.edu.ucab.studybook.exceptions;

import java.util.LinkedHashMap;
import java.util.Map;

import tools.jackson.databind.exc.MismatchedInputException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Convierte cada excepcion en una respuesta HTTP con un cuerpo ErrorResponse. El cuerpo solo lleva codigos de
 * CodigosValidacion: "mensaje" es el codigo general y "campos" el codigo de cada campo. Los textos para el usuario
 * los pone el frontend.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	/** Cuerpo de error: codigo general y, si aplica, el codigo de cada campo. */
	public record ErrorResponse(String mensaje, Map<String, String> campos) {
	}

	/**
	 * Red de seguridad de Bean Validation: responde 400 con cada campo y un codigo. Si un campo falla por varias
	 * reglas, gana "obligatorio", que es lo que el usuario debe corregir primero.
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors().forEach(e -> {
			String actual = campos.get(e.getField());
			if (actual == null || CodigosValidacion.OBLIGATORIO.equals(e.getDefaultMessage())) {
				campos.put(e.getField(), e.getDefaultMessage());
			}
		});
		return ResponseEntity.badRequest().body(new ErrorResponse(CodigosValidacion.DATOS_INVALIDOS, campos));
	}

	/** Cuerpo que no se puede leer. Si el fallo es de un campo (por ejemplo, "abc" donde va un entero) se indica el campo. */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponse> cuerpoIlegible(HttpMessageNotReadableException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		if (ex.getCause() instanceof MismatchedInputException mismatch && !mismatch.getPath().isEmpty()
				&& mismatch.getPath().get(0).getPropertyName() != null) {
			campos.put(mismatch.getPath().get(0).getPropertyName(), CodigosValidacion.FORMATO);
		}
		return ResponseEntity.badRequest().body(new ErrorResponse(CodigosValidacion.DATOS_INVALIDOS, campos));
	}

	/**
	 * Un parametro de la URL con un tipo que no corresponde (por ejemplo, espacioId=abc donde va un numero): 400 con
	 * el nombre del parametro y el codigo "formato", igual que un campo del cuerpo.
	 */
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErrorResponse> parametroConTipoInvalido(MethodArgumentTypeMismatchException ex) {
		return ResponseEntity.badRequest().body(new ErrorResponse(CodigosValidacion.DATOS_INVALIDOS,
				Map.of(ex.getName(), CodigosValidacion.FORMATO)));
	}

	/**
	 * Regla de formato o de negocio. Si es de negocio, su codigo tambien va como "mensaje" (el frontend lo usa como
	 * titulo); si no, el "mensaje" es "datos_invalidos".
	 */
	@ExceptionHandler(ValidacionException.class)
	public ResponseEntity<ErrorResponse> validacion(ValidacionException ex) {
		String mensaje = ex.esDeRegla() ? ex.getCodigo() : CodigosValidacion.DATOS_INVALIDOS;
		Map<String, String> campos = ex.getCampo() == null ? Map.of() : Map.of(ex.getCampo(), ex.getCodigo());
		return ResponseEntity.badRequest().body(new ErrorResponse(mensaje, campos));
	}

	@ExceptionHandler(ConflictoException.class)
	public ResponseEntity<ErrorResponse> conflicto(ConflictoException ex) {
		Map<String, String> campos = ex.getCampo() == null ? Map.of() : Map.of(ex.getCampo(), ex.getMessage());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage(), campos));
	}

	@ExceptionHandler(NoAutorizadoException.class)
	public ResponseEntity<ErrorResponse> noAutorizado(NoAutorizadoException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(ex.getMessage(), Map.of()));
	}

	@ExceptionHandler(NoEncontradoException.class)
	public ResponseEntity<ErrorResponse> noEncontrado(NoEncontradoException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage(), Map.of()));
	}

	@ExceptionHandler(AccesoProhibidoException.class)
	public ResponseEntity<ErrorResponse> prohibido(AccesoProhibidoException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(ex.getMessage(), Map.of()));
	}
}
