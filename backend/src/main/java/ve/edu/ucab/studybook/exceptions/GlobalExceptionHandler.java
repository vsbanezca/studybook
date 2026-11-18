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

@RestControllerAdvice
public class GlobalExceptionHandler {

	public static final String DATOS_INCORRECTOS = "Datos proporcionados incorrectos";
	public static final String SIN_PERMISO = "No tienes permiso para realizar esta accion";

	/** Cuerpo de error: mensaje y, si aplica, el detalle por campo. */
	public record ErrorResponse(String mensaje, Map<String, String> campos) {
	}

	/**
	 * Red de seguridad de Bean Validation: responde 400 con cada campo y un codigo (sin texto). Si un campo falla por
	 * varias reglas, gana "obligatorio", que es lo que el usuario debe corregir primero.
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
		return ResponseEntity.badRequest().body(new ErrorResponse(DATOS_INCORRECTOS, campos));
	}

	/** Cuerpo que no se puede leer. Si el fallo es de un campo (por ejemplo, "abc" donde va un entero) se indica el campo. */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponse> cuerpoIlegible(HttpMessageNotReadableException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		if (ex.getCause() instanceof MismatchedInputException mismatch && !mismatch.getPath().isEmpty()
				&& mismatch.getPath().get(0).getPropertyName() != null) {
			campos.put(mismatch.getPath().get(0).getPropertyName(), CodigosValidacion.FORMATO);
		}
		return ResponseEntity.badRequest().body(new ErrorResponse(DATOS_INCORRECTOS, campos));
	}

	@ExceptionHandler(ValidacionException.class)
	public ResponseEntity<ErrorResponse> validacion(ValidacionException ex) {
		if (ex.esMensajeLiteral()) {
			return ResponseEntity.badRequest()
					.body(new ErrorResponse(ex.getMessage(), Map.of(ex.getCampo(), ex.getMessage())));
		}
		if (ex.getCampo() == null) {
			return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage(), Map.of()));
		}
		return ResponseEntity.badRequest()
				.body(new ErrorResponse(DATOS_INCORRECTOS, Map.of(ex.getCampo(), ex.getMessage())));
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
