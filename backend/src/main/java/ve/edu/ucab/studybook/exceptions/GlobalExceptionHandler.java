package ve.edu.ucab.studybook.exceptions;

import java.util.LinkedHashMap;
import java.util.Map;

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

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors()
				.forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
		return ResponseEntity.badRequest().body(new ErrorResponse(DATOS_INCORRECTOS, campos));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponse> cuerpoIlegible(HttpMessageNotReadableException ex) {
		return ResponseEntity.badRequest().body(new ErrorResponse(DATOS_INCORRECTOS, Map.of()));
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
